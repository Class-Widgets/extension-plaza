// app/api/plugins/[pluginId]/publish/route.ts
//
// 代理 Supabase Edge Function `publish-plugin`，避免调用方使用长链接：
//   https://<project>.supabase.co/functions/v1/publish-plugin
//
// 调用方式：
//   POST /api/plugins/{pluginId}/publish
//   Header: X-CWPT-Token: cwpt_xxx
//   Body:   JSON，包含需要更新的 manifest 字段（name/version/api_version/repo_url 等）
//
// 路径中的 pluginId 会作为 X-CWPT-Plugin-Id 头转发给 Edge Function，
// 调用方无需再单独传该头；body 中若无 id 字段，Edge Function 会回退使用该头。
import { NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

const PUBLISH_ENDPOINT = SUPABASE_URL
  ? `${SUPABASE_URL}/functions/v1/publish-plugin`
  : '';

export async function POST(req: Request, ctx: { params: Promise<{ pluginId: string }> }) {
  // 未配置 Supabase URL 时直接返回服务端错误，避免运行时才发现
  if (!PUBLISH_ENDPOINT) {
    return NextResponse.json(
      { ok: false, error: 'Server is missing NEXT_PUBLIC_SUPABASE_URL configuration' },
      { status: 500 }
    );
  }

  try {
    const { pluginId } = await ctx.params;

    // 令牌必须由调用方提供，这里不做任何持久化或解密
    const token = req.headers.get('X-CWPT-Token');
    if (!token || !token.trim()) {
      return NextResponse.json(
        { ok: false, error: 'Missing X-CWPT-Token header' },
        { status: 401 }
      );
    }

    // 透传 body；保留原始 JSON（可能为空对象）
    const body = await req.json().catch(() => ({}));

    // 转发到 Edge Function：
    //  - X-CWPT-Token：调用方令牌
    //  - X-CWPT-Plugin-Id：来自路径参数，保证发布目标与路径一致
    const upstream = await fetch(PUBLISH_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CWPT-Token': token.trim(),
        'X-CWPT-Plugin-Id': pluginId,
      },
      body: JSON.stringify(body),
    });

    // 透传上游返回的 JSON 与状态码（Edge Function 已使用 ok/error 结构）
    const contentType = upstream.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await upstream.json().catch(() => ({}));
      return NextResponse.json(data, { status: upstream.status });
    }

    // 非 JSON 响应（极少见），包装为统一错误结构
    const text = await upstream.text().catch(() => '');
    return NextResponse.json(
      { ok: false, error: text || `upstream returned status ${upstream.status}` },
      { status: upstream.status }
    );
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

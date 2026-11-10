import { NextResponse, type NextRequest } from 'next/server';
import { consume } from '@/lib/rateLimit';

/**
 * 全站 API 限流。
 *
 * - 静态资源（图标 / README / manifest / release）不算在内，避免误伤图片批量加载。
 * - 读接口配额宽松（大部分已被 CDN 缓存，源站压力小）。
 * - search / suggest 查询成本高且不可缓存，配额更严。
 * - 写接口（评论 / 评分）配额最严。
 *
 * 真实 IP 解析优先级针对腾讯云 EdgeOne 优化：
 * EO-Connecting-IP 由边缘注入、客户端无法伪造，必须优先于 X-Forwarded-For
 * （XFF 最左值可被客户端伪造，会导致限流被轻易绕过）。
 */

// 普通只读接口配额：每分钟（校园网 / NAT 出口多人共享，需要留足余量）
const READ_LIMIT = 600;
// 查询类接口（search / suggest）配额：每分钟
const QUERY_LIMIT = 60;
// 写接口配额：每分钟
const WRITE_LIMIT = 10;
const WINDOW_MS = 60_000;

const STATIC_RESOURCE_RE = /^\/api\/plugins\/[^/]+\/resources\//;
const QUERY_ROUTE_RE = /^\/api\/plugins\/(search|suggest)\b/;

/**
 * 解析真实客户端 IP。
 * 按可信度从高到低取值；全部取不到时返回 null（则该请求不参与限流，
 * 避免因无法识别来源而把所有人归到同一个桶里误伤）。
 */
function getClientIp(req: NextRequest): string | null {
    const headers = req.headers;

    // 1. EdgeOne / Cloudflare 注入的真实 IP（客户端不可伪造）
    const edgeIp = headers.get('eo-connecting-ip') || headers.get('cf-connecting-ip');
    if (edgeIp) return edgeIp.trim();

    // 2. 常见反向代理注入
    const realIp = headers.get('x-real-ip');
    if (realIp) return realIp.trim();

    // 3. XFF 兜底：取最右侧（由最近的可信代理写入），而非可伪造的最左值
    const forwarded = headers.get('x-forwarded-for');
    if (forwarded) {
        const parts = forwarded.split(',').map((p) => p.trim()).filter(Boolean);
        if (parts.length > 0) return parts[parts.length - 1];
    }

    return null;
}

export function proxy(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // 静态资源与预检请求直接放行。
    if (
        req.method === 'OPTIONS' ||
        STATIC_RESOURCE_RE.test(pathname) ||
        pathname.startsWith('/_next')
    ) {
        return NextResponse.next();
    }

    const isWrite = req.method !== 'GET' && req.method !== 'HEAD';
    const ip = getClientIp(req);

    // 无法识别来源时跳过限流，避免误伤（源站本应由 EdgeOne 回源保护兜底）。
    if (!ip) {
        return NextResponse.next();
    }

    const isQuery = QUERY_ROUTE_RE.test(pathname);
    const limit = isWrite ? WRITE_LIMIT : isQuery ? QUERY_LIMIT : READ_LIMIT;
    const group = isWrite ? 'write' : isQuery ? 'query' : 'read';

    const { allowed, remaining, retryAfter } = consume(`api:${group}:${ip}`, limit, WINDOW_MS);

    if (!allowed) {
        return NextResponse.json(
            { ok: false, error: '请求过于频繁，请稍后再试' },
            {
                status: 429,
                headers: {
                    'Retry-After': String(retryAfter),
                    'Cache-Control': 'no-store',
                },
            },
        );
    }

    const res = NextResponse.next();
    res.headers.set('X-RateLimit-Limit', String(limit));
    res.headers.set('X-RateLimit-Remaining', String(remaining));
    return res;
}

export const config = {
    matcher: '/api/:path*',
};

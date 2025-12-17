// app/api/plugins/tags/route.ts
import { NextResponse } from 'next/server';
import { getTagsFromGitHub } from '@/lib/pluginUtils';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const idsRaw = url.searchParams.get('ids') || url.searchParams.get('tag') || '';
    const mode = (url.searchParams.get('mode') || 'any').toLowerCase(); // 'any' | 'all'
    const noMirror = url.searchParams.get('no-mirror') === 'true';
    const queryTags = idsRaw.split(',').map(s => s.trim()).filter(Boolean);

    // 如果没有查询参数，直接返回所有标签
    if (queryTags.length === 0) {
      const tags = await getTagsFromGitHub(noMirror);
      return NextResponse.json({ ok: true, data: tags });
    }

    // 有查询参数时，返回包含指定标签的插件
    const tags = await getTagsFromGitHub(noMirror);
    const results: any[] = [];
    
    // 这里我们返回查询的标签信息，而不是插件列表
    for (const queryTag of queryTags) {
      const tagInfo = tags[queryTag];
      if (tagInfo) {
        results.push({
          id: queryTag,
          ...tagInfo
        });
      }
    }

    return NextResponse.json({ ok: true, data: results });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
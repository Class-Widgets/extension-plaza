// app/api/plugins/search/route.ts
import { NextResponse } from 'next/server';
import { getPluginManifests } from '@/lib/pluginUtils';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const qRaw = url.searchParams.get('q') || '';
    const q = qRaw.trim().toLowerCase();
    const tag = url.searchParams.get('tag') || '';
    const sort = url.searchParams.get('sort') || 'relevance';
    const page = Math.max(1, Number.parseInt(url.searchParams.get('page') || '1', 10) || 1);
    const perPage = Math.min(50, Math.max(1, Number.parseInt(url.searchParams.get('per_page') || '12', 10) || 12));

    const manifests = await getPluginManifests();
    if (!q) {
      return NextResponse.json({ ok: true, data: [], meta: { total: 0, page, per_page: perPage, total_pages: 1 } });
    }

    const results = manifests.filter((m: any) => {
      const id = String(m.id || '').toLowerCase();
      const name = String(m.name || '').toLowerCase();
      const desc = String(m.description || '').toLowerCase();
      const author = String(m.author || '').toLowerCase();
      const tagIds: string[] = Array.isArray(m.tags) ? m.tags : [];
      
      // 简化版本，直接使用tagIds而不查询翻译
      const tagTexts = tagIds;

      const haystack = [id, name, desc, author, ...tagIds.map(t=>t.toLowerCase()), ...tagTexts].join('\n');
      return haystack.includes(q) && (!tag || tagIds.includes(tag));
    });

    if (sort === 'latest') {
      results.sort((a: any, b: any) => String(b.updated_at || b.created_at || '').localeCompare(String(a.updated_at || a.created_at || '')));
    } else if (sort === 'name') {
      results.sort((a: any, b: any) => String(a.name || '').localeCompare(String(b.name || ''), 'zh-CN'));
    }

    const total = results.length;
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const start = (Math.min(page, totalPages) - 1) * perPage;

    return NextResponse.json({
      ok: true,
      data: results.slice(start, start + perPage),
      meta: { total, page: Math.min(page, totalPages), per_page: perPage, total_pages: totalPages },
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

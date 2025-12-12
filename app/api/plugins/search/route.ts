// app/api/plugins/search/route.ts
import { NextResponse } from 'next/server';
import { getAllManifests, getTagText } from '@/lib/pluginUtils';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const qRaw = url.searchParams.get('q') || '';
    const locale = url.searchParams.get('locale') || undefined;
    const q = qRaw.trim().toLowerCase();

    const manifests = await getAllManifests();
    if (!q) {
      return NextResponse.json({ ok: true, data: [] });
    }

    const results = manifests.filter((m: any) => {
      const id = String(m.id || '').toLowerCase();
      const name = String(m.name || '').toLowerCase();
      const desc = String(m.description || '').toLowerCase();
      const author = String(m.author || '').toLowerCase();
      const tagIds: string[] = Array.isArray(m.tags) ? m.tags : [];
      const tagTexts = tagIds.map(t => getTagText(t, locale).toLowerCase());

      const haystack = [id, name, desc, author, ...tagIds.map(t=>t.toLowerCase()), ...tagTexts].join('\n');
      return haystack.includes(q);
    });

    return NextResponse.json({ ok: true, data: results });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
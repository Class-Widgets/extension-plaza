// app/api/plugins/tags/route.ts
import { NextResponse } from 'next/server';
import { getAllManifests } from '@/lib/pluginUtils';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const idsRaw = url.searchParams.get('ids') || url.searchParams.get('tag') || '';
    const mode = (url.searchParams.get('mode') || 'any').toLowerCase(); // 'any' | 'all'
    const queryTags = idsRaw.split(',').map(s => s.trim()).filter(Boolean);

    if (queryTags.length === 0) {
      return NextResponse.json({ ok: true, data: [] });
    }

    const manifests = await getAllManifests();
    const results = manifests.filter((m: any) => {
      const tagIds: string[] = Array.isArray(m.tags) ? m.tags : [];
      if (mode === 'all') {
        return queryTags.every(t => tagIds.includes(t));
      }
      // default: any
      return queryTags.some(t => tagIds.includes(t));
    });

    return NextResponse.json({ ok: true, data: results });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
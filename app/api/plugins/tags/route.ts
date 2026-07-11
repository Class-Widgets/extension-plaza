// app/api/plugins/tags/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const tagIdsRaw = url.searchParams.get('ids') || url.searchParams.get('tag') || '';
    const tagIds = tagIdsRaw.split(',').map((s) => s.trim()).filter(Boolean);

    const { data, error } = await supabase
      .schema('cw')
      .from('cw_plugin_tags')
      .select('id, name, created_at')
      .order('name', { ascending: true });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const tags = Array.isArray(data) ? data : [];
    if (tagIds.length === 0) {
      return NextResponse.json({ ok: true, data: tags });
    }

    return NextResponse.json({
      ok: true,
      data: tags.filter((tag) => tagIds.includes(tag.id)),
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

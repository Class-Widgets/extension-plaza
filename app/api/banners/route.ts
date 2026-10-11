// app/api/banners/route.ts
import { NextResponse } from 'next/server';
import { getBanner } from '@/lib/pluginUtils';
import { PUBLIC_CACHE_HEADERS } from '@/lib/cache';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const name = url.searchParams.get('name') || 'home';
    const noMirror = url.searchParams.get('no-mirror') === 'true';
    
    const bannerData = await getBanner(name, noMirror);
    return NextResponse.json({ ok: true, data: bannerData }, { headers: PUBLIC_CACHE_HEADERS() });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

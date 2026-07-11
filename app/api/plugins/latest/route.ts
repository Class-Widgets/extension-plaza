// app/api/plugins/latest/route.ts
import { NextResponse } from 'next/server';
import { getPluginManifests } from '@/lib/pluginUtils';

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const noMirror = url.searchParams.get('no-mirror') === 'true';
        const limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit') || '0', 10) : 10;
        
        const manifests = await getPluginManifests(noMirror);
        
        return NextResponse.json({ 
            ok: true, 
            data: manifests.slice(0, limit),
            meta: {
                total: manifests.length,
                limit: limit
            }
        });
    } catch (err) {
        return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
    }
}

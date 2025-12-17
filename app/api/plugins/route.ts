// app/api/plugins/route.ts
import { NextResponse } from 'next/server';
import { getAllManifestsFromGitHub } from '@/lib/pluginUtils';

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const noMirror = url.searchParams.get('no-mirror') === 'true';
        
        const manifests = await getAllManifestsFromGitHub(noMirror);
        return NextResponse.json({ ok: true, data: manifests });
    } catch (err) {
        return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
    }
}

// app/api/plugins/route.ts
import { NextResponse } from 'next/server';
import { getAllManifestsFromGitHub } from '@/lib/pluginUtils';

export async function GET() {
    try {
        const manifests = await getAllManifestsFromGitHub();
        return NextResponse.json({ ok: true, data: manifests });
    } catch (err) {
        return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
    }
}

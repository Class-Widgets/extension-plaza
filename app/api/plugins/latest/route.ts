// app/api/plugins/latest/route.ts
import { NextResponse } from 'next/server';
import { getAllManifestsFromGitHub } from '@/lib/pluginUtils';

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const noMirror = url.searchParams.get('no-mirror') === 'true';
        const limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit') || '0', 10) : 10;
        
        const manifests = await getAllManifestsFromGitHub(noMirror);
        
        // 按更新日期排序（假设manifest中有updated或lastUpdated字段）
        const sortedManifests = manifests
            .sort((a: any, b: any) => {
                const dateA = new Date(a.updated || a.lastUpdated || a.created || 0).getTime();
                const dateB = new Date(b.updated || b.lastUpdated || b.created || 0).getTime();
                return dateB - dateA;
            })
            .slice(0, limit);
        
        return NextResponse.json({ 
            ok: true, 
            data: sortedManifests,
            meta: {
                total: manifests.length,
                limit: limit
            }
        });
    } catch (err) {
        return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
    }
}
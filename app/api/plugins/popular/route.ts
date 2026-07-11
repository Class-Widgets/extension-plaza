// app/api/plugins/popular/route.ts
import { NextResponse } from 'next/server';
import { getPluginDownloadStats, getPluginManifests, getPluginRatingStats } from '@/lib/pluginUtils';

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit') || '0', 10) : 10;

        const manifests = await getPluginManifests();
        const ratingStats = await getPluginRatingStats(manifests.map((m: any) => m.id));
        const downloadStats = await getPluginDownloadStats(manifests);
        const withStats = manifests.map((m: any) => ({
            ...m,
            downloads: downloadStats[m.id] ?? 0,
            rating_count: ratingStats[m.id]?.rating_count ?? 0,
            rating_average: ratingStats[m.id]?.rating_average ?? 0,
        }));

        const sorted = withStats
            .sort((a: any, b: any) => (b.rating_count || 0) - (a.rating_count || 0) || (b.rating_average || 0) - (a.rating_average || 0))
            .slice(0, limit);

        return NextResponse.json({
            ok: true,
            data: sorted,
            meta: {
                total: manifests.length,
                limit: limit,
            },
        });
    } catch (err) {
        return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import {
    getPluginDownloadStats,
    getPluginManifests,
    getPluginRatingStats,
} from '@/lib/pluginUtils';

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;
type PluginManifest = Awaited<ReturnType<typeof getPluginManifests>>[number];

function readLimit(value: string | null): number {
    if (!value) {
        return DEFAULT_LIMIT;
    }

    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed)) {
        return DEFAULT_LIMIT;
    }

    return Math.min(Math.max(parsed, 1), MAX_LIMIT);
}

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const limit = readLimit(url.searchParams.get('limit'));
        const noMirror = url.searchParams.get('no-mirror') === 'true';
        const manifests = await getPluginManifests(noMirror);
        const certifiedManifests = manifests.filter(
            (plugin: PluginManifest) => plugin.is_certified === true,
        );
        const ratingStats = await getPluginRatingStats(
            certifiedManifests.map((plugin: PluginManifest) => plugin.id),
        );
        const downloadStats = await getPluginDownloadStats(certifiedManifests);
        const sorted = certifiedManifests
            .map((plugin: PluginManifest) => ({
                ...plugin,
                certified: true,
                rating_count: ratingStats[plugin.id]?.rating_count ?? 0,
                rating_average: ratingStats[plugin.id]?.rating_average ?? 0,
                downloads: downloadStats[plugin.id] ?? 0,
            }))
            .sort(
                (a, b) =>
                    b.rating_average - a.rating_average ||
                    b.downloads - a.downloads ||
                    b.rating_count - a.rating_count,
            );
        const plugins = sorted.slice(0, limit);

        return NextResponse.json({
            ok: true,
            data: plugins,
            meta: {
                total: sorted.length,
                limit,
            },
        });
    } catch (error) {
        return NextResponse.json(
            { ok: false, error: String(error) },
            { status: 500 },
        );
    }
}

// app/api/plugins/popular/route.ts
import { NextResponse } from 'next/server';
import { getAllManifestsFromGitHub, getPluginDownloads } from '@/lib/pluginUtils';

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit') || '0', 10) : 10;

        const manifests = await getAllManifestsFromGitHub();

        // 并行获取所有可见插件的 GitHub 下载量
        const withDownloads = await Promise.all(
            manifests.map(async (m: any) => {
                const downloads = await getPluginDownloads(m.repo_url || m.url);
                return { ...m, downloads };
            })
        );

        // 按下载量倒序排列，取前 N 个
        const sorted = withDownloads
            .sort((a: any, b: any) => (b.downloads || 0) - (a.downloads || 0))
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

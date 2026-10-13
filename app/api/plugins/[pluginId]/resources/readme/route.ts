import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { getPluginManifest, parseGitHubRepo, processReadmeImages, PLUGIN_LIST_CACHE_TAG } from "@/lib/pluginUtils";
import { pickMirrorFor } from "@/lib/mirrorUtils";

const cacheHeaders = {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "public, max-age=600, s-maxage=86400, stale-while-revalidate=604800",
};

// README 正文抓取 + 图片代理重写：用 unstable_cache 做跨实例共享缓存，
const loadReadme = unstable_cache(
    async (pluginId: string): Promise<string> => {
        const manifest = await getPluginManifest(pluginId);
        let readmeUrl = manifest.readme;

        if (!readmeUrl.startsWith("http")) {
            const branch = manifest.branch || "main";
            // 使用 raw.githubusercontent.com 直链，而非 GitHub blob HTML
            // https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}
            const { owner, repo } = parseGitHubRepo(manifest.url);
            const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${manifest.readme}`;
            const mirror = await pickMirrorFor(rawUrl);
            readmeUrl = `${mirror}/${rawUrl}`;
        }

        const res = await fetch(readmeUrl, { next: { revalidate: 3600 } });
        if (!res.ok) throw new Error(`fetch failed with status ${res.status}`);
        let text = await res.text();
        const branch = manifest.branch || "main"; // 确保 branch 可用
        text = await processReadmeImages(text, manifest.url, branch, pickMirrorFor);
        return text;
    },
    ['cw-plugin-readme'],
    { revalidate: 3600, tags: [PLUGIN_LIST_CACHE_TAG] },
);

export async function GET(_req: Request, ctx: { params: Promise<{ pluginId: string }> }) {
    const { pluginId } = await ctx.params;

    try {
        const text = await loadReadme(pluginId);
        return new NextResponse(text, { status: 200, headers: cacheHeaders });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 404 });
    }
}

import { NextResponse } from "next/server";
import { getManifestFromGitHub, parseGitHubRepo, processReadmeImages } from "@/lib/pluginUtils";
import { pickMirrorFor } from "@/lib/mirrorUtils";

const readmeCache: Record<string, { content: string; timestamp: number }> = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET(_req: Request, ctx: { params: Promise<{ pluginId: string }> }) {
    const { pluginId } = await ctx.params;

    // 检查缓存
    const cached = readmeCache[pluginId];
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
        return new NextResponse(cached.content, {
            status: 200,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
    }

    const manifest = await getManifestFromGitHub(pluginId);
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
    try {
        const res = await fetch(readmeUrl);
        if (!res.ok) throw new Error(`fetch failed with status ${res.status}`);
        let text = await res.text();
        const branch = manifest.branch || "main"; // 确保 branch 可用
        text = await processReadmeImages(text, manifest.url, branch, pickMirrorFor);

        // 存储到缓存
        readmeCache[pluginId] = { content: text, timestamp: Date.now() };

        return new NextResponse(text, {
            status: 200,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 404 });
    }
}

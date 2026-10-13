// app/api/plugins/[pluginId]/resources/release/route.ts
import { NextResponse } from "next/server";
import { getPluginManifest } from "@/lib/pluginUtils";
import { pickMirrorFor, throughMirror } from "@/lib/mirrorUtils";

function getReleaseUrl(repositoryUrl: string, assetName: string): string {
    let url: URL;

    try {
        url = new URL(repositoryUrl);
    } catch {
        throw new Error("Invalid repository URL");
    }

    // Release URLs are redirects, so keep the host restricted while accepting
    // the usual GitHub URL variants (www, trailing slash, query, or hash).
    if (
        url.protocol !== "https:" ||
        !["github.com", "www.github.com"].includes(url.hostname) ||
        url.username ||
        url.password ||
        url.port
    ) {
        throw new Error("Only public HTTPS GitHub repositories are supported");
    }

    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length !== 2) {
        throw new Error("Invalid GitHub repository URL");
    }

    const [owner, rawRepository] = parts;
    const repository = rawRepository.replace(/\.git$/, "");
    const validName = /^[A-Za-z0-9][A-Za-z0-9_.-]*$/;
    if (!validName.test(owner) || !validName.test(repository)) {
        throw new Error("Invalid GitHub repository URL");
    }

    return `https://github.com/${owner}/${repository}/releases/latest/download/${encodeURIComponent(assetName)}`;
}

export async function GET(req: Request, ctx: { params: Promise<{ pluginId: string }> }) {
    try {
        const { pluginId } = await ctx.params;
        const url = new URL(req.url);
        const format = url.searchParams.get('format') || 'cwplugin';

        if (!['zip', 'cwplugin'].includes(format)) {
            return NextResponse.json({ error: 'Invalid format parameter. Use "zip" or "cwplugin"' }, { status: 400 });
        }

        const manifest = await getPluginManifest(pluginId);

        // 构建原始 release 下载 URL
        const releaseUrl = getReleaseUrl(manifest.url, `${manifest.id}.${format}`);
        const mirror = await pickMirrorFor(releaseUrl);
        const mirroredReleaseUrl = throughMirror(mirror, releaseUrl);

        // 302 到镜像/源站
        const response = NextResponse.redirect(mirroredReleaseUrl, 302);
        response.headers.set("Cache-Control", "public, max-age=300, s-maxage=3600");
        return response;
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to fetch release";
        return NextResponse.json({ error: message }, { status: 404 });
    }
}

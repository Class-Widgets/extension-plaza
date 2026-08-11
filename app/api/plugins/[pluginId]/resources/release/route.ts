// app/api/plugins/[pluginId]/resources/release/route.ts
import { NextResponse } from "next/server";
import { getPluginManifest } from "@/lib/pluginUtils";
import { pickMirrorFor } from "@/lib/mirrorUtils";

function getReleaseUrl(repositoryUrl: string, assetName: string): string {
    const baseUrl = repositoryUrl.replace(/\/+$/, "");

    try {
        const url = new URL(baseUrl);
        if (url.hostname === "github.com") {
            const [owner, repository] = url.pathname.split("/").filter(Boolean);
            if (owner && repository) {
                return `https://github.com/${owner}/${repository.replace(/\.git$/, "")}/releases/latest/download/${encodeURIComponent(assetName)}`;
            }
        }
    } catch {
        // Use the supplied URL when it cannot be parsed as a GitHub repository URL.
    }

    return `${baseUrl}/releases/latest/download/${encodeURIComponent(assetName)}`;
}

function throughMirror(mirror: string, targetUrl: string): string {
    return `${mirror.replace(/\/$/, "")}/${targetUrl.replace(/^https?:\/\//, "")}`;
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

        // 代理下载，设置自定义文件名
        let remoteRes: Response;
        try {
            remoteRes = await fetch(mirroredReleaseUrl);
        } catch {
            remoteRes = await fetch(releaseUrl);
        }
        if (!remoteRes.ok) {
            remoteRes = await fetch(releaseUrl);
        }
        if (!remoteRes.ok) {
            return NextResponse.json({ error: `Failed to fetch release: ${remoteRes.statusText}` }, { status: remoteRes.status });
        }

        const author = manifest.author?.trim();
        const filename = author
            ? `${manifest.name}-(${author}).${format}`
            : `${manifest.name}.${format}`;
        const encodedFilename = encodeURIComponent(filename);
        const body = await remoteRes.arrayBuffer();

        return new NextResponse(body, {
            headers: {
                "Content-Disposition": `attachment; filename*=UTF-8''${encodedFilename}`,
                "Content-Type": remoteRes.headers.get("Content-Type") || "application/octet-stream",
                "Content-Length": String(body.byteLength),
                "Cache-Control": "public, max-age=60, s-maxage=300",
            },
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to fetch release";
        return NextResponse.json({ error: message }, { status: 404 });
    }
}

// app/api/plugins/[pluginId]/resources/release/route.ts
import { NextResponse } from "next/server";
import { getPluginManifest } from "@/lib/pluginUtils";
import { pickMirrorFor } from "@/lib/mirrorUtils";

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
        let releaseUrl = `${manifest.url.replace(/\/$/, '')}/releases/latest/download/${manifest.id}.${format}`;
        const mirror = await pickMirrorFor(releaseUrl);
        releaseUrl = `${mirror}/${releaseUrl.replace('https://', '')}`;

        // 代理下载，设置自定义文件名
        const remoteRes = await fetch(releaseUrl);
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
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 404 });
    }
}

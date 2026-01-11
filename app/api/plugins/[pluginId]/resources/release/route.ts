// app/api/plugins/[pluginId]/resources/release/route.ts
import { NextResponse } from "next/server";
import { getManifestFromGitHub, parseGitHubRepo } from "@/lib/pluginUtils";
import { pickMirrorFor } from "@/lib/mirrorUtils";

export async function GET(req: Request, ctx: { params: Promise<{ pluginId: string }> }) {
    try {
        const { pluginId } = await ctx.params;
        const url = new URL(req.url);
        const format = url.searchParams.get('format') || 'cwplugin';
        
        if (!['zip', 'cwplugin'].includes(format)) {
            return NextResponse.json({ error: 'Invalid format parameter. Use "zip" or "cwplugin"' }, { status: 400 });
        }

        const manifest = await getManifestFromGitHub(pluginId);
        
        // 确保 manifest.url 以斜杠结尾，然后构建正确的 release URL
        let releaseUrl = `${manifest.url.replace(/\/$/, '')}/releases/latest/download/${manifest.id}.${format}`;
        const mirror = await pickMirrorFor(releaseUrl);
        // 移除原始 URL 的协议前缀，确保镜像 URL 格式正确
        releaseUrl = `${mirror}/${releaseUrl.replace('https://', '')}`;

        return NextResponse.redirect(releaseUrl);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 404 });
    }
}

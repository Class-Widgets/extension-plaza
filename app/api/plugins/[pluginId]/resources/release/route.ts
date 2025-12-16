// app/api/plugins/[pluginId]/resources/release/route.ts
import { NextResponse } from "next/server";
import { getManifestFromGitHub, parseGitHubRepo } from "@/lib/pluginUtils";
import { pickMirrorFor } from "@/lib/mirrorUtils";

export async function GET(_req: Request, ctx: { params: Promise<{ pluginId: string }> }) {
    try {
        const { pluginId } = await ctx.params;
        const manifest = await getManifestFromGitHub(pluginId);

        let releaseUrl = `${manifest.url}/releases/latest/download/${manifest.id}.zip`;
        const mirror = await pickMirrorFor(releaseUrl);
        releaseUrl = releaseUrl.replace("https://github.com", mirror);

        return NextResponse.redirect(releaseUrl);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 404 });
    }
}

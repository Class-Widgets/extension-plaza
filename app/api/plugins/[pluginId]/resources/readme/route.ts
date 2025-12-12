import { NextResponse } from "next/server";
import { getManifest, parseGitHubRepo } from "@/lib/pluginUtils";
import { pickMirrorFor } from "@/lib/mirrorUtils";

export async function GET(_req: Request, ctx: { params: Promise<{ pluginId: string }> }) {
    const { pluginId } = await ctx.params;
    const manifest = getManifest(pluginId);
    let readmeUrl = manifest.readme;

    if (!readmeUrl.startsWith("http")) {
        const branch = manifest.branch || "main";
        readmeUrl = `${manifest.url}/blob/${branch}/${manifest.readme}`;

        const mirror = await pickMirrorFor(readmeUrl);
        readmeUrl = `${mirror}/${readmeUrl}`
    }
    try {
        const res = await fetch(readmeUrl);
        if (!res.ok) throw new Error(`fetch failed with status ${res.status}`);
        const text = await res.text();

        return new NextResponse(text, {
            status: 200,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 404 });
    }
}

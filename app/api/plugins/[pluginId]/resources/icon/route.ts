import { NextResponse } from "next/server";
import { getManifest } from "@/lib/pluginUtils";
import { pickMirrorFor } from "@/lib/mirrorUtils";

export async function GET(_req: Request, ctx: { params: Promise<{ pluginId: string }> }) {
    const { pluginId } = await ctx.params;
    const manifest = getManifest(pluginId);

    let iconUrl = manifest.icon;
    if (!iconUrl.startsWith("http")) {
        const branch = manifest.branch || "main";
        iconUrl = `${manifest.url}/blob/${branch}/${manifest.icon}`;

        const mirror = await pickMirrorFor(iconUrl);
        iconUrl = `${mirror}/${iconUrl}`;
    }

    try {
        const res = await fetch(iconUrl);
        if (!res.ok) throw new Error(`fetch failed with status ${res.status}`);
        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        return new NextResponse(buffer, {
            status: 200,
            headers: { "Content-Type": "image/png" },
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 404 });
    }
}

import { NextResponse } from "next/server";
import { getManifestFromGitHub } from "@/lib/pluginUtils";

export async function GET(_req: Request, ctx: { params: Promise<{ pluginId: string }> }) {
    const { pluginId } = await ctx.params;

    try {
        const manifest = await getManifestFromGitHub(pluginId);
        return NextResponse.json(manifest);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 404 });
    }
}

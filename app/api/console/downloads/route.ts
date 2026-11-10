import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getFreshPluginDownloadStats, getPluginDownloadStats } from "@/lib/pluginUtils";

async function getAuthenticatedUserId(req: Request) {
    const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (!token) return null;

    const { data, error } = await supabase.auth.getUser(token);
    return error ? null : data.user?.id ?? null;
}

export async function GET(req: Request) {
    const userId = await getAuthenticatedUserId(req);
    if (!userId) {
        return NextResponse.json({ ok: false, error: "请先登录" }, { status: 401 });
    }

    const { data, error } = await supabase
        .schema("cw")
        .from("cw_plugins")
        .select("id, repo_url")
        .eq("owner_id", userId);

    if (error) {
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const plugins = (data ?? []).map((plugin) => ({ id: plugin.id, repo_url: plugin.repo_url }));
    const refresh = new URL(req.url).searchParams.get("refresh") === "true";
    const refreshed = refresh ? await getFreshPluginDownloadStats(plugins) : null;
    const stats = refreshed?.stats ?? await getPluginDownloadStats(plugins);
    const total = plugins.reduce((sum, plugin) => sum + (stats[plugin.id] ?? 0), 0);
    const unavailable = plugins.filter((plugin) => stats[plugin.id] === null || stats[plugin.id] === undefined).length;

    return NextResponse.json(
        {
            ok: true,
            data: {
                total,
                unavailable,
                refreshed: refreshed?.refreshed ?? false,
                updated_at: new Date().toISOString(),
            },
        },
        { headers: { "Cache-Control": "private, no-store" } },
    );
}

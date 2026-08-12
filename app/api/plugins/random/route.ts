import { NextResponse } from "next/server";
import { getPluginManifests } from "@/lib/pluginUtils";

const DEFAULT_LIMIT = 6;
const MAX_LIMIT = 20;

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, Number.parseInt(url.searchParams.get("limit") || String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT)
    );
    const plugins = [...await getPluginManifests()];

    for (let index = plugins.length - 1; index > 0; index -= 1) {
      const selectedIndex = Math.floor(Math.random() * (index + 1));
      [plugins[index], plugins[selectedIndex]] = [plugins[selectedIndex], plugins[index]];
    }

    return NextResponse.json({
      ok: true,
      data: plugins.slice(0, limit),
      meta: { total: plugins.length, limit },
    }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

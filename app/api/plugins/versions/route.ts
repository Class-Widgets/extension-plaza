import { NextResponse } from "next/server";
import { getPublishedPluginVersions } from "@/lib/pluginUtils";
import { PUBLIC_CACHE_HEADERS } from "@/lib/cache";

const MAX_IDS = 50;
const PLUGIN_ID_RE = /^[A-Za-z0-9._-]+$/;

const cacheHeaders = PUBLIC_CACHE_HEADERS({
  maxAge: 300,
  sMaxAge: 900,
  staleWhileRevalidate: 300,
});

function parseIds(raw: string | null): { ids: string[]; error?: string } {
  if (!raw) return { ids: [], error: "query parameter 'ids' is required" };
  const parts = raw.split(",");
  if (parts.length > MAX_IDS) {
    return { ids: [], error: `at most ${MAX_IDS} plugin IDs are allowed` };
  }

  const seen = new Set<string>();
  const ids: string[] = [];
  for (const part of parts) {
    const id = part.trim();
    if (!id || !PLUGIN_ID_RE.test(id)) {
      return { ids: [], error: "invalid plugin ID" };
    }
    if (seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  return { ids: ids.sort() };
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const { ids, error } = parseIds(url.searchParams.get("ids"));

    if (error) {
      return NextResponse.json(
        { ok: false, error },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }

    const published = await getPublishedPluginVersions();
    const versionById = new Map(published.map(({ id, version }) => [id, version]));

    const plugins: Array<{ id: string; version: string }> = [];
    const missing: string[] = [];
    for (const id of ids) {
      const version = versionById.get(id);
      if (version === undefined) {
        missing.push(id);
      } else {
        plugins.push({ id, version });
      }
    }

    return NextResponse.json({
      ok: true,
      protocol: 1,
      data: { plugins, missing },
      meta: { requested: ids.length, found: plugins.length, missing: missing.length },
    }, { headers: cacheHeaders });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

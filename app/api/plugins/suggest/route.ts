// app/api/plugins/suggest/route.ts
import { NextResponse } from "next/server";
import { getPluginManifests } from "@/lib/pluginUtils";

const cacheHeaders = {
  "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
};

const DEFAULT_LIMIT = 8;
const MAX_LIMIT = 20;

type SuggestItem = {
  type: "plugin" | "tag" | "author";
  label: string;
  value: string;
  pluginId?: string;
};

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const rawQuery = url.searchParams.get("q") || "";
    const query = rawQuery.trim().toLowerCase();
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, Number.parseInt(url.searchParams.get("limit") || String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT)
    );

    const manifests = await getPluginManifests();

    const suggestions: SuggestItem[] = [];

    // 插件名称 / ID 建议
    const seenPluginIds = new Set<string>();
    if (query) {
      for (const manifest of manifests) {
        const name = String(manifest.name || "").trim();
        const pluginId = String(manifest.id || "").trim();
        if (!name || seenPluginIds.has(pluginId)) continue;
        const haystack = `${name} ${pluginId}`.toLowerCase();
        if (query && !haystack.includes(query)) continue;
        seenPluginIds.add(pluginId);
        suggestions.push({
          type: "plugin",
          label: name,
          value: name,
          pluginId,
        });
      }
    }

    // 标签建议（去重）
    const seenTags = new Set<string>();
    for (const manifest of manifests) {
      const tags = Array.isArray(manifest.tags) ? manifest.tags : [];
      for (const tag of tags) {
        const tagName = String(tag?.name ?? tag?.id ?? "").trim();
        if (!tagName || seenTags.has(tagName)) continue;
        if (query && !tagName.toLowerCase().includes(query)) continue;
        seenTags.add(tagName);
        suggestions.push({ type: "tag", label: tagName, value: tagName });
      }
    }

    // 作者建议（去重）
    const seenAuthors = new Set<string>();
    for (const manifest of manifests) {
      const author = String(manifest.author || "").trim();
      if (!author || seenAuthors.has(author)) continue;
      if (query && !author.toLowerCase().includes(query)) continue;
      seenAuthors.add(author);
      suggestions.push({ type: "author", label: author, value: author });
    }

    // 排序：前缀匹配优先，其次按类型（插件 > 标签 > 作者），再按名称长度
    const typeRank: Record<SuggestItem["type"], number> = { plugin: 0, tag: 1, author: 2 };
    const rank = (item: SuggestItem): number => {
      const lower = item.label.toLowerCase();
      if (lower.startsWith(query)) return 0;
      if (lower.includes(query)) return 1;
      return 2;
    };
    suggestions.sort((a, b) => {
      const rankDiff = rank(a) - rank(b);
      if (rankDiff !== 0) return rankDiff;
      const typeDiff = typeRank[a.type] - typeRank[b.type];
      if (typeDiff !== 0) return typeDiff;
      const lengthDiff = a.label.length - b.label.length;
      if (lengthDiff !== 0) return lengthDiff;
      return a.label.localeCompare(b.label, "zh-CN");
    });

    const data = suggestions.slice(0, limit);

    return NextResponse.json({ ok: true, data, meta: { query: rawQuery.trim(), limit } }, { headers: cacheHeaders });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

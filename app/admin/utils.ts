import type { ModerationRequest, PluginForm, PluginRatingRow, PluginRow, PluginTagJoin, TagRow } from "./types";

export const moderationStatuses = ["PENDING", "APPROVED", "REJECTED", "CANCELED"];
export const pluginStatuses = ["pending", "published", "hidden"];

export const emptyPluginForm: PluginForm = {
    id: "",
    name: "",
    description: "",
    repo_url: "",
    branch: "main",
    version: "1.0.0",
    api_version: "",
    readme: "README.md",
    icon: "icon.png",
    reason: "",
    tag_ids: [],
};

export async function sha256Hex(value: string) {
    const data = new TextEncoder().encode(value);
    const hash = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hash)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function createPlainToken() {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return `cwpt_${Array.from(bytes).map((byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

export function formatTime(value?: string | null) {
    if (!value) return "-";
    return new Date(value).toLocaleString("zh-CN", { hour12: false });
}

export function statusAppearance(status: string): "brand" | "danger" | "important" | "informative" | "severe" | "subtle" | "success" | "warning" {
    const normalized = status.toLowerCase();
    if (normalized === "published") return "success";
    if (normalized === "hidden" || normalized === "revoked") return "danger";
    if (normalized === "pending") return "warning";
    return "informative";
}

export function getPluginFromRequest(request: ModerationRequest) {
    if (Array.isArray(request.cw_plugins)) return request.cw_plugins[0] ?? null;
    return request.cw_plugins ?? null;
}

export function getPluginFromRating(rating: PluginRatingRow) {
    if (Array.isArray(rating.cw_plugins)) return rating.cw_plugins[0] ?? null;
    return rating.cw_plugins ?? null;
}

export function normalizePluginRows(rows: unknown[]): PluginRow[] {
    return rows.map((row) => {
        const plugin = row as PluginRow & { cw_plugin_item_tags?: PluginTagJoin[] | null };
        const joins = Array.isArray(plugin.cw_plugin_item_tags) ? plugin.cw_plugin_item_tags : [];
        const tags = joins
            .map((join) => Array.isArray(join.cw_plugin_tags) ? join.cw_plugin_tags[0] : join.cw_plugin_tags)
            .filter((tag): tag is TagRow => Boolean(tag?.id && tag?.name));
        const tag_ids = joins.map((join) => join.tag_id).filter(Boolean);
        const rest = { ...plugin };
        delete rest.cw_plugin_item_tags;
        return { ...rest, tag_ids, tags };
    });
}

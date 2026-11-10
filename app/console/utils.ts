import type { ModerationRequest, PluginCommentRow, PluginForm, PluginRatingRow, PluginRow, PluginTagJoin, TagRow } from "./types";

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

export function formatCount(value: number) {
    if (!Number.isFinite(value) || value < 0) return "0";
    if (value < 1000) return Math.round(value).toLocaleString("zh-CN");
    if (value < 10000) return `${(value / 1000).toFixed(1).replace(/\.0$/, "")} 千`;
    if (value < 100000000) return `${(value / 10000).toFixed(1).replace(/\.0$/, "")} 万`;
    return `${(value / 100000000).toFixed(1).replace(/\.0$/, "")} 亿`;
}

export function statusAppearance(status: string): "brand" | "danger" | "important" | "informative" | "severe" | "subtle" | "success" | "warning" {
    const normalized = status.toLowerCase();
    if (normalized === "published") return "success";
    if (normalized === "hidden" || normalized === "revoked" || normalized === "rejected") return "danger";
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

export function getProfileDisplayName(profile?: { display_name?: string | null } | null) {
    return profile?.display_name?.trim() || "匿名用户";
}

export function normalizePluginRatingRow(row: unknown): PluginRatingRow {
    const rating = row as PluginRatingRow & {
        cw_plugin_rating_comments?: PluginCommentRow | PluginCommentRow[] | null;
    };
    const commentValue = rating.cw_plugin_rating_comments;
    const comment = Array.isArray(commentValue) ? commentValue[0] ?? null : commentValue;
    const pluginValue = rating.cw_plugins;
    const normalized = {
        ...rating,
        comment: comment?.content ?? null,
        comment_status: comment?.status ?? null,
        comment_created_at: comment?.created_at ?? null,
        comment_updated_at: comment?.updated_at ?? null,
        review_comment: comment?.review_comment ?? null,
        reviewed_at: comment?.reviewed_at ?? null,
        reviewed_by: comment?.reviewed_by ?? null,
    };
    delete (normalized as { cw_plugin_rating_comments?: unknown }).cw_plugin_rating_comments;
    if (Array.isArray(pluginValue)) return { ...normalized, cw_plugins: normalizePluginRows(pluginValue) };
    if (pluginValue) return { ...normalized, cw_plugins: normalizePluginRows([pluginValue])[0] };
    return normalized;
}

export function normalizePluginRows(rows: unknown[]): PluginRow[] {
    return rows.map((row) => {
        const plugin = row as PluginRow & { cw_plugin_item_tags?: PluginTagJoin[] | null };
        const joins = Array.isArray(plugin.cw_plugin_item_tags) ? plugin.cw_plugin_item_tags : [];
        const tags = joins
            .map((join) => Array.isArray(join.cw_plugin_tags) ? join.cw_plugin_tags[0] : join.cw_plugin_tags)
            .filter((tag): tag is TagRow => Boolean(tag?.id && tag?.name));
        const tag_ids = Array.from(new Set(joins.map((join) => join.tag_id).filter(Boolean)));
        const rest = { ...plugin };
        delete rest.cw_plugin_item_tags;
        return { ...rest, tag_ids, tags };
    });
}

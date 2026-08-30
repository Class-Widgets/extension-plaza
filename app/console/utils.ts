import type { ModerationRequest, PluginForm, PluginRatingRow, PluginRow, PluginTagJoin, TagRow } from "./types";

export const moderationStatuses = ["PENDING", "APPROVED", "REJECTED", "CANCELED"];
export const pluginStatuses = ["pending", "published", "hidden"];

/** UUID v4 正则（兼容带/不带连字符的格式，以及 Supabase 返回的小写格式） */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * 判断字符串是否为合法 UUID。
 * 用于防御：禁止将插件 ID（包名格式，如 com.foo.bar）误作为 tag_id 传入 tag_id/uuid 类型列。
 */
export function isValidUuid(value: unknown): value is string {
    return typeof value === "string" && UUID_RE.test(value.trim());
}

/**
 * 清洗 tag_id 数组：仅保留合法 UUID 格式的值，并去重。
 * 若某项传入了包名格式的插件 ID，会被静默剔除，避免触发 invalid input syntax for type uuid 错误。
 */
export function sanitizeTagIds(tagIds: unknown[], tagDictionary?: TagRow[]): string[] {
    const allowed = Array.isArray(tagDictionary) && tagDictionary.length > 0
        ? new Set(tagDictionary.map((t) => t.id).filter(isValidUuid))
        : null;

    const seen = new Set<string>();
    const result: string[] = [];
    for (const raw of tagIds) {
        if (!isValidUuid(raw)) continue;
        const id = raw.trim();
        if (seen.has(id)) continue;
        if (allowed && !allowed.has(id)) continue;
        seen.add(id);
        result.push(id);
    }
    return result;
}

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
        const tag_ids = Array.from(new Set(joins.map((join) => join.tag_id).filter(Boolean)));
        const rest = { ...plugin };
        delete rest.cw_plugin_item_tags;
        return { ...rest, tag_ids, tags };
    });
}

export function isUuidCastError(error: unknown): boolean {
    const msg = error instanceof Error ? error.message : typeof error === "string" ? error : "";
    return msg.includes("invalid input syntax for type uuid");
}

/**
 * 清理某个插件的全部 cw_plugin_item_tags 关联（无条件 DELETE）。
 * 修复场景：线上 cw_plugin_item_tags.tag_id 若实际为 uuid 列，
 * 历史 bug 写入了包名字符串（如 com.foo.bar）作为脏行后，
 * 任何访问该列的查询都会触发 invalid input syntax for type uuid 错误。
 * 该函数在查询/更新流程前先强制清除该插件下的脏行，避免后续查询崩溃。
 *
 * 注意：DELETE 只使用 plugin_id = <text包名> 条件过滤，
 * 不访问 tag_id 列的值，因此即使存在脏行也不会触发 UUID cast 错误。
 */
export async function purgePluginTagLinks(supabase: SupabaseClient<any, "cw", any>, pluginId: string): Promise<Error | null> {
    if (!pluginId) return new Error("purgePluginTagLinks: pluginId is required");
    const { error } = await supabase
        .schema("cw")
        .from("cw_plugin_item_tags")
        .delete()
        .eq("plugin_id", pluginId);
    return error ?? null;
}

/**
 * 批量清理多个插件的 tag 关联。失败不会中断，返回遇到的第一个错误（若有）。
 */
export async function purgePluginTagLinksMany(supabase: SupabaseClient<any, "cw", any>, pluginIds: string[]): Promise<Error | null> {
    let firstError: Error | null = null;
    for (const id of pluginIds) {
        const err = await purgePluginTagLinks(supabase, id);
        if (err && !firstError) firstError = err;
    }
    return firstError;
}

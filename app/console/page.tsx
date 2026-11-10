"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
    Hamburger,
    Badge,
    NavCategory,
    NavCategoryItem,
    NavDrawer,
    NavDrawerBody,
    NavDrawerHeader,
    NavItem,
    NavSubItem,
    NavSubItemGroup,
    Spinner,
    Text,
} from "@fluentui/react-components";
import {
    AddRegular,
    CommentRegular,
    HomeRegular,
    KeyRegular,
    PlugConnectedRegular,
    ShieldRegular,
} from "@fluentui/react-icons";
import { useAuthSession } from "@/app/components/Auth/useAuthSession";
import { supabase } from "@/lib/supabase";
import { resolvePluginBranch } from "@/lib/githubCheck";
import { useConsoleNotifications } from "@/app/components/Layout/useConsoleNotifications";

import type { AccountRole, ConsoleView, ModerationRequest, MyCommentRow, PluginCommentRow, PluginForm, PluginRatingRow, PluginRow, Profile, PublishToken, TagRow } from "./types";
import { createPlainToken, emptyPluginForm, normalizePluginRatingRow, normalizePluginRows, sha256Hex } from "./utils";
import { useAdminToasts } from "./components/useAdminToasts";

import OverviewPanel from "./components/OverviewPanel";
import SubmitPanel from "./components/SubmitPanel";
import MyPluginsPanel from "./components/MyPluginsPanel";
import TokensPanel from "./components/TokensPanel";
import ModerationPanel from "./components/ModerationPanel";
import CommentModerationPanel from "./components/CommentModerationPanel";
import MyCommentsPanel from "./components/MyCommentsPanel";
import PluginTablePanel from "./components/PluginTablePanel";
import RatingCommentsPanel from "./components/RatingCommentsPanel";
import CertifiedPluginsPanel from "./components/CertifiedPluginsPanel";

import TextDialog from "./components/dialogs/TextDialog";
import ModerationActionDialog from "./components/dialogs/ModerationActionDialog";
import PluginDetailDialog from "./components/dialogs/PluginDetailDialog";
import Footer from "@/app/components/Layout/Footer";

const DOWNLOAD_CACHE_TTL = 6 * 60 * 60 * 1000;
const DOWNLOAD_REFRESH_COOLDOWN = 60 * 1000;
const downloadCacheKey = (userId: string) => `extension-plaza:console-downloads:${userId}`;
const downloadRefreshKey = (userId: string) => `extension-plaza:console-downloads-refresh:${userId}`;

function readDownloadCache(userId: string) {
    if (typeof window === "undefined") return null;
    try {
        const cached = JSON.parse(window.localStorage.getItem(downloadCacheKey(userId)) || "null") as { total?: number; cachedAt?: number } | null;
        return cached && typeof cached.total === "number" && typeof cached.cachedAt === "number" && Date.now() - cached.cachedAt < DOWNLOAD_CACHE_TTL
            ? cached
            : null;
    } catch {
        return null;
    }
}

async function fetchProfileMap(userIds: string[]) {
    if (userIds.length === 0) return new Map<string, Pick<Profile, "id" | "display_name">>();
    const response = await fetch("/api/profiles/names", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: userIds }),
    });
    const body = await response.json().catch(() => null) as { ok?: boolean; data?: Pick<Profile, "id" | "display_name">[]; error?: string } | null;
    if (!response.ok || !body?.ok) throw new Error(body?.error || "读取用户昵称失败");
    return new Map((body.data ?? []).map((profile) => [profile.id, profile]));
}

export default function AdminPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuthSession();
    const [profile, setProfile] = React.useState<Profile | null>(null);
    const [userRoles, setUserRoles] = React.useState<AccountRole[]>([]);
    const [profileLoading, setProfileLoading] = React.useState(true);
    const [view, setView] = React.useState<ConsoleView>("overview");
    const [myPlugins, setMyPlugins] = React.useState<PluginRow[]>([]);
    const [allPlugins, setAllPlugins] = React.useState<PluginRow[]>([]);
    const [certifiedPlugins, setCertifiedPlugins] = React.useState<PluginRow[]>([]);
    const [tags, setTags] = React.useState<TagRow[]>([]);
    const [tokens, setTokens] = React.useState<PublishToken[]>([]);
    const [moderation, setModeration] = React.useState<ModerationRequest[]>([]);
    const [ratings, setRatings] = React.useState<PluginRatingRow[]>([]);
    const [commentModeration, setCommentModeration] = React.useState<PluginRatingRow[]>([]);
    const [myComments, setMyComments] = React.useState<MyCommentRow[]>([]);
    const [loadingData, setLoadingData] = React.useState(false);
    const { toastError, toastSuccess } = useAdminToasts();
    const [form, setForm] = React.useState<PluginForm>(emptyPluginForm);
    const [newToken, setNewToken] = React.useState<string | null>(null);
    const [moderationFilter, setModerationFilter] = React.useState("PENDING");
    const [pluginFilter, setPluginFilter] = React.useState("all");
    const [keyword, setKeyword] = React.useState("");
    const [certifiedKeyword, setCertifiedKeyword] = React.useState("");
    const [ratingFilter, setRatingFilter] = React.useState("all");
    const [ratingKeyword, setRatingKeyword] = React.useState("");
    const [commentModerationFilter, setCommentModerationFilter] = React.useState("pending");
    const [navOpen, setNavOpen] = React.useState(false);
    const [navType, setNavType] = React.useState<"inline" | "overlay">("inline");
    const [myModerationRequests, setMyModerationRequests] = React.useState<ModerationRequest[]>([]);
    const [averageRating, setAverageRating] = React.useState(0);
    const [commentCount, setCommentCount] = React.useState(0);
    const [downloadCount, setDownloadCount] = React.useState(0);
    const [downloadsLoading, setDownloadsLoading] = React.useState(false);
    const [downloadRefreshCoolingDown, setDownloadRefreshCoolingDown] = React.useState(false);
    const downloadTotalRef = React.useRef(0);
    const downloadRefreshAvailableAtRef = React.useRef(0);
    const [pluginDetailOpen, setPluginDetailOpen] = React.useState(false);
    const [detailPlugin, setDetailPlugin] = React.useState<PluginRow | null>(null);
    const [detailRequests, setDetailRequests] = React.useState<ModerationRequest[]>([]);
    const [resubmitReason, setResubmitReason] = React.useState("");
    const [textDialogOpen, setTextDialogOpen] = React.useState(false);
    const [textDialogTitle, setTextDialogTitle] = React.useState("");
    const [textDialogContent, setTextDialogContent] = React.useState("");
    const [moderationDetailDialogOpen, setModerationDetailDialogOpen] = React.useState(false);
    const [moderationDetailItem, setModerationDetailItem] = React.useState<ModerationRequest | null>(null);
    const [moderationDecisionReason, setModerationDecisionReason] = React.useState("");
    const [editForm, setEditForm] = React.useState<PluginForm>(emptyPluginForm);

    // 响应式：桌面端 inline 常驻，移动端 overlay 由 hamburger 控制
    React.useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return;
        const mq = window.matchMedia("(max-width: 768px)");
        const update = () => {
            setNavType(mq.matches ? "overlay" : "inline");
            setNavOpen(!mq.matches);
        };
        update();
        mq.addEventListener("change", update);
        return () => mq.removeEventListener("change", update);
    }, []);

    const role = profile?.role ?? "USER";
    const allRoles: AccountRole[] = Array.from(new Set([role, ...userRoles]));
    const { counts: notificationCounts, markConsoleNotificationsRead, markNotificationCategoryRead } = useConsoleNotifications(user?.id, allRoles);
    // MASTER: 全量管理 + 审核
    // CW_MAINTAINER: 审核
    // USER: 仅开发者工作台
    const isMaster = allRoles.includes("MASTER");
    const isMaintainer = allRoles.includes("CW_MAINTAINER");
    const canModerate = isMaster || isMaintainer;
    const canManageAll = isMaster;
    const canManageCertified = canModerate;
    const canAccessConsole = Boolean(profile) || userRoles.length > 0;
    const canViewRatings = canAccessConsole;
    const myPluginIds = React.useMemo(() => myPlugins.map((plugin) => plugin.id), [myPlugins]);

    const openConsoleView = React.useCallback((nextView: ConsoleView) => {
        if (nextView === "myPlugins") markNotificationCategoryRead("moderationUpdates");
        if (nextView === "ratings") markNotificationCategoryRead("ratingUpdates");
        if (nextView === "myComments") markNotificationCategoryRead("commentUpdates");
        if (nextView === "commentModeration") {
            setCommentModerationFilter("pending");
            markNotificationCategoryRead("commentQueue");
        }
        if (nextView === "moderation") markNotificationCategoryRead("moderationQueue");
        setView(nextView);
    }, [markNotificationCategoryRead]);

    const updateForm = (field: keyof PluginForm, value: string) => {
        setForm((current) => ({ ...current, [field]: value }));
    };

    const syncPluginTags = React.useCallback(async (pluginId: string, tagIds: string[]) => {
        const { error } = await supabase.schema("cw").rpc("sync_plugin_tags", {
            p_plugin_id: pluginId,
            p_tag_ids: Array.from(new Set(tagIds.filter(Boolean))),
        });
        return error;
    }, []);

    const loadProfile = React.useCallback(async () => {
        if (!user) {
            setProfile(null);
            setUserRoles([]);
            setProfileLoading(false);
            return;
        }

        setProfileLoading(true);
        const [profileRes, rolesRes] = await Promise.all([
            supabase
                .from("profiles")
                .select("id, role, display_name")
                .eq("id", user.id)
                .single(),
            supabase
                .from("user_roles")
                .select("user_id, role")
                .eq("user_id", user.id),
        ]);

        if (profileRes.error) {
            toastError(profileRes.error.message);
            setProfile(null);
        } else {
            setProfile(profileRes.data as Profile);
        }

        if (rolesRes.error) {
            setUserRoles([]);
        } else {
            setUserRoles((rolesRes.data || []).map((row) => row.role));
        }

        setProfileLoading(false);
    }, [toastError, user]);

    const PLUGIN_SELECT_COLUMNS = "id, owner_id, name, description, repo_url, branch, version, api_version, readme, icon, status, is_certified, created_at, updated_at";
    const PLUGIN_WITH_TAGS_SELECT = `${PLUGIN_SELECT_COLUMNS}, cw_plugin_item_tags(tag_id, cw_plugin_tags(id, name, created_at))`;

    const loadMyPlugins = React.useCallback(async () => {
        if (!user) return;
        setLoadingData(true);

        const query = supabase
            .schema("cw")
            .from("cw_plugins")
            .select(PLUGIN_WITH_TAGS_SELECT)
            .eq("owner_id", user.id)
            .order("updated_at", { ascending: false });

        const result = await query;

        if (result.error) {
            setMyPlugins([]);
            toastError(result.error.message);
        } else {
            setMyPlugins(normalizePluginRows(result.data || []));
        }

        setLoadingData(false);
    }, [toastError, user]);

    const loadTags = React.useCallback(async () => {
        const { data, error: tagsError } = await supabase
            .schema("cw")
            .from("cw_plugin_tags")
            .select("id, name, created_at")
            .order("name", { ascending: true });

        if (tagsError) {
            setTags([]);
        } else {
            setTags((data || []) as TagRow[]);
        }
    }, []);

    const loadTokens = React.useCallback(async () => {
        if (!user) return;
        setLoadingData(true);

        const { data, error: tokensError } = await supabase
            .schema("cw")
            .rpc("list_my_publish_tokens");

        if (tokensError) {
            setTokens([]);
            toastError(tokensError.message);
        } else {
            setTokens((data || []) as unknown as PublishToken[]);
        }

        setLoadingData(false);
    }, [toastError, user]);

    const loadMyModerationRequests = React.useCallback(async () => {
        if (!user) return;
        const { data, error: modError } = await supabase
            .schema("cw")
            .from("cw_plugins_moderation_requests")
            .select("id, plugin_id, user_id, request_type, reason, decided_reason, status, created_at, decided_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

        if (modError) {
            setMyModerationRequests([]);
        } else {
            setMyModerationRequests((data || []) as unknown as ModerationRequest[]);
        }
    }, [user]);

    const loadAverageRating = React.useCallback(async () => {
        if (!user) {
            setAverageRating(0);
            setCommentCount(0);
            return;
        }

        const { data: plugins, error: pluginsError } = await supabase
            .schema("cw")
            .from("cw_plugins")
            .select("id")
            .eq("owner_id", user.id);

        if (pluginsError || !plugins || plugins.length === 0) {
            setAverageRating(0);
            setCommentCount(0);
            return;
        }

        const pluginIds = plugins.map((plugin) => plugin.id);
        const [{ data, error }, { count: comments, error: commentsError }] = await Promise.all([
            supabase
                .schema("cw")
                .from("cw_plugins_rating")
                .select("rating")
                .in("plugin_id", pluginIds),
            supabase
                .schema("cw")
                .from("cw_plugin_rating_comments")
                .select("plugin_id", { count: "exact", head: true })
                .in("plugin_id", pluginIds)
                .eq("status", "published")
                .neq("user_id", user.id),
        ]);

        if (error || !data || data.length === 0) {
            setAverageRating(0);
        } else {
            const sum = data.reduce((acc, row) => acc + row.rating, 0);
            setAverageRating(Math.round((sum / data.length) * 10) / 10);
        }
        setCommentCount(commentsError ? 0 : comments || 0);
    }, [user]);

    const loadDownloads = React.useCallback(async (refresh = false) => {
        if (!user) {
            setDownloadCount(0);
            return;
        }

        const cached = readDownloadCache(user.id);
        if (!refresh && cached) {
            setDownloadCount(cached.total!);
            downloadTotalRef.current = cached.total!;
            return;
        }

        if (refresh) {
            const lastRefreshAt = Number(window.localStorage.getItem(downloadRefreshKey(user.id)) || 0);
            const remaining = lastRefreshAt + DOWNLOAD_REFRESH_COOLDOWN - Date.now();
            if (remaining > 0) {
                downloadRefreshAvailableAtRef.current = lastRefreshAt + DOWNLOAD_REFRESH_COOLDOWN;
                setDownloadRefreshCoolingDown(true);
                return;
            }
            window.localStorage.setItem(downloadRefreshKey(user.id), String(Date.now()));
            downloadRefreshAvailableAtRef.current = Date.now() + DOWNLOAD_REFRESH_COOLDOWN;
            setDownloadRefreshCoolingDown(true);
        }

        setDownloadsLoading(true);
        try {
            const { data: sessionData } = await supabase.auth.getSession();
            const response = await fetch(`/api/console/downloads${refresh ? "?refresh=true" : ""}`, {
                headers: sessionData.session?.access_token
                    ? { Authorization: `Bearer ${sessionData.session.access_token}` }
                    : undefined,
                cache: "no-store",
            });
            const body = await response.json().catch(() => null) as {
                ok?: boolean;
                data?: { total: number; unavailable: number; refreshed: boolean };
                error?: string;
            } | null;
            if (!response.ok || !body?.ok || !body.data) throw new Error(body?.error || "读取下载量失败");
            const nextTotal = body.data.unavailable > 0 && body.data.total < downloadTotalRef.current
                ? downloadTotalRef.current
                : body.data.total;
            downloadTotalRef.current = nextTotal;
            setDownloadCount(nextTotal);
            window.localStorage.setItem(downloadCacheKey(user.id), JSON.stringify({ total: nextTotal, cachedAt: Date.now() }));
            if (body.data.unavailable > 0) {
                toastError(`GitHub 暂时无法返回部分仓库的下载量，已保留上次结果。`);
            } else if (refresh && !body.data.refreshed) {
                toastError("刷新太频繁，请稍后再试。");
            }
        } catch (error) {
            toastError(error instanceof Error ? error.message : String(error));
        } finally {
            setDownloadsLoading(false);
        }
    }, [toastError, user]);

    React.useEffect(() => {
        if (!user) return;
        const lastRefreshAt = Number(window.localStorage.getItem(downloadRefreshKey(user.id)) || 0);
        const availableAt = lastRefreshAt + DOWNLOAD_REFRESH_COOLDOWN;
        if (availableAt > Date.now()) {
            downloadRefreshAvailableAtRef.current = availableAt;
            setDownloadRefreshCoolingDown(true);
        }
    }, [user]);

    React.useEffect(() => {
        if (!downloadRefreshCoolingDown) return;
        const timer = window.setInterval(() => {
            if (Date.now() >= downloadRefreshAvailableAtRef.current) {
                setDownloadRefreshCoolingDown(false);
                window.clearInterval(timer);
            }
        }, 1000);
        return () => window.clearInterval(timer);
    }, [downloadRefreshCoolingDown]);

    const loadModeration = React.useCallback(async () => {
        if (!canModerate) return;
        setLoadingData(true);

        const moderationBaseColumns = `
            id,
            plugin_id,
            user_id,
            request_type,
            reason,
            decided_reason,
            status,
            created_at,
            decided_at
        `;
        const moderationWithPluginsTagsSelect = `
            id,
            plugin_id,
            user_id,
            request_type,
            reason,
            decided_reason,
            status,
            created_at,
            decided_at,
            cw_plugins(
                id,
                owner_id,
                name,
                description,
                repo_url,
                branch,
                version,
                api_version,
                readme,
                icon,
                status,
                is_certified,
                created_at,
                updated_at,
                cw_plugin_item_tags(tag_id, cw_plugin_tags(id, name, created_at))
            )
        `;

        let query = supabase
            .schema("cw")
            .from("cw_plugins_moderation_requests")
            .select(moderationWithPluginsTagsSelect)
            .order("created_at", { ascending: false });

        if (moderationFilter !== "all") {
            query = query.eq("status", moderationFilter);
        }

        const result = await query;

        if (result.error) {
            setModeration([]);
            toastError(result.error.message);
        } else {
            setModeration((result.data || []).map((item) => {
                const request = item as ModerationRequest;
                const pluginValue = request.cw_plugins;
                if (Array.isArray(pluginValue)) return { ...request, cw_plugins: normalizePluginRows(pluginValue) };
                if (pluginValue) return { ...request, cw_plugins: normalizePluginRows([pluginValue])[0] };
                return request;
            }));
        }

        setLoadingData(false);
    }, [canModerate, moderationFilter, toastError]);

    const loadAllPlugins = React.useCallback(async () => {
        if (!canManageAll) return;
        setLoadingData(true);

        let query = supabase
            .schema("cw")
            .from("cw_plugins")
            .select(PLUGIN_WITH_TAGS_SELECT)
            .order("updated_at", { ascending: false });

        if (pluginFilter !== "all") {
            query = query.eq("status", pluginFilter);
        }

        const trimmedKeyword = keyword.trim();
        if (trimmedKeyword) {
            query = query.or(`id.ilike.%${trimmedKeyword}%,name.ilike.%${trimmedKeyword}%`);
        }

        const result = await query;

        if (result.error) {
            setAllPlugins([]);
            toastError(result.error.message);
        } else {
            setAllPlugins(normalizePluginRows(result.data || []));
        }

        setLoadingData(false);
    }, [canManageAll, keyword, pluginFilter, toastError]);

    const loadCertifiedPlugins = React.useCallback(async () => {
        if (!canManageCertified) return;
        setLoadingData(true);

        let query = supabase
            .schema("cw")
            .from("cw_plugins")
            .select("id, owner_id, name, description, repo_url, branch, version, api_version, readme, icon, status, is_certified, created_at, updated_at")
            .eq("status", "published")
            .order("is_certified", { ascending: false })
            .order("updated_at", { ascending: false });

        const trimmedKeyword = certifiedKeyword.trim();
        if (trimmedKeyword) {
            query = query.or(`id.ilike.%${trimmedKeyword}%,name.ilike.%${trimmedKeyword}%`);
        }

        const { data, error: pluginsError } = await query;
        if (pluginsError) {
            setCertifiedPlugins([]);
            toastError(pluginsError.message);
        } else {
            setCertifiedPlugins(normalizePluginRows(data || []));
        }

        setLoadingData(false);
    }, [canManageCertified, certifiedKeyword, toastError]);

    const loadRatings = React.useCallback(async () => {
        if (!canViewRatings) return;
        setLoadingData(true);

        const ratingWithPluginTagsSelect = `
            plugin_id,
            user_id,
            rating,
            created_at,
            updated_at,
            cw_plugin_rating_comments(
                content,
                status,
                created_at,
                updated_at,
                review_comment,
                reviewed_at,
                reviewed_by
            ),
            cw_plugins(
                id,
                owner_id,
                name,
                description,
                repo_url,
                branch,
                version,
                api_version,
                readme,
                icon,
                status,
                is_certified,
                created_at,
                updated_at,
                cw_plugin_item_tags(tag_id, cw_plugin_tags(id, name, created_at))
            )
        `;

        let query = supabase
            .schema("cw")
            .from("cw_plugins_rating")
            .select(ratingWithPluginTagsSelect)
            .order("updated_at", { ascending: false });

        if (ratingFilter !== "all") {
            query = query.eq("rating", Number(ratingFilter));
        }

        const result = await query;

        if (result.error) {
            setRatings([]);
            toastError(result.error.message);
            setLoadingData(false);
            return;
        }

        const rows = (result.data || []).map(normalizePluginRatingRow);
        const userIds = Array.from(new Set(rows.map((item) => item.user_id)));
        let profileMap = new Map<string, Pick<Profile, "id" | "display_name">>();
        try {
            profileMap = await fetchProfileMap(userIds);
        } catch (error) {
            toastError(`读取评分用户昵称失败：${error instanceof Error ? error.message : String(error)}`);
        }
        const trimmedKeyword = ratingKeyword.trim().toLowerCase();
        const withProfiles = rows.map((item) => ({ ...item, profile: profileMap.get(item.user_id) ?? null }));
        const filteredRows = trimmedKeyword
            ? withProfiles.filter((item) => {
                const pluginValue = Array.isArray(item.cw_plugins) ? item.cw_plugins[0] : item.cw_plugins;
                return [
                    item.plugin_id,
                    item.user_id,
                    item.comment ?? "",
                    item.profile?.display_name ?? "",
                    pluginValue?.name ?? "",
                ].some((value) => value.toLowerCase().includes(trimmedKeyword));
            })
            : withProfiles;

        setRatings(filteredRows);
        setLoadingData(false);
    }, [canViewRatings, ratingFilter, ratingKeyword, toastError]);

    const loadCommentModeration = React.useCallback(async () => {
        if (!canModerate) return;
        setLoadingData(true);

        let query = supabase
            .schema("cw")
            .from("cw_plugins_rating")
            .select(`
                plugin_id,
                user_id,
                rating,
                created_at,
                updated_at,
                cw_plugin_rating_comments!inner(
                    content,
                    status,
                    created_at,
                    updated_at,
                    review_comment,
                    reviewed_at,
                    reviewed_by
                ),
                cw_plugins(
                    id,
                    owner_id,
                    name,
                    description,
                    repo_url,
                    branch,
                    version,
                    api_version,
                    readme,
                    icon,
                    status,
                    is_certified,
                    created_at,
                    updated_at,
                    cw_plugin_item_tags(tag_id, cw_plugin_tags(id, name, created_at))
                )
            `)
            .order("updated_at", { ascending: false });

        if (commentModerationFilter !== "all") {
            query = query.eq("cw_plugin_rating_comments.status", commentModerationFilter);
        }

        const result = await query;

        if (result.error) {
            setCommentModeration([]);
            toastError(result.error.message);
            setLoadingData(false);
            return;
        }

        const rows = (result.data || []).map(normalizePluginRatingRow);
        const userIds = Array.from(new Set(rows.map((item) => item.user_id)));
        let profileMap = new Map<string, Pick<Profile, "id" | "display_name">>();
        try {
            profileMap = await fetchProfileMap(userIds);
        } catch (error) {
            toastError(`读取评论用户昵称失败：${error instanceof Error ? error.message : String(error)}`);
        }
        setCommentModeration(rows.map((item) => ({ ...item, profile: profileMap.get(item.user_id) ?? null })));
        setLoadingData(false);
    }, [canModerate, commentModerationFilter, toastError]);

    const loadMyComments = React.useCallback(async () => {
        if (!user) return;
        setLoadingData(true);

        const { data, error } = await supabase
            .schema("cw")
            .from("cw_plugin_rating_comments")
            .select("plugin_id, user_id, content, status, review_comment, created_at, updated_at, reviewed_at, reviewed_by")
            .eq("user_id", user.id)
            .order("updated_at", { ascending: false });

        if (error) {
            setMyComments([]);
            toastError(error.message);
            setLoadingData(false);
            return;
        }

        const comments = (data || []) as unknown as PluginCommentRow[];
        const pluginIds = Array.from(new Set(comments.map((item) => item.plugin_id)));
        const [{ data: pluginRows }, { data: ratingRows }] = await Promise.all([
            pluginIds.length
                ? supabase.schema("cw").from("cw_plugins").select("id, name").in("id", pluginIds)
                : Promise.resolve({ data: [], error: null }),
            pluginIds.length
                ? supabase.schema("cw").from("cw_plugins_rating").select("plugin_id, rating").eq("user_id", user.id).in("plugin_id", pluginIds)
                : Promise.resolve({ data: [], error: null }),
        ]);

        const pluginMap = new Map((pluginRows || []).map((plugin) => [plugin.id, plugin]));
        const ratingMap = new Map((ratingRows || []).map((rating) => [rating.plugin_id, rating.rating]));
        setMyComments(comments.map((comment) => ({
            ...comment,
            plugin: pluginMap.get(comment.plugin_id) ?? null,
            rating: ratingMap.get(comment.plugin_id) ?? null,
        })));
        setLoadingData(false);
    }, [toastError, user]);

    React.useEffect(() => {
        if (!authLoading) loadProfile();
    }, [authLoading, loadProfile]);

    React.useEffect(() => {
        if (authLoading || profileLoading) return;
        if (!user) {
            router.replace("/console/redirect/login");
            return;
        }
        if (!canAccessConsole) {
            router.replace("/console/redirect/forbidden");
        }
    }, [authLoading, canAccessConsole, profileLoading, router, user]);

    React.useEffect(() => {
        if (authLoading || profileLoading || !user || !canAccessConsole) return;
        if ((view === "moderation" && !canModerate) || (view === "commentModeration" && !canModerate) || (view === "ratings" && !canViewRatings) || (view === "allPlugins" && !canManageAll) || (view === "certified" && !canManageCertified)) {
            router.replace("/console/redirect/forbidden");
        }
    }, [authLoading, canAccessConsole, canManageAll, canManageCertified, canModerate, canViewRatings, profileLoading, router, user, view]);

    React.useEffect(() => {
        if (!user) return;
        loadMyPlugins();
        loadTokens();
        loadTags();
        loadMyModerationRequests();
        loadAverageRating();
        loadDownloads();
    }, [loadDownloads, loadMyPlugins, loadTokens, loadTags, loadMyModerationRequests, loadAverageRating, user, view]);

    React.useEffect(() => {
        if (view === "moderation" && canModerate) loadModeration();
        if (view === "commentModeration" && canModerate) loadCommentModeration();
        if (view === "ratings" && canViewRatings) loadRatings();
        if (view === "myComments") loadMyComments();
        if (view === "allPlugins" && canManageAll) loadAllPlugins();
        if (view === "certified" && canManageCertified) loadCertifiedPlugins();
    }, [canModerate, canManageAll, canManageCertified, canViewRatings, loadAllPlugins, loadCertifiedPlugins, loadCommentModeration, loadModeration, loadMyComments, loadRatings, view]);

    React.useEffect(() => {
        if (!user) return;
        const interval = setInterval(() => {
            loadMyPlugins();
            loadTokens();
            loadTags();
            loadMyModerationRequests();
            loadAverageRating();
            loadDownloads();
            if (view === "moderation" && canModerate) loadModeration();
            if (view === "commentModeration" && canModerate) loadCommentModeration();
            if (view === "ratings" && canViewRatings) loadRatings();
            if (view === "myComments") loadMyComments();
            if (view === "allPlugins" && canManageAll) loadAllPlugins();
            if (view === "certified" && canManageCertified) loadCertifiedPlugins();
        }, 30000);
        return () => clearInterval(interval);
    }, [user, view, loadMyPlugins, loadTokens, loadTags, loadMyModerationRequests, loadAverageRating, loadDownloads, canModerate, canManageAll, canManageCertified, canViewRatings, loadCommentModeration, loadModeration, loadMyComments, loadRatings, loadAllPlugins, loadCertifiedPlugins]);

    const submitPlugin = async () => {
        if (!user) return;
        setLoadingData(true);

        let branch: string;
        try {
            branch = await resolvePluginBranch(form.repo_url, form.branch);
        } catch (error) {
            toastError(error instanceof Error ? error.message : String(error));
            setLoadingData(false);
            return;
        }

        const payload = {
            id: form.id.trim(),
            owner_id: user.id,
            name: form.name.trim(),
            description: form.description.trim() || null,
            repo_url: form.repo_url.trim(),
            branch,
            version: form.version.trim() || "1.0.0",
            api_version: form.api_version.trim() || null,
            readme: form.readme.trim() || "README.md",
            icon: form.icon.trim() || "icon.png",
            status: "pending",
        };

        const { error: pluginError } = await supabase.schema("cw").from("cw_plugins").insert(payload);

        if (pluginError) {
            toastError(pluginError.message);
            setLoadingData(false);
            return;
        }

        const tagError = await syncPluginTags(payload.id, form.tag_ids);

        if (tagError) {
            toastError(`插件已提交为待审核，但保存标签失败：${tagError.message}`);
            setLoadingData(false);
            return;
        }

        const { error: requestError } = await supabase.schema("cw").from("cw_plugins_moderation_requests").insert({
            plugin_id: payload.id,
            user_id: user.id,
            request_type: "SUBMISSION",
            reason: form.reason.trim() || null,
        });

        if (requestError) {
            toastError(`插件已提交为待审核，但创建审核请求失败：${requestError.message}`);
        } else {
            toastSuccess("插件已提交，等待审核。");
            setForm(emptyPluginForm);
            setView("myPlugins");
        }

        await loadMyPlugins();
        if (canModerate) await loadModeration();
        if (canManageAll) await loadAllPlugins();
        setLoadingData(false);
    };

    const createToken = async (name: string, expiresAt: string | null, scopePluginId: string | null) => {
        if (!user || !name.trim()) return;
        setLoadingData(true);
        setNewToken(null);

        const plainToken = createPlainToken();
        const tokenHash = await sha256Hex(plainToken);
        const insertData: Record<string, unknown> = {
            owner_id: user.id,
            name: name.trim(),
            token_hash: tokenHash,
            revoked: false,
            scope_plugin_id: scopePluginId || null,
        };
        if (expiresAt) {
            insertData.expires_at = new Date(expiresAt).toISOString();
        }
        const { error: tokenError } = await supabase.schema("cw").rpc("create_publish_token", {
            p_name: name.trim(),
            p_token_hash: tokenHash,
            p_scope_plugin_id: scopePluginId || null,
            p_expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        });

        if (tokenError) {
            toastError(tokenError.message);
        } else {
            setNewToken(plainToken);
            toastSuccess("Token 已创建。请立即复制明文，关闭或刷新后无法再次查看。");
            await loadTokens();
        }

        setLoadingData(false);
    };

    const revokeToken = async (token: PublishToken) => {
        setLoadingData(true);

        const { error: tokenError } = await supabase.schema("cw").rpc("revoke_publish_token", {
            p_token_id: token.id,
        });

        if (tokenError) {
            toastError(tokenError.message);
        } else {
            await loadTokens();
        }

        setLoadingData(false);
    };

    const decideRequest = async (
        request: ModerationRequest,
        action: "approve" | "reject",
        reason?: string,
        rejectedSubmissionStatus: "hidden" | "pending" = "hidden",
    ) => {
        const nextRequestStatus = action === "approve" ? "APPROVED" : "REJECTED";
        // 根据请求类型决定插件状态：
        // SUBMISSION: approve -> published, reject -> hidden / pending
        // REMOVAL:    approve -> hidden,    reject -> published
        const isRemoval = request.request_type === "REMOVAL";
        const nextPluginStatus = isRemoval
            ? (action === "approve" ? "hidden" : "published")
            : (action === "approve" ? "published" : rejectedSubmissionStatus);

        setLoadingData(true);

        const { error: requestError } = await supabase
            .schema("cw")
            .from("cw_plugins_moderation_requests")
            .update({
                status: nextRequestStatus,
                decided_reason: (reason ?? "").trim() || null,
                decided_at: new Date().toISOString(),
            })
            .eq("id", request.id);

        if (requestError) {
            toastError(requestError.message);
            setLoadingData(false);
            return;
        }

        const { error: pluginError } = await supabase
            .schema("cw")
            .from("cw_plugins")
            .update({ status: nextPluginStatus, updated_at: new Date().toISOString() })
            .eq("id", request.plugin_id);

        if (pluginError) toastError(pluginError.message);

        await Promise.all([canModerate ? loadModeration() : Promise.resolve(), canManageAll ? loadAllPlugins() : Promise.resolve(), loadMyPlugins()]);
        setLoadingData(false);
    };

    const updatePluginStatus = async (plugin: PluginRow, status: string) => {
        setLoadingData(true);

        const { error: updateError } = await supabase
            .schema("cw")
            .from("cw_plugins")
            .update({ status, updated_at: new Date().toISOString() })
            .eq("id", plugin.id);

        if (updateError) {
            toastError(updateError.message);
        } else {
            await Promise.all([canManageAll ? loadAllPlugins() : Promise.resolve(), loadMyPlugins()]);
        }

        setLoadingData(false);
    };

    const updatePluginCertification = async (plugin: PluginRow, isCertified: boolean) => {
        if (!canManageCertified) return;
        setLoadingData(true);

        const { error: updateError } = await supabase
            .schema("cw")
            .from("cw_plugins")
            .update({ is_certified: isCertified, updated_at: new Date().toISOString() })
            .eq("id", plugin.id)
            .eq("status", "published");

        if (updateError) {
            toastError(updateError.message);
        } else {
            toastSuccess(isCertified ? "已设为优秀应用。" : "已取消优秀应用认证。");
            await Promise.all([
                loadCertifiedPlugins(),
                canManageAll ? loadAllPlugins() : Promise.resolve(),
            ]);
        }

        setLoadingData(false);
    };

    const reviewComment = async (
        item: PluginRatingRow,
        status: "published" | "rejected",
        reason?: string,
    ) => {
        if (!canModerate || !item.comment) return;
        const reviewComment = (reason ?? "").trim();
        if (status === "rejected" && !reviewComment) {
            toastError("请填写拒绝原因。");
            return;
        }
        setLoadingData(true);

        const { error: reviewError } = await supabase.schema("cw").rpc("review_plugin_rating_comment", {
            p_plugin_id: item.plugin_id,
            p_user_id: item.user_id,
            p_status: status,
            p_review_comment: status === "rejected" ? reviewComment : null,
        });

        if (reviewError) {
            toastError(reviewError.message);
        } else {
            toastSuccess(status === "published" ? "评论已通过审核。" : "评论已拒绝。");
            await loadCommentModeration();
        }

        setLoadingData(false);
    };

    const resubmitPlugin = async (pluginId: string) => {
        if (!user) return;
        setLoadingData(true);

        const { error: resubmitError } = await supabase.schema("cw").rpc("resubmit_plugin", {
            p_plugin_id: pluginId,
            p_reason: resubmitReason.trim() || null,
        });

        if (resubmitError) {
            toastError(resubmitError.message);
            setLoadingData(false);
            return;
        }

        toastSuccess("已重新提交审核请求。");
        setResubmitReason("");
        setPluginDetailOpen(false);
        await Promise.all([loadMyPlugins(), loadMyModerationRequests(), canModerate ? loadModeration() : Promise.resolve()]);
        setLoadingData(false);
    };

    const openTextDialog = (title: string, content: string) => {
        setTextDialogTitle(title);
        setTextDialogContent(content);
        setTextDialogOpen(true);
    };

    const openDetailDialog = async (plugin: PluginRow) => {
        const pluginRequests = myModerationRequests.filter((r) => r.plugin_id === plugin.id);
        setDetailPlugin(plugin);
        setDetailRequests(pluginRequests);
        // 关键防御：打开编辑表单时，使用 tags 字典对 plugin.tag_ids 做交叉校验
        // 只保留合法的、在标签字典中真实存在的 UUID，避免后续保存时把包名字符串误写入 tag_id 列
        setEditForm({
            id: plugin.id,
            name: plugin.name,
            description: plugin.description || "",
            repo_url: plugin.repo_url,
            branch: plugin.branch,
            version: plugin.version,
            api_version: plugin.api_version || "",
            readme: plugin.readme,
            icon: plugin.icon,
            reason: "",
            tag_ids: plugin.tag_ids || [],
        });
        setPluginDetailOpen(true);
    };

    const openModerationDetailDialog = (item: ModerationRequest) => {
        setModerationDetailItem(item);
        setModerationDecisionReason("");
        setModerationDetailDialogOpen(true);
    };

    const handleModerationApprove = async () => {
        if (!moderationDetailItem) return;
        await decideRequest(moderationDetailItem, "approve", moderationDecisionReason);
        setModerationDetailDialogOpen(false);
    };

    const handleModerationReject = async (outcome: "hide" | "returnToPending") => {
        if (!moderationDetailItem) return;
        await decideRequest(
            moderationDetailItem,
            "reject",
            moderationDecisionReason,
            outcome === "returnToPending" ? "pending" : "hidden",
        );
        setModerationDetailDialogOpen(false);
    };

    const savePlugin = async () => {
        if (!detailPlugin || !user) return;
        setLoadingData(true);

        let branch: string;
        try {
            branch = await resolvePluginBranch(editForm.repo_url, editForm.branch);
        } catch (error) {
            toastError(error instanceof Error ? error.message : String(error));
            setLoadingData(false);
            return;
        }

        const { error: updateError } = await supabase.schema("cw").rpc("update_plugin_details", {
            p_plugin_id: detailPlugin.id,
            p_name: editForm.name.trim(),
            p_description: editForm.description.trim(),
            p_repo_url: editForm.repo_url.trim(),
            p_branch: branch,
            p_version: editForm.version.trim() || "1.0.0",
            p_api_version: editForm.api_version.trim(),
            p_readme: editForm.readme.trim() || "README.md",
            p_icon: editForm.icon.trim() || "icon.png",
            p_tag_ids: Array.from(new Set(editForm.tag_ids.filter(Boolean))),
        });

        if (updateError) {
            toastError(updateError.message);
            setLoadingData(false);
            return;
        }

        toastSuccess("插件信息已更新。");
        setPluginDetailOpen(false);
        await Promise.all([loadMyPlugins(), canManageAll ? loadAllPlugins() : Promise.resolve()]);
        setLoadingData(false);
    };

    if (authLoading || profileLoading) {
        return <div className="min-h-[420px] flex items-center justify-center"><Spinner label="正在检查账号信息" /></div>;
    }

    if (!user || !canAccessConsole) {
        return <div className="min-h-[420px] flex items-center justify-center"><Spinner label="正在跳转" /></div>;
    }

    const pendingRequests = moderation.filter((item) => item.status === "PENDING").length;
    const pendingMyPlugins = myPlugins.filter((plugin) => plugin.status === "pending").length;

    const navItems = (
        <>
            <NavItem icon={<HomeRegular />} value="overview">概览</NavItem>
            <NavItem icon={<AddRegular />} value="submit">提交插件</NavItem>
            <NavItem icon={<PlugConnectedRegular />} value="myPlugins">
                <span className="flex w-full items-center gap-2">
                    <span>我的插件</span>
                    {notificationCounts.moderationUpdates > 0 && <Badge appearance="filled" color="danger" size="small" className="ml-auto !min-w-5 !px-1">{notificationCounts.moderationUpdates > 99 ? "99+" : notificationCounts.moderationUpdates}</Badge>}
                </span>
            </NavItem>
            <NavItem icon={<CommentRegular />} value="myComments">
                <span className="flex w-full items-center gap-2">
                    <span>我的评论</span>
                    {notificationCounts.commentUpdates > 0 && <Badge appearance="filled" color="danger" size="small" className="ml-auto !min-w-5 !px-1">{notificationCounts.commentUpdates > 99 ? "99+" : notificationCounts.commentUpdates}</Badge>}
                </span>
            </NavItem>
            <NavItem icon={<KeyRegular />} value="tokens">发布 Token</NavItem>
            <NavItem icon={<HomeRegular />} value="ratings">
                <span className="flex w-full items-center gap-2">
                    <span>评分评论</span>
                    {notificationCounts.ratingUpdates > 0 && <Badge appearance="filled" color="danger" size="small" className="ml-auto !min-w-5 !px-1">{notificationCounts.ratingUpdates > 99 ? "99+" : notificationCounts.ratingUpdates}</Badge>}
                </span>
            </NavItem>
            {(canModerate || canManageAll) && (
                <NavCategory value="admin">
                    <NavCategoryItem icon={<ShieldRegular />}>{canManageAll ? "管理员" : "CW 运营维护"}</NavCategoryItem>
                    <NavSubItemGroup>
                        {canModerate && <NavSubItem value="moderation">
                            <span className="flex w-full items-center gap-2">
                                <span>插件审核队列</span>
                                {notificationCounts.moderationQueue > 0 && <Badge appearance="filled" color="danger" size="small" className="ml-auto !min-w-5 !px-1">{notificationCounts.moderationQueue > 99 ? "99+" : notificationCounts.moderationQueue}</Badge>}
                            </span>
                        </NavSubItem>}
                        {canModerate && <NavSubItem value="commentModeration">
                            <span className="flex w-full items-center gap-2">
                                <span>评论审核队列</span>
                                {notificationCounts.commentQueue > 0 && <Badge appearance="filled" color="danger" size="small" className="ml-auto !min-w-5 !px-1">{notificationCounts.commentQueue > 99 ? "99+" : notificationCounts.commentQueue}</Badge>}
                            </span>
                        </NavSubItem>}
                        {canManageCertified && <NavSubItem value="certified">优秀应用评级</NavSubItem>}
                        {canManageAll && <NavSubItem value="allPlugins">全量管理</NavSubItem>}
                    </NavSubItemGroup>
                </NavCategory>
            )}
        </>
    );

    const viewTitle: Record<ConsoleView, string> = {
        overview: "概览",
        submit: "提交插件",
        myPlugins: "我的插件",
        tokens: "发布 Token",
        moderation: "插件审核队列",
        commentModeration: "评论审核队列",
        allPlugins: "全量管理",
        certified: "优秀应用评级",
        ratings: "评分评论",
        myComments: "我的评论",
    };

    return (
        <div className="flex h-[calc(100dvh-5rem)] overflow-hidden">
            <NavDrawer
                open={navOpen}
                onOpenChange={(_, { open }) => setNavOpen(open)}
                type={navType}
                selectedValue={view}
                onNavItemSelect={(_, data) => {
                    openConsoleView(data.value as ConsoleView);
                    if (navType === "overlay") setNavOpen(false);
                }}
                aria-label="插件广场控制台导航"
            >
                <NavDrawerHeader style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Hamburger aria-label="关闭导航" onClick={() => setNavOpen(false)} />
                    <Text weight="semibold">插件广场控制台</Text>
                </NavDrawerHeader>
                <NavDrawerBody>
                    {navItems}
                </NavDrawerBody>
            </NavDrawer>

            <main className="flex-1 min-w-0 overflow-y-auto">
                <div className="min-h-full flex flex-col">
                    <div className="flex-1">
                    <div className="max-w-[1200px] mx-auto p-5 md:p-8">
                    <div className="flex items-center gap-3 mb-6">
                        {!navOpen && <Hamburger aria-label="打开导航" onClick={() => setNavOpen(true)} />}
                        <Text as="h1" size={800} weight="semibold">{viewTitle[view]}</Text>
                    </div>

                    {view === "overview" && <OverviewPanel myPluginCount={myPlugins.length} tokenCount={tokens.length} pendingMyPlugins={pendingMyPlugins} pendingRequests={pendingRequests} canModerate={canModerate} averageRating={averageRating} commentCount={commentCount} downloadCount={downloadCount} downloadsLoading={downloadsLoading} downloadRefreshCoolingDown={downloadRefreshCoolingDown} notificationCounts={notificationCounts} onOpenSubmit={() => openConsoleView("submit")} onOpenMyPlugins={() => openConsoleView("myPlugins")} onOpenTokens={() => openConsoleView("tokens")} onOpenModeration={() => openConsoleView("moderation")} onOpenCommentModeration={() => openConsoleView("commentModeration")} onOpenMyComments={() => openConsoleView("myComments")} onOpenRatings={() => openConsoleView("ratings")} onRefreshDownloads={() => void loadDownloads(true)} onMarkNotificationsRead={markConsoleNotificationsRead} />}
                    {view === "submit" && <SubmitPanel form={form} tags={tags} loading={loadingData} onChange={updateForm} onTagChange={(tagIds) => setForm((prev) => ({ ...prev, tag_ids: tagIds }))} onSubmit={submitPlugin} />}
                    {view === "myPlugins" && <MyPluginsPanel plugins={myPlugins} moderationRequests={myModerationRequests} loading={loadingData} onReload={loadMyPlugins} onOpenDetail={openDetailDialog} />}
                    {view === "tokens" && <TokensPanel tokens={tokens} plugins={myPlugins} loading={loadingData} newToken={newToken} onCreateToken={createToken} onRevokeToken={revokeToken} onReload={loadTokens} />}
                    {view === "moderation" && canModerate && <ModerationPanel items={moderation} loading={loadingData} filter={moderationFilter} onFilterChange={setModerationFilter} onReload={loadModeration} onOpenTextDialog={openTextDialog} onOpenDetailDialog={openModerationDetailDialog} />}
                    {view === "commentModeration" && canModerate && <CommentModerationPanel items={commentModeration} loading={loadingData} filter={commentModerationFilter} onFilterChange={setCommentModerationFilter} onReload={loadCommentModeration} onReview={reviewComment} />}
                    {view === "ratings" && canViewRatings && <RatingCommentsPanel items={ratings} myPluginIds={myPluginIds} currentUserId={user?.id} loading={loadingData} ratingFilter={ratingFilter} keyword={ratingKeyword} onRatingFilterChange={setRatingFilter} onKeywordChange={setRatingKeyword} onReload={loadRatings} onOpenTextDialog={openTextDialog} />}
                    {view === "myComments" && <MyCommentsPanel items={myComments} loading={loadingData} onReload={loadMyComments} />}
                    {view === "certified" && canManageCertified && <CertifiedPluginsPanel plugins={certifiedPlugins} loading={loadingData} keyword={certifiedKeyword} onKeywordChange={setCertifiedKeyword} onReload={loadCertifiedPlugins} onCertifiedChange={updatePluginCertification} />}
                    {view === "allPlugins" && canManageAll && <PluginTablePanel title="全量插件管理" plugins={allPlugins} loading={loadingData} filter={pluginFilter} keyword={keyword} readonly={false} onFilterChange={setPluginFilter} onKeywordChange={setKeyword} onReload={loadAllPlugins} onStatusChange={updatePluginStatus} onOpenDetail={openDetailDialog} />}

                    <PluginDetailDialog
                        open={pluginDetailOpen}
                        plugin={detailPlugin}
                        editForm={editForm}
                        tags={tags}
                        requests={detailRequests}
                        resubmitReason={resubmitReason}
                        loading={loadingData}
                        onOpenChange={setPluginDetailOpen}
                        onFormChange={(field, value) => setEditForm((prev) => ({ ...prev, [field]: value }))}
                        onTagChange={(tagIds) => setEditForm((prev) => ({ ...prev, tag_ids: tagIds }))}
                        onSave={savePlugin}
                        onResubmitReasonChange={setResubmitReason}
                        onResubmit={resubmitPlugin}
                    />
                        <TextDialog open={textDialogOpen} title={textDialogTitle} content={textDialogContent} onOpenChange={setTextDialogOpen} />
                        <ModerationActionDialog open={moderationDetailDialogOpen} item={moderationDetailItem} decisionReason={moderationDecisionReason} loading={loadingData} onOpenChange={setModerationDetailDialogOpen} onDecisionReasonChange={setModerationDecisionReason} onApprove={handleModerationApprove} onReject={handleModerationReject} onOpenTextDialog={openTextDialog} />
                    </div>
                    </div>
                </div>
                <Footer />
            </main>
        </div>
    );
}

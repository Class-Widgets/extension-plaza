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
    HomeRegular,
    KeyRegular,
    PlugConnectedRegular,
    ShieldRegular,
} from "@fluentui/react-icons";
import { useAuthSession } from "@/app/components/Auth/useAuthSession";
import { supabase } from "@/lib/supabase";
import { useConsoleNotifications } from "@/app/components/Layout/useConsoleNotifications";

import type { AccountRole, ConsoleView, ModerationRequest, PluginForm, PluginRatingRow, PluginRow, Profile, PublishToken, TagRow } from "./types";
import { createPlainToken, emptyPluginForm, normalizePluginRows, sha256Hex } from "./utils";
import { useAdminToasts } from "./components/useAdminToasts";

import OverviewPanel from "./components/OverviewPanel";
import SubmitPanel from "./components/SubmitPanel";
import MyPluginsPanel from "./components/MyPluginsPanel";
import TokensPanel from "./components/TokensPanel";
import ModerationPanel from "./components/ModerationPanel";
import PluginTablePanel from "./components/PluginTablePanel";
import RatingCommentsPanel from "./components/RatingCommentsPanel";

import TextDialog from "./components/dialogs/TextDialog";
import ModerationActionDialog from "./components/dialogs/ModerationActionDialog";
import PluginDetailDialog from "./components/dialogs/PluginDetailDialog";
import Footer from "@/app/components/Layout/Footer";

export default function AdminPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuthSession();
    const [profile, setProfile] = React.useState<Profile | null>(null);
    const [userRoles, setUserRoles] = React.useState<AccountRole[]>([]);
    const [profileLoading, setProfileLoading] = React.useState(true);
    const [view, setView] = React.useState<ConsoleView>("overview");
    const [myPlugins, setMyPlugins] = React.useState<PluginRow[]>([]);
    const [allPlugins, setAllPlugins] = React.useState<PluginRow[]>([]);
    const [tags, setTags] = React.useState<TagRow[]>([]);
    const [tokens, setTokens] = React.useState<PublishToken[]>([]);
    const [moderation, setModeration] = React.useState<ModerationRequest[]>([]);
    const [ratings, setRatings] = React.useState<PluginRatingRow[]>([]);
    const [loadingData, setLoadingData] = React.useState(false);
    const { toastError, toastSuccess } = useAdminToasts();
    const [form, setForm] = React.useState<PluginForm>(emptyPluginForm);
    const [newToken, setNewToken] = React.useState<string | null>(null);
    const [moderationFilter, setModerationFilter] = React.useState("PENDING");
    const [pluginFilter, setPluginFilter] = React.useState("all");
    const [keyword, setKeyword] = React.useState("");
    const [ratingFilter, setRatingFilter] = React.useState("all");
    const [ratingKeyword, setRatingKeyword] = React.useState("");
    const [navOpen, setNavOpen] = React.useState(false);
    const [navType, setNavType] = React.useState<"inline" | "overlay">("inline");
    const [myModerationRequests, setMyModerationRequests] = React.useState<ModerationRequest[]>([]);
    const [averageRating, setAverageRating] = React.useState(0);
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
    const canAccessConsole = Boolean(profile) || userRoles.length > 0;
    const canViewRatings = canAccessConsole;

    const openConsoleView = React.useCallback((nextView: ConsoleView) => {
        if (nextView === "myPlugins") markNotificationCategoryRead("moderationUpdates");
        if (nextView === "ratings") markNotificationCategoryRead("ratingUpdates");
        if (nextView === "moderation") markNotificationCategoryRead("moderationQueue");
        setView(nextView);
    }, [markNotificationCategoryRead]);

    const updateForm = (field: keyof PluginForm, value: string) => {
        setForm((current) => ({ ...current, [field]: value }));
    };

    const syncPluginTags = React.useCallback(async (pluginId: string, tagIds: string[]) => {
        const normalizedTagIds = Array.from(new Set(tagIds.filter(Boolean)));
        const { error: deleteError } = await supabase
            .schema("cw")
            .from("cw_plugin_item_tags")
            .delete()
            .eq("plugin_id", pluginId);

        if (deleteError) return deleteError;
        if (normalizedTagIds.length === 0) return null;

        const { error: insertError } = await supabase
            .schema("cw")
            .from("cw_plugin_item_tags")
            .insert(normalizedTagIds.map((tagId) => ({ plugin_id: pluginId, tag_id: tagId })));

        return insertError;
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

    const loadMyPlugins = React.useCallback(async () => {
        if (!user) return;
        setLoadingData(true);

        const { data, error: pluginsError } = await supabase
            .schema("cw")
            .from("cw_plugins")
            .select("id, owner_id, name, description, repo_url, branch, version, api_version, readme, icon, status, created_at, updated_at, cw_plugin_item_tags(tag_id, cw_plugin_tags(id, name, created_at))")
            .eq("owner_id", user.id)
            .order("updated_at", { ascending: false });

        if (pluginsError) {
            setMyPlugins([]);
            toastError(pluginsError.message);
        } else {
            setMyPlugins(normalizePluginRows(data || []));
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
            .from("cw_publish_tokens")
            .select("id, owner_id, name, scope_plugin_id, created_at, last_used_at, expires_at, revoked")
            .eq("owner_id", user.id)
            .order("created_at", { ascending: false });

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
            return;
        }

        const { data: plugins, error: pluginsError } = await supabase
            .schema("cw")
            .from("cw_plugins")
            .select("id")
            .eq("owner_id", user.id);

        if (pluginsError || !plugins || plugins.length === 0) {
            setAverageRating(0);
            return;
        }

        const pluginIds = plugins.map((plugin) => plugin.id);
        const { data, error } = await supabase
            .schema("cw")
            .from("cw_plugins_rating")
            .select("rating")
            .in("plugin_id", pluginIds);

        if (error || !data || data.length === 0) {
            setAverageRating(0);
        } else {
            const sum = data.reduce((acc, row) => acc + row.rating, 0);
            setAverageRating(Math.round((sum / data.length) * 10) / 10);
        }
    }, [user]);

    const loadModeration = React.useCallback(async () => {
        if (!canModerate) return;
        setLoadingData(true);

        let query = supabase
            .schema("cw")
            .from("cw_plugins_moderation_requests")
            .select(`
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
                    created_at,
                    updated_at,
                    cw_plugin_item_tags(tag_id, cw_plugin_tags(id, name, created_at))
                )
            `)
            .order("created_at", { ascending: false });

        if (moderationFilter !== "all") {
            query = query.eq("status", moderationFilter);
        }

        const { data, error: moderationError } = await query;

        if (moderationError) {
            setModeration([]);
            toastError(moderationError.message);
        } else {
            setModeration((data || []).map((item) => {
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
            .select("id, owner_id, name, description, repo_url, branch, version, api_version, readme, icon, status, created_at, updated_at, cw_plugin_item_tags(tag_id, cw_plugin_tags(id, name, created_at))")
            .order("updated_at", { ascending: false });

        if (pluginFilter !== "all") {
            query = query.eq("status", pluginFilter);
        }

        const trimmedKeyword = keyword.trim();
        if (trimmedKeyword) {
            query = query.or(`id.ilike.%${trimmedKeyword}%,name.ilike.%${trimmedKeyword}%`);
        }

        const { data, error: pluginsError } = await query;

        if (pluginsError) {
            setAllPlugins([]);
            toastError(pluginsError.message);
        } else {
            setAllPlugins(normalizePluginRows(data || []));
        }

        setLoadingData(false);
    }, [canManageAll, keyword, pluginFilter, toastError]);

    const loadRatings = React.useCallback(async () => {
        if (!canViewRatings) return;
        setLoadingData(true);

        let query = supabase
            .schema("cw")
            .from("cw_plugins_rating")
            .select(`
                plugin_id,
                user_id,
                rating,
                comment,
                created_at,
                updated_at,
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
                    created_at,
                    updated_at,
                    cw_plugin_item_tags(tag_id, cw_plugin_tags(id, name, created_at))
                )
            `)
            .order("updated_at", { ascending: false });

        if (ratingFilter !== "all") {
            query = query.eq("rating", Number(ratingFilter));
        }

        const { data, error: ratingsError } = await query;

        if (ratingsError) {
            setRatings([]);
            toastError(ratingsError.message);
            setLoadingData(false);
            return;
        }

        const rows = (data || []).map((item) => {
            const rating = item as PluginRatingRow;
            const pluginValue = rating.cw_plugins;
            if (Array.isArray(pluginValue)) return { ...rating, cw_plugins: normalizePluginRows(pluginValue) };
            if (pluginValue) return { ...rating, cw_plugins: normalizePluginRows([pluginValue])[0] };
            return rating;
        });
        const userIds = Array.from(new Set(rows.map((item) => item.user_id)));
        const { data: profiles, error: profilesError } = userIds.length
            ? await supabase.from("profiles").select("id, display_name").in("id", userIds)
            : { data: [], error: null };

        if (profilesError) toastError(`读取评分用户昵称失败：${profilesError.message}`);

        const profileMap = new Map((profiles || []).map((item) => [item.id, item]));
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
        if ((view === "moderation" && !canModerate) || (view === "ratings" && !canViewRatings) || (view === "allPlugins" && !canManageAll)) {
            router.replace("/console/redirect/forbidden");
        }
    }, [authLoading, canAccessConsole, canManageAll, canModerate, canViewRatings, profileLoading, router, user, view]);

    React.useEffect(() => {
        if (!user) return;
        loadMyPlugins();
        loadTokens();
        loadTags();
        loadMyModerationRequests();
        loadAverageRating();
    }, [loadMyPlugins, loadTokens, loadTags, loadMyModerationRequests, loadAverageRating, user, view]);

    React.useEffect(() => {
        if (view === "moderation" && canModerate) loadModeration();
        if (view === "ratings" && canViewRatings) loadRatings();
        if (view === "allPlugins" && canManageAll) loadAllPlugins();
    }, [canModerate, canManageAll, canViewRatings, loadAllPlugins, loadModeration, loadRatings, view]);

    React.useEffect(() => {
        if (!user) return;
        const interval = setInterval(() => {
            loadMyPlugins();
            loadTokens();
            loadTags();
            loadMyModerationRequests();
            loadAverageRating();
            if (view === "moderation" && canModerate) loadModeration();
            if (view === "ratings" && canViewRatings) loadRatings();
            if (view === "allPlugins" && canManageAll) loadAllPlugins();
        }, 30000);
        return () => clearInterval(interval);
    }, [user, view, loadMyPlugins, loadTokens, loadTags, loadMyModerationRequests, loadAverageRating, canModerate, canManageAll, canViewRatings, loadModeration, loadRatings, loadAllPlugins]);

    const submitPlugin = async () => {
        if (!user) return;
        setLoadingData(true);

        const payload = {
            id: form.id.trim(),
            owner_id: user.id,
            name: form.name.trim(),
            description: form.description.trim() || null,
            repo_url: form.repo_url.trim(),
            branch: form.branch.trim() || "main",
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
        const { error: tokenError } = await supabase.schema("cw").from("cw_publish_tokens").insert(insertData);

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

        const { error: tokenError } = await supabase
            .schema("cw")
            .from("cw_publish_tokens")
            .update({ revoked: true })
            .eq("id", token.id);

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

    const resubmitPlugin = async (pluginId: string) => {
        if (!user) return;
        setLoadingData(true);

        const { error: pluginError } = await supabase
            .schema("cw")
            .from("cw_plugins")
            .update({ status: "pending", updated_at: new Date().toISOString() })
            .eq("id", pluginId)
            .eq("owner_id", user.id);

        if (pluginError) {
            toastError(pluginError.message);
            setLoadingData(false);
            return;
        }

        const { error: requestError } = await supabase
            .schema("cw")
            .from("cw_plugins_moderation_requests")
            .insert({
                plugin_id: pluginId,
                user_id: user.id,
                request_type: "SUBMISSION",
                reason: resubmitReason.trim() || null,
                status: "PENDING",
            });

        if (requestError) {
            toastError(`重新提交失败：${requestError.message}`);
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

        const { error: updateError } = await supabase
            .schema("cw")
            .from("cw_plugins")
            .update({
                name: editForm.name.trim(),
                description: editForm.description.trim() || null,
                repo_url: editForm.repo_url.trim(),
                branch: editForm.branch.trim() || "main",
                version: editForm.version.trim() || "1.0.0",
                api_version: editForm.api_version.trim() || null,
                readme: editForm.readme.trim() || "README.md",
                icon: editForm.icon.trim() || "icon.png",
                updated_at: new Date().toISOString(),
            })
            .eq("id", detailPlugin.id);

        if (updateError) {
            toastError(updateError.message);
            setLoadingData(false);
            return;
        }

        const tagError = await syncPluginTags(detailPlugin.id, editForm.tag_ids);

        if (tagError) {
            toastError(tagError.message);
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
                                <span>审核队列</span>
                                {notificationCounts.moderationQueue > 0 && <Badge appearance="filled" color="danger" size="small" className="ml-auto !min-w-5 !px-1">{notificationCounts.moderationQueue > 99 ? "99+" : notificationCounts.moderationQueue}</Badge>}
                            </span>
                        </NavSubItem>}
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
        moderation: "审核队列",
        allPlugins: "全量管理",
        ratings: "评分评论",
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

                    {view === "overview" && <OverviewPanel myPluginCount={myPlugins.length} tokenCount={tokens.length} pendingMyPlugins={pendingMyPlugins} pendingRequests={pendingRequests} canModerate={canModerate} averageRating={averageRating} notificationCounts={notificationCounts} onOpenSubmit={() => openConsoleView("submit")} onOpenMyPlugins={() => openConsoleView("myPlugins")} onOpenTokens={() => openConsoleView("tokens")} onOpenModeration={() => openConsoleView("moderation")} onOpenRatings={() => openConsoleView("ratings")} onMarkNotificationsRead={markConsoleNotificationsRead} />}
                    {view === "submit" && <SubmitPanel form={form} tags={tags} loading={loadingData} onChange={updateForm} onTagChange={(tagIds) => setForm((prev) => ({ ...prev, tag_ids: tagIds }))} onSubmit={submitPlugin} />}
                    {view === "myPlugins" && <MyPluginsPanel plugins={myPlugins} moderationRequests={myModerationRequests} loading={loadingData} onReload={loadMyPlugins} onOpenDetail={openDetailDialog} />}
                    {view === "tokens" && <TokensPanel tokens={tokens} plugins={myPlugins} loading={loadingData} newToken={newToken} onCreateToken={createToken} onRevokeToken={revokeToken} onReload={loadTokens} />}
                    {view === "moderation" && canModerate && <ModerationPanel items={moderation} loading={loadingData} filter={moderationFilter} onFilterChange={setModerationFilter} onReload={loadModeration} onOpenTextDialog={openTextDialog} onOpenDetailDialog={openModerationDetailDialog} />}
                    {view === "ratings" && canViewRatings && <RatingCommentsPanel items={ratings} loading={loadingData} ratingFilter={ratingFilter} keyword={ratingKeyword} onRatingFilterChange={setRatingFilter} onKeywordChange={setRatingKeyword} onReload={loadRatings} onOpenTextDialog={openTextDialog} />}
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

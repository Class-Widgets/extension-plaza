"use client";

import * as React from "react";
import { supabase } from "@/lib/supabase";

const legacyStorageKey = (userId: string) => `extension-plaza:console-notifications-read:${userId}`;
const storageKey = (userId: string, category: ConsoleNotificationCategory) => `${legacyStorageKey(userId)}:${category}`;
const notificationEvent = "extension-plaza:console-notifications-read";

export type ConsoleNotificationCounts = {
    moderationUpdates: number;
    ratingUpdates: number;
    moderationQueue: number;
};

export type ConsoleNotificationCategory = keyof ConsoleNotificationCounts;

const notificationCategories: ConsoleNotificationCategory[] = ["moderationUpdates", "ratingUpdates", "moderationQueue"];
const emptyCounts: ConsoleNotificationCounts = { moderationUpdates: 0, ratingUpdates: 0, moderationQueue: 0 };

const isValidReadAt = (value: string | null) => {
    const date = value ? new Date(value) : null;
    return Boolean(date && !Number.isNaN(date.getTime()) && date.getFullYear() >= 2020);
};

export function formatNotificationCount(count: number) {
    return count > 99 ? "99+" : String(count);
}

export function useConsoleNotifications(userId: string | undefined, roles: string[]) {
    const [counts, setCounts] = React.useState<ConsoleNotificationCounts>(emptyCounts);
    const [lastReadAt, setLastReadAt] = React.useState<Record<ConsoleNotificationCategory, string> | null>(null);
    const canModerate = roles.some((role) => ["MASTER", "CW_MAINTAINER"].includes(role.toUpperCase()));

    React.useEffect(() => {
        if (!userId || typeof window === "undefined") {
            setLastReadAt(null);
            setCounts(emptyCounts);
            return;
        }

        const legacyReadAt = window.localStorage.getItem(legacyStorageKey(userId));
        const baseline = isValidReadAt(legacyReadAt) ? legacyReadAt! : new Date().toISOString();
        const readTimes = notificationCategories.reduce((result, category) => {
            const storedReadAt = window.localStorage.getItem(storageKey(userId, category));
            const readAt = isValidReadAt(storedReadAt) ? storedReadAt! : baseline;
            if (!isValidReadAt(storedReadAt)) window.localStorage.setItem(storageKey(userId, category), readAt);
            result[category] = readAt;
            return result;
        }, {} as Record<ConsoleNotificationCategory, string>);

        // First enablement and the previous single-timestamp version establish an initial read baseline.
        if (!isValidReadAt(legacyReadAt)) window.localStorage.setItem(legacyStorageKey(userId), baseline);
        setLastReadAt(readTimes);
    }, [userId]);

    React.useEffect(() => {
        if (!userId || !lastReadAt) return;

        let mounted = true;
        const loadNotifications = async () => {
            const [{ count: moderationUpdates }, { data: plugins }] = await Promise.all([
                supabase.schema("cw").from("cw_plugins_moderation_requests").select("id", { count: "exact", head: true })
                    .eq("user_id", userId).in("status", ["APPROVED", "REJECTED"]).gt("decided_at", lastReadAt.moderationUpdates),
                supabase.schema("cw").from("cw_plugins").select("id").eq("owner_id", userId),
            ]);

            const pluginIds = (plugins || []).map((plugin) => plugin.id);
            const [ratingsResult, moderationQueueResult] = await Promise.all([
                pluginIds.length > 0
                    ? supabase.schema("cw").from("cw_plugins_rating").select("plugin_id", { count: "exact", head: true })
                        .in("plugin_id", pluginIds).neq("user_id", userId).gt("updated_at", lastReadAt.ratingUpdates)
                    : Promise.resolve({ count: 0 }),
                canModerate
                    ? supabase.schema("cw").from("cw_plugins_moderation_requests").select("id", { count: "exact", head: true })
                        .eq("status", "PENDING").gt("created_at", lastReadAt.moderationQueue)
                    : Promise.resolve({ count: 0 }),
            ]);

            if (!mounted) return;
            setCounts({ moderationUpdates: moderationUpdates || 0, ratingUpdates: ratingsResult.count || 0, moderationQueue: moderationQueueResult.count || 0 });
        };

        void loadNotifications();
        const interval = window.setInterval(loadNotifications, 30_000);
        return () => { mounted = false; window.clearInterval(interval); };
    }, [canModerate, lastReadAt, userId]);

    const markNotificationCategoriesRead = React.useCallback((categories: ConsoleNotificationCategory[] = notificationCategories) => {
        if (!userId || typeof window === "undefined") return;
        const readAt = new Date().toISOString();
        const selected = new Set(categories);
        selected.forEach((category) => window.localStorage.setItem(storageKey(userId, category), readAt));
        window.localStorage.setItem(legacyStorageKey(userId), readAt);
        window.dispatchEvent(new CustomEvent(notificationEvent, { detail: { userId, categories: [...selected], readAt } }));
        setLastReadAt((current) => current && Object.fromEntries(notificationCategories.map((category) => [category, selected.has(category) ? readAt : current[category]])) as Record<ConsoleNotificationCategory, string>);
        setCounts((current) => ({ ...current, ...Object.fromEntries([...selected].map((category) => [category, 0])) }));
    }, [userId]);

    React.useEffect(() => {
        if (!userId || typeof window === "undefined") return;
        const applyRead = (categories: ConsoleNotificationCategory[], readAt: string | null) => {
            if (!readAt) return;
            const selected = new Set(categories);
            setLastReadAt((current) => current && Object.fromEntries(notificationCategories.map((category) => [category, selected.has(category) ? readAt : current[category]])) as Record<ConsoleNotificationCategory, string>);
            setCounts((current) => ({ ...current, ...Object.fromEntries(categories.map((category) => [category, 0])) }));
        };
        const onStorage = (event: StorageEvent) => {
            const category = notificationCategories.find((item) => event.key === storageKey(userId, item));
            if (category) applyRead([category], event.newValue);
        };
        const onNotificationRead = (event: Event) => {
            const detail = (event as CustomEvent<{ userId?: string; categories?: ConsoleNotificationCategory[]; readAt?: string }>).detail;
            if (detail?.userId === userId) applyRead(detail.categories || notificationCategories, detail.readAt ?? null);
        };
        window.addEventListener("storage", onStorage);
        window.addEventListener(notificationEvent, onNotificationRead);
        return () => { window.removeEventListener("storage", onStorage); window.removeEventListener(notificationEvent, onNotificationRead); };
    }, [userId]);

    const count = counts.moderationUpdates + counts.ratingUpdates + counts.moderationQueue;
    return {
        count,
        counts,
        markConsoleNotificationsRead: () => markNotificationCategoriesRead(),
        markNotificationCategoryRead: (category: ConsoleNotificationCategory) => markNotificationCategoriesRead([category]),
    };
}

"use client";

import { Badge, Button, Card, Text } from "@fluentui/react-components";
import { AddRegular, AppsListDetailRegular, KeyRegular, ShieldRegular, StarRegular } from "@fluentui/react-icons";
import type { ConsoleNotificationCounts } from "@/app/components/Layout/useConsoleNotifications";

type OverviewPanelProps = {
    myPluginCount: number;
    tokenCount: number;
    pendingMyPlugins: number;
    pendingRequests: number;
    canModerate: boolean;
    averageRating: number;
    notificationCounts: ConsoleNotificationCounts;
    onOpenSubmit: () => void;
    onOpenMyPlugins: () => void;
    onOpenTokens: () => void;
    onOpenRatings: () => void;
    onOpenModeration: () => void;
    onMarkNotificationsRead: () => void;
};

export default function OverviewPanel({
    myPluginCount,
    tokenCount,
    pendingMyPlugins,
    pendingRequests,
    canModerate,
    averageRating,
    notificationCounts,
    onOpenSubmit,
    onOpenMyPlugins,
    onOpenTokens,
    onOpenRatings,
    onOpenModeration,
    onMarkNotificationsRead,
}: OverviewPanelProps) {
    const notificationCount = notificationCounts.moderationUpdates + notificationCounts.ratingUpdates + notificationCounts.moderationQueue;
    return (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="!p-5 col-span-2 lg:col-span-3">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 mr-auto">
                            <Badge appearance="filled" color={notificationCount > 0 ? "danger" : "informative"}>{notificationCount}</Badge>
                            <Text size={500} weight="semibold">未读控制台动态</Text>
                        </div>
                        <Button appearance="subtle" disabled={notificationCount === 0} onClick={onMarkNotificationsRead}>全部标为已读</Button>
                    </div>
                    {notificationCount > 0 ? <div className="mt-3 flex flex-wrap gap-2">
                        {notificationCounts.moderationUpdates > 0 && <Button appearance="subtle" onClick={onOpenMyPlugins}>我的插件：{notificationCounts.moderationUpdates} 条审核结果</Button>}
                        {notificationCounts.ratingUpdates > 0 && <Button appearance="subtle" onClick={onOpenRatings}>评分评论：{notificationCounts.ratingUpdates} 条新动态</Button>}
                        {notificationCounts.moderationQueue > 0 && <Button appearance="subtle" onClick={onOpenModeration}>审核队列：{notificationCounts.moderationQueue} 条新增请求</Button>}
                    </div> : <Text className="mt-3 text-gray-500 dark:text-gray-400">当前没有未读动态；只会提醒本浏览器上次标为已读后新增的审核结果、评分评论和审核请求。</Text>}
            </Card>
            <Card className="!p-5">
                <AddRegular style={{ fontSize: 28 }} />
                <Text size={700} weight="semibold">
                    提交
                </Text>
                <Text className="text-gray-500 dark:text-gray-400">登记新的插件仓库并进入审核</Text>
                <Button appearance="subtle" onClick={onOpenSubmit}>
                    提交插件
                </Button>
            </Card>
            <Card className="!p-5">
                <AppsListDetailRegular style={{ fontSize: 28 }} />
                <Text size={700} weight="semibold">
                    {myPluginCount}
                </Text>
                <Text className="text-gray-500 dark:text-gray-400">我的插件，{pendingMyPlugins} 个待审核</Text>
                <Button appearance="subtle" onClick={onOpenMyPlugins}>
                    查看插件
                </Button>
            </Card>
            <Card className="!p-5">
                <KeyRegular style={{ fontSize: 28 }} />
                <Text size={700} weight="semibold">
                    {tokenCount}
                </Text>
                <Text className="text-gray-500 dark:text-gray-400">发布 Token</Text>
                <Button appearance="subtle" onClick={onOpenTokens}>
                    管理 Token
                </Button>
            </Card>
            <Card className="!p-5">
                <StarRegular style={{ fontSize: 28 }} />
                <Text size={700} weight="semibold">
                    {averageRating > 0 ? averageRating.toFixed(1) : "-"}<Text size={500} >/5</Text>
                </Text>
                <Text className="text-gray-500 dark:text-gray-400">平均评分</Text>
                <Button appearance="subtle" onClick={onOpenRatings}>
                    查看评分评论
                </Button>
            </Card>
            {canModerate && (
                <Card className="!p-5">
                    <ShieldRegular style={{ fontSize: 28 }} />
                    <Text size={700} weight="semibold">
                        {pendingRequests}
                    </Text>
                    <Text className="text-gray-500 dark:text-gray-400">待审核请求</Text>
                    <Button appearance="subtle" onClick={onOpenModeration}>
                        进入审核
                    </Button>
                </Card>
            )}
        </div>
    );
}

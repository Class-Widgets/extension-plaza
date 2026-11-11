"use client";

import { useState } from "react";
import { Badge, Button, Card, CardFooter, CardHeader, Image, MessageBar, MessageBarActions, MessageBarBody, MessageBarTitle, Text } from "@fluentui/react-components";
import { AddRegular, AppsListDetailRegular, ArrowDownloadRegular, ArrowSyncRegular, CheckmarkRegular, CodeRegular, CommentRegular, CopyRegular, KeyRegular, OpenRegular, ShieldRegular, StarRegular } from "@fluentui/react-icons";
import type { ConsoleNotificationCounts } from "@/app/components/Layout/useConsoleNotifications";
import { formatCount } from "../utils";

const DEVELOPER_QQ_GROUP_URL = "https://qm.qq.com/q/yrWLyF0laM";
const DEVELOPER_QQ_GROUP_NUMBER = "1025650343";

type OverviewPanelProps = {
    myPluginCount: number;
    tokenCount: number;
    pendingMyPlugins: number;
    pendingRequests: number;
    canModerate: boolean;
    averageRating: number;
    commentCount: number;
    downloadCount: number;
    downloadsLoading: boolean;
    downloadRefreshCoolingDown: boolean;
    notificationCounts: ConsoleNotificationCounts;
    onOpenSubmit: () => void;
    onOpenMyPlugins: () => void;
    onOpenTokens: () => void;
    onOpenRatings: () => void;
    onOpenModeration: () => void;
    onOpenCommentModeration: () => void;
    onOpenMyComments: () => void;
    onRefreshDownloads: () => void;
    onMarkNotificationsRead: () => void;
};

export default function OverviewPanel({
    myPluginCount,
    tokenCount,
    pendingMyPlugins,
    pendingRequests,
    canModerate,
    averageRating,
    commentCount,
    downloadCount,
    downloadsLoading,
    downloadRefreshCoolingDown,
    notificationCounts,
    onOpenSubmit,
    onOpenMyPlugins,
    onOpenTokens,
    onOpenRatings,
    onOpenModeration,
    onOpenCommentModeration,
    onOpenMyComments,
    onRefreshDownloads,
    onMarkNotificationsRead,
}: OverviewPanelProps) {
    const [groupNumberCopied, setGroupNumberCopied] = useState(false);
    const copyDeveloperGroupNumber = async () => {
        try {
            await navigator.clipboard.writeText(DEVELOPER_QQ_GROUP_NUMBER);
            setGroupNumberCopied(true);
        } catch {
            setGroupNumberCopied(false);
        }
    };
    const notificationCount = notificationCounts.moderationUpdates + notificationCounts.ratingUpdates + notificationCounts.commentUpdates + notificationCounts.commentQueue + notificationCounts.moderationQueue;
    return (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <MessageBar
                className="col-span-2 lg:col-span-3 p-2"
                intent="info"
                icon={
                    <Image
                        src="/images/developer-qq-group.png"
                        alt=""
                        width={24}
                        height={24}
                        fit="cover"
                        shape="circular"
                    />
                }
            >
                <MessageBarBody>
                    <MessageBarTitle>加入 Class Widgets 开发者 QQ 群</MessageBarTitle>
                    欢迎各位插件开发者入群，与我们交流插件开发、反馈问题并获取开发接口版本动态，相互促进项目发展！ο(=•ω＜=)ρ⌒☆、
                </MessageBarBody>
                <MessageBarActions>
                    <Button
                        appearance="secondary"

                        icon={groupNumberCopied ? <CheckmarkRegular /> : <CopyRegular />}
                        onClick={() => void copyDeveloperGroupNumber()}
                    >
                        {groupNumberCopied ? "已复制" : "复制群 ID (1025650343)"}
                    </Button>
                    <Button
                        as="a"
                        appearance="primary"
                        href={DEVELOPER_QQ_GROUP_URL}
                        target="_blank"
                        rel="noreferrer"
                        icon={<OpenRegular />}
                    >
                        加入群聊
                    </Button>
                </MessageBarActions>
            </MessageBar>
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
                        {notificationCounts.ratingUpdates > 0 && <Button appearance="subtle" onClick={onOpenRatings}>评论：{notificationCounts.ratingUpdates} 条新动态</Button>}
                        {notificationCounts.commentUpdates > 0 && <Button appearance="subtle" onClick={onOpenMyComments}>我的评论：{notificationCounts.commentUpdates} 条审核结果</Button>}
                        {notificationCounts.commentQueue > 0 && <Button appearance="subtle" onClick={onOpenCommentModeration}>评论审核队列：{notificationCounts.commentQueue} 条待审核</Button>}
                        {notificationCounts.moderationQueue > 0 && <Button appearance="subtle" onClick={onOpenModeration}>插件审核队列：{notificationCounts.moderationQueue} 条新增请求</Button>}
                    </div> : <Text className="mt-3 text-gray-500 dark:text-gray-400">暂时没有新通知</Text>}
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
            <Card className="!p-5">
                <CommentRegular style={{ fontSize: 28 }} />
                <Text size={700} weight="semibold">
                    {commentCount}
                </Text>
                <Text className="text-gray-500 dark:text-gray-400">收到评论</Text>
                <Button appearance="subtle" onClick={onOpenRatings}>
                    查看评论
                </Button>
            </Card>
            <Card className="!p-5">
                <ArrowDownloadRegular style={{ fontSize: 28 }} />
                <Text size={700} weight="semibold">
                    {downloadsLoading ? "-" : formatCount(downloadCount)}
                </Text>
                <Text className="text-gray-500 dark:text-gray-400">插件下载量</Text>
                <Button appearance="subtle" icon={<ArrowSyncRegular />} disabled={downloadsLoading || downloadRefreshCoolingDown} onClick={onRefreshDownloads}>
                    {downloadsLoading ? "正在刷新" : downloadRefreshCoolingDown ? "请稍候再刷新" : "刷新下载量"}
                </Button>
            </Card>
            {canModerate && (
                <Card className="!p-5">
                    <ShieldRegular style={{ fontSize: 28 }} />
                    <Text size={700} weight="semibold">
                        {pendingRequests}
                    </Text>
                    <Text className="text-gray-500 dark:text-gray-400">待审核插件</Text>
                    <Button appearance="subtle" onClick={onOpenModeration}>
                        进入审核
                    </Button>
                </Card>
            )}
            <Card className="col-span-2 lg:col-span-3">
                <CardHeader
                    image={<CodeRegular style={{ fontSize: 28 }} />}
                    header={<Text size={500} weight="semibold">开发资源</Text>}
                    description={<Text size={200}>插件开发常用资源</Text>}
                />
                <CardFooter>
                    <Button as="a" appearance="subtle" href="https://github.com/RinLit-233-shiroko/Class-Widgets-2" target="_blank" rel="noreferrer" icon={<OpenRegular />}>Class Widgets 2 仓库</Button>
                    <Button as="a" appearance="subtle" href="https://github.com/class-widgets/class-widgets-sdk" target="_blank" rel="noreferrer" icon={<OpenRegular />}>SDK 仓库</Button>
                    <Button as="a" appearance="subtle" href="https://pypi.org/project/class-widgets-sdk/" target="_blank" rel="noreferrer" icon={<OpenRegular />}>SDK PyPI 包</Button>
                    <Button as="a" appearance="subtle" href="https://github.com/Class-Widgets/plugin-template-v2/" target="_blank" rel="noreferrer" icon={<OpenRegular />}>插件模板</Button>
                </CardFooter>
            </Card>
        </div>
    );
}

"use client";

import { Button, Card, Text } from "@fluentui/react-components";
import { AddRegular, AppsListDetailRegular, KeyRegular, ShieldRegular, StarRegular } from "@fluentui/react-icons";

type OverviewPanelProps = {
    myPluginCount: number;
    tokenCount: number;
    pendingMyPlugins: number;
    pendingRequests: number;
    canModerate: boolean;
    averageRating: number;
    onOpenSubmit: () => void;
    onOpenMyPlugins: () => void;
    onOpenTokens: () => void;
    onOpenModeration: () => void;
};

export default function OverviewPanel({
    myPluginCount,
    tokenCount,
    pendingMyPlugins,
    pendingRequests,
    canModerate,
    averageRating,
    onOpenSubmit,
    onOpenMyPlugins,
    onOpenTokens,
    onOpenModeration,
}: OverviewPanelProps) {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
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

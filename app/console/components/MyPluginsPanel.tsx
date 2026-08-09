"use client";

import * as React from "react";
import { Badge, Card, Divider, Spinner, Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow, Text, Toolbar, ToolbarButton } from "@fluentui/react-components";
import { ArrowSyncRegular } from "@fluentui/react-icons";
import type { ModerationRequest, PluginRow } from "../types";
import { formatTime, statusAppearance } from "../utils";
import EmptyState from "@/app/components/Common/EmptyState";
import Pagination from "./Pagination";

const PAGE_SIZE = 10;

type MyPluginsPanelProps = {
    plugins: PluginRow[];
    moderationRequests: ModerationRequest[];
    loading: boolean;
    onReload: () => void;
    onOpenDetail: (plugin: PluginRow) => void;
};

export default function MyPluginsPanel({ plugins, moderationRequests, loading, onReload, onOpenDetail }: MyPluginsPanelProps) {
    const [page, setPage] = React.useState(1);
    const pageData = React.useMemo(() => plugins.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [plugins, page]);

    // 数据变化时重置到第一页
    React.useEffect(() => { setPage(1); }, [plugins.length]);

    const getLatestModerationStatus = (pluginId: string) => {
        const reqs = moderationRequests.filter((r) => r.plugin_id === pluginId);
        if (reqs.length === 0) return null;
        return reqs[0].status;
    };

    return (
        <Card className="!p-5 min-w-0">
            <Toolbar className="px-0 gap-3" style={{ flexWrap: "wrap" }}>
                <Text weight="semibold" size={500} style={{ marginRight: "auto" }}>
                    我的插件
                </Text>
                <ToolbarButton icon={<ArrowSyncRegular />} onClick={onReload} />
            </Toolbar>
            <Divider className="my-3" />
            <div className="overflow-x-auto">
                {loading ? (
                    <div className="py-12 flex justify-center">
                        <Spinner label="正在加载插件" />
                    </div>
                ) : plugins.length === 0 ? (
                    <EmptyState message="当前没有插件" />
                ) : (<><Table aria-label="我的插件表格" style={{ minWidth: 900 }}>
                        <TableHeader>
                            <TableRow>
                                <TableHeaderCell style={{ minWidth: 180 }}>插件</TableHeaderCell>
                                <TableHeaderCell style={{ minWidth: 80 }}>版本</TableHeaderCell>
                                <TableHeaderCell style={{ minWidth: 100 }}>状态</TableHeaderCell>
                                <TableHeaderCell style={{ minWidth: 100 }}>审核状态</TableHeaderCell>
                                <TableHeaderCell style={{ minWidth: 120 }}>仓库</TableHeaderCell>
                                <TableHeaderCell style={{ minWidth: 140 }}>更新时间</TableHeaderCell>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pageData.map((plugin) => {
                                const modStatus = getLatestModerationStatus(plugin.id);
                                return (
                                    <TableRow key={plugin.id} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800" onClick={() => onOpenDetail(plugin)}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <Text weight="semibold">{plugin.name}</Text>
                                                <Text size={200} className="text-gray-500 dark:text-gray-400">
                                                    {plugin.id}
                                                </Text>
                                            </div>
                                        </TableCell>
                                        <TableCell>{plugin.version}</TableCell>
                                        <TableCell>
                                            <Badge appearance="filled" color={statusAppearance(plugin.status)}>
                                                {plugin.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {modStatus ? (
                                                <Badge appearance="filled" color={statusAppearance(modStatus)}>
                                                    {modStatus}
                                                </Badge>
                                            ) : (
                                                <Text size={200}>-</Text>
                                            )}
                                        </TableCell>
                                        <TableCell onClick={(e) => e.stopPropagation()}>
                                            <a href={plugin.repo_url} target="_blank" rel="noreferrer" className="hover:underline">
                                                打开仓库
                                            </a>
                                        </TableCell>
                                        <TableCell>{formatTime(plugin.updated_at)}</TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                    <Pagination current={page} total={plugins.length} pageSize={PAGE_SIZE} onChange={setPage} />
                    </>)}
            </div>
        </Card>
    );
}

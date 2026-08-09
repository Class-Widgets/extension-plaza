"use client";

import * as React from "react";
import { Badge, Card, Divider, Input, Select, Spinner, Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow, Text, Toolbar, ToolbarButton } from "@fluentui/react-components";
import { ArrowSyncRegular } from "@fluentui/react-icons";
import type { PluginRow } from "../types";
import { formatTime, pluginStatuses, statusAppearance } from "../utils";
import EmptyState from "@/app/components/Common/EmptyState";
import Pagination from "./Pagination";

const PAGE_SIZE = 10;

type PluginTablePanelProps = {
    title: string;
    plugins: PluginRow[];
    loading: boolean;
    readonly: boolean;
    filter?: string;
    keyword?: string;
    onFilterChange?: (value: string) => void;
    onKeywordChange?: (value: string) => void;
    onReload: () => void;
    onStatusChange?: (plugin: PluginRow, status: string) => void;
    onOpenDetail?: (plugin: PluginRow) => void;
};

export default function PluginTablePanel({ title, plugins, loading, readonly, filter, keyword, onFilterChange, onKeywordChange, onReload, onStatusChange, onOpenDetail }: PluginTablePanelProps) {
    const [page, setPage] = React.useState(1);
    const pageData = React.useMemo(() => plugins.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [plugins, page]);
    React.useEffect(() => { setPage(1); }, [plugins.length]);
    return (
        <Card className="!p-5 min-w-0">
            <Toolbar className="px-0 gap-3" style={{ flexWrap: "wrap" }}>
                <Text weight="semibold" size={500} style={{ marginRight: "auto" }}>
                    {title}
                </Text>
                {onKeywordChange && <Input value={keyword ?? ""} placeholder="搜索 ID 或名称" onChange={(_, data) => onKeywordChange(data.value)} />}
                {onFilterChange && (
                    <Select value={filter ?? "all"} onChange={(_, data) => onFilterChange(data.value)}>
                        <option value="all">全部状态</option>
                        {pluginStatuses.map((status) => (
                            <option key={status} value={status}>
                                {status}
                            </option>
                        ))}
                    </Select>
                )}
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
                ) : (<><Table aria-label={`${title}表格`} style={{ minWidth: 800 }}>
                        <TableHeader>
                            <TableRow>
                                <TableHeaderCell style={{ minWidth: 180 }}>插件</TableHeaderCell>
                                <TableHeaderCell style={{ minWidth: 80 }}>版本</TableHeaderCell>
                                <TableHeaderCell style={{ minWidth: 100 }}>状态</TableHeaderCell>
                                <TableHeaderCell style={{ minWidth: 120 }}>仓库</TableHeaderCell>
                                <TableHeaderCell style={{ minWidth: 140 }}>更新时间</TableHeaderCell>
                                {!readonly && <TableHeaderCell style={{ minWidth: 120 }}>调整状态</TableHeaderCell>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pageData.map((plugin) => (
                                <TableRow key={plugin.id} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800" onClick={() => onOpenDetail?.(plugin)}>
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
                                        <a href={plugin.repo_url} target="_blank" rel="noreferrer" className="hover:underline">
                                            打开仓库
                                        </a>
                                    </TableCell>
                                    <TableCell>{formatTime(plugin.updated_at)}</TableCell>
                                    {!readonly && (
                                        <TableCell onClick={(e) => e.stopPropagation()}>
                                            <Select value={plugin.status} onChange={(_, data) => onStatusChange?.(plugin, data.value)}>
                                                {pluginStatuses.map((status) => (
                                                    <option key={status} value={status}>
                                                        {status}
                                                    </option>
                                                ))}
                                            </Select>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <Pagination current={page} total={plugins.length} pageSize={PAGE_SIZE} onChange={setPage} />
                    </>)}
            </div>
        </Card>
    );
}

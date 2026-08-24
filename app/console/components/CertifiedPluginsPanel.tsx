"use client";

import * as React from "react";
import { Badge, Card, Divider, Input, Spinner, Switch, Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow, Text, Toolbar, ToolbarButton } from "@fluentui/react-components";
import { ArrowSyncRegular } from "@fluentui/react-icons";
import type { PluginRow } from "../types";
import { formatTime } from "../utils";
import EmptyState from "@/app/components/Common/EmptyState";
import Pagination from "./Pagination";

const PAGE_SIZE = 10;

type CertifiedPluginsPanelProps = {
    plugins: PluginRow[];
    loading: boolean;
    keyword: string;
    onKeywordChange: (value: string) => void;
    onReload: () => void;
    onCertifiedChange: (plugin: PluginRow, isCertified: boolean) => void;
};

export default function CertifiedPluginsPanel({ plugins, loading, keyword, onKeywordChange, onReload, onCertifiedChange }: CertifiedPluginsPanelProps) {
    const [page, setPage] = React.useState(1);
    const pageData = React.useMemo(() => plugins.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [plugins, page]);

    React.useEffect(() => {
        setPage(1);
    }, [plugins.length]);

    return (
        <Card className="!p-5 min-w-0">
            <Toolbar className="px-0 gap-3" style={{ flexWrap: "wrap" }}>
                <Text weight="semibold" size={500} style={{ marginRight: "auto" }}>
                    优秀应用评级
                </Text>
                <Input value={keyword} placeholder="搜索 ID 或名称" onChange={(_, data) => onKeywordChange(data.value)} />
                <ToolbarButton icon={<ArrowSyncRegular />} onClick={onReload} aria-label="刷新插件列表" />
            </Toolbar>
            <Divider className="my-3" />
            <div className="overflow-x-auto">
                {loading ? (
                    <div className="py-12 flex justify-center">
                        <Spinner label="正在加载已发布插件" />
                    </div>
                ) : plugins.length === 0 ? (
                    <EmptyState message="没有匹配的已发布插件" />
                ) : (
                    <>
                        <Table aria-label="优秀应用表格" style={{ minWidth: 800 }}>
                            <TableHeader>
                                <TableRow>
                                    <TableHeaderCell style={{ minWidth: 200 }}>插件</TableHeaderCell>
                                    <TableHeaderCell style={{ minWidth: 100 }}>版本</TableHeaderCell>
                                    <TableHeaderCell style={{ minWidth: 140 }}>更新时间</TableHeaderCell>
                                    <TableHeaderCell style={{ minWidth: 120 }}>认证状态</TableHeaderCell>
                                    <TableHeaderCell style={{ minWidth: 160 }}>设为优秀应用</TableHeaderCell>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pageData.map((plugin) => (
                                    <TableRow key={plugin.id}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <Text weight="semibold">{plugin.name}</Text>
                                                <Text size={200} className="text-gray-500 dark:text-gray-400">{plugin.id}</Text>
                                            </div>
                                        </TableCell>
                                        <TableCell>{plugin.version}</TableCell>
                                        <TableCell>{formatTime(plugin.updated_at)}</TableCell>
                                        <TableCell>
                                            <Badge appearance="filled" color={plugin.is_certified ? "success" : "subtle"}>
                                                {plugin.is_certified ? "已认证" : "未认证"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Switch
                                                checked={plugin.is_certified}
                                                label={plugin.is_certified ? "已设为优秀应用" : "设为优秀应用"}
                                                onChange={(_, data) => onCertifiedChange(plugin, data.checked)}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <Pagination current={page} total={plugins.length} pageSize={PAGE_SIZE} onChange={setPage} />
                    </>
                )}
            </div>
        </Card>
    );
}

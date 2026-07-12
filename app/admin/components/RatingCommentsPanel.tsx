"use client";

import * as React from "react";
import { Badge, Card, Divider, Input, Select, Spinner, Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow, Text, Toolbar, ToolbarButton } from "@fluentui/react-components";
import { ArrowSyncRegular } from "@fluentui/react-icons";
import type { PluginRatingRow } from "../types";
import { formatTime, getPluginFromRating } from "../utils";
import CellWithDialog from "./CellWithDialog";
import EmptyState from "@/app/components/Common/EmptyState";
import Pagination from "./Pagination";

const PAGE_SIZE = 10;

type RatingCommentsPanelProps = {
    items: PluginRatingRow[];
    loading: boolean;
    ratingFilter: string;
    keyword: string;
    onRatingFilterChange: (value: string) => void;
    onKeywordChange: (value: string) => void;
    onReload: () => void;
    onOpenTextDialog: (title: string, content: string) => void;
};

export default function RatingCommentsPanel({ items, loading, ratingFilter, keyword, onRatingFilterChange, onKeywordChange, onReload, onOpenTextDialog }: RatingCommentsPanelProps) {
    const [page, setPage] = React.useState(1);
    const [pluginFilter, setPluginFilter] = React.useState("all");
    const [userFilter, setUserFilter] = React.useState("all");

    const pluginOptions = React.useMemo(() => {
        const map = new Map<string, string>();
        items.forEach((item) => {
            const plugin = getPluginFromRating(item);
            if (plugin) map.set(plugin.id, plugin.name);
        });
        return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
    }, [items]);

    const userOptions = React.useMemo(() => {
        const map = new Map<string, string>();
        items.forEach((item) => {
            const name = item.profile?.display_name || item.user_id;
            map.set(item.user_id, name);
        });
        return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
    }, [items]);

    const filteredItems = React.useMemo(() => {
        return items.filter((item) => {
            if (pluginFilter !== "all" && item.plugin_id !== pluginFilter) return false;
            if (userFilter !== "all" && item.user_id !== userFilter) return false;
            return true;
        });
    }, [items, pluginFilter, userFilter]);

    const pageData = React.useMemo(() => filteredItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filteredItems, page]);
    React.useEffect(() => { setPage(1); }, [filteredItems.length]);
    return (
        <Card className="!p-5 min-w-0">
            <Toolbar className="px-0 gap-3" style={{ flexWrap: "wrap" }}>
                <Text weight="semibold" size={500} style={{ marginRight: "auto" }}>
                    评分评论
                </Text>
                <Input value={keyword} placeholder="搜索插件、用户或评论" onChange={(_, data) => onKeywordChange(data.value)} />
                <Select value={pluginFilter} onChange={(_, data) => setPluginFilter(data.value)}>
                    <option value="all">全部插件</option>
                    {pluginOptions.map(([id, name]) => (
                        <option key={id} value={id}>{name}</option>
                    ))}
                </Select>
                <Select value={userFilter} onChange={(_, data) => setUserFilter(data.value)}>
                    <option value="all">全部用户</option>
                    {userOptions.map(([id, name]) => (
                        <option key={id} value={id}>{name}</option>
                    ))}
                </Select>
                <Select value={ratingFilter} onChange={(_, data) => onRatingFilterChange(data.value)}>
                    <option value="all">全部评分</option>
                    <option value="5">5 星</option>
                    <option value="4">4 星</option>
                    <option value="3">3 星</option>
                    <option value="2">2 星</option>
                    <option value="1">1 星</option>
                </Select>
                <ToolbarButton icon={<ArrowSyncRegular />} onClick={onReload} />
            </Toolbar>
            <Divider className="my-3" />
            <div className="overflow-x-auto">
                {loading ? (
                    <div className="py-12 flex justify-center">
                        <Spinner label="正在加载评分评论" />
                    </div>
                ) : filteredItems.length === 0 ? (
                    <EmptyState message="当前筛选条件下没有评分评论" />
                ) : (<><Table aria-label="评分评论表格" style={{ minWidth: 980 }}>
                        <TableHeader>
                            <TableRow>
                                <TableHeaderCell style={{ minWidth: 180 }}>插件</TableHeaderCell>
                                <TableHeaderCell style={{ minWidth: 160 }}>用户</TableHeaderCell>
                                <TableHeaderCell style={{ minWidth: 90 }}>评分</TableHeaderCell>
                                <TableHeaderCell style={{ minWidth: 220 }}>评论</TableHeaderCell>
                                <TableHeaderCell style={{ minWidth: 140 }}>创建时间</TableHeaderCell>
                                <TableHeaderCell style={{ minWidth: 140 }}>更新时间</TableHeaderCell>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pageData.map((item) => {
                                const plugin = getPluginFromRating(item);
                                return (
                                    <TableRow key={`${item.plugin_id}-${item.user_id}`}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <Text weight="semibold">{plugin?.name ?? item.plugin_id}</Text>
                                                <Text size={200} className="text-gray-500 dark:text-gray-400">
                                                    {item.plugin_id}
                                                </Text>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <Text>{item.profile?.display_name || "未设置昵称"}</Text>
                                                <Text size={200} className="text-gray-500 dark:text-gray-400">
                                                    {item.user_id}
                                                </Text>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge appearance="filled" color="warning">
                                                {item.rating} 星
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <CellWithDialog text={item.comment} label="评论内容" onOpen={onOpenTextDialog} />
                                        </TableCell>
                                        <TableCell>{formatTime(item.created_at)}</TableCell>
                                        <TableCell>{formatTime(item.updated_at)}</TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                    <Pagination current={page} total={filteredItems.length} pageSize={PAGE_SIZE} onChange={setPage} />
                    </>)}
            </div>
        </Card>
    );
}

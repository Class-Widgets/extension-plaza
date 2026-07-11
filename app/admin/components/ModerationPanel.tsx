"use client";

import * as React from "react";
import { Badge, Card, Divider, Select, Spinner, Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow, Text, Toolbar, ToolbarButton } from "@fluentui/react-components";
import { ArrowSyncRegular } from "@fluentui/react-icons";
import type { ModerationRequest } from "../types";
import { formatTime, getPluginFromRequest, moderationStatuses, statusAppearance } from "../utils";
import CellWithDialog from "./CellWithDialog";
import EmptyState from "@/app/components/Common/EmptyState";
import Pagination from "./Pagination";

const PAGE_SIZE = 10;

type ModerationPanelProps = {
    items: ModerationRequest[];
    loading: boolean;
    filter: string;
    onFilterChange: (value: string) => void;
    onReload: () => void;
    onOpenTextDialog: (title: string, content: string) => void;
    onOpenDetailDialog: (item: ModerationRequest) => void;
};

export default function ModerationPanel({ items, loading, filter, onFilterChange, onReload, onOpenTextDialog, onOpenDetailDialog }: ModerationPanelProps) {
    const [page, setPage] = React.useState(1);
    const pageData = React.useMemo(() => items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [items, page]);
    React.useEffect(() => { setPage(1); }, [items.length]);
    return (
        <Card className="!p-5 min-w-0">
            <Toolbar className="px-0 gap-3" style={{ flexWrap: "wrap" }}>
                <Text weight="semibold" size={500} style={{ marginRight: "auto" }}>
                    审核队列
                </Text>
                <Select value={filter} onChange={(_, data) => onFilterChange(data.value)}>
                    <option value="all">全部状态</option>
                    {moderationStatuses.map((status) => (
                        <option key={status} value={status}>
                            {status}
                        </option>
                    ))}
                </Select>
                <ToolbarButton icon={<ArrowSyncRegular />} onClick={onReload} />
            </Toolbar>
            <Divider className="my-3" />
            <div className="overflow-x-auto">
                {loading ? (
                    <div className="py-12 flex justify-center">
                        <Spinner label="正在加载审核请求" />
                    </div>
                ) : items.length === 0 ? (
                    <EmptyState message="当前筛选条件下没有审核请求" />
                ) : (<><Table aria-label="审核队列表格" style={{ minWidth: 900 }}>
                        <TableHeader>
                            <TableRow>
                                <TableHeaderCell style={{ minWidth: 180 }}>插件</TableHeaderCell>
                                <TableHeaderCell style={{ minWidth: 100 }}>请求类型</TableHeaderCell>
                                <TableHeaderCell style={{ minWidth: 100 }}>状态</TableHeaderCell>
                                <TableHeaderCell style={{ minWidth: 150 }}>提交说明</TableHeaderCell>
                                <TableHeaderCell style={{ minWidth: 150 }}>处理说明</TableHeaderCell>
                                <TableHeaderCell style={{ minWidth: 140 }}>创建时间</TableHeaderCell>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pageData.map((item) => {
                                const plugin = getPluginFromRequest(item);
                                return (
                                    <TableRow key={item.id} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800" onClick={() => onOpenDetailDialog(item)}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <Text weight="semibold">{plugin?.name ?? item.plugin_id}</Text>
                                                <Text size={200} className="text-gray-500 dark:text-gray-400">
                                                    {item.plugin_id}
                                                </Text>
                                            </div>
                                        </TableCell>
                                        <TableCell>{item.request_type}</TableCell>
                                        <TableCell>
                                            <Badge appearance="filled" color={statusAppearance(item.status)}>
                                                {item.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <CellWithDialog text={item.reason} label="提交说明" onOpen={onOpenTextDialog} />
                                        </TableCell>
                                        <TableCell>
                                            <CellWithDialog text={item.decided_reason} label="处理说明" onOpen={onOpenTextDialog} />
                                        </TableCell>
                                        <TableCell>{formatTime(item.created_at)}</TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                    <Pagination current={page} total={items.length} pageSize={PAGE_SIZE} onChange={setPage} />
                    </>)}
            </div>
        </Card>
    );
}

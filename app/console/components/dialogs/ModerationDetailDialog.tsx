"use client";

import * as React from "react";
import { Badge, Button, Dialog, DialogActions, DialogBody, DialogContent, DialogSurface, DialogTitle, Field, MessageBar, MessageBarBody, Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow, Text, Textarea } from "@fluentui/react-components";
import type { ModerationRequest, PluginRow } from "../../types";
import { formatTime, statusAppearance } from "../../utils";
import EmptyState from "@/app/components/Common/EmptyState";
import Pagination from "../Pagination";

const HISTORY_PAGE_SIZE = 5;

type ModerationDetailDialogProps = {
    open: boolean;
    plugin: PluginRow | null;
    requests: ModerationRequest[];
    resubmitReason: string;
    loading: boolean;
    onOpenChange: (open: boolean) => void;
    onResubmitReasonChange: (value: string) => void;
    onResubmit: (pluginId: string) => void;
};

export default function ModerationDetailDialog({ open, plugin, requests, resubmitReason, loading, onOpenChange, onResubmitReasonChange, onResubmit }: ModerationDetailDialogProps) {
    const latestRejected = requests.find((r) => r.status === "REJECTED");
    const canResubmit = plugin?.status === "hidden";
    const [historyPage, setHistoryPage] = React.useState(1);
    const pageData = React.useMemo(() => requests.slice((historyPage - 1) * HISTORY_PAGE_SIZE, historyPage * HISTORY_PAGE_SIZE), [requests, historyPage]);
    React.useEffect(() => { setHistoryPage(1); }, [requests.length]);

    return (
        <Dialog open={open} onOpenChange={(_, data) => onOpenChange(data.open)}>
            <DialogSurface style={{ maxWidth: 640 }}>
                <DialogTitle>审核记录 - {plugin?.name ?? plugin?.id}</DialogTitle>
                <DialogBody>
                    <DialogContent>
                        {plugin && (
                            <div className="mb-4">
                                <Text weight="semibold">插件信息</Text>
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    <Text size={200}>ID: {plugin.id}</Text>
                                    <Text size={200}>版本: {plugin.version}</Text>
                                    <Text size={200}>
                                        状态: <Badge appearance="filled" color={statusAppearance(plugin.status)}>{plugin.status}</Badge>
                                    </Text>
                                    <Text size={200}>
                                        仓库：<a href={plugin.repo_url} target="_blank" rel="noreferrer" className="hover:underline">{plugin.repo_url}</a>
                                    </Text>
                                </div>
                            </div>
                        )}

                        {latestRejected?.decided_reason && (
                            <MessageBar intent="warning" className="mb-4">
                                <MessageBarBody>
                                    <Text weight="semibold">拒绝原因：</Text>
                                    <Text>{latestRejected.decided_reason}</Text>
                                </MessageBarBody>
                            </MessageBar>
                        )}

                        <Text weight="semibold">审核历史</Text>
                        {requests.length === 0 ? (
                            <EmptyState message="暂无审核记录" />
                        ) : (
                            <div className="overflow-x-auto mt-2">
                                <Table aria-label="审核历史表" style={{ minWidth: 500 }}>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHeaderCell style={{ minWidth: 100 }}>类型</TableHeaderCell>
                                            <TableHeaderCell style={{ minWidth: 100 }}>状态</TableHeaderCell>
                                            <TableHeaderCell style={{ minWidth: 150 }}>提交说明</TableHeaderCell>
                                            <TableHeaderCell style={{ minWidth: 150 }}>处理说明</TableHeaderCell>
                                            <TableHeaderCell style={{ minWidth: 140 }}>时间</TableHeaderCell>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {pageData.map((req) => (
                                            <TableRow key={req.id}>
                                                <TableCell>{req.request_type}</TableCell>
                                                <TableCell>
                                                    <Badge appearance="filled" color={statusAppearance(req.status)}>{req.status}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Text size={200}>{req.reason || "-"}</Text>
                                                </TableCell>
                                                <TableCell>
                                                    <Text size={200}>{req.decided_reason || "-"}</Text>
                                                </TableCell>
                                                <TableCell>{formatTime(req.created_at)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                <Pagination current={historyPage} total={requests.length} pageSize={HISTORY_PAGE_SIZE} onChange={setHistoryPage} />
                            </div>
                        )}

                        {canResubmit && (
                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <Text weight="semibold">重新提交审核</Text>
                                <Field label="提交说明" className="mt-2">
                                    <Textarea
                                        value={resubmitReason}
                                        onChange={(_, data) => onResubmitReasonChange(data.value)}
                                        resize="vertical"
                                        placeholder="可选：说明本次修改内容"
                                    />
                                </Field>
                            </div>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button appearance="secondary" onClick={() => onOpenChange(false)}>
                            关闭
                        </Button>
                        {canResubmit && (
                            <Button appearance="primary" disabled={loading} onClick={() => plugin && onResubmit(plugin.id)}>
                                {loading ? "提交中..." : "重新提交"}
                            </Button>
                        )}
                    </DialogActions>
                </DialogBody>
            </DialogSurface>
        </Dialog>
    );
}

"use client";

import * as React from "react";
import { Badge, Button, Card, Dialog, DialogActions, DialogBody, DialogContent, DialogSurface, DialogTitle, Divider, RatingDisplay, Select, Spinner, Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow, Text, Textarea, Toolbar, ToolbarButton } from "@fluentui/react-components";
import { ArrowSyncRegular, CheckmarkRegular, DismissRegular } from "@fluentui/react-icons";
import type { PluginRatingRow } from "../types";
import { formatTime, getPluginFromRating, getProfileDisplayName, statusAppearance } from "../utils";
import EmptyState from "@/app/components/Common/EmptyState";
import Pagination from "./Pagination";

const PAGE_SIZE = 10;

const commentStatuses = ["pending", "published", "rejected"];

function commentStatusLabel(status: string) {
    if (status === "pending") return "待审核";
    if (status === "published") return "已公开";
    if (status === "rejected") return "已拒绝";
    return status;
}

type CommentModerationPanelProps = {
    items: PluginRatingRow[];
    loading: boolean;
    filter: string;
    onFilterChange: (value: string) => void;
    onReload: () => void;
    onReview: (item: PluginRatingRow, status: "published" | "rejected", reason?: string) => void;
};

export default function CommentModerationPanel({ items, loading, filter, onFilterChange, onReload, onReview }: CommentModerationPanelProps) {
    const [page, setPage] = React.useState(1);
    const [detailItem, setDetailItem] = React.useState<PluginRatingRow | null>(null);
    const [rejectTarget, setRejectTarget] = React.useState<PluginRatingRow | null>(null);
    const [rejectReason, setRejectReason] = React.useState("");
    const [rejectError, setRejectError] = React.useState<string | null>(null);
    const pageData = React.useMemo(() => items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [items, page]);
    React.useEffect(() => { setPage(1); }, [items.length]);

    const beginReject = (item: PluginRatingRow) => {
        setRejectTarget(item);
        setRejectReason("");
        setRejectError(null);
        setDetailItem(null);
    };

    const confirmReject = () => {
        if (!rejectTarget) return;
        const reason = rejectReason.trim();
        if (!reason) {
            setRejectError("请填写拒绝原因。");
            return;
        }
        onReview(rejectTarget, "rejected", reason);
        setRejectTarget(null);
        setRejectReason("");
    };

    return (
        <>
        <Card className="!p-5 min-w-0">
            <Toolbar className="px-0 gap-3" style={{ flexWrap: "wrap" }}>
                <Text weight="semibold" size={500} style={{ marginRight: "auto" }}>
                    评论审核队列
                </Text>
                <Select value={filter} onChange={(_, data) => onFilterChange(data.value)}>
                    <option value="all">全部状态</option>
                    {commentStatuses.map((status) => (
                        <option key={status} value={status}>
                            {commentStatusLabel(status)}
                        </option>
                    ))}
                </Select>
                <ToolbarButton icon={<ArrowSyncRegular />} onClick={onReload} />
            </Toolbar>
            <Divider className="my-3" />
            <div className="overflow-x-auto">
                {loading ? (
                    <div className="py-12 flex justify-center">
                        <Spinner label="正在加载评论审核队列" />
                    </div>
                ) : items.length === 0 ? (
                    <EmptyState message="当前筛选条件下没有评论" />
                ) : (<><Table aria-label="评论审核队列表格" style={{ minWidth: 1120 }}>
                        <TableHeader>
                            <TableRow>
                                <TableHeaderCell style={{ minWidth: 180 }}>插件</TableHeaderCell>
                                <TableHeaderCell style={{ minWidth: 150 }}>用户</TableHeaderCell>
                                <TableHeaderCell style={{ minWidth: 80 }}>评分</TableHeaderCell>
                                <TableHeaderCell style={{ minWidth: 240 }}>评论</TableHeaderCell>
                                <TableHeaderCell style={{ minWidth: 100 }}>审核状态</TableHeaderCell>
                                <TableHeaderCell style={{ minWidth: 140 }}>提交时间</TableHeaderCell>
                                <TableHeaderCell style={{ minWidth: 140 }}>审核时间</TableHeaderCell>
                                <TableHeaderCell style={{ minWidth: 150 }}>操作</TableHeaderCell>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pageData.map((item) => {
                                const plugin = getPluginFromRating(item);
                                return (
                                    <TableRow
                                        key={`${item.plugin_id}-${item.user_id}`}
                                        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                                        onClick={() => setDetailItem(item)}
                                    >
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
                                                <Text>{getProfileDisplayName(item.profile)}</Text>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <RatingDisplay
                                                value={item.rating}
                                                size="small"
                                                color="marigold"
                                                valueText={{ style: { display: "none" } }}
                                                aria-label={`${item.rating} 星`}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Text size={300} className="line-clamp-2">{item.comment}</Text>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                {item.comment_status && <Badge appearance="filled" color={statusAppearance(item.comment_status)}>
                                                    {commentStatusLabel(item.comment_status)}
                                                </Badge>}
                                                {item.comment_status === "rejected" && item.review_comment && (
                                                    <Text size={200} className="line-clamp-2 text-gray-500 dark:text-gray-400">
                                                        {item.review_comment}
                                                    </Text>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>{formatTime(item.comment_created_at || item.created_at)}</TableCell>
                                        <TableCell>{formatTime(item.reviewed_at)}</TableCell>
                                        <TableCell>
                                            {item.comment_status === "pending" && (
                                                <div className="flex gap-1" onClick={(event) => event.stopPropagation()}>
                                                    <Button appearance="primary" size="small" icon={<CheckmarkRegular />} disabled={loading} onClick={() => onReview(item, "published")}>通过</Button>
                                                    <Button appearance="secondary" size="small" icon={<DismissRegular />} disabled={loading} onClick={() => beginReject(item)}>拒绝</Button>
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                    <Pagination current={page} total={items.length} pageSize={PAGE_SIZE} onChange={setPage} />
                    </>)}
            </div>
        </Card>
        <Dialog open={Boolean(detailItem)} onOpenChange={(_, data) => { if (!data.open) setDetailItem(null); }}>
            <DialogSurface style={{ maxWidth: 640 }}>
                <DialogBody>
                    <DialogTitle>评论审核详情</DialogTitle>
                    <DialogContent className="!space-y-4">
                        {detailItem && (
                            <>
                                <div className="flex flex-wrap items-center gap-2">
                                    <Badge appearance="filled" color={statusAppearance(detailItem.comment_status || "pending")}>
                                        {commentStatusLabel(detailItem.comment_status || "pending")}
                                    </Badge>
                                    <RatingDisplay
                                        value={detailItem.rating}
                                        size="medium"
                                        color="marigold"
                                        valueText={{ style: { display: "none" } }}
                                        aria-label={`${detailItem.rating} 星`}
                                    />
                                </div>
                                <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
                                    <div className="min-w-0 space-y-1">
                                        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">插件</div>
                                        <div className="break-words text-sm font-semibold">{getPluginFromRating(detailItem)?.name ?? detailItem.plugin_id}</div>
                                        <div className="break-all text-xs text-gray-500 dark:text-gray-400">{detailItem.plugin_id}</div>
                                    </div>
                                    <div className="min-w-0 space-y-1">
                                        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">评论用户</div>
                                        <div className="break-words text-sm">{getProfileDisplayName(detailItem.profile)}</div>
                                        <div className="break-all text-xs text-gray-500 dark:text-gray-400">{detailItem.user_id}</div>
                                    </div>
                                    <div className="min-w-0 space-y-1">
                                        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">提交时间</div>
                                        <div className="text-sm">{formatTime(detailItem.comment_created_at || detailItem.created_at)}</div>
                                    </div>
                                    <div className="min-w-0 space-y-1">
                                        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">审核时间</div>
                                        <div className="text-sm">{formatTime(detailItem.reviewed_at)}</div>
                                    </div>
                                </div>
                                <Divider />
                                {detailItem.comment_status === "rejected" && (
                                    <div>
                                        <div className="mb-2 text-sm font-semibold">拒绝原因</div>
                                        <div className="whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-sm dark:bg-gray-800">
                                            {detailItem.review_comment || "未填写"}
                                        </div>
                                    </div>
                                )}
                                <div>
                                    <div className="mb-2 text-sm font-semibold">评论内容</div>
                                    <Textarea
                                        className="!w-full"
                                        value={detailItem.comment ?? ""}
                                        readOnly
                                        resize="vertical"
                                        aria-label="评论内容"
                                    />
                                </div>
                            </>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button appearance="secondary" onClick={() => setDetailItem(null)}>关闭</Button>
                        {detailItem?.comment_status === "pending" && (
                            <>
                                <Button appearance="secondary" icon={<DismissRegular />} disabled={loading} onClick={() => beginReject(detailItem)}>拒绝</Button>
                                <Button appearance="primary" icon={<CheckmarkRegular />} disabled={loading} onClick={() => {
                                    onReview(detailItem, "published");
                                    setDetailItem(null);
                                }}>通过</Button>
                            </>
                        )}
                    </DialogActions>
                </DialogBody>
            </DialogSurface>
        </Dialog>
        <Dialog open={Boolean(rejectTarget)} onOpenChange={(_, data) => {
            if (!data.open) {
                setRejectTarget(null);
                setRejectReason("");
                setRejectError(null);
            }
        }}>
            <DialogSurface style={{ maxWidth: 520 }}>
                <DialogBody>
                    <DialogTitle>拒绝评论</DialogTitle>
                    <DialogContent className="!space-y-3">
                        {rejectTarget && (
                            <div className="space-y-2">
                                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                                    插件：{getPluginFromRating(rejectTarget)?.name ?? rejectTarget.plugin_id}
                                    {" · "}
                                    用户：{rejectTarget.profile?.display_name?.trim() || rejectTarget.user_id}
                                </div>
                                <div className="text-sm font-semibold">评论原文</div>
                                <Textarea
                                    className="!w-full"
                                    value={rejectTarget.comment ?? ""}
                                    readOnly
                                    resize="vertical"
                                    aria-label="评论原文"
                                />
                            </div>
                        )}
                        <Text size={300}>拒绝后会将该评论标记为未通过，并通知评论作者。</Text>
                        <Textarea
                            className="!w-full"
                            value={rejectReason}
                            onChange={(_, data) => {
                                setRejectReason(data.value);
                                setRejectError(null);
                            }}
                            resize="vertical"
                            placeholder="请填写拒绝原因，作者将看到此说明"
                            aria-label="拒绝原因"
                        />
                        {rejectError && <Text size={200} className="text-red-600 dark:text-red-400">{rejectError}</Text>}
                    </DialogContent>
                    <DialogActions>
                        <Button appearance="secondary" onClick={() => setRejectTarget(null)}>取消</Button>
                        <Button appearance="primary" icon={<DismissRegular />} disabled={loading || !rejectReason.trim()} onClick={confirmReject}>确认拒绝</Button>
                    </DialogActions>
                </DialogBody>
            </DialogSurface>
        </Dialog>
        </>
    );
}

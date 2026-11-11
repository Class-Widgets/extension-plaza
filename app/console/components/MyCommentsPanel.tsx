"use client";

import * as React from "react";
import { Badge, Button, Card, Dialog, DialogActions, DialogBody, DialogContent, DialogSurface, DialogTitle, Divider, RatingDisplay, Spinner, Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow, Text, Textarea, Toolbar, ToolbarButton } from "@fluentui/react-components";
import { ArrowSyncRegular, OpenRegular } from "@fluentui/react-icons";
import type { MyCommentRow } from "../types";
import { formatTime, statusAppearance } from "../utils";
import EmptyState from "@/app/components/Common/EmptyState";
import Pagination from "./Pagination";

const PAGE_SIZE = 10;

function commentStatusLabel(status: string) {
    if (status === "pending") return "待审核";
    if (status === "published") return "已公开";
    if (status === "rejected") return "未通过";
    return status;
}

type MyCommentsPanelProps = {
    items: MyCommentRow[];
    loading: boolean;
    onReload: () => void;
};

export default function MyCommentsPanel({ items, loading, onReload }: MyCommentsPanelProps) {
    const [page, setPage] = React.useState(1);
    const [detailItem, setDetailItem] = React.useState<MyCommentRow | null>(null);
    const pageData = React.useMemo(() => items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [items, page]);
    React.useEffect(() => { setPage(1); }, [items.length]);

    return (
        <>
        <Card className="!p-5 min-w-0">
            <Toolbar className="px-0 gap-3" style={{ flexWrap: "wrap" }}>
                <Text weight="semibold" size={500} style={{ marginRight: "auto" }}>
                    我的评论
                </Text>
                <ToolbarButton icon={<ArrowSyncRegular />} onClick={onReload} />
            </Toolbar>
            <Divider className="my-3" />
            <div className="overflow-x-auto">
                {loading ? (
                    <div className="py-12 flex justify-center">
                        <Spinner label="正在加载我的评论" />
                    </div>
                ) : items.length === 0 ? (
                    <EmptyState message="你还没有提交过评论" />
                ) : (
                    <>
                        <Table aria-label="我的评论表格" style={{ minWidth: 980 }}>
                            <TableHeader>
                                <TableRow>
                                    <TableHeaderCell style={{ minWidth: 180 }}>插件</TableHeaderCell>
                                    <TableHeaderCell style={{ minWidth: 130 }}>评分</TableHeaderCell>
                                    <TableHeaderCell style={{ minWidth: 220 }}>评论</TableHeaderCell>
                                    <TableHeaderCell style={{ minWidth: 100 }}>审核状态</TableHeaderCell>
                                    <TableHeaderCell style={{ minWidth: 220 }}>审核说明</TableHeaderCell>
                                    <TableHeaderCell style={{ minWidth: 140 }}>提交时间</TableHeaderCell>
                                    <TableHeaderCell style={{ minWidth: 140 }}>审核时间</TableHeaderCell>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pageData.map((item) => (
                                    <TableRow
                                        key={`${item.plugin_id}-${item.user_id}`}
                                        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                                        onClick={() => setDetailItem(item)}
                                    >
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <Text weight="semibold">{item.plugin?.name ?? item.plugin_id}</Text>
                                                <Text size={200} className="text-gray-500 dark:text-gray-400">{item.plugin_id}</Text>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {typeof item.rating === "number" ? (
                                                <RatingDisplay
                                                    value={item.rating}
                                                    size="small"
                                                    color="marigold"
                                                    valueText={{ style: { display: "none" } }}
                                                    aria-label={`${item.rating} 星`}
                                                />
                                            ) : (
                                                <Text size={200} className="text-gray-500 dark:text-gray-400">已撤销</Text>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Text size={300} className="line-clamp-3 whitespace-pre-wrap">{item.content}</Text>
                                        </TableCell>
                                        <TableCell>
                                            <Badge appearance="filled" color={statusAppearance(item.status)}>
                                                {commentStatusLabel(item.status)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Text size={300} className="line-clamp-3 whitespace-pre-wrap">
                                                {item.review_comment || "-"}
                                            </Text>
                                        </TableCell>
                                        <TableCell>{formatTime(item.created_at)}</TableCell>
                                        <TableCell>{formatTime(item.reviewed_at)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <Pagination current={page} total={items.length} pageSize={PAGE_SIZE} onChange={setPage} />
                    </>
                )}
            </div>
        </Card>
        <Dialog open={Boolean(detailItem)} onOpenChange={(_, data) => { if (!data.open) setDetailItem(null); }}>
            <DialogSurface style={{ maxWidth: 640 }}>
                <DialogBody>
                    <DialogTitle>评论详情</DialogTitle>
                    <DialogContent className="!space-y-4">
                        {detailItem && (
                            <>
                                <div className="flex flex-wrap items-center gap-2">
                                    <Badge appearance="filled" color={statusAppearance(detailItem.status)}>
                                        {commentStatusLabel(detailItem.status)}
                                    </Badge>
                                    {typeof detailItem.rating === "number" ? (
                                        <RatingDisplay
                                            value={detailItem.rating}
                                            size="medium"
                                            color="marigold"
                                            valueText={{ style: { display: "none" } }}
                                            aria-label={`${detailItem.rating} 星`}
                                        />
                                    ) : (
                                        <Text size={200} className="text-gray-500 dark:text-gray-400">评分已撤销</Text>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
                                    <div className="min-w-0 space-y-1">
                                        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">插件</div>
                                        <div className="break-words text-sm font-semibold">{detailItem.plugin?.name ?? detailItem.plugin_id}</div>
                                        <div className="break-all text-xs text-gray-500 dark:text-gray-400">{detailItem.plugin_id}</div>
                                    </div>
                                    <div className="min-w-0 space-y-1">
                                        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">提交时间</div>
                                        <div className="text-sm">{formatTime(detailItem.created_at)}</div>
                                    </div>
                                    <div className="min-w-0 space-y-1">
                                        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">审核时间</div>
                                        <div className="text-sm">{formatTime(detailItem.reviewed_at)}</div>
                                    </div>
                                </div>
                                <Divider />
                                <div>
                                    <div className="mb-2 text-sm font-semibold">评论原文</div>
                                    <Textarea
                                        className="!w-full"
                                        value={detailItem.content}
                                        readOnly
                                        resize="vertical"
                                        aria-label="评论原文"
                                    />
                                </div>
                                {detailItem.status === "rejected" && (
                                    <div>
                                        <div className="mb-2 text-sm font-semibold">拒绝原因</div>
                                        <div className="whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-sm dark:bg-gray-800">
                                            {detailItem.review_comment || "未填写"}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </DialogContent>
                    <DialogActions>
                        {detailItem && (
                            <Button
                                as="a"
                                appearance="secondary"
                                href={`/plugins/${encodeURIComponent(detailItem.plugin_id)}`}
                                disabled={detailItem.plugin?.status !== "published"}
                                icon={<OpenRegular />}
                            >
                                在“插件广场”打开
                            </Button>
                        )}
                        <Button appearance="secondary" onClick={() => setDetailItem(null)}>关闭</Button>
                    </DialogActions>
                </DialogBody>
            </DialogSurface>
        </Dialog>
        </>
    );
}

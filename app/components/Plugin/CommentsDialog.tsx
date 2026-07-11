"use client";

import * as React from "react";
import { Button, Dialog, DialogBody, DialogContent, DialogSurface, DialogTitle, Select } from "@fluentui/react-components";
import { DismissRegular } from "@fluentui/react-icons";
import EmptyState from "@/app/components/Common/EmptyState";
import Pagination from "@/app/components/Common/Pagination";
import PluginReviewItem, { type PluginReview } from "@/app/components/Plugin/PluginReviewItem";

export type { PluginReview } from "@/app/components/Plugin/PluginReviewItem";

type CommentSort = "recent" | "highest" | "lowest" | "helpful";

type CommentsDialogProps = {
    open: boolean;
    reviews: PluginReview[];
    onOpenChange: (open: boolean) => void;
};

const reviewsPerPage = 5;

export default function CommentsDialog({ open, reviews, onOpenChange }: CommentsDialogProps) {
    const [sort, setSort] = React.useState<CommentSort>("recent");
    const [currentPage, setCurrentPage] = React.useState(1);

    const sortedReviews = React.useMemo(() => reviews.filter((review) => review.comment).sort((a, b) => {
        if (sort === "highest") return b.rating - a.rating || new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        if (sort === "lowest") return a.rating - b.rating || new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }), [reviews, sort]);

    const totalPages = Math.ceil(sortedReviews.length / reviewsPerPage);
    const pageReviews = sortedReviews.slice((currentPage - 1) * reviewsPerPage, currentPage * reviewsPerPage);

    React.useEffect(() => {
        setCurrentPage(1);
    }, [sort, reviews.length]);

    return (
        <Dialog open={open} onOpenChange={(_, data) => onOpenChange(data.open)}>
            <DialogSurface className="!w-[min(92vw,680px)]" style={{ maxWidth: 680, maxHeight: "82vh" }}>
                <DialogBody className="!flex !min-h-0 !flex-col">
                    <div className="flex items-start justify-between gap-4">
                        <DialogTitle className="!pr-0 !text-[22px] !font-semibold">评分和评价</DialogTitle>
                        <Button appearance="subtle" icon={<DismissRegular />} aria-label="关闭" size="small" onClick={() => onOpenChange(false)} />
                    </div>
                    <DialogContent className="!min-h-0 !space-y-5 !overflow-y-auto !pt-5 !pb-1">
                        <div className="flex justify-end">
                            <Select value={sort} onChange={(event) => setSort(event.target.value as CommentSort)} aria-label="评论排序方式">
                                <option value="recent">最近</option>
                                <option value="highest">最高评分</option>
                                <option value="lowest">最低评分</option>
                                <option value="helpful">最有帮助</option>
                            </Select>
                        </div>
                        {pageReviews.length ? (
                            <div className="space-y-5">
                                {pageReviews.map((review) => (
                                    <PluginReviewItem key={review.user_id} review={review} />
                                ))}
                            </div>
                        ) : <EmptyState className="!shadow-none" message="当前还没有用户留下文字评价" />}
                    </DialogContent>
                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} className="pt-4" />
                </DialogBody>
            </DialogSurface>
        </Dialog>
    );
}

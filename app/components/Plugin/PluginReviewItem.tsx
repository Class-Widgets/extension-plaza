import { Badge, Button, Card, Rating, Text, Tooltip } from "@fluentui/react-components";
import { FlagRegular } from "@fluentui/react-icons";

export type PluginReview = {
    user_id: string;
    rating: number;
    comment: string | null;
    comment_status?: "pending" | "published" | "rejected" | null;
    review_comment?: string | null;
    created_at: string;
    updated_at: string;
    comment_created_at?: string | null;
    comment_updated_at?: string | null;
    profile?: { display_name?: string | null } | null;
};

type PluginReviewItemProps = {
    review: PluginReview;
    compact?: boolean;
    onReport?: (review: PluginReview) => void;
    ownComment?: boolean;
};

function formatReviewDate(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "short", day: "numeric" }).format(date);
}

export default function PluginReviewItem({ review, compact = false, onReport, ownComment = false }: PluginReviewItemProps) {
    const isPending = review.comment_status === "pending";
    const isRejected = review.comment_status === "rejected";
    return (
        <article className={compact ? "space-y-2.5 border-b border-gray-200 py-4 first:pt-0 last:border-b-0 last:pb-0 dark:border-gray-700" : "space-y-2.5 border-b border-gray-200 pb-5 last:border-b-0 dark:border-gray-700"}>
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <Text weight="semibold">{ownComment ? "我的评论" : review.profile?.display_name || "匿名用户"}</Text>
                    {isPending && <Tooltip content="仅你可见，审核通过后会公开展示。" relationship="description">
                        <Badge appearance="filled" color="warning">待审核</Badge>
                    </Tooltip>}
                    {isRejected && <Tooltip content="此评论未通过审核，仅你可见。" relationship="description">
                        <Badge appearance="filled" color="danger">未通过</Badge>
                    </Tooltip>}
                </div>
                <div className="flex items-center gap-1">
                    <Text size={200} className="shrink-0 text-gray-500 dark:text-gray-400">{formatReviewDate(review.comment_created_at || review.created_at)}</Text>
                    {onReport && review.comment_status !== "pending" && review.comment_status !== "rejected" && <Button appearance="subtle" size="small" icon={<FlagRegular />} aria-label="举报此评论" title="举报此评论" onClick={() => onReport(review)} />}
                </div>
            </div>
            {isRejected && review.review_comment && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 dark:border-red-900 dark:bg-red-950">
                    <Text size={200} weight="semibold">未通过原因：</Text>
                    <Text size={200}>{review.review_comment}</Text>
                </div>
            )}
            <Rating value={review.rating} size="medium" color="marigold" className="pointer-events-none" aria-label={`${review.rating} 星评分`} />
            {review.comment && <Text size={300} className={compact ? "block line-clamp-2 whitespace-pre-wrap" : "block whitespace-pre-wrap"}>{review.comment}</Text>}
        </article>
    );
}

export function PluginOwnReviewCard({ review, onReport }: Omit<PluginReviewItemProps, "compact" | "ownComment">) {
    return (
        <Card appearance="filled-alternative" size="small" className="!mx-0 !px-4 md:!-mx-4" style={{ borderRadius: 8, boxShadow: "none" }}>
            <PluginReviewItem review={review} compact ownComment onReport={onReport} />
        </Card>
    );
}

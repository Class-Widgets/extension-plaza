import { Button, Rating, Text } from "@fluentui/react-components";
import { FlagRegular } from "@fluentui/react-icons";

export type PluginReview = {
    user_id: string;
    rating: number;
    comment: string | null;
    created_at: string;
    updated_at: string;
    profile?: { display_name?: string | null } | null;
};

type PluginReviewItemProps = {
    review: PluginReview;
    compact?: boolean;
    onReport?: (review: PluginReview) => void;
};

function formatReviewDate(value: string) {
    return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "short", day: "numeric" }).format(new Date(value));
}

export default function PluginReviewItem({ review, compact = false, onReport }: PluginReviewItemProps) {
    return (
        <article className={compact ? "space-y-2.5 border-b border-gray-200 py-4 first:pt-0 last:border-b-0 last:pb-0 dark:border-gray-700" : "space-y-2.5 border-b border-gray-200 pb-5 last:border-b-0 dark:border-gray-700"}>
            <div className="flex items-center justify-between gap-3">
                <Text weight="semibold">{review.profile?.display_name || "匿名用户"}</Text>
                <div className="flex items-center gap-1">
                    <Text size={200} className="shrink-0 text-gray-500 dark:text-gray-400">{formatReviewDate(review.created_at)}</Text>
                    {onReport && <Button appearance="subtle" size="small" icon={<FlagRegular />} aria-label="举报此评论" title="举报此评论" onClick={() => onReport(review)} />}
                </div>
            </div>
            <Rating value={review.rating} size="medium" color="marigold" className="pointer-events-none" aria-label={`${review.rating} 星评分`} />
            <Text size={300} className={compact ? "block line-clamp-2 whitespace-pre-wrap" : "block whitespace-pre-wrap"}>{review.comment}</Text>
        </article>
    );
}

"use client";

import { Button, Dialog, DialogActions, DialogBody, DialogContent, DialogSurface, DialogTitle, Divider, MessageBar, MessageBarBody, Rating, Text, Textarea } from "@fluentui/react-components";
import { DismissRegular } from "@fluentui/react-icons";

type RatingDialogProps = {
    open: boolean;
    pluginName: string;
    rating: number;
    comment: string;
    submitting: boolean;
    error: string | null;
    onOpenChange: (open: boolean) => void;
    onRatingChange: (rating: number) => void;
    onCommentChange: (comment: string) => void;
    onSubmit: () => void;
};

export default function RatingDialog({ open, pluginName, rating, comment, submitting, error, onOpenChange, onRatingChange, onCommentChange, onSubmit }: RatingDialogProps) {
    return (
        <Dialog open={open} onOpenChange={(_, data) => onOpenChange(data.open)}>
            <DialogSurface className="!w-[min(92vw,520px)]" style={{ maxWidth: 520 }}>
                <DialogBody className="!flex !flex-col">
                    <div className="flex items-start justify-between gap-4">
                        <DialogTitle className="!pr-0 !text-[22px] !font-semibold">评论 {pluginName}</DialogTitle>
                        <Button appearance="subtle" icon={<DismissRegular />} aria-label="关闭" size="small" onClick={() => onOpenChange(false)} />
                    </div>
                    <DialogContent className="!space-y-5 !pt-5 !pb-4">
                        <Rating value={rating} onChange={(_, data) => onRatingChange(data.value)} size="large" aria-label="选择评分" />
                        <Divider />
                        <div className="space-y-2">
                            <Text weight="semibold">描述</Text>
                            <Textarea className="w-full" value={comment} onChange={(_, data) => onCommentChange(data.value.slice(0, 64))} maxLength={64} resize="vertical" placeholder="与此应用共享体验(可选)" aria-label="评论内容" />
                            <Text size={200} className="block text-right text-gray-500 dark:text-gray-400">{comment.length}/64</Text>
                        </div>
                        {error && <MessageBar intent="error"><MessageBarBody>{error}</MessageBarBody></MessageBar>}
                    </DialogContent>
                    <DialogActions className="!grid !grid-cols-2 !gap-2 !pt-0">
                        <Button className="!w-full" appearance="primary" disabled={!rating || submitting} onClick={onSubmit}>{submitting ? "提交中" : "提交"}</Button>
                        <Button className="!w-full" appearance="secondary" onClick={() => onOpenChange(false)}>关闭</Button>
                    </DialogActions>
                </DialogBody>
            </DialogSurface>
        </Dialog>
    );
}

"use client";

import { Badge, Button, Dialog, DialogActions, DialogBody, DialogContent, DialogSurface, DialogTitle, Field, Text, Textarea } from "@fluentui/react-components";
import { CheckmarkCircleRegular, DismissCircleRegular } from "@fluentui/react-icons";
import type { ModerationRequest } from "../../types";
import { formatTime, getPluginFromRequest, statusAppearance } from "../../utils";
import CellWithDialog from "../CellWithDialog";

type ModerationActionDialogProps = {
    open: boolean;
    item: ModerationRequest | null;
    decisionReason: string;
    loading: boolean;
    onOpenChange: (open: boolean) => void;
    onDecisionReasonChange: (value: string) => void;
    onApprove: () => void;
    onReject: () => void;
    onOpenTextDialog: (title: string, content: string) => void;
};

export default function ModerationActionDialog({ open, item, decisionReason, loading, onOpenChange, onDecisionReasonChange, onApprove, onReject, onOpenTextDialog }: ModerationActionDialogProps) {
    if (!item) return null;
    const plugin = getPluginFromRequest(item);
    const isPending = item.status === "PENDING";

    return (
        <Dialog open={open} onOpenChange={(_, data) => onOpenChange(data.open)}>
            <DialogSurface style={{ maxWidth: 640 }}>
                <DialogTitle>审核详情</DialogTitle>
                <DialogBody>
                    <DialogContent>
                        <div className="mb-4">
                            <Text weight="semibold">插件信息</Text>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                <Text size={200}>插件: {plugin?.name ?? item.plugin_id}</Text>
                                <Text size={200}>类型: {item.request_type}</Text>
                                <Text size={200}>
                                    状态: <Badge appearance="filled" color={statusAppearance(item.status)}>{item.status}</Badge>
                                </Text>
                                <Text size={200}>提交时间: {formatTime(item.created_at)}</Text>
                            </div>
                        </div>

                        <div className="mb-4">
                            <Text weight="semibold">提交说明</Text>
                            <CellWithDialog text={item.reason} label="提交说明" onOpen={onOpenTextDialog} />
                        </div>

                        {item.decided_reason && (
                            <div className="mb-4">
                                <Text weight="semibold">处理说明</Text>
                                <CellWithDialog text={item.decided_reason} label="处理说明" onOpen={onOpenTextDialog} />
                            </div>
                        )}

                        {isPending && (
                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <Field label="处理说明">
                                    <Textarea
                                        value={decisionReason}
                                        onChange={(_, data) => onDecisionReasonChange(data.value)}
                                        resize="vertical"
                                        placeholder="可选：填写审核原因"
                                    />
                                </Field>
                            </div>
                        )}
                    </DialogContent>
                    <DialogActions>
                        {isPending && (
                            <>
                                <Button appearance="primary" icon={<CheckmarkCircleRegular />} disabled={loading} onClick={onApprove}>
                                    通过
                                </Button>
                                <Button appearance="secondary" icon={<DismissCircleRegular />} disabled={loading} onClick={onReject}>
                                    拒绝
                                </Button>
                            </>
                        )}
                    </DialogActions>
                </DialogBody>
            </DialogSurface>
        </Dialog>
    );
}

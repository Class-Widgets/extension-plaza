"use client";

import { Button, Dialog, DialogActions, DialogBody, DialogContent, DialogSurface, DialogTitle, Text } from "@fluentui/react-components";

type TextDialogProps = {
    open: boolean;
    title: string;
    content: string;
    onOpenChange: (open: boolean) => void;
};

export default function TextDialog({ open, title, content, onOpenChange }: TextDialogProps) {
    return (
        <Dialog open={open} onOpenChange={(_, data) => onOpenChange(data.open)}>
            <DialogSurface>
                <DialogTitle>{title}</DialogTitle>
                <DialogBody>
                    <DialogContent>
                        <Text style={{ whiteSpace: "pre-wrap" }}>{content || "(无内容)"}</Text>
                    </DialogContent>
                    <DialogActions>
                        <Button appearance="secondary" onClick={() => onOpenChange(false)}>
                            关闭
                        </Button>
                    </DialogActions>
                </DialogBody>
            </DialogSurface>
        </Dialog>
    );
}

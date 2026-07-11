"use client";

import { Text } from "@fluentui/react-components";

type CellWithDialogProps = {
    text: string | null;
    label: string;
    onOpen: (title: string, content: string) => void;
};

export default function CellWithDialog({ text, label, onOpen }: CellWithDialogProps) {
    const display = text ? (text.length > 30 ? text.slice(0, 30) + "..." : text) : "-";
    return (
        <div
            onClick={() => onOpen(label, text || "")}
            style={{ cursor: "pointer", padding: "4px 8px", borderRadius: 4, minHeight: 24 }}
            title="点击查看完整内容"
        >
            <Text size={200} style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                {display}
            </Text>
        </div>
    );
}

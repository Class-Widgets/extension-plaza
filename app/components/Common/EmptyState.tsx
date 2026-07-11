import * as React from "react";
import { Text } from "@fluentui/react-components";
import { FolderSearchRegular } from "@fluentui/react-icons";

export interface EmptyStateProps {
    message?: string;
    className?: string;
}

export default function EmptyState({ message, className }: EmptyStateProps) {
    return (
        <div
            role="status"
            className={`flex flex-col items-center justify-center gap-3 px-6 py-10 text-center ${className ?? ""}`}
        >
            <FolderSearchRegular
                style={{ fontSize: 32, color: "var(--colorNeutralForeground4)" }}
                aria-hidden="true"
            />
            <Text size={400} weight="semibold">暂无数据</Text>
            <Text size={200} className="text-gray-500 dark:text-gray-400 max-w-md">
                {message ?? "当前没有可用的数据"}
            </Text>
        </div>
    );
}

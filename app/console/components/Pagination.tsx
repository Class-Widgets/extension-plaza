"use client";

import * as React from "react";
import { Button, Text } from "@fluentui/react-components";
import { ChevronLeftRegular, ChevronRightRegular } from "@fluentui/react-icons";

type PaginationProps = {
    current: number;
    total: number;
    pageSize: number;
    onChange: (page: number) => void;
};

export default function Pagination({ current, total, pageSize, onChange }: PaginationProps) {
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    if (totalPages <= 1) return null;

    return (
        <div className="flex items-center justify-between mt-4">
            <Text size={200} className="text-gray-500 dark:text-gray-400">
                {"共 " + total + " 条，第 " + current + "/" + totalPages + " 页"}
            </Text>
            <div className="flex items-center gap-1">
                <Button
                    size="small"
                    appearance="subtle"
                    icon={<ChevronLeftRegular />}
                    disabled={current <= 1}
                    onClick={function() { onChange(current - 1); }}
                />
                <Text size={200} className="px-2">
                    {current + ""}
                </Text>
                <Button
                    size="small"
                    appearance="subtle"
                    icon={<ChevronRightRegular />}
                    disabled={current >= totalPages}
                    onClick={function() { onChange(current + 1); }}
                />
            </div>
        </div>
    );
}

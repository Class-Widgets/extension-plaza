import * as React from "react";
import { Button, Card, Text } from "@fluentui/react-components";
import { ArrowClockwiseRegular, ErrorCircleRegular } from "@fluentui/react-icons";

export interface ErrorStateProps {
    status?: number;
    message?: string;
    onRetry?: () => void;
    className?: string;
}

export default function ErrorState({ status, message, onRetry, className }: ErrorStateProps) {
    const title = status
        ? `请求失败 (${status})`
        : "加载失败";
    const description = message
        ? (status ? `${status} · ${message}` : message)
        : (status ? `服务器返回了 ${status} 状态码` : "数据获取失败，请稍后重试");

    return (
        <Card
            role="alert"
            aria-live="polite"
            appearance="filled"
            className={`flex flex-col items-center justify-center gap-3 px-6 py-10 text-center ${className ?? ""}`}
        >
            <ErrorCircleRegular
                style={{ fontSize: 32, color: "var(--colorPaletteRedForeground1)" }}
                aria-hidden="true"
            />
            <Text size={400} weight="semibold">{title}</Text>
            <Text size={200} className="text-gray-500 dark:text-gray-400 max-w-md">
                {description}
            </Text>
            {onRetry && (
                <Button
                    appearance="subtle"
                    icon={<ArrowClockwiseRegular />}
                    onClick={onRetry}
                    className="mt-2"
                >
                    重试
                </Button>
            )}
        </Card>
    );
}

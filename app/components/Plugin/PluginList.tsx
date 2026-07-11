"use client";
import * as React from "react";
import PluginCard from "@/app/components/Plugin/PluginCard";
import { Spinner } from "@fluentui/react-components";
import ErrorState from "@/app/components/Common/ErrorState";
import EmptyState from "@/app/components/Common/EmptyState";

export interface PluginListProps {
    plugins: any[];
    loading?: boolean;
    error?: { status?: number; message?: string } | null;
    onRetry?: () => void;
}

export default function PluginList({ plugins, loading, error, onRetry }: PluginListProps) {
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Spinner size="large" />
            </div>
        );
    }

    if (error) {
        return (
            <ErrorState
                status={error.status}
                message={error.message}
                onRetry={onRetry}
            />
        );
    }

    if (!plugins || plugins.length === 0) {
        return (
            <EmptyState message="当前没有可用的插件" />
        );
    }

    return (
        <div className="flex flex-col gap-3">
            {plugins.map((plugin) => (
                <div key={plugin.id}>
                    <PluginCard plugin={plugin} />
                </div>
            ))}
        </div>
    );
}

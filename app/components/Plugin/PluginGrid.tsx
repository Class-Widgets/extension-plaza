"use client";
import PluginCard from "@/app/components/Plugin/PluginCard";
import { Card, Text, Spinner } from "@fluentui/react-components";
import ErrorState from "@/app/components/Common/ErrorState";
import EmptyState from "@/app/components/Common/EmptyState";

export interface PluginGridProps {
    plugins: any[];
    loading?: boolean;
    error?: { status?: number; message?: string } | null;
    onRetry?: () => void;
}

export default function PluginGrid({ plugins, loading, error, onRetry }: PluginGridProps) {
    if (loading) {
        return (
            <Card appearance="filled" className="flex flex-col items-center justify-center py-16 gap-3">
                <Spinner size="large" />
            </Card>
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
        return <EmptyState message="当前没有可用的插件" />;
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {plugins.map((plugin: any) => (
                <div key={plugin.id}>
                    <PluginCard plugin={plugin} />
                </div>
            ))}
        </div>
    );
}

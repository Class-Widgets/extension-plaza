"use client";
import * as React from "react";
import { useParams } from "next/navigation";
import { Text, Card, Divider, Spinner, Button } from "@fluentui/react-components";
import { PersonRegular, ClockRegular } from "@fluentui/react-icons";
import PluginGrid from "@/app/components/Plugin/PluginGrid";

export default function AuthorPage() {
    const { authorId } = useParams<{ authorId: string }>();
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [author, setAuthor] = React.useState<any>(null);
    const [plugins, setPlugins] = React.useState<any[]>([]);

    const load = React.useCallback(() => {
        setLoading(true);
        setError(null);
        fetch(`/api/authors/${authorId}`)
            .then(async (r) => {
                if (!r.ok) throw { status: r.status };
                const json = await r.json();
                if (!json.ok) throw { message: json.error };
                setAuthor(json.data.author);
                setPlugins(json.data.plugins);
                setLoading(false);
            })
            .catch((e) => {
                setError(e?.message || `加载失败 (${e?.status || '未知'})`);
                setLoading(false);
            });
    }, [authorId]);

    React.useEffect(() => {
        load();
    }, [load]);

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto px-4 py-16 flex flex-col items-center justify-center gap-4">
                <Spinner size="huge" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-6xl mx-auto px-4 py-8">
                <Card className="!p-4 sm:!p-8 !gap-2" style={{ boxShadow: "none" }}>
                    <Text weight="semibold" size={500} style={{ color: "var(--colorPaletteRedForeground1)" }}>
                        {error}
                    </Text>
                    <div className="pt-2">
                        <Button appearance="subtle" onClick={load}>重试</Button>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col gap-6">
            {/* 作者信息卡片 */}
            <Card className="!p-4 sm:!p-8 !gap-0">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                        <PersonRegular style={{ fontSize: 28, color: "var(--colorBrandForeground1)" }} />
                    </div>
                    <div>
                        <Text weight="semibold" size={700}>{author?.display_name || authorId}</Text>
                        <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                            <ClockRegular style={{ fontSize: 14 }} />
                            <Text size={200}>
                                {author?.created_at
                                    ? `加入于 ${new Date(author.created_at).toLocaleDateString()}`
                                    : ''}
                            </Text>
                        </div>
                    </div>
                </div>
            </Card>

            {/* 投稿插件 */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <Text weight="semibold" size={500}>
                        投稿的插件 ({plugins.length})
                    </Text>
                </div>
                {plugins.length === 0 ? (
                    <Card className="!p-4 sm:!p-8 !gap-0" style={{ boxShadow: "none" }}>
                        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                            <Text size={400}>暂无投稿</Text>
                            <Text size={200} className="mt-2">该用户尚未投稿任何插件</Text>
                        </div>
                    </Card>
                ) : (
                    <PluginGrid plugins={plugins} />
                )}
            </div>
        </div>
    );
}

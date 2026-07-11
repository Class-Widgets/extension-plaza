"use client";
import * as React from "react";
import dynamic from "next/dynamic";
import { Spinner } from "@fluentui/react-components";
const Banner = dynamic(() => import("@/app/components/Store/Banner"), { ssr: false });
import Section from "@/app/components/Common/Section";
import PluginGrid from "@/app/components/Plugin/PluginGrid";
import EmptyState from "@/app/components/Common/EmptyState";
import TagShowcase from "@/app/components/Store/TagShowcase";

export default function StoreHome() {
  const [plugins, setPlugins] = React.useState<any[]>([]);
  const [tags, setTags] = React.useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<{ status?: number; message?: string } | null>(null);
  const loadPlugins = React.useCallback(() => {
    setLoading(true);
    setError(null);
    fetch("/api/plugins/popular?per_page=50")
      .then(async (r) => {
        if (!r.ok) {
          let detail = "";
          try {
            const body = await r.json();
            detail = body?.error || "";
          } catch {
            /* noop */
          }
          throw { status: r.status, message: detail || r.statusText || "请求失败" };
        }
        return r.json();
      })
      .then((json) => {
        if (json?.ok === false) {
          throw { status: json.status, message: json.error || "接口返回错误" };
        }
        setPlugins(Array.isArray(json.data) ? json.data : []);
        setError(null);
        setLoading(false);
      })
      .catch((e) => {
        setPlugins([]);
        setError({
          status: e?.status,
          message: e?.message || "网络异常，请检查连接后重试",
        });
        setLoading(false);
      });
  }, []);

  React.useEffect(() => {
    loadPlugins();
    fetch('/api/plugins/tags')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((json) => {
        const data = json?.data;
        const list = Array.isArray(data)
          ? data.map((tag: any) => ({ id: String(tag.id ?? tag.name), name: String(tag.name ?? tag.id) }))
          : Object.entries(data || {}).map(([id, value]: any) => ({ id, name: String(value?.name ?? value ?? id) }));
        setTags(list);
      })
      .catch(() => setTags([]));
  }, [loadPlugins]);

  const recommend = plugins.slice(0, 6);
  const topTags = React.useMemo(() => {
    return tags
      .map((tag) => ({
        tag,
        plugins: plugins.filter((plugin) => Array.isArray(plugin?.tags) && (plugin.tags as any[]).some((t) => t.name === tag.name)),
      }))
      .filter((item) => item.plugins.length > 0)
      .sort((a, b) => b.plugins.length - a.plugins.length)
      .slice(0, 5);
  }, [plugins, tags]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Spinner size="huge" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col gap-6">
      <Banner plugins={plugins} />
      <Section title="为你推荐" moreHref="/plugins">
        {recommend.length > 0 ? <PluginGrid plugins={recommend} error={error} onRetry={loadPlugins} showRating /> : <EmptyState message="暂无推荐内容" />}
      </Section>

      <TagShowcase sections={topTags.map(({ tag, plugins }) => ({ tag, plugins: plugins.slice(0, 8), total: plugins.length }))} showRating />
    </div>
  );
}

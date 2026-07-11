// app/plugins/page.tsx
"use client";
import * as React from "react";
import { Text } from "@fluentui/react-components";
import PluginGrid from "@/app/components/Plugin/PluginGrid";
import Pagination from "@/app/components/Common/Pagination";
import FilterToolbar from "@/app/components/Common/FilterToolbar";

type PluginItem = Record<string, unknown>;
type TagItem = { id: string; name: string };

const sortLabels: Record<string, string> = {
  latest: "最新发布",
  name: "名称排序",
  rating: "评分排序",
  downloads: "下载量排序",
};

export default function PluginsPage() {
  const [plugins, setPlugins] = React.useState<PluginItem[]>([]);
  const [tags, setTags] = React.useState<TagItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<{ status?: number; message?: string } | null>(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalPlugins, setTotalPlugins] = React.useState(0);
  const [activeTag, setActiveTag] = React.useState<string>("");
  const [sort, setSort] = React.useState<string>("latest");

  const fetchPlugins = React.useCallback((page: number) => {
    setLoading(true);
    setError(null);
    const url = new URL(activeTag ? "/api/plugins/category" : "/api/plugins", window.location.origin);
    url.searchParams.set("page", String(page));
    url.searchParams.set("per_page", "12");
    url.searchParams.set("sort", sort);
    if (activeTag) {
      url.searchParams.set("tag", activeTag);
    }
    fetch(url.toString())
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
        if (json.ok) {
          setPlugins(Array.isArray(json.data) ? json.data : []);
          setTotalPages(json.meta.total_pages || 1);
          setTotalPlugins(json.meta.total || 0);
          setCurrentPage(page);
          setError(null);
        } else {
          setPlugins([]);
          setTotalPages(1);
          setTotalPlugins(0);
        }
        setLoading(false);
      })
      .catch((e) => {
        setPlugins([]);
        setTotalPages(1);
        setTotalPlugins(0);
        setError({
          status: e?.status,
          message: e?.message || "网络异常，请检查连接后重试",
        });
        setLoading(false);
      });
  }, [activeTag, sort]);

  React.useEffect(() => {
    fetchPlugins(currentPage);
  }, [currentPage, fetchPlugins]);

  React.useEffect(() => {
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
  }, []);

  const selectTag = (tagId: string) => {
    setActiveTag(tagId);
    setCurrentPage(1);
  };

  return (
    <section className="max-w-6xl mx-auto px-4 py-6 flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Text as="h1" size={700} weight="semibold">浏览插件</Text>
        <Text size={300} className="text-gray-500">共 {totalPlugins} 个插件</Text>
      </div>

      <FilterToolbar
        ariaLabel="插件筛选"
        tags={tags}
        activeTag={activeTag}
        onTagChange={selectTag}
        sort={sort}
        sortOptions={Object.entries(sortLabels).map(([value, label]) => ({ value, label }))}
        onSortChange={setSort}
      />

      <div className="flex flex-col gap-6">
        <PluginGrid plugins={plugins} loading={loading} error={error} onRetry={() => fetchPlugins(currentPage)} />
        {!loading && !error && plugins.length > 0 && (
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={fetchPlugins} className="pt-2" />
        )}
      </div>
    </section>
  );
}

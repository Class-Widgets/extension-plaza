"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Button,
  SearchBox,
  Text,
} from "@fluentui/react-components";
import PluginGrid from "@/app/components/Plugin/PluginGrid";
import Pagination from "@/app/components/Common/Pagination";
import EmptyState from "@/app/components/Common/EmptyState";
import FilterToolbar from "@/app/components/Common/FilterToolbar";

type TagItem = { id: string; name: string };

const sortLabels: Record<string, string> = {
  relevance: "相关性",
  latest: "最新发布",
  name: "名称排序",
  rating: "评分排序",
  downloads: "下载量排序",
};

export default function SearchClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [inputValue, setInputValue] = React.useState(query);
  const [plugins, setPlugins] = React.useState<any[]>([]);
  const [tags, setTags] = React.useState<TagItem[]>([]);
  const [activeTag, setActiveTag] = React.useState("");
  const [sort, setSort] = React.useState("relevance");
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<{ status?: number; message?: string } | null>(null);

  React.useEffect(() => {
    setInputValue(query);
    setActiveTag("");
    setPage(1);
  }, [query]);

  React.useEffect(() => {
    fetch("/api/plugins/tags")
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((json) => {
        const data = json?.data;
        const list = Array.isArray(data)
          ? data.map((tag: any) => ({ id: String(tag.id ?? tag.name), name: String(tag.name ?? tag.id) }))
          : [];
        setTags(list);
      })
      .catch(() => setTags([]));
  }, []);

  React.useEffect(() => {
    if (!query.trim()) {
      setPlugins([]);
      setTotal(0);
      setTotalPages(1);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const url = new URL("/api/plugins/search", window.location.origin);
    url.searchParams.set("q", query);
    url.searchParams.set("page", String(page));
    url.searchParams.set("per_page", "12");
    url.searchParams.set("sort", sort);
    if (activeTag) url.searchParams.set("tag", activeTag);

    setLoading(true);
    setError(null);
    fetch(url, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          const body = await response.json().catch(() => null);
          throw { status: response.status, message: body?.error || response.statusText || "请求失败" };
        }
        return response.json();
      })
      .then((json) => {
        if (json?.ok === false) throw { status: json.status, message: json.error || "接口返回错误" };
        setPlugins(Array.isArray(json?.data) ? json.data : []);
        setTotal(json?.meta?.total || 0);
        setTotalPages(json?.meta?.total_pages || 1);
      })
      .catch((reason) => {
        if (reason?.name === "AbortError") return;
        setPlugins([]);
        setTotal(0);
        setTotalPages(1);
        setError({ status: reason?.status, message: reason?.message || "网络异常，请检查连接后重试" });
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [activeTag, page, query, sort]);

  const submitSearch = () => {
    const nextQuery = inputValue.trim();
    router.push(nextQuery ? `/search?q=${encodeURIComponent(nextQuery)}` : "/search");
  };

  const selectTag = (tagId: string) => {
    setActiveTag(tagId);
    setPage(1);
  };

  const updateSort = (nextSort: string) => {
    setSort(nextSort);
    setPage(1);
  };

  return (
    <section className="max-w-6xl mx-auto px-4 py-6 flex flex-col gap-6">
      {/* 移动端搜索框：PC 端（≥800px）隐藏，与 Header 的搜索入口保持一致 */}
      <div className="flex gap-2 min-[800px]:hidden">
        <SearchBox
          aria-label="搜索插件"
          placeholder="搜索插件、作者、描述或标签"
          value={inputValue}
          onChange={(_, data) => setInputValue(data.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") submitSearch();
          }}
          size="large"
        />
        <Button appearance="primary" onClick={submitSearch}>搜索</Button>
      </div>

      {query ? (
        <>
          <div className="flex flex-col gap-2">
            <Text as="span" size={700} weight="semibold">“{query}”</Text>
            <Text size={300}>找到 {total} 个结果</Text>
          </div>

          <FilterToolbar
            ariaLabel="搜索结果筛选"
            tags={tags}
            activeTag={activeTag}
            onTagChange={selectTag}
            sort={sort}
            sortOptions={Object.entries(sortLabels).map(([value, label]) => ({ value, label }))}
            onSortChange={updateSort}
          />

          <div className="flex flex-col gap-6">
            <PluginGrid plugins={plugins} loading={loading} error={error} onRetry={() => setPage((current) => current)} showRating />
            {!loading && !error && plugins.length > 0 && <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />}
          </div>
        </>
      ) : (
        <EmptyState message="输入关键词以搜索插件" />
      )}
    </section>
  );
}

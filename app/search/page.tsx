"use client";
import * as React from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Text } from "@fluentui/react-components";
import PluginGrid from "@/app/components/Plugin/PluginGrid";

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-6">正在加载搜索结果…</div>}>
      <SearchClient />
    </Suspense>
  );
}

function SearchClient() {
  const params = useSearchParams();
  const q = params.get("q") || "";
  const [results, setResults] = React.useState<any[]>([]);

  React.useEffect(() => {
    const keyword = q.trim();
    if (!keyword) { setResults([]); return; }
    fetch(`/api/plugins/search?q=${encodeURIComponent(keyword)}`)
      .then(r => r.json())
      .then(json => setResults(Array.isArray(json.data) ? json.data : []))
      .catch(() => setResults([]));
  }, [q]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <Text weight="semibold" size={500}>搜索：{q}</Text>
      <PluginGrid plugins={results} />
    </div>
  );
}
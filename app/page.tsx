"use client";
import * as React from "react";
import Hero from "@/app/components/Store/Hero";
import PluginSectionTable from "@/app/components/Plugin/PluginSectionTable";
import PluginGrid from "@/app/components/Plugin/PluginGrid";

export default function StoreHome() {
  const [plugins, setPlugins] = React.useState<any[]>([]);

  React.useEffect(() => {
    fetch("/api/plugins")
      .then((r) => r.json())
      .then((json) => setPlugins(Array.isArray(json.data) ? json.data : []))
      .catch(() => setPlugins([]));
  }, []);

  // 简单的分区数据：多用 PluginSectionTable 和 PluginGrid
  const recommend = plugins.slice(0, 9);
  const trending = plugins.slice(9, 18);
  const devtools = plugins.filter((p: any) => (p.tags ?? []).includes("开发者工具")).slice(0, 9);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
      {/* 顶部视觉区（不含搜索与分类 nav） */}
      <Hero />

      {/* 分区：采用 PluginSectionTable 组件 */}
      <PluginSectionTable title="为你推荐" dataSource={recommend} options={{ pageSize: 6 }} />
      <PluginSectionTable title="热门扩展" dataSource={trending} options={{ pageSize: 6 }} />

      {/* 直接使用 PluginGrid 展示一个完整区块 */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">开发者工具</h2>
        <PluginGrid plugins={devtools} />
      </section>
    </div>
  );
}
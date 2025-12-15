"use client";
import * as React from "react";
import dynamic from "next/dynamic";
// 使用动态导入禁用 SSR，避免水合期间的 ID 不一致
const Hero = dynamic(() => import("@/app/components/Store/Hero"), { ssr: false });
import PluginSectionTable from "@/app/components/Plugin/PluginSectionTable";
import PluginGrid from "@/app/components/Plugin/PluginGrid";
// import PluginCardRounded from "@/app/components/Plugin/PluginCardRounded";

export default function StoreHome() {
  const [plugins, setPlugins] = React.useState<any[]>([]);

  React.useEffect(() => {
    fetch("/api/plugins")
      .then((r) => r.json())
      .then((json) => setPlugins(Array.isArray(json.data) ? json.data : []))
      .catch(() => setPlugins([]));
  }, []);

  const recommend = plugins.slice(0, 9);
  const trending = plugins.slice(9, 18);
  const devtools = plugins.filter((p: any) => (p.tags ?? []).includes("开发者工具")).slice(0, 9);

  return (
    <div className="flex flex-col gap-6">
      {/* 顶部视觉区（不含搜索与分类 nav） */}
      <Hero plugins={plugins} />

      {/* 分区：采用 PluginSectionTable 组件 */}
        <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-semibold">插件</h2>
            <PluginSectionTable title="为你推荐" dataSource={recommend} options={{ pageSize: 6 }} />
            <h3 className="text-base font-semibold">所有扩展</h3>
          <PluginGrid plugins={plugins} />
        </div>

        {/*<PluginCardTall plugin={"com.example.plugin.id"}/>*/}
        {/*<PluginCardRounded plugin={"com.example.plugin.id"}/>*/}
    </div>
  );
}
"use client";
import * as React from "react";
import dynamic from "next/dynamic";
// 使用动态导入禁用 SSR，避免水合期间的 ID 不一致
const Banner = dynamic(() => import("@/app/components/Store/Banner"), { ssr: false });
import PluginSectionTable from "@/app/components/Plugin/PluginSectionTable";
import PluginGrid from "@/app/components/Plugin/PluginGrid";
import { Skeleton, SkeletonItem, Card } from "@fluentui/react-components";
// import PluginCardRounded from "@/app/components/Plugin/PluginCardRounded";

export default function StoreHome() {
  const [plugins, setPlugins] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch("/api/plugins")
      .then((r) => r.json())
      .then((json) => {
        setPlugins(Array.isArray(json.data) ? json.data : []);
        setLoading(false);
      })
      .catch(() => {
        setPlugins([]);
        setLoading(false);
      });
  }, []);

  const recommend = plugins.slice(0, 9);
  const trending = plugins.slice(9, 18);
  const devtools = plugins.filter((p: any) => (p.tags ?? []).includes("开发者工具")).slice(0, 9);

  // 骨架屏组件
  const SkeletonBanner = () => (
    <div className="relative h-[280px] md:h-[380px] rounded-2xl overflow-hidden">
      <Skeleton>
        <SkeletonItem style={{ width: "100%", height: "100%", borderRadius: 0 }} />
      </Skeleton>
    </div>
  );

  const SkeletonPluginSection = () => (
    <Card appearance="filled" className="rounded-2xl p-4 !gap-0">
      <Skeleton>
        <SkeletonItem style={{ width: "200px", height: "28px", borderRadius: 6 }} />
        <div className="h-4" />
        <SkeletonItem style={{ width: "100%", height: "1px", borderRadius: 0 }} />
        <div className="h-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} appearance="filled" className="relative w-full transition-transform transition-colors duration-200 rounded-xl" style={{ boxShadow: "none" }}>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-xl overflow-hidden">
                  <Skeleton animation="wave" className="absolute inset-0">
                    <SkeletonItem style={{ width: "100%", height: "100%", borderRadius: 12 }} />
                  </Skeleton>
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <Skeleton animation="wave">
                    <SkeletonItem style={{ width: "80%", height: 20, borderRadius: 6 }} />
                    <div className="h-2" />
                    <SkeletonItem style={{ width: "60%", height: 14, borderRadius: 6 }} />
                  </Skeleton>
                  <div className="h-4" />
                  <Skeleton animation="wave">
                    <SkeletonItem style={{ width: "90%", height: 14, borderRadius: 6 }} />
                  </Skeleton>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Skeleton>
    </Card>
  );

  const SkeletonPluginGrid = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {[...Array(9)].map((_, i) => (
        <Card key={i} appearance="filled" className="relative w-full transition-transform transition-colors duration-200 rounded-xl" style={{ boxShadow: "none" }}>
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-xl overflow-hidden">
              <Skeleton animation="wave" className="absolute inset-0">
                <SkeletonItem style={{ width: "100%", height: "100%", borderRadius: 12 }} />
              </Skeleton>
            </div>
            <div className="flex-1 min-w-0 text-left">
              <Skeleton animation="wave">
                <SkeletonItem style={{ width: "80%", height: 20, borderRadius: 6 }} />
                <div className="h-2" />
                <SkeletonItem style={{ width: "60%", height: 14, borderRadius: 6 }} />
              </Skeleton>
              <div className="h-4" />
              <Skeleton animation="wave">
                <SkeletonItem style={{ width: "90%", height: 14, borderRadius: 6 }} />
              </Skeleton>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      {/* 顶部视觉区（不含搜索与分类 nav） */}
      {loading ? <SkeletonBanner /> : <Banner plugins={plugins} />}

      {/* 分区：采用 PluginSectionTable 组件 */}
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-semibold">插件</h2>
        {loading ? (
          <SkeletonPluginSection />
        ) : (
          <PluginSectionTable title="为你推荐" dataSource={recommend} options={{ pageSize: 6 }} />
        )}
        <h3 className="text-base font-semibold">所有扩展</h3>
        {loading ? <SkeletonPluginGrid /> : <PluginGrid plugins={plugins} />}
      </div>

      {/*<PluginCardTall plugin={"com.example.plugin.id"}/>*/}
      {/*<PluginCardRounded plugin={"com.example.plugin.id"}/>*/}
    </div>
  );
}
"use client";
import * as React from "react";
import Link from "next/link";
import { Card, CardHeader, CardFooter, CardPreview, Text, Skeleton, SkeletonItem, Link as FluentLink } from "@fluentui/react-components";
import { ChevronRightRegular } from "@fluentui/react-icons";
import { useRouter } from "next/navigation";

interface PluginCardProps {
  plugin: any;
}

// 读取作者名称与主页链接（尽量指向仓库所有者）
async function fetchAuthorAndUrl(pluginId: string): Promise<{ name: string | null; url: string | null }> {
  try {
    const res = await fetch(`/api/plugins/${pluginId}/resources/manifest`);
    if (!res.ok) return { name: null, url: null };
    const m = await res.json();
    const name = m?.author?.name || m?.author || m?.publisher || m?.owner || m?.maintainer || null;
    // 优先使用 manifest.url，其次 repository / homepage 字段
    const manifestUrl = m?.url || null;
    const repo = typeof m?.repository === "string" ? m.repository : m?.repository?.url;
    const homepage = m?.homepage || m?.author?.url || null;
    let url: string | null = manifestUrl || homepage || repo || null;
    try {
      if (url) {
        const u = new URL(url);
        if (u.hostname === "github.com") {
          const parts = u.pathname.split("/").filter(Boolean);
          if (parts.length >= 1) url = `${u.protocol}//${u.hostname}/${parts[0]}`; // 指向 owner 页面
        }
      }
    } catch {}
    return { name, url };
  } catch {
    return { name: null, url: null };
  }
}

export default function PluginCard({ plugin }: PluginCardProps) {
  const hasId = !!plugin?.id;
  const router = useRouter();

  // 图标加载（通过 API 获取）
  const initialIcon = hasId ? `/api/plugins/${plugin.id}/resources/icon` : "/vercel.svg";
  const [imgSrc, setImgSrc] = React.useState<string>(initialIcon);
  const [iconLoading, setIconLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    const nextSrc = hasId ? `/api/plugins/${plugin.id}/resources/icon` : "/vercel.svg";
    setImgSrc(nextSrc);
    setIconLoading(true);
  }, [plugin?.id, hasId]);

  // 作者名称与链接（从 manifest 获取）
  const [author, setAuthor] = React.useState<{ name: string | null; url: string | null }>({ name: null, url: null });
  const [authorLoading, setAuthorLoading] = React.useState<boolean>(false);
  React.useEffect(() => {
    let mounted = true;
    async function run() {
      if (!hasId) { setAuthor({ name: null, url: null }); return; }
      setAuthorLoading(true);
      const data = await fetchAuthorAndUrl(plugin.id);
      if (mounted) {
        setAuthor(data);
        setAuthorLoading(false);
      }
    }
    run();
    return () => { mounted = false; };
  }, [hasId, plugin?.id]);

  // 标题字号更大，移除阴影，添加悬浮高亮与上浮效果
  const cardClass = "relative w-full transition-transform transition-colors duration-200 hover:-translate-y-[2px] hover:bg-black/10 cursor-pointer rounded-xl";

  const goDetail = () => { if (hasId) router.push(`/plugins/${plugin.id}`); };
  const onKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); goDetail(); }
  };

  return (
    <Card appearance="filled" className={cardClass} style={{ boxShadow: "none" }} role="link" tabIndex={0} onClick={goDetail} onKeyDown={onKeyDown}>
      <div className="flex items-center gap-3">
        {/* 左侧图标（左对齐） */}
        <CardPreview className="w-16 h-16 rounded-xl overflow-hidden">
          <div className="relative w-16 h-16">
            {iconLoading && (
              <Skeleton animation="wave" className="absolute inset-0">
                <SkeletonItem style={{ width: "100%", height: "100%", borderRadius: 12 }} />
              </Skeleton>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imgSrc}
              alt={plugin?.name ?? "icon"}
              className="absolute inset-0 w-full h-full object-contain border-gray-300 dark:border-gray-500 border-1 rounded-2xl"
              onLoad={() => setIconLoading(false)}
              onError={() => { setImgSrc("/vercel.svg"); setIconLoading(false); }}
            />
          </div>
        </CardPreview>

        {/* 右侧文本区域，整体左对齐 */}
        <div className="flex-1 min-w-0 text-left">
          <CardHeader
            header={<Text weight="semibold" size={400}>{plugin?.name ?? "Undefined"}</Text>}
            description={
              authorLoading ? (
                <Skeleton animation="wave"><SkeletonItem style={{ width: 100, height: 14, borderRadius: 6 }} /></Skeleton>
              ) : author.url ? (
                <FluentLink href={author.url} target="_blank" rel="noopener noreferrer">{author.name ?? author.url}</FluentLink>
              ) : (
                <Text size={200} className="text-gray-400">{author.name ?? "作者未知"}</Text>
              )
            }
          />

          {/* 底部区域：描述（两行省略） */}
          <CardFooter>
            <Text size={200} className="text-gray-300" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {plugin?.description ?? plugin?.desc ?? plugin?.summary ?? ""}
            </Text>
          </CardFooter>
        </div>
      </div>

      {/* 右侧固定的 chevron，垂直居中 */}
      <div aria-hidden="true" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
        <ChevronRightRegular />
      </div>
    </Card>
  );
}
"use client";
import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button, Text, Card, Skeleton, SkeletonItem, Divider, SplitButton, Menu, MenuTrigger, MenuPopover, MenuList, MenuItem } from "@fluentui/react-components";
import { marked } from "marked";
import PluginList from "@/app/components/Plugin/PluginList";
import DOMPurify from "dompurify";
// import tagsMap from "@/app/data/tags.json"; // 已迁移到GitHub，通过API获取
import {
  TagRegular,
  InfoRegular,
  CodeRegular,
  BranchRegular,
  PersonRegular,
  ClockRegular,
  ArrowDownloadRegular,
  ChevronDownRegular,
  ShareRegular
} from "@fluentui/react-icons";

// README 渲染（支持 GitHub 风格 admonition + 占位符解析）
const preprocessReadme = (md: string, manifest?: any) => {
  let text = md;
  // 从 manifest 提取 owner/repo
  let owner: string | null = null;
  let repo: string | null = null;
  try {
    if (manifest?.url) {
      const u = new URL(manifest.url);
      if (u.hostname === "github.com") {
        const parts = u.pathname.split("/").filter(Boolean);
        if (parts.length >= 2) { owner = parts[0]; repo = parts[1]; }
      }
    }
  } catch {}
  const repoUrl = manifest?.url || "";

  // 常用占位符 -> 实际网页内容（Markdown 片段）
  if (repoUrl) {
    text = text.replace(/\$\{__web_page_repo__\}/g, `[${repoUrl}](${repoUrl})`);
  }
  if (owner && repo) {
    text = text.replace(/\$\{__web_page_stars_badge__\}/g, `![Stars](https://img.shields.io/github/stars/${owner}/${repo}?style=for-the-badge&color=orange&label=%E6%98%9F%E6%A0%87)`);
    text = text.replace(/\$\{__web_page_downloads_badge__\}/g, `![Downloads](https://img.shields.io/github/downloads/${owner}/${repo}/total.svg?label=%E4%B8%8B%E8%BD%BD%E9%87%8F&color=green&style=for-the-badge)`);
  }
  // 许可证徽章（如需更复杂可从 manifest 读取）
  text = text.replace(/\$\{__web_page_license_badge__\}/g, `![License](https://img.shields.io/badge/license-MIT-blue.svg?label=%E5%BC%80%E6%BA%90%E8%AE%B8%E5%8F%AF%E8%AF%81&style=for-the-badge)`);

  // 通用占位符：链接与徽章
  text = text.replace(/\$\{__web_page_link:(https?:\/\/[^}]+)__\}/g, (_m, url) => `[${url}](${url})`);
  text = text.replace(/\$\{__web_page_badge:(https?:\/\/[^}]+)__\}/g, (_m, url) => `![badge](${url})`);

  return text;
};

const renderReadmeHtml = (md: string, manifest?: any) => {
  const pre = preprocessReadme(md, manifest);
  const raw = marked.parse(pre) as string;
  // GitHub 风格 Admonition： [!NOTE]、[!TIP]、[!IMPORTANT]、[!WARNING]、[!CAUTION]
  const replaced = raw.replace(/<blockquote>\s*<p>\[!([A-Z]+)\]<\/p>([\s\S]*?)<\/blockquote>/g, (m, type, inner) => {
    const t = String(type).toLowerCase();
    const titleMap: Record<string, string> = {
      note: "Note",
      tip: "Tip",
      important: "Important",
      warning: "Warning",
      caution: "Caution",
    };
    const title = titleMap[t] || type;
    return `<div class="admonition admonition-${t}"><div class="admonition-title">${title}</div>${inner}</div>`;
  });
  return DOMPurify.sanitize(replaced, {
    ALLOWED_TAGS: [
      "h1","h2","h3","h4","h5","h6","p","blockquote","pre","code","ul","ol","li","table","thead","tbody","tr","th","td","a","img","strong","em","del","hr","div","span"
    ],
    ALLOWED_ATTR: ["href","target","rel","src","alt","title","class","align","width","height","style","loading"],
  }) as string;
};

function parseOwnerAndRepo(url: string): { owner: string | null; repo: string | null } {
  try {
    const u = new URL(url);
    if (u.hostname !== "github.com") return { owner: null, repo: null };
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length >= 2) return { owner: parts[0], repo: parts[1] };
    if (parts.length === 1) return { owner: parts[0], repo: null };
    return { owner: null, repo: null };
  } catch {
    return { owner: null, repo: null };
  }
}

export default function PluginDetailPage() {
  const { pluginId } = useParams<{ pluginId: string }>();
  const router = useRouter();
  const [manifest, setManifest] = React.useState<any | null>(null);
  const [readme, setReadme] = React.useState<string | null>(null);
  const [iconLoaded, setIconLoaded] = React.useState(false);
  const [otherPlugins, setOtherPlugins] = React.useState<any[]>([]);
  const [isLoadingOtherPlugins, setIsLoadingOtherPlugins] = React.useState(true);
  const [releaseDate, setReleaseDate] = React.useState<string | null>(null);
  const [isLoadingReleaseDate, setIsLoadingReleaseDate] = React.useState(true);
  const [tagsMap, setTagsMap] = React.useState<Record<string, any>>({});

  const [iconSrc, setIconSrc] = React.useState<string>(`/api/plugins/${pluginId}/resources/icon`);
  const releaseZipUrl = React.useMemo(() => `/api/plugins/${pluginId}/resources/release?format=zip`, [pluginId]);
  const releaseCwpluginUrl = React.useMemo(() => `/api/plugins/${pluginId}/resources/release?format=cwplugin`, [pluginId]);
  const releasePageUrl = React.useMemo(() => {
    if (!manifest?.url) return null;
    try {
      const u = new URL(manifest.url);
      if (u.hostname === "github.com") {
        const parts = u.pathname.split("/").filter(Boolean);
        if (parts.length >= 2) {
          return `https://github.com/${parts[0]}/${parts[1]}/releases`;
        }
      }
    } catch {}
    return null;
  }, [manifest]);

  React.useEffect(() => {
    // 加载 manifest
    fetch(`/api/plugins/${pluginId}/resources/manifest`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((m) => setManifest(m))
      .catch(() => setManifest(null));

    // 加载 Readme 原文（Markdown）
    fetch(`/api/plugins/${pluginId}/resources/readme`)
      .then((r) => (r.ok ? r.text() : Promise.reject()))
      .then((text) => setReadme(text))
      .catch(() => setReadme("# 暂无说明\n当前插件未提供 README 内容。"));

    // 加载 tags 数据
    fetch('/api/plugins/tags')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((response) => {
        // 确保提取正确的数据部分
        if (response && response.ok && response.data) {
          setTagsMap(response.data);
        } else {
          setTagsMap({});
        }
      })
      .catch(() => setTagsMap({}));
  }, [pluginId]);

  React.useEffect(() => {
    // 右侧同分区“发现更多”
    (async () => {
      setIsLoadingOtherPlugins(true);
      try {
        const res = await fetch(`/api/plugins`);
        const json = await res.json();
        const list: any[] = Array.isArray(json.data) ? json.data : [];
        const tags: string[] = Array.isArray(manifest?.tags) ? manifest!.tags : [];
        const sameSection = tags.length > 0 ? list.filter((p) => p.id !== pluginId && (p.tags ?? []).some((t: string) => tags.includes(t))) : list.filter((p) => p.id !== pluginId);
        const shuffled = sameSection.sort(() => Math.random() - 0.5);
        setOtherPlugins(shuffled.slice(0, 6));
      } catch {
        setOtherPlugins([]);
      } finally {
        setIsLoadingOtherPlugins(false);
      }
    })();
  }, [pluginId, manifest]);

  React.useEffect(() => {
    // GitHub Release 最新更新时间
    (async () => {
      try {
        if (!manifest?.url) { setIsLoadingReleaseDate(false); return; }
        const { owner, repo } = parseOwnerAndRepo(manifest.url);
        if (!owner || !repo) { setIsLoadingReleaseDate(false); return; }
        const api = `https://mirror.ghproxy.com/https://api.github.com/repos/${owner}/${repo}/releases/latest`;
        const res = await fetch(api, { headers: { Accept: "application/vnd.github+json" } });
        if (!res.ok) { setIsLoadingReleaseDate(false); return; }
        const json = await res.json();
        const dt = json?.published_at || json?.created_at || null;
        if (dt) setReleaseDate(new Date(dt).toLocaleDateString());
      } catch {} finally {
        setIsLoadingReleaseDate(false);
      }
    })();
  }, [manifest]);

  const authorUrl = React.useMemo(() => {
    try {
      if (!manifest?.url) return null;
      const u = new URL(manifest.url);
      if (u.hostname !== "github.com") return manifest.url;
      const parts = u.pathname.split("/").filter(Boolean);
      if (parts.length >= 1) return `${u.protocol}//${u.hostname}/${parts[0]}`;
      return manifest.url;
    } catch {
      return null;
    }
  }, [manifest]);

  const sectionTags = React.useMemo(() => (Array.isArray(manifest?.tags) ? manifest?.tags : []), [manifest]);

  // 动态更新页面标题
  React.useEffect(() => {
    if (manifest?.name) {
      document.title = `${manifest.name} - Class Widgets 插件广场(测试)`;
    }
  }, [manifest]);
  
  // 获取标签名称的函数，现在在组件内部定义，可以访问 tagsMap
  const getTagName = React.useCallback((id?: string) => {
    if (!id) return "";
    const tag = tagsMap[id];
    // API返回的数据使用zh_CN和en_US键
    return tag?.["zh_CN"] ?? tag?.["en_US"] ?? id;
  }, [tagsMap]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* 顶部应用信息区域 */}
      <section className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="w-24 h-24 flex items-center justify-center mx-auto sm:mx-0">
          {!iconLoaded && (
            <Skeleton>
              <SkeletonItem shape="rectangle" style={{ width: 96, height: 96, borderRadius: 12 }} />
            </Skeleton>
          )}
          <img
            src={iconSrc}
            alt={manifest?.name || String(pluginId)}
            className={`w-24 h-24 object-contain rounded-3xl ${iconLoaded ? "" : "hidden"}`}
            onLoad={() => setIconLoaded(true)}
            onError={() => { setIconLoaded(true); setIconSrc("/images/default_plugin.png"); }}
          />
        </div>
         <div className="flex-1 min-w-0 space-y-2 text-center sm:text-left">
          {manifest ? (
            <>
              <Text weight="semibold" size={700} className="truncate">{manifest.name}</Text>
              <div className="text-sm space-y-1">
                {authorUrl && (
                  <div>
                    <Link href={authorUrl} target="_blank" className="text-blue-600 dark:text-blue-400 hover:underline">{manifest.author || "未知"}</Link>
                  </div>
                )}
                {sectionTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                    {sectionTags.map((tag: string) => (
                      <Link key={tag} href={`/search?q=${encodeURIComponent(tag)}`} className="text-blue-600 dark:text-blue-400 hover:underline">{getTagName(tag)}</Link>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">{manifest.description}</div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-2 pt-2">
                {/* 下载按钮（SplitButton） */}
                <div className="flex-1 sm:flex-none">
                  {manifest && releasePageUrl ? (
                      <Menu positioning="below-end">
                        <MenuTrigger disableButtonEnhancement>
                          {(triggerProps) => (
                              <SplitButton
                                  appearance="primary"
                                  primaryActionButton={{
                                    onClick: () => window.open(releaseCwpluginUrl, "_blank"),
                                  }}
                                  icon={<ArrowDownloadRegular />}
                                  menuButton={triggerProps}
                                  menuIcon={<ChevronDownRegular style={{ marginBottom: "1.75em" }} />}
                              >
                                下载
                              </SplitButton>
                          )}
                        </MenuTrigger>

                        <MenuPopover>
                          <MenuList>
                            <MenuItem onClick={() => window.open(releaseZipUrl, "_blank")}>
                              下载 ZIP 文件
                            </MenuItem>
                            <MenuItem onClick={() => window.open(releaseCwpluginUrl, "_blank")}>
                              下载 Class Widgets 插件
                            </MenuItem>
                            <MenuItem onClick={() => window.open(releasePageUrl, "_blank")}>
                              访问 Release 页面
                            </MenuItem>
                          </MenuList>
                        </MenuPopover>
                      </Menu>
                  ) : (
                      <Link href={releaseZipUrl} className="block">
                        <Button appearance="primary">
                          <ArrowDownloadRegular style={{ fontSize: 16, marginRight: 8 }} />
                          下载
                        </Button>
                      </Link>
                  )}
                </div>
                {/* 分享按钮 */}
                <Button 
                  appearance="secondary" 
                  icon={<ShareRegular />}
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: document.title,
                        text: manifest ? `${manifest.description} —— Class Widgets 插件广场` : 'Class Widgets 插件广场',
                        url: window.location.href
                      });
                    }
                  }}
                  aria-label="分享插件"
                />
              </div>
            </>
          ) : (
            <div className="flex-1">
              <Skeleton>
                <SkeletonItem style={{ width: 280, height: 24 }} />
                <div className="h-2" />
                <SkeletonItem style={{ width: 220, height: 16 }} />
                <div className="h-2" />
                <SkeletonItem style={{ width: 360, height: 16 }} />
              </Skeleton>
            </div>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-15 gap-5 mt-12">
        {/* 主体左侧 说明 + 其他信息 */}
        <div className="xl:col-span-10 space-y-4">
          <Card className="!p-4 sm:!p-8 !gap-0">
             <Text weight="semibold" size={500}>说明</Text>
             <Divider className="my-3" />
             {!readme ? (
               <Skeleton>
                 <SkeletonItem style={{ width: "100%", height: 20 }} />
                 <div className="h-2" />
                 <SkeletonItem style={{ width: "90%", height: 20 }} />
                 <div className="h-2" />
                 <SkeletonItem style={{ width: "95%", height: 20 }} />
                 <div className="h-2" />
                 <SkeletonItem style={{ width: "80%", height: 20 }} />
                 <div className="h-2" />
                 <SkeletonItem style={{ width: "60%", height: 20 }} />
               </Skeleton>
             ) : (
               <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: renderReadmeHtml(readme, manifest) }} />
             )}
           </Card>
 
          <Card className="!p-4 sm:!p-8 !gap-0">
             <Text weight="semibold" size={500}>其他信息</Text>
             <Divider className="my-3" />
             {manifest ? (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                 <div className="flex items-start gap-2">
                   <span aria-hidden="true" className="text-gray-500 dark:text-gray-400 mt-0.5"><TagRegular style={{ fontSize: 20 }} /></span>
                   <div>
                     <div className="text-gray-500 dark:text-gray-400">插件 ID</div>
                     <div className="font-mono">{manifest.id}</div>
                   </div>
                 </div>
                 <div className="flex items-start gap-2">
                   <span aria-hidden="true" className="text-gray-500 dark:text-gray-400 mt-0.5"><InfoRegular style={{ fontSize: 20 }} /></span>
                   <div>
                     <div className="text-gray-500 dark:text-gray-400">版本</div>
                     <div>{manifest.version || "未知"}</div>
                   </div>
                 </div>
                 <div className="flex items-start gap-2">
                   <span aria-hidden="true" className="text-gray-500 dark:text-gray-400 mt-0.5"><CodeRegular style={{ fontSize: 20 }} /></span>
                   <div>
                     <div className="text-gray-500 dark:text-gray-400">API 版本</div>
                     <div>{manifest.api_version || "未知"}</div>
                   </div>
                 </div>
                 <div className="flex items-start gap-2">
                   <span aria-hidden="true" className="text-gray-500 dark:text-gray-400 mt-0.5"><BranchRegular style={{ fontSize: 20 }} /></span>
                   <div>
                     <div className="text-gray-500 dark:text-gray-400">分支</div>
                     <div>{manifest.branch || "main"}</div>
                   </div>
                 </div>
                 <div className="flex items-start gap-2">
                   <span aria-hidden="true" className="text-gray-500 dark:text-gray-400 mt-0.5"><PersonRegular style={{ fontSize: 20 }} /></span>
                   <div>
                     <div className="text-gray-500 dark:text-gray-400">作者</div>
                     <div>{manifest.author || "未知"}</div>
                   </div>
                 </div>
                 <div className="flex items-start gap-2">
                   <span aria-hidden="true" className="text-gray-500 dark:text-gray-400 mt-0.5"><ClockRegular style={{ fontSize: 20 }} /></span>
                   <div>
                     <div className="text-gray-500 dark:text-gray-400">最近更新</div>
                     {isLoadingReleaseDate ? (
                       <Skeleton>
                         <SkeletonItem style={{ width: 120, height: 16 }} />
                       </Skeleton>
                     ) : (
                       <div>{releaseDate || "暂无数据"}</div>
                     )}
                   </div>
                 </div>
               </div>
             ) : (
               <Skeleton>
                 <div className="space-y-3">
                   <SkeletonItem style={{ width: "100%", height: 120 }} />
                   <SkeletonItem style={{ width: "100%", height: 120 }} />
                   <SkeletonItem style={{ width: "100%", height: 120 }} />
                 </div>
               </Skeleton>
             )}
           </Card>
         </div>
 
         {/* 右侧 发现更多 */}
         <aside className="xl:col-span-5">
          <Card className="!p-4 sm:!p-8 !gap-0">
             <div className="flex items-center justify-between">
               <Text weight="semibold" size={500}>发现更多</Text>
               {sectionTags.length > 0 && <Link href={`/search?q=${encodeURIComponent(sectionTags[0])}`} className="text-blue-600 dark:text-blue-400 hover:underline text-xs">更多</Link>}
             </div>
             <Divider className="my-3" />
             {isLoadingOtherPlugins ? (
               <Skeleton>
                 <div className="space-y-3">
                   <SkeletonItem style={{ width: "100%", height: 72 }} />
                   <SkeletonItem style={{ width: "100%", height: 72 }} />
                   <SkeletonItem style={{ width: "100%", height: 72 }} />
                 </div>
               </Skeleton>

            ) : otherPlugins.length === 0 ? (
              <div className="text-sm text-gray-500 text-center py-8">暂无推荐</div>
             ) : (
               <PluginList plugins={otherPlugins} />
             )}
           </Card>
         </aside>
      </div>
    </div>
  );
}

// 配置 marked，启用 GFM，保留标题与代码块等语义标签
marked.setOptions({ gfm: true, breaks: false });
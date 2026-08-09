"use client";
import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button, Text, Card, Skeleton, SkeletonItem, Divider, SplitButton, Menu, MenuTrigger, MenuPopover, MenuList, MenuItem, Spinner, Rating } from "@fluentui/react-components";
import { marked } from "marked";
import PluginList from "@/app/components/Plugin/PluginList";
import CommentsDialog, { type PluginReview } from "@/app/components/Plugin/CommentsDialog";
import RatingDialog from "@/app/components/Plugin/RatingDialog";
import PluginReviewItem from "@/app/components/Plugin/PluginReviewItem";
import DOMPurify from "dompurify";
import {
  TagRegular,
  InfoRegular,
  CodeRegular,
  BranchRegular,
  PersonRegular,
  ClockRegular,
  ArrowDownloadRegular,
  ChevronDownRegular,
  ShareRegular,
  ChevronRightRegular,
  StarFilled,
  EditRegular
} from "@fluentui/react-icons";
import { useAuthSession } from "@/app/components/Auth/useAuthSession";
import AuthDialog from "@/app/components/Auth/AuthDialog";
import { supabase } from "@/lib/supabase";


// README 渲染（支持 GitHub 风格 admonition + 占位符解析）
const preprocessReadme = (md: string, manifest?: any) => {
  let text = md;
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

  if (repoUrl) {
    text = text.replace(/\$\{__web_page_repo__\}/g, `[${repoUrl}](${repoUrl})`);
  }
  if (owner && repo) {
    text = text.replace(/\$\{__web_page_stars_badge__\}/g, `![Stars](https://img.shields.io/github/stars/${owner}/${repo}?style=for-the-badge&color=orange&label=%E6%98%9F%E6%A0%87)`);
    text = text.replace(/\$\{__web_page_downloads_badge__\}/g, `![Downloads](https://img.shields.io/github/downloads/${owner}/${repo}/total.svg?label=%E4%B8%8B%E8%BD%BD%E9%87%8F&color=green&style=for-the-badge)`);
  }
  text = text.replace(/\$\{__web_page_license_badge__\}/g, `![License](https://img.shields.io/badge/license-MIT-blue.svg?label=%E5%BC%80%E6%BA%90%E8%AE%B8%E5%8F%AF%E8%AF%81&style=for-the-badge)`);

  text = text.replace(/\$\{__web_page_link:(https?:\/\/[^}]+)__\}/g, (_m, url) => `[${url}](${url})`);
  text = text.replace(/\$\{__web_page_badge:(https?:\/\/[^}]+)__\}/g, (_m, url) => `![badge](${url})`);

  return text;
};

const renderReadmeHtml = (md: string, manifest?: any) => {
  const pre = preprocessReadme(md, manifest);
  const raw = marked.parse(pre) as string;
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
  const [manifestError, setManifestError] = React.useState<{ status?: number; message?: string } | null>(null);
  const [manifestLoaded, setManifestLoaded] = React.useState(false);
  const { user } = useAuthSession();
  const [ratings, setRatings] = React.useState<PluginReview[]>([]);
  const [isLoadingRatings, setIsLoadingRatings] = React.useState(true);
  const [ratingsError, setRatingsError] = React.useState<string | null>(null);
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = React.useState(false);
  const [isRatingDialogOpen, setIsRatingDialogOpen] = React.useState(false);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = React.useState(false);
  const [ratingValue, setRatingValue] = React.useState(0);
  const [ratingComment, setRatingComment] = React.useState("");
  const [isSubmittingRating, setIsSubmittingRating] = React.useState(false);
  const [ratingSubmitError, setRatingSubmitError] = React.useState<string | null>(null);
  const [isReadmeExpanded, setIsReadmeExpanded] = React.useState(false);
  const [shouldCollapseReadme, setShouldCollapseReadme] = React.useState(false);
  const [readmeMaxHeight, setReadmeMaxHeight] = React.useState(0);
  const readmeContentRef = React.useRef<HTMLDivElement>(null);

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

  const loadManifest = React.useCallback(() => {
    setManifestLoaded(false);
    setManifestError(null);
    fetch(`/api/plugins/${pluginId}/resources/manifest`)
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
      .then((m) => {
        setManifest(m);
        setManifestError(null);
        setManifestLoaded(true);
      })
      .catch((e) => {
        setManifest(null);
        setManifestError({
          status: e?.status,
          message: e?.message || "网络异常，请检查连接后重试",
        });
        setManifestLoaded(true);
      });
  }, [pluginId]);

  React.useEffect(() => {
    loadManifest();

    fetch(`/api/plugins/${pluginId}/resources/readme`)
      .then((r) => (r.ok ? r.text() : Promise.reject()))
      .then((text) => setReadme(text))
      .catch(() => setReadme("# 暂无说明\n当前插件未提供 README 内容。"));

    fetch('/api/plugins/tags')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((response) => {
        if (response && response.ok && response.data) {
          const nextTagsMap = Array.isArray(response.data)
            ? Object.fromEntries(response.data.map((tag: any) => [tag.id, tag.name ?? tag]))
            : response.data;
          setTagsMap(nextTagsMap);
        } else {
          setTagsMap({});
        }
      })
      .catch(() => setTagsMap({}));
  }, [pluginId, loadManifest]);

  const loadRatings = React.useCallback(async () => {
    setIsLoadingRatings(true);
    setRatingsError(null);
    try {
      const { data } = await supabase.auth.getSession();
      const response = await fetch(`/api/plugins/${pluginId}/comments`, {
        headers: data.session?.access_token ? { Authorization: `Bearer ${data.session.access_token}` } : undefined,
      });
      const body = await response.json();
      if (!response.ok || !body?.ok) throw new Error(body?.error || "评论加载失败");
      setRatings(Array.isArray(body.data) ? body.data : []);
    } catch (error: any) {
      setRatings([]);
      setRatingsError(error?.message || "评论加载失败");
    } finally {
      setIsLoadingRatings(false);
    }
  }, [pluginId]);

  React.useEffect(() => {
    loadRatings();
  }, [loadRatings]);

  React.useEffect(() => {
    (async () => {
      setIsLoadingOtherPlugins(true);
      try {
        const res = await fetch(`/api/plugins`);
        const json = await res.json();
        const list: any[] = Array.isArray(json.data) ? json.data : [];
        const tags: any[] = Array.isArray(manifest?.tags) ? manifest!.tags : [];
        const tagIds = tags.map((t: any) => t.id || t);
        const sameSection = tagIds.length > 0 ? list.filter((p) => p.id !== pluginId && (p.tags ?? []).some((t: any) => tagIds.includes(t.id || t))) : list.filter((p) => p.id !== pluginId);
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

  const sectionTags = React.useMemo(() => (Array.isArray(manifest?.tags) ? manifest?.tags : []), [manifest]);

  React.useEffect(() => {
    if (manifest?.name) {
      document.title = `${manifest.name} - Class Widgets 插件广场(测试)`;
    }
  }, [manifest]);

  React.useEffect(() => {
    const updateReadmeCollapse = () => {
      const maxHeight = Math.floor(window.innerHeight * 0.75);
      const isMobile = window.matchMedia("(max-width: 767px)").matches;
      const contentHeight = readmeContentRef.current?.scrollHeight ?? 0;
      setReadmeMaxHeight(maxHeight);
      setShouldCollapseReadme(isMobile && contentHeight > maxHeight);
    };

    updateReadmeCollapse();
    window.addEventListener("resize", updateReadmeCollapse);
    return () => window.removeEventListener("resize", updateReadmeCollapse);
  }, [readme]);

  const getTagName = React.useCallback((id?: string) => {
    if (!id) return "";
    const tag = tagsMap[id];
    if (typeof tag === "string") return tag;
    return tag?.["zh_CN"] ?? tag?.["en_US"] ?? tag?.name ?? id;
  }, [tagsMap]);

  const ratingSummary = React.useMemo(() => {
    const total = ratings.length;
    const average = total ? ratings.reduce((sum, item) => sum + item.rating, 0) / total : 0;
    const distribution = [5, 4, 3, 2, 1].map((score) => ({ score, count: ratings.filter((item) => item.rating === score).length }));
    return { total, average, distribution, commentCount: ratings.filter((item) => item.comment).length };
  }, [ratings]);

  const recentReviews = React.useMemo(() => ratings
    .filter((item) => item.comment)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 2), [ratings]);

  const openRatingDialog = (selectedRating?: number) => {
    if (!user) {
      setIsAuthDialogOpen(true);
      return;
    }
    const ownRating = ratings.find((item) => item.user_id === user.id);
    setRatingValue(selectedRating ?? ownRating?.rating ?? 0);
    setRatingComment(ownRating?.comment ?? "");
    setRatingSubmitError(null);
    setIsRatingDialogOpen(true);
  };

  const submitRating = async () => {
    if (!ratingValue || !user) return;
    setIsSubmittingRating(true);
    setRatingSubmitError(null);
    try {
      const { data } = await supabase.auth.getSession();
      const response = await fetch(`/api/plugins/${pluginId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(data.session?.access_token ? { Authorization: `Bearer ${data.session.access_token}` } : {}),
        },
        body: JSON.stringify({ rating: ratingValue, comment: ratingComment }),
      });
      const body = await response.json();
      if (!response.ok || !body?.ok) throw new Error(body?.error || "提交评价失败");
      setIsRatingDialogOpen(false);
      await loadRatings();
    } catch (error: any) {
      setRatingSubmitError(error?.message || "提交评价失败");
    } finally {
      setIsSubmittingRating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 rounded-3xl overflow-hidden">
      {/* 顶部应用信息区域 */}
      <section className="flex flex-col md:flex-row md:items-start gap-4">
        <div className="w-24 h-24 flex items-center justify-center mx-auto md:mx-0">
          {!iconLoaded && (
            <Skeleton>
              <SkeletonItem shape="rectangle" style={{ width: 96, height: 96, borderRadius: 24 }} />
            </Skeleton>
          )}
          <img
            src={iconSrc}
            alt={manifest?.name || String(pluginId)}
            className={`w-24 h-24 object-contain ${iconLoaded ? "" : "hidden"}`}
            onLoad={() => setIconLoaded(true)}
            onError={() => { setIconLoaded(true); setIconSrc("/images/default_plugin.png"); }}
          />
        </div>
         <div className="flex-1 min-w-0 space-y-2 text-center md:text-left">
          {manifest ? (
            <>
              <Text weight="semibold" size={700} className="truncate">{manifest.name}</Text>
              <div className="text-sm space-y-1">
                {manifest.owner_id && (
                  <div>
                    <Link href={`/authors/${manifest.owner_id}`} className="hover:underline">{manifest.author || manifest.owner_id}</Link>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-300 md:justify-start">
                {ratingSummary.total > 0 && (
                  <>
                    <div className="flex items-center gap-1 whitespace-nowrap" style={{ color: "var(--colorPaletteMarigoldForeground1)" }}>
                      <span>{ratingSummary.average.toFixed(1)}</span>
                      <StarFilled fontSize={12} aria-hidden="true" />
                    </div>
                    <span className="text-gray-300 dark:text-gray-600">|</span>
                    <span className="whitespace-nowrap">{ratingSummary.total} 个评级</span>
                    <span className="text-gray-300 dark:text-gray-600">|</span>
                  </>
                )}
                {sectionTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                    {sectionTags.map((tag: any) => (
                      <Link key={tag.id || tag} href={`/search?q=${encodeURIComponent(tag.name || tag)}`} className="hover:underline">{getTagName(tag.id)}</Link>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">{manifest.description}</div>
              <div className="flex flex-row items-center justify-center md:justify-start flex-wrap gap-3 md:gap-2 pt-2">
                <div className="flex-none">
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
          ) : manifestError ? (
            <div className="flex-1">
              <Card className="!p-4 md:!p-6 !gap-2" style={{ boxShadow: "none" }}>
                <Text weight="semibold" size={500} style={{ color: "var(--colorPaletteRedForeground1)" }}>
                  {manifestError.status ? `加载失败 (${manifestError.status})` : "加载失败"}
                </Text>
                <Text size={300} className="text-gray-500 dark:text-gray-400">
                  {manifestError.message}
                </Text>
                <div className="pt-2">
                  <Button appearance="subtle" onClick={loadManifest}>重试</Button>
                </div>
              </Card>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center py-8">
              <Spinner size="large" />
            </div>
          )}
        </div>
      </section>

      {manifest && (<div className="grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)] gap-5 mt-12">
        {/* 主体左侧 说明 + 其他信息 */}
        <div className="space-y-4">
          <Card className="!p-4 sm:!p-8 !gap-0">
             <Text weight="semibold" size={500}>说明</Text>
             <Divider className="my-3" />
             {!readme ? (
               <div className="flex flex-col items-center justify-center py-12 gap-3">
                 <Spinner size="large" />
               </div>
             ) : (
               <>
                 <div
                   className="overflow-hidden"
                   style={shouldCollapseReadme && !isReadmeExpanded ? { maxHeight: `${readmeMaxHeight}px` } : undefined}
                 >
                   <div ref={readmeContentRef} className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: renderReadmeHtml(readme, manifest) }} />
                 </div>
                 {shouldCollapseReadme && (
                   <Button appearance="subtle" className="!mt-3" onClick={() => setIsReadmeExpanded((expanded) => !expanded)}>
                     {isReadmeExpanded ? "收起说明" : "展开说明"}
                   </Button>
                 )}
               </>
             )}
           </Card>

          <Card className="!p-4 md:!p-8 !gap-0">
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
             ) : null}
           </Card>

          
         </div>

         {/* 右侧 发现更多 */}
         <aside className="flex flex-col gap-5">
          <Card className="!p-4 md:!p-8">
             <div className="flex items-center justify-between">
               <Text weight="semibold" size={500}>评分和评价</Text>
               <div className="flex items-center gap-1">
                 {ratings.some((item) => item.user_id === user?.id) && <Button appearance="subtle" icon={<EditRegular />} onClick={() => openRatingDialog()} aria-label="修改评价" />}
                 {ratingSummary.commentCount > 0 && <Button appearance="subtle" icon={<ChevronRightRegular />} onClick={() => setIsReviewsDialogOpen(true)} aria-label="查看全部评价" />}
               </div>
             </div>
             <Divider className="my-3" />
             {isLoadingRatings ? (
               <div className="flex justify-center py-8"><Spinner size="small" /></div>
             ) : ratingsError ? (
               <div className="space-y-2 py-3">
                 <Text size={300} className="text-gray-500 dark:text-gray-400">{ratingsError}</Text>
                 <Button size="small" appearance="subtle" onClick={loadRatings}>重试</Button>
               </div>
             ) : (
               <>
                 {ratingSummary.total > 0 && <div className="grid w-full max-w-[360px] grid-cols-[6.5rem_minmax(0,1fr)] items-center gap-4 py-1">
                   <div className="flex flex-col items-center justify-between self-stretch text-center">
                     <Text weight="semibold" className="block !text-6xl !leading-none tracking-tight">{ratingSummary.average.toFixed(1)}</Text>
                     <Text size={200} className="block text-gray-500 dark:text-gray-400">{ratingSummary.total} 个评分</Text>
                   </div>
                   <div className="space-y-1.5">
                     {ratingSummary.distribution.map(({ score, count }) => (
                       <div key={score} className="grid grid-cols-[2.25rem_minmax(0,1fr)] items-center gap-1">
                         <div className="flex items-center justify-end gap-1 text-xs" style={{ color: "var(--colorPaletteMarigoldForeground1)" }}>
                           <Text size={200}>{score}</Text>
                           <StarFilled fontSize={12} aria-label={`${score} 星`} />
                         </div>
                         <div className="h-2 overflow-hidden rounded-full" style={{ backgroundColor: "color-mix(in srgb, var(--colorPaletteMarigoldForeground1) 22%, transparent)" }}>
                           <div className="h-full rounded-full transition-[width] duration-300" style={{ width: `${(count / ratingSummary.total) * 100}%`, backgroundColor: "var(--colorPaletteMarigoldForeground1)" }} />
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>}
                 {!ratings.some((item) => item.user_id === user?.id) && <div className="flex items-center gap-3">
                  <div className="flex-shrink-0"><Rating value={0} size="medium" onChange={(_, data) => openRatingDialog(data.value)} aria-label={`评价 ${manifest.name}`} /></div>
                  <Text size={300}>你如何评价 {manifest.name}?</Text>
                </div>}
                 {recentReviews.length > 0 && <div className="mt-5">
                   <div className="space-y-0">
                     {recentReviews.map((review) => <PluginReviewItem key={review.user_id} review={review} compact />)}
                   </div>
                 </div>}
                 {ratingSummary.commentCount > 0 && <Button appearance="transparent" className="!mt-3 !px-0" onClick={() => setIsReviewsDialogOpen(true)}>查看全部（{ratingSummary.commentCount}）</Button>}
               </>
             )}
           </Card>
          <Card className="!p-4 md:!p-8 !gap-0">
             <div className="flex items-center justify-between">
               <Text weight="semibold" size={500}>发现更多</Text>
               {sectionTags.length > 0 &&  <Button appearance="subtle" icon={<ChevronRightRegular />} onClick={() => router.push(`/search?q=${encodeURIComponent(sectionTags[0].name || sectionTags[0])}`)} aria-label="查看全部评价" />}
             </div>
             <Divider className="my-3" />
             <PluginList plugins={otherPlugins} loading={isLoadingOtherPlugins} />
           </Card>
         </aside>
      </div>)}
      <CommentsDialog open={isReviewsDialogOpen} reviews={ratings} onOpenChange={setIsReviewsDialogOpen} />
      <RatingDialog
        open={isRatingDialogOpen}
        pluginName={manifest?.name || "此插件"}
        rating={ratingValue}
        comment={ratingComment}
        submitting={isSubmittingRating}
        error={ratingSubmitError}
        onOpenChange={setIsRatingDialogOpen}
        onRatingChange={setRatingValue}
        onCommentChange={setRatingComment}
        onSubmit={submitRating}
      />
      <AuthDialog open={isAuthDialogOpen} onOpenChange={setIsAuthDialogOpen} />
    </div>
  );
}

// 配置 marked，启用 GFM，保留标题与代码块等语义标签
marked.setOptions({ gfm: true, breaks: false });

"use client";
import * as React from "react";
import Link from "next/link";
import { Card, CardHeader, CardFooter, CardPreview, Text, Skeleton, SkeletonItem, Button } from "@fluentui/react-components";
import { ChevronRightRegular, StarFilled } from "@fluentui/react-icons";
import { useRouter } from "next/navigation";

interface PluginCardProps {
  plugin: any;
  isLoading?: boolean;
  showRating?: boolean;
}

export default function PluginCard({ plugin, isLoading, showRating = false }: PluginCardProps) {
  const hasId = !!plugin?.id;
  const router = useRouter();

  // 图标加载（通过 API 获取）
  const initialIcon = hasId ? `/api/plugins/${plugin.id}/resources/icon` : "/images/default_plugin.png";
  const [imgSrc, setImgSrc] = React.useState<string>(initialIcon);
  const [iconLoading, setIconLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    const nextSrc = hasId ? `/api/plugins/${plugin.id}/resources/icon` : "/images/default_plugin.png";
    setImgSrc(nextSrc);
    setIconLoading(true);
  }, [plugin?.id, hasId]);

  const cardClass = "relative w-full cursor-pointer transition-transform duration-200 hover:-translate-y-[2px]";

  const goDetail = () => { if (hasId) router.push(`/plugins/${plugin.id}`); };
  const onKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); goDetail(); }
  };

  if (isLoading) {
    return (
      <Card appearance="filled" className={cardClass} style={{ boxShadow: "none" }}>
        <div className="flex items-center gap-3">
          <CardPreview className="w-16 h-16 rounded-xl overflow-hidden">
            <Skeleton animation="wave" className="absolute inset-0">
              <SkeletonItem style={{ width: "100%", height: "100%", borderRadius: 12 }} />
            </Skeleton>
          </CardPreview>
          <div className="flex-1 min-w-0 text-left">
            <CardHeader
              header={<Skeleton animation="wave"><SkeletonItem style={{ width: "80%", height: 20, borderRadius: 6 }} /></Skeleton>}
              description={<Skeleton animation="wave"><SkeletonItem style={{ width: "60%", height: 14, borderRadius: 6 }} /></Skeleton>}
            />
            <CardFooter>
              <Skeleton animation="wave"><SkeletonItem style={{ width: "90%", height: 14, borderRadius: 6 }} /></Skeleton>
            </CardFooter>
          </div>
        </div>
      </Card>
    );
  }

  const authorHref = plugin?.owner_id ? `/authors/${plugin.owner_id}` : null;
  const ratingAverage = Number(plugin?.rating_average ?? 0);
  const ratingCount = Number(plugin?.rating_count ?? 0);
  const hasRating = ratingCount > 0;
  const tags = Array.isArray(plugin?.tags) ? plugin.tags.filter(Boolean).slice(0, 2) : [];
  const tagNames = tags.map((t: any) => t.name ?? t);
  const ratingMetaRef = React.useRef<HTMLDivElement | null>(null);
  const ratingRef = React.useRef<HTMLDivElement | null>(null);
  const ratingDividerRef = React.useRef<HTMLSpanElement | null>(null);
  const tagMeasureRef = React.useRef<HTMLDivElement | null>(null);
  const [visibleTagCount, setVisibleTagCount] = React.useState(tagNames.length);

  React.useEffect(() => {
    const row = ratingMetaRef.current;
    const rating = ratingRef.current;
    const divider = ratingDividerRef.current;
    const measure = tagMeasureRef.current;

    if (!row || !rating || !divider || !measure || tagNames.length === 0) {
      setVisibleTagCount(tagNames.length);
      return;
    }

    const calculateVisibleTags = () => {
      const rowStyle = window.getComputedStyle(row);
      const groupStyle = window.getComputedStyle(measure);
      const rowGap = Number.parseFloat(rowStyle.columnGap || rowStyle.gap || "0") || 0;
      const groupGap = Number.parseFloat(groupStyle.columnGap || groupStyle.gap || "0") || 0;
      const availableWidth = row.clientWidth - rating.offsetWidth - divider.offsetWidth - rowGap * 2;
      let usedWidth = 0;
      let nextVisibleCount = 0;
      const items = Array.from(measure.children) as HTMLElement[];

      for (const item of items) {
        const nextWidth = item.offsetWidth + (nextVisibleCount > 0 ? groupGap * 2 + divider.offsetWidth : 0);
        if (usedWidth + nextWidth > availableWidth) break;
        usedWidth += nextWidth;
        nextVisibleCount += 1;
      }

      setVisibleTagCount(nextVisibleCount);
    };

    calculateVisibleTags();
    const observer = new ResizeObserver(calculateVisibleTags);
    observer.observe(row);
    return () => observer.disconnect();
  }, [tagNames.join("\u0000"), ratingAverage, hasRating]);
  const visibleTagNames = tagNames.slice(0, visibleTagCount);

  return (
    <Card appearance="filled" className={cardClass} style={{ boxShadow: "none" }} role="link" tabIndex={0} onClick={goDetail} onKeyDown={onKeyDown}>
      <div className="flex items-center gap-3 overflow-hidden">
        <CardPreview className="w-16 h-16 rounded-[16px] overflow-hidden flex-shrink-0 border border-gray-300 dark:border-gray-500">
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
              className="absolute inset-0 w-full h-full object-contain"
              onLoad={() => setIconLoading(false)}
              onError={() => { setImgSrc("/images/default_plugin.png"); setIconLoading(false); }}
            />
          </div>
        </CardPreview>

        <div className="flex-1 min-w-0 text-left">
          <div className="font-semibold text-base min-w-0" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{plugin?.name ?? "Undefined"}</div>
          {authorHref ? (
            <Link href={authorHref} className="hover:no-underline text-sm block truncate">
              {plugin.author || plugin.owner_id}
            </Link>
          ) : (
            <div className="text-sm text-gray-400 truncate">{plugin?.author ?? "作者未知"}</div>
          )}

          <CardFooter>
            {showRating && hasRating ? (
              <div ref={ratingMetaRef} className="relative flex items-center gap-2 text-gray-400 whitespace-nowrap overflow-hidden">
                <div ref={ratingRef} className="flex items-center gap-1 flex-shrink-0">
                  <span className="text-sm">{ratingAverage.toFixed(1)}</span>
                  <StarFilled fontSize={12} aria-hidden="true" />
                </div>
                {visibleTagNames.length > 0 && (
                  <>
                    <span ref={ratingDividerRef} className="w-px h-3 bg-gray-300 dark:bg-gray-600 flex-shrink-0" />
                    <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                      {visibleTagNames.map((name: string, i: number) => (
                        <React.Fragment key={i}>
                          {i > 0 && <span className="w-px h-3 bg-gray-300 dark:bg-gray-600 flex-shrink-0" />}
                          <Text size={200} className="text-gray-400 flex-shrink-0">{name}</Text>
                        </React.Fragment>
                      ))}
                    </div>
                  </>
                )}
                <div ref={tagMeasureRef} className="pointer-events-none invisible absolute left-0 top-0 flex items-center gap-2 whitespace-nowrap">
                  {tagNames.map((name: string, i: number) => (
                    <Text key={i} size={200} className="text-gray-400 flex-shrink-0">{name}</Text>
                  ))}
                </div>
              </div>
            ) : (
              <Text size={200} className="text-gray-300" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {plugin?.description ?? plugin?.desc ?? plugin?.summary ?? ""}
              </Text>
            )}
          </CardFooter>
        </div>

        {/*<Button appearance="transparent" icon={<ChevronRightRegular />} aria-label="查看详情" className="flex-shrink-0" />*/}
      </div>
    </Card>
  );
}

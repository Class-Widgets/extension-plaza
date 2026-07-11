"use client";
import * as React from "react";
import Link from "next/link";
import { Card, CardHeader, CardFooter, CardPreview, Text, Skeleton, SkeletonItem, Button } from "@fluentui/react-components";
import { ChevronRightRegular } from "@fluentui/react-icons";
import { useRouter } from "next/navigation";

interface PluginCardProps {
  plugin: any;
  isLoading?: boolean;
}

export default function PluginCard({ plugin, isLoading }: PluginCardProps) {
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

  return (
    <Card appearance="filled" className={cardClass} style={{ boxShadow: "none" }} role="link" tabIndex={0} onClick={goDetail} onKeyDown={onKeyDown}>
      <div className="flex items-center gap-3">
        <CardPreview className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
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
              className="absolute inset-0 w-full h-full object-contain border border-gray-300 dark:border-gray-500 rounded-xl"
              onLoad={() => setIconLoading(false)}
              onError={() => { setImgSrc("/images/default_plugin.png"); setIconLoading(false); }}
            />
          </div>
        </CardPreview>

        <div className="flex-1 min-w-0 text-left">
          <CardHeader
            header={<Text weight="semibold" size={400}>{plugin?.name ?? "Undefined"}</Text>}
            description={
              authorHref ? (
                <Link href={authorHref} className="text-blue-600 dark:text-blue-400 hover:underline text-sm" onClick={(e) => e.stopPropagation()}>
                  {plugin.author || plugin.owner_id}
                </Link>
              ) : (
                <Text size={200} className="text-gray-400">{plugin?.author ?? "作者未知"}</Text>
              )
            }
          />

          <CardFooter>
            <Text size={200} className="text-gray-300" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {plugin?.description ?? plugin?.desc ?? plugin?.summary ?? ""}
            </Text>
          </CardFooter>
        </div>

        <Button appearance="transparent" icon={<ChevronRightRegular />} aria-label="查看详情" className="flex-shrink-0" />
      </div>
    </Card>
  );
}

"use client";

import * as React from "react";
import { Button, Label, Text, Tooltip, Skeleton, SkeletonItem } from "@fluentui/react-components";
import {
  Carousel,
  CarouselAutoplayButtonProps,
  CarouselCard,
  CarouselNav,
  CarouselNavButton,
  CarouselNavContainer,
  CarouselSlider,
} from "@fluentui/react-carousel";
import Link from "next/link";

type PluginInfo = { id: string; name: string };
type BannerItem = { image: string; title?: string; desc?: string };

function seededRngFromDate(date: Date) {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const seed = y * 10000 + m * 100 + d;
  let state = (seed >>> 0) || 1;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
}

function seededPick<T>(arr: T[], count: number, rng: () => number): T[] {
  const n = Math.min(count, arr.length);
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

export default function Hero({ plugins }: { plugins?: PluginInfo[] }) {
  const [banners, setBanners] = React.useState<BannerItem[]>([]);
  const [bannerImgLoaded, setBannerImgLoaded] = React.useState<Record<number, boolean>>({});
  const [iconLoaded, setIconLoaded] = React.useState<Record<string, boolean>>({});
  React.useEffect(() => {
    const fetchBanners = async () => {
      try {
        const res = await fetch(`/api/banners?name=home`, { cache: "no-store" });
        const data = await res.json();
        if (data?.ok && Array.isArray(data?.data?.slides)) {
          setBanners(data.data.slides);
        }
      } catch (e) {
        // ignore, will use defaults below
      }
    };
    fetchBanners();
  }, []);

  const rng = React.useMemo(() => seededRngFromDate(new Date()), []);

  const selectedPlugins = React.useMemo(() => {
    const picked = seededPick(plugins ?? [], 6, rng);
    return picked.map((p) => ({ id: p.id, name: p.name, icon: `/api/plugins/${p.id}/resources/icon` }));
  }, [plugins, rng]);

  const defaults: BannerItem[] = [
    { image: "/window.svg", title: "欢迎来到扩展广场", desc: "精选扩展与主题，提升你的浏览体验。" },
    { image: "/next.svg", title: "每日推荐", desc: "看看今日为你挑选的好物。" },
  ];

  // 统一高度
  const heightClass = "h-72 md:h-80"; // 统一为 288/320px

  const s1 = {
    kind: "icons" as const,
    title: "欢迎光临 Class Widgets 插件广场",
    subtitle: "使用适用于 Class Widgets 2 的插件和主题让课程表如虎添翼",
    plugins: selectedPlugins,
  };
  const s2s3 = (banners.length >= 2 ? banners.slice(0, 2) : defaults).map((b) => ({ kind: "image" as const, banner: b }));
  const slides = [s1, ...s2s3];

  const [autoplayEnabled, setAutoplayEnabled] = React.useState(false);

  React.useEffect(() => {
    // 组件挂载后，立即启用自动播放
    setAutoplayEnabled(true);
    // 注意：这里的 useEffect 依赖是空的，只在组件第一次挂载时运行一次。
  }, []);


  return (
    <div className="w-full">
      <Carousel defaultActiveIndex={0} circular>
        <CarouselSlider>
          {slides.map((s, idx) => (
            <CarouselCard key={idx}>
              <div className={`rounded-3xl fluent-acrylic overflow-hidden relative ${heightClass}`}>
                {s.kind === "icons" ? (
                  <div className={
                    `absolute inset-0 flex flex-col items-center justify-center
                     p-6 bg-linear-to-br from-[#68C6E9] to-[#62F9BD]
                     dark:bg-radial-[at_50%_100%] dark:from-[#1CCFD5] dark:to-[#143E73]`
                  }>
                    <Text weight="bold" size={700} className="text-center">
                      {s.title}
                    </Text>
                    <Text size={400} className="mt-2 text-center">
                      {s.subtitle}
                    </Text>
                    <div className="mt-6 flex flex-wrap items-center justify-center gap-5">
                      {s.plugins.map((p) => (
                        <Tooltip key={p.id} content={p.name} relationship="label">
                          <Link href={`/plugins/${p.id}`} className="block" aria-label={p.name}>
                            <div className="relative w-16 h-16 rounded-2xl bg-white/70 shadow-sm ring-1 ring-black/5">
                              {!iconLoaded[p.id] && (
                                <Skeleton animation="wave" className="absolute inset-0">
                                  <SkeletonItem style={{ width: "100%", height: "100%", borderRadius: 16 }} />
                                </Skeleton>
                              )}
                              <img
                                src={p.icon}
                                alt={p.name}
                                className="absolute inset-0 w-full h-full object-contain"
                                onLoad={() => setIconLoaded((prev) => ({ ...prev, [p.id]: true }))}
                                onError={() => setIconLoaded((prev) => ({ ...prev, [p.id]: true }))}
                              />
                            </div>
                          </Link>
                        </Tooltip>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className={`absolute inset-0`}>
                    {!bannerImgLoaded[idx] && (
                      <Skeleton animation="wave" className="absolute inset-0">
                        <SkeletonItem style={{ width: "100%", height: "100%", borderRadius: 24 }} />
                      </Skeleton>
                    )}
                    {/* 图片 */}
                    <img
                      src={s.banner.image}
                      alt={s.banner.title ?? "banner"}
                      className="absolute inset-0 w-full h-full object-cover"
                      onLoad={() => setBannerImgLoaded((prev) => ({ ...prev, [idx]: true }))}
                      onError={() => setBannerImgLoaded((prev) => ({ ...prev, [idx]: true }))}
                    />
                    {/* 底部小字说明 */}
                    <div className="absolute bottom-0 left-0 right-0 h-14 text-center bg-gradient-to-t from-black/25 to-transparent flex items-center justify-center">
                      {s.banner.desc ? (
                        <div
                          className="banner-text-content text-white"
                          dangerouslySetInnerHTML={{ __html: s.banner.desc }}
                        />
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
            </CarouselCard>
          ))}
        </CarouselSlider>

        <CarouselNavContainer
          prev={{ "aria-label": "上一张" }}
          next={{ "aria-label": "下一张" }}
        >
          <CarouselNav>
            {(i) => <CarouselNavButton aria-label={`跳转到第 ${i + 1} 张`} />}
          </CarouselNav>
        </CarouselNavContainer>
      </Carousel>
    </div>
  );
}
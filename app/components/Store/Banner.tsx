"use client";

import * as React from "react";
import { Text, Tooltip, Skeleton, SkeletonItem } from "@fluentui/react-components";
import {
  Carousel,
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

export default function Banner({ plugins }: { plugins?: PluginInfo[] }) {
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
      } catch {}
    };
    fetchBanners();
  }, []);

  const rng = React.useMemo(() => seededRngFromDate(new Date()), []);

  const selectedPlugins = React.useMemo(() => {
    const picked = seededPick(plugins ?? [], 6, rng);
    return picked.map((p) => ({ id: p.id, name: p.name, icon: `/api/plugins/${p.id}/resources/icon` }));
  }, [plugins, rng]);

  const defaults: BannerItem[] = [
    { image: "/BannerWelcome.png", title: "欢迎来到插件广场", desc: "精选扩展与主题，提升你的浏览体验。" },
  ];

  const heightClass = "h-56 sm:h-64 md:h-80";

  const s1 = {
    kind: "icons" as const,
    title: "欢迎光临 Class Widgets 插件广场",
    subtitle: "使用适用于 Class Widgets 2 的插件和主题让课程表如虎添翼",
    plugins: selectedPlugins,
  };
  const s2s3 = (banners.length >= 2 ? banners.slice(0, 2) : defaults).map((b) => ({ kind: "image" as const, banner: b }));
  const slides = [s1, ...s2s3];

  const [autoplayEnabled, setAutoplayEnabled] = React.useState(true);

  const autoplayProps = {
    "aria-label": "自动播放",
    checked: autoplayEnabled,
    onCheckedChange: (_: any, data: { checked: boolean }) => {
      setAutoplayEnabled(data.checked);
    },
  };

  return (
      <div className="w-full">
        <Carousel defaultActiveIndex={0} circular className="overflow-hidden rounded-xl" autoplayInterval={4000}>
          <CarouselSlider>
            {slides.map((s, idx) => (
                <CarouselCard key={idx}>
                  <div className={`rounded-xl fluent-acrylic overflow-hidden relative ${heightClass}`}>
                    {s.kind === "icons" ? (
                        <div
                            className="
                      absolute inset-0 flex flex-col items-center justify-center
                      p-4 sm:p-6 bg-linear-to-br from-[#68C6E9] to-[#62F9BD]
                      dark:bg-radial-[at_50%_100%] dark:from-[#1CCFD5] dark:to-[#143E73]
                    "
                        >
                          <Text weight="bold" size={700} className="text-center text-sm sm:text-base md:text-lg">
                            {s.title}
                          </Text>
                          <Text size={400} className="mt-2 text-center text-xs sm:text-sm">
                            {s.subtitle}
                          </Text>
                          <div className="mt-4 sm:mt-6 flex flex-wrap items-center justify-center gap-3 sm:gap-5">
                            {s.plugins.map((p) => (
                                <Tooltip key={p.id} content={p.name} relationship="label">
                                  <Link href={`/plugins/${p.id}`} className="block" aria-label={p.name}>
                                    <div className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-white/70 shadow-sm ring-1 ring-black/5">
                                      {!iconLoaded[p.id] && (
                                          <Skeleton animation="wave" className="absolute inset-0">
                                            <SkeletonItem style={{ width: "100%", height: "100%", borderRadius: 16 }} />
                                          </Skeleton>
                                      )}
                                      <img
                                          src={p.icon}
                                          alt={p.name}
                                          className="absolute inset-0 w-full h-full object-contain rounded-2xl"
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
                        <div className="absolute inset-0">
                          {!bannerImgLoaded[idx] && (
                              <Skeleton animation="wave" className="absolute inset-0">
                                <SkeletonItem style={{ width: "100%", height: "100%", borderRadius: 24 }} />
                              </Skeleton>
                          )}
                          <img
                              src={s.banner.image}
                              alt={s.banner.title ?? "banner"}
                              className="
                                absolute inset-0 w-full h-full
                                object-cover
                                object-[center_top] sm:object-center
                              "
                              onLoad={() => setBannerImgLoaded((prev) => ({ ...prev, [idx]: true }))}
                              onError={() => setBannerImgLoaded((prev) => ({ ...prev, [idx]: true }))}
                          />
                          <div className="absolute bottom-0 left-0 right-0 h-10 sm:h-14 text-center bg-gradient-to-t from-black/25 to-transparent flex items-center justify-center">
                            {s.banner.desc ? (
                                <div className="banner-text-content text-white text-xs sm:text-sm px-2" dangerouslySetInnerHTML={{ __html: s.banner.desc }} />
                            ) : null}
                          </div>
                        </div>
                    )}
                  </div>
                </CarouselCard>
            ))}
          </CarouselSlider>

          <CarouselNavContainer
              autoplay={autoplayProps}
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

"use client";
import * as React from "react";
import { Button, Text, Card } from "@fluentui/react-components";
import Link from "next/link";

interface Slide {
  title: string;
  subtitle?: string;
  image?: string;
  href?: string;
}

export default function Banner({ slides }: { slides?: Slide[] }) {
  const defaultSlides: Slide[] = slides ?? [
    { title: "限时优惠", subtitle: "本周精选插件 8 折起", image: "/vercel.svg", href: "#" },
    { title: "新品上架", subtitle: "开发者工具与主题上新", image: "/next.svg", href: "#" },
    { title: "热卖排行", subtitle: "看看大家都在装什么", image: "/globe.svg", href: "#" },
  ];

  const [idx, setIdx] = React.useState(0);
  const total = defaultSlides.length;
  const timerRef = React.useRef<number | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  const next = React.useCallback(() => setIdx((i) => (i + 1) % total), [total]);
  const prev = React.useCallback(() => setIdx((i) => (i - 1 + total) % total), [total]);

  React.useEffect(() => {
    timerRef.current = window.setInterval(next, 5000);
    return () => { if (timerRef.current) window.clearInterval(timerRef.current); };
  }, [next]);

  const onMouseEnter = () => { if (timerRef.current) window.clearInterval(timerRef.current); };
  const onMouseLeave = () => { timerRef.current = window.setInterval(next, 5000); };

  const onKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key === "ArrowRight") next();
    if (e.key === "ArrowLeft") prev();
  };

  const s = defaultSlides[idx];

  return (
    <section aria-label="轮播横幅" className="relative">
      <div
        ref={containerRef}
        role="region"
        aria-roledescription="carousel"
        aria-live="polite"
        tabIndex={0}
        onKeyDown={onKeyDown}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className="fluent-acrylic rounded-xl overflow-hidden"
      >
        <div className="flex items-center gap-6 p-6">
          <img src={s.image ?? "/file.svg"} alt="banner" className="h-20 w-20 object-contain" />
          <div className="flex-1">
            <Text weight="semibold" size={500} className="text-[color:var(--colorNeutralForeground1,inherit)]">{s.title}</Text>
            {s.subtitle && (
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{s.subtitle}</p>
            )}
            {s.href && (
              <Link href={s.href} className="inline-block mt-3">
                <Button appearance="primary">立即查看</Button>
              </Link>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button aria-label="上一张" onClick={prev} appearance="subtle">‹</Button>
            <Button aria-label="下一张" onClick={next} appearance="subtle">›</Button>
          </div>
        </div>
      </div>

      <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2" aria-label="轮播指示器">
        {defaultSlides.map((_, i) => (
          <button
            key={i}
            aria-label={`跳转到第 ${i + 1} 张`}
            aria-current={i === idx ? "true" : undefined}
            onClick={() => setIdx(i)}
            className={`h-2 w-2 rounded-full ${i === idx ? "bg-blue-600" : "bg-gray-300"}`}
          />
        ))}
      </div>
    </section>
  );
}
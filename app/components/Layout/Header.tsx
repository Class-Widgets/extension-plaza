"use client";
import Link from "next/link";
import { Button, Tooltip, Text, Toolbar, ToolbarButton, TabList, Tab, SearchBox } from "@fluentui/react-components";
import {WeatherSunny24Regular, WeatherMoon24Regular, Desktop24Regular, ArrowLeft16Regular} from "@fluentui/react-icons";
import { useTheme } from "@/app/providers";
import { useRouter, usePathname } from "next/navigation";
import * as React from "react";

export default function Header() {
    const { isDarkMode, mode, cycleMode } = useTheme();
    const router = useRouter();
    const [q, setQ] = React.useState("");

    const submitSearch = () => {
        const keyword = q.trim();
        if (!keyword) return;
        router.push(`/search?q=${encodeURIComponent(keyword)}`);
    };

    return (
        <header className="sticky top-0 z-50 backdrop-blur border-b" style={{ backgroundColor: "var(--colorNeutralBackground2)", borderColor: "var(--colorNeutralStroke2)" }}>
            <div className="max-w-6xl mx-auto px-4">
                <Toolbar aria-label="App bar" className="h-20 px-0">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="flex items-center gap-2">
                            <Text weight="semibold" size={400}>Extension Plaza</Text>
                        </Link>

                        {/* 顶部导航改为标签页 TabList */}
                        <div className="hidden md:flex items-center gap-1 ml-4">
                          <HeaderTabs />
                        </div>
                    </div>

                    {/* 搜索框整合到 Header */}
                    <div className="ml-auto flex items-center gap-2">
                        <Tooltip content={`切换主题（当前：${mode === "light" ? "亮" : mode === "dark" ? "暗" : "系统"}）`} relationship="label">
                            <button
                                type="button"
                                aria-label="toggle theme"
                                onClick={cycleMode}
                                className="rounded-full focus:outline-none focus:ring-1 focus:ring-[var(--colorNeutralStroke2)] hover:bg-[var(--colorNeutralBackground3)]"
                                style={{ width: 28, height: 28, display: "inline-flex", alignItems: "center", justifyContent: "center", background: "transparent", color: "var(--colorNeutralForeground3)" }}
                                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); cycleMode(); } }}
                                title={`切换主题（当前：${mode === "light" ? "亮" : mode === "dark" ? "暗" : "系统"}）`}
                            >
                                {mode === "system" ? <Desktop24Regular style={{ width: 20, height: 20 }} /> : (isDarkMode ? <WeatherMoon24Regular style={{ width: 20, height: 20 }} /> : <WeatherSunny24Regular style={{ width: 20, height: 20 }} />)}
                            </button>
                        </Tooltip>

                        <Button as={"a"} appearance={"transparent"} href={"https://cw.rinlit.cn"} target={"_blank"} icon={<ArrowLeft16Regular/>}>
                            回到 Class Widgets
                        </Button>

                        <div className="hidden md:flex items-center gap-2">
                            <SearchBox value={q} onChange={(e, data) => setQ(data.value ?? "")} placeholder="搜索扩展或主题" size="medium" className="w-64" onKeyDown={(e: any) => { if (e.key === "Enter") submitSearch(); }} />
                        </div>
                    </div>
                </Toolbar>
            </div>
        </header>
    );
}

// 新增：HeaderTabs 组件，使用 Fluent TabList 进行标签导航
function HeaderTabs() {
  const router = useRouter();
  const pathname = usePathname();

  const tabs = [
    { label: "主页", value: "home", href: "/" },
    { label: "插件", value: "plugins", href: "/search" },
    { label: "主题", value: "themes", href: "#" },
    { label: "关于", value: "about", href: "#" },
  ];

  const selected = pathname === "/" ? "home" : (pathname?.startsWith("/search") ? "plugins" : "home");

  const onTabSelect: any = (_e: any, data: any) => {
    const target = tabs.find(t => t.value === data.value);
    if (target && target.href && target.href !== "#") {
      router.push(target.href);
    }
  };

  return (
    <TabList size="medium" selectedValue={selected} onTabSelect={onTabSelect}>
      {tabs.map(t => (
        <Tab key={t.value} value={t.value}>{t.label}</Tab>
      ))}
    </TabList>
  );
}
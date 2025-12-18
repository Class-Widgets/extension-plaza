"use client";
import Link from "next/link";
import { Button, Tooltip, Text, Toolbar, TabList, Tab, SearchBox, Drawer, DrawerBody, Input } from "@fluentui/react-components";
import {WeatherSunny24Regular, WeatherMoon24Regular, Desktop24Regular, ArrowLeft16Regular, Navigation24Regular, Search24Regular, Dismiss24Regular} from "@fluentui/react-icons";
import { useTheme } from "@/app/providers";
import { useRouter, usePathname } from "next/navigation";
import * as React from "react";

export default function Header() {
    const { isDarkMode, mode, cycleMode } = useTheme();
    const router = useRouter();
    const [q, setQ] = React.useState("");
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
    const [isMobileSearchOpen, setIsMobileSearchOpen] = React.useState(false);

    const submitSearch = () => {
        const keyword = q.trim();
        if (!keyword) return;
        router.push(`/search?q=${encodeURIComponent(keyword)}`);
        setIsMobileSearchOpen(false);
    };

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };

    return (
        <>
            <header className="sticky top-0 z-50 backdrop-blur border-b bg-white/80 dark:bg-[#1f1f1f]/90" style={{ borderColor: "var(--colorNeutralStroke2)" }}>
                <div className="max-w-6xl mx-auto px-4">
                    <Toolbar aria-label="App bar" className="h-20 px-0">
                        <div className="flex items-center gap-3 h-full">
                            <Link href="/" className="flex items-center gap-2">
                                <img
                                    alt={"Plugin Plaza"}
                                    src={"/images/logo.png"}
                                    className="w-9 h-9 object-contain"
                                />
                                <Text weight="bold" className="!text-[18px]">插件广场</Text>
                                <span className="rounded-full bg-yellow-400 text-black px-2 py-1 text-xs font-medium">BETA</span>
                            </Link>

                            {/* 桌面端导航标签页 */}
                            <div className="hidden md:flex items-center gap-1 ml-4">
                                <HeaderTabs />
                            </div>
                        </div>

                        {/* 右侧 */}
                        <div className="ml-auto flex items-center gap-2">
                            <div className="hidden lg:flex items-center gap-2">
                                <Button as={"a"} appearance={"transparent"} href={"https://cw.rinlit.cn"} target={"_blank"} icon={<ArrowLeft16Regular/>} className="hidden sm:inline-flex">
                                    回到 Class Widgets
                                </Button>
                            </div>

                            {/* 桌面端搜索框 */}
                            <div className="hidden md:flex items-center gap-2">
                                <SearchBox 
                                    value={q} 
                                    onChange={(e, data) => setQ(data.value ?? "")} 
                                    placeholder="搜索扩展或主题" 
                                    size="medium" 
                                    className="w-64" 
                                    onKeyDown={(e: React.KeyboardEvent) => { if (e.key === "Enter") submitSearch(); }} 
                                />
                            </div>

                            {/* 移动端搜索按钮 */}
                            <div className="lg:hidden">
                                <Button
                                    appearance="transparent"
                                    icon={<Search24Regular />}
                                    onClick={() => setIsMobileSearchOpen(true)}
                                    aria-label="搜索"
                                />
                            </div>

                            {/* 主题切换 */}
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

                            {/* 移动端汉堡菜单按钮 */}
                            <div className={"lg:hidden"}>
                                <Button
                                    appearance="transparent"
                                    icon={<Navigation24Regular />}
                                    onClick={toggleMobileMenu}
                                    aria-label="打开菜单"
                                />
                            </div>
                        </div>
                    </Toolbar>
                </div>
            </header>

            {/* 移动端搜索抽屉 */}
            <Drawer 
                position="end"
                open={isMobileSearchOpen} 
                onOpenChange={(_, data) => setIsMobileSearchOpen(data.open ?? false)}
                className="right-drawer"
            >
                <DrawerBody>
                    <div className="p-4 space-y-4">
                        <div className="flex items-center justify-between">
                            <Text weight="semibold" className="text-lg">搜索</Text>
                            <Button
                                appearance="transparent"
                                icon={<Dismiss24Regular />}
                                onClick={() => setIsMobileSearchOpen(false)}
                                aria-label="关闭搜索"
                            />
                        </div>
                        <Input
                            value={q}
                            onChange={(e, data) => setQ(data.value ?? "")}
                            placeholder="搜索扩展或主题"
                            size="large"
                            className="w-full"
                            onKeyDown={(e: React.KeyboardEvent) => { if (e.key === "Enter") submitSearch(); }}
                            autoFocus
                        />
                        <Button appearance="primary" onClick={submitSearch} className="w-full" size="large">
                            搜索
                        </Button>
                    </div>
                </DrawerBody>
            </Drawer>

            {/* 移动端导航抽屉 */}
            <Drawer 
                position="end"
                open={isMobileMenuOpen} 
                onOpenChange={(_, data) => setIsMobileMenuOpen(data.open ?? false)}
                className="right-drawer"
            >
                <DrawerBody>
                    <div className="p-4 space-y-6">
                        <div className="flex items-center justify-between">
                            <Text weight="semibold" className="text-md">导航</Text>
                            <Button
                                appearance="transparent"
                                icon={<Dismiss24Regular />}
                                onClick={closeMobileMenu}
                                aria-label="关闭菜单"
                            />
                        </div>
                        
                        {/* 移动端导航 */}
                        <MobileNavigation onNavigate={closeMobileMenu} />

                        {/* 移动端返回按钮 */}
                        <div className="pt-4 border-t" style={{ borderColor: "var(--colorNeutralStroke2)" }}>
                            <Button as={"a"} appearance={"transparent"} href={"https://cw.rinlit.cn"} target={"_blank"} icon={<ArrowLeft16Regular/>} className="w-full justify-start sm:hidden">
                                回到 Class Widgets
                            </Button>
                        </div>
                    </div>
                </DrawerBody>
            </Drawer>
        </>
    );
}


function HeaderTabs() {
    const router = useRouter();
    const pathname = usePathname();

    const tabs = [
        { label: "主页", value: "home", href: "/" },
        { label: "插件", value: "plugins", href: "/plugins" },
        { label: "主题", value: "themes", href: "/themes" },
        { label: "关于", value: "about", href: "/404" },
    ];

    let selected = "home";

    if (pathname === "/") {
        selected = "home";
    }

    else {
        const matchedTab = tabs.findLast((tab) => {
            // 检查：href 不是 / 且 pathname 确实以 href 开头
            return tab.href !== "/" && pathname?.startsWith(tab.href);
        });
        if (matchedTab) {
            selected = matchedTab.value;
        }
        else if (pathname?.startsWith("/search")) {
            selected = "home";
        }
    }

    const onTabSelect: any = (_e: React.SyntheticEvent, data: { value: string }) => {
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

function MobileNavigation({ onNavigate }: { onNavigate: () => void }) {
    const router = useRouter();
    const pathname = usePathname();

    const tabs = [
        { label: "主页", value: "home", href: "/" },
        { label: "插件", value: "plugins", href: "/plugins" },
        { label: "主题", value: "themes", href: "/themes" },
        { label: "关于", value: "about", href: "/404" },
    ];

    const handleNavigation = (href: string) => {
        router.push(href);
        onNavigate();
    };

    return (
        <div className="space-y-2">
            {tabs.map(tab => (
                <Button
                    key={tab.value}
                    appearance={pathname === tab.href || (tab.href !== "/" && pathname?.startsWith(tab.href)) ? "primary" : "transparent"}
                    className="w-full justify-start text-left"
                    onClick={() => handleNavigation(tab.href)}
                    icon={pathname === tab.href || (tab.href !== "/" && pathname?.startsWith(tab.href)) ? <Navigation24Regular /> : undefined}
                >
                    {tab.label}
                </Button>
            ))}
        </div>
    );
}
"use client";
import Link from "next/link";
import { Button, Tooltip, Text, Toolbar, TabList, Tab, SearchBox, Drawer, DrawerBody, Input, Avatar, Menu, MenuTrigger, MenuList, MenuItem, MenuPopover, NavDrawer, NavDrawerHeader, NavDrawerBody, NavDrawerFooter, NavItem } from "@fluentui/react-components";
import {WeatherSunny24Regular, WeatherMoon24Regular, Desktop24Regular, ArrowLeft16Regular, Navigation24Regular, Search24Regular, Dismiss24Regular, PersonCircle24Regular, SignOut24Regular} from "@fluentui/react-icons";
import { useTheme } from "@/app/providers";
import { useRouter, usePathname } from "next/navigation";
import * as React from "react";
import AuthDialog from "@/app/components/Auth/AuthDialog";
import { useAuthSession } from "@/app/components/Auth/useAuthSession";
import { supabase } from "@/lib/supabase";

export default function Header() {
    const { isDarkMode, mode, cycleMode } = useTheme();
    const router = useRouter();
    const pathname = usePathname();
    const [q, setQ] = React.useState("");
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
    const [isMobileSearchOpen, setIsMobileSearchOpen] = React.useState(false);
    const [authOpen, setAuthOpen] = React.useState(false);
    const [roles, setRoles] = React.useState<string[]>([]);
    const { user, signOut } = useAuthSession();
    // 所有已登录用户均可进入控制台（USER 也有开发者工作台）
    const canAccessConsole = roles.length > 0;
    const roleLabelMap: Record<string, string> = {
        MASTER: "管理员",
        CW_MAINTAINER: "维护员",
    };
    const roleText = roles.map((r) => roleLabelMap[r.toUpperCase()]).filter(Boolean).join("、");

    // 登录成功（如 OAuth 回调）后自动关闭对话框
    React.useEffect(() => {
        if (user && authOpen) setAuthOpen(false);
    }, [user, authOpen]);

    React.useEffect(() => {
        if (!user) {
            setRoles([]);
            return;
        }

        let mounted = true;
        Promise.all([
            supabase.from("profiles").select("role").eq("id", user.id).single(),
            supabase.from("user_roles").select("role").eq("user_id", user.id),
        ]).then(([profileRes, rolesRes]) => {
            if (!mounted) return;
            const profileRole = profileRes.data?.role;
            const extraRoles = (rolesRes.data || []).map((r: { role: string }) => r.role);
            const all = Array.from(new Set([profileRole, ...extraRoles].filter(Boolean) as string[]));
            setRoles(all);
        });

        return () => {
            mounted = false;
        };
    }, [user]);

    const handleSignOut = async () => {
        await signOut();
    };

    // 从 user metadata 中提取展示信息
    const userMeta = user?.user_metadata ?? {};
    const displayName = (userMeta.full_name as string) || (userMeta.name as string) || user?.email || "";
    const avatarUrl = userMeta.avatar_url as string | undefined;
    const initial = (displayName || user?.email || "?").charAt(0).toUpperCase();

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

    const selectedMobileNav = navigationTabs.find(tab => pathname === tab.href || (tab.href !== "/" && pathname?.startsWith(tab.href)))?.value ?? "";

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
                                <span className="hidden min-[400px]:inline-flex rounded-full bg-yellow-400 text-black px-2 py-1 text-xs font-medium">BETA</span>
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
                            <div className="hidden min-[800px]:flex items-center gap-2">
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
                            <div className="min-[800px]:hidden">
                                <Button
                                    appearance="transparent"
                                    icon={<Search24Regular />}
                                    onClick={() => setIsMobileSearchOpen(true)}
                                    aria-label="搜索"
                                />
                            </div>

                            {/* 登录按钮 / 用户菜单 */}
                            {user ? (
                                <Menu>
                                    <MenuTrigger disableButtonEnhancement>
                                        <Button
                                            appearance="transparent"
                                            className="!min-w-0 !px-1.5"
                                            aria-label="账户菜单"
                                        >
                                            {avatarUrl ? (
                                                <Avatar size={24} image={{ src: avatarUrl }} />
                                            ) : (
                                                <Avatar size={24} name={initial} />
                                            )}
                                        </Button>
                                    </MenuTrigger>
                                    <MenuPopover>
                                        <MenuList>
                                            <MenuItem disabled className="!cursor-default !max-w-[260px]">
                                                <div className="flex flex-col">
                                                    <Text size={200} truncate style={{ color: "var(--colorNeutralForeground3)" }}>
                                                        {user.email ?? displayName}
                                                    </Text>
                                                    {roleText && (
                                                        <Text size={100} style={{ color: "var(--colorNeutralForeground4)" }}>
                                                            {roleText}
                                                        </Text>
                                                    )}
                                                </div>
                                            </MenuItem>
                                            {canAccessConsole && (
                                                <MenuItem icon={<Navigation24Regular />} onClick={() => router.push("/admin")}>
                                                    插件广场控制台
                                                </MenuItem>
                                            )}
                                            <MenuItem icon={<SignOut24Regular />} onClick={handleSignOut}>
                                                退出登录
                                            </MenuItem>
                                        </MenuList>
                                    </MenuPopover>
                                </Menu>
                            ) : (
                                <Button
                                    appearance="transparent"
                                    icon={<PersonCircle24Regular />}
                                    onClick={() => setAuthOpen(true)}
                                    aria-label="登录"
                                />
                            )}

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
            <NavDrawer 
                position="end"
                open={isMobileMenuOpen} 
                onOpenChange={(_, data) => setIsMobileMenuOpen(data.open ?? false)}
                className="right-drawer"
                selectedValue={selectedMobileNav}
                density="medium"
            >
                <NavDrawerHeader>
                    <div className="p-4 flex items-center justify-between">
                        <Text weight="semibold" className="text-md">导航</Text>
                        <Button
                            appearance="transparent"
                            icon={<Dismiss24Regular />}
                            onClick={closeMobileMenu}
                            aria-label="关闭菜单"
                        />
                    </div>
                </NavDrawerHeader>
                <NavDrawerBody>
                    <div className="px-4 pb-4 space-y-6">
                        <div>
                            {navigationTabs.map(tab => (
                                <NavItem
                                    key={tab.value}
                                    value={tab.value}
                                    href={tab.href}
                                    onClick={(e) => { e.preventDefault(); router.push(tab.href); closeMobileMenu(); }}
                                    icon={selectedMobileNav === tab.value ? <Navigation24Regular /> : undefined}
                                >
                                    {tab.label}
                                </NavItem>
                            ))}
                        </div>

                        <div className="pt-4 border-t" style={{ borderColor: "var(--colorNeutralStroke2)" }}>
                            <NavItem href="https://cw.rinlit.cn" target="_blank" value="class-widgets" icon={<ArrowLeft16Regular/>} className="sm:hidden">
                                回到 Class Widgets
                            </NavItem>
                        </div>
                    </div>
                </NavDrawerBody>
                <NavDrawerFooter>
                    <div className="p-4 border-t space-y-2" style={{ borderColor: "var(--colorNeutralStroke2)" }}>
                        {user ? (
                            <>
                                <div className="flex items-center gap-2 px-2">
                                    {avatarUrl ? (
                                        <Avatar size={28} image={{ src: avatarUrl }} />
                                    ) : (
                                        <Avatar size={28} name={initial} />
                                    )}
                                    <div className="flex flex-col min-w-0">
                                        <Text size={300} truncate className="max-w-[200px]">
                                            {user.email ?? displayName}
                                        </Text>
                                        {roleText && (
                                            <Text size={100} style={{ color: "var(--colorNeutralForeground4)" }}>
                                                {roleText}
                                            </Text>
                                        )}
                                    </div>
                                </div>
                                {canAccessConsole && (
                                    <NavItem
                                        value="admin"
                                        onClick={() => { router.push("/admin"); closeMobileMenu(); }}
                                        icon={<Navigation24Regular />}
                                    >
                                        插件广场控制台
                                    </NavItem>
                                )}
                                <NavItem
                                    value="sign-out"
                                    onClick={() => { handleSignOut(); closeMobileMenu(); }}
                                    icon={<SignOut24Regular />}
                                >
                                    退出登录
                                </NavItem>
                            </>
                        ) : (
                            <Button
                                appearance="primary"
                                icon={<PersonCircle24Regular />}
                                className="w-full justify-center"
                                onClick={() => { setAuthOpen(true); closeMobileMenu(); }}
                            >
                                登录
                            </Button>
                        )}
                    </div>
                </NavDrawerFooter>
            </NavDrawer>

            {/* 登录对话框 */}
            <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
        </>
    );
}


function HeaderTabs() {
    const router = useRouter();
    const pathname = usePathname();

    let selected = "home";

    if (pathname === "/") {
        selected = "home";
    }

    else {
        const matchedTab = navigationTabs.findLast((tab) => {
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

    const onTabSelect = (_e: React.SyntheticEvent, data: { value: unknown }) => {
        const target = navigationTabs.find(t => t.value === data.value);
        if (target && target.href && target.href !== "#") {
            router.push(target.href);
        }
    };

    return (
        <TabList size="medium" selectedValue={selected} onTabSelect={onTabSelect}>
            {navigationTabs.map(t => (
                <Tab key={t.value} value={t.value}>{t.label}</Tab>
            ))}
        </TabList>
    );
}

const navigationTabs = [
    { label: "主页", value: "home", href: "/" },
    { label: "插件", value: "plugins", href: "/plugins" },
    { label: "主题", value: "themes", href: "/themes" },
    { label: "关于", value: "about", href: "/404" },
];

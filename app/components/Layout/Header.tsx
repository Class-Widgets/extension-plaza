"use client";
import Link from "next/link";
import { Badge, Button, Tooltip, Text, Toolbar, TabList, Tab, SearchBox, Drawer, DrawerBody, Input, Avatar, Menu, MenuTrigger, MenuList, MenuItem, MenuPopover, NavDrawer, NavDrawerHeader, NavDrawerBody, NavDrawerFooter, NavItem, Tag } from "@fluentui/react-components";
import {WeatherSunny24Regular, WeatherMoon24Regular, Desktop24Regular, ArrowLeft16Regular, Navigation24Regular, Search24Regular, Dismiss24Regular, PersonCircle24Regular, SignOut24Regular} from "@fluentui/react-icons";
import { useTheme } from "@/app/providers";
import { useRouter, usePathname } from "next/navigation";
import * as React from "react";
import AuthDialog from "@/app/components/Auth/AuthDialog";
import { useAuthSession } from "@/app/components/Auth/useAuthSession";
import { supabase } from "@/lib/supabase";
import { formatNotificationCount, useConsoleNotifications } from "./useConsoleNotifications";

export default function Header() {
    const { isDarkMode, mode, cycleMode } = useTheme();
    const router = useRouter();
    const pathname = usePathname();
    const [q, setQ] = React.useState("");
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
    const [isMobileSearchOpen, setIsMobileSearchOpen] = React.useState(false);
    const [authOpen, setAuthOpen] = React.useState(false);
    const [roles, setRoles] = React.useState<string[]>([]);
    const [profileDisplayName, setProfileDisplayName] = React.useState<string | null>(null);
    const { user, signOut } = useAuthSession();
    const { count: consoleNotificationCount } = useConsoleNotifications(user?.id, roles);
    // 所有已登录用户均可进入控制台（USER 也有开发者工作台）
    const canAccessConsole = roles.length > 0;
    // 角色等级：数值越小等级越高
    const roleHierarchy: Record<string, number> = { MASTER: 0, CW_MAINTAINER: 1 };
    const roleLabelMap: Record<string, string> = {
        MASTER: "管理员",
        CW_MAINTAINER: "CW 运营维护",
    };
    const sortedRoles = [...roles].sort(
        (a, b) => (roleHierarchy[a.toUpperCase()] ?? 99) - (roleHierarchy[b.toUpperCase()] ?? 99)
    );
    const roleLabelsList = sortedRoles.map((r) => roleLabelMap[r.toUpperCase()]).filter(Boolean);

    // 登录成功（如 OAuth 回调）后自动关闭对话框
    React.useEffect(() => {
        if (user && authOpen) setAuthOpen(false);
    }, [user, authOpen]);

    React.useEffect(() => {
        if (!user) {
            setRoles([]);
            setProfileDisplayName(null);
            return;
        }

        let mounted = true;
        Promise.all([
            supabase.from("profiles").select("role, display_name").eq("id", user.id).single(),
            supabase.from("user_roles").select("role").eq("user_id", user.id),
        ]).then(([profileRes, rolesRes]) => {
            if (!mounted) return;
            const profileRole = profileRes.data?.role;
            const profileDisplayName = profileRes.data?.display_name as string | undefined;
            const extraRoles = (rolesRes.data || []).map((r: { role: string }) => r.role);
            const all = Array.from(new Set([profileRole, ...extraRoles].filter(Boolean) as string[]));
            setRoles(all);
            // 如果数据库中有 display_name，记录下来用于展示
            if (profileDisplayName) {
                setProfileDisplayName(profileDisplayName);
            }
        });

        return () => {
            mounted = false;
        };
    }, [user]);

    const handleSignOut = async () => {
        await signOut();
    };

    // 从 user metadata 或 profiles 表中提取展示信息
    const userMeta = user?.user_metadata ?? {};
    const displayName = profileDisplayName || (userMeta.full_name as string) || (userMeta.name as string) || user?.email || "";
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
                            <Link href="/" className="flex items-center gap-2 no-brand-link">
                                <img
                                    alt={"Plugin Plaza"}
                                    src={"/images/logo.png"}
                                    className="w-9 h-9 object-contain"
                                />
                                <Text weight="bold" className="!text-[18px]">插件广场</Text>
                                <span className="inline-flex rounded-full bg-yellow-400 text-black px-2 py-1 text-xs font-medium">BETA</span>
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
                                            <span className="relative inline-flex">
                                                {avatarUrl ? (
                                                    <Avatar size={24} image={{ src: avatarUrl }} />
                                                ) : (
                                                    <Avatar size={24} name={initial} />
                                                )}
                                                {consoleNotificationCount > 0 && (
                                                    <Badge
                                                        appearance="filled"
                                                        color="danger"
                                                        size="small"
                                                        className="!absolute -right-2 -bottom-1 z-10 !min-w-4 !px-1"
                                                        aria-label={`控制台有 ${formatNotificationCount(consoleNotificationCount)} 条待处理消息`}
                                                    >
                                                        {formatNotificationCount(consoleNotificationCount)}
                                                    </Badge>
                                                )}
                                            </span>
                                        </Button>
                                    </MenuTrigger>
                                    <MenuPopover>
                                        <MenuList>
                                            <MenuItem disabled className="!cursor-default !max-w-[260px]">
                                                <div className="flex flex-col">
                                                    <Text size={200} truncate style={{ color: "var(--colorNeutralForeground3)" }}>
                                                        {displayName || user.email}
                                                    </Text>
                                                    {roleLabelsList.length > 0 && (
                                                        <div className="flex flex-wrap gap-0.5 mt-0.5">
                                                            {roleLabelsList.map((label) => (
                                                                <Tag key={label} size="extra-small" appearance="brand">{label}</Tag>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </MenuItem>
                                            <MenuItem icon={<PersonCircle24Regular />} onClick={() => window.open("https://rinlit.cn/zh-cn/account/", "_blank")}>
                                                管理 RinLit 账户
                                            </MenuItem>
                                            {canAccessConsole && (
                                                <MenuItem icon={<Navigation24Regular />} onClick={() => router.push("/console")}>
                                                    <span className="flex w-full min-w-[190px] items-center gap-4">
                                                        <span>插件广场控制台</span>
                                                        {consoleNotificationCount > 0 && (
                                                            <Badge appearance="filled" color="danger" size="small" className="ml-auto !min-w-5 !px-1">
                                                                {formatNotificationCount(consoleNotificationCount)}
                                                            </Badge>
                                                        )}
                                                    </span>
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

                            {/* 主题切换 - 桌面端显示 */}
                            <div className="hidden lg:inline-flex">
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
                            </div>

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

                        <div className="pt-4 border-t lg:hidden" style={{ borderColor: "var(--colorNeutralStroke2)" }}>
                            <NavItem
                                value="theme-toggle"
                                onClick={() => { cycleMode(); closeMobileMenu(); }}
                                icon={mode === "system" ? <Desktop24Regular /> : (isDarkMode ? <WeatherMoon24Regular /> : <WeatherSunny24Regular />)}
                            >
                                切换主题（当前：{mode === "light" ? "亮" : mode === "dark" ? "暗" : "系统"}）
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
                                            {displayName || user.email}
                                        </Text>
                                        {roleLabelsList.length > 0 && (
                                            <div className="flex flex-wrap gap-0.5 mt-0.5">
                                                {roleLabelsList.map((label) => (
                                                    <Tag key={label} size="extra-small" appearance="brand">{label}</Tag>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {canAccessConsole && (
                                    <NavItem
                                        value="admin"
                                        onClick={() => { router.push("/console"); closeMobileMenu(); }}
                                        icon={<Navigation24Regular />}
                                    >
                                        <span className="flex w-full items-center gap-4">
                                            <span>插件广场控制台</span>
                                            {consoleNotificationCount > 0 && (
                                                <Badge appearance="filled" color="danger" size="small" className="ml-auto !min-w-5 !px-1">
                                                    {formatNotificationCount(consoleNotificationCount)}
                                                </Badge>
                                            )}
                                        </span>
                                    </NavItem>
                                )}
                                <NavItem
                                    value="account"
                                    onClick={() => { window.open("https://rinlit.cn/zh-cn/account/", "_blank"); closeMobileMenu(); }}
                                    icon={<PersonCircle24Regular />}
                                >
                                    管理 RinLit 账户
                                </NavItem>
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

"use client";

import * as React from "react";
import {
    FluentProvider,
    createLightTheme,
    createDarkTheme,
    SSRProvider,
    Toaster,
} from "@fluentui/react-components";
import type { BrandVariants } from "@fluentui/react-components";
import { createContext, useContext, useEffect, useState } from "react";

// 品牌主题色：亮色 #4099b2（对应色阶 80，即按钮/前景主色），暗色 #5CDCFF（对应色阶 100，即强调色）
const BRAND_LIGHT_BASE = "#4099b2";
const BRAND_DARK_BASE = "#5CDCFF";

// 将 base 向 target 按比例线性混合，生成新色值
function mixHex(base: string, target: string, ratio: number): string {
    const parse = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
    const b = parse(base);
    const t = parse(target);
    return "#" + b.map((c, i) => Math.round(c + (t[i] - c) * ratio).toString(16).padStart(2, "0")).join("");
}

// 以锚点色阶为基准，按 Fluent 官方 brandWeb 的深浅递进比例生成完整 16 档色阶
// anchor=80：亮色主题主色；anchor=100：暗色主题强调色
function buildBrand(base: string, anchor: 80 | 100): BrandVariants {
    const darkSteps: Record<number, number> =
        anchor === 80
            ? { 70: 0.13, 60: 0.25, 50: 0.37, 40: 0.5, 30: 0.62, 20: 0.75, 10: 0.87 }
            : { 90: 0.18, 80: 0.32, 70: 0.45, 60: 0.56, 50: 0.66, 40: 0.76, 30: 0.84, 20: 0.9, 10: 0.95 };
    const lightSteps: Record<number, number> =
        anchor === 80
            ? { 90: 0.15, 100: 0.3, 110: 0.42, 120: 0.52, 130: 0.62, 140: 0.72, 150: 0.82, 160: 0.92 }
            : { 110: 0.15, 120: 0.3, 130: 0.45, 140: 0.6, 150: 0.75, 160: 0.9 };

    const brand = { [anchor]: base } as BrandVariants;
    for (const [shade, ratio] of Object.entries(darkSteps)) {
        brand[Number(shade) as keyof BrandVariants] = mixHex(base, "#000000", ratio);
    }
    for (const [shade, ratio] of Object.entries(lightSteps)) {
        brand[Number(shade) as keyof BrandVariants] = mixHex(base, "#ffffff", ratio);
    }
    return brand;
}

const appLightTheme = createLightTheme(buildBrand(BRAND_LIGHT_BASE, 80));

// 暗色主题：使用 #5CDCFF 作为强调色，并覆盖按钮背景为亮色
const rawDarkTheme = createDarkTheme(buildBrand(BRAND_DARK_BASE, 100));
const appDarkTheme = {
    ...rawDarkTheme,
    // 主按钮背景使用 brand[100] (#5CDCFF) 而非默认的 brand[70]（太暗）
    colorBrandBackground: "#5CDCFF", // brand[100]
    colorBrandBackgroundHover: "#74E1FF", // brand[110] (稍亮)
    colorBrandBackgroundPressed: "#4BB4D1", // brand[90] (稍暗)
    colorBrandBackgroundSelected: "#5CDCFF", // brand[100]
    // 按钮文字改为深色以保证对比度（亮蓝底 + 黑字）
    colorNeutralForegroundOnBrand: "#000000",
};

// 创建主题上下文：支持 light/dark/system 模式
interface ThemeContextType {
    isDarkMode: boolean;
    mode: "light" | "dark" | "system";
    setMode: (m: "light" | "dark" | "system") => void;
    cycleMode: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
    isDarkMode: false,
    mode: "system",
    setMode: () => {},
    cycleMode: () => {},
});

export const useTheme = () => useContext(ThemeContext);

// 应用级浅色背景：与全局 light 主题保持一致
// 供 FilterToolbar 等组件通过 tokens.colorNeutralBackground1 自动同步
const APP_LIGHT_BACKGROUND = "#f3f3f3";

export function Providers({ children }: { children: React.ReactNode }) {
    const [mode, setMode] = useState<"light" | "dark" | "system">("system");
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [mounted, setMounted] = useState(false);

    // 初始化：从 localStorage 读取主题模式
    useEffect(() => {
        const storedMode = typeof window !== "undefined" ? (localStorage.getItem("themeMode") as any) : null;
        const initialMode = storedMode === "light" || storedMode === "dark" || storedMode === "system" ? storedMode : "system";
        setMode(initialMode);
        setMounted(true);
    }, []);

    // 根据 mode 更新 isDarkMode，并在 system 模式下监听系统主题
    useEffect(() => {
        const apply = () => {
            if (mode === "system") {
                const mq = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)");
                setIsDarkMode(mq ? mq.matches : false);
            } else {
                setIsDarkMode(mode === "dark");
            }
        };
        apply();
        let mq: MediaQueryList | null = null;
        const onChange = () => apply();
        if (mode === "system" && window.matchMedia) {
            mq = window.matchMedia("(prefers-color-scheme: dark)");
            mq.addEventListener?.("change", onChange);
        }
        return () => {
            mq?.removeEventListener?.("change", onChange);
        };
    }, [mode]);

    const setModePersist = (m: "light" | "dark" | "system") => {
        setMode(m);
        try { localStorage.setItem("themeMode", m); } catch {}
    };

    const cycleMode = () => {
        setModePersist(mode === "light" ? "dark" : mode === "dark" ? "system" : "light");
    };

    useEffect(() => {
        const body = document.body;
        if (isDarkMode) {
            body.classList.add('tw-dark');
            body.style.backgroundColor = "";
        } else {
            body.classList.remove('tw-dark');
            body.style.backgroundColor = APP_LIGHT_BACKGROUND;
        }
    }, [isDarkMode]);

    const currentTheme = isDarkMode ? appDarkTheme : appLightTheme;

    if (!mounted) {
        return <div style={{ visibility: "hidden" }}>{children}</div>;
    }

    return (
        <ThemeContext.Provider value={{ isDarkMode, mode, setMode: setModePersist, cycleMode }}>
            <SSRProvider>
                <FluentProvider theme={currentTheme} className={"transition-colors duration-200"}>
                    <div className="min-h-screen flex flex-col dark:bg-transparent" style={{ backgroundColor: isDarkMode ? undefined : APP_LIGHT_BACKGROUND }}>
                        {children}
                    </div>
                    {/* 全局 Toast 容器：右下角，供 useToastController 弹出提示 */}
                    <Toaster position="bottom-end" />
                </FluentProvider>
            </SSRProvider>
        </ThemeContext.Provider>
    );
}

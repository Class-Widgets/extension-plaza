"use client";

import * as React from "react";
import {
    FluentProvider,
    webLightTheme,
    webDarkTheme,
    Theme,
    SSRProvider,
} from "@fluentui/react-components";
import { createContext, useContext, useEffect, useState } from "react";

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
        if (isDarkMode) body.classList.add('tw-dark');
        else body.classList.remove('tw-dark');
    }, [isDarkMode]);

    const currentTheme: Theme = isDarkMode ? webDarkTheme : webLightTheme;

    if (!mounted) {
        return <div style={{ visibility: "hidden" }}>{children}</div>;
    }

    return (
        <ThemeContext.Provider value={{ isDarkMode, mode, setMode: setModePersist, cycleMode }}>
            <SSRProvider>
                <FluentProvider theme={currentTheme} className={"transition-colors duration-200"}>
                    <div className="min-h-screen bg-gray-200/50 dark:bg-transparent">
                        {children}
                    </div>
                </FluentProvider>
            </SSRProvider>
        </ThemeContext.Provider>
    );
}
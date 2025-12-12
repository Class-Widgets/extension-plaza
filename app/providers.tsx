"use client";

import * as React from "react";
import {
    FluentProvider,
    webLightTheme,
    webDarkTheme,
    Theme,
} from "@fluentui/react-components";
import { createContext, useContext, useEffect, useState } from "react";

// 创建主题上下文，让 Header 可以控制开关
interface ThemeContextType {
    isDarkMode: boolean;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
    isDarkMode: false,
    toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export function Providers({ children }: { children: React.ReactNode }) {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // 手动控制为主：仅从 localStorage 读取，默认亮色
        const stored = typeof window !== "undefined" ? localStorage.getItem("theme") : null;
        setIsDarkMode(stored === "dark" ? true : false);
        setMounted(true);
    }, []);

    const toggleTheme = () => {
        setIsDarkMode((prev) => {
            const next = !prev;
            try {
                localStorage.setItem("theme", next ? "dark" : "light");
            } catch {}
            return next;
        });
    };

    // 同步 Tailwind 的 dark mode class
    useEffect(() => {
        const root = document.documentElement;
        if (isDarkMode) {
            root.classList.add("dark");
        } else {
            root.classList.remove("dark");
        }
    }, [isDarkMode]);

    const currentTheme: Theme = isDarkMode ? webDarkTheme : webLightTheme;

    // 防止水化不匹配
    if (!mounted) {
        return <div style={{ visibility: "hidden" }}>{children}</div>;
    }

    return (
        <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
            <FluentProvider theme={currentTheme}>
                <div className="min-h-screen bg-transparent">
                    {children}
                </div>
            </FluentProvider>
        </ThemeContext.Provider>
    );
}
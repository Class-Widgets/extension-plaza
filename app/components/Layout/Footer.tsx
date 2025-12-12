"use client";
import { Text, Link as FluentLink } from "@fluentui/react-components";
import NextLink from "next/link";


export default function Footer() {
    return (
        <footer className="mt-10 border-t" style={{ backgroundColor: "var(--colorNeutralBackground2)", borderColor: "var(--colorNeutralStroke2)" }}>
            <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        
                        <Text size={300}>Extension Plaza</Text>
                    </div>
                    <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>探索并安装社区插件，提升你的产品力。</Text>
                </div>
                <div className="space-y-2">
                    <Text weight="semibold" size={300}>关于</Text>
                    <NextLink href="#" className="text-sm hover:underline" style={{ color: "var(--colorNeutralForeground2)" }}>项目介绍</NextLink>
                    <NextLink href="#" className="text-sm hover:underline" style={{ color: "var(--colorNeutralForeground2)" }}>更新日志</NextLink>
                </div>
                <div className="space-y-2">
                    <Text weight="semibold" size={300}>帮助</Text>
                    <NextLink href="#" className="text-sm hover:underline" style={{ color: "var(--colorNeutralForeground2)" }}>常见问题</NextLink>
                    <NextLink href="#" className="text-sm hover:underline" style={{ color: "var(--colorNeutralForeground2)" }}>反馈问题</NextLink>
                </div>
                <div className="space-y-2">
                    <Text weight="semibold" size={300}>链接</Text>
                    <FluentLink href="https://github.com" appearance="subtle">GitHub</FluentLink>
                    <FluentLink href="https://apps.microsoft.com/home?hl=zh-CN&gl=US" appearance="subtle" target="_blank">Microsoft Store</FluentLink>
                </div>
            </div>
            <div className="px-4 max-w-6xl mx-auto pb-8 text-xs" style={{ color: "var(--colorNeutralForeground3)" }}>© 2025 Extension Plaza — Made with ❤ by Rin酱</div>
        </footer>
    );
}
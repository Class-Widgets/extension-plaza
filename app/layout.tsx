
import "./globals.css";
import "./style/readme.css";
import {Providers} from "@/app/providers";
import AppShell from "@/app/AppShell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "插件广场 - Class Widgets 2",
  icons: {
    icon: [
      {
        url: "/images/logo.png",
        type: "image/png",
      },
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="zh-CN">
        <body className="min-h-screen flex flex-col">
        <Providers>
            <AppShell>{children}</AppShell>
        </Providers>
        </body>
        </html>
    );
}
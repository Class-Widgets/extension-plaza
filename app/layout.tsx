
import "./globals.css";
import "./style/readme.css";
import {Providers} from "@/app/providers";
import Header from "@/app/components/Layout/Header";
import Footer from "@/app/components/Layout/Footer";
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
            <Header />
            <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-6">{children}</main>
            <Footer />
        </Providers>
        </body>
        </html>
    );
}
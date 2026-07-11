"use client";

import { usePathname } from "next/navigation";
import Header from "@/app/components/Layout/Header";
import Footer from "@/app/components/Layout/Footer";

export default function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAdmin = pathname?.startsWith("/admin");

    if (isAdmin) {
        return (
            <div className="h-screen overflow-hidden flex flex-col">
                <Header />
                {children}
            </div>
        );
    }

    return (
        <>
            <Header />
            <main className="flex-1 w-full">{children}</main>
            <Footer />
        </>
    );
}

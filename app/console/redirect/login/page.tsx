"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button, Text } from "@fluentui/react-components";
import { ArrowLeftRegular } from "@fluentui/react-icons";
import AuthDialog from "@/app/components/Auth/AuthDialog";
import { useAuthSession } from "@/app/components/Auth/useAuthSession";

export default function AdminLoginPage() {
    const router = useRouter();
    const { user } = useAuthSession();
    const [authOpen, setAuthOpen] = React.useState(false);

    React.useEffect(() => {
        if (user) router.replace("/console");
    }, [router, user]);

    return (
        <main className="flex-1 flex flex-col items-center justify-center p-4 gap-2">
            <div className="mb-4 mt-[-15vh]">
                <Image
                    src="/images/caution/404.png"
                    alt="需要登录"
                    width={100}
                    height={100}
                    className="mx-auto"
                />
            </div>
            <Text as="h1" weight="semibold" size={700} className="text-[var(--colorNeutralForeground1)] !mb-4">
                需要登录后访问
            </Text>
            <Text as="p" size={400} className="max-w-md text-center text-[var(--colorNeutralForeground2)] leading-relaxed text-wrap-pretty">
                登录后即可进入插件广场控制台，提交和管理你的插件。
            </Text>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-2">
                <Button appearance="primary" onClick={() => setAuthOpen(true)}>
                    立即登录
                </Button>
                <Button appearance="secondary" onClick={() => router.push("/")} icon={<ArrowLeftRegular />}>
                    回到插件广场
                </Button>
            </div>
            <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
        </main>
    );
}

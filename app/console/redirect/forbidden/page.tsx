"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button, Text } from "@fluentui/react-components";
import { ArrowLeftRegular } from "@fluentui/react-icons";

export default function AdminForbiddenPage() {
    const router = useRouter();

    return (
        <main className="flex-1 flex flex-col items-center justify-center p-4 gap-2">
            <div className="mb-4 mt-[-15vh]">
                <Image
                    src="/images/caution/404.png"
                    alt="权限不足"
                    width={100}
                    height={100}
                    className="mx-auto"
                />
            </div>
            <Text as="h1" weight="semibold" size={700} className="text-[var(--colorNeutralForeground1)] !mb-4">
                暂时无法访问这里
            </Text>
            <Text as="p" size={400} className="max-w-md text-center text-[var(--colorNeutralForeground2)] leading-relaxed text-wrap-pretty">
                当前账户没有插件广场控制台的访问权限，请联系管理员确认账号角色。
            </Text>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-2">
                <Button appearance="primary" onClick={() => router.push("/")} icon={<ArrowLeftRegular />}>
                    回到插件广场
                </Button>
            </div>
        </main>
    );
}

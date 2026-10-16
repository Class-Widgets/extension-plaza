"use client";
import { Text, Link as FluentLink, Divider, tokens } from "@fluentui/react-components";
import NextLink from "next/link";

export default function Footer() {
    return (
        <footer
            style={{
                backgroundColor: tokens.colorNeutralBackground2,
                borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
                marginTop: tokens.spacingVerticalXXXL,
            }}
        >
            <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="flex flex-col gap-2">
                    <NextLink href="/" className="flex items-center gap-2 ">
                        <img
                            alt={"Plugin Plaza"}
                            src={"/images/logo.png"}
                            className="w-9 h-9 object-contain"
                        />
                        <Text weight="bold" className="!text-[18px]">插件广场</Text>
                    </NextLink>
                    <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>使用适用于 Class Widgets 2 的插件和主题让课程表如虎添翼</Text>
                </div>

                <div className="flex flex-col gap-2 md:col-start-3">
                    <Text weight="semibold" size={300}>关于</Text>
                    <NextLink href="/about" passHref><FluentLink appearance="subtle"><Text size={200}>项目介绍</Text></FluentLink></NextLink>
                </div>


                <div className="flex flex-col gap-2">
                    <Text weight="semibold" size={300}>更多内容</Text>
                    <FluentLink href="https://cw.rinlit.cn" appearance="subtle" target="_blank"><Text size={200}>Class Widgets</Text></FluentLink>
                    <FluentLink href="https://github.com/RinLit-233-shiroko/Class-Widgets-2" appearance="subtle" target="_blank"><Text size={200}>Class Widgets 2 仓库</Text></FluentLink>
                </div>
            </div>
            <Divider />
            <div className="px-4 max-w-6xl mx-auto pb-8 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center">
                <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>© 2025 Class Widgets</Text>
                <FluentLink
                    href="https://beian.miit.gov.cn/"
                    target="_blank"
                    rel="noopener noreferrer"
                    appearance="subtle"
                >
                    <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>琼ICP备2026014960号-1</Text>
                </FluentLink>
            </div>
        </footer>
    );
}

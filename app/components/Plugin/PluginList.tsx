"use client";
import Link from "next/link";
import { Button, Text, Avatar } from "@fluentui/react-components";

export default function PluginList({ plugins }: { plugins: any[] }) {
    return (
        <div className="flex flex-col divide-y divide-gray-200 dark:divide-gray-800">
            {plugins.map((plugin) => (
                <div key={plugin.id} className="py-4 flex items-center justify-between gap-4">
                    <Link href={`/plugins/${plugin.id}`} className="flex items-center gap-4">
                        <Avatar image={{ src: `/api/plugins/${plugin.id}/resources/icon` }} name={plugin.name} size={40} />
                        <div>
                            <Text weight="semibold">{plugin.name}</Text>
                            <div className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">{plugin.description}</div>
                        </div>
                    </Link>
                    <div className="flex items-center gap-2">
                        <Button appearance="primary" as={Link as any} href={`/plugins/${plugin.id}`}>查看</Button>
                        <Button appearance="secondary" as={Link as any} href={`/api/plugins/${plugin.id}/resources/release`}>安装</Button>
                    </div>
                </div>
            ))}
        </div>
    );
}
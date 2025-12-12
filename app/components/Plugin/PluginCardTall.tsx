"use client";
import Link from "next/link";
import { Card, Text, Button } from "@fluentui/react-components";

export default function PluginCardTall({ plugin }: { plugin: any }) {
  const iconSrc = `/api/plugins/${plugin.id}/resources/icon`;
  return (
    <Link href={`/plugins/${plugin.id}`} className="block">
      <Card className="h-full cursor-pointer hover:shadow-md transition-all border border-gray-200 dark:border-gray-800 p-0 overflow-hidden">
        <div className="p-4 flex gap-4">
          <div className="w-24 h-24 rounded-xl overflow-hidden bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
            <img src={iconSrc} alt={plugin.name} className="w-16 h-16 object-contain" />
          </div>
          <div className="flex-1 min-w-0">
            <Text weight="semibold">{plugin.name}</Text>
            <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">{plugin.description}</div>
            <div className="mt-3">
              <Button appearance="primary" size="small">免费下载</Button>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
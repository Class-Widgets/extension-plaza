"use client";
import Link from "next/link";
import { Card, Text } from "@fluentui/react-components";

export default function PluginCardRounded({ plugin }: { plugin: any }) {
  const iconSrc = `/api/plugins/${plugin.id}/resources/icon`;
  return (
    <Link href={`/plugins/${plugin.id}`} className="block">
      <Card className="h-full cursor-pointer hover:shadow-md transition-all border border-gray-200 dark:border-gray-800 p-2">
        <div className="rounded-2xl overflow-hidden mb-3 bg-white dark:bg-gray-900 shadow-sm">
          <div className="p-2">
            <img src={iconSrc} alt={plugin.name} className="w-full h-36 object-cover rounded-xl" />
          </div>
        </div>
        <div className="space-y-1">
          <Text weight="semibold">{plugin.name}</Text>
          <div className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">{plugin.description}</div>
        </div>
      </Card>
    </Link>
  );
}
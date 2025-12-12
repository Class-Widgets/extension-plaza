"use client";
import * as React from "react";
import Link from "next/link";
import { Button, Text, Card, Avatar } from "@fluentui/react-components";

export interface PluginItem {
  id: string;
  name: string;
  description?: string;
}

export default function PluginList({ plugins, onSelect }: { plugins: PluginItem[]; onSelect?: (id: string) => void }) {
  return (
    <section aria-label="插件列表">
      <div role="list" className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {plugins.map((p) => (
          <article key={p.id} role="listitem" className="group border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden bg-white dark:bg-gray-900 hover:shadow-md focus-within:shadow-md transition-shadow">
            <Link href={`/plugins/${p.id}`} className="block p-4 focus-ring">
              <div className="flex items-center gap-3">
                <Avatar image={{ src: `/api/plugins/${p.id}/resources/icon` }} name={p.name} size={40} />
                <div className="min-w-0">
                  <Text weight="semibold" size={300} className="truncate">{p.name}</Text>
                  {p.description && (
                    <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">{p.description}</p>
                  )}
                </div>
              </div>
            </Link>
            <div className="px-4 pb-4 flex items-center gap-2">
              <Link href={`/plugins/${p.id}`} className="inline-block"><Button appearance="primary">详情</Button></Link>
              <Link href={`/api/plugins/${p.id}/resources/release`} className="inline-block"><Button appearance="secondary">安装</Button></Link>
              <Button appearance="subtle" onClick={() => onSelect?.(p.id)} aria-label={`选择 ${p.name}`}>加入对比</Button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
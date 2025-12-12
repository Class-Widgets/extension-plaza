"use client";
import * as React from "react";
import { Text } from "@fluentui/react-components";
import PluginCard from "../Plugin/PluginCard";

export default function SectionRow({ title, plugins }: { title: string; plugins: any[] }) {
  return (
    <section aria-label={title} className="space-y-3">
      <div className="flex items-center justify-between">
        <Text weight="semibold" size={400}>{title}</Text>
      </div>
      {/* 图2主页布局：改为标准栅格列表，使用重构后的 PluginCard */}
      <div role="list" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plugins.map((p) => (
          <div role="listitem" key={p.id}>
            <PluginCard plugin={p} />
          </div>
        ))}
      </div>
    </section>
  );
}
import * as React from "react";
import { Card, Text } from "@fluentui/react-components";
import PluginCard from "../Plugin/PluginCard";

export default function SectionRow({ title, plugins }: { title: string; plugins: any[] }) {
  return (
    <Card appearance="filled" className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <Text weight="semibold" size={400}>{title}</Text>
      </div>
      <div role="list" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plugins.map((p) => (
          <div role="listitem" key={p.id}>
            <PluginCard plugin={p} />
          </div>
        ))}
      </div>
    </Card>
  );
}

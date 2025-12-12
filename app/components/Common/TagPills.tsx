"use client";
import { Button } from "@fluentui/react-components";

export default function TagPills({ tags, selected, onSelect }: { tags: string[]; selected?: string; onSelect?: (t: string) => void }) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
      {tags.map((t) => (
        <Button
          key={t}
          size="small"
          appearance={selected === t ? "primary" : "subtle"}
          className="rounded-full"
          onClick={() => onSelect?.(t)}
        >
          {t}
        </Button>
      ))}
    </div>
  );
}
"use client";
import * as React from "react";
import { Button } from "@fluentui/react-components";

export default function CategoryBar({ categories, selected, onSelect }: { categories: string[]; selected?: string; onSelect?: (c: string) => void }) {
  return (
    <nav aria-label="分类导航" className="flex items-center gap-2 overflow-x-auto no-scrollbar">
      {categories.map((c) => (
        <Button key={c} size="small" appearance={selected === c ? "primary" : "subtle"} className="rounded-full" onClick={() => onSelect?.(c)}>
          {c}
        </Button>
      ))}
    </nav>
  );
}
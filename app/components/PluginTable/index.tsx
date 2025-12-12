"use client";
import * as React from "react";
import { Table, TableHeader, TableRow, TableCell, TableBody, Text } from "@fluentui/react-components";

export interface Column {
  key: string;
  title: string;
  width?: string | number;
}

export default function PluginTable({ columns, data, ariaLabel }: { columns: Column[]; data: any[]; ariaLabel?: string }) {
  const tableRef = React.useRef<HTMLDivElement | null>(null);

  const onKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    const focusable = tableRef.current?.querySelectorAll<HTMLElement>("[data-cell]") ?? [] as any;
    const arr = Array.prototype.slice.call(focusable) as HTMLElement[];
    const idx = arr.indexOf(document.activeElement as HTMLElement);
    if (e.key === "ArrowRight") arr[idx + 1]?.focus();
    if (e.key === "ArrowLeft") arr[idx - 1]?.focus();
    if (e.key === "ArrowDown") arr[idx + columns.length]?.focus();
    if (e.key === "ArrowUp") arr[idx - columns.length]?.focus();
  };

  return (
    <section aria-label={ariaLabel ?? "插件表格"}>
      <div ref={tableRef} role="grid" aria-readonly className="overflow-x-auto" onKeyDown={onKeyDown}>
        <table className="w-full text-sm">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key} scope="col" style={{ width: c.width }} className="text-left py-2 px-3 text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-800">{c.title}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} className="border-b border-gray-200 dark:border-gray-800">
                {columns.map((c) => (
                  <td key={c.key} className="py-2 px-3" tabIndex={0} data-cell>
                    <span className="text-gray-900 dark:text-gray-100">{String(row[c.key] ?? "-")}</span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
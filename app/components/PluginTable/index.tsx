"use client";
import * as React from "react";
import { Text, Spinner } from "@fluentui/react-components";
import ErrorState from "@/app/components/Common/ErrorState";

export interface Column {
  key: string;
  title: string;
  width?: string | number;
}

export interface PluginTableProps {
  columns: Column[];
  data: any[];
  ariaLabel?: string;
  loading?: boolean;
  error?: { status?: number; message?: string } | null;
  onRetry?: () => void;
}

export default function PluginTable({ columns, data, ariaLabel, loading, error, onRetry }: PluginTableProps) {
  if (loading) {
    return (
      <section aria-label={ariaLabel ?? "插件表格"}>
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Spinner size="large" />
          <Text size={300} className="text-gray-500">加载中...</Text>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section aria-label={ariaLabel ?? "插件表格"}>
        <ErrorState
          status={error.status}
          message={error.message}
          onRetry={onRetry}
        />
      </section>
    );
  }

  if (!data || data.length === 0) {
    return (
      <section aria-label={ariaLabel ?? "插件表格"}>
        <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
          <Text size={400}>暂无插件</Text>
          <Text size={200} className="mt-2">当前没有可用的插件</Text>
        </div>
      </section>
    );
  }

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

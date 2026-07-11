"use client";
import * as React from "react";
import { Card, Toolbar, Divider, Text, Button, Spinner } from "@fluentui/react-components";
import { CaretLeftFilled, CaretRightFilled } from "@fluentui/react-icons";
import PluginGrid from "@/app/components/Plugin/PluginGrid";
import ErrorState from "@/app/components/Common/ErrorState";
import EmptyState from "@/app/components/Common/EmptyState";

export interface PluginSectionTableProps {
  title: string;
  dataSource: (() => Promise<any[]>) | any[];
  options?: {
    columns?: number;
    pageSize?: number;
    showControls?: boolean;
  };
  loading?: boolean;
  error?: { status?: number; message?: string } | null;
  onRetry?: () => void;
}

export default function PluginSectionTable({ title, dataSource, options, loading, error, onRetry }: PluginSectionTableProps) {
  const [plugins, setPlugins] = React.useState<any[]>([]);
  const [page, setPage] = React.useState(0);
  const pageSize = options?.pageSize ?? 6;

  React.useEffect(() => {
    const load = async () => {
      const data = typeof dataSource === 'function' ? await dataSource() : dataSource;
      setPlugins(Array.isArray(data) ? data : []);
      setPage(0);
    };
    load();
  }, [dataSource]);

  if (loading) {
    return (
      <Card appearance="filled" className="rounded-2xl p-4 !gap-0">
        <Toolbar aria-label={title} className="mb-2 gap-3" style={{ flexWrap: "wrap" }}>
          <Text weight="semibold" size={400} style={{ marginRight: "auto" }}>{title}</Text>
        </Toolbar>
        <Divider className="mb-3" />
          <div className="flex items-center justify-center py-16 gap-3">
            <Spinner size="large" />
          </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card appearance="filled" className="rounded-2xl p-4 !gap-0">
        <Toolbar aria-label={title} className="mb-2 gap-3" style={{ flexWrap: "wrap" }}>
          <Text weight="semibold" size={400} style={{ marginRight: "auto" }}>{title}</Text>
        </Toolbar>
        <Divider className="mb-3" />
        <ErrorState
          status={error.status}
          message={error.message}
          onRetry={onRetry}
        />
      </Card>
    );
  }

  const start = page * pageSize;
  const canPrev = page > 0;
  const canNext = start + pageSize < plugins.length;
  const visible = plugins.slice(start, start + pageSize);

  if (plugins.length === 0) {
    return (
      <Card appearance="filled" className="rounded-2xl p-4 !gap-0">
        <Toolbar aria-label={title} className="mb-2 gap-3" style={{ flexWrap: "wrap" }}>
          <Text weight="semibold" size={400} style={{ marginRight: "auto" }}>{title}</Text>
        </Toolbar>
        <Divider className="mb-3" />
        <EmptyState message="当前没有可用的插件" />
      </Card>
    );
  }

  return (
    <Card appearance="filled" className="rounded-2xl p-4 !gap-0">
      <Toolbar aria-label={title} className="mb-2 gap-3" style={{ flexWrap: "wrap" }}>
        <Text weight="semibold" size={400} style={{ marginRight: "auto" }}>{title}</Text>
        {(options?.showControls ?? true) && (
          <>
            <button disabled={!canPrev} onClick={() => setPage(p => Math.max(0, p - 1))} aria-label="上一页" style={{ width: 32, height: 26, borderRadius: 13, padding: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--colorNeutralBackground1)", color: "var(--colorNeutralForeground1)", border: `1px solid var(--colorNeutralStroke2)` }}>
              <CaretLeftFilled style={{ width: 14, height: 14 }} />
            </button>
            <button disabled={!canNext} onClick={() => setPage(p => (canNext ? p + 1 : p))} aria-label="下一页" style={{ width: 32, height: 26, borderRadius: 13, padding: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--colorNeutralBackground1)", color: "var(--colorNeutralForeground1)", border: `1px solid var(--colorNeutralStroke2)` }}>
              <CaretRightFilled style={{ width: 14, height: 14 }} />
            </button>
          </>
        )}
      </Toolbar>
      <Divider className="mb-3" />
      <PluginGrid plugins={visible} />
    </Card>
  );
}

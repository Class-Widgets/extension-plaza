"use client";

import * as React from "react";
import { Badge, Button, Card, Divider, Dropdown, MessageBar, MessageBarBody, Option, Spinner, Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow, Text, Toolbar, ToolbarButton } from "@fluentui/react-components";
import { ArrowSyncRegular, AddRegular } from "@fluentui/react-icons";
import type { PluginRow, PublishToken } from "../types";
import { formatTime } from "../utils";
import EmptyState from "@/app/components/Common/EmptyState";
import Pagination from "./Pagination";
import CreateTokenDialog from "./dialogs/CreateTokenDialog";

const PAGE_SIZE = 10;

type TokensPanelProps = {
    tokens: PublishToken[];
    plugins: PluginRow[];
    loading: boolean;
    newToken: string | null;
    onCreateToken: (name: string, expiresAt: string | null, scopePluginId: string | null) => void;
    onRevokeToken: (token: PublishToken) => void;
    onReload: () => void;
};

export default function TokensPanel({ tokens, plugins, loading, newToken, onCreateToken, onRevokeToken, onReload }: TokensPanelProps) {
    const [page, setPage] = React.useState(1);
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [statusFilter, setStatusFilter] = React.useState<"active" | "revoked" | "all">("active");
    const filteredTokens = React.useMemo(() => {
        if (statusFilter === "all") return tokens;
        if (statusFilter === "revoked") return tokens.filter((token) => token.revoked);
        return tokens.filter((token) => !token.revoked);
    }, [statusFilter, tokens]);
    const pageData = React.useMemo(() => filteredTokens.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filteredTokens, page]);
    const pluginNameMap = React.useMemo(() => {
        const map = new Map<string, string>();
        plugins.forEach((plugin) => map.set(plugin.id, plugin.name));
        return map;
    }, [plugins]);
    React.useEffect(() => { setPage(1); }, [filteredTokens.length]);
    return (
        <Card className="!p-5 min-w-0">
            <Toolbar className="px-0 gap-3" style={{ flexWrap: "wrap" }}>
                <Text weight="semibold" size={500} style={{ marginRight: "auto" }}>
                    发布 Token
                </Text>
                <Dropdown value={statusFilter === "active" ? "仅可用" : statusFilter === "revoked" ? "仅已撤销" : "全部状态"} selectedOptions={[statusFilter]} onOptionSelect={(_, data) => setStatusFilter((data.optionValue as "active" | "revoked" | "all") || "active")}>
                    <Option value="active">仅可用</Option>
                    <Option value="revoked">仅已撤销</Option>
                    <Option value="all">全部状态</Option>
                </Dropdown>
                <Button appearance="primary" icon={<AddRegular />} onClick={() => setDialogOpen(true)}>
                    创建 Token
                </Button>
                <ToolbarButton icon={<ArrowSyncRegular />} onClick={onReload} />
            </Toolbar>
            <Divider className="my-3" />
            {newToken && (
                <MessageBar intent="success" className="mb-3">
                    <MessageBarBody>
                        <Text weight="semibold">新 Token：</Text> <code className="break-all">{newToken}</code>
                    </MessageBarBody>
                </MessageBar>
            )}
            <div className="overflow-x-auto">
                {loading ? (
                    <div className="py-12 flex justify-center">
                        <Spinner label="正在加载 Token" />
                    </div>
                ) : filteredTokens.length === 0 ? (
                    <EmptyState message="当前没有发布 Token" />
                ) : (<><Table aria-label="发布 Token 表格" style={{ minWidth: 740 }}>
                        <TableHeader>
                            <TableRow>
                                <TableHeaderCell style={{ minWidth: 150 }}>名称</TableHeaderCell>
                                <TableHeaderCell style={{ minWidth: 140 }}>作用域</TableHeaderCell>
                                <TableHeaderCell style={{ minWidth: 100 }}>状态</TableHeaderCell>
                                <TableHeaderCell style={{ minWidth: 140 }}>创建时间</TableHeaderCell>
                                <TableHeaderCell style={{ minWidth: 140 }}>最后使用</TableHeaderCell>
                                <TableHeaderCell style={{ minWidth: 140 }}>过期日期</TableHeaderCell>
                                <TableHeaderCell style={{ minWidth: 100 }}>操作</TableHeaderCell>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pageData.map((token) => (
                                <TableRow key={token.id}>
                                    <TableCell>{token.name}</TableCell>
                                    <TableCell>
                                        {token.scope_plugin_id ? (
                                            <div className="flex flex-col">
                                                <Text weight="semibold">{pluginNameMap.get(token.scope_plugin_id) ?? token.scope_plugin_id}</Text>
                                                <Text size={200} className="text-gray-500 dark:text-gray-400">
                                                    {token.scope_plugin_id}
                                                </Text>
                                            </div>
                                        ) : (
                                            <Badge appearance="tint" color="brand">全部项目</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge appearance="filled" color={token.revoked ? "danger" : "success"}>
                                            {token.revoked ? "revoked" : "active"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{formatTime(token.created_at)}</TableCell>
                                    <TableCell>{formatTime(token.last_used_at)}</TableCell>
                                    <TableCell>{formatTime(token.expires_at)}</TableCell>
                                    <TableCell>
                                        <Button size="small" disabled={token.revoked} onClick={() => onRevokeToken(token)}>
                                            撤销
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <Pagination current={page} total={filteredTokens.length} pageSize={PAGE_SIZE} onChange={setPage} />
                    </>)}
            </div>
            <CreateTokenDialog
                open={dialogOpen}
                loading={loading}
                plugins={plugins}
                onOpenChange={setDialogOpen}
                onCreate={onCreateToken}
            />
        </Card>
    );
}

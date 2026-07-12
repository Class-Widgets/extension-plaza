"use client";

import * as React from "react";
import {
    Badge,
    Button,
    Dialog,
    DialogActions,
    DialogBody,
    DialogContent,
    DialogSurface,
    DialogTitle,
    Field,
    Input,
    MessageBar,
    MessageBarBody,
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableHeaderCell,
    TableRow,
    Tab,
    TabList,
    Text,
    Textarea,
} from "@fluentui/react-components";
import type { ModerationRequest, PluginForm, PluginRow, TagRow } from "../../types";
import { formatTime, statusAppearance } from "../../utils";
import EmptyState from "@/app/components/Common/EmptyState";
import Pagination from "../Pagination";
import TagPickerField from "../TagPickerField";

const HISTORY_PAGE_SIZE = 5;

type PluginDetailDialogProps = {
    open: boolean;
    plugin: PluginRow | null;
    editForm: PluginForm;
    tags: TagRow[];
    requests: ModerationRequest[];
    resubmitReason: string;
    loading: boolean;
    onOpenChange: (open: boolean) => void;
    onFormChange: (field: keyof PluginForm, value: string) => void;
    onTagChange: (tagIds: string[]) => void;
    onSave: () => void;
    onResubmitReasonChange: (value: string) => void;
    onResubmit: (pluginId: string) => void;
};

export default function PluginDetailDialog({
    open,
    plugin,
    editForm,
    tags,
    requests,
    resubmitReason,
    loading,
    onOpenChange,
    onFormChange,
    onTagChange,
    onSave,
    onResubmitReasonChange,
    onResubmit,
}: PluginDetailDialogProps) {
    const [tab, setTab] = React.useState<string>("audit");
    const [historyPage, setHistoryPage] = React.useState(1);

    React.useEffect(() => {
        if (open) setTab("audit");
    }, [open]);

    React.useEffect(() => { setHistoryPage(1); }, [requests.length]);

    const latestRejected = requests.find((r) => r.status === "REJECTED");
    const canResubmit = plugin?.status === "hidden";
    const pageData = React.useMemo(
        () => requests.slice((historyPage - 1) * HISTORY_PAGE_SIZE, historyPage * HISTORY_PAGE_SIZE),
        [requests, historyPage],
    );

    if (!plugin) return null;

    return (
        <Dialog open={open} onOpenChange={(_, data) => onOpenChange(data.open)}>
            <DialogSurface style={{ maxWidth: 680 }}>
                <DialogTitle>{plugin.name}</DialogTitle>
                <DialogBody>
                    <DialogContent>
                        <TabList selectedValue={tab} onTabSelect={(_, data) => setTab(data.value as string)} className="mb-4">
                            <Tab value="audit">审核记录</Tab>
                            <Tab value="edit">编辑</Tab>
                        </TabList>

                        {tab === "audit" && (
                            <>
                                <div className="mb-4">
                                    <div className="grid grid-cols-2 gap-2">
                                        <Text size={200}>ID: {plugin.id}</Text>
                                        <Text size={200}>版本: {plugin.version}</Text>
                                        <Text size={200}>
                                            状态: <Badge appearance="filled" color={statusAppearance(plugin.status)}>{plugin.status}</Badge>
                                        </Text>
                                        <Text size={200}>
                                            仓库: <a href={plugin.repo_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{plugin.repo_url}</a>
                                        </Text>
                                        <Text size={200} className="col-span-2">标签: {plugin.tags && plugin.tags.length > 0 ? plugin.tags.map((tag) => tag.name).join("、") : "-"}</Text>
                                    </div>
                                </div>

                                {latestRejected?.decided_reason && (
                                    <MessageBar intent="warning" className="mb-4">
                                        <MessageBarBody>
                                            <Text weight="semibold">拒绝原因：</Text>
                                            <Text>{latestRejected.decided_reason}</Text>
                                        </MessageBarBody>
                                    </MessageBar>
                                )}

                                <Text weight="semibold">审核历史</Text>
                                {requests.length === 0 ? (
                                    <EmptyState message="暂无审核记录" />
                                ) : (
                                    <div className="overflow-x-auto mt-2">
                                        <Table aria-label="审核历史表" style={{ minWidth: 500 }}>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHeaderCell style={{ minWidth: 80 }}>类型</TableHeaderCell>
                                                    <TableHeaderCell style={{ minWidth: 80 }}>状态</TableHeaderCell>
                                                    <TableHeaderCell style={{ minWidth: 140 }}>提交说明</TableHeaderCell>
                                                    <TableHeaderCell style={{ minWidth: 140 }}>处理说明</TableHeaderCell>
                                                    <TableHeaderCell style={{ minWidth: 140 }}>时间</TableHeaderCell>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {pageData.map((req) => (
                                                    <TableRow key={req.id}>
                                                        <TableCell>{req.request_type}</TableCell>
                                                        <TableCell>
                                                            <Badge appearance="filled" color={statusAppearance(req.status)}>{req.status}</Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Text size={200}>{req.reason || "-"}</Text>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Text size={200}>{req.decided_reason || "-"}</Text>
                                                        </TableCell>
                                                        <TableCell>{formatTime(req.created_at)}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                        <Pagination current={historyPage} total={requests.length} pageSize={HISTORY_PAGE_SIZE} onChange={setHistoryPage} />
                                    </div>
                                )}

                                {canResubmit && (
                                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                        <Text weight="semibold">重新提交审核</Text>
                                        <Field label="提交说明" className="mt-2">
                                            <Textarea
                                                value={resubmitReason}
                                                onChange={(_, data) => onResubmitReasonChange(data.value)}
                                                resize="vertical"
                                                placeholder="可选：说明本次修改内容"
                                            />
                                        </Field>
                                    </div>
                                )}
                            </>
                        )}

                        {tab === "edit" && (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Field label="插件 ID">
                                        <Input value={editForm.id} disabled />
                                    </Field>
                                    <Field label="名称" required>
                                        <Input value={editForm.name} onChange={(_, data) => onFormChange("name", data.value)} />
                                    </Field>
                                    <Field label="GitHub 仓库 URL" required>
                                        <Input value={editForm.repo_url} onChange={(_, data) => onFormChange("repo_url", data.value)} />
                                    </Field>
                                    <Field label="分支">
                                        <Input value={editForm.branch} onChange={(_, data) => onFormChange("branch", data.value)} />
                                    </Field>
                                    <Field label="版本">
                                        <Input value={editForm.version} onChange={(_, data) => onFormChange("version", data.value)} />
                                    </Field>
                                    <Field label="API 版本">
                                        <Input value={editForm.api_version} onChange={(_, data) => onFormChange("api_version", data.value)} />
                                    </Field>
                                    <Field label="README 路径">
                                        <Input value={editForm.readme} onChange={(_, data) => onFormChange("readme", data.value)} />
                                    </Field>
                                    <Field label="图标路径">
                                        <Input value={editForm.icon} onChange={(_, data) => onFormChange("icon", data.value)} />
                                    </Field>
                                </div>
                                <Field label="描述" className="mt-4">
                                    <Textarea value={editForm.description} onChange={(_, data) => onFormChange("description", data.value)} resize="vertical" />
                                </Field>
                                <Field label="标签" className="mt-4">
                                    <TagPickerField tags={tags} selectedTagIds={editForm.tag_ids} disabled={loading} onChange={onTagChange} />
                                </Field>
                            </>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button appearance="secondary" onClick={() => onOpenChange(false)}>
                            关闭
                        </Button>
                        {tab === "audit" && canResubmit && (
                            <Button appearance="primary" disabled={loading} onClick={() => plugin && onResubmit(plugin.id)}>
                                {loading ? "提交中..." : "重新提交"}
                            </Button>
                        )}
                        {tab === "edit" && (
                            <Button appearance="primary" disabled={loading || !editForm.name.trim() || !editForm.repo_url.trim()} onClick={onSave}>
                                {loading ? "保存中..." : "保存"}
                            </Button>
                        )}
                    </DialogActions>
                </DialogBody>
            </DialogSurface>
        </Dialog>
    );
}

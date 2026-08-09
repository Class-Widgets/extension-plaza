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
    Spinner,
    Text,
    Textarea,
} from "@fluentui/react-components";
import {
    ArrowSyncRegular,
    CheckmarkCircleRegular,
    DismissCircleRegular,
    WarningRegular,
} from "@fluentui/react-icons";
import { supabase } from "@/lib/supabase";
import { verifyPlugin, allChecksPassed } from "@/lib/githubCheck";
import type { CheckResult, VerificationResults } from "@/lib/githubCheck";
import type { ModerationRequest } from "../../types";
import { formatTime, getPluginFromRequest, statusAppearance } from "../../utils";
import CellWithDialog from "../CellWithDialog";

type ModerationActionDialogProps = {
    open: boolean;
    item: ModerationRequest | null;
    decisionReason: string;
    loading: boolean;
    onOpenChange: (open: boolean) => void;
    onDecisionReasonChange: (value: string) => void;
    onApprove: () => void;
    onReject: () => void;
    onOpenTextDialog: (title: string, content: string) => void;
};

const initialChecks: VerificationResults = {
    repoExists: { label: "仓库存在", status: "idle", message: "" },
    branchExists: { label: "分支存在", status: "idle", message: "" },
    iconExists: { label: "图标", status: "idle", message: "" },
    readmeExists: { label: "README", status: "idle", message: "" },
    versionMatch: { label: "版本匹配", status: "idle", message: "" },
};

// 缓存配置：15 分钟有效
const CACHE_TTL = 15 * 60 * 1000;
type CheckCacheEntry = { results: VerificationResults; timestamp: number };
const checkCache = new Map<string, CheckCacheEntry>();

function CheckRow({ result }: { result: CheckResult }) {
    return (
        <div className="flex items-center gap-2 py-0.5">
            {result.status === "checking" && <Spinner size="tiny" />}
            {result.status === "pass" && (
                <CheckmarkCircleRegular className="text-green-500" style={{ fontSize: 16 }} />
            )}
            {result.status === "fail" && result.message.includes("网络错误") && (
                <WarningRegular className="text-yellow-500" style={{ fontSize: 16 }} />
            )}
            {result.status === "fail" && !result.message.includes("网络错误") && (
                <DismissCircleRegular className="text-red-500" style={{ fontSize: 16 }} />
            )}
            {result.status === "idle" && (
                <span style={{ width: 16, height: 16, display: "inline-block" }} />
            )}
            <Text size={200}>{result.label}</Text>
            {result.message && (
                <Text size={200} className="text-gray-500 dark:text-gray-400">
                    — {result.message}
                </Text>
            )}
        </div>
    );
}

export default function ModerationActionDialog({ open, item, decisionReason, loading, onOpenChange, onDecisionReasonChange, onApprove, onReject, onOpenTextDialog }: ModerationActionDialogProps) {
    const [submitterName, setSubmitterName] = React.useState<string | null>(null);
    const [checks, setChecks] = React.useState<VerificationResults>(initialChecks);
    const [refreshKey, setRefreshKey] = React.useState(0);
    const [cacheAge, setCacheAge] = React.useState<string | null>(null);
    const [checking, setChecking] = React.useState(false);

    React.useEffect(() => {
        if (!item?.user_id) {
            setSubmitterName(null);
            return;
        }
        supabase
            .from("profiles")
            .select("display_name")
            .eq("id", item.user_id)
            .single()
            .then(({ data }) => {
                setSubmitterName(data?.display_name ?? null);
            });
    }, [item?.user_id]);

    const runVerification = React.useCallback(async (pluginId: string, plugin: NonNullable<ReturnType<typeof getPluginFromRequest>>, force: boolean) => {
        // 检查缓存
        if (!force) {
            const cached = checkCache.get(pluginId);
            if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
                setChecks(cached.results);
                const age = Math.round((Date.now() - cached.timestamp) / 1000);
                setCacheAge(age < 60 ? `${age} 秒前` : `${Math.round(age / 60)} 分钟前`);
                return;
            }
        }

        setChecking(true);
        setCacheAge(null);
        setChecks((prev) => {
            const updated = { ...prev };
            for (const key of Object.keys(updated) as (keyof VerificationResults)[]) {
                updated[key] = { ...updated[key], status: "checking", message: "" };
            }
            return updated;
        });

        try {
            const results = await verifyPlugin(plugin.repo_url, plugin.branch, plugin.version, plugin.icon, plugin.readme);
            checkCache.set(pluginId, { results, timestamp: Date.now() });
            setChecks(results);
            setCacheAge("刚刚");
        } catch {
            setChecks((prev) => {
                const updated = { ...prev };
                for (const key of Object.keys(updated) as (keyof VerificationResults)[]) {
                    updated[key] = { ...updated[key], status: "fail", message: "校验异常" };
                }
                return updated;
            });
        } finally {
            setChecking(false);
        }
    }, []);

    // 当对话框打开时，自动触发联网校验（利用缓存）
    React.useEffect(() => {
        const plugin = item ? getPluginFromRequest(item) : null;
        if (!open || !plugin || !item) {
            setChecks(initialChecks);
            setCacheAge(null);
            return;
        }
        runVerification(item.plugin_id, plugin, false);
    }, [open, item, refreshKey, runVerification]);

    if (!item) return null;
    const plugin = getPluginFromRequest(item);
    const isPending = item.status === "PENDING";
    const checksAllPassed = allChecksPassed(checks);

    return (
        <Dialog open={open} onOpenChange={(_, data) => onOpenChange(data.open)}>
            <DialogSurface style={{ maxWidth: 720 }}>
                <DialogTitle>审核详情</DialogTitle>
                <DialogBody>
                    <DialogContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-0">
                            {/* 左栏：插件完整信息 */}
                            <div>
                                {plugin && (
                                    <div className="mb-5">
                                        <Text weight="semibold" size={400}>插件信息</Text>
                                        <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-2">
                                            <Text size={200}>插件 ID：{plugin.id}</Text>
                                            <Text size={200}>名称：{plugin.name}</Text>
                                            <div className="col-span-2">
                                                <Text size={200}>描述：{plugin.description || "-"}</Text>
                                            </div>
                                            <div className="col-span-2">
                                                <Text size={200}>
                                                    仓库 URL：
                                                    <a
                                                        href={plugin.repo_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="underline hover:text-blue-800"
                                                    >
                                                        {plugin.repo_url}
                                                    </a>
                                                </Text>
                                            </div>
                                            <Text size={200}>分支：{plugin.branch}</Text>
                                            <Text size={200}>版本：{plugin.version}</Text>
                                            <Text size={200}>API 版本：{plugin.api_version || "-"}</Text>
                                            <Text size={200}>README：{plugin.readme}</Text>
                                            <Text size={200}>图标：{plugin.icon}</Text>
                                            <Text size={200}>
                                                状态：<Badge appearance="filled" color={statusAppearance(plugin.status)}>{plugin.status}</Badge>
                                            </Text>
                                            <Text size={200}>创建时间：{formatTime(plugin.created_at)}</Text>
                                            <Text size={200}>更新时间：{formatTime(plugin.updated_at)}</Text>
                                            {plugin.tags && plugin.tags.length > 0 && (
                                                <div className="col-span-2 flex gap-1 flex-wrap">
                                                    <Text size={200}>标签：</Text>
                                                    {plugin.tags.map((tag) => (
                                                        <Badge key={tag.id} appearance="outline" size="small">{tag.name}</Badge>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* 右栏：审核请求 + GitHub 校验 */}
                            <div>
                                <div className="mb-5">
                                    <Text weight="semibold" size={400}>审核请求</Text>
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-2">
                                        <Text size={200}>
                                            请求类型：{item.request_type}
                                        </Text>
                                        <Text size={200}>
                                            状态：<Badge appearance="filled" color={statusAppearance(item.status)}>{item.status}</Badge>
                                        </Text>
                                        <Text size={200}>提交时间：{formatTime(item.created_at)}</Text>
                                        {item.decided_at && <Text size={200}>处理时间：{formatTime(item.decided_at)}</Text>}
                                    </div>
                                </div>

                                {/* 右栏：投稿人信息 */}
                                <div className="mb-5">
                                    <Text weight="semibold" size={400}>投稿人</Text>
                                    <div className="mt-2">
                                        <Text size={200}>
                                            {submitterName
                                                ? `${submitterName}（${item.user_id}）`
                                                : item.user_id}
                                        </Text>
                                    </div>
                                </div>

                                {/* 右栏：提交说明 */}
                                <div className="mb-5">
                                    <Text weight="semibold" size={400}>提交说明</Text>
                                    <div className="mt-1">
                                        <CellWithDialog text={item.reason} label="提交说明" onOpen={onOpenTextDialog} />
                                    </div>
                                </div>

                                {/* 右栏：处理说明 */}
                                {item.decided_reason && (
                                    <div className="mb-5">
                                        <Text weight="semibold" size={400}>处理说明</Text>
                                        <div className="mt-1">
                                            <CellWithDialog text={item.decided_reason} label="处理说明" onOpen={onOpenTextDialog} />
                                        </div>
                                    </div>
                                )}

                                {/* 右栏：联网校验结果 */}
                                {isPending && plugin && (
                                    <div className="mb-5">
                                        <div className="flex items-center gap-2">
                                            <Text weight="semibold" size={400}>GitHub 校验</Text>
                                            <Button
                                                size="small"
                                                appearance="transparent"
                                                icon={<ArrowSyncRegular />}
                                                disabled={checking}
                                                onClick={() => {
                                                    setRefreshKey((k) => k + 1);
                                                }}
                                                title="手动刷新校验结果"
                                            />
                                            {cacheAge && (
                                                <Text size={100} className="text-gray-400">
                                                    {cacheAge}
                                                </Text>
                                            )}
                                        </div>
                                        <div className="mt-2">
                                            <CheckRow result={checks.repoExists} />
                                            <CheckRow result={checks.branchExists} />
                                            <CheckRow result={checks.iconExists} />
                                            <CheckRow result={checks.readmeExists} />
                                            <CheckRow result={checks.versionMatch} />
                                        </div>
                                        {checksAllPassed && (
                                            <div className="mt-2">
                                                <Badge appearance="filled" color="success">所有校验通过</Badge>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {isPending && (
                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <Field label="处理说明">
                                    <Textarea
                                        value={decisionReason}
                                        onChange={(_, data) => onDecisionReasonChange(data.value)}
                                        resize="vertical"
                                        placeholder="可选：填写审核原因"
                                    />
                                </Field>
                            </div>
                        )}
                    </DialogContent>
                    <DialogActions>
                        {isPending && (
                            <>
                                <Button appearance="primary" icon={<CheckmarkCircleRegular />} disabled={loading} onClick={onApprove}>
                                    通过
                                </Button>
                                <Button appearance="secondary" icon={<DismissCircleRegular />} disabled={loading} onClick={onReject}>
                                    拒绝
                                </Button>
                            </>
                        )}
                    </DialogActions>
                </DialogBody>
            </DialogSurface>
        </Dialog>
    );
}

"use client";

import * as React from "react";
import { Button, Card, Divider, Field, Input, Text, Textarea } from "@fluentui/react-components";
import { AddRegular } from "@fluentui/react-icons";
import type { PluginForm, TagRow } from "../types";
import TagPickerField from "./TagPickerField";

const PLUGIN_ID_PATTERN = /^[a-z0-9]+(\.[a-z0-9_-]+)+$/;

type SubmitPanelProps = {
    form: PluginForm;
    tags: TagRow[];
    loading: boolean;
    onChange: (field: keyof PluginForm, value: string) => void;
    onTagChange: (tagIds: string[]) => void;
    onSubmit: () => void;
};

export default function SubmitPanel({ form, tags, loading, onChange, onTagChange, onSubmit }: SubmitPanelProps) {
    const [touched, setTouched] = React.useState<Record<string, boolean>>({});

    React.useEffect(() => {
        let cancelled = false;
        fetch("https://api.github.com/repos/class-widgets/class-widgets-sdk/releases?per_page=1")
            .then((res) => {
                if (!res.ok) throw new Error("fetch failed");
                return res.json();
            })
            .then((data) => {
                if (!cancelled && Array.isArray(data) && data.length > 0 && data[0]?.tag_name) {
                    const version = data[0].tag_name.replace(/^v/, "");
                    onChange("api_version", `~=${version}`);
                }
            })
            .catch(() => {
                // 静默失败，保留默认值 ~=*.*.*
            });
        return () => {
            cancelled = true;
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const markTouched = (field: string) => setTouched((prev) => ({ ...prev, [field]: true }));

    const idError = touched.id && form.id.trim() && !PLUGIN_ID_PATTERN.test(form.id.trim())
        ? "格式需为小写字母、数字、点号组合，例如 cn.example.plugin" : undefined;

    const nameError = touched.name && !form.name.trim() ? "名称不能为空" : undefined;

    const urlError = touched.repoUrl && form.repo_url.trim() && !/^https?:\/\/.+\/.+/.test(form.repo_url.trim())
        ? "请输入有效的 GitHub 仓库 URL" : undefined;
    const urlRequiredError = touched.repoUrl && !form.repo_url.trim() ? "仓库 URL 不能为空" : undefined;

    const apiVersionError = touched.apiVersion && !form.api_version.trim() ? "API 版本不能为空" : undefined;

    const disabled = loading || !form.id.trim() || !form.name.trim() || !form.repo_url.trim();

    return (
        <Card className="!p-5">
            <Text weight="semibold" size={500}>
                提交插件
            </Text>
            <Divider className="my-3" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field
                    label="插件 ID"
                    required
                    validationState={idError ? "error" : undefined}
                    validationMessage={idError}
                >
                    <Input
                        value={form.id}
                        onChange={(_, data) => onChange("id", data.value)}
                        onBlur={() => markTouched("id")}
                        placeholder="cn.example.plugin"
                    />
                </Field>
                <Field label="名称" required validationState={nameError ? "error" : undefined} validationMessage={nameError}>
                    <Input value={form.name} onChange={(_, data) => onChange("name", data.value)} onBlur={() => markTouched("name")} placeholder="插件显示名称" />
                </Field>
                <Field label="GitHub 仓库 URL" required validationState={urlError || urlRequiredError ? "error" : undefined} validationMessage={urlError || urlRequiredError}>
                    <Input value={form.repo_url} onChange={(_, data) => onChange("repo_url", data.value)} onBlur={() => markTouched("repoUrl")} placeholder="https://github.com/user/repo" />
                </Field>
                <Field label="分支" required>
                    <Input value={form.branch} onChange={(_, data) => onChange("branch", data.value)} placeholder="main" />
                </Field>
                <Field label="版本" required>
                    <Input value={form.version} onChange={(_, data) => onChange("version", data.value)} placeholder="1.0.0" />
                </Field>
                <Field label="API 版本" required validationState={apiVersionError ? "error" : undefined} validationMessage={apiVersionError}>
                    <Input value={form.api_version} onChange={(_, data) => onChange("api_version", data.value)} onBlur={() => markTouched("apiVersion")} placeholder="~=*.*.*" />
                </Field>
                <Field label="README 路径" required>
                    <Input value={form.readme} onChange={(_, data) => onChange("readme", data.value)} placeholder="README.md" />
                </Field>
                <Field label="图标路径" required>
                    <Input value={form.icon} onChange={(_, data) => onChange("icon", data.value)} placeholder="icon.png" />
                </Field>
            </div>
            <Field label="描述" className="mt-4">
                <Textarea value={form.description} onChange={(_, data) => onChange("description", data.value)} resize="vertical" placeholder="简要描述插件功能" />
            </Field>
            <Field label="标签" className="mt-4">
                <TagPickerField tags={tags} selectedTagIds={form.tag_ids} disabled={loading} onChange={onTagChange} />
            </Field>
            <Field label="提交说明" className="mt-4">
                <Textarea value={form.reason} onChange={(_, data) => onChange("reason", data.value)} resize="vertical" placeholder="可选：说明本次提交的内容或变更" />
            </Field>
            <div className="mt-4">
                <Button appearance="primary" icon={<AddRegular />} disabled={disabled} onClick={onSubmit}>
                    {loading ? "提交中" : "提交审核"}
                </Button>
            </div>
        </Card>
    );
}

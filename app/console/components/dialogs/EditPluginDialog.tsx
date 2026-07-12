"use client";

import { Button, Dialog, DialogActions, DialogBody, DialogContent, DialogSurface, DialogTitle, Field, Input, Text, Textarea } from "@fluentui/react-components";
import type { PluginForm, PluginRow } from "../../types";

type EditPluginDialogProps = {
    open: boolean;
    plugin: PluginRow | null;
    form: PluginForm;
    loading: boolean;
    onOpenChange: (open: boolean) => void;
    onFormChange: (field: keyof PluginForm, value: string) => void;
    onSave: () => void;
};

export default function EditPluginDialog({ open, plugin, form, loading, onOpenChange, onFormChange, onSave }: EditPluginDialogProps) {
    if (!plugin) return null;

    return (
        <Dialog open={open} onOpenChange={(_, data) => onOpenChange(data.open)}>
            <DialogSurface style={{ maxWidth: 640 }}>
                <DialogTitle>编辑插件 - {plugin.name}</DialogTitle>
                <DialogBody>
                    <DialogContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Field label="插件 ID">
                                <Input value={form.id} disabled />
                            </Field>
                            <Field label="名称" required>
                                <Input value={form.name} onChange={(_, data) => onFormChange("name", data.value)} />
                            </Field>
                            <Field label="GitHub 仓库 URL" required>
                                <Input value={form.repo_url} onChange={(_, data) => onFormChange("repo_url", data.value)} />
                            </Field>
                            <Field label="分支">
                                <Input value={form.branch} onChange={(_, data) => onFormChange("branch", data.value)} />
                            </Field>
                            <Field label="版本">
                                <Input value={form.version} onChange={(_, data) => onFormChange("version", data.value)} />
                            </Field>
                            <Field label="API 版本">
                                <Input value={form.api_version} onChange={(_, data) => onFormChange("api_version", data.value)} />
                            </Field>
                            <Field label="README 路径">
                                <Input value={form.readme} onChange={(_, data) => onFormChange("readme", data.value)} />
                            </Field>
                            <Field label="图标路径">
                                <Input value={form.icon} onChange={(_, data) => onFormChange("icon", data.value)} />
                            </Field>
                        </div>
                        <Field label="描述" className="mt-4">
                            <Textarea value={form.description} onChange={(_, data) => onFormChange("description", data.value)} resize="vertical" />
                        </Field>
                    </DialogContent>
                    <DialogActions>
                        <Button appearance="secondary" onClick={() => onOpenChange(false)}>
                            取消
                        </Button>
                        <Button appearance="primary" disabled={loading || !form.name.trim() || !form.repo_url.trim()} onClick={onSave}>
                            {loading ? "保存中..." : "保存"}
                        </Button>
                    </DialogActions>
                </DialogBody>
            </DialogSurface>
        </Dialog>
    );
}

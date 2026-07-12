"use client";

import * as React from "react";
import { Button, Dialog, DialogActions, DialogBody, DialogContent, DialogSurface, DialogTitle, Field, Input, Select, Switch } from "@fluentui/react-components";
import type { PluginRow } from "../../types";

type CreateTokenDialogProps = {
    open: boolean;
    loading: boolean;
    plugins: PluginRow[];
    onOpenChange: (open: boolean) => void;
    onCreate: (name: string, expiresAt: string | null, scopePluginId: string | null) => void;
};

export default function CreateTokenDialog({ open, loading, plugins, onOpenChange, onCreate }: CreateTokenDialogProps) {
    const [name, setName] = React.useState("");
    const [scopePluginId, setScopePluginId] = React.useState("");
    const [hasExpiration, setHasExpiration] = React.useState(false);
    const [expiresAt, setExpiresAt] = React.useState("");

    React.useEffect(() => {
        if (open) {
            setName("");
            setScopePluginId("");
            setHasExpiration(false);
            setExpiresAt("");
        }
    }, [open]);

    const handleCreate = () => {
        if (!name.trim()) return;
        onCreate(name.trim(), hasExpiration && expiresAt ? expiresAt : null, scopePluginId || null);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={(_, data) => onOpenChange(data.open)}>
            <DialogSurface>
                <DialogTitle>创建发布 Token</DialogTitle>
                <DialogBody>
                    <DialogContent className="flex flex-col gap-4">
                        <Field label="Token 名称" required>
                            <Input
                                value={name}
                                placeholder="请输入 Token 名称"
                                onChange={(_, data) => setName(data.value)}
                            />
                        </Field>
                        <Field label="作用域" hint="限制 Token 仅可用于指定插件">
                            <Select value={scopePluginId} onChange={(_, data) => setScopePluginId(data.value)}>
                                <option value="">全部插件</option>
                                {plugins.map((plugin) => (
                                    <option key={plugin.id} value={plugin.id}>
                                        插件：{plugin.name}
                                    </option>
                                ))}
                            </Select>
                        </Field>
                        <Switch
                            checked={hasExpiration}
                            label="设置过期时间"
                            onChange={(_, data) => setHasExpiration(data.checked)}
                        />
                        {hasExpiration && (
                            <Field label="过期日期">
                                <Input
                                    type="date"
                                    value={expiresAt}
                                    onChange={(_, data) => setExpiresAt(data.value)}
                                />
                            </Field>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button appearance="secondary" onClick={() => onOpenChange(false)}>
                            取消
                        </Button>
                        <Button appearance="primary" disabled={!name.trim() || loading} onClick={handleCreate}>
                            创建
                        </Button>
                    </DialogActions>
                </DialogBody>
            </DialogSurface>
        </Dialog>
    );
}

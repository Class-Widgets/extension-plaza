"use client";

import * as React from "react";
import {
    Toast,
    ToastTitle,
    ToastBody,
    ToastFooter,
    useToastController,
    Button,
    Dialog,
    DialogSurface,
    DialogTitle,
    DialogBody,
    DialogContent,
    DialogActions,
    Input,
    Field,
    Text,
    Spinner,
    Link,
} from "@fluentui/react-components";
import { useAuthSession } from "@/app/components/Auth/useAuthSession";
import { supabase } from "@/lib/supabase";

// setTimeout 允许的最大延时，等效于永不自动关闭
const NEVER_DISMISS_TIMEOUT = 2147483647;
// 输入校验的防抖延时
const VALIDATION_DEBOUNCE_MS = 300;
// 固定 toastId，避免重复弹出
const REMINDER_TOAST_ID = "display-name-reminder";
// 昵称仅允许：中文、英文字母、数字、下划线、连字符、空格
const NICKNAME_PATTERN = /^[\u4e00-\u9fa5A-Za-z0-9_\- ]+$/;

// 校验昵称合法性，返回错误信息；合法时返回 null
function validateNickname(raw: string): string | null {
    const trimmed = raw.trim();
    if (!trimmed) return "昵称不能为空";
    if (trimmed.length < 2 || trimmed.length > 20) return "昵称长度需为 2 - 20 个字符";
    if (!NICKNAME_PATTERN.test(trimmed)) return "昵称只能包含中文、字母、数字、下划线和连字符";
    return null;
}

// 当 profiles 表中的 display_name 缺失时，在右下角弹出永不熄灭的 Toast，引导用户设置昵称
export default function DisplayNameReminder() {
    const { user, loading } = useAuthSession();
    const { dispatchToast, dismissToast } = useToastController();
    const [checked, setChecked] = React.useState(false);
    const [missing, setMissing] = React.useState(false);
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [name, setName] = React.useState("");
    // 用户是否已输入过，未输入过时不做延迟校验（避免刚打开就提示「不能为空」）
    const [touched, setTouched] = React.useState(false);
    const [nameError, setNameError] = React.useState<string | null>(null);
    const [saving, setSaving] = React.useState(false);
    const [saveError, setSaveError] = React.useState<string | null>(null);

    // 登录后检查 profiles 表中 display_name 是否缺失
    React.useEffect(() => {
        if (!user) {
            setChecked(false);
            setMissing(false);
            return;
        }

        let mounted = true;
        (async () => {
            try {
                const { data } = await supabase
                    .from("profiles")
                    .select("display_name")
                    .eq("id", user.id)
                    .maybeSingle();
                if (!mounted) return;
                setMissing(!data?.display_name?.trim());
            } catch {
                // 查询失败时静默处理，不弹出提醒
            } finally {
                if (mounted) setChecked(true);
            }
        })();

        return () => {
            mounted = false;
        };
    }, [user]);

    // 缺失时弹出常驻 Toast；不再缺失（或退出登录）时移除
    React.useEffect(() => {
        if (!checked || !user) return;

        if (missing) {
            dispatchToast(
                <Toast>
                    <ToastTitle>你还没有设置用户名称  つ﹏⊂</ToastTitle>
                    <ToastBody>设置后，你的评论和发布的作品将会展示你的名字。</ToastBody>
                    <ToastFooter>
                        <Button
                            appearance="primary"
                            // size="small"
                            onClick={() => {
                                setName("");
                                setTouched(false);
                                setNameError(null);
                                setSaveError(null);
                                setDialogOpen(true);
                            }}
                        >
                            立即设置
                        </Button>
                    </ToastFooter>
                </Toast>,
                {
                    toastId: REMINDER_TOAST_ID,
                    intent: "warning",
                    timeout: NEVER_DISMISS_TIMEOUT,
                    pauseOnHover: false,
                    pauseOnWindowBlur: false,
                }
            );
        } else {
            dismissToast(REMINDER_TOAST_ID);
        }
    }, [checked, missing, user, dispatchToast, dismissToast]);

    // 输入后延迟校验，避免打字过程中立即报错；停止输入 300ms 后才展示结果
    React.useEffect(() => {
        if (!touched) return;
        const timer = setTimeout(() => {
            setNameError(validateNickname(name));
        }, VALIDATION_DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, [name, touched]);

    const handleNameChange = (value: string) => {
        setName(value);
        setTouched(true);
    };

    const handleSave = async () => {
        if (!user || saving) return;
        // 提交时立即校验，不等防抖
        setTouched(true);
        const validationError = validateNickname(name);
        if (validationError) {
            setNameError(validationError);
            return;
        }
        setNameError(null);
        setSaveError(null);
        setSaving(true);
        // upsert：若 profiles 行不存在则创建（role 使用数据库默认值 USER）
        const { error: updateError } = await supabase
            .from("profiles")
            .upsert({ id: user.id, display_name: name.trim() }, { onConflict: "id" });
        setSaving(false);
        if (updateError) {
            setSaveError(updateError.message);
            return;
        }
        setMissing(false);
        setDialogOpen(false);
        // 刷新页面，让 Header 等组件重新拉取最新的 display_name
        window.location.reload();
    };

    if (loading || !user) return null;

    return (
        <Dialog
            open={dialogOpen}
            onOpenChange={(_, d) => setDialogOpen(d.open)}
            modalType="modal"
        >
            <DialogSurface className="!w-[min(92vw,420px)]" style={{ maxWidth: 420 }}>
                <DialogBody className="!flex !flex-col">
                    <DialogTitle className="!text-[20px] !font-semibold">设置用户名称</DialogTitle>
                    <DialogContent className="!pt-4">
                        {saveError && (
                            <Text size={300} className="block mb-3" style={{ color: "var(--colorPaletteRedForeground1)" }}>
                                保存失败：{saveError}
                            </Text>
                        )}
                        <div className="flex flex-col gap-3">
                            <Text size={300} style={{ color: "var(--colorNeutralForeground3)" }}>
                                昵称将用于展示你的评论、发布的插件和主题，设置后随时可以修改。
                                <br/>
                                可在 <Link href={"https://rinlit.cn/zh-cn/account/"}>RinLit 账户管理</Link> 页面修改。
                            </Text>
                            <Field
                                validationMessage={nameError ?? undefined}
                                validationState={nameError ? "error" : "none"}
                            >
                                <Input
                                    value={name}
                                    onChange={(_, d) => handleNameChange(d.value ?? "")}
                                    placeholder="2-20 个字符，支持中文、字母与数字"
                                    size="large"
                                    maxLength={30}
                                    className="w-full"
                                    autoFocus
                                    onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
                                />
                            </Field>
                        </div>
                    </DialogContent>
                    <DialogActions className="!mt-4">
                        <Button appearance="secondary" onClick={() => setDialogOpen(false)} disabled={saving}>
                            取消
                        </Button>
                        <Button
                            appearance="primary"
                            onClick={handleSave}
                            disabled={saving || !!nameError}
                            icon={saving ? <Spinner size="tiny" /> : undefined}
                        >
                            {saving ? "保存中..." : "保存"}
                        </Button>
                    </DialogActions>
                </DialogBody>
            </DialogSurface>
        </Dialog>
    );
}

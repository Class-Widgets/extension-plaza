"use client";

import * as React from "react";
import {
    Dialog,
    DialogTrigger,
    DialogSurface,
    DialogTitle,
    DialogBody,
    DialogContent,
    Button,
    Input,
    Spinner,
    Text,
    Link as FluentLink,
    Divider,
    MessageBar,
    MessageBarBody,
} from "@fluentui/react-components";
import {
    ArrowLeft16Regular,
    MailRegular,
    LockClosedRegular,
    KeyRegular,
    DismissRegular,
} from "@fluentui/react-icons";
import { supabase } from "@/lib/supabase";

type Step = "email" | "password" | "otp";

interface AuthDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

function GitHubIcon({ size = 20 }: { size?: number }) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size} aria-hidden="true">
            <path d="M12 .5C5.37.5 0 5.78 0 12.29c0 5.21 3.44 9.63 8.21 11.19.6.11.82-.25.82-.55 0-.27-.01-1.16-.02-2.1-3.34.71-4.04-1.61-4.04-1.61-.55-1.36-1.34-1.72-1.34-1.72-1.09-.73.08-.72.08-.72 1.21.08 1.84 1.22 1.84 1.22 1.07 1.8 2.81 1.28 3.5.98.11-.76.42-1.28.76-1.58-2.67-.3-5.47-1.31-5.47-5.81 0-1.28.47-2.33 1.23-3.15-.12-.3-.53-1.51.12-3.15 0 0 1-.32 3.3 1.2.96-.26 1.98-.39 3-.4 1.02.01 2.04.14 3 .4 2.28-1.52 3.28-1.2 3.28-1.2.65 1.64.24 2.85.12 3.15.77.82 1.23 1.87 1.23 3.15 0 4.51-2.81 5.5-5.49 5.79.43.36.81 1.08.81 2.18 0 1.58-.01 2.85-.01 3.24 0 .3.21.67.83.55C20.56 21.91 24 17.5 24 12.29 24 5.78 18.63.5 12 .5Z" />
        </svg>
    );
}

/** 检查字符串是否为无意义的占位符，如 "{}"、"[]"、"null" 等 */
function isEmptyMessage(msg: string): boolean {
    const trimmed = msg.trim();
    return trimmed === "{}" || trimmed === "[]" || trimmed === "null" || trimmed === "";
}

/** Supabase Auth 错误码到中文消息的映射 */
const ERROR_CODE_MAP: Record<string, string> = {
    invalid_credentials: "邮箱或密码错误",
    email_not_confirmed: "邮箱尚未验证，请先验证邮箱",
    rate_limit_exceeded: "操作过于频繁，请稍后再试",
    user_already_registered: "该邮箱已注册",
    otp_expired: "验证码已过期，请重新发送",
    invalid_otp: "验证码无效",
    email_address_not_authorized: "发送邮件受限：请在 Supabase 中配置自定义 SMTP 或确保收件人在组织成员列表中",
    email_address_invalid: "邮箱格式不正确或为不支持的测试域名",
    captcha_failed: "人机验证失败，请重试",
    bad_jwt: "登录状态异常，请重新登录",
    bad_oauth_state: "登录状态已失效，请重新登录",
    not_implemented: "该功能未启用，请联系管理员",
    session_not_found: "登录会话已过期，请重新登录",
    unexpected_failure: "服务暂时不可用，请稍后重试",
};

/** 兼容 auth-js 各种 AuthError 子类的结构类型 */
type AuthErrorLike = {
    message?: string;
    code?: string;
    name?: string;
    status?: number;
    originalError?: unknown;
};

function translateError(error: unknown): string {
    if (!error || typeof error !== "object") return "发生未知错误，请稍后重试";
    const e = error as Record<string, unknown>;

    // 1. 优先使用错误码映射（AuthApiError 包含有意义的 code）
    const code = e.code as string | undefined;
    if (code && ERROR_CODE_MAP[code]) {
        return ERROR_CODE_MAP[code];
    }

    // 2. 如果 message 有效且有意义，使用它
    const rawMsg = (e.message as string | undefined)?.trim() ?? "";
    if (rawMsg && !isEmptyMessage(rawMsg)) {
        const msgLower = rawMsg.toLowerCase();
        // 旧的 message 关键词匹配（兼容 auth-js 返回纯字符串 message 的场景）
        if (msgLower.includes("invalid login credentials")) return "邮箱或密码错误";
        if (msgLower.includes("email not confirmed")) return "邮箱尚未验证，请先验证邮箱";
        if (msgLower.includes("rate limit") || msgLower.includes("too many")) return "操作过于频繁，请稍后再试";
        if (msgLower.includes("user already registered")) return "该邮箱已注册";
        if (msgLower.includes("token has expired") || (msgLower.includes("invalid") && msgLower.includes("otp"))) return "验证码无效或已过期";
        if (msgLower.includes("network")) return "网络连接异常，请检查网络";
        if (msgLower.includes("not authorized") || msgLower.includes("smtp")) return "发送邮件受限，请检查 Supabase SMTP 配置";
        if (msgLower.includes("fetch") || msgLower.includes("networkerror")) return "网络连接异常，请检查网络";
        return rawMsg;
    }

    // 3. message 无意义（如 "{}"），尝试用 error.name 推断
    const name = e.name as string | undefined;
    if (name === "AuthUnknownError") {
        // 尝试从 originalError 中提取
        const orig = e.originalError as Record<string, unknown> | undefined;
        if (orig && typeof orig === "object") {
            const origMsg = (orig.message as string | undefined)?.trim() ?? "";
            if (origMsg && !isEmptyMessage(origMsg)) return origMsg;
            const origCode = orig.code as string | undefined;
            if (origCode && ERROR_CODE_MAP[origCode]) return ERROR_CODE_MAP[origCode];
        }
        return "服务暂时不可用，请稍后重试（AuthUnknownError）";
    }

    if (name === "AuthRetryableFetchError") {
        return "网络连接异常或服务暂时不可用，请稍后重试";
    }

    // 4. 最后兜底
    if (code && ERROR_CODE_MAP[code]) return ERROR_CODE_MAP[code];
    return "发生未知错误，请稍后重试";
}

// 居中的邮箱回显，点击可返回邮箱输入步骤
function EmailDisplay({ email, onBack }: { email: string; onBack: () => void }) {
    return (
        <div className="flex items-center justify-center gap-1.5">
            <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-1 text-[13px] hover:underline focus:outline-none"
                style={{ color: "var(--colorNeutralForeground3)" }}
            >
                <ArrowLeft16Regular />
                <span className="truncate max-w-[260px]">{email}</span>
            </button>
        </div>
    );
}

export default function AuthDialog({ open, onOpenChange }: AuthDialogProps) {
    const [step, setStep] = React.useState<Step>("email");
    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [otpCode, setOtpCode] = React.useState("");
    const [loading, setLoading] = React.useState(false);
    const [sendingOtp, setSendingOtp] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [info, setInfo] = React.useState<string | null>(null);
    const [countdown, setCountdown] = React.useState(0);

    const resetState = React.useCallback(() => {
        setStep("email");
        setEmail("");
        setPassword("");
        setOtpCode("");
        setLoading(false);
        setSendingOtp(false);
        setError(null);
        setInfo(null);
        setCountdown(0);
    }, []);

    React.useEffect(() => {
        if (!open) {
            const t = setTimeout(resetState, 200);
            return () => clearTimeout(t);
        }
    }, [open, resetState]);

    React.useEffect(() => {
        if (countdown <= 0) return;
        const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
        return () => clearTimeout(t);
    }, [countdown]);

    const handleEmailNext = () => {
        setError(null);
        const e = email.trim();
        if (!e) { setError("请输入邮箱地址"); return; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) { setError("请输入有效的邮箱地址"); return; }
        setStep("password");
    };

    const handlePasswordSignIn = async () => {
        setError(null);
        if (!password) { setError("请输入密码"); return; }
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        setLoading(false);
        if (error) { setError(translateError(error)); return; }
        onOpenChange(false);
    };

    const handleSendOtp = async () => {
        setError(null);
        setInfo(null);
        if (countdown > 0 || sendingOtp) return;
        setSendingOtp(true);
        const { error } = await supabase.auth.signInWithOtp({
            email: email.trim(),
            options: { shouldCreateUser: false },
        });
        setSendingOtp(false);
        if (error) { setError(translateError(error)); return; }
        setInfo(`验证码已发送至 ${email.trim()}，请检查收件箱（含垃圾邮件）`);
        setCountdown(60);
    };

    const handleOtpVerify = async () => {
        setError(null);
        const code = otpCode.trim();
        if (!code || code.length !== 6) { setError("请输入 6 位验证码"); return; }
        setLoading(true);
        const { error } = await supabase.auth.verifyOtp({
            email: email.trim(),
            token: code,
            type: "email",
        });
        setLoading(false);
        if (error) { setError(translateError(error)); return; }
        onOpenChange(false);
    };

    const handleGithubOAuth = async () => {
        setError(null);
        setLoading(true);
        const redirectTo = window.location.hostname === "localhost" ? `${window.location.origin}/` : "https://plaza.cw.rinlit.cn/";
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "github",
            options: {
                redirectTo: redirectTo
            },
        });
        if (error) {
            setError(translateError(error));
            setLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        setError(null);
        setInfo(null);
        setLoading(true);
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
            redirectTo: window.location.origin + "/",
        });
        setLoading(false);
        if (error) { setError(translateError(error)); return; }
        setInfo(`密码重置链接已发送至 ${email.trim()}，请检查邮箱`);
    };

    const goToEmail = () => { setError(null); setInfo(null); setStep("email"); };
    const goToOtp = () => { setError(null); setInfo(null); setOtpCode(""); setStep("otp"); };
    const goToPassword = () => { setError(null); setInfo(null); setPassword(""); setStep("password"); };

    return (
        <Dialog open={open} onOpenChange={(_, d) => onOpenChange(d.open)} modalType="modal">
            <DialogSurface className="!w-[min(92vw,440px)]" style={{ maxWidth: 440 }}>
                <DialogBody className="!flex !flex-col">
                    <div className="flex items-start justify-between gap-4">
                        <DialogTitle className="!pr-0 !text-[22px] !font-semibold">
                            {step === "email" && "登录账户"}
                            {step === "password" && "输入密码"}
                            {step === "otp" && "验证码登录"}
                        </DialogTitle>
                        <DialogTrigger disableButtonEnhancement>
                            <Button appearance="subtle" icon={<DismissRegular />} aria-label="关闭" size="small" />
                        </DialogTrigger>
                    </div>

                    <DialogContent className="!pt-4 !pb-1">
                        {error && (
                            <MessageBar intent="error" className="mb-3">
                                <MessageBarBody>{error}</MessageBarBody>
                            </MessageBar>
                        )}
                        {info && !error && (
                            <MessageBar intent="info" className="mb-3">
                                <MessageBarBody>{info}</MessageBarBody>
                            </MessageBar>
                        )}

                        {/* 邮箱步骤 */}
                        {step === "email" && (
                            <div className="flex flex-col gap-4">
                                <Text size={300} className="block text-center" style={{ color: "var(--colorNeutralForeground3)" }}>
                                    继续使用您的 RinLit 账户
                                </Text>
                                <Input
                                    type="email"
                                    value={email}
                                    onChange={(_, d) => setEmail(d.value ?? "")}
                                    placeholder="email@example.com"
                                    contentBefore={<MailRegular />}
                                    className="w-full"
                                    autoFocus
                                    autoComplete="email"
                                    onKeyDown={(e) => { if (e.key === "Enter") handleEmailNext(); }}
                                />
                                <Button
                                    appearance="primary"
                                    className="w-full"
                                    onClick={handleEmailNext}
                                >
                                    下一步
                                </Button>
                                <div className="text-center text-[13px]">
                                    <Text size={300} style={{ color: "var(--colorNeutralForeground3)" }}>
                                        没有账户？
                                    </Text>{" "}
                                    <FluentLink as="a" href="https://rinlit.cn" target="_blank">
                                        前往 rinlit.cn 注册
                                    </FluentLink>
                                </div>

                                <div className="flex items-center gap-3 py-1">
                                    <Divider className="flex-1" />
                                    <Text size={200} style={{ color: "var(--colorNeutralForeground3)" }}>或</Text>
                                    <Divider className="flex-1" />
                                </div>

                                <Button
                                    appearance="outline"
                                    className="w-full"
                                    icon={<GitHubIcon />}
                                    onClick={handleGithubOAuth}
                                    disabled={loading}
                                >
                                    使用 GitHub 登录
                                </Button>
                            </div>
                        )}

                        {/* 密码步骤 */}
                        {step === "password" && (
                            <div className="flex flex-col gap-4">
                                <EmailDisplay email={email.trim()} onBack={goToEmail} />
                                <Input
                                    type="password"
                                    value={password}
                                    onChange={(_, d) => setPassword(d.value ?? "")}
                                    placeholder="········"
                                    contentBefore={<LockClosedRegular />}
                                    className="w-full"
                                    autoFocus
                                    autoComplete="current-password"
                                    onKeyDown={(e) => { if (e.key === "Enter") handlePasswordSignIn(); }}
                                />
                                <Button
                                    appearance="primary"
                                    className="w-full"
                                    onClick={handlePasswordSignIn}
                                    disabled={loading}
                                    icon={loading ? <Spinner size="tiny" /> : undefined}
                                >
                                    {loading ? "登录中..." : "登录"}
                                </Button>
                                <div className="flex items-center justify-between text-[13px]">
                                    <FluentLink as="button" type="button" onClick={handleForgotPassword} disabled={loading}>
                                        忘记密码？
                                    </FluentLink>
                                    <FluentLink as="button" type="button" onClick={goToOtp} disabled={loading}>
                                        使用邮箱验证码登录
                                    </FluentLink>
                                </div>
                            </div>
                        )}

                        {/* 验证码步骤 */}
                        {step === "otp" && (
                            <div className="flex flex-col gap-4">
                                <EmailDisplay email={email.trim()} onBack={goToEmail} />
                                <Text size={300} className="block text-center" style={{ color: "var(--colorNeutralForeground3)" }}>
                                    输入发送到您邮箱的 6 位验证码
                                </Text>
                                <div className="flex gap-2">
                                    <Input
                                        type="text"
                                        value={otpCode}
                                        onChange={(_, d) => setOtpCode((d.value ?? "").replace(/\D/g, "").slice(0, 6))}
                                        placeholder="000000"
                                        contentBefore={<KeyRegular />}
                                        className="flex-1"
                                        autoFocus
                                        inputMode="numeric"
                                        maxLength={6}
                                        autoComplete="one-time-code"
                                        onKeyDown={(e) => { if (e.key === "Enter") handleOtpVerify(); }}
                                    />
                                    <Button
                                        appearance="outline"
                                        onClick={handleSendOtp}
                                        disabled={sendingOtp || countdown > 0}
                                        icon={sendingOtp ? <Spinner size="tiny" /> : undefined}
                                        className="shrink-0 whitespace-nowrap"
                                    >
                                        {countdown > 0 ? `${countdown}s` : "发送验证码"}
                                    </Button>
                                </div>
                                <Button
                                    appearance="primary"
                                    className="w-full"
                                    onClick={handleOtpVerify}
                                    disabled={loading}
                                    icon={loading ? <Spinner size="tiny" /> : undefined}
                                >
                                    {loading ? "验证中..." : "登录"}
                                </Button>
                                <div className="text-center text-[13px]">
                                    <FluentLink as="button" type="button" onClick={goToPassword} disabled={loading}>
                                        使用密码登录
                                    </FluentLink>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </DialogBody>
            </DialogSurface>
        </Dialog>
    );
}

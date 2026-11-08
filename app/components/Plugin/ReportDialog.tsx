"use client";

import * as React from "react";
import { Button, Dialog, DialogBody, DialogContent, DialogSurface, DialogTitle, Field, Input, Text, Textarea } from "@fluentui/react-components";
import { DismissRegular, MailRegular, CopyRegular } from "@fluentui/react-icons";

const REPORT_EMAIL = "lintusup@foxmail.com";

type ReportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subject: string;
  context: string;
};

export default function ReportDialog({ open, onOpenChange, subject, context }: ReportDialogProps) {
  const [copied, setCopied] = React.useState<"email" | "template" | null>(null);

  const template = React.useMemo(() => [
    "您好，我要举报插件广场中的内容。",
    "",
    `举报对象：${context}`,
    `页面链接：${typeof window === "undefined" ? "" : window.location.href}`,
    "",
    "举报原因：",
    "（请详细说明问题，并尽量附上截图、相关证据及您的联系方式。）",
  ].join("\n"), [context]);

  const mailto = React.useMemo(() => {
    return `mailto:${REPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(template)}`;
  }, [subject, template]);

  const copyText = async (value: string, type: "email" | "template") => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(type);
      window.setTimeout(() => setCopied(null), 1800);
    } catch {
      setCopied(null);
    }
  };

  React.useEffect(() => {
    if (!open) setCopied(null);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(_, data) => onOpenChange(data.open)}>
      <DialogSurface className="!w-[min(92vw,520px)]">
        <DialogBody className="!relative">
          <DialogTitle className="!pr-10 !text-[22px] !font-semibold">举报内容</DialogTitle>
          <Button
            appearance="subtle"
            icon={<DismissRegular />}
            aria-label="关闭"
            size="small"
            className="!absolute !right-3 !top-3"
            onClick={() => onOpenChange(false)}
          />
          <DialogContent className="!space-y-4 !pt-5">
            <Text block>如果你发现插件或评论存在违法违规、侵权、欺诈、恶意内容或其他需要处理的问题，请通过电子邮箱提交举报。</Text>
            <Field label="举报邮箱">
              <Input
                value={REPORT_EMAIL}
                readOnly
                className="w-full"
                contentAfter={
                  <Button appearance="subtle" size="small" icon={<CopyRegular />} onClick={() => copyText(REPORT_EMAIL, "email")}>
                    {copied === "email" ? "已复制" : "复制"}
                  </Button>
                }
              />
            </Field>
            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
              <div>邮件中请尽量包含：</div>
              <ul className="list-disc space-y-1 pl-5">
                <li>举报原因和具体问题描述</li>
                <li>相关页面链接、插件名称或评论内容</li>
                <li>截图及其他可以帮助核实的材料</li>
                <li>方便联系你的邮箱或其他联系方式</li>
              </ul>
            </div>
            <div className="space-y-2">
              <Text weight="semibold">举报模板预览</Text>
              <Field label="邮件主题">
                <Input value={subject} readOnly className="w-full" />
              </Field>
              <Field label="邮件正文">
                <Textarea value={template} readOnly resize="vertical" rows={8} className="min-h-40 w-full" />
              </Field>
            </div>
            <Button appearance="secondary" icon={<CopyRegular />} onClick={() => copyText(template, "template")}>
              {copied === "template" ? "已复制举报模板" : "复制举报模板"}
            </Button>
            <div className="flex justify-end gap-2 pt-2">
              <Button appearance="secondary" onClick={() => onOpenChange(false)}>取消</Button>
              <Button appearance="primary" icon={<MailRegular />} onClick={() => { window.location.href = mailto; }}>
                打开邮箱举报
              </Button>
            </div>
          </DialogContent>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}

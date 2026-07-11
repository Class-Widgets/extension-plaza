"use client";

import * as React from "react";
import { Toast, ToastBody, ToastTitle, useToastController } from "@fluentui/react-components";

const TOASTER_ID = "admin-toaster";

export function useAdminToasts() {
    const { dispatchToast } = useToastController(TOASTER_ID);

    const toastError = React.useCallback((message: string) => {
        dispatchToast(
            <Toast>
                <ToastTitle>错误</ToastTitle>
                <ToastBody>{message}</ToastBody>
            </Toast>,
            { intent: "error", position: "top-end", timeout: 5000 },
        );
    }, [dispatchToast]);

    const toastSuccess = React.useCallback((message: string) => {
        dispatchToast(
            <Toast>
                <ToastTitle>成功</ToastTitle>
                <ToastBody>{message}</ToastBody>
            </Toast>,
            { intent: "success", position: "top-end", timeout: 3000 },
        );
    }, [dispatchToast]);

    return { toastError, toastSuccess };
}

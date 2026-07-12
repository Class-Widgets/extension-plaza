"use client";

import { Toaster } from "@fluentui/react-components";

export default function AdminToaster() {
    return <Toaster toasterId="admin-toaster" position="top-end" limit={5} timeout={4000} pauseOnHover={true} pauseOnWindowBlur={true} />;
}

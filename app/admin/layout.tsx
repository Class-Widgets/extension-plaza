import AdminToaster from "./components/AdminToaster";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <AdminToaster />
            {children}
        </>
    );
}

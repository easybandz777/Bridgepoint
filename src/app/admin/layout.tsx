import { AdminAuth } from '@/components/admin/admin-auth';
import { AdminShell } from '@/components/admin/admin-shell';

export const metadata = {
    title: 'Admin | Bridgepointe',
    robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <AdminAuth>
            <AdminShell>
                {children}
            </AdminShell>
        </AdminAuth>
    );
}

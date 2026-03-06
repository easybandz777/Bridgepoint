import { AdminAuth } from '@/components/admin/admin-auth';
import { AdminSidebar } from '@/components/admin/admin-sidebar';

export const metadata = {
    title: 'Admin | Bridgepointe',
    robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <AdminAuth>
            <div className="flex min-h-screen" style={{ background: '#0f0f0f' }}>
                <AdminSidebar />
                <div className="flex-1 min-w-0 overflow-auto">
                    {children}
                </div>
            </div>
        </AdminAuth>
    );
}

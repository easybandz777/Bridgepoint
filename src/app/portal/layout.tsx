import type { Metadata } from 'next';
import { PortalI18nProvider } from '@/lib/portal-i18n';
import { PortalShell } from '@/components/portal/portal-shell';

export const metadata: Metadata = {
    title: 'Crew Portal | Bridgepointe',
    robots: { index: false, follow: false },
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
    return (
        <PortalI18nProvider>
            <PortalShell>{children}</PortalShell>
        </PortalI18nProvider>
    );
}

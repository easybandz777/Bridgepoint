'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { PortalUserProvider } from '@/lib/portal-context';

export function PortalAuthGate({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const onUnauthenticated = useCallback(() => {
        router.replace('/portal/login');
    }, [router]);

    return (
        <PortalUserProvider onUnauthenticated={onUnauthenticated}>
            {children}
        </PortalUserProvider>
    );
}

'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { PortalSidebar } from './portal-sidebar';
import { PortalTopbar } from './portal-topbar';
import { PortalBottomNav } from './portal-bottom-nav';
import { ChangePinDialog } from './change-pin-dialog';
import { PortalAuthGate } from './portal-auth-gate';
import { usePortalUser } from '@/lib/portal-context';

/**
 * Shell wrapper used by the portal layout. Decides whether to apply
 * the authenticated chrome (sidebar + bottom nav + auth gate) or
 * pass children through plain — login lives at /portal/login and
 * must render standalone.
 */
export function PortalShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isStandalone =
        pathname === '/portal/login' ||
        pathname === '/portal' ||
        pathname === '/portal/setup';
    if (isStandalone) {
        return <>{children}</>;
    }
    return (
        <PortalAuthGate>
            <PortalShellChrome>{children}</PortalShellChrome>
        </PortalAuthGate>
    );
}

function PortalShellChrome({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const { user, refresh } = usePortalUser();

    return (
        <div className="flex h-screen overflow-hidden" style={{ background: '#0f0f0f' }}>
            <PortalTopbar onOpenMenu={() => setOpen(true)} />

            {open && (
                <div
                    className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm md:hidden"
                    onClick={() => setOpen(false)}
                />
            )}

            <div
                className={[
                    'fixed inset-y-0 left-0 z-[60] transition-transform duration-300 md:static md:inset-y-auto md:translate-x-0 md:flex md:shrink-0',
                    open ? 'translate-x-0' : '-translate-x-full',
                ].join(' ')}
            >
                <PortalSidebar onClose={() => setOpen(false)} />
            </div>

            <div className="flex-1 min-w-0 overflow-y-auto pt-14 md:pt-0 pb-16 md:pb-0">
                {children}
            </div>

            <PortalBottomNav />

            <ChangePinDialog
                open={user.mustChangePin}
                forced
                onSuccess={() => {
                    refresh();
                }}
            />
        </div>
    );
}

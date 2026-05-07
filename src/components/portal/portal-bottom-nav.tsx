'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Hammer, Clock, User, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/portal-i18n';
import { usePortalUser } from '@/lib/portal-context';

export function PortalBottomNav() {
    const pathname = usePathname();
    const t = useT();
    const { user } = usePortalUser();
    const isEmployee = user.userType === 'employee';

    const middleItem = isEmployee
        ? { href: '/portal/clock', label: t('nav.clock'), icon: Clock }
        : { href: '/portal/pay', label: t('nav.billings'), icon: Wallet };

    const items = [
        { href: '/portal/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
        { href: '/portal/jobs', label: t('nav.jobs'), icon: Hammer },
        middleItem,
        { href: '/portal/profile', label: t('nav.profile'), icon: User },
    ];

    return (
        <nav
            className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#131313]/95 backdrop-blur-md border-t border-white/8"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
            <ul className="grid grid-cols-4">
                {items.map(({ href, label, icon: Icon }) => {
                    const active = pathname === href || pathname.startsWith(href + '/');
                    return (
                        <li key={href}>
                            <Link
                                href={href}
                                className={cn(
                                    'flex flex-col items-center justify-center gap-1 py-2.5 transition-colors',
                                    active ? 'text-[#b8956a]' : 'text-white/45 hover:text-white/80',
                                )}
                            >
                                <Icon size={18} />
                                <span className="text-[10px] font-medium uppercase tracking-[0.12em]">{label}</span>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}

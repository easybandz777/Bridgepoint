'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    Hammer,
    Clock,
    Wallet,
    User,
    FileText,
    MessageCircle,
    LogOut,
    X,
    type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/portal-i18n';
import { usePortalUser } from '@/lib/portal-context';
import { portalLogout } from '@/lib/portal-client';
import { LanguageToggle } from './language-toggle';
import { SITE_CONFIG } from '@/lib/constants';

interface NavItem {
    href: string;
    label: string;
    icon: LucideIcon;
}

interface PortalSidebarProps {
    onClose?: () => void;
}

export function PortalSidebar({ onClose }: PortalSidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const t = useT();
    const { user } = usePortalUser();
    const isEmployee = user.userType === 'employee';

    const mainSection: NavItem[] = [
        { href: '/portal/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
        { href: '/portal/jobs', label: t('nav.jobs'), icon: Hammer },
    ];

    const timeSection: NavItem[] = isEmployee
        ? [
            { href: '/portal/clock', label: t('nav.clock'), icon: Clock },
            { href: '/portal/timesheets', label: t('nav.timesheets'), icon: FileText },
            { href: '/portal/pay', label: t('nav.pay'), icon: Wallet },
        ]
        : [
            { href: '/portal/pay', label: t('nav.billings'), icon: Wallet },
        ];

    const personalSection: NavItem[] = [
        { href: '/portal/profile', label: t('nav.profile'), icon: User },
        { href: '/portal/documents', label: t('nav.documents'), icon: FileText },
        { href: '/portal/messages', label: t('nav.messages'), icon: MessageCircle },
    ];

    function handleNavClick() {
        onClose?.();
    }

    async function handleLogout() {
        await portalLogout();
        router.push('/portal/login');
    }

    function renderSection(title: string, items: NavItem[]) {
        if (items.length === 0) return null;
        return (
            <div className="mb-6 last:mb-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/25 px-3 mb-2">
                    {title}
                </p>
                <ul className="space-y-0.5">
                    {items.map(({ href, label, icon: Icon }) => {
                        const active = pathname === href || pathname.startsWith(href + '/');
                        return (
                            <li key={href}>
                                <Link
                                    href={href}
                                    onClick={handleNavClick}
                                    className={cn(
                                        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                                        active
                                            ? 'bg-[#b8956a]/15 text-[#b8956a]'
                                            : 'text-white/45 hover:text-white/80 hover:bg-white/5',
                                    )}
                                >
                                    <Icon size={16} className={active ? 'text-[#b8956a]' : 'text-white/35'} />
                                    {label}
                                    {active && <span className="ml-auto w-1 h-1 rounded-full bg-[#b8956a]" />}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </div>
        );
    }

    return (
        <aside className="w-64 h-full min-h-screen bg-[#131313] border-r border-white/6 flex flex-col shrink-0">
            {/* Brand */}
            <div className="px-6 py-6 border-b border-white/6 flex items-center justify-between">
                <Link href="/portal/dashboard" onClick={handleNavClick}>
                    <h1 className="font-serif text-xl font-bold text-white tracking-tight leading-none mb-0.5">
                        {SITE_CONFIG.name}
                    </h1>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#b8956a]">
                        {t('nav.crewPortal')}
                    </p>
                </Link>
                {onClose && (
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label={t('nav.closeMenu')}
                        className="md:hidden w-8 h-8 flex items-center justify-center rounded-xl text-white/30 hover:text-white hover:bg-white/5 transition-all"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            {/* Gold rule */}
            <div className="h-px bg-gradient-to-r from-[#b8956a]/40 via-[#b8956a]/20 to-transparent mx-6" />

            {/* User card */}
            <div className="px-4 py-4 border-b border-white/6">
                <div className="flex items-center gap-3 px-2">
                    <div
                        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-semibold"
                        style={{ background: 'linear-gradient(135deg, #b8956a 0%, #9a7a54 100%)' }}
                    >
                        {(user.displayName || '?').slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{user.displayName}</p>
                        <p className="text-[11px] text-white/45 truncate">{user.role}</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-5 overflow-y-auto">
                {renderSection(t('nav.sectionMain'), mainSection)}
                {renderSection(t('nav.sectionTime'), timeSection)}
                {renderSection(t('nav.sectionPersonal'), personalSection)}
            </nav>

            {/* Footer: language + sign out */}
            <div className="px-4 py-4 border-t border-white/6 space-y-3">
                <div className="px-1">
                    <LanguageToggle showIcon className="w-full justify-center" />
                </div>
                <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium text-white/30 hover:text-red-400/70 hover:bg-red-500/5 transition-all"
                >
                    <LogOut size={13} />
                    {t('auth.signOut')}
                </button>
            </div>
        </aside>
    );
}

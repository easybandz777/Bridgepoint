'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, Receipt, LogOut, Phone, X, Hammer, Users, CreditCard, TrendingUp } from 'lucide-react';
import { SITE_CONFIG } from '@/lib/constants';
import { cn } from '@/lib/utils';

const NAV_MANAGEMENT = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { href: '/admin/estimates', label: 'Estimates', icon: FileText, exact: false },
    { href: '/admin/invoices', label: 'Invoices', icon: Receipt, exact: false },
];

const NAV_OPERATIONS = [
    { href: '/admin/projects', label: 'Projects', icon: Hammer, exact: false },
    { href: '/admin/subcontractors', label: 'Subcontractors', icon: Users, exact: false },
];

const NAV_FINANCIALS = [
    { href: '/admin/expenses', label: 'Expenses', icon: CreditCard, exact: false },
    { href: '/admin/reports', label: 'Reports', icon: TrendingUp, exact: false },
];

interface AdminSidebarProps {
    onClose?: () => void;
}

export function AdminSidebar({ onClose }: AdminSidebarProps) {
    const pathname = usePathname();

    function handleLogout() {
        sessionStorage.removeItem('bp_admin_auth');
        window.location.reload();
    }

    function handleNavClick() {
        onClose?.();
    }

    function renderNavSection(title: string, links: typeof NAV_MANAGEMENT) {
        return (
            <div className="mb-6 last:mb-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/25 px-3 mb-2">
                    {title}
                </p>
                <ul className="space-y-0.5">
                    {links.map(({ href, label, icon: Icon, exact }) => {
                        const active = exact ? pathname === href : pathname.startsWith(href);
                        return (
                            <li key={href}>
                                <Link
                                    href={href}
                                    onClick={handleNavClick}
                                    className={cn(
                                        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                                        active
                                            ? 'bg-[#b8956a]/15 text-[#b8956a]'
                                            : 'text-white/45 hover:text-white/80 hover:bg-white/5'
                                    )}
                                >
                                    <Icon size={16} className={active ? 'text-[#b8956a]' : 'text-white/35'} />
                                    {label}
                                    {active && (
                                        <span className="ml-auto w-1 h-1 rounded-full bg-[#b8956a]" />
                                    )}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </div>
        );
    }

    return (
        <aside className="w-64 min-h-screen bg-[#131313] border-r border-white/6 flex flex-col shrink-0">
            {/* Brand */}
            <div className="px-6 py-6 border-b border-white/6 flex items-center justify-between">
                <Link href="/admin" onClick={handleNavClick}>
                    <h1 className="font-serif text-xl font-bold text-white tracking-tight leading-none mb-0.5">
                        {SITE_CONFIG.name}
                    </h1>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#b8956a]">
                        Operations
                    </p>
                </Link>
                {/* Mobile close button */}
                {onClose && (
                    <button
                        onClick={onClose}
                        aria-label="Close navigation"
                        className="md:hidden w-8 h-8 flex items-center justify-center rounded-xl text-white/30 hover:text-white hover:bg-white/5 transition-all"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            {/* Gold rule */}
            <div className="h-px bg-gradient-to-r from-[#b8956a]/40 via-[#b8956a]/20 to-transparent mx-6" />

            {/* Navigation */}
            <nav className="flex-1 px-3 py-5 overflow-y-auto">
                {renderNavSection('Sales & Billing', NAV_MANAGEMENT)}
                {renderNavSection('Production', NAV_OPERATIONS)}
                {renderNavSection('Financials', NAV_FINANCIALS)}

                <div className="my-5 h-px bg-white/6 mx-3" />

                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/25 px-3 mb-2">
                    Public
                </p>
                <Link
                    href="/"
                    target="_blank"
                    onClick={handleNavClick}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/35 hover:text-white/65 hover:bg-white/5 transition-all"
                >
                    <span className="text-white/25">↗</span>
                    Live Site
                </Link>
            </nav>

            {/* Footer */}
            <div className="px-4 py-5 border-t border-white/6">
                <div className="flex items-center gap-2 text-xs text-white/25 mb-3 px-1">
                    <Phone size={11} />
                    <span>{SITE_CONFIG.phone}</span>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium text-white/30
                     hover:text-red-400/70 hover:bg-red-500/5 transition-all"
                >
                    <LogOut size={13} />
                    Sign Out
                </button>
            </div>
        </aside>
    );
}

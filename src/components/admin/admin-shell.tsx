'use client';

import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { AdminSidebar } from './admin-sidebar';
import { SITE_CONFIG } from '@/lib/constants';

export function AdminShell({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (!open) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false);
        };
        window.addEventListener('keydown', onKey);
        return () => {
            document.body.style.overflow = prev;
            window.removeEventListener('keydown', onKey);
        };
    }, [open]);

    return (
        <div className="flex h-screen overflow-hidden" style={{ background: '#0f0f0f' }}>

            {/* ── Mobile top bar ── */}
            <div
                className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 h-14 bg-[#131313] border-b border-white/6 md:hidden"
                style={{ paddingTop: 'env(safe-area-inset-top)' }}
            >
                <button
                    onClick={() => setOpen(true)}
                    aria-label="Open navigation menu"
                    aria-expanded={open}
                    aria-controls="admin-sidebar-drawer"
                    className="w-11 h-11 flex items-center justify-center rounded-xl text-white/70 hover:text-white hover:bg-white/5 transition-all"
                >
                    <Menu size={20} aria-hidden="true" />
                </button>
                <div className="text-center">
                    <p className="font-serif text-sm font-bold text-white leading-none">{SITE_CONFIG.name}</p>
                    <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#b8956a] mt-0.5">Admin</p>
                </div>
                {/* Spacer to keep title centered */}
                <div className="w-11" />
            </div>

            {/* ── Mobile overlay backdrop ── */}
            {open && (
                <div
                    className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm md:hidden"
                    onClick={() => setOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* ── Sidebar ── */}
            {/* Desktop: always visible, sticky full height */}
            {/* Mobile: slides in from left as a drawer */}
            <div
                id="admin-sidebar-drawer"
                className={[
                    'fixed inset-y-0 left-0 z-[60] transition-transform duration-300 md:static md:inset-y-auto md:translate-x-0 md:flex md:shrink-0',
                    open ? 'translate-x-0' : '-translate-x-full',
                ].join(' ')}
            >
                <AdminSidebar onClose={() => setOpen(false)} />
            </div>

            {/* ── Main content ── */}
            {/* pt-14 on mobile offsets the fixed top bar; md:pt-0 resets on desktop */}
            <div className="flex-1 min-w-0 overflow-y-auto pt-14 md:pt-0">
                {children}
            </div>
        </div>
    );
}

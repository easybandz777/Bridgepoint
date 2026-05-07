'use client';

import { Menu } from 'lucide-react';
import { useT } from '@/lib/portal-i18n';
import { SITE_CONFIG } from '@/lib/constants';

interface PortalTopbarProps {
    onOpenMenu: () => void;
}

export function PortalTopbar({ onOpenMenu }: PortalTopbarProps) {
    const t = useT();
    return (
        <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 h-14 bg-[#131313] border-b border-white/6 md:hidden">
            <button
                type="button"
                onClick={onOpenMenu}
                aria-label={t('nav.openMenu')}
                className="w-9 h-9 flex items-center justify-center rounded-xl text-white/50 hover:text-white hover:bg-white/5 transition-all"
            >
                <Menu size={20} />
            </button>
            <div className="text-center">
                <p className="font-serif text-sm font-bold text-white leading-none">{SITE_CONFIG.name}</p>
                <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#b8956a] mt-0.5">
                    {t('nav.crewPortal')}
                </p>
            </div>
            <div className="w-9" />
        </div>
    );
}

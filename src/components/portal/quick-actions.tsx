'use client';

import Link from 'next/link';
import {
    Clock,
    Camera,
    MessageSquare,
    Hammer,
    Wallet,
    MessageCircle,
    type LucideIcon,
} from 'lucide-react';
import { useT } from '@/lib/portal-i18n';

interface QuickActionsProps {
    userType: 'employee' | 'subcontractor';
    onShift?: boolean;
}

interface Action {
    href: string;
    icon: LucideIcon;
    label: string;
}

export function QuickActions({ userType, onShift }: QuickActionsProps) {
    const t = useT();
    const isEmployee = userType === 'employee';

    const actions: Action[] = [];
    if (isEmployee) {
        actions.push({
            href: '/portal/clock',
            icon: Clock,
            label: onShift ? t('qa.clockOut') : t('qa.clockIn'),
        });
    }
    actions.push({ href: '/portal/jobs', icon: Hammer, label: t('qa.viewJobs') });
    actions.push({ href: '/portal/jobs', icon: Camera, label: t('qa.uploadPhoto') });
    actions.push({ href: '/portal/jobs', icon: MessageSquare, label: t('qa.postUpdate') });
    actions.push({
        href: '/portal/pay',
        icon: Wallet,
        label: isEmployee ? t('qa.viewPay') : t('qa.viewBillings'),
    });
    actions.push({ href: '/portal/messages', icon: MessageCircle, label: t('qa.messages') });

    return (
        <section>
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40 mb-3">
                {t('dashboard.quickActions')}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {actions.map(({ href, icon: Icon, label }) => (
                    <Link
                        key={href + label}
                        href={href}
                        className="group relative rounded-2xl p-4 border bg-[#1a1a1a] hover:bg-[#1f1f1f] hover:border-[#b8956a]/30 transition-all flex flex-col items-center justify-center gap-2 text-center min-h-[88px] active:scale-[0.98]"
                        style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                    >
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
                            style={{ background: 'rgba(184,149,106,0.12)' }}
                        >
                            <Icon size={18} style={{ color: '#b8956a' }} />
                        </div>
                        <span className="text-xs font-semibold text-white/80 leading-tight">
                            {label}
                        </span>
                    </Link>
                ))}
            </div>
        </section>
    );
}

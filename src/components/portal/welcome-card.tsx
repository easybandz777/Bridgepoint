'use client';

import { useT } from '@/lib/portal-i18n';

interface WelcomeCardProps {
    name: string;
    role: string;
    userType: 'employee' | 'subcontractor';
}

export function WelcomeCard({ name, role, userType }: WelcomeCardProps) {
    const t = useT();
    const today = new Date().toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
    });
    const displayedRole = userType === 'subcontractor' ? t('dashboard.subRole') : role;
    return (
        <div
            className="relative rounded-2xl p-5 sm:p-7 border overflow-hidden"
            style={{
                background: 'linear-gradient(135deg, #1e1a14 0%, #2a2218 60%, #1a1610 100%)',
                borderColor: 'rgba(184,149,106,0.32)',
            }}
        >
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background:
                        'radial-gradient(circle at top right, rgba(184,149,106,0.18) 0%, transparent 50%)',
                }}
            />
            <div className="absolute -right-10 -top-10 w-44 h-44 rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(184,149,106,0.15) 0%, transparent 70%)' }}
            />
            <div className="relative">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#b8956a] mb-2">
                    {today}
                </p>
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-tight leading-tight mb-1">
                    {t('dashboard.welcome', { name })}
                </h1>
                <p className="text-sm text-white/60">{displayedRole}</p>
            </div>
        </div>
    );
}

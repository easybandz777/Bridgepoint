'use client';

import { type LucideIcon } from 'lucide-react';

interface DashboardStatProps {
    icon: LucideIcon;
    label: string;
    value: string | number;
    accent?: boolean;
    sub?: string;
}

export function DashboardStat({ icon: Icon, label, value, accent, sub }: DashboardStatProps) {
    return (
        <div
            className="relative rounded-2xl p-4 sm:p-5 border overflow-hidden"
            style={{
                background: accent
                    ? 'linear-gradient(135deg, #1e1a14 0%, #241f16 100%)'
                    : '#1a1a1a',
                borderColor: accent ? 'rgba(184,149,106,0.3)' : 'rgba(255,255,255,0.06)',
            }}
        >
            {accent && (
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: 'radial-gradient(circle at top right, rgba(184,149,106,0.08) 0%, transparent 60%)' }}
                />
            )}
            <div className="flex items-start justify-between mb-3">
                <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{
                        background: accent ? 'rgba(184,149,106,0.15)' : 'rgba(255,255,255,0.05)',
                    }}
                >
                    <Icon size={16} style={{ color: accent ? '#b8956a' : 'rgba(255,255,255,0.45)' }} />
                </div>
            </div>
            <div>
                <p className="font-serif text-2xl sm:text-3xl font-semibold text-white tracking-tight leading-none mb-2">
                    {value}
                </p>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
                    {label}
                </p>
                {sub && <p className="text-xs text-white/30 mt-1">{sub}</p>}
            </div>
        </div>
    );
}

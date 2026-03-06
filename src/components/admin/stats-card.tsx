import { type LucideIcon } from 'lucide-react';

interface StatsCardProps {
    icon: LucideIcon;
    label: string;
    value: string;
    sub?: string;
    trend?: 'up' | 'down' | 'neutral';
    trendLabel?: string;
    accent?: boolean;
}

export function StatsCard({ icon: Icon, label, value, sub, trend, trendLabel, accent }: StatsCardProps) {
    return (
        <div
            className="relative rounded-2xl p-6 border overflow-hidden"
            style={{
                background: accent
                    ? 'linear-gradient(135deg, #1e1a14 0%, #241f16 100%)'
                    : '#1a1a1a',
                borderColor: accent ? 'rgba(184,149,106,0.3)' : 'rgba(255,255,255,0.06)',
            }}
        >
            {accent && (
                <div className="absolute inset-0 pointer-events-none"
                    style={{ background: 'radial-gradient(circle at top right, rgba(184,149,106,0.08) 0%, transparent 60%)' }} />
            )}

            <div className="flex items-start justify-between mb-4">
                <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{
                        background: accent
                            ? 'rgba(184,149,106,0.15)'
                            : 'rgba(255,255,255,0.05)',
                    }}
                >
                    <Icon size={18} style={{ color: accent ? '#b8956a' : 'rgba(255,255,255,0.4)' }} />
                </div>

                {trend && trendLabel && (
                    <span
                        className="text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-lg"
                        style={{
                            background: trend === 'up' ? 'rgba(52,211,153,0.1)' : trend === 'down' ? 'rgba(248,113,113,0.1)' : 'rgba(255,255,255,0.05)',
                            color: trend === 'up' ? '#34d399' : trend === 'down' ? '#f87171' : 'rgba(255,255,255,0.3)',
                        }}
                    >
                        {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '–'} {trendLabel}
                    </span>
                )}
            </div>

            <div>
                <p className="text-2xl font-semibold text-white mb-1 font-serif tracking-tight">
                    {value}
                </p>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/35 mb-1">
                    {label}
                </p>
                {sub && (
                    <p className="text-xs text-white/25 mt-1">{sub}</p>
                )}
            </div>
        </div>
    );
}

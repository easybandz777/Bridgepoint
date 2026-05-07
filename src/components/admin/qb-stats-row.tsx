import { CheckCircle, AlertCircle, Clock, RefreshCw } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface QbStatsRowProps {
    successes: number;
    errors: number;
    lastActivityAt: string | null;
    refreshExpiresAt: string | null | undefined;
}

function fmtRelative(iso: string | null | undefined): string {
    if (!iso) return 'Never';
    const d = new Date(iso);
    if (!Number.isFinite(d.getTime())) return '—';
    const diffMs = Date.now() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    return `${diffDay}d ago`;
}

function fmtCountdown(iso: string | null | undefined): { label: string; sub: string; danger: boolean; warn: boolean } {
    if (!iso) return { label: '—', sub: 'No active connection', danger: false, warn: false };
    const d = new Date(iso);
    if (!Number.isFinite(d.getTime())) return { label: '—', sub: 'Invalid', danger: false, warn: false };
    const diffMs = d.getTime() - Date.now();
    if (diffMs <= 0) return { label: 'Expired', sub: 'Reconnect required', danger: true, warn: false };
    const diffDay = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    const diffHr = Math.floor((diffMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    if (diffDay >= 1) {
        return {
            label: `${diffDay}d`,
            sub: `until ${d.toLocaleDateString()}`,
            danger: diffDay < 3,
            warn: diffDay < 14,
        };
    }
    return { label: `${diffHr}h`, sub: 'until expiry', danger: true, warn: false };
}

interface TileProps {
    icon: LucideIcon;
    label: string;
    value: string;
    sub?: string;
    accent: 'green' | 'red' | 'gold' | 'white' | 'amber';
}

function Tile({ icon: Icon, label, value, sub, accent }: TileProps) {
    const colorMap: Record<TileProps['accent'], { bg: string; fg: string; border: string }> = {
        green: { bg: 'rgba(52,211,153,0.10)', fg: '#34d399', border: 'rgba(52,211,153,0.20)' },
        red: { bg: 'rgba(248,113,113,0.10)', fg: '#f87171', border: 'rgba(248,113,113,0.20)' },
        gold: { bg: 'rgba(184,149,106,0.15)', fg: '#b8956a', border: 'rgba(184,149,106,0.25)' },
        amber: { bg: 'rgba(251,191,36,0.12)', fg: '#fbbf24', border: 'rgba(251,191,36,0.25)' },
        white: { bg: 'rgba(255,255,255,0.05)', fg: 'rgba(255,255,255,0.7)', border: 'rgba(255,255,255,0.10)' },
    };
    const c = colorMap[accent];
    return (
        <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-5">
            <div className="flex items-start gap-3">
                <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
                    style={{ background: c.bg, borderColor: c.border }}
                >
                    <Icon size={16} style={{ color: c.fg }} />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35 mb-1">
                        {label}
                    </p>
                    <p className="text-2xl font-serif font-semibold text-white tracking-tight leading-none mb-1">
                        {value}
                    </p>
                    {sub && <p className="text-[11px] text-white/40 mt-1.5 truncate">{sub}</p>}
                </div>
            </div>
        </div>
    );
}

export function QbStatsRow({ successes, errors, lastActivityAt, refreshExpiresAt }: QbStatsRowProps) {
    const exp = fmtCountdown(refreshExpiresAt);
    const expAccent: TileProps['accent'] = exp.danger ? 'red' : exp.warn ? 'amber' : 'green';

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Tile icon={CheckCircle} label="Successes" value={successes.toLocaleString()} sub="lifetime" accent="green" />
            <Tile icon={AlertCircle} label="Errors" value={errors.toLocaleString()} sub="lifetime" accent={errors > 0 ? 'red' : 'white'} />
            <Tile icon={Clock} label="Last activity" value={fmtRelative(lastActivityAt)} sub={lastActivityAt ? new Date(lastActivityAt).toLocaleString() : '—'} accent="gold" />
            <Tile icon={RefreshCw} label="Refresh token" value={exp.label} sub={exp.sub} accent={expAccent} />
        </div>
    );
}

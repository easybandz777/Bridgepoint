import { CheckCircle, Clock } from 'lucide-react';

interface QbStatusPillProps {
    qbId?: string | null;
    lastSyncedAt?: string | null;
    size?: 'sm' | 'md';
}

function formatRelative(iso: string | null | undefined): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (!Number.isFinite(d.getTime())) return '';
    const diffMs = Date.now() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 30) return `${diffDay}d ago`;
    return d.toLocaleDateString();
}

export function QbStatusPill({ qbId, lastSyncedAt, size = 'sm' }: QbStatusPillProps) {
    const synced = Boolean(qbId);
    const padding = size === 'md' ? 'px-2.5 py-1' : 'px-2 py-0.5';
    const text = size === 'md' ? 'text-[11px]' : 'text-[10px]';
    const icon = size === 'md' ? 12 : 10;

    if (synced) {
        return (
            <span
                className={`inline-flex items-center gap-1.5 rounded-full border bg-[#34d399]/10 text-[#34d399] border-[#34d399]/20 ${padding} ${text} font-semibold uppercase tracking-wide whitespace-nowrap`}
            >
                <CheckCircle size={icon} />
                Synced
                {lastSyncedAt && (
                    <span className="text-[#34d399]/60 font-normal normal-case tracking-normal">
                        · {formatRelative(lastSyncedAt)}
                    </span>
                )}
            </span>
        );
    }

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full border bg-white/5 text-white/40 border-white/10 ${padding} ${text} font-semibold uppercase tracking-wide whitespace-nowrap`}
        >
            <Clock size={icon} />
            Not synced
        </span>
    );
}

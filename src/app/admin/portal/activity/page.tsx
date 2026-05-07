'use client';

import { useEffect, useMemo, useState } from 'react';
import {
    Activity as ActivityIcon,
    Image as ImageIcon,
    MessageSquare,
    Clock,
    LogIn,
    KeyRound,
    Search,
    Calendar,
    Filter,
} from 'lucide-react';

interface ActivityRow {
    id: string;
    entity_type: string;
    entity_id: string;
    action: string;
    actor: string | null;
    description: string | null;
    metadata: unknown;
    created_at: string;
}

const PORTAL_ENTITY_TYPES = [
    'project_photo',
    'project_update',
    'time_entry',
    'portal_session',
    'portal_credential',
    'crew_message',
    'photo',
    'update',
];

function timeAgo(iso: string): string {
    const then = new Date(iso).getTime();
    if (!Number.isFinite(then)) return '';
    const sec = Math.floor((Date.now() - then) / 1000);
    if (sec < 60) return `${sec}s ago`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const day = Math.floor(hr / 24);
    if (day < 30) return `${day}d ago`;
    return new Date(iso).toLocaleDateString();
}

function entityIcon(t: string) {
    if (t === 'project_photo' || t === 'photo') return ImageIcon;
    if (t === 'project_update' || t === 'update') return MessageSquare;
    if (t === 'time_entry') return Clock;
    if (t === 'portal_session') return LogIn;
    if (t === 'portal_credential') return KeyRound;
    if (t === 'crew_message') return MessageSquare;
    return ActivityIcon;
}

function entityColor(t: string): string {
    if (t === 'project_photo' || t === 'photo') return '#a78bfa';
    if (t === 'project_update' || t === 'update') return '#60a5fa';
    if (t === 'time_entry') return '#22d3ee';
    if (t === 'portal_session') return '#34d399';
    if (t === 'portal_credential') return '#b8956a';
    if (t === 'crew_message') return '#f472b6';
    return '#94a3b8';
}

function entityLabel(t: string): string {
    return t.replace(/_/g, ' ');
}

function ymd(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

export default function PortalActivityPage() {
    const [rows, setRows] = useState<ActivityRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actorQuery, setActorQuery] = useState('');
    const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set(PORTAL_ENTITY_TYPES));

    // Default last 7 days
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        return ymd(d);
    });
    const [endDate, setEndDate] = useState(() => ymd(new Date()));

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const params = new URLSearchParams();
                params.set('limit', '500');
                if (startDate) params.set('since', `${startDate}T00:00:00.000Z`);
                const r = await fetch(`/api/activity?${params.toString()}`, { cache: 'no-store' });
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                const j = (await r.json()) as ActivityRow[];
                if (cancelled) return;
                setRows(j);
            } catch (e) {
                if (!cancelled) setError(String(e));
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [startDate]);

    const filtered = useMemo(() => {
        const q = actorQuery.trim().toLowerCase();
        const endTs = endDate ? new Date(`${endDate}T23:59:59.999Z`).getTime() : Number.POSITIVE_INFINITY;
        return rows.filter((r) => {
            if (!selectedTypes.has(r.entity_type)) return false;
            const t = new Date(r.created_at).getTime();
            if (Number.isFinite(endTs) && t > endTs) return false;
            if (q) {
                const hay = `${r.actor ?? ''} ${r.description ?? ''} ${r.entity_id}`.toLowerCase();
                if (!hay.includes(q)) return false;
            }
            return true;
        });
    }, [rows, actorQuery, endDate, selectedTypes]);

    function toggleType(t: string) {
        setSelectedTypes((prev) => {
            const next = new Set(prev);
            if (next.has(t)) next.delete(t);
            else next.add(t);
            return next;
        });
    }

    function selectAll() {
        setSelectedTypes(new Set(PORTAL_ENTITY_TYPES));
    }

    function selectNone() {
        setSelectedTypes(new Set());
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
            <div className="mb-8">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#b8956a] mb-1">Crew Portal</p>
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white mb-1">Crew Activity Feed</h1>
                <p className="text-sm text-white/50">
                    Photos, daily updates, time entries, logins and messages from the field.
                </p>
            </div>

            {/* Controls */}
            <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-4 mb-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35 mb-2 flex items-center gap-1.5">
                            <Calendar size={11} /> From
                        </p>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#b8956a]/50"
                        />
                    </div>
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35 mb-2 flex items-center gap-1.5">
                            <Calendar size={11} /> To
                        </p>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#b8956a]/50"
                        />
                    </div>
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35 mb-2 flex items-center gap-1.5">
                            <Search size={11} /> Filter actor or text
                        </p>
                        <input
                            type="text"
                            value={actorQuery}
                            onChange={(e) => setActorQuery(e.target.value)}
                            placeholder="Name, ID, description..."
                            className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#b8956a]/50"
                        />
                    </div>
                </div>

                <div>
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35 flex items-center gap-1.5">
                            <Filter size={11} /> Entity types
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={selectAll}
                                className="text-[11px] font-semibold text-white/40 hover:text-white/70 transition-colors"
                            >
                                All
                            </button>
                            <span className="text-white/15">·</span>
                            <button
                                onClick={selectNone}
                                className="text-[11px] font-semibold text-white/40 hover:text-white/70 transition-colors"
                            >
                                None
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        {PORTAL_ENTITY_TYPES.map((t) => {
                            const on = selectedTypes.has(t);
                            const color = entityColor(t);
                            return (
                                <button
                                    key={t}
                                    onClick={() => toggleType(t)}
                                    className={`px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors border ${
                                        on
                                            ? 'border-transparent'
                                            : 'border-white/10 text-white/40 hover:text-white/70 hover:bg-white/5'
                                    }`}
                                    style={on ? { background: `${color}18`, color, borderColor: `${color}40` } : undefined}
                                >
                                    {entityLabel(t)}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 rounded-2xl border border-red-500/20 bg-red-500/5 text-sm text-red-300">
                    Failed to load activity: {error}
                </div>
            )}

            <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl overflow-hidden">
                {loading ? (
                    <div className="p-6 space-y-3">
                        {[0, 1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex gap-3 animate-pulse">
                                <div className="w-9 h-9 rounded-xl bg-white/5" />
                                <div className="flex-1 space-y-1.5">
                                    <div className="h-3 w-2/3 bg-white/5 rounded" />
                                    <div className="h-2 w-1/3 bg-white/5 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="px-6 py-16 text-center">
                        <ActivityIcon size={32} className="mx-auto text-white/15 mb-3" />
                        <p className="text-sm text-white/50 mb-1">No portal activity in this range.</p>
                        <p className="text-xs text-white/30">
                            Adjust the date range or entity types to see more.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/4">
                        {filtered.map((item) => {
                            const Icon = entityIcon(item.entity_type);
                            const color = entityColor(item.entity_type);
                            return (
                                <div
                                    key={item.id}
                                    className="flex items-center gap-4 px-6 py-4 hover:bg-white/3 transition-colors"
                                >
                                    <div
                                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                                        style={{ background: `${color}15` }}
                                    >
                                        <Icon size={15} style={{ color }} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-white/85 truncate">
                                            {item.description || `${item.action} on ${entityLabel(item.entity_type)}`}
                                        </p>
                                        <p className="text-[11px] text-white/30 font-mono mt-0.5">
                                            <span className="text-white/40">{entityLabel(item.entity_type)}</span>
                                            {' · '}
                                            <span>{item.actor ?? 'system'}</span>
                                            {' · '}
                                            <span className="font-sans">{item.entity_id}</span>
                                        </p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <span
                                            className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full"
                                            style={{ background: `${color}15`, color }}
                                        >
                                            {item.action}
                                        </span>
                                        <p className="text-[11px] text-white/25 mt-1">{timeAgo(item.created_at)}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

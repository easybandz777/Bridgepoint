'use client';

import { useEffect, useMemo, useState } from 'react';
import { KeyRound, Search, Database, RefreshCw, Users } from 'lucide-react';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { PortalAccountRow, type PortalAccount } from '@/components/admin/portal-account-row';

type FilterMode = 'all' | 'active' | 'disabled' | 'never';

export default function PortalAccountsPage() {
    const [accounts, setAccounts] = useState<PortalAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [query, setQuery] = useState('');
    const [filter, setFilter] = useState<FilterMode>('all');
    const [confirmSeed, setConfirmSeed] = useState(false);
    const [seeding, setSeeding] = useState(false);
    const [seedMsg, setSeedMsg] = useState<string | null>(null);

    async function load() {
        setLoading(true);
        setError(null);
        try {
            const r = await fetch('/api/admin/portal/credentials', { cache: 'no-store' });
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            const j = (await r.json()) as PortalAccount[];
            setAccounts(Array.isArray(j) ? j : []);
        } catch (e) {
            setError(String(e));
        }
        setLoading(false);
    }

    useEffect(() => {
        load();
    }, []);

    async function runSeed() {
        setSeeding(true);
        setSeedMsg(null);
        try {
            const r = await fetch('/api/portal/seed', { method: 'POST' });
            const j = await r.json();
            if (r.ok) {
                setSeedMsg(`Seeded ${j.created ?? 0} accounts (${j.skipped ?? 0} skipped, ${j.errors?.length ?? 0} errors).`);
                await load();
            } else {
                setSeedMsg(`Seed error: ${j.error ?? r.status}`);
            }
        } catch (e) {
            setSeedMsg(`Seed error: ${String(e)}`);
        }
        setSeeding(false);
    }

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return accounts.filter((a) => {
            if (q) {
                const hay = `${a.displayName} ${a.email} ${a.role}`.toLowerCase();
                if (!hay.includes(q)) return false;
            }
            switch (filter) {
                case 'active': return a.enabled;
                case 'disabled': return !a.enabled;
                case 'never': return a.lastLoginAt == null;
                default: return true;
            }
        });
    }, [accounts, query, filter]);

    const counts = useMemo(() => {
        return {
            all: accounts.length,
            active: accounts.filter((a) => a.enabled).length,
            disabled: accounts.filter((a) => !a.enabled).length,
            never: accounts.filter((a) => a.lastLoginAt == null).length,
        };
    }, [accounts]);

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#b8956a] mb-1">Crew Portal</p>
                    <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white mb-1">Portal Accounts</h1>
                    <p className="text-sm text-white/50">
                        {accounts.length} credential{accounts.length === 1 ? '' : 's'} across employees and subcontractors.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {seedMsg && <span className="text-[11px] text-white/50">{seedMsg}</span>}
                    <button
                        onClick={() => load()}
                        disabled={loading}
                        title="Refresh"
                        className="h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={() => setConfirmSeed(true)}
                        disabled={seeding}
                        className="h-10 px-4 rounded-xl bg-[#b8956a] text-black text-sm font-semibold hover:bg-[#cbb08c] transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        <Database size={14} />
                        {seeding ? 'Seeding…' : 'Run seed'}
                    </button>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col lg:flex-row justify-between gap-4 mb-6">
                <div className="relative flex-1 lg:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search names, emails, roles..."
                        className="w-full h-10 pl-10 pr-4 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#b8956a]/50 transition-all"
                    />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    {[
                        { key: 'all' as const, label: 'All', count: counts.all },
                        { key: 'active' as const, label: 'Active', count: counts.active },
                        { key: 'disabled' as const, label: 'Disabled', count: counts.disabled },
                        { key: 'never' as const, label: 'Never Logged In', count: counts.never },
                    ].map(({ key, label, count }) => (
                        <button
                            key={key}
                            onClick={() => setFilter(key)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-2 ${
                                filter === key ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                            }`}
                        >
                            {label}
                            <span className="text-[10px] text-white/40">{count}</span>
                        </button>
                    ))}
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 rounded-2xl border border-red-500/20 bg-red-500/5 text-sm text-red-300">
                    Failed to load accounts: {error}
                </div>
            )}

            <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl overflow-hidden">
                {/* Header row (md+) */}
                <div className="hidden md:grid grid-cols-12 items-center gap-3 px-6 py-3 border-b border-white/6 bg-white/[0.02] text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
                    <div className="col-span-4">Name</div>
                    <div className="col-span-2">Type</div>
                    <div className="col-span-3">Role / Trade</div>
                    <div className="col-span-2">Last Login</div>
                    <div className="col-span-1 text-right">Status</div>
                </div>

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
                        <KeyRound size={32} className="mx-auto text-white/15 mb-3" />
                        <p className="text-sm text-white/55 mb-1">
                            {accounts.length === 0 ? 'No portal accounts yet.' : 'No accounts match your filters.'}
                        </p>
                        <p className="text-xs text-white/30">
                            {accounts.length === 0
                                ? 'Click Run seed to create accounts for every employee and sub with an email.'
                                : 'Try clearing filters or searching another term.'}
                        </p>
                    </div>
                ) : (
                    filtered.map((a) => <PortalAccountRow key={a.credentialId} account={a} />)
                )}
            </div>

            {/* Stats footer */}
            {!loading && accounts.length > 0 && (
                <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <SmallStat label="Total" value={counts.all} icon={Users} color="#b8956a" />
                    <SmallStat label="Active" value={counts.active} icon={KeyRound} color="#34d399" />
                    <SmallStat label="Disabled" value={counts.disabled} icon={KeyRound} color="#94a3b8" />
                    <SmallStat label="Never logged in" value={counts.never} icon={KeyRound} color="#fbbf24" />
                </div>
            )}

            <ConfirmDialog
                isOpen={confirmSeed}
                onClose={() => setConfirmSeed(false)}
                onConfirm={runSeed}
                title="Seed portal credentials?"
                message="This creates portal accounts for every employee and subcontractor that has an email. Existing credentials are not overwritten."
                confirmText="Run seed"
            />
        </div>
    );
}

function SmallStat({
    label,
    value,
    icon: Icon,
    color,
}: {
    label: string;
    value: number;
    icon: typeof KeyRound;
    color: string;
}) {
    return (
        <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-4 flex items-center gap-3">
            <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${color}15` }}
            >
                <Icon size={15} style={{ color }} />
            </div>
            <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">{label}</p>
                <p className="text-lg font-bold text-white">{value}</p>
            </div>
        </div>
    );
}

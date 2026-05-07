'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, Loader2, Hammer } from 'lucide-react';
import { useT } from '@/lib/portal-i18n';
import { usePortalUser } from '@/lib/portal-context';
import { portalFetch } from '@/lib/portal-client';
import { JobCard, type PortalJobCardData } from '@/components/portal/job-card';

type JobFilter = 'all' | 'active' | 'upcoming' | 'completed';

function todayISO(): string {
    return new Date().toISOString().slice(0, 10);
}

function jobMatchesFilter(j: PortalJobCardData, filter: JobFilter): boolean {
    if (filter === 'all') return true;
    const today = todayISO();
    const status = (j.status || '').toLowerCase();
    if (filter === 'active') {
        return status === 'active' || status === 'in progress';
    }
    if (filter === 'upcoming') {
        if (status === 'planning' || status === 'scheduled') return true;
        if (j.startDate && j.startDate > today) return true;
        return false;
    }
    if (filter === 'completed') {
        return status === 'completed' || status === 'closed';
    }
    return true;
}

export default function PortalJobsPage() {
    const t = useT();
    const { user } = usePortalUser();
    const [jobs, setJobs] = useState<PortalJobCardData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<JobFilter>('all');
    const [query, setQuery] = useState('');

    useEffect(() => {
        let alive = true;
        async function load() {
            setLoading(true);
            setError(null);
            try {
                const list = await portalFetch<PortalJobCardData[]>('/api/portal/jobs');
                if (alive) setJobs(list);
            } catch (e) {
                if (alive) setError(e instanceof Error ? e.message : String(e));
            } finally {
                if (alive) setLoading(false);
            }
        }
        load();
        return () => { alive = false; };
    }, []);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return jobs.filter(j => {
            if (!jobMatchesFilter(j, filter)) return false;
            if (!q) return true;
            return (
                j.name.toLowerCase().includes(q) ||
                j.projectNumber.toLowerCase().includes(q) ||
                j.clientName.toLowerCase().includes(q)
            );
        });
    }, [jobs, filter, query]);

    function countLabel(n: number): string {
        if (n === 0) return t('jobsList.countNone');
        if (n === 1) return t('jobsList.countOne');
        return t('jobsList.count', { count: n });
    }

    const filters: { id: JobFilter; label: string }[] = [
        { id: 'all', label: t('jobsList.filterAll') },
        { id: 'active', label: t('jobsList.filterActive') },
        { id: 'upcoming', label: t('jobsList.filterUpcoming') },
        { id: 'completed', label: t('jobsList.filterCompleted') },
    ];

    return (
        <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-tight mb-1">
                        {t('jobsList.title')}
                    </h1>
                    <p className="text-sm text-white/45">{countLabel(filtered.length)}</p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
                <div className="relative w-full sm:max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" size={14} />
                    <input
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder={t('jobsList.search')}
                        className="w-full h-10 pl-9 pr-4 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#b8956a]/50 focus:bg-white/10 transition-all"
                    />
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 hide-scrollbar">
                    {filters.map(f => {
                        const active = filter === f.id;
                        return (
                            <button
                                key={f.id}
                                type="button"
                                onClick={() => setFilter(f.id)}
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border ${
                                    active
                                        ? 'bg-[#b8956a]/15 text-[#b8956a] border-[#b8956a]/30'
                                        : 'bg-transparent text-white/45 hover:text-white/80 hover:bg-white/5 border-transparent'
                                }`}
                            >
                                {f.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {loading && (
                <div className="py-16 flex items-center justify-center text-white/45 gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    <span className="text-sm">{t('common.loading')}</span>
                </div>
            )}

            {error && !loading && (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5 text-sm text-red-300">
                    {t('jobsList.errorLoading')}
                    <p className="mt-2 text-xs text-red-300/70">{error}</p>
                </div>
            )}

            {!loading && !error && jobs.length === 0 && (
                <div className="py-16 px-6 text-center border border-white/10 border-dashed rounded-2xl bg-white/[0.02] flex flex-col items-center gap-3">
                    <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center"
                        style={{ background: 'rgba(184,149,106,0.10)' }}
                    >
                        <Hammer size={20} style={{ color: '#b8956a' }} />
                    </div>
                    <p className="text-sm text-white/55">{t('jobsList.empty')}</p>
                </div>
            )}

            {!loading && !error && jobs.length > 0 && filtered.length === 0 && (
                <div className="py-12 px-6 text-center border border-white/10 border-dashed rounded-2xl bg-white/[0.02]">
                    <p className="text-sm text-white/45">{t('common.empty')}</p>
                </div>
            )}

            {!loading && !error && filtered.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                    {filtered.map(job => (
                        <JobCard key={job.id} job={job} userType={user.userType} />
                    ))}
                </div>
            )}
        </div>
    );
}

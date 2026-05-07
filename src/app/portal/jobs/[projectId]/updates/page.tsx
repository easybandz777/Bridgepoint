'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { useT } from '@/lib/portal-i18n';
import { portalFetch } from '@/lib/portal-client';
import { UpdateForm } from '@/components/portal/update-form';
import { UpdatesTimeline } from '@/components/portal/updates-timeline';
import type { PortalUpdate } from '@/components/portal/update-card';
import { cn } from '@/lib/utils';

type FilterValue = 'all' | 'note' | 'progress' | 'issue' | 'completion';

interface FilterOption {
    value: FilterValue;
    labelKey: string;
}

const FILTERS: FilterOption[] = [
    { value: 'all', labelKey: 'updates.filterAll' },
    { value: 'note', labelKey: 'updates.filterNotes' },
    { value: 'progress', labelKey: 'updates.filterProgress' },
    { value: 'issue', labelKey: 'updates.filterIssues' },
    { value: 'completion', labelKey: 'updates.filterCompletion' },
];

interface JobMetaResponse {
    isLead?: boolean;
    [k: string]: unknown;
}

export default function JobUpdatesPage() {
    const params = useParams<{ projectId: string }>();
    const projectId = params.projectId;
    const t = useT();

    const [updates, setUpdates] = useState<PortalUpdate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<FilterValue>('all');
    const [canModerate, setCanModerate] = useState(false);

    const fetchUpdates = useCallback(async () => {
        if (!projectId) return;
        setLoading(true);
        setError(null);
        try {
            const data = await portalFetch<PortalUpdate[]>(
                `/api/portal/jobs/${projectId}/updates`,
            );
            setUpdates(Array.isArray(data) ? data : []);
        } catch (e) {
            setError(e instanceof Error ? e.message : t('updates.errorLoading'));
        } finally {
            setLoading(false);
        }
    }, [projectId, t]);

    useEffect(() => {
        fetchUpdates();
    }, [fetchUpdates]);

    useEffect(() => {
        if (!projectId) return;
        let cancelled = false;
        (async () => {
            try {
                const meta = await portalFetch<JobMetaResponse>(
                    `/api/portal/jobs/${projectId}`,
                );
                if (!cancelled) setCanModerate(Boolean(meta?.isLead));
            } catch {
                if (!cancelled) setCanModerate(false);
            }
        })();
        return () => { cancelled = true; };
    }, [projectId]);

    const filtered = useMemo(() => {
        if (filter === 'all') return updates;
        return updates.filter((u) => u.kind === filter);
    }, [filter, updates]);

    const handlePosted = useCallback((created: unknown) => {
        if (!created || typeof created !== 'object') return;
        setUpdates((prev) => [created as PortalUpdate, ...prev]);
    }, []);

    const handleDeleted = useCallback((id: string) => {
        setUpdates((prev) => prev.filter((u) => u.id !== id));
    }, []);

    return (
        <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-3xl mx-auto">
            <h1 className="font-serif text-xl sm:text-2xl text-white mb-1">
                {t('updates.title')}
            </h1>
            <p className="text-xs text-white/40 mb-6">
                {t('updates.composeHeading')}
            </p>

            <UpdateForm projectId={projectId} onPosted={handlePosted} />

            <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-4 hide-scrollbar">
                {FILTERS.map((f) => {
                    const active = filter === f.value;
                    return (
                        <button
                            key={f.value}
                            type="button"
                            onClick={() => setFilter(f.value)}
                            className={cn(
                                'px-3 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors border whitespace-nowrap',
                                active
                                    ? 'bg-[#b8956a]/15 border-[#b8956a]/40 text-[#b8956a]'
                                    : 'bg-white/5 border-white/10 text-white/50 hover:text-white/80 hover:bg-white/8',
                            )}
                        >
                            {t(f.labelKey)}
                        </button>
                    );
                })}
            </div>

            <UpdatesTimeline
                updates={filtered}
                canModerate={canModerate}
                loading={loading}
                error={error}
                onDeleted={handleDeleted}
            />
        </div>
    );
}

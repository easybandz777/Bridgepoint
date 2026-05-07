'use client';

import { useMemo } from 'react';
import { MessageSquare } from 'lucide-react';
import { useT } from '@/lib/portal-i18n';
import { UpdateCard, type PortalUpdate } from './update-card';

interface UpdatesTimelineProps {
    updates: PortalUpdate[];
    canModerate: boolean;
    loading?: boolean;
    error?: string | null;
    onDeleted?: (id: string) => void;
}

interface DayGroup {
    key: string;
    label: string;
    items: PortalUpdate[];
}

function dayKey(iso: string): string {
    try {
        const d = new Date(iso);
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    } catch {
        return '';
    }
}

function isSameDay(a: Date, b: Date): boolean {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

function dayLabel(iso: string, t: (k: string) => string): string {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    try {
        const d = new Date(iso);
        if (isSameDay(d, now)) return t('updates.dateToday');
        if (isSameDay(d, yesterday)) return t('updates.dateYesterday');
        const sameYear = d.getFullYear() === now.getFullYear();
        return d.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: sameYear ? undefined : 'numeric',
        });
    } catch {
        return '';
    }
}

export function UpdatesTimeline({
    updates,
    canModerate,
    loading,
    error,
    onDeleted,
}: UpdatesTimelineProps) {
    const t = useT();

    const grouped = useMemo<DayGroup[]>(() => {
        const groups: DayGroup[] = [];
        const map = new Map<string, DayGroup>();
        for (const u of updates) {
            const key = dayKey(u.createdAt);
            let g = map.get(key);
            if (!g) {
                g = { key, label: dayLabel(u.createdAt, t), items: [] };
                map.set(key, g);
                groups.push(g);
            }
            g.items.push(u);
        }
        return groups;
    }, [updates, t]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-6 h-6 rounded-full border-2 border-[#b8956a]/30 border-t-[#b8956a] animate-spin mb-4" />
                <p className="text-sm text-white/40">{t('updates.loading')}</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="text-sm text-red-400">{error}</p>
            </div>
        );
    }

    if (updates.length === 0) {
        return (
            <div
                className="rounded-2xl border border-dashed border-white/10 p-10 text-center"
                style={{ background: '#1a1a1a' }}
            >
                <div
                    className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                    style={{ background: 'rgba(184,149,106,0.12)' }}
                >
                    <MessageSquare size={20} className="text-[#b8956a]" />
                </div>
                <p className="text-sm text-white/50">{t('updates.empty')}</p>
            </div>
        );
    }

    return (
        <div className="relative">
            <div
                aria-hidden
                className="absolute left-[19px] top-0 bottom-0 w-px bg-white/8 pointer-events-none"
            />
            <div className="space-y-6">
                {grouped.map((group) => (
                    <section key={group.key} className="relative">
                        <div className="relative flex items-center gap-3 mb-3 pl-12">
                            <div className="absolute left-0 flex items-center justify-center w-10">
                                <span
                                    className="w-2.5 h-2.5 rounded-full ring-4 ring-[#0f0f0f]"
                                    style={{ background: '#b8956a' }}
                                />
                            </div>
                            <h3 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">
                                {group.label}
                            </h3>
                        </div>

                        <div className="space-y-3 pl-12">
                            {group.items.map((u) => (
                                <UpdateCard
                                    key={u.id}
                                    update={u}
                                    canModerate={canModerate}
                                    onDeleted={onDeleted}
                                />
                            ))}
                        </div>
                    </section>
                ))}
            </div>
        </div>
    );
}

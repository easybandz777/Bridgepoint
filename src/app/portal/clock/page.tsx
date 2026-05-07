'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Calendar, FileText } from 'lucide-react';
import { useT } from '@/lib/portal-i18n';
import { usePortalUser } from '@/lib/portal-context';
import { portalFetch, fmtHours, fmtShortDate } from '@/lib/portal-client';
import { ClockWidget } from '@/components/portal/clock-widget';
import type { ProjectOption } from '@/components/portal/manual-entry-dialog';
import type { TimesheetEntry } from '@/components/portal/time-entry-row';

interface PortalJob {
    id: string;
    projectNumber: string;
    name: string;
    status: string;
    myPhases: { id: string; name: string; status: string; completionPct: number }[];
}

interface TimesheetsResponse {
    start: string;
    end: string;
    entries: TimesheetEntry[];
}

export default function ClockPage() {
    const t = useT();
    const { user } = usePortalUser();
    const isEmployee = user.userType === 'employee';

    const [projects, setProjects] = useState<ProjectOption[]>([]);
    const [lastShift, setLastShift] = useState<TimesheetEntry | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        if (!isEmployee) return;
        let alive = true;
        (async () => {
            try {
                const jobs = await portalFetch<PortalJob[]>('/api/portal/jobs');
                const opts: ProjectOption[] = jobs.map(j => ({
                    id: j.id,
                    name: j.name,
                    projectNumber: j.projectNumber,
                    phases: j.myPhases.map(ph => ({ id: ph.id, name: ph.name })),
                }));
                if (alive) setProjects(opts);
            } catch {
                if (alive) setProjects([]);
            }
        })();
        return () => { alive = false; };
    }, [isEmployee]);

    useEffect(() => {
        if (!isEmployee) return;
        let alive = true;
        (async () => {
            try {
                const today = new Date();
                const past = new Date();
                past.setDate(today.getDate() - 14);
                const start = past.toISOString().slice(0, 10);
                const end = today.toISOString().slice(0, 10);
                const r = await portalFetch<TimesheetsResponse>(
                    `/api/portal/timesheets?start=${start}&end=${end}`,
                );
                const completed = r.entries
                    .filter(e => e.clockOut)
                    .sort((a, b) => (b.clockOut ?? '').localeCompare(a.clockOut ?? ''));
                if (alive) setLastShift(completed[0] ?? null);
            } catch {
                if (alive) setLastShift(null);
            }
        })();
        return () => { alive = false; };
    }, [isEmployee, refreshKey]);

    if (!isEmployee) {
        return (
            <div className="max-w-md mx-auto px-4 sm:px-6 py-8 sm:py-12">
                <div className="bg-[#1a1a1a] border border-white/6 rounded-3xl p-8 text-center">
                    <h1 className="font-serif text-2xl font-bold text-white mb-3">
                        {t('clock.title')}
                    </h1>
                    <p className="text-sm text-white/55">{t('clock.employeesOnly')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
            <div>
                <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white tracking-tight">
                    {t('clock.title')}
                </h1>
                <p className="text-sm text-white/45 mt-1">{t('clock.subtitle')}</p>
            </div>

            <ClockWidget projects={projects} onShiftEnd={() => setRefreshKey(k => k + 1)} />

            <div className="bg-[#1a1a1a] border border-white/6 rounded-3xl p-5">
                <h2 className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#b8956a] mb-3">
                    {t('clock.lastShift')}
                </h2>
                {lastShift ? (
                    <div className="space-y-1">
                        <div className="flex items-baseline justify-between gap-3">
                            <p className="font-serif text-xl font-semibold text-white tabular-nums">
                                {fmtHours(lastShift.hoursRegular + lastShift.hoursOvertime)}
                            </p>
                            <p className="text-xs text-white/45">{fmtShortDate(lastShift.date)}</p>
                        </div>
                        <p className="text-sm text-white/60 truncate">
                            {lastShift.projectName || t('clock.noProject')}
                            {lastShift.phaseName ? ` · ${lastShift.phaseName}` : ''}
                        </p>
                        <p className="text-[11px] uppercase tracking-[0.16em] mt-1" style={{
                            color: lastShift.status === 'Approved' ? '#34d399'
                                : lastShift.status === 'Rejected' ? '#f87171'
                                : '#facc15',
                        }}>
                            {lastShift.status === 'Approved' ? t('timesheets.statusApproved')
                                : lastShift.status === 'Rejected' ? t('timesheets.statusRejected')
                                : t('timesheets.statusPending')}
                        </p>
                    </div>
                ) : (
                    <p className="text-xs text-white/35 italic py-2">{t('clock.noLastShift')}</p>
                )}
            </div>

            <div className="bg-[#1a1a1a] border border-white/6 rounded-3xl p-5">
                <h2 className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#b8956a] mb-3">
                    {t('clock.quickLinks')}
                </h2>
                <div className="space-y-2">
                    <Link
                        href="/portal/timesheets"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/4 border border-white/8 hover:border-white/15 transition-colors min-h-[48px]"
                    >
                        <FileText size={16} className="text-[#b8956a]" />
                        <span className="text-sm font-medium text-white">{t('timesheets.title')}</span>
                    </Link>
                    <Link
                        href="/portal/jobs"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/4 border border-white/8 hover:border-white/15 transition-colors min-h-[48px]"
                    >
                        <Calendar size={16} className="text-[#b8956a]" />
                        <span className="text-sm font-medium text-white">{t('jobsList.title')}</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}

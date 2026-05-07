'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { useT } from '@/lib/portal-i18n';
import { usePortalUser } from '@/lib/portal-context';
import { portalFetch, fmtHours, fmtMoneyCents } from '@/lib/portal-client';
import { mondayOf, addDays, computeWeekTotal } from '@/lib/employees';
import { WeekNavigator } from '@/components/portal/week-navigator';
import { TimesheetGrid } from '@/components/portal/timesheet-grid';
import { ManualEntryDialog, type ProjectOption } from '@/components/portal/manual-entry-dialog';
import type { TimesheetEntry } from '@/components/portal/time-entry-row';

interface PortalJob {
    id: string;
    projectNumber: string;
    name: string;
    status: string;
    myPhases: { id: string; name: string }[];
}

interface TimesheetsResponse {
    start: string;
    end: string;
    entries: TimesheetEntry[];
}

export default function TimesheetsPage() {
    const t = useT();
    const { user, employee } = usePortalUser();
    const isEmployee = user.userType === 'employee';

    const [monday, setMonday] = useState<string>(() => mondayOf(new Date()));
    const [entries, setEntries] = useState<TimesheetEntry[]>([]);
    const [projects, setProjects] = useState<ProjectOption[]>([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editEntry, setEditEntry] = useState<TimesheetEntry | null>(null);
    const [dialogDate, setDialogDate] = useState<string | undefined>(undefined);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    const hourly = useMemo(() => {
        if (!employee) return 0;
        return Number(employee.hourly_rate ?? 0);
    }, [employee]);
    const otRate = useMemo(() => {
        if (!employee) return null;
        return employee.overtime_rate != null ? Number(employee.overtime_rate) : null;
    }, [employee]);

    const refreshEntries = useCallback(async () => {
        if (!isEmployee) return;
        try {
            const start = monday;
            const end = addDays(monday, 6);
            const r = await portalFetch<TimesheetsResponse>(
                `/api/portal/timesheets?start=${start}&end=${end}`,
            );
            setEntries(r.entries);
        } catch (e) {
            setErr(String(e));
        }
    }, [isEmployee, monday]);

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
                    phases: (j.myPhases ?? []).map(ph => ({ id: ph.id, name: ph.name })),
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
            setLoading(true);
            setErr(null);
            try {
                const start = monday;
                const end = addDays(monday, 6);
                const r = await portalFetch<TimesheetsResponse>(
                    `/api/portal/timesheets?start=${start}&end=${end}`,
                );
                if (alive) setEntries(r.entries);
            } catch (e) {
                if (alive) setErr(String(e));
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => { alive = false; };
    }, [isEmployee, monday]);

    const totals = useMemo(
        () => computeWeekTotal(entries, hourly, otRate),
        [entries, hourly, otRate],
    );

    function openAdd(date?: string) {
        setEditEntry(null);
        setDialogDate(date);
        setDialogOpen(true);
    }

    function openEdit(entry: TimesheetEntry) {
        setEditEntry(entry);
        setDialogDate(undefined);
        setDialogOpen(true);
    }

    if (!isEmployee) {
        return (
            <div className="max-w-md mx-auto px-4 sm:px-6 py-8 sm:py-12">
                <div className="bg-[#1a1a1a] border border-white/6 rounded-3xl p-8 text-center">
                    <h1 className="font-serif text-2xl font-bold text-white mb-3">
                        {t('timesheets.title')}
                    </h1>
                    <p className="text-sm text-white/55">{t('clock.employeesOnly')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
            <div className="flex items-end justify-between gap-4">
                <div>
                    <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white tracking-tight">
                        {t('timesheets.title')}
                    </h1>
                    <p className="text-sm text-white/45 mt-1">{t('timesheets.subtitle')}</p>
                </div>
                <button
                    type="button"
                    onClick={() => openAdd()}
                    className="h-12 px-4 sm:px-5 rounded-xl flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-[#0f0f0f] shrink-0"
                    style={{ background: 'linear-gradient(135deg, #d4ad7e 0%, #b8956a 60%, #9a7a54 100%)' }}
                >
                    <Plus size={16} />
                    <span className="hidden sm:inline">{t('timesheets.addEntry')}</span>
                    <span className="sm:hidden">{t('common.add')}</span>
                </button>
            </div>

            <div className="bg-[#1a1a1a] border border-white/6 rounded-3xl p-4 sm:p-5">
                <WeekNavigator monday={monday} onChange={setMonday} />
            </div>

            <div className="bg-[#1a1a1a] border border-white/6 rounded-3xl p-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                        <p className="text-[10px] uppercase tracking-[0.18em] text-white/40 mb-1">
                            {t('timesheets.regular')}
                        </p>
                        <p className="font-serif text-2xl font-semibold text-white tabular-nums">
                            {fmtHours(totals.regular)}
                        </p>
                    </div>
                    <div>
                        <p className="text-[10px] uppercase tracking-[0.18em] text-white/40 mb-1">
                            {t('timesheets.overtime')}
                        </p>
                        <p className="font-serif text-2xl font-semibold text-white tabular-nums">
                            {fmtHours(totals.overtime)}
                        </p>
                    </div>
                    <div>
                        <p className="text-[10px] uppercase tracking-[0.18em] text-white/40 mb-1">
                            {t('timesheets.total')}
                        </p>
                        <p className="font-serif text-2xl font-semibold text-[#b8956a] tabular-nums">
                            {fmtHours(totals.total)}
                        </p>
                    </div>
                    <div>
                        <p className="text-[10px] uppercase tracking-[0.18em] text-white/40 mb-1">
                            {t('timesheets.gross')}
                        </p>
                        <p className="font-serif text-2xl font-semibold text-white tabular-nums">
                            {fmtMoneyCents(totals.gross)}
                        </p>
                    </div>
                </div>
            </div>

            {err && (
                <div className="px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-sm text-red-400">
                    {err}
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="w-5 h-5 rounded-full border-2 border-[#b8956a]/30 border-t-[#b8956a] animate-spin" />
                </div>
            ) : entries.length === 0 ? (
                <div className="bg-[#1a1a1a] border border-white/6 rounded-3xl p-10 text-center">
                    <p className="text-sm text-white/45">{t('timesheets.empty')}</p>
                </div>
            ) : null}

            {!loading && (
                <TimesheetGrid
                    monday={monday}
                    entries={entries}
                    onEdit={openEdit}
                    onAddForDate={openAdd}
                />
            )}

            <ManualEntryDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onSaved={() => refreshEntries()}
                initialDate={dialogDate}
                entry={editEntry}
                projects={projects}
            />
        </div>
    );
}

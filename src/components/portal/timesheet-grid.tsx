'use client';

import { useMemo } from 'react';
import { useT } from '@/lib/portal-i18n';
import { addDays, dayLabel, shortDate } from '@/lib/employees';
import { TimeEntryRow, type TimesheetEntry } from './time-entry-row';

interface TimesheetGridProps {
    monday: string;
    entries: TimesheetEntry[];
    onEdit?: (entry: TimesheetEntry) => void;
    onAddForDate?: (date: string) => void;
}

export function TimesheetGrid({ monday, entries, onEdit, onAddForDate }: TimesheetGridProps) {
    const t = useT();

    const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(monday, i)), [monday]);

    const byDate = useMemo(() => {
        const m = new Map<string, TimesheetEntry[]>();
        for (const e of entries) {
            const arr = m.get(e.date) ?? [];
            arr.push(e);
            m.set(e.date, arr);
        }
        return m;
    }, [entries]);

    const today = new Date().toISOString().slice(0, 10);

    return (
        <div className="space-y-3">
            {days.map(d => {
                const dayEntries = byDate.get(d) ?? [];
                const isToday = d === today;
                return (
                    <div
                        key={d}
                        className="bg-[#1a1a1a] border rounded-2xl overflow-hidden"
                        style={{ borderColor: isToday ? 'rgba(184,149,106,0.3)' : 'rgba(255,255,255,0.06)' }}
                    >
                        <div className="px-4 sm:px-5 py-3 flex items-center justify-between border-b border-white/6">
                            <div className="flex items-baseline gap-3">
                                <p
                                    className="text-[11px] font-semibold uppercase tracking-[0.18em]"
                                    style={{ color: isToday ? '#b8956a' : 'rgba(255,255,255,0.45)' }}
                                >
                                    {dayLabel(d)}
                                </p>
                                <p className="font-serif text-base font-semibold text-white tabular-nums">
                                    {shortDate(d)}
                                </p>
                                {isToday && (
                                    <span className="text-[10px] uppercase tracking-[0.16em] text-[#b8956a]">
                                        · {t('common.today')}
                                    </span>
                                )}
                            </div>
                            {onAddForDate && (
                                <button
                                    type="button"
                                    onClick={() => onAddForDate(d)}
                                    className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#b8956a] hover:text-[#d4ad7e]"
                                >
                                    {t('common.add')}
                                </button>
                            )}
                        </div>

                        <div className="p-3 sm:p-4 space-y-2">
                            {dayEntries.length === 0 ? (
                                <p className="text-xs text-white/30 italic px-1 py-2">
                                    {t('timesheets.dayEmpty')}
                                </p>
                            ) : (
                                dayEntries.map(e => (
                                    <TimeEntryRow key={e.id} entry={e} onEdit={onEdit} />
                                ))
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useT } from '@/lib/portal-i18n';
import { addDays, mondayOf, shortDate } from '@/lib/employees';

interface WeekNavigatorProps {
    monday: string;
    onChange: (newMonday: string) => void;
}

export function WeekNavigator({ monday, onChange }: WeekNavigatorProps) {
    const t = useT();
    const sunday = addDays(monday, 6);
    const todayMonday = mondayOf(new Date());

    const sundayDate = new Date(sunday + 'T00:00:00');
    const year = sundayDate.getFullYear();
    const label = `${shortDate(monday)} - ${shortDate(sunday)}, ${year}`;

    function prev() { onChange(addDays(monday, -7)); }
    function next() { onChange(addDays(monday, 7)); }
    function today() { onChange(todayMonday); }

    const isCurrentWeek = monday === todayMonday;

    return (
        <div className="flex items-center justify-between gap-2 sm:gap-3">
            <button
                type="button"
                onClick={prev}
                aria-label={t('common.previous')}
                className="w-12 h-12 flex items-center justify-center rounded-xl bg-white/5 border border-white/8 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
                <ChevronLeft size={18} />
            </button>

            <div className="flex-1 text-center">
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-1">
                    {t('timesheets.weekStarting', { date: shortDate(monday) })}
                </p>
                <p className="font-serif text-lg sm:text-xl font-semibold text-white tabular-nums">
                    {label}
                </p>
            </div>

            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={today}
                    disabled={isCurrentWeek}
                    className="hidden sm:inline-flex h-12 px-4 items-center justify-center rounded-xl bg-[#b8956a]/10 border border-[#b8956a]/20 text-[#b8956a] text-xs uppercase tracking-[0.18em] font-semibold hover:bg-[#b8956a]/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                    {t('common.today')}
                </button>
                <button
                    type="button"
                    onClick={next}
                    aria-label={t('common.next')}
                    className="w-12 h-12 flex items-center justify-center rounded-xl bg-white/5 border border-white/8 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                >
                    <ChevronRight size={18} />
                </button>
            </div>
        </div>
    );
}

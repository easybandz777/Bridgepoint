'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
    Hammer,
    Clock,
    ClipboardList,
    MessageCircle,
    Loader2,
    Activity as ActivityIcon,
} from 'lucide-react';
import { useT } from '@/lib/portal-i18n';
import { usePortalUser } from '@/lib/portal-context';
import { portalFetch, fmtHours } from '@/lib/portal-client';
import { WelcomeCard } from '@/components/portal/welcome-card';
import { DashboardStat } from '@/components/portal/dashboard-stat';
import { QuickActions } from '@/components/portal/quick-actions';
import { JobCard, type PortalJobCardData } from '@/components/portal/job-card';
import { RecentActivityFeed } from '@/components/portal/recent-activity-feed';

interface DashboardPayload {
    user: { displayName: string; role: string; userType: 'employee' | 'subcontractor' };
    stats: {
        activeJobs: number;
        hoursThisWeek?: number;
        hoursToday?: number;
        unreadMessages: number;
        openTasks: number;
    };
    onShift?: {
        entryId: string;
        clockIn: string;
        projectId: string | null;
        projectName: string | null;
    } | null;
    todayJobs: PortalJobCardData[];
    activeJobs: PortalJobCardData[];
    recentActivity: {
        id: string;
        entity_type: string;
        action: string;
        description: string;
        created_at: string;
    }[];
}

function formatClockTime(iso: string | null | undefined): string {
    if (!iso) return '—';
    try {
        const d = new Date(iso);
        return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    } catch {
        return '—';
    }
}

export default function PortalDashboardPage() {
    const t = useT();
    const { user } = usePortalUser();
    const [data, setData] = useState<DashboardPayload | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let alive = true;
        async function load() {
            setLoading(true);
            setError(null);
            try {
                const d = await portalFetch<DashboardPayload>('/api/portal/dashboard');
                if (alive) setData(d);
            } catch (e) {
                if (alive) setError(e instanceof Error ? e.message : String(e));
            } finally {
                if (alive) setLoading(false);
            }
        }
        load();
        return () => { alive = false; };
    }, []);

    const isEmployee = user.userType === 'employee';

    if (loading) {
        return (
            <div className="px-4 sm:px-6 py-10 max-w-7xl mx-auto flex items-center justify-center min-h-[40vh] text-white/45 gap-2">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-sm">{t('dashboard.loading')}</span>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="px-4 sm:px-6 py-10 max-w-7xl mx-auto">
                <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-sm text-red-300">
                    {t('dashboard.errorLoading')}
                    {error && <p className="mt-2 text-xs text-red-300/70">{error}</p>}
                </div>
            </div>
        );
    }

    return (
        <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl mx-auto space-y-6">
            <WelcomeCard
                name={data.user.displayName}
                role={data.user.role}
                userType={data.user.userType}
            />

            {data.onShift && (
                <div
                    className="rounded-2xl border p-4 sm:p-5 flex items-center justify-between gap-4"
                    style={{
                        borderColor: 'rgba(52,211,153,0.30)',
                        background: 'linear-gradient(135deg, rgba(52,211,153,0.08) 0%, rgba(20,30,25,0.6) 100%)',
                    }}
                >
                    <div className="flex items-center gap-3 min-w-0">
                        <span className="relative flex h-3 w-3 shrink-0">
                            <span className="absolute inline-flex h-full w-full rounded-full bg-[#34d399] opacity-60 animate-ping" />
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#34d399]" />
                        </span>
                        <div className="min-w-0">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#34d399] mb-0.5">
                                {t('dashboard.onShift')}
                            </p>
                            <p className="text-sm text-white/85 truncate">
                                {t('dashboard.clockedInAt', { time: formatClockTime(data.onShift.clockIn) })}
                                {data.onShift.projectName ? ` · ${data.onShift.projectName}` : ''}
                            </p>
                        </div>
                    </div>
                    <Link
                        href="/portal/clock"
                        className="shrink-0 h-10 px-4 rounded-full bg-[#34d399]/20 hover:bg-[#34d399]/30 text-[#34d399] border border-[#34d399]/40 text-xs font-semibold transition-colors flex items-center"
                    >
                        {t('dashboard.clockOut')}
                    </Link>
                </div>
            )}

            <div className={`grid gap-3 sm:gap-4 ${isEmployee ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-3'}`}>
                <DashboardStat
                    icon={Hammer}
                    label={t('dashboard.activeJobs')}
                    value={data.stats.activeJobs}
                    accent
                />
                {isEmployee && (
                    <DashboardStat
                        icon={Clock}
                        label={t('dashboard.hoursThisWeek')}
                        value={fmtHours(data.stats.hoursThisWeek ?? 0)}
                    />
                )}
                <DashboardStat
                    icon={ClipboardList}
                    label={t('dashboard.openTasks')}
                    value={data.stats.openTasks}
                />
                <DashboardStat
                    icon={MessageCircle}
                    label={t('dashboard.unreadMessages')}
                    value={data.stats.unreadMessages}
                />
            </div>

            <QuickActions userType={data.user.userType} onShift={!!data.onShift} />

            <section>
                <div className="flex items-center justify-between mb-3">
                    <h2 className="font-serif text-xl sm:text-2xl font-bold text-white tracking-tight">
                        {t('dashboard.todayHeading')}
                    </h2>
                </div>
                {data.todayJobs.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] py-8 px-5 text-sm text-white/40 text-center">
                        {t('dashboard.noJobsToday')}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                        {data.todayJobs.map(job => (
                            <JobCard key={job.id} job={job} userType={data.user.userType} />
                        ))}
                    </div>
                )}
            </section>

            <section>
                <div className="flex items-center justify-between mb-3">
                    <h2 className="font-serif text-xl sm:text-2xl font-bold text-white tracking-tight">
                        {t('dashboard.activeJobsHeading')}
                    </h2>
                    <Link
                        href="/portal/jobs"
                        className="text-xs font-semibold uppercase tracking-wider text-[#b8956a] hover:text-[#cbb08c] flex items-center gap-1"
                    >
                        {t('dashboard.viewAll')}
                    </Link>
                </div>
                {data.activeJobs.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] py-8 px-5 text-sm text-white/40 text-center flex items-center justify-center gap-2">
                        <ActivityIcon size={14} className="text-white/30" />
                        {t('dashboard.noActiveJobs')}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                        {data.activeJobs.map(job => (
                            <JobCard key={job.id} job={job} userType={data.user.userType} />
                        ))}
                    </div>
                )}
            </section>

            <RecentActivityFeed items={data.recentActivity} />
        </div>
    );
}

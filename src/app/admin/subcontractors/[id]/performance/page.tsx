'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { SubTabNav } from '@/components/admin/sub-tab-nav';
import { Star, AlertTriangle, ThumbsUp, AlertCircle } from 'lucide-react';
import { useSub } from '../use-sub';
import type { SubcontractorAssignment } from '@/lib/subcontractors';

interface JoinedAssignment extends SubcontractorAssignment {
    projectName: string | null;
    projectNumber: string | null;
}

/** Build last-12-months reliability series from completed/flagged assignments. */
function buildReliabilitySeries(assignments: SubcontractorAssignment[]): { month: string; score: number }[] {
    const now = new Date();
    const months: { month: string; key: string }[] = [];
    for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
            month: d.toLocaleString('en-US', { month: 'short' }),
            key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        });
    }

    return months.map(({ month, key }) => {
        const monthAssignments = assignments.filter((a) => {
            const date = a.endDate ?? a.startDate;
            return date?.startsWith(key);
        });
        const completed = monthAssignments.filter((a) => ['Completed', 'Approved', 'Paid'].includes(a.assignmentStatus)).length;
        const flagged = monthAssignments.filter((a) => a.assignmentStatus === 'Issue Flagged').length;
        const total = completed + flagged;
        const score = total === 0 ? 0 : Math.round((completed / total) * 100);
        return { month, score };
    });
}

export default function SubcontractorPerformancePage() {
    const params = useParams<{ id: string }>();
    const id = params?.id;
    const subState = useSub(id);

    const [assignments, setAssignments] = useState<JoinedAssignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/subcontractors/${id}/assignments`, { cache: 'no-store' });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            setAssignments((await res.json()) as JoinedAssignment[]);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { void load(); }, [load]);

    if (subState.phase === 'loading' || loading) {
        return <div className="flex justify-center py-32"><div className="w-6 h-6 rounded-full border-2 border-[#b8956a]/30 border-t-[#b8956a] animate-spin" /></div>;
    }
    if (subState.phase === 'notfound') return <p className="text-center text-white/40 py-32">Subcontractor not found.</p>;
    if (subState.phase === 'error') return <div className="p-6 text-red-300 max-w-xl mx-auto mt-12">{subState.error}</div>;

    const sub = subState.sub;
    const m = sub.metrics;
    const series = buildReliabilitySeries(assignments);
    const ratedJobs = assignments.filter((a) => typeof a.rating === 'number' && a.rating! > 0);
    const ratingDistribution = [5, 4, 3, 2, 1].map((star) => ({
        star,
        count: ratedJobs.filter((a) => Math.round(a.rating!) === star).length,
    }));
    const maxCount = Math.max(1, ...ratingDistribution.map((r) => r.count));

    return (
        <div>
            <div className="mb-6">
                <h1 className="font-serif text-2xl font-bold text-white mb-1">{sub.companyName}</h1>
                <p className="text-sm text-white/50">Performance Metrics & Trend Analysis</p>
            </div>

            <SubTabNav subId={sub.id} />

            {error && (
                <div className="mb-6 p-4 rounded-2xl border border-red-500/20 bg-red-500/5 text-red-300 text-sm flex items-start gap-3">
                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                    <div>{error}</div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Score Card */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6">
                        <div className="text-center mb-6 pb-6 border-b border-white/5">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/5 border-2 border-[#fbbf24]/20 mb-3">
                                <span className="text-3xl font-bold text-white">
                                    {(m.avgRating || sub.rating).toFixed(1)}
                                </span>
                            </div>
                            <h2 className="text-sm font-semibold text-white">Overall Rating</h2>
                            <div className="flex justify-center gap-1 mt-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star key={star} size={16} className={star <= Math.round(m.avgRating || sub.rating) ? 'text-[#fbbf24] fill-[#fbbf24]' : 'text-white/20'} />
                                ))}
                            </div>
                        </div>

                        <div className="space-y-5">
                            <Bar label="Reliability" value={m.reliabilityScore} suffix="%" tone={m.reliabilityScore >= 90 ? 'good' : m.reliabilityScore >= 75 ? 'warn' : 'bad'} />
                            <Bar label="On-Time Rate" value={m.onTimeRate} suffix="%" tone={m.onTimeRate >= 90 ? 'good' : m.onTimeRate >= 75 ? 'warn' : 'bad'} />
                            <Bar label="Issue Rate (Inverse)" value={Math.max(0, 100 - m.issueRatePct * 5)} suffix="%" tone={m.issueRatePct === 0 ? 'good' : m.issueRatePct < 5 ? 'warn' : 'bad'} />
                            <Bar label="Avg Rating" value={Math.round((m.avgRating || sub.rating) * 20)} suffix="%" tone="good" />
                        </div>
                    </div>

                    <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6">
                        <h2 className="text-sm font-semibold text-white mb-4">Reliability Status</h2>
                        {m.reliabilityScore < 90 ? (
                            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex gap-3">
                                <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-amber-200">Reliability Warning</p>
                                    <p className="text-xs text-amber-200/60 mt-1">Below 90% threshold. Review recent performance before assigning critical-path work.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 bg-white/5 border border-white/5 rounded-xl flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-[#34d399]/10 flex items-center justify-center text-[#34d399] shrink-0">
                                    <ThumbsUp size={14} />
                                </div>
                                <p className="text-sm text-white/70">Reliability is in the green. Safe for critical work.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Trends */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6">
                        <h2 className="text-sm font-semibold text-white mb-4">Reliability — Last 12 Months</h2>
                        <Sparkline series={series} />
                    </div>

                    <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6">
                        <h2 className="text-sm font-semibold text-white mb-4">Rating Distribution ({ratedJobs.length} rated)</h2>
                        {ratedJobs.length === 0 ? (
                            <p className="text-sm text-white/40">No job ratings logged yet.</p>
                        ) : (
                            <div className="space-y-2">
                                {ratingDistribution.map(({ star, count }) => (
                                    <div key={star} className="flex items-center gap-3">
                                        <div className="flex items-center gap-1 w-12 text-xs text-white/60">
                                            {star} <Star size={10} className="text-[#fbbf24] fill-[#fbbf24]" />
                                        </div>
                                        <div className="flex-1 h-2 bg-black/40 rounded-full overflow-hidden">
                                            <div className="h-full bg-[#fbbf24] rounded-full" style={{ width: `${(count / maxCount) * 100}%` }} />
                                        </div>
                                        <span className="text-xs font-mono text-white/60 w-8 text-right">{count}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6">
                        <h2 className="text-sm font-semibold text-white mb-4">Performance Summary</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            <Stat label="Jobs Completed" value={String(m.jobsCompleted)} />
                            <Stat label="Active Jobs" value={String(m.activeJobs)} />
                            <Stat label="Avg Days / Job" value={String(m.avgCompletionTimeDays)} />
                            <Stat label="On-Time Rate" value={`${m.onTimeRate}%`} />
                            <Stat label="Issue Rate" value={`${m.issueRatePct}%`} />
                            <Stat label="Reliability Score" value={`${m.reliabilityScore}%`} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Bar({ label, value, suffix, tone }: { label: string; value: number; suffix?: string; tone: 'good' | 'warn' | 'bad' }) {
    const color = tone === 'good' ? 'bg-[#34d399]' : tone === 'warn' ? 'bg-[#fbbf24]' : 'bg-[#f87171]';
    return (
        <div>
            <div className="flex justify-between text-xs mb-1.5">
                <span className="text-white/60">{label}</span>
                <span className="text-white font-medium">{value}{suffix ?? ''}</span>
            </div>
            <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                <div className={`h-full ${color} rounded-full`} style={{ width: `${Math.min(100, value)}%` }} />
            </div>
        </div>
    );
}

function Stat({ label, value }: { label: string; value: string }) {
    return (
        <div className="bg-white/5 border border-white/5 rounded-xl p-4">
            <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">{label}</p>
            <p className="text-lg font-bold text-white">{value}</p>
        </div>
    );
}

function Sparkline({ series }: { series: { month: string; score: number }[] }) {
    const width = 600;
    const height = 120;
    const padding = 24;
    const innerW = width - padding * 2;
    const innerH = height - padding * 2;
    const max = Math.max(100, ...series.map((s) => s.score));
    const xStep = series.length > 1 ? innerW / (series.length - 1) : 0;
    const points = series.map((s, i) => {
        const x = padding + i * xStep;
        const y = padding + innerH - (s.score / max) * innerH;
        return { x, y, ...s };
    });
    const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    const areaPath = `${path} L ${points[points.length - 1]?.x ?? padding} ${padding + innerH} L ${padding} ${padding + innerH} Z`;

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-32">
            <path d={areaPath} fill="rgba(184, 149, 106, 0.12)" />
            <path d={path} stroke="#b8956a" strokeWidth="2" fill="none" />
            {points.map((p, i) => (
                <g key={i}>
                    <circle cx={p.x} cy={p.y} r="3" fill="#b8956a" />
                    <text x={p.x} y={height - 6} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.4)">{p.month}</text>
                </g>
            ))}
        </svg>
    );
}

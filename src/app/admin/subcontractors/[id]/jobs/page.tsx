'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { SubTabNav } from '@/components/admin/sub-tab-nav';
import { StatusBadge } from '@/components/admin/status-badge';
import { Briefcase, AlertCircle } from 'lucide-react';
import { useSub } from '../use-sub';
import type { SubcontractorAssignment } from '@/lib/subcontractors';

interface JoinedAssignment extends SubcontractorAssignment {
    projectName: string | null;
    projectNumber: string | null;
    projectStatus: string | null;
    projectClient: string | null;
}

const STATUS_FILTERS = ['All', 'Assigned', 'Scheduled', 'In Progress', 'Completed', 'Approved', 'Paid', 'Issue Flagged'] as const;

function formatCurrency(n: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

export default function SubcontractorJobsPage() {
    const params = useParams<{ id: string }>();
    const id = params?.id;
    const subState = useSub(id);

    const [assignments, setAssignments] = useState<JoinedAssignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<typeof STATUS_FILTERS[number]>('All');

    const load = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/subcontractors/${id}/assignments`, { cache: 'no-store' });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            setAssignments((await res.json()) as JoinedAssignment[]);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load jobs');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { void load(); }, [load]);

    if (subState.phase === 'loading') {
        return <div className="flex justify-center py-32"><div className="w-6 h-6 rounded-full border-2 border-[#b8956a]/30 border-t-[#b8956a] animate-spin" /></div>;
    }
    if (subState.phase === 'notfound') return <p className="text-center text-white/40 py-32">Subcontractor not found.</p>;
    if (subState.phase === 'error') {
        return <div className="p-6 rounded-2xl border border-red-500/20 bg-red-500/5 text-red-300 max-w-xl mx-auto mt-12">{subState.error}</div>;
    }

    const sub = subState.sub;
    const filtered = filter === 'All' ? assignments : assignments.filter((a) => a.assignmentStatus === filter);

    const totalAgreed = filtered.reduce((s, a) => s + a.agreedAmount, 0);
    const totalBilled = filtered.reduce((s, a) => s + a.billedAmount, 0);
    const totalPaid = filtered.reduce((s, a) => s + a.paidAmount, 0);

    return (
        <div>
            <div className="mb-6">
                <h1 className="font-serif text-2xl font-bold text-white mb-1">{sub.companyName}</h1>
                <p className="text-sm text-white/50">Job History & Active Assignments</p>
            </div>

            <SubTabNav subId={sub.id} />

            <div className="flex items-center gap-2 flex-wrap mb-4">
                {STATUS_FILTERS.map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${filter === f ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/70 hover:bg-white/5'}`}
                    >
                        {f} {f !== 'All' && (
                            <span className="ml-1 text-white/30">{assignments.filter((a) => a.assignmentStatus === f).length}</span>
                        )}
                    </button>
                ))}
            </div>

            <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl overflow-hidden">
                {loading ? (
                    <div className="flex justify-center py-16"><div className="w-5 h-5 rounded-full border-2 border-[#b8956a]/30 border-t-[#b8956a] animate-spin" /></div>
                ) : error ? (
                    <div className="text-center py-16 text-red-300/80 flex flex-col items-center gap-3">
                        <AlertCircle size={24} />
                        <p className="text-sm">{error}</p>
                        <button onClick={() => void load()} className="text-xs text-[#b8956a] font-semibold">Retry</button>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="py-16 text-center text-white/40">
                        <Briefcase size={32} className="mx-auto text-white/10 mb-3" />
                        <p className="text-sm">{filter === 'All' ? 'No jobs assigned yet.' : `No jobs with status "${filter}".`}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead>
                                <tr className="bg-white/5 border-b border-white/5 text-[10px] uppercase tracking-wider text-white/40">
                                    <th className="px-5 py-3 font-semibold">Project & Scope</th>
                                    <th className="px-5 py-3 font-semibold text-right">Agreed</th>
                                    <th className="px-5 py-3 font-semibold text-right">Billed</th>
                                    <th className="px-5 py-3 font-semibold text-right">Paid</th>
                                    <th className="px-5 py-3 font-semibold text-center">Status</th>
                                    <th className="px-5 py-3 font-semibold text-right">Completion</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filtered.map((a) => (
                                    <tr key={a.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-5 py-4">
                                            {a.projectId ? (
                                                <Link href={`/admin/projects/${a.projectId}`} className="block">
                                                    <div className="font-medium text-white group-hover:text-[#b8956a] transition-colors mb-1">
                                                        {a.projectName ?? `Project ${a.projectId}`}
                                                    </div>
                                                </Link>
                                            ) : (
                                                <div className="font-medium text-white/60 mb-1">No Project</div>
                                            )}
                                            <div className="text-white/60 text-xs max-w-md truncate">{a.scopeOfWork}</div>
                                            {a.startDate && (
                                                <div className="text-[10px] uppercase tracking-widest text-white/30 mt-1">
                                                    {a.startDate} → {a.endDate ?? 'TBD'}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-5 py-4 text-right font-mono text-white">{formatCurrency(a.agreedAmount)}</td>
                                        <td className="px-5 py-4 text-right font-mono text-white/70">{formatCurrency(a.billedAmount)}</td>
                                        <td className="px-5 py-4 text-right font-mono font-bold text-[#34d399]">{formatCurrency(a.paidAmount)}</td>
                                        <td className="px-5 py-4 text-center"><StatusBadge status={a.assignmentStatus} /></td>
                                        <td className="px-5 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <div className="w-16 h-1.5 bg-black/40 rounded-full overflow-hidden">
                                                    <div className="h-full bg-[#b8956a] rounded-full" style={{ width: `${a.completionPct}%` }} />
                                                </div>
                                                <span className="font-semibold text-white text-xs w-10 text-right">{a.completionPct}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="border-t border-white/10 bg-white/[0.02] text-white/80">
                                    <td className="px-5 py-3 text-xs uppercase tracking-widest font-semibold">Totals ({filtered.length})</td>
                                    <td className="px-5 py-3 text-right font-mono font-bold text-white">{formatCurrency(totalAgreed)}</td>
                                    <td className="px-5 py-3 text-right font-mono text-white/70">{formatCurrency(totalBilled)}</td>
                                    <td className="px-5 py-3 text-right font-mono font-bold text-[#34d399]">{formatCurrency(totalPaid)}</td>
                                    <td colSpan={2} />
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

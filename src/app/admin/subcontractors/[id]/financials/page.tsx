'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { SubTabNav } from '@/components/admin/sub-tab-nav';
import { StatusBadge } from '@/components/admin/status-badge';
import { CostCard } from '@/components/admin/cost-card';
import { HandCoins, DollarSign, Clock, Receipt, AlertCircle, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useSub } from '../use-sub';
import type { SubcontractorAssignment } from '@/lib/subcontractors';

interface JoinedAssignment extends SubcontractorAssignment {
    projectName: string | null;
    projectNumber: string | null;
}

interface Bill {
    id: string;
    project_id: string;
    subcontractor_id: string | null;
    bill_number: string | null;
    amount: string | number;
    status: string;
    received_date: string | null;
    due_date: string | null;
    paid_date: string | null;
    description: string | null;
}

function formatCurrency(n: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

export default function SubcontractorFinancialsPage() {
    const params = useParams<{ id: string }>();
    const id = params?.id;
    const subState = useSub(id);

    const [assignments, setAssignments] = useState<JoinedAssignment[]>([]);
    const [bills, setBills] = useState<Bill[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        setError(null);
        try {
            const [aRes, bRes] = await Promise.all([
                fetch(`/api/subcontractors/${id}/assignments`, { cache: 'no-store' }),
                // bills endpoint owned by Projects agent — best-effort fetch, ignore failure
                fetch(`/api/project-bills?subcontractorId=${id}`, { cache: 'no-store' }).catch(() => null),
            ]);
            if (!aRes.ok) throw new Error(`assignments HTTP ${aRes.status}`);
            setAssignments((await aRes.json()) as JoinedAssignment[]);
            if (bRes && bRes.ok) {
                const data = (await bRes.json()) as Bill[] | { bills?: Bill[] };
                setBills(Array.isArray(data) ? data : Array.isArray(data?.bills) ? data.bills : []);
            } else {
                setBills([]);
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load financials');
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

    // Aggregations from assignments (canonical financial source)
    const yearStart = new Date(new Date().getFullYear(), 0, 1).getTime();
    const isThisYear = (d: string | null) => {
        if (!d) return false;
        const t = new Date(d).getTime();
        return !Number.isNaN(t) && t >= yearStart;
    };

    const ytdAssignments = assignments.filter((a) => isThisYear(a.startDate) || isThisYear(a.endDate));
    const totalPaidYTD = ytdAssignments.reduce((s, a) => s + a.paidAmount, 0);
    const totalBilledYTD = ytdAssignments.reduce((s, a) => s + a.billedAmount, 0);
    const outstanding = ytdAssignments.reduce((s, a) => s + Math.max(0, a.billedAmount - a.paidAmount), 0);
    const billedJobs = ytdAssignments.filter((a) => a.billedAmount > 0);
    const avgBill = billedJobs.length ? totalBilledYTD / billedJobs.length : 0;

    // Payment-terms compliance: bills paid_date - received_date vs Net X
    const termsMatch = (sub.paymentTerms || '').match(/Net\s*(\d+)/i);
    const termsDays = termsMatch ? Number(termsMatch[1]) : null;
    const paidBills = bills.filter((b) => b.paid_date && b.received_date && b.status?.toLowerCase() === 'paid');
    const paidOnTime = termsDays
        ? paidBills.filter((b) => {
            const days = Math.floor((new Date(b.paid_date!).getTime() - new Date(b.received_date!).getTime()) / 86_400_000);
            return days <= termsDays;
        }).length
        : 0;
    const ptcRate = termsDays && paidBills.length ? Math.round((paidOnTime / paidBills.length) * 100) : null;

    return (
        <div>
            <div className="mb-6">
                <h1 className="font-serif text-2xl font-bold text-white mb-1">{sub.companyName}</h1>
                <p className="text-sm text-white/50">Financial History & Payment Performance</p>
            </div>

            <SubTabNav subId={sub.id} />

            {error && (
                <div className="mb-6 p-4 rounded-2xl border border-red-500/20 bg-red-500/5 text-red-300 text-sm flex items-start gap-3">
                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                    <div>{error}</div>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <CostCard title="YTD Paid" amount={totalPaidYTD} icon={<DollarSign />} />
                <CostCard title="YTD Billed" amount={totalBilledYTD} icon={<Receipt />} />
                <CostCard title="Outstanding" amount={outstanding} icon={<Clock />} />
                <CostCard title="Avg Bill Amount" amount={Math.round(avgBill)} icon={<TrendingUp />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6">
                    <p className="text-[10px] uppercase tracking-widest text-[#b8956a] mb-2 font-semibold">Payment Terms</p>
                    <p className="text-lg font-bold text-white">{sub.paymentTerms}</p>
                    {sub.defaultRate && <p className="text-xs text-white/40 mt-1">{sub.defaultRate}</p>}
                </div>
                <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6">
                    <p className="text-[10px] uppercase tracking-widest text-[#b8956a] mb-2 font-semibold">On-Time Payment Rate</p>
                    {ptcRate !== null ? (
                        <p className={`text-lg font-bold ${ptcRate >= 90 ? 'text-[#34d399]' : ptcRate >= 70 ? 'text-[#fbbf24]' : 'text-[#f87171]'}`}>
                            {ptcRate}% <span className="text-xs text-white/40 font-normal">of {paidBills.length} bills</span>
                        </p>
                    ) : (
                        <p className="text-sm text-white/40">No bill history yet.</p>
                    )}
                </div>
                <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6">
                    <p className="text-[10px] uppercase tracking-widest text-[#b8956a] mb-2 font-semibold">YTD Jobs Billed</p>
                    <p className="text-lg font-bold text-white">{billedJobs.length}</p>
                </div>
            </div>

            <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-white/6 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-white">Assignment-Level Payments</h2>
                </div>
                {assignments.length === 0 ? (
                    <div className="py-16 text-center text-white/40">
                        <HandCoins size={48} className="mx-auto text-white/10 mb-4" />
                        <h3 className="font-serif text-lg font-bold text-white mb-2">No Payment Records</h3>
                        <p className="max-w-sm mx-auto text-sm">This subcontractor has no recorded assignments.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead>
                                <tr className="bg-white/5 border-b border-white/5 text-[10px] uppercase tracking-wider text-white/40">
                                    <th className="px-5 py-3 font-semibold">Project / Scope</th>
                                    <th className="px-5 py-3 font-semibold text-right">Agreed</th>
                                    <th className="px-5 py-3 font-semibold text-right">Billed</th>
                                    <th className="px-5 py-3 font-semibold text-right">Paid</th>
                                    <th className="px-5 py-3 font-semibold text-right">Outstanding</th>
                                    <th className="px-5 py-3 font-semibold text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {assignments.map((a) => (
                                    <tr key={a.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="px-5 py-4">
                                            {a.projectId ? (
                                                <Link href={`/admin/projects/${a.projectId}/bills`} className="text-white hover:text-[#b8956a] transition-colors block">
                                                    {a.projectName ?? a.projectId}
                                                </Link>
                                            ) : (
                                                <span className="text-white/50">Unassigned</span>
                                            )}
                                            <div className="text-xs text-white/40 truncate max-w-md">{a.scopeOfWork}</div>
                                        </td>
                                        <td className="px-5 py-4 text-right font-mono text-white">{formatCurrency(a.agreedAmount)}</td>
                                        <td className="px-5 py-4 text-right font-mono text-white/70">{formatCurrency(a.billedAmount)}</td>
                                        <td className="px-5 py-4 text-right font-mono font-bold text-[#34d399]">{formatCurrency(a.paidAmount)}</td>
                                        <td className="px-5 py-4 text-right font-mono text-[#fbbf24]">{formatCurrency(Math.max(0, a.billedAmount - a.paidAmount))}</td>
                                        <td className="px-5 py-4 text-center"><StatusBadge status={a.assignmentStatus} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

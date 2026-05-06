'use client';

import { use, useEffect, useState } from 'react';
import { ProjectTabNav } from '@/components/admin/project-tab-nav';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { getProject, DbProjectFull, n, fmtCurrency } from '@/lib/project-api';

interface RowItem {
    name: string;
    category: string;
    estimated: number;
    actual: number;
}

export default function EstVsActualPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [project, setProject] = useState<DbProjectFull | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const p = await getProject(id);
                setProject(p);
            } catch (e) {
                setError(e instanceof Error ? e.message : String(e));
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24 text-white/40 gap-2">
                <Loader2 size={16} className="animate-spin" /> Loading…
            </div>
        );
    }
    if (error) return <div className="p-6 border border-red-500/20 bg-red-500/5 rounded-2xl text-red-300">{error}</div>;
    if (!project) return <div className="py-24 text-center text-white/50">Project not found.</div>;

    // ─── Build rows from phases (estimate-vs-actual is phase-based now). ──
    const rows: RowItem[] = project.phases.map((ph) => ({
        name: ph.name,
        category: 'Phase',
        estimated: n(ph.estimated_budget),
        actual: n(ph.actual_cost),
    }));

    // Add expenses as "Actual-only" rows grouped by category
    const expByCat: Record<string, number> = {};
    for (const e of project.expenses) {
        const k = e.category;
        expByCat[k] = (expByCat[k] ?? 0) + n(e.amount);
    }
    Object.entries(expByCat).forEach(([cat, amt]) => {
        rows.push({ name: `Expenses — ${cat}`, category: 'Expense', estimated: 0, actual: amt });
    });

    // Add bills as actual-only
    if (project.bills.length > 0) {
        const billsTotal = project.bills.reduce((s, b) => s + n(b.amount), 0);
        rows.push({ name: 'Subcontractor Bills', category: 'Bills', estimated: 0, actual: billsTotal });
    }

    // Internal labor
    if (n(project.labor_cost) > 0) {
        rows.push({
            name: 'Internal Labor (time entries)',
            category: 'Labor',
            estimated: 0,
            actual: n(project.labor_cost),
        });
    }

    return (
        <div>
            <div className="mb-6">
                <h1 className="font-serif text-2xl font-bold text-white mb-1">{project.name}</h1>
                <p className="text-sm text-white/50">Line Item Cost Analysis (Estimate vs. Actual)</p>
            </div>

            <ProjectTabNav projectId={project.id} />

            <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-white/6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <h2 className="text-sm font-semibold text-white">Line Item Analysis</h2>
                    <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1.5 text-white/50">
                            <span className="w-2 h-2 rounded-full bg-[#34d399]"></span> Under Budget
                        </div>
                        <div className="flex items-center gap-1.5 text-white/50">
                            <span className="w-2 h-2 rounded-full bg-red-400"></span> Over Budget
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead>
                            <tr className="bg-white/5 border-b border-white/5 text-[10px] uppercase tracking-wider text-white/40">
                                <th className="px-5 py-3 font-semibold">Item</th>
                                <th className="px-5 py-3 font-semibold">Type</th>
                                <th className="px-5 py-3 font-semibold text-right">Est. Cost</th>
                                <th className="px-5 py-3 font-semibold text-right">Act. Cost</th>
                                <th className="px-5 py-3 font-semibold text-right">Variance</th>
                                <th className="px-5 py-3 font-semibold text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {rows.map((row, idx) => {
                                const variance = row.actual - row.estimated;
                                const isOver = variance > 0 && row.estimated > 0;
                                const isUnder = variance < 0 && row.actual > 0;
                                const noEstimate = row.estimated === 0;

                                return (
                                    <tr
                                        key={`${row.name}-${idx}`}
                                        className={`hover:bg-white/[0.02] transition-colors ${
                                            isOver ? 'bg-red-500/[0.02]' : ''
                                        }`}
                                    >
                                        <td className="px-5 py-4">
                                            <div className="font-medium text-white">{row.name}</div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="text-[10px] uppercase tracking-wide text-white/40">
                                                {row.category}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-right font-mono text-white/60">
                                            {fmtCurrency(row.estimated)}
                                        </td>
                                        <td
                                            className={`px-5 py-4 text-right font-mono font-medium ${
                                                isOver ? 'text-red-400' : 'text-white'
                                            }`}
                                        >
                                            {fmtCurrency(row.actual)}
                                        </td>
                                        <td
                                            className={`px-5 py-4 text-right font-mono font-bold ${
                                                isOver
                                                    ? 'text-red-400'
                                                    : isUnder
                                                    ? 'text-[#34d399]'
                                                    : 'text-white/30'
                                            }`}
                                        >
                                            {variance > 0 ? '+' : ''}
                                            {fmtCurrency(variance)}
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            {isOver ? (
                                                <AlertCircle size={16} className="text-red-400 mx-auto" strokeWidth={2.5} />
                                            ) : isUnder ? (
                                                <CheckCircle2 size={16} className="text-[#34d399] mx-auto" />
                                            ) : noEstimate ? (
                                                <span className="text-[10px] uppercase text-white/30 font-semibold tracking-wider">
                                                    Tracking
                                                </span>
                                            ) : (
                                                <span className="text-[10px] uppercase text-white/30 font-semibold tracking-wider">
                                                    Pending
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            {rows.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-5 py-12 text-center text-white/40">
                                        No phases or actuals captured yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

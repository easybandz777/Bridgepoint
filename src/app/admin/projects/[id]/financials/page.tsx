'use client';

import { use, useEffect, useState } from 'react';
import { ProjectTabNav } from '@/components/admin/project-tab-nav';
import { CostCard } from '@/components/admin/cost-card';
import { DollarSign, AlertCircle, PieChart, TrendingUp, Loader2 } from 'lucide-react';
import { getProject, DbProjectFull, n, fmtCurrency, calcEstGP, calcActGP, marginPct } from '@/lib/project-api';

interface CategoryRow {
    estimated: number;
    actual: number;
}

export default function ProjectFinancialsPage({ params }: { params: Promise<{ id: string }> }) {
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
                <Loader2 size={16} className="animate-spin" /> Loading financials…
            </div>
        );
    }
    if (error) {
        return (
            <div className="p-6 border border-red-500/20 bg-red-500/5 rounded-2xl text-red-300 text-sm">
                Failed to load: {error}
            </div>
        );
    }
    if (!project) return <div className="py-24 text-center text-white/50">Project not found.</div>;

    // ─── Live computation ──────────────────────────────────────
    // Build a category rollup pulling from phases + bills + expenses.
    const itemsByCategory: Record<string, CategoryRow> = {};

    // Phases as the "Labor & Subcontractor Rollup" group
    for (const ph of project.phases) {
        const key = ph.name;
        if (!itemsByCategory[key]) itemsByCategory[key] = { estimated: 0, actual: 0 };
        itemsByCategory[key].estimated += n(ph.estimated_budget);
        itemsByCategory[key].actual += n(ph.actual_cost);
    }

    // Expenses by category (independent of phases)
    for (const ex of project.expenses) {
        const key = `Expense — ${ex.category}`;
        if (!itemsByCategory[key]) itemsByCategory[key] = { estimated: 0, actual: 0 };
        itemsByCategory[key].actual += n(ex.amount);
    }

    // Bills by status (Approved + Paid)
    const billsTotal = project.bills.reduce((s, b) => s + n(b.amount), 0);
    if (billsTotal > 0) {
        itemsByCategory['Subcontractor Bills'] = { estimated: 0, actual: billsTotal };
    }

    // Internal labor from time entries
    if (n(project.labor_cost) > 0) {
        itemsByCategory['Internal Labor (Time Entries)'] = { estimated: 0, actual: n(project.labor_cost) };
    }

    const totalEstCost = Object.values(itemsByCategory).reduce((s, r) => s + r.estimated, 0)
        || n(project.estimated_cost);
    const totalActCost = Object.values(itemsByCategory).reduce((s, r) => s + r.actual, 0);
    const totalCostVariance = totalActCost - totalEstCost;

    const estGP = calcEstGP(project);
    const actRevForGP = n(project.actual_revenue) || n(project.estimated_revenue);
    const actGP = actRevForGP - totalActCost;
    const varianceGP = actGP - estGP;

    return (
        <div>
            <div className="mb-6">
                <h1 className="font-serif text-2xl font-bold text-white mb-1">{project.name}</h1>
                <p className="text-sm text-white/50">Financial Dashboard & Job Costing</p>
            </div>

            <ProjectTabNav projectId={project.id} />

            <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <CostCard title="Estimated Cost (Budget)" amount={totalEstCost} icon={<PieChart />} />
                    <CostCard
                        title="Actual Cost (To Date)"
                        amount={totalActCost}
                        variance={totalCostVariance}
                        invertVariance={true}
                        icon={<TrendingUp />}
                    />
                    <CostCard
                        title="Projected Profit (GP)"
                        amount={actGP}
                        variance={varianceGP}
                        subtitle={`Target GP: ${fmtCurrency(estGP)}`}
                        icon={<DollarSign />}
                    />
                    <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-5 flex flex-col justify-center">
                        <div className="flex items-center gap-3 text-white/40 mb-2">
                            <AlertCircle size={16} />
                            <span className="text-xs font-semibold uppercase tracking-wider">Financial Status</span>
                        </div>
                        {totalCostVariance > 0 ? (
                            <div className="text-red-400 font-bold text-lg leading-tight">Over Budget Warning</div>
                        ) : (
                            <div className="text-[#34d399] font-bold text-lg leading-tight">On Track / Healthy</div>
                        )}
                        <p className="text-xs text-white/40 mt-1">Based on current vs estimated costs.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-[#1a1a1a] border border-white/6 rounded-2xl overflow-hidden">
                        <div className="p-5 border-b border-white/6">
                            <h2 className="text-sm font-semibold text-white">Cost Breakdown</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead>
                                    <tr className="bg-white/5 border-b border-white/5 text-[10px] uppercase tracking-wider text-white/40">
                                        <th className="px-5 py-3 font-semibold">Bucket</th>
                                        <th className="px-5 py-3 font-semibold text-right">Budget</th>
                                        <th className="px-5 py-3 font-semibold text-right">Actual</th>
                                        <th className="px-5 py-3 font-semibold text-right">Variance</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {Object.entries(itemsByCategory).map(([cat, amts]) => {
                                        const variance = amts.actual - amts.estimated;
                                        const isOver = variance > 0 && amts.estimated > 0;
                                        return (
                                            <tr key={cat} className="hover:bg-white/[0.02] transition-colors">
                                                <td className="px-5 py-4 text-white font-medium">{cat}</td>
                                                <td className="px-5 py-4 text-white/60 text-right font-mono">
                                                    {fmtCurrency(amts.estimated)}
                                                </td>
                                                <td className="px-5 py-4 text-white font-mono text-right">
                                                    {fmtCurrency(amts.actual)}
                                                </td>
                                                <td
                                                    className={`px-5 py-4 text-right font-mono font-bold ${
                                                        isOver
                                                            ? 'text-red-400'
                                                            : variance < 0
                                                            ? 'text-[#34d399]'
                                                            : 'text-white/40'
                                                    }`}
                                                >
                                                    {variance > 0 ? '+' : ''}
                                                    {fmtCurrency(variance)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {Object.keys(itemsByCategory).length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-5 py-12 text-center text-white/40">
                                                No cost data captured yet. Add phases, bills, or expenses.
                                            </td>
                                        </tr>
                                    )}
                                    {Object.keys(itemsByCategory).length > 0 && (
                                        <tr className="bg-white/5 font-semibold text-white border-t border-white/10">
                                            <td className="px-5 py-4">Total Costs</td>
                                            <td className="px-5 py-4 text-right font-mono">{fmtCurrency(totalEstCost)}</td>
                                            <td className="px-5 py-4 text-right font-mono">{fmtCurrency(totalActCost)}</td>
                                            <td
                                                className={`px-5 py-4 text-right font-mono ${
                                                    totalCostVariance > 0 ? 'text-red-400' : 'text-[#34d399]'
                                                }`}
                                            >
                                                {totalCostVariance > 0 ? '+' : ''}
                                                {fmtCurrency(totalCostVariance)}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Cash Flow */}
                    <div className="space-y-6">
                        <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6">
                            <h2 className="text-sm font-semibold text-white mb-6">Client Billing Status</h2>
                            <div className="space-y-5">
                                <div>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-xs text-white/50">Total Contract Value</span>
                                        <span className="text-sm font-semibold text-white">
                                            {fmtCurrency(project.estimated_revenue)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-xs text-white/50">Total Billed to Client</span>
                                        <span className="text-sm font-semibold text-white">
                                            {fmtCurrency(project.invoiced_amount)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-xs text-white/50">Total Collected</span>
                                        <span className="text-sm font-semibold text-white">
                                            {fmtCurrency(project.collected_amount)}
                                        </span>
                                    </div>
                                    <div className="h-1.5 bg-black/40 rounded-full mt-2 overflow-hidden">
                                        <div
                                            className="h-full bg-blue-500 rounded-full"
                                            style={{
                                                width: `${
                                                    n(project.estimated_revenue) > 0
                                                        ? Math.min(
                                                              (n(project.invoiced_amount) /
                                                                  n(project.estimated_revenue)) *
                                                                  100,
                                                              100,
                                                          )
                                                        : 0
                                                }%`,
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="pt-5 border-t border-white/6">
                                    <div className="flex justify-between items-center">
                                        <div className="text-xs text-white/50">Remaining to Bill</div>
                                        <div className="text-lg font-bold text-white">
                                            {fmtCurrency(
                                                Math.max(
                                                    0,
                                                    n(project.estimated_revenue) - n(project.invoiced_amount),
                                                ),
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Margin */}
                        <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6">
                            <h2 className="text-sm font-semibold text-white mb-4">Profitability</h2>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-white/50">Target Margin</span>
                                    <span className="text-white">
                                        {marginPct(n(project.estimated_revenue), estGP).toFixed(1)}%
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-white/50">Realized Margin</span>
                                    <span
                                        className={
                                            actGP - estGP < 0 ? 'text-red-400' : 'text-[#34d399]'
                                        }
                                    >
                                        {marginPct(actRevForGP, actGP).toFixed(1)}%
                                    </span>
                                </div>
                                <div className="flex justify-between pt-2 border-t border-white/6 mt-2">
                                    <span className="text-white/50">GP $</span>
                                    <span className={varianceGP < 0 ? 'text-red-400' : 'text-white'}>
                                        {fmtCurrency(actGP)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

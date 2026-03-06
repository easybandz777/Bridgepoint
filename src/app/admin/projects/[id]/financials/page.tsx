import { notFound } from 'next/navigation';
import {
    SAMPLE_PROJECTS,
    calcEstimatedGP,
    calcActualGP,
    formatCurrency,
    BudgetCategory
} from '@/lib/projects';
import { ProjectTabNav } from '@/components/admin/project-tab-nav';
import { CostCard } from '@/components/admin/cost-card';
import { DollarSign, AlertCircle, PieChart, TrendingUp } from 'lucide-react';

export default function ProjectFinancialsPage({ params }: { params: { id: string } }) {
    const project = SAMPLE_PROJECTS.find(p => p.id === params.id);
    if (!project) notFound();

    const estGP = calcEstimatedGP(project);
    const actGP = calcActualGP(project);
    const varianceGP = actGP - estGP; // Actual GP vs Estimated GP

    // Calculate total variance for items that have actuals
    const totalEstCost = project.budgetItems.reduce((sum, item) => sum + item.estimatedCost, 0);
    const totalActCost = project.budgetItems.reduce((sum, item) => sum + item.actualCost, 0);
    const totalCostVariance = totalActCost - totalEstCost;

    // Group items by category for summary tables
    const itemsByCategory = project.budgetItems.reduce((acc, item) => {
        if (!acc[item.category]) acc[item.category] = { estimated: 0, actual: 0 };
        acc[item.category].estimated += item.estimatedCost;
        acc[item.category].actual += item.actualCost;
        return acc;
    }, {} as Record<BudgetCategory, { estimated: number, actual: number }>);

    return (
        <div>
            {/* Minimal Header just for title/nav, since overview has the big one */}
            <div className="mb-6">
                <h1 className="font-serif text-2xl font-bold text-white mb-1">{project.name}</h1>
                <p className="text-sm text-white/50">Financial Dashboard & Job Costing</p>
            </div>

            {/* Navigation Tabs */}
            <ProjectTabNav projectId={project.id} />

            <div className="space-y-6">
                {/* 1. Top Level Financial Health */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <CostCard
                        title="Estimated Cost (Budget)"
                        amount={totalEstCost}
                        icon={<PieChart />}
                    />
                    <CostCard
                        title="Actual Cost (To Date)"
                        amount={totalActCost}
                        variance={totalCostVariance}
                        invertVariance={true} // Positive variance (higher cost) is bad
                        icon={<TrendingUp />}
                    />
                    <CostCard
                        title="Projected Profit (GP)"
                        amount={actGP}
                        variance={varianceGP}
                        subtitle={`Target GP: ${formatCurrency(estGP)}`}
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
                    {/* 2. Cost Breakdown Table */}
                    <div className="lg:col-span-2 bg-[#1a1a1a] border border-white/6 rounded-2xl overflow-hidden">
                        <div className="p-5 border-b border-white/6">
                            <h2 className="text-sm font-semibold text-white">Cost Breakdown by Category</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead>
                                    <tr className="bg-white/5 border-b border-white/5 text-[10px] uppercase tracking-wider text-white/40">
                                        <th className="px-5 py-3 font-semibold">Category</th>
                                        <th className="px-5 py-3 font-semibold text-right">Budget</th>
                                        <th className="px-5 py-3 font-semibold text-right">Actual</th>
                                        <th className="px-5 py-3 font-semibold text-right">Variance</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {Object.entries(itemsByCategory).map(([category, amounts]) => {
                                        const variance = amounts.actual - amounts.estimated;
                                        const isOver = variance > 0;
                                        return (
                                            <tr key={category} className="hover:bg-white/[0.02] transition-colors">
                                                <td className="px-5 py-4 text-white font-medium">{category}</td>
                                                <td className="px-5 py-4 text-white/60 text-right font-mono">{formatCurrency(amounts.estimated)}</td>
                                                <td className="px-5 py-4 text-white font-mono text-right">{formatCurrency(amounts.actual)}</td>
                                                <td className={`px-5 py-4 text-right font-mono font-bold ${isOver ? 'text-red-400' : (variance < 0 ? 'text-[#34d399]' : 'text-white/40')
                                                    }`}>
                                                    {variance > 0 ? '+' : ''}{formatCurrency(variance)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    <tr className="bg-white/5 font-semibold text-white border-t border-white/10">
                                        <td className="px-5 py-4">Total Costs</td>
                                        <td className="px-5 py-4 text-right font-mono">{formatCurrency(totalEstCost)}</td>
                                        <td className="px-5 py-4 text-right font-mono">{formatCurrency(totalActCost)}</td>
                                        <td className={`px-5 py-4 text-right font-mono ${totalCostVariance > 0 ? 'text-red-400' : 'text-[#34d399]'
                                            }`}>
                                            {totalCostVariance > 0 ? '+' : ''}{formatCurrency(totalCostVariance)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* 3. Cash Flow / Billing Summary Sidebar */}
                    <div className="space-y-6">
                        <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6">
                            <h2 className="text-sm font-semibold text-white mb-6">Client Billing Status</h2>

                            <div className="space-y-5">
                                <div>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-xs text-white/50">Total Contract Value</span>
                                        <span className="text-sm font-semibold text-white">{formatCurrency(project.estimatedRevenue)}</span>
                                    </div>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-xs text-white/50">Total Billed to Client</span>
                                        <span className="text-sm font-semibold text-white">{formatCurrency(project.actualRevenue)}</span>
                                    </div>
                                    <div className="h-1.5 bg-black/40 rounded-full mt-2 overflow-hidden">
                                        <div
                                            className="h-full bg-blue-500 rounded-full"
                                            style={{ width: `${Math.min((project.actualRevenue / project.estimatedRevenue) * 100, 100)}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="pt-5 border-t border-white/6">
                                    <div className="flex justify-between items-center">
                                        <div className="text-xs text-white/50">Remaining to Bill</div>
                                        <div className="text-lg font-bold text-white">
                                            {formatCurrency(Math.max(0, project.estimatedRevenue - project.actualRevenue))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

import { notFound } from 'next/navigation';
import { SAMPLE_PROJECTS } from '@/lib/projects';
import { SAMPLE_CHANGE_ORDERS, summarizeChangeOrders } from '@/lib/job-costing';
import { ProjectTabNav } from '@/components/admin/project-tab-nav';
import { StatusBadge } from '@/components/admin/status-badge';
import { formatCurrency } from '@/lib/projects';
import { Plus, FileText, CheckCircle2, Clock } from 'lucide-react';

export default function ProjectChangeOrdersPage({ params }: { params: { id: string } }) {
    const project = SAMPLE_PROJECTS.find(p => p.id === params.id);
    if (!project) notFound();

    const changeOrders = SAMPLE_CHANGE_ORDERS.filter(co => co.projectId === project.id);
    const summary = summarizeChangeOrders(changeOrders);

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
                <div>
                    <h1 className="font-serif text-2xl font-bold text-white mb-1">{project.name}</h1>
                    <p className="text-sm text-white/50">Change Orders & Variations</p>
                </div>
                <button className="h-10 px-5 bg-[#b8956a] text-black text-sm font-semibold rounded-full flex items-center justify-center gap-2 hover:bg-[#cbb08c] transition-colors whitespace-nowrap">
                    <Plus size={16} />
                    New Change Order
                </button>
            </div>

            {/* Navigation Tabs */}
            <ProjectTabNav projectId={project.id} />

            {/* Summary Cards */}
            {changeOrders.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-5">
                        <div className="flex items-center gap-2 text-white/40 mb-2">
                            <CheckCircle2 size={14} className="text-[#34d399]" />
                            <span className="text-[10px] font-semibold uppercase tracking-widest">Approved Change Orders</span>
                        </div>
                        <div className="text-xl font-bold text-white">{formatCurrency(summary.approvedRevenue)}</div>
                        <p className="text-xs text-white/50 mt-1">Added to contract value</p>
                    </div>
                    <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-5">
                        <div className="flex items-center gap-2 text-white/40 mb-2">
                            <Clock size={14} className="text-[#fbbf24]" />
                            <span className="text-[10px] font-semibold uppercase tracking-widest">Pending Verification</span>
                        </div>
                        <div className="text-xl font-bold text-white">{formatCurrency(summary.pendingRevenue)}</div>
                        <p className="text-xs text-white/50 mt-1">Awaiting customer signature</p>
                    </div>
                    <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-5">
                        <div className="flex items-center gap-2 text-white/40 mb-2">
                            <FileText size={14} />
                            <span className="text-[10px] font-semibold uppercase tracking-widest">Net Cost Impact</span>
                        </div>
                        <div className="text-xl font-bold text-white">{formatCurrency(summary.approvedCost + summary.pendingCost)}</div>
                        <p className="text-xs text-white/50 mt-1">Expected additional costs</p>
                    </div>
                </div>
            )}

            <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead>
                            <tr className="bg-white/5 border-b border-white/5 text-[10px] uppercase tracking-wider text-white/40">
                                <th className="px-5 py-3 font-semibold">Change Order</th>
                                <th className="px-5 py-3 font-semibold text-right">Added Revenue</th>
                                <th className="px-5 py-3 font-semibold text-right">Added Cost</th>
                                <th className="px-5 py-3 font-semibold text-right">Impact Margin</th>
                                <th className="px-5 py-3 font-semibold text-center">Status</th>
                                <th className="px-5 py-3 font-semibold text-right">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {changeOrders.map(co => {
                                const margin = co.customerAmount > 0
                                    ? ((co.customerAmount - co.internalCost) / co.customerAmount * 100)
                                    : 0;

                                return (
                                    <tr key={co.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="px-5 py-4">
                                            <div className="font-medium text-white flex items-center gap-2">
                                                <span className="text-white/30 text-xs font-mono">{co.number}</span>
                                                {co.title}
                                            </div>
                                            <div className="text-xs text-white/40 mt-1 truncate max-w-xs">{co.description}</div>
                                        </td>
                                        <td className="px-5 py-4 text-right font-mono text-white">
                                            {formatCurrency(co.customerAmount)}
                                        </td>
                                        <td className="px-5 py-4 text-right font-mono text-white/70">
                                            {formatCurrency(co.internalCost)}
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <span className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${margin >= 30 ? 'bg-green-500/10 text-green-400' :
                                                    margin > 0 ? 'bg-amber-500/10 text-amber-400' :
                                                        'bg-red-500/10 text-red-400'
                                                }`}>
                                                {margin.toFixed(1)}%
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <StatusBadge status={co.status} />
                                        </td>
                                        <td className="px-5 py-4 text-right text-xs text-white/50">
                                            {co.dateCreated}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {changeOrders.length === 0 && (
                        <div className="py-16 text-center">
                            <FileText size={48} className="mx-auto text-white/10 mb-4" />
                            <h3 className="font-serif text-lg font-bold text-white mb-2">No Change Orders</h3>
                            <p className="text-white/40 max-w-sm mx-auto">
                                There are no change orders recorded for this project yet. Change orders usually arise from customer requests or unforeseen site conditions.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

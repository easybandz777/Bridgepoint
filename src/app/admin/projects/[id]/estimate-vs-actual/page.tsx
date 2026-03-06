// @ts-nocheck
import { notFound } from 'next/navigation';
import {
    SAMPLE_PROJECTS,
    formatCurrency
} from '@/lib/projects';
import { ProjectTabNav } from '@/components/admin/project-tab-nav';
import { StatusBadge } from '@/components/admin/status-badge';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function EstVsActualPage({ params }: { params: { id: string } }) {
    const project = SAMPLE_PROJECTS.find(p => p.id === params.id);
    if (!project) notFound();

    return (
        <div>
            {/* Header */}
            <div className="mb-6">
                <h1 className="font-serif text-2xl font-bold text-white mb-1">{project.name}</h1>
                <p className="text-sm text-white/50">Line Item Cost Analysis (Estimate vs. Actual)</p>
            </div>

            {/* Navigation Tabs */}
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
                                <th className="px-5 py-3 font-semibold">Item & Description</th>
                                <th className="px-5 py-3 font-semibold">Phase / Category</th>
                                <th className="px-5 py-3 font-semibold text-right">Est. Cost</th>
                                <th className="px-5 py-3 font-semibold text-right">Act. Cost</th>
                                <th className="px-5 py-3 font-semibold text-right">Variance</th>
                                <th className="px-5 py-3 font-semibold text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {project.budgetItems.map(item => {
                                const variance = item.actualCost - item.estimatedCost;
                                const isOver = variance > 0;
                                const isUnder = variance < 0 && item.actualCost > 0; // Only under if cost > 0
                                const isSame = variance === 0 && item.actualCost > 0;

                                return (
                                    <tr key={item.id} className={`hover:bg-white/[0.02] transition-colors ${isOver ? 'bg-red-500/[0.02]' : ''}`}>
                                        <td className="px-5 py-4">
                                            <div className="font-medium text-white">{item.name}</div>
                                            <div className="text-xs text-white/40 mt-0.5">{item.description}</div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="text-white/80">{project.phases.find(p => p.id === item.phaseId)?.name || 'General'}</div>
                                            <div className="text-[10px] uppercase tracking-wide text-white/30 mt-0.5">{item.category}</div>
                                        </td>
                                        <td className="px-5 py-4 text-right font-mono text-white/60">
                                            {formatCurrency(item.estimatedCost)}
                                        </td>
                                        <td className={`px-5 py-4 text-right font-mono font-medium ${isOver ? 'text-red-400' : 'text-white'}`}>
                                            {formatCurrency(item.actualCost)}
                                        </td>
                                        <td className={`px-5 py-4 text-right font-mono font-bold ${isOver ? 'text-red-400' : (isUnder ? 'text-[#34d399]' : 'text-white/30')
                                            }`}>
                                            {variance > 0 ? '+' : ''}{formatCurrency(variance)}
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            {isOver ? (
                                                <AlertCircle size={16} className="text-red-400 mx-auto" strokeWidth={2.5} />
                                            ) : isUnder || isSame ? (
                                                <CheckCircle2 size={16} className="text-[#34d399] mx-auto" />
                                            ) : (
                                                <span className="text-[10px] uppercase text-white/30 font-semibold tracking-wider">Pending</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

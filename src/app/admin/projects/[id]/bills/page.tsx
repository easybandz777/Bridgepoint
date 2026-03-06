import { notFound } from 'next/navigation';
import { SAMPLE_PROJECTS } from '@/lib/projects';
import { SAMPLE_PAYOUTS } from '@/lib/job-costing';
import { SAMPLE_SUBCONTRACTORS } from '@/lib/subcontractors';
import { ProjectTabNav } from '@/components/admin/project-tab-nav';
import { StatusBadge } from '@/components/admin/status-badge';
import { formatCurrency } from '@/lib/projects';
import { FileText, Coins } from 'lucide-react';

export default function ProjectBillsPage({ params }: { params: { id: string } }) {
    const project = SAMPLE_PROJECTS.find(p => p.id === params.id);
    if (!project) notFound();

    const payouts = SAMPLE_PAYOUTS.filter(p => p.projectId === project.id);

    return (
        <div>
            {/* Header */}
            <div className="mb-6">
                <h1 className="font-serif text-2xl font-bold text-white mb-1">{project.name}</h1>
                <p className="text-sm text-white/50">Subcontractor Bills & Payout Approvals</p>
            </div>

            {/* Navigation Tabs */}
            <ProjectTabNav projectId={project.id} />

            <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead>
                            <tr className="bg-white/5 border-b border-white/5 text-[10px] uppercase tracking-wider text-white/40">
                                <th className="px-5 py-3 font-semibold">Subcontractor & Details</th>
                                <th className="px-5 py-3 font-semibold">Scope</th>
                                <th className="px-5 py-3 font-semibold text-right">Requested</th>
                                <th className="px-5 py-3 font-semibold text-right">Approved</th>
                                <th className="px-5 py-3 font-semibold text-center">Status</th>
                                <th className="px-5 py-3 font-semibold text-right">Submitted</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {payouts.map(payout => {
                                const sub = SAMPLE_SUBCONTRACTORS.find(s => s.id === payout.subcontractorId);
                                const isApproved = payout.approvedAmount > 0;
                                const isDisputed = payout.status === 'Disputed';

                                return (
                                    <tr key={payout.id} className="hover:bg-white/[0.02] transition-colors relative group">
                                        <td className="px-5 py-4">
                                            <div className="font-medium text-white mb-1">
                                                {sub ? sub.companyName : 'Unknown Sub'}
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-white/40">
                                                <span className="flex items-center gap-1 font-mono">
                                                    <FileText size={10} /> Inv: {payout.invoiceNumber}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-white/70">
                                            {payout.description}
                                        </td>
                                        <td className="px-5 py-4 text-right font-mono text-white">
                                            {formatCurrency(payout.requestedAmount)}
                                        </td>
                                        <td className={`px-5 py-4 text-right font-mono font-bold ${isApproved ? 'text-[#34d399]' : (isDisputed ? 'text-red-400' : 'text-white/30')
                                            }`}>
                                            {formatCurrency(payout.approvedAmount)}
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <StatusBadge status={payout.status} />
                                        </td>
                                        <td className="px-5 py-4 text-right text-xs text-white/50">
                                            {payout.dateSubmitted}
                                        </td>

                                        {/* Action Menu (Hover) */}
                                        <td className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#1a1a1a] pl-4">
                                            <div className="flex bg-white/10 rounded-lg overflow-hidden border border-white/10">
                                                <button className="px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/10 transition-colors">
                                                    Review
                                                </button>
                                                {payout.status === 'Pending' && (
                                                    <button className="px-3 py-2 bg-[#b8956a]/20 text-[#b8956a] text-xs font-semibold hover:bg-[#b8956a]/30 transition-colors border-l border-white/10">
                                                        Approve
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {payouts.length === 0 && (
                        <div className="py-16 text-center">
                            <Coins size={48} className="mx-auto text-white/10 mb-4" />
                            <h3 className="font-serif text-lg font-bold text-white mb-2">No Bills Found</h3>
                            <p className="text-white/40 max-w-sm mx-auto">
                                No subcontractor payout requests have been submitted for this project yet.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

import { notFound } from 'next/navigation';
import { SAMPLE_SUBCONTRACTORS } from '@/lib/subcontractors';
import { SAMPLE_PAYOUTS } from '@/lib/job-costing';
import { SAMPLE_PROJECTS, formatCurrency } from '@/lib/projects';
import { SubTabNav } from '@/components/admin/sub-tab-nav';
import { StatusBadge } from '@/components/admin/status-badge';
import { CostCard } from '@/components/admin/cost-card';
import { HandCoins, DollarSign, Clock } from 'lucide-react';
import Link from 'next/link';

export default function SubcontractorFinancialsPage({ params }: { params: { id: string } }) {
    const sub = SAMPLE_SUBCONTRACTORS.find(s => s.id === params.id);
    if (!sub) notFound();

    const payouts = SAMPLE_PAYOUTS.filter(p => p.subcontractorId === sub.id);

    // Calculate totals based on sample payouts
    const totalPaid = payouts.filter(p => p.status === 'Paid').reduce((sum, p) => sum + p.approvedAmount, 0);
    const totalPending = payouts.filter(p => ['Pending', 'Approved', 'Partially Approved'].includes(p.status)).reduce((sum, p) => sum + p.requestedAmount, 0);

    return (
        <div>
            {/* Header */}
            <div className="mb-6">
                <h1 className="font-serif text-2xl font-bold text-white mb-1">{sub.companyName}</h1>
                <p className="text-sm text-white/50">Financial History & Payouts</p>
            </div>

            <SubTabNav subId={sub.id} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <CostCard
                    title="YTD Total Paid"
                    amount={totalPaid}
                    icon={<DollarSign />}
                />
                <CostCard
                    title="Total Outstanding / Pending"
                    amount={totalPending}
                    icon={<Clock />}
                />
            </div>

            <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-white/6 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-white">Payout History</h2>
                    <button className="text-xs font-semibold text-[#b8956a] hover:text-[#cbb08c] transition-colors">
                        Download Statement
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead>
                            <tr className="bg-white/5 border-b border-white/5 text-[10px] uppercase tracking-wider text-white/40">
                                <th className="px-5 py-3 font-semibold">Invoice / Reference</th>
                                <th className="px-5 py-3 font-semibold">Project</th>
                                <th className="px-5 py-3 font-semibold text-right">Requested</th>
                                <th className="px-5 py-3 font-semibold text-right">Approved</th>
                                <th className="px-5 py-3 font-semibold text-center">Status</th>
                                <th className="px-5 py-3 font-semibold text-right">Date Sub.</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {payouts.map(payout => {
                                const project = SAMPLE_PROJECTS.find(p => p.id === payout.projectId);

                                return (
                                    <tr key={payout.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="px-5 py-4">
                                            <div className="font-mono text-white mb-1">{payout.invoiceNumber}</div>
                                            <div className="text-xs text-white/40">{payout.description}</div>
                                        </td>
                                        <td className="px-5 py-4">
                                            {project ? (
                                                <Link href={`/admin/projects/${project.id}/bills`} className="text-white hover:text-[#b8956a] transition-colors">
                                                    {project.name}
                                                </Link>
                                            ) : (
                                                <span className="text-white/50">Unknown Project</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-4 text-right font-mono text-white">
                                            {formatCurrency(payout.requestedAmount)}
                                        </td>
                                        <td className="px-5 py-4 text-right font-mono font-bold text-[#34d399]">
                                            {formatCurrency(payout.approvedAmount)}
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <StatusBadge status={payout.status} />
                                        </td>
                                        <td className="px-5 py-4 text-right text-white/50">
                                            {payout.dateSubmitted}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {payouts.length === 0 && (
                        <div className="py-16 text-center text-white/40">
                            <HandCoins size={48} className="mx-auto text-white/10 mb-4" />
                            <h3 className="font-serif text-lg font-bold text-white mb-2">No Payout Records</h3>
                            <p className="max-w-sm mx-auto">This subcontractor has no recorded payout requests.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

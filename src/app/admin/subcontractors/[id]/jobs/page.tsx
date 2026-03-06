// @ts-nocheck
import { notFound } from 'next/navigation';
import { SAMPLE_SUBCONTRACTORS, SAMPLE_ASSIGNMENTS } from '@/lib/subcontractors';
import { SAMPLE_PROJECTS, formatCurrency } from '@/lib/projects';
import { SubTabNav } from '@/components/admin/sub-tab-nav';
import { StatusBadge } from '@/components/admin/status-badge';
import Link from 'next/link';

export default function SubcontractorJobsPage({ params }: { params: { id: string } }) {
    const sub = SAMPLE_SUBCONTRACTORS.find(s => s.id === params.id);
    if (!sub) notFound();

    const assignments = SAMPLE_ASSIGNMENTS.filter(a => a.subcategoryId === sub.id);

    return (
        <div>
            {/* Header */}
            <div className="mb-6">
                <h1 className="font-serif text-2xl font-bold text-white mb-1">{sub.companyName}</h1>
                <p className="text-sm text-white/50">Job History & Active Assignments</p>
            </div>

            <SubTabNav subId={sub.id} />

            <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead>
                            <tr className="bg-white/5 border-b border-white/5 text-[10px] uppercase tracking-wider text-white/40">
                                <th className="px-5 py-3 font-semibold">Project & Scope</th>
                                <th className="px-5 py-3 font-semibold text-right">Agreed Price</th>
                                <th className="px-5 py-3 font-semibold text-center">Status</th>
                                <th className="px-5 py-3 font-semibold text-right">Completion</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {assignments.map(assignment => {
                                const project = SAMPLE_PROJECTS.find(p => p.id === assignment.projectId);

                                return (
                                    <tr key={assignment.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-5 py-4">
                                            {project ? (
                                                <Link href={`/admin/projects/${project.id}`} className="block">
                                                    <div className="font-medium text-white group-hover:text-[#b8956a] transition-colors mb-1">
                                                        {project.name}
                                                    </div>
                                                </Link>
                                            ) : (
                                                <div className="font-medium text-white mb-1">Unknown Project</div>
                                            )}
                                            <div className="text-white/60 text-xs">
                                                {assignment.scopeDescription}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-right font-mono text-white">
                                            {formatCurrency(assignment.agreedPrice)}
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <StatusBadge status={assignment.status} />
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <span className="font-semibold text-white">{assignment.completionPct}%</span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {assignments.length === 0 && (
                        <div className="py-12 text-center text-white/40">
                            No jobs assigned to this subcontractor.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

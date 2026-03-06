import { notFound } from 'next/navigation';
import { SAMPLE_PROJECTS } from '@/lib/projects';
import { SAMPLE_ASSIGNMENTS, SAMPLE_SUBCONTRACTORS } from '@/lib/subcontractors';
import { ProjectTabNav } from '@/components/admin/project-tab-nav';
import { StatusBadge } from '@/components/admin/status-badge';
import { formatCurrency } from '@/lib/projects';
import { UserPlus, ShieldAlert, Star } from 'lucide-react';
import Link from 'next/link';

export default function ProjectSubcontractorsPage({ params }: { params: { id: string } }) {
    const project = SAMPLE_PROJECTS.find(p => p.id === params.id);
    if (!project) notFound();

    // Find assignments for this specific project
    const projectAssignments = SAMPLE_ASSIGNMENTS.filter(a => a.projectId === project.id);

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
                <div>
                    <h1 className="font-serif text-2xl font-bold text-white mb-1">{project.name}</h1>
                    <p className="text-sm text-white/50">Manage Subcontractors & Trade Assignments</p>
                </div>
                <button className="h-10 px-5 bg-[#b8956a] text-black text-sm font-semibold rounded-full flex items-center justify-center gap-2 hover:bg-[#cbb08c] transition-colors whitespace-nowrap">
                    <UserPlus size={16} />
                    Assign Sub
                </button>
            </div>

            {/* Navigation Tabs */}
            <ProjectTabNav projectId={project.id} />

            <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-white/6">
                    <h2 className="text-sm font-semibold text-white">Active Assignments</h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead>
                            <tr className="bg-white/5 border-b border-white/5 text-[10px] uppercase tracking-wider text-white/40">
                                <th className="px-5 py-3 font-semibold">Subcontractor</th>
                                <th className="px-5 py-3 font-semibold">Scope / Phase</th>
                                <th className="px-5 py-3 font-semibold text-right">Agreed Price</th>
                                <th className="px-5 py-3 font-semibold text-center">Status</th>
                                <th className="px-5 py-3 font-semibold text-right">Completion</th>
                                <th className="px-5 py-3 font-semibold text-center">Compliance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {projectAssignments.map(assignment => {
                                const sub = SAMPLE_SUBCONTRACTORS.find(s => s.id === assignment.subcategoryId);
                                const phaseName = project.phases.find(p => p.id === assignment.phaseId)?.name || 'General';
                                const hasComplianceIssue = sub && sub.insuranceExpiry ? new Date(sub.insuranceExpiry) < new Date() : false;

                                return (
                                    <tr key={assignment.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="px-5 py-4">
                                            {sub ? (
                                                <Link href={`/admin/subcontractors/${sub.id}`} className="block group">
                                                    <div className="font-medium text-white group-hover:text-[#b8956a] transition-colors">
                                                        {sub.companyName}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-xs text-white/50">{sub.primaryContact}</span>
                                                        <span className="flex items-center text-[10px] text-[#fbbf24]">
                                                            <Star size={10} className="mr-0.5 fill-[#fbbf24]" /> {sub.metrics.averageRating}
                                                        </span>
                                                    </div>
                                                </Link>
                                            ) : (
                                                <span className="text-white/50 italic">Unknown Sub</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="text-white">{assignment.scopeDescription}</div>
                                            <div className="text-[10px] uppercase text-white/40 tracking-wider mt-1">{phaseName}</div>
                                        </td>
                                        <td className="px-5 py-4 text-right font-mono text-white">
                                            {formatCurrency(assignment.agreedPrice)}
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <StatusBadge status={assignment.status} />
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <div className="font-semibold text-white mb-1">{assignment.completionPct}%</div>
                                            <div className="h-1 w-16 bg-black/40 rounded-full ml-auto overflow-hidden">
                                                <div
                                                    className="h-full bg-[#34d399] rounded-full"
                                                    style={{ width: `${assignment.completionPct}%` }}
                                                />
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            {hasComplianceIssue ? (
                                                <div className="inline-flex items-center justify-center p-1.5 rounded-full bg-red-400/10 text-red-400" title="Insurance Expired">
                                                    <ShieldAlert size={16} />
                                                </div>
                                            ) : (
                                                <span className="text-white/30 text-xs">—</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {projectAssignments.length === 0 && (
                        <div className="py-12 text-center">
                            <p className="text-white/40">No subcontractors assigned to this project yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

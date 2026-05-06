'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { ProjectTabNav } from '@/components/admin/project-tab-nav';
import { StatusBadge } from '@/components/admin/status-badge';
import { UserPlus, ShieldAlert, Star, Loader2 } from 'lucide-react';
import { getProject, DbProjectFull, n, fmtCurrency } from '@/lib/project-api';

interface ProjectAssignmentRow {
    assignment_id: string;
    subcontractor_id: string;
    phase_id: string | null;
    scope_of_work: string;
    assignment_status: string;
    agreed_amount: number | string;
    billed_amount: number | string;
    approved_amount: number | string;
    paid_amount: number | string;
    completion_pct: number | string;
    company_name: string | null;
    contact_person: string | null;
    sub_rating: number | string | null;
    insurance_expiry: string | null;
    phase_name: string | null;
}

export default function ProjectSubcontractorsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [project, setProject] = useState<DbProjectFull | null>(null);
    const [assignments, setAssignments] = useState<ProjectAssignmentRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const [p, asn] = await Promise.all([
                    getProject(id),
                    fetch(`/api/projects/${id}/subcontractors`, { cache: 'no-store' }).then((r) => {
                        if (!r.ok) throw new Error('Failed to load assignments');
                        return r.json();
                    }),
                ]);
                setProject(p);
                setAssignments(asn);
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

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
                <div>
                    <h1 className="font-serif text-2xl font-bold text-white mb-1">{project.name}</h1>
                    <p className="text-sm text-white/50">Subcontractors & Trade Assignments</p>
                </div>
                <Link
                    href={`/admin/subcontractors?project=${project.id}`}
                    className="h-10 px-5 bg-white/5 border border-white/10 text-white/80 text-sm font-semibold rounded-full flex items-center justify-center gap-2 hover:bg-white/10 transition-colors whitespace-nowrap"
                >
                    <UserPlus size={16} />
                    Browse Subs
                </Link>
            </div>

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
                                <th className="px-5 py-3 font-semibold text-right">Agreed</th>
                                <th className="px-5 py-3 font-semibold text-right">Paid</th>
                                <th className="px-5 py-3 font-semibold text-center">Status</th>
                                <th className="px-5 py-3 font-semibold text-right">Completion</th>
                                <th className="px-5 py-3 font-semibold text-center">Compliance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {assignments.map((a) => {
                                const insExpired = a.insurance_expiry
                                    ? new Date(a.insurance_expiry) < new Date()
                                    : false;
                                return (
                                    <tr key={a.assignment_id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="px-5 py-4">
                                            <Link
                                                href={`/admin/subcontractors/${a.subcontractor_id}`}
                                                className="block group"
                                            >
                                                <div className="font-medium text-white group-hover:text-[#b8956a] transition-colors">
                                                    {a.company_name ?? 'Unknown sub'}
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-white/50">
                                                        {a.contact_person ?? ''}
                                                    </span>
                                                    {a.sub_rating != null && (
                                                        <span className="flex items-center text-[10px] text-[#fbbf24]">
                                                            <Star size={10} className="mr-0.5 fill-[#fbbf24]" /> {n(a.sub_rating).toFixed(1)}
                                                        </span>
                                                    )}
                                                </div>
                                            </Link>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="text-white">{a.scope_of_work}</div>
                                            <div className="text-[10px] uppercase text-white/40 tracking-wider mt-1">
                                                {a.phase_name ?? 'General'}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-right font-mono text-white">
                                            {fmtCurrency(a.agreed_amount)}
                                        </td>
                                        <td className="px-5 py-4 text-right font-mono text-white/70">
                                            {fmtCurrency(a.paid_amount)}
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <StatusBadge status={a.assignment_status} />
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <div className="font-semibold text-white mb-1">
                                                {n(a.completion_pct)}%
                                            </div>
                                            <div className="h-1 w-16 bg-black/40 rounded-full ml-auto overflow-hidden">
                                                <div
                                                    className="h-full bg-[#34d399] rounded-full"
                                                    style={{ width: `${n(a.completion_pct)}%` }}
                                                />
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            {insExpired ? (
                                                <div
                                                    className="inline-flex items-center justify-center p-1.5 rounded-full bg-red-400/10 text-red-400"
                                                    title="Insurance Expired"
                                                >
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

                    {assignments.length === 0 && (
                        <div className="py-12 text-center">
                            <p className="text-white/40">No subcontractors assigned to this project yet.</p>
                            <p className="text-white/30 text-xs mt-2">
                                Use the Subcontractors module to add an assignment for this project.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

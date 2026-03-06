import { notFound } from 'next/navigation';
import {
    SAMPLE_PROJECTS,
    formatCurrency
} from '@/lib/projects';
import { ProjectTabNav } from '@/components/admin/project-tab-nav';
import { StatusBadge } from '@/components/admin/status-badge';
import { Calendar, CheckCircle2, CircleDashed, Users, MoreHorizontal } from 'lucide-react';

export default function ProjectPhasesPage({ params }: { params: { id: string } }) {
    const project = SAMPLE_PROJECTS.find(p => p.id === params.id);
    if (!project) notFound();

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="font-serif text-2xl font-bold text-white mb-1">{project.name}</h1>
                    <p className="text-sm text-white/50">Production Phases & Schedule</p>
                </div>
                <button className="h-10 px-5 bg-white/10 text-white text-sm font-semibold rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
                    Add Phase
                </button>
            </div>

            {/* Navigation Tabs */}
            <ProjectTabNav projectId={project.id} />

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {project.phases.map(phase => {
                    const isComplete = phase.status === 'Completed';
                    const isActive = phase.status === 'In Progress';

                    return (
                        <div key={phase.id} className={`bg-[#1a1a1a] border rounded-2xl p-5 sm:p-6 transition-all ${isActive ? 'border-[#b8956a]/50 shadow-[0_0_15px_rgba(184,149,106,0.1)]' : 'border-white/6'
                            }`}>
                            <div className="flex items-start justify-between mb-5">
                                <div className="flex items-center gap-3">
                                    {isComplete ? (
                                        <CheckCircle2 className="text-[#34d399]" />
                                    ) : (
                                        <CircleDashed className={isActive ? 'text-[#b8956a]' : 'text-white/20'} />
                                    )}
                                    <h2 className={`font-serif text-lg font-bold ${isComplete ? 'text-white/50' : 'text-white'}`}>
                                        {phase.name}
                                    </h2>
                                </div>
                                <div className="flex items-center gap-2">
                                    <StatusBadge status={phase.status} />
                                    <button className="w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:bg-white/10 hover:text-white transition-colors">
                                        <MoreHorizontal size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Budget</p>
                                    <p className="text-sm font-semibold text-white">{formatCurrency(phase.estimatedCost)}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Actual</p>
                                    <p className={`text-sm font-semibold ${phase.actualCost > phase.estimatedCost ? 'text-red-400' : 'text-white'}`}>
                                        {formatCurrency(phase.actualCost)}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-[10px] uppercase tracking-widest text-white/40 flex items-center gap-1.5">
                                            <Calendar size={12} /> Timeline
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 text-sm">
                                        <span className="text-white/60">{phase.startDate || 'TBD'}</span>
                                        <span className="text-white/20">→</span>
                                        <span className="text-white/60">{phase.endDate || 'TBD'}</span>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-[10px] uppercase tracking-widest text-white/40 flex items-center gap-1.5">
                                            <Users size={12} /> Assigned Teams
                                        </span>
                                    </div>
                                    <div className="p-3 rounded-xl bg-white/5 border border-white/5 min-h-[46px] flex items-center">
                                        {/* Placeholder for actual sub assignments linked to this phase */}
                                        <span className="text-sm text-white/40 italic">No subcontractors assigned yet</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 pt-5 border-t border-white/6">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[10px] uppercase tracking-widest text-white/40">Completion</span>
                                    <span className="text-xs font-bold text-white">{phase.completionPct}%</span>
                                </div>
                                <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${isComplete ? 'bg-[#34d399]' : 'bg-[#b8956a]'}`}
                                        style={{ width: `${phase.completionPct}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            {project.phases.length === 0 && (
                <div className="py-16 text-center border border-white/5 border-dashed rounded-2xl bg-white/[0.02]">
                    <p className="text-white/40">No phases defined for this project.</p>
                </div>
            )}
        </div>
    );
}

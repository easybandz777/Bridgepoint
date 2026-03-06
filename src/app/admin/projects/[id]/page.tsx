import { notFound } from 'next/navigation';
import {
    SAMPLE_PROJECTS,
    calcEstimatedGP,
    calcActualGP,
    calcMarginPct,
    formatCurrency,
    overallCompletionPct
} from '@/lib/projects';
import { ProjectTabNav } from '@/components/admin/project-tab-nav';
import { StatusBadge } from '@/components/admin/status-badge';
import { ProfitabilityBar } from '@/components/admin/profitability-bar';
import { Clock, Calendar, MapPin, User, Phone, Mail, FileText } from 'lucide-react';

export default function ProjectOverviewPage({ params }: { params: { id: string } }) {
    const project = SAMPLE_PROJECTS.find(p => p.id === params.id);
    if (!project) notFound();

    const estGP = calcEstimatedGP(project);
    const actGP = calcActualGP(project);
    const estMargin = calcMarginPct(project.estimatedRevenue, estGP);
    const actMargin = calcMarginPct(project.actualRevenue, actGP); // Note: Revenue might be partial mid-job
    const completion = overallCompletionPct(project);

    return (
        <div>
            {/* Sticky Header / Summary Card */}
            <div className="bg-[#1a1a1a] border border-white/10 rounded-3xl p-6 sm:p-8 mb-8 sticky top-6 z-10 shadow-2xl">
                <div className="flex flex-col lg:flex-row justify-between gap-8">
                    {/* Left: Identity */}
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="px-2 py-1 bg-white/5 rounded text-xs font-mono text-white/40 border border-white/10">
                                {project.projectNumber}
                            </span>
                            <StatusBadge status={project.status} />
                        </div>
                        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white mb-2 leading-tight">
                            {project.name}
                        </h1>
                        <p className="text-white/60 flex items-center gap-2">
                            <MapPin size={16} className="text-[#b8956a]" />
                            {project.address}
                        </p>
                    </div>

                    {/* Right: Key Financials */}
                    <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4 lg:gap-8 border-t lg:border-t-0 lg:border-l border-white/6 pt-6 lg:pt-0 lg:pl-8">
                        <div>
                            <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Total Contract</p>
                            <p className="text-xl sm:text-2xl font-bold text-white">{formatCurrency(project.estimatedRevenue)}</p>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Costs To Date</p>
                            <p className="text-xl sm:text-2xl font-bold text-white">{formatCurrency(project.actualCost)}</p>
                        </div>
                        <div className="sm:col-span-2">
                            <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Current Margin vs Target ({estMargin.toFixed(1)}%)</p>
                            <ProfitabilityBar marginPct={actMargin} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <ProjectTabNav projectId={project.id} />

            {/* Overview Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Main Column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Schedule & Progress */}
                    <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                                <Clock size={16} className="text-[#b8956a]" /> Schedule & Progress
                            </h2>
                            <span className="text-xs font-bold text-[#b8956a]">{completion}% Complete</span>
                        </div>

                        <div className="h-2 bg-black/40 rounded-full overflow-hidden mb-6">
                            <div
                                className="h-full bg-[#b8956a] rounded-full transition-all duration-1000"
                                style={{ width: `${Math.min(completion, 100)}%` }}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Target Start</p>
                                <p className="text-sm font-semibold text-white flex items-center gap-2">
                                    <Calendar size={14} className="text-white/20" /> {project.startDate}
                                </p>
                            </div>
                            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Target Completion</p>
                                <p className="text-sm font-semibold text-white flex items-center gap-2">
                                    <Calendar size={14} className="text-white/20" /> {project.targetCompletionDate}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Phase Snapshot */}
                    <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-sm font-semibold text-white">Active Phases</h2>
                        </div>
                        <div className="space-y-3">
                            {project.phases.filter(p => p.status === 'In Progress' || p.status === 'Scheduled').map(phase => (
                                <div key={phase.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <StatusBadge status={phase.status} />
                                        <span className="text-sm font-medium text-white">{phase.name}</span>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-semibold text-white">{phase.completionPct}%</p>
                                        <p className="text-[10px] text-white/40">{formatCurrency(phase.actualCost)} spent</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar Column */}
                <div className="space-y-6">
                    {/* Client Info */}
                    <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6">
                        <h2 className="text-sm font-semibold text-white mb-6 flex items-center gap-2">
                            <User size={16} className="text-[#b8956a]" /> Client Details
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Name</p>
                                <p className="text-sm font-medium text-white">{project.clientName}</p>
                            </div>
                            {project.clientId && (
                                <>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Contact</p>
                                        <p className="text-sm font-medium text-white flex items-center gap-2 mb-1">
                                            <Phone size={12} className="text-white/20" /> (555) 123-4567
                                        </p>
                                        <p className="text-sm font-medium text-white flex items-center gap-2">
                                            <Mail size={12} className="text-white/20" /> client@example.com
                                        </p>
                                    </div>
                                    <div className="pt-4 border-t border-white/6">
                                        <button className="text-xs font-semibold text-[#b8956a] hover:text-[#cbb08c] flex items-center gap-1 transition-colors">
                                            <FileText size={12} /> View Original Estimate
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Important Alerts */}
                    <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
                        <h2 className="text-sm font-semibold text-red-400 mb-4 tracking-wide uppercase">Requires Attention</h2>
                        <ul className="space-y-3">
                            <li className="flex gap-2 text-sm text-red-200/70 leading-snug">
                                <span className="text-red-400 shrink-0">•</span>
                                Demo phase costs have exceeded estimate by $450 (15%)
                            </li>
                            <li className="flex gap-2 text-sm text-red-200/70 leading-snug">
                                <span className="text-red-400 shrink-0">•</span>
                                Pending Change Order #1 requires customer approval
                            </li>
                        </ul>
                    </div>
                </div>

            </div>
        </div>
    );
}

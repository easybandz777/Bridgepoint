'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Filter, AlertCircle, Clock, ChevronRight } from 'lucide-react';
import {
    ProjectStatus,
    calcEstimatedGP,
    calcActualGP,
    calcMarginPct,
    isOverBudget,
    overallCompletionPct,
    SAMPLE_PROJECTS
} from '@/lib/projects';
import { formatCurrency } from '@/lib/estimates';
import { StatusBadge } from '@/components/admin/status-badge';
import { ProfitabilityBar } from '@/components/admin/profitability-bar';

export default function ProjectsPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'All'>('All');

    // Stats
    const activeProjects = SAMPLE_PROJECTS.filter(p => p.status === 'Active');
    const totalActiveValue = activeProjects.reduce((sum, p) => sum + p.estimatedRevenue, 0);
    const projectsOverBudget = activeProjects.filter(p => isOverBudget(p)).length;

    // Filter projects
    const filteredProjects = SAMPLE_PROJECTS.filter(p => {
        const matchesSearch =
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.projectNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.clientName.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === 'All' || p.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                <div>
                    <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white mb-2">Projects</h1>
                    <p className="text-sm text-white/50">Manage active jobs, track costs, and assign subcontractors.</p>
                </div>
                <Link
                    href="/admin/projects/new"
                    className="h-10 px-5 bg-[#b8956a] text-black text-sm font-semibold rounded-full flex items-center justify-center gap-2 hover:bg-[#cbb08c] transition-colors whitespace-nowrap"
                >
                    <Plus size={16} />
                    New Project
                </Link>
            </div>

            {/* Quick Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#b8956a] mb-1">Active Projects</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-white">{activeProjects.length}</span>
                        <span className="text-xs text-white/40">jobs in progress</span>
                    </div>
                </div>
                <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#b8956a] mb-1">Total Active Value</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-white">{formatCurrency(totalActiveValue)}</span>
                        <span className="text-xs text-white/40">estimated revenue</span>
                    </div>
                </div>
                <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-5 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#b8956a] mb-1">Cost Overruns</p>
                        <div className="flex items-baseline gap-2">
                            <span className={`text-2xl font-bold ${projectsOverBudget > 0 ? 'text-red-400' : 'text-white'}`}>
                                {projectsOverBudget}
                            </span>
                            <span className="text-xs text-white/40">jobs over budget threshold</span>
                        </div>
                    </div>
                    {projectsOverBudget > 0 && (
                        <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-400">
                            <AlertCircle size={20} />
                        </div>
                    )}
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                    <input
                        type="text"
                        placeholder="Search projects, clients..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-10 pl-10 pr-4 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#b8956a]/50 focus:bg-white/10 transition-all font-sans"
                    />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
                    <Filter className="text-white/20 mr-1 shrink-0" size={14} />
                    {['All', 'Planning', 'Active', 'Completed', 'On Hold'].map(status => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status as any)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${statusFilter === status
                                ? 'bg-white/15 text-white'
                                : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                                }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Project Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {filteredProjects.map(project => {
                    const estGP = calcEstimatedGP(project);
                    const actGP = calcActualGP(project);
                    const estMargin = calcMarginPct(project.estimatedRevenue, estGP);
                    const actMargin = calcMarginPct(project.actualRevenue, actGP); // Note: Revenue might be partial, so margin is tricky mid-job. We'll use estimated margin for target, and current for actual.

                    const isOver = isOverBudget(project);
                    const completion = overallCompletionPct(project);

                    return (
                        <Link
                            key={project.id}
                            href={`/admin/projects/${project.id}`}
                            className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-5 hover:border-white/10 hover:bg-[#1f1f1f] transition-all group flex flex-col"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] font-mono text-white/30">{project.projectNumber}</span>
                                        <StatusBadge status={project.status} />
                                    </div>
                                    <h3 className="font-serif text-lg font-bold text-white group-hover:text-[#b8956a] transition-colors leading-snug">
                                        {project.name}
                                    </h3>
                                    <p className="text-xs text-white/50 mt-1">{project.clientName}</p>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-white/10 transition-colors">
                                    <ChevronRight size={16} className="text-white/40 group-hover:text-white" />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 mb-5 p-3 rounded-xl bg-black/20">
                                <div>
                                    <p className="text-[10px] uppercase text-white/30 mb-0.5 tracking-wider">Revenue</p>
                                    <p className="text-sm font-semibold text-white">{formatCurrency(project.estimatedRevenue)}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase text-white/30 mb-0.5 tracking-wider">Costs (To Date)</p>
                                    <p className={`text-sm font-semibold ${isOver ? 'text-red-400' : 'text-white'}`}>
                                        {formatCurrency(project.actualCost)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase text-white/30 mb-0.5 tracking-wider">Target Margin</p>
                                    <p className="text-sm font-semibold text-white">{estMargin.toFixed(1)}%</p>
                                </div>
                            </div>

                            <div className="mt-auto pt-4 border-t border-white/6 flex items-center justify-between gap-6">
                                <div className="flex-1 max-w-[150px]">
                                    <ProfitabilityBar marginPct={actMargin} />
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <Clock size={12} className="text-white/20" />
                                    <span className="text-xs text-white/40">{completion}% Complete</span>
                                </div>
                            </div>
                        </Link>
                    );
                })}

                {filteredProjects.length === 0 && (
                    <div className="col-span-full py-16 text-center border border-white/5 border-dashed rounded-2xl bg-white/[0.02]">
                        <p className="text-white/40">No projects found matching your search.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

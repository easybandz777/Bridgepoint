'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Filter, AlertCircle, Clock, ChevronRight, Loader2 } from 'lucide-react';
import { StatusBadge } from '@/components/admin/status-badge';
import { ProfitabilityBar } from '@/components/admin/profitability-bar';
import {
    listProjects,
    DbProject,
    n,
    calcEstGP,
    calcActGP,
    marginPct,
    fmtCurrency,
} from '@/lib/project-api';

const STATUS_FILTERS = ['All', 'Planning', 'Active', 'Completed', 'On Hold'] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

function isOverBudget(p: DbProject): boolean {
    const est = n(p.estimated_cost);
    if (est === 0) return false;
    const variance = n(p.actual_cost) - est;
    const threshold = est * 0.10; // 10% threshold
    return variance > threshold;
}

export default function ProjectsPage() {
    const [projects, setProjects] = useState<DbProject[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [seeding, setSeeding] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');

    async function load() {
        setLoading(true);
        setError(null);
        try {
            const rows = await listProjects();
            setProjects(rows);
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    async function seedSample() {
        if (!confirm('Seed sample projects, phases, change orders, bills, and expenses? Safe to re-run.')) return;
        setSeeding(true);
        try {
            const r = await fetch('/api/projects/seed', { method: 'POST' });
            if (!r.ok) throw new Error(await r.text());
            await load();
        } catch (e) {
            alert(`Seed failed: ${e instanceof Error ? e.message : String(e)}`);
        } finally {
            setSeeding(false);
        }
    }

    // Stats
    const activeProjects = projects.filter((p) => p.status === 'Active');
    const totalActiveValue = activeProjects.reduce((sum, p) => sum + n(p.estimated_revenue), 0);
    const projectsOverBudget = activeProjects.filter((p) => isOverBudget(p)).length;

    // Filter
    const filtered = projects.filter((p) => {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
            p.name.toLowerCase().includes(q) ||
            p.project_number.toLowerCase().includes(q) ||
            p.client_name.toLowerCase().includes(q);
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
                <div className="flex items-center gap-2">
                    {projects.length === 0 && !loading && (
                        <button
                            onClick={seedSample}
                            disabled={seeding}
                            className="h-10 px-4 bg-white/5 border border-white/10 text-white/70 text-sm font-semibold rounded-full hover:bg-white/10 transition-colors disabled:opacity-50"
                        >
                            {seeding ? 'Seeding…' : 'Load Sample Data'}
                        </button>
                    )}
                    <Link
                        href="/admin/projects/new"
                        className="h-10 px-5 bg-[#b8956a] text-black text-sm font-semibold rounded-full flex items-center justify-center gap-2 hover:bg-[#cbb08c] transition-colors whitespace-nowrap"
                    >
                        <Plus size={16} />
                        New Project
                    </Link>
                </div>
            </div>

            {/* Quick Stats */}
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
                        <span className="text-2xl font-bold text-white">{fmtCurrency(totalActiveValue)}</span>
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
                    {STATUS_FILTERS.map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                                statusFilter === status
                                    ? 'bg-white/15 text-white'
                                    : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                            }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Loading / error */}
            {loading && (
                <div className="py-16 flex items-center justify-center text-white/40 gap-2">
                    <Loader2 size={16} className="animate-spin" /> Loading projects…
                </div>
            )}

            {error && !loading && (
                <div className="py-12 px-6 border border-red-500/20 bg-red-500/5 rounded-2xl text-red-300 text-sm">
                    Failed to load projects: {error}
                </div>
            )}

            {/* Empty state */}
            {!loading && !error && projects.length === 0 && (
                <div className="py-16 text-center border border-white/5 border-dashed rounded-2xl bg-white/[0.02]">
                    <p className="text-white/60 mb-4 text-lg">No projects yet.</p>
                    <p className="text-white/40 text-sm mb-6">
                        Create one from scratch, or load sample data to explore the module.
                    </p>
                    <div className="flex items-center justify-center gap-3">
                        <Link
                            href="/admin/projects/new"
                            className="h-10 px-5 bg-[#b8956a] text-black text-sm font-semibold rounded-full inline-flex items-center gap-2 hover:bg-[#cbb08c] transition-colors"
                        >
                            <Plus size={16} /> Create Project
                        </Link>
                        <button
                            onClick={seedSample}
                            disabled={seeding}
                            className="h-10 px-5 bg-white/5 border border-white/10 text-white/70 text-sm font-semibold rounded-full hover:bg-white/10 transition-colors disabled:opacity-50"
                        >
                            {seeding ? 'Seeding…' : 'Load Sample Data'}
                        </button>
                    </div>
                </div>
            )}

            {/* Project Grid */}
            {!loading && !error && projects.length > 0 && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {filtered.map((project) => {
                        const estGP = calcEstGP(project);
                        const actGP = calcActGP(project);
                        const estM = marginPct(n(project.estimated_revenue), estGP);
                        const actM = marginPct(n(project.actual_revenue), actGP);
                        const completion = Math.round(n(project.avg_completion));
                        const isOver = isOverBudget(project);

                        return (
                            <Link
                                key={project.id}
                                href={`/admin/projects/${project.id}`}
                                className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-5 hover:border-white/10 hover:bg-[#1f1f1f] transition-all group flex flex-col"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-mono text-white/30">{project.project_number}</span>
                                            <StatusBadge status={project.status} />
                                        </div>
                                        <h3 className="font-serif text-lg font-bold text-white group-hover:text-[#b8956a] transition-colors leading-snug">
                                            {project.name}
                                        </h3>
                                        <p className="text-xs text-white/50 mt-1">{project.client_name}</p>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-white/10 transition-colors">
                                        <ChevronRight size={16} className="text-white/40 group-hover:text-white" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4 mb-5 p-3 rounded-xl bg-black/20">
                                    <div>
                                        <p className="text-[10px] uppercase text-white/30 mb-0.5 tracking-wider">Revenue</p>
                                        <p className="text-sm font-semibold text-white">{fmtCurrency(project.estimated_revenue)}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase text-white/30 mb-0.5 tracking-wider">Costs (To Date)</p>
                                        <p className={`text-sm font-semibold ${isOver ? 'text-red-400' : 'text-white'}`}>
                                            {fmtCurrency(project.actual_cost)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase text-white/30 mb-0.5 tracking-wider">Target Margin</p>
                                        <p className="text-sm font-semibold text-white">{estM.toFixed(1)}%</p>
                                    </div>
                                </div>

                                <div className="mt-auto pt-4 border-t border-white/6 flex items-center justify-between gap-6">
                                    <div className="flex-1 max-w-[150px]">
                                        <ProfitabilityBar marginPct={actM} />
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <Clock size={12} className="text-white/20" />
                                        <span className="text-xs text-white/40">{completion}% Complete</span>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}

                    {filtered.length === 0 && (
                        <div className="col-span-full py-16 text-center border border-white/5 border-dashed rounded-2xl bg-white/[0.02]">
                            <p className="text-white/40">No projects match your search.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

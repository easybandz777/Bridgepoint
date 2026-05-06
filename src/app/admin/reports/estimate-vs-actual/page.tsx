'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
    ArrowLeft,
    Search,
    Filter,
    Download,
    ArrowUpRight,
    ArrowDownRight,
    Minus,
    ChevronRight,
    ChevronDown,
} from 'lucide-react';

interface ProjectRow {
    id: string;
    project_number: string;
    name: string;
    status: string;
    estimated_cost: number | string;
    actual_cost: number | string;
}

interface PhaseRow {
    id: string;
    project_id: string;
    name: string;
    status: string;
    phase_order: number;
    estimated_budget: number | string;
    actual_cost: number | string;
}

function toNum(v: unknown): number {
    if (v === null || v === undefined) return 0;
    if (typeof v === 'number') return v;
    const n = parseFloat(String(v));
    return Number.isFinite(n) ? n : 0;
}

function fmtCurrency(n: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(n);
}

export default function EstimateVsActualReportPage() {
    const [projects, setProjects] = useState<ProjectRow[]>([]);
    const [phasesByProject, setPhasesByProject] = useState<Map<string, PhaseRow[]>>(new Map());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [varianceFilter, setVarianceFilter] = useState<'All' | 'Over Budget' | 'Under Budget'>('All');
    const [expanded, setExpanded] = useState<Set<string>>(new Set());

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setLoading(true);
                const res = await fetch('/api/projects', { cache: 'no-store' });
                if (!res.ok) throw new Error(`status ${res.status}`);
                const data = await res.json();
                if (!cancelled) {
                    if (Array.isArray(data)) {
                        setProjects(data);
                        setError(null);
                    } else {
                        setProjects([]);
                        setError(data.error || 'Unknown error');
                    }
                }
            } catch (e) {
                if (!cancelled) {
                    setProjects([]);
                    setError(String(e));
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    async function togglePhases(projectId: string) {
        const next = new Set(expanded);
        if (next.has(projectId)) {
            next.delete(projectId);
            setExpanded(next);
            return;
        }
        next.add(projectId);
        setExpanded(next);

        if (!phasesByProject.has(projectId)) {
            try {
                const res = await fetch(`/api/projects/${projectId}/phases`, { cache: 'no-store' });
                if (res.ok) {
                    const phases = (await res.json()) as PhaseRow[] | { error: string };
                    if (Array.isArray(phases)) {
                        setPhasesByProject((prev) => new Map(prev).set(projectId, phases));
                    } else {
                        setPhasesByProject((prev) => new Map(prev).set(projectId, []));
                    }
                } else {
                    setPhasesByProject((prev) => new Map(prev).set(projectId, []));
                }
            } catch {
                setPhasesByProject((prev) => new Map(prev).set(projectId, []));
            }
        }
    }

    const enriched = useMemo(() => {
        return projects.map((p) => {
            const est = toNum(p.estimated_cost);
            const act = toNum(p.actual_cost);
            const variance = act - est; // positive = over
            const variancePct = est > 0 ? (variance / est) * 100 : 0;
            return {
                id: p.id,
                projectNumber: p.project_number,
                name: p.name,
                status: p.status,
                estimated: est,
                actual: act,
                variance,
                variancePct,
            };
        });
    }, [projects]);

    const filtered = useMemo(() => {
        const q = searchQuery.toLowerCase();
        return enriched.filter((p) => {
            const matchesSearch = p.name.toLowerCase().includes(q) || p.projectNumber.toLowerCase().includes(q);
            const matchesFilter =
                varianceFilter === 'All' ||
                (varianceFilter === 'Over Budget' && p.variance > 0) ||
                (varianceFilter === 'Under Budget' && p.variance < 0);
            return matchesSearch && matchesFilter && p.status !== 'Archived';
        });
    }, [enriched, searchQuery, varianceFilter]);

    const totals = useMemo(() => {
        const totalEst = filtered.reduce((s, p) => s + p.estimated, 0);
        const totalAct = filtered.reduce((s, p) => s + p.actual, 0);
        const totalVariance = totalAct - totalEst;
        return { totalEst, totalAct, totalVariance };
    }, [filtered]);

    function exportCsv() {
        const rows = [
            ['Project Number', 'Project', 'Status', 'Estimated Cost', 'Actual Cost', 'Variance', 'Variance %'],
            ...filtered.map((p) => [
                p.projectNumber,
                p.name,
                p.status,
                p.estimated.toFixed(2),
                p.actual.toFixed(2),
                p.variance.toFixed(2),
                p.variancePct.toFixed(2),
            ]),
        ];
        const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `estimate-vs-actual-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <Link href="/admin/reports" className="inline-flex items-center text-xs font-semibold uppercase tracking-widest text-[#b8956a] hover:text-[#cbb08c] transition-colors mb-4">
                    <ArrowLeft size={14} className="mr-2" />
                    Back to Reports
                </Link>
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                        <h1 className="font-serif text-3xl font-bold text-white mb-2">Estimate vs Actual</h1>
                        <p className="text-white/50 text-sm">Variance per project. Click any row to drill into phase-level variance.</p>
                    </div>
                    <button
                        onClick={exportCsv}
                        className="h-10 px-5 bg-white/10 text-white text-sm font-semibold rounded-full flex items-center justify-center gap-2 hover:bg-white/20 transition-colors whitespace-nowrap"
                    >
                        <Download size={16} />
                        Export CSV
                    </button>
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 rounded-2xl border border-red-500/20 bg-red-500/5 text-sm text-red-300">
                    Failed to load projects: {error}
                </div>
            )}

            {/* Aggregate Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                <KpiCell label="Total Estimated Cost" value={fmtCurrency(totals.totalEst)} loading={loading} />
                <KpiCell label="Total Actual Cost" value={fmtCurrency(totals.totalAct)} loading={loading} />
                <KpiCell
                    label="Net Variance"
                    value={`${totals.totalVariance >= 0 ? '+' : ''}${fmtCurrency(totals.totalVariance)}`}
                    accentColor={totals.totalVariance > 0 ? '#f87171' : '#34d399'}
                    loading={loading}
                />
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                    <input
                        type="text"
                        placeholder="Search projects..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-10 pl-10 pr-4 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#b8956a]/50 focus:bg-white/10 transition-all"
                    />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar w-full sm:w-auto">
                    <Filter className="text-white/20 mr-1 shrink-0" size={14} />
                    {(['All', 'Over Budget', 'Under Budget'] as const).map((status) => (
                        <button
                            key={status}
                            onClick={() => setVarianceFilter(status)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                                varianceFilter === status
                                    ? 'bg-white/15 text-white'
                                    : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                            }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead>
                            <tr className="bg-white/5 border-b border-white/5 text-[10px] uppercase tracking-wider text-white/40">
                                <th className="px-5 py-3 font-semibold w-8" />
                                <th className="px-5 py-3 font-semibold">Project</th>
                                <th className="px-5 py-3 font-semibold text-right">Estimated</th>
                                <th className="px-5 py-3 font-semibold text-right">Actual</th>
                                <th className="px-5 py-3 font-semibold text-right">Variance ($)</th>
                                <th className="px-5 py-3 font-semibold text-center">Variance (%)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                [0, 1, 2, 3].map((i) => (
                                    <tr key={i}>
                                        <td colSpan={6} className="px-5 py-4">
                                            <div className="h-6 bg-white/5 rounded animate-pulse" />
                                        </td>
                                    </tr>
                                ))
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-white/40 text-sm">
                                        No projects yet — run seed from the Dashboard to populate demo data.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((p) => {
                                    const isOver = p.variance > 0;
                                    const isOpen = expanded.has(p.id);
                                    const phases = phasesByProject.get(p.id);
                                    return (
                                        <Row
                                            key={p.id}
                                            project={p}
                                            isOver={isOver}
                                            isOpen={isOpen}
                                            phases={phases}
                                            onToggle={() => togglePhases(p.id)}
                                        />
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function Row({
    project,
    isOver,
    isOpen,
    phases,
    onToggle,
}: {
    project: { id: string; projectNumber: string; name: string; status: string; estimated: number; actual: number; variance: number; variancePct: number };
    isOver: boolean;
    isOpen: boolean;
    phases: PhaseRow[] | undefined;
    onToggle: () => void;
}) {
    return (
        <>
            <tr className="hover:bg-white/[0.02] transition-colors group cursor-pointer" onClick={onToggle}>
                <td className="px-5 py-4 align-top w-8">
                    <button
                        type="button"
                        className="text-white/40 hover:text-white"
                        aria-label={isOpen ? 'Collapse phases' : 'Expand phases'}
                    >
                        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                </td>
                <td className="px-5 py-4">
                    <Link href={`/admin/projects/${project.id}/financials`} onClick={(e) => e.stopPropagation()} className="block">
                        <div className="font-medium text-white group-hover:text-[#b8956a] transition-colors">{project.name}</div>
                        <div className="text-xs text-white/40 font-mono mt-0.5">{project.projectNumber} · {project.status}</div>
                    </Link>
                </td>
                <td className="px-5 py-4 text-right font-mono text-white/50">{fmtCurrency(project.estimated)}</td>
                <td className="px-5 py-4 text-right font-mono text-white/80">{fmtCurrency(project.actual)}</td>
                <td className={`px-5 py-4 text-right font-mono font-medium ${isOver ? 'text-red-400' : project.variance < 0 ? 'text-[#34d399]' : 'text-white/40'}`}>
                    {project.variance > 0 ? '+' : ''}{fmtCurrency(project.variance)}
                </td>
                <td className="px-5 py-4 text-center">
                    {Math.abs(project.variancePct) < 1 ? (
                        <span className="text-white/20">
                            <Minus size={14} />
                        </span>
                    ) : isOver ? (
                        <span className="inline-flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded bg-red-400/10 text-red-400 font-bold">
                            <ArrowUpRight size={12} /> {project.variancePct.toFixed(1)}%
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1 text-[#34d399] text-xs font-mono bg-[#34d399]/10 px-2 py-0.5 rounded">
                            <ArrowDownRight size={12} /> {Math.abs(project.variancePct).toFixed(1)}%
                        </span>
                    )}
                </td>
            </tr>
            {isOpen && (
                <tr className="bg-black/40">
                    <td colSpan={6} className="px-5 py-4">
                        {phases === undefined ? (
                            <div className="text-xs text-white/40">Loading phases…</div>
                        ) : phases.length === 0 ? (
                            <div className="text-xs text-white/40">No phases recorded for this project.</div>
                        ) : (
                            <div className="space-y-2">
                                <p className="text-[10px] font-semibold uppercase tracking-widest text-white/35 mb-3">Phase Variance</p>
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="text-white/40">
                                            <th className="text-left font-semibold py-1.5">Phase</th>
                                            <th className="text-right font-semibold py-1.5">Est. Budget</th>
                                            <th className="text-right font-semibold py-1.5">Actual</th>
                                            <th className="text-right font-semibold py-1.5">Variance</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/4">
                                        {[...phases].sort((a, b) => a.phase_order - b.phase_order).map((ph) => {
                                            const est = toNum(ph.estimated_budget);
                                            const act = toNum(ph.actual_cost);
                                            const v = act - est;
                                            return (
                                                <tr key={ph.id}>
                                                    <td className="py-1.5 text-white/80">{ph.name}</td>
                                                    <td className="py-1.5 text-right font-mono text-white/50">{fmtCurrency(est)}</td>
                                                    <td className="py-1.5 text-right font-mono text-white/80">{fmtCurrency(act)}</td>
                                                    <td className={`py-1.5 text-right font-mono ${v > 0 ? 'text-red-400' : v < 0 ? 'text-[#34d399]' : 'text-white/40'}`}>
                                                        {v > 0 ? '+' : ''}{fmtCurrency(v)}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </td>
                </tr>
            )}
        </>
    );
}

function KpiCell({
    label,
    value,
    accentColor,
    loading,
}: {
    label: string;
    value: string;
    accentColor?: string;
    loading: boolean;
}) {
    return (
        <div
            className="bg-[#1a1a1a] border rounded-2xl p-5"
            style={{
                borderColor: accentColor ? `${accentColor}33` : 'rgba(255,255,255,0.06)',
                background: accentColor ? `linear-gradient(135deg, #1a1a1a, ${accentColor}10)` : '#1a1a1a',
            }}
        >
            <p
                className="text-[10px] font-semibold uppercase tracking-widest mb-1"
                style={{ color: accentColor ?? 'rgba(255,255,255,0.4)' }}
            >
                {label}
            </p>
            {loading ? (
                <div className="h-7 bg-white/5 rounded animate-pulse" />
            ) : (
                <div
                    className="text-xl sm:text-2xl font-bold font-mono"
                    style={{ color: accentColor ?? '#fff' }}
                >
                    {value}
                </div>
            )}
        </div>
    );
}

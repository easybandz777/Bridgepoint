'use client';

import { use, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { ProjectTabNav } from '@/components/admin/project-tab-nav';
import { StatusBadge } from '@/components/admin/status-badge';
import { ProfitabilityBar } from '@/components/admin/profitability-bar';
import {
    Clock,
    Calendar,
    MapPin,
    User,
    Phone,
    Mail,
    FileText,
    Loader2,
    AlertCircle,
    Trash2,
    Save,
    Pencil,
} from 'lucide-react';
import {
    getProject,
    deleteProject,
    updateProject,
    DbProjectFull,
    n,
    fmtCurrency,
    calcEstGP,
    calcActGP,
    marginPct,
} from '@/lib/project-api';
import { useRouter } from 'next/navigation';

export default function ProjectOverviewPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();

    const [project, setProject] = useState<DbProjectFull | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editing, setEditing] = useState(false);

    const [form, setForm] = useState({
        name: '',
        status: 'Planning',
        clientName: '',
        clientEmail: '',
        clientPhone: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        description: '',
        startDate: '',
        endDate: '',
        projectManager: '',
        estimatedRevenue: 0,
        estimatedCost: 0,
    });

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const p = await getProject(id);
            setProject(p);
            setForm({
                name: p.name,
                status: p.status,
                clientName: p.client_name,
                clientEmail: p.client_email,
                clientPhone: p.client_phone,
                address: p.address,
                city: p.city,
                state: p.state,
                zip: p.zip,
                description: p.description,
                startDate: p.start_date ?? '',
                endDate: p.end_date ?? '',
                projectManager: p.project_manager,
                estimatedRevenue: n(p.estimated_revenue),
                estimatedCost: n(p.estimated_cost),
            });
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        load();
    }, [load]);

    async function handleSave() {
        if (!project) return;
        try {
            await updateProject(id, {
                name: form.name,
                status: form.status,
                clientName: form.clientName,
                clientEmail: form.clientEmail,
                clientPhone: form.clientPhone,
                address: form.address,
                city: form.city,
                state: form.state,
                zip: form.zip,
                description: form.description,
                startDate: form.startDate || null,
                endDate: form.endDate || null,
                projectManager: form.projectManager,
                estimatedRevenue: form.estimatedRevenue,
                estimatedCost: form.estimatedCost,
                actor: 'admin',
            });
            setEditing(false);
            await load();
        } catch (e) {
            alert(`Save failed: ${e instanceof Error ? e.message : String(e)}`);
        }
    }

    async function handleDelete() {
        if (!confirm(`Permanently delete "${project?.name}" and all its phases, change orders, bills, files, and expenses?`)) return;
        try {
            await deleteProject(id);
            router.push('/admin/projects');
        } catch (e) {
            alert(`Delete failed: ${e instanceof Error ? e.message : String(e)}`);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24 text-white/40 gap-2">
                <Loader2 size={16} className="animate-spin" /> Loading project…
            </div>
        );
    }
    if (error) {
        return (
            <div className="p-6 border border-red-500/20 bg-red-500/5 rounded-2xl text-red-300 text-sm">
                Failed to load project: {error}
            </div>
        );
    }
    if (!project) {
        return (
            <div className="py-24 text-center text-white/50">
                Project not found.
                <div className="mt-4">
                    <Link href="/admin/projects" className="text-[#b8956a] hover:text-[#cbb08c]">
                        Back to projects
                    </Link>
                </div>
            </div>
        );
    }

    const estGP = calcEstGP(project);
    const actGP = calcActGP(project);
    const estM = marginPct(n(project.estimated_revenue), estGP);
    const actM = marginPct(n(project.actual_revenue), actGP);

    const phasesAvg = project.phases.length
        ? Math.round(project.phases.reduce((s, p) => s + n(p.completion_pct), 0) / project.phases.length)
        : 0;
    const completion = phasesAvg;

    const activePhases = project.phases.filter((p) => p.status === 'In Progress' || p.status === 'Scheduled');

    const overBudget = n(project.actual_cost) > n(project.estimated_cost) * 1.10 && n(project.estimated_cost) > 0;
    const pendingCO = project.change_orders.filter((c) => c.status === 'Pending').length;
    const unpaidBills = project.bills.filter((b) => b.status !== 'Paid').reduce((s, b) => s + n(b.amount), 0);
    const expensesTotal = project.expenses.reduce((s, e) => s + n(e.amount), 0);

    return (
        <div>
            {/* Sticky Header / Summary */}
            <div className="bg-[#1a1a1a] border border-white/10 rounded-3xl p-6 sm:p-8 mb-8 shadow-2xl">
                <div className="flex flex-col lg:flex-row justify-between gap-8">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="px-2 py-1 bg-white/5 rounded text-xs font-mono text-white/40 border border-white/10">
                                {project.project_number}
                            </span>
                            <StatusBadge status={project.status} />
                        </div>
                        {editing ? (
                            <input
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                className="font-serif text-2xl sm:text-3xl font-bold text-white bg-transparent border-b border-white/20 focus:outline-none focus:border-[#b8956a] mb-2 w-full"
                            />
                        ) : (
                            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white mb-2 leading-tight">
                                {project.name}
                            </h1>
                        )}
                        {editing ? (
                            <input
                                autoComplete="street-address"
                                value={form.address}
                                onChange={(e) => setForm({ ...form, address: e.target.value })}
                                className="text-base sm:text-sm text-white/60 bg-transparent border-b border-white/20 focus:outline-none focus:border-[#b8956a] w-full"
                            />
                        ) : (
                            <p className="text-white/60 flex items-center gap-2">
                                <MapPin size={16} className="text-[#b8956a]" />
                                {project.address || 'No address on file'}
                            </p>
                        )}
                    </div>

                    <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4 lg:gap-6 border-t lg:border-t-0 lg:border-l border-white/6 pt-6 lg:pt-0 lg:pl-8">
                        <div>
                            <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Total Contract</p>
                            <p className="text-xl sm:text-2xl font-bold text-white">{fmtCurrency(project.estimated_revenue)}</p>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Costs To Date</p>
                            <p className="text-xl sm:text-2xl font-bold text-white">{fmtCurrency(project.actual_cost)}</p>
                        </div>
                        <div className="sm:col-span-2">
                            <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2">
                                Margin vs Target ({estM.toFixed(1)}%)
                            </p>
                            <ProfitabilityBar marginPct={actM} />
                        </div>
                    </div>
                </div>

                {/* Edit/Save/Delete */}
                <div className="flex items-center justify-end gap-2 pt-6 mt-6 border-t border-white/6">
                    {!editing && (
                        <>
                            <button
                                onClick={() => setEditing(true)}
                                className="h-9 px-4 bg-white/5 border border-white/10 text-white/70 rounded-full text-xs font-semibold hover:bg-white/10 transition-colors flex items-center gap-2"
                            >
                                <Pencil size={14} /> Edit Details
                            </button>
                            <button
                                onClick={handleDelete}
                                className="h-9 px-4 bg-red-500/10 border border-red-500/20 text-red-300 rounded-full text-xs font-semibold hover:bg-red-500/20 transition-colors flex items-center gap-2"
                            >
                                <Trash2 size={14} /> Delete
                            </button>
                        </>
                    )}
                    {editing && (
                        <>
                            <button
                                onClick={() => {
                                    setEditing(false);
                                    load();
                                }}
                                className="h-9 px-4 text-white/50 hover:text-white text-xs font-semibold transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="h-9 px-4 bg-[#b8956a] text-black rounded-full text-xs font-semibold hover:bg-[#cbb08c] transition-colors flex items-center gap-2"
                            >
                                <Save size={14} /> Save
                            </button>
                        </>
                    )}
                </div>
            </div>

            <ProjectTabNav projectId={project.id} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
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
                                {editing ? (
                                    <input
                                        type="date"
                                        value={form.startDate}
                                        onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                                        className="bg-transparent text-base sm:text-sm font-semibold text-white focus:outline-none [color-scheme:dark]"
                                    />
                                ) : (
                                    <p className="text-sm font-semibold text-white flex items-center gap-2">
                                        <Calendar size={14} className="text-white/20" /> {project.start_date ?? 'TBD'}
                                    </p>
                                )}
                            </div>
                            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Target Completion</p>
                                {editing ? (
                                    <input
                                        type="date"
                                        value={form.endDate}
                                        onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                                        className="bg-transparent text-base sm:text-sm font-semibold text-white focus:outline-none [color-scheme:dark]"
                                    />
                                ) : (
                                    <p className="text-sm font-semibold text-white flex items-center gap-2">
                                        <Calendar size={14} className="text-white/20" /> {project.end_date ?? 'TBD'}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-sm font-semibold text-white">Active Phases</h2>
                            <Link
                                href={`/admin/projects/${id}/phases`}
                                className="text-xs font-semibold text-[#b8956a] hover:text-[#cbb08c]"
                            >
                                Manage Phases →
                            </Link>
                        </div>
                        <div className="space-y-3">
                            {activePhases.length === 0 && (
                                <p className="text-sm text-white/40">No active phases right now.</p>
                            )}
                            {activePhases.map((phase) => (
                                <div key={phase.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <StatusBadge status={phase.status} />
                                        <span className="text-sm font-medium text-white">{phase.name}</span>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-semibold text-white">{n(phase.completion_pct)}%</p>
                                        <p className="text-[10px] text-white/40">{fmtCurrency(phase.actual_cost)} spent</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Phase Gantt strip */}
                    {project.phases.length > 0 && (
                        <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6">
                            <h2 className="text-sm font-semibold text-white mb-4">Phase Timeline</h2>
                            <div className="space-y-2">
                                {project.phases.map((phase) => {
                                    const color =
                                        phase.status === 'Completed'
                                            ? 'bg-[#34d399]'
                                            : phase.status === 'In Progress'
                                            ? 'bg-[#b8956a]'
                                            : phase.status === 'Blocked'
                                            ? 'bg-red-400'
                                            : 'bg-white/20';
                                    return (
                                        <div key={phase.id} className="flex items-center gap-3 text-xs">
                                            <span className="text-white/60 w-44 truncate">{phase.name}</span>
                                            <div className="flex-1 h-2 bg-black/40 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full ${color} rounded-full`}
                                                    style={{ width: `${Math.min(n(phase.completion_pct), 100)}%` }}
                                                />
                                            </div>
                                            <span className="text-white/40 w-16 text-right">{n(phase.completion_pct)}%</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6">
                        <h2 className="text-sm font-semibold text-white mb-6 flex items-center gap-2">
                            <User size={16} className="text-[#b8956a]" /> Client Details
                        </h2>
                        <div className="space-y-4 text-sm">
                            <div>
                                <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Name</p>
                                {editing ? (
                                    <input
                                        autoCapitalize="words"
                                        autoComplete="name"
                                        value={form.clientName}
                                        onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                                        className="bg-transparent border-b border-white/20 text-white w-full focus:outline-none text-base sm:text-sm"
                                    />
                                ) : (
                                    <p className="font-medium text-white">{project.client_name || '—'}</p>
                                )}
                            </div>
                            <div>
                                <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Email</p>
                                {editing ? (
                                    <input
                                        type="email"
                                        autoCapitalize="none"
                                        autoCorrect="off"
                                        spellCheck={false}
                                        autoComplete="email"
                                        inputMode="email"
                                        value={form.clientEmail}
                                        onChange={(e) => setForm({ ...form, clientEmail: e.target.value })}
                                        className="bg-transparent border-b border-white/20 text-white w-full focus:outline-none text-base sm:text-sm"
                                    />
                                ) : (
                                    <p className="font-medium text-white flex items-center gap-2">
                                        <Mail size={12} className="text-white/20" /> {project.client_email || '—'}
                                    </p>
                                )}
                            </div>
                            <div>
                                <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Phone</p>
                                {editing ? (
                                    <input
                                        type="tel"
                                        inputMode="tel"
                                        autoComplete="tel"
                                        value={form.clientPhone}
                                        onChange={(e) => setForm({ ...form, clientPhone: e.target.value })}
                                        className="bg-transparent border-b border-white/20 text-white w-full focus:outline-none text-base sm:text-sm"
                                    />
                                ) : (
                                    <p className="font-medium text-white flex items-center gap-2">
                                        <Phone size={12} className="text-white/20" /> {project.client_phone || '—'}
                                    </p>
                                )}
                            </div>
                            {project.estimate_id && !editing && (
                                <div className="pt-4 border-t border-white/6">
                                    <Link
                                        href={`/admin/estimates/${project.estimate_id}`}
                                        className="text-xs font-semibold text-[#b8956a] hover:text-[#cbb08c] flex items-center gap-1 transition-colors"
                                    >
                                        <FileText size={12} /> View Source Estimate{' '}
                                        {project.estimate_number ? `(${project.estimate_number})` : ''}
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick rail summary */}
                    <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6 space-y-3">
                        <h2 className="text-sm font-semibold text-white mb-2">At a Glance</h2>
                        <div className="flex justify-between text-sm">
                            <span className="text-white/50">Approved CO Revenue</span>
                            <span className="text-white">{fmtCurrency(project.approved_co_revenue ?? 0)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-white/50">Pending CO Revenue</span>
                            <span className="text-white">{fmtCurrency(project.pending_co_revenue ?? 0)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-white/50">Unpaid Bills</span>
                            <span className="text-white">{fmtCurrency(unpaidBills)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-white/50">Expenses Logged</span>
                            <span className="text-white">{fmtCurrency(expensesTotal)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-white/50">Internal Labor Cost</span>
                            <span className="text-white">{fmtCurrency(project.labor_cost)}</span>
                        </div>
                    </div>

                    {/* Alerts */}
                    {(overBudget || pendingCO > 0) && (
                        <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
                            <h2 className="text-sm font-semibold text-red-400 mb-4 tracking-wide uppercase flex items-center gap-2">
                                <AlertCircle size={14} /> Requires Attention
                            </h2>
                            <ul className="space-y-3">
                                {overBudget && (
                                    <li className="flex gap-2 text-sm text-red-200/70 leading-snug">
                                        <span className="text-red-400 shrink-0">•</span>
                                        Actual costs exceed budget by{' '}
                                        {fmtCurrency(n(project.actual_cost) - n(project.estimated_cost))}
                                    </li>
                                )}
                                {pendingCO > 0 && (
                                    <li className="flex gap-2 text-sm text-red-200/70 leading-snug">
                                        <span className="text-red-400 shrink-0">•</span>
                                        {pendingCO} change order{pendingCO > 1 ? 's' : ''} awaiting approval
                                    </li>
                                )}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

'use client';

import { use, useEffect, useState, useCallback } from 'react';
import { ProjectTabNav } from '@/components/admin/project-tab-nav';
import { StatusBadge } from '@/components/admin/status-badge';
import {
    Calendar,
    CheckCircle2,
    CircleDashed,
    Loader2,
    Plus,
    Save,
    Trash2,
    Pencil,
} from 'lucide-react';
import {
    getProject,
    DbProjectFull,
    DbPhase,
    n,
    fmtCurrency,
    createPhase,
    updatePhase,
    deletePhase,
} from '@/lib/project-api';

const PHASE_STATUSES = ['Not Started', 'In Progress', 'Completed', 'Blocked', 'Skipped'] as const;

interface PhaseFormState {
    name: string;
    status: string;
    estimatedBudget: number;
    actualCost: number;
    completionPct: number;
    startDate: string;
    endDate: string;
    notes: string;
}

function emptyForm(): PhaseFormState {
    return {
        name: '',
        status: 'Not Started',
        estimatedBudget: 0,
        actualCost: 0,
        completionPct: 0,
        startDate: '',
        endDate: '',
        notes: '',
    };
}

export default function ProjectPhasesPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [project, setProject] = useState<DbProjectFull | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [adding, setAdding] = useState(false);
    const [form, setForm] = useState<PhaseFormState>(emptyForm());

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const p = await getProject(id);
            setProject(p);
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        load();
    }, [load]);

    function startEdit(phase: DbPhase) {
        setEditingId(phase.id);
        setAdding(false);
        setForm({
            name: phase.name,
            status: phase.status,
            estimatedBudget: n(phase.estimated_budget),
            actualCost: n(phase.actual_cost),
            completionPct: n(phase.completion_pct),
            startDate: phase.start_date ?? '',
            endDate: phase.end_date ?? '',
            notes: phase.notes,
        });
    }

    async function saveEdit() {
        if (!editingId) return;
        try {
            await updatePhase(id, editingId, {
                ...form,
                startDate: form.startDate || null,
                endDate: form.endDate || null,
                actor: 'admin',
            });
            setEditingId(null);
            await load();
        } catch (e) {
            alert(`Update failed: ${e instanceof Error ? e.message : String(e)}`);
        }
    }

    async function saveAdd() {
        try {
            await createPhase(id, {
                ...form,
                startDate: form.startDate || null,
                endDate: form.endDate || null,
                actor: 'admin',
            });
            setAdding(false);
            setForm(emptyForm());
            await load();
        } catch (e) {
            alert(`Create failed: ${e instanceof Error ? e.message : String(e)}`);
        }
    }

    async function handleDelete(phaseId: string) {
        if (!confirm('Delete this phase?')) return;
        try {
            await deletePhase(id, phaseId);
            await load();
        } catch (e) {
            alert(`Delete failed: ${e instanceof Error ? e.message : String(e)}`);
        }
    }

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
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="font-serif text-2xl font-bold text-white mb-1">{project.name}</h1>
                    <p className="text-sm text-white/50">Production Phases & Schedule</p>
                </div>
                <button
                    onClick={() => {
                        setAdding((v) => !v);
                        setEditingId(null);
                        setForm(emptyForm());
                    }}
                    className="h-10 px-5 bg-[#b8956a] text-black text-sm font-semibold rounded-full flex items-center justify-center gap-2 hover:bg-[#cbb08c] transition-colors"
                >
                    <Plus size={16} /> {adding ? 'Cancel' : 'Add Phase'}
                </button>
            </div>

            <ProjectTabNav projectId={project.id} />

            {adding && <PhaseForm form={form} setForm={setForm} onSave={saveAdd} onCancel={() => setAdding(false)} />}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-4">
                {project.phases.map((phase) => {
                    const isComplete = phase.status === 'Completed';
                    const isActive = phase.status === 'In Progress';
                    const isEditing = editingId === phase.id;

                    if (isEditing) {
                        return (
                            <div
                                key={phase.id}
                                className="bg-[#1a1a1a] border border-[#b8956a]/40 rounded-2xl p-5 sm:p-6"
                            >
                                <PhaseForm
                                    form={form}
                                    setForm={setForm}
                                    onSave={saveEdit}
                                    onCancel={() => setEditingId(null)}
                                    inline
                                />
                            </div>
                        );
                    }

                    return (
                        <div
                            key={phase.id}
                            className={`bg-[#1a1a1a] border rounded-2xl p-5 sm:p-6 transition-all ${
                                isActive
                                    ? 'border-[#b8956a]/50 shadow-[0_0_15px_rgba(184,149,106,0.1)]'
                                    : 'border-white/6'
                            }`}
                        >
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
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Budget</p>
                                    <p className="text-sm font-semibold text-white">
                                        {fmtCurrency(phase.estimated_budget)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Actual</p>
                                    <p
                                        className={`text-sm font-semibold ${
                                            n(phase.actual_cost) > n(phase.estimated_budget)
                                                ? 'text-red-400'
                                                : 'text-white'
                                        }`}
                                    >
                                        {fmtCurrency(phase.actual_cost)}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <span className="text-[10px] uppercase tracking-widest text-white/40 flex items-center gap-1.5">
                                        <Calendar size={12} /> Timeline
                                    </span>
                                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 text-sm mt-2">
                                        <span className="text-white/60">{phase.start_date || 'TBD'}</span>
                                        <span className="text-white/20">→</span>
                                        <span className="text-white/60">{phase.end_date || 'TBD'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 pt-5 border-t border-white/6">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[10px] uppercase tracking-widest text-white/40">Completion</span>
                                    <span className="text-xs font-bold text-white">{n(phase.completion_pct)}%</span>
                                </div>
                                <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${
                                            isComplete ? 'bg-[#34d399]' : 'bg-[#b8956a]'
                                        }`}
                                        style={{ width: `${n(phase.completion_pct)}%` }}
                                    />
                                </div>
                            </div>

                            <div className="mt-4 flex items-center justify-end gap-2">
                                <button
                                    onClick={() => startEdit(phase)}
                                    className="text-xs text-white/50 hover:text-white flex items-center gap-1"
                                >
                                    <Pencil size={12} /> Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(phase.id)}
                                    className="text-xs text-red-400/70 hover:text-red-400 flex items-center gap-1"
                                >
                                    <Trash2 size={12} /> Delete
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
            {project.phases.length === 0 && !adding && (
                <div className="py-16 text-center border border-white/5 border-dashed rounded-2xl bg-white/[0.02]">
                    <p className="text-white/40 mb-4">No phases yet. Add the first one.</p>
                    <button
                        onClick={() => setAdding(true)}
                        className="h-10 px-5 bg-[#b8956a] text-black text-sm font-semibold rounded-full inline-flex items-center gap-2 hover:bg-[#cbb08c] transition-colors"
                    >
                        <Plus size={14} /> Add Phase
                    </button>
                </div>
            )}
        </div>
    );
}

function PhaseForm({
    form,
    setForm,
    onSave,
    onCancel,
    inline,
}: {
    form: PhaseFormState;
    setForm: (s: PhaseFormState) => void;
    onSave: () => void;
    onCancel: () => void;
    inline?: boolean;
}) {
    return (
        <div className={inline ? '' : 'bg-[#1a1a1a] border border-white/10 rounded-2xl p-5 mb-4'}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <input
                    placeholder="Phase Name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="h-9 px-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#b8956a]/50 sm:col-span-2"
                />
                <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="h-9 px-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#b8956a]/50"
                >
                    {PHASE_STATUSES.map((s) => (
                        <option key={s} value={s}>
                            {s}
                        </option>
                    ))}
                </select>
                <input
                    type="number"
                    min={0}
                    max={100}
                    placeholder="Completion %"
                    value={form.completionPct}
                    onChange={(e) => setForm({ ...form, completionPct: Number(e.target.value) })}
                    className="h-9 px-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#b8956a]/50"
                />
                <input
                    type="number"
                    min={0}
                    placeholder="Estimated Budget"
                    value={form.estimatedBudget || ''}
                    onChange={(e) => setForm({ ...form, estimatedBudget: Number(e.target.value) })}
                    className="h-9 px-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#b8956a]/50"
                />
                <input
                    type="number"
                    min={0}
                    placeholder="Actual Cost"
                    value={form.actualCost || ''}
                    onChange={(e) => setForm({ ...form, actualCost: Number(e.target.value) })}
                    className="h-9 px-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#b8956a]/50"
                />
                <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="h-9 px-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white [color-scheme:dark] focus:outline-none focus:border-[#b8956a]/50"
                />
                <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="h-9 px-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white [color-scheme:dark] focus:outline-none focus:border-[#b8956a]/50"
                />
            </div>
            <textarea
                placeholder="Notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#b8956a]/50 min-h-[60px] mb-3"
            />
            <div className="flex justify-end gap-2">
                <button
                    onClick={onCancel}
                    className="h-9 px-4 text-white/50 hover:text-white text-sm font-semibold"
                >
                    Cancel
                </button>
                <button
                    onClick={onSave}
                    disabled={!form.name}
                    className="h-9 px-4 bg-[#b8956a] text-black rounded-full text-sm font-semibold hover:bg-[#cbb08c] transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                    <Save size={14} /> Save
                </button>
            </div>
        </div>
    );
}

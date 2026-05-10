'use client';

import { use, useEffect, useState, useCallback } from 'react';
import { ProjectTabNav } from '@/components/admin/project-tab-nav';
import { Loader2, Plus, Save, Trash2, Receipt } from 'lucide-react';
import { getProject, createExpense, deleteExpense, DbProjectFull, n, fmtCurrency } from '@/lib/project-api';

const CATEGORIES = ['Materials', 'Equipment', 'Permits', 'Disposal', 'Travel', 'Design', 'Miscellaneous'] as const;

interface ExpenseFormState {
    vendor: string;
    description: string;
    amount: number;
    category: string;
    date: string;
    paymentMethod: string;
    phaseId: string;
    reimbursable: boolean;
}

function emptyForm(): ExpenseFormState {
    return {
        vendor: '',
        description: '',
        amount: 0,
        category: 'Materials',
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'Credit Card',
        phaseId: '',
        reimbursable: false,
    };
}

export default function ProjectExpensesPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [project, setProject] = useState<DbProjectFull | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [adding, setAdding] = useState(false);
    const [form, setForm] = useState<ExpenseFormState>(emptyForm());

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

    async function handleAdd() {
        try {
            await createExpense({
                projectId: id,
                vendor: form.vendor,
                description: form.description,
                amount: form.amount,
                category: form.category,
                date: form.date,
                paymentMethod: form.paymentMethod,
                phaseId: form.phaseId || null,
                reimbursable: form.reimbursable,
                actor: 'admin',
            });
            setAdding(false);
            setForm(emptyForm());
            await load();
        } catch (e) {
            alert(`Failed: ${e instanceof Error ? e.message : String(e)}`);
        }
    }

    async function handleDelete(eid: string) {
        if (!confirm('Delete this expense?')) return;
        try {
            await deleteExpense(eid);
            await load();
        } catch (e) {
            alert(`Failed: ${e instanceof Error ? e.message : String(e)}`);
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

    const total = project.expenses.reduce((s, e) => s + n(e.amount), 0);
    const reimbursable = project.expenses.filter((e) => e.reimbursable && !e.reimbursed).reduce((s, e) => s + n(e.amount), 0);

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
                <div>
                    <h1 className="font-serif text-2xl font-bold text-white mb-1">{project.name}</h1>
                    <p className="text-sm text-white/50">Project Expenses</p>
                </div>
                <button
                    onClick={() => setAdding((v) => !v)}
                    className="h-10 px-5 bg-[#b8956a] text-black text-sm font-semibold rounded-full flex items-center justify-center gap-2 hover:bg-[#cbb08c] transition-colors"
                >
                    <Plus size={16} /> {adding ? 'Cancel' : 'Quick-add Expense'}
                </button>
            </div>

            <ProjectTabNav projectId={project.id} />

            {adding && (
                <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-5 mb-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                        <input
                            placeholder="Vendor"
                            value={form.vendor}
                            onChange={(e) => setForm({ ...form, vendor: e.target.value })}
                            className="h-9 px-3 bg-white/5 border border-white/10 rounded-lg text-base sm:text-sm text-white focus:outline-none focus:border-[#b8956a]/50"
                        />
                        <input
                            type="number"
                            inputMode="decimal"
                            min={0}
                            placeholder="Amount ($)"
                            value={form.amount || ''}
                            onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                            className="h-9 px-3 bg-white/5 border border-white/10 rounded-lg text-base sm:text-sm text-white focus:outline-none focus:border-[#b8956a]/50"
                        />
                        <input
                            type="date"
                            value={form.date}
                            onChange={(e) => setForm({ ...form, date: e.target.value })}
                            className="h-9 px-3 bg-white/5 border border-white/10 rounded-lg text-base sm:text-sm text-white [color-scheme:dark] focus:outline-none focus:border-[#b8956a]/50"
                        />
                        <select
                            value={form.category}
                            onChange={(e) => setForm({ ...form, category: e.target.value })}
                            className="h-9 px-3 bg-white/5 border border-white/10 rounded-lg text-base sm:text-sm text-white focus:outline-none focus:border-[#b8956a]/50"
                        >
                            {CATEGORIES.map((c) => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
                            ))}
                        </select>
                        <select
                            value={form.phaseId}
                            onChange={(e) => setForm({ ...form, phaseId: e.target.value })}
                            className="h-9 px-3 bg-white/5 border border-white/10 rounded-lg text-base sm:text-sm text-white focus:outline-none focus:border-[#b8956a]/50"
                        >
                            <option value="">No phase</option>
                            {project.phases.map((ph) => (
                                <option key={ph.id} value={ph.id}>
                                    {ph.name}
                                </option>
                            ))}
                        </select>
                        <select
                            value={form.paymentMethod}
                            onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                            className="h-9 px-3 bg-white/5 border border-white/10 rounded-lg text-base sm:text-sm text-white focus:outline-none focus:border-[#b8956a]/50"
                        >
                            <option>Credit Card</option>
                            <option>Bank Transfer</option>
                            <option>Check</option>
                            <option>Cash</option>
                            <option>To Be Reimbursed</option>
                        </select>
                    </div>
                    <textarea
                        placeholder="Description"
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-base sm:text-sm text-white min-h-[60px] focus:outline-none focus:border-[#b8956a]/50 mb-3"
                    />
                    <label className="inline-flex items-center gap-2 text-xs text-white/60 mb-3">
                        <input
                            type="checkbox"
                            checked={form.reimbursable}
                            onChange={(e) => setForm({ ...form, reimbursable: e.target.checked })}
                            className="w-4 h-4 rounded border-white/20 bg-black/50 text-[#b8956a] focus:ring-[#b8956a] focus:ring-offset-0"
                        />
                        Reimbursable / Billable to client
                    </label>
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setAdding(false)} className="h-9 px-4 text-white/50 hover:text-white text-sm font-semibold">
                            Cancel
                        </button>
                        <button
                            onClick={handleAdd}
                            disabled={!form.vendor || !form.amount}
                            className="h-9 px-4 bg-[#b8956a] text-black rounded-full text-sm font-semibold hover:bg-[#cbb08c] transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            <Save size={14} /> Save
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#b8956a] mb-1">Total Expenses</p>
                    <div className="text-2xl font-bold text-white font-mono">{fmtCurrency(total)}</div>
                </div>
                <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-blue-400 mb-1">Reimbursable Open</p>
                    <div className="text-2xl font-bold text-white font-mono">{fmtCurrency(reimbursable)}</div>
                </div>
            </div>

            <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead>
                            <tr className="bg-white/5 border-b border-white/5 text-[10px] uppercase tracking-wider text-white/40">
                                <th className="px-5 py-3 font-semibold">Date</th>
                                <th className="px-5 py-3 font-semibold">Vendor</th>
                                <th className="px-5 py-3 font-semibold">Phase / Description</th>
                                <th className="px-5 py-3 font-semibold">Category</th>
                                <th className="px-5 py-3 font-semibold text-right">Amount</th>
                                <th className="px-5 py-3 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {project.expenses.map((e) => (
                                <tr key={e.id} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="px-5 py-4 text-white/70">{e.date}</td>
                                    <td className="px-5 py-4 text-white">{e.vendor || '—'}</td>
                                    <td className="px-5 py-4">
                                        <div className="text-white/80">{e.phase_name || '—'}</div>
                                        <div className="text-xs text-white/40">{e.description}</div>
                                    </td>
                                    <td className="px-5 py-4 text-[10px] uppercase tracking-widest text-white/50">{e.category}</td>
                                    <td className="px-5 py-4 text-right font-mono text-white">{fmtCurrency(e.amount)}</td>
                                    <td className="px-5 py-4 text-right">
                                        <button
                                            onClick={() => handleDelete(e.id)}
                                            className="h-11 w-11 inline-flex items-center justify-center text-red-400/70 hover:text-red-400 bg-white/5 hover:bg-white/10 rounded-full"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {project.expenses.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-5 py-12 text-center">
                                        <Receipt size={36} className="mx-auto text-white/10 mb-2" />
                                        <p className="text-white/40">No expenses logged for this project yet.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

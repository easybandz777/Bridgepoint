'use client';

import { use, useEffect, useState, useCallback } from 'react';
import { ProjectTabNav } from '@/components/admin/project-tab-nav';
import { StatusBadge } from '@/components/admin/status-badge';
import {
    Plus,
    FileText,
    CheckCircle2,
    Clock,
    Loader2,
    Save,
    XCircle,
    Trash2,
    Check,
} from 'lucide-react';
import {
    getProject,
    DbProjectFull,
    DbChangeOrder,
    n,
    fmtCurrency,
    createChangeOrder,
    updateChangeOrder,
    deleteChangeOrder,
} from '@/lib/project-api';

interface COFormState {
    title: string;
    description: string;
    amount: number;
    costImpact: number;
    timeImpactDays: number;
    requestedBy: string;
}

function emptyForm(): COFormState {
    return { title: '', description: '', amount: 0, costImpact: 0, timeImpactDays: 0, requestedBy: 'admin' };
}

export default function ProjectChangeOrdersPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [project, setProject] = useState<DbProjectFull | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [adding, setAdding] = useState(false);
    const [form, setForm] = useState<COFormState>(emptyForm());

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
            await createChangeOrder(id, { ...form, status: 'Pending', actor: 'admin' });
            setAdding(false);
            setForm(emptyForm());
            await load();
        } catch (e) {
            alert(`Create failed: ${e instanceof Error ? e.message : String(e)}`);
        }
    }

    async function approve(co: DbChangeOrder) {
        if (!confirm(`Approve ${co.change_number}? This will add ${fmtCurrency(co.amount)} to estimated revenue.`)) return;
        try {
            await updateChangeOrder(id, co.id, { action: 'approve', actor: 'admin' });
            await load();
        } catch (e) {
            alert(`Approve failed: ${e instanceof Error ? e.message : String(e)}`);
        }
    }

    async function reject(co: DbChangeOrder) {
        if (!confirm(`Reject ${co.change_number}?`)) return;
        try {
            await updateChangeOrder(id, co.id, { action: 'reject', actor: 'admin' });
            await load();
        } catch (e) {
            alert(`Reject failed: ${e instanceof Error ? e.message : String(e)}`);
        }
    }

    async function handleDelete(co: DbChangeOrder) {
        if (!confirm(`Delete ${co.change_number}? Approved COs will reverse from project totals.`)) return;
        try {
            await deleteChangeOrder(id, co.id);
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

    const cos = project.change_orders;
    const approved = cos.filter((c) => c.status === 'Approved');
    const pending = cos.filter((c) => c.status === 'Pending');
    const draft = cos.filter((c) => c.status === 'Draft');
    const sumAmount = (arr: DbChangeOrder[]) => arr.reduce((s, c) => s + n(c.amount), 0);
    const sumCost = (arr: DbChangeOrder[]) => arr.reduce((s, c) => s + n(c.cost_impact), 0);

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
                <div>
                    <h1 className="font-serif text-2xl font-bold text-white mb-1">{project.name}</h1>
                    <p className="text-sm text-white/50">Change Orders & Variations</p>
                </div>
                <button
                    onClick={() => setAdding((v) => !v)}
                    className="h-10 px-5 bg-[#b8956a] text-black text-sm font-semibold rounded-full flex items-center justify-center gap-2 hover:bg-[#cbb08c] transition-colors whitespace-nowrap"
                >
                    <Plus size={16} /> {adding ? 'Cancel' : 'New Change Order'}
                </button>
            </div>

            <ProjectTabNav projectId={project.id} />

            {adding && (
                <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-5 mb-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                        <input
                            placeholder="Title"
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                            className="h-9 px-3 bg-white/5 border border-white/10 rounded-lg text-base sm:text-sm text-white sm:col-span-2 focus:outline-none focus:border-[#b8956a]/50"
                        />
                        <input
                            type="number"
                            inputMode="decimal"
                            min={0}
                            placeholder="Customer Amount ($)"
                            value={form.amount || ''}
                            onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                            className="h-9 px-3 bg-white/5 border border-white/10 rounded-lg text-base sm:text-sm text-white focus:outline-none focus:border-[#b8956a]/50"
                        />
                        <input
                            type="number"
                            inputMode="decimal"
                            min={0}
                            placeholder="Cost Impact ($)"
                            value={form.costImpact || ''}
                            onChange={(e) => setForm({ ...form, costImpact: Number(e.target.value) })}
                            className="h-9 px-3 bg-white/5 border border-white/10 rounded-lg text-base sm:text-sm text-white focus:outline-none focus:border-[#b8956a]/50"
                        />
                        <input
                            type="number"
                            inputMode="numeric"
                            min={0}
                            placeholder="Time Impact (days)"
                            value={form.timeImpactDays || ''}
                            onChange={(e) => setForm({ ...form, timeImpactDays: Number(e.target.value) })}
                            className="h-9 px-3 bg-white/5 border border-white/10 rounded-lg text-base sm:text-sm text-white focus:outline-none focus:border-[#b8956a]/50"
                        />
                        <input
                            placeholder="Requested By"
                            value={form.requestedBy}
                            onChange={(e) => setForm({ ...form, requestedBy: e.target.value })}
                            className="h-9 px-3 bg-white/5 border border-white/10 rounded-lg text-base sm:text-sm text-white focus:outline-none focus:border-[#b8956a]/50"
                        />
                    </div>
                    <textarea
                        placeholder="Description / Reason"
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-base sm:text-sm text-white min-h-[60px] focus:outline-none focus:border-[#b8956a]/50 mb-3"
                    />
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setAdding(false)} className="h-9 px-4 text-white/50 hover:text-white text-sm font-semibold">
                            Cancel
                        </button>
                        <button
                            onClick={handleAdd}
                            disabled={!form.title}
                            className="h-9 px-4 bg-[#b8956a] text-black rounded-full text-sm font-semibold hover:bg-[#cbb08c] transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            <Save size={14} /> Submit (Pending)
                        </button>
                    </div>
                </div>
            )}

            {cos.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <SummaryCard
                        icon={<CheckCircle2 size={14} className="text-[#34d399]" />}
                        title="Approved Change Orders"
                        amount={sumAmount(approved)}
                        sub="Added to contract value"
                    />
                    <SummaryCard
                        icon={<Clock size={14} className="text-[#fbbf24]" />}
                        title="Pending Verification"
                        amount={sumAmount(pending)}
                        sub={`${pending.length} awaiting approval`}
                    />
                    <SummaryCard
                        icon={<FileText size={14} />}
                        title="Net Cost Impact"
                        amount={sumCost(approved) + sumCost(pending) + sumCost(draft)}
                        sub="Expected cost increase"
                    />
                </div>
            )}

            <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead>
                            <tr className="bg-white/5 border-b border-white/5 text-[10px] uppercase tracking-wider text-white/40">
                                <th className="px-5 py-3 font-semibold">Change Order</th>
                                <th className="px-5 py-3 font-semibold text-right">Added Revenue</th>
                                <th className="px-5 py-3 font-semibold text-right">Added Cost</th>
                                <th className="px-5 py-3 font-semibold text-right">Margin</th>
                                <th className="px-5 py-3 font-semibold text-center">Status</th>
                                <th className="px-5 py-3 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {cos.map((co) => {
                                const amt = n(co.amount);
                                const cost = n(co.cost_impact);
                                const margin = amt > 0 ? ((amt - cost) / amt) * 100 : 0;

                                return (
                                    <tr key={co.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="px-5 py-4">
                                            <div className="font-medium text-white flex items-center gap-2">
                                                <span className="text-white/30 text-xs font-mono">{co.change_number}</span>
                                                {co.title}
                                            </div>
                                            <div className="text-xs text-white/40 mt-1 truncate max-w-xs">{co.description}</div>
                                        </td>
                                        <td className="px-5 py-4 text-right font-mono text-white">{fmtCurrency(amt)}</td>
                                        <td className="px-5 py-4 text-right font-mono text-white/70">{fmtCurrency(cost)}</td>
                                        <td className="px-5 py-4 text-right">
                                            <span
                                                className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                                    margin >= 30
                                                        ? 'bg-green-500/10 text-green-400'
                                                        : margin > 0
                                                        ? 'bg-amber-500/10 text-amber-400'
                                                        : 'bg-red-500/10 text-red-400'
                                                }`}
                                            >
                                                {margin.toFixed(1)}%
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <StatusBadge status={co.status} />
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <div className="inline-flex items-center gap-1">
                                                {co.status !== 'Approved' && co.status !== 'Rejected' && (
                                                    <button
                                                        onClick={() => approve(co)}
                                                        className="h-7 px-2 bg-[#34d399]/10 text-[#34d399] rounded text-[10px] font-semibold hover:bg-[#34d399]/20 transition-colors flex items-center gap-1"
                                                    >
                                                        <Check size={10} /> Approve
                                                    </button>
                                                )}
                                                {co.status !== 'Rejected' && (
                                                    <button
                                                        onClick={() => reject(co)}
                                                        className="h-7 px-2 bg-red-500/10 text-red-400 rounded text-[10px] font-semibold hover:bg-red-500/20 transition-colors flex items-center gap-1"
                                                    >
                                                        <XCircle size={10} /> Reject
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(co)}
                                                    className="h-7 px-2 bg-white/5 text-white/50 rounded text-[10px] font-semibold hover:bg-white/10 transition-colors flex items-center gap-1"
                                                >
                                                    <Trash2 size={10} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {cos.length === 0 && (
                        <div className="py-16 text-center">
                            <FileText size={48} className="mx-auto text-white/10 mb-4" />
                            <h3 className="font-serif text-lg font-bold text-white mb-2">No Change Orders</h3>
                            <p className="text-white/40 max-w-sm mx-auto">
                                Use the New Change Order button to capture customer requests or unforeseen scope changes.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function SummaryCard({
    icon,
    title,
    amount,
    sub,
}: {
    icon: React.ReactNode;
    title: string;
    amount: number;
    sub: string;
}) {
    return (
        <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-5">
            <div className="flex items-center gap-2 text-white/40 mb-2">
                {icon}
                <span className="text-[10px] font-semibold uppercase tracking-widest">{title}</span>
            </div>
            <div className="text-xl font-bold text-white">{fmtCurrency(amount)}</div>
            <p className="text-xs text-white/50 mt-1">{sub}</p>
        </div>
    );
}

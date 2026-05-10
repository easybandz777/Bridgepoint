'use client';

import { use, useEffect, useState, useCallback } from 'react';
import { ProjectTabNav } from '@/components/admin/project-tab-nav';
import { StatusBadge } from '@/components/admin/status-badge';
import { FileText, Coins, Plus, Save, Loader2, Trash2, CheckCircle2 } from 'lucide-react';
import {
    getProject,
    DbProjectFull,
    DbBill,
    n,
    fmtCurrency,
    createBill,
    updateBill,
    deleteBill,
} from '@/lib/project-api';

const BILL_STATUSES = ['Pending', 'Approved', 'Paid', 'Rejected', 'Disputed'] as const;

interface BillFormState {
    billNumber: string;
    amount: number;
    status: string;
    receivedDate: string;
    dueDate: string;
    description: string;
    subcontractorId: string;
    phaseId: string;
}

function emptyForm(): BillFormState {
    return {
        billNumber: '',
        amount: 0,
        status: 'Pending',
        receivedDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        description: '',
        subcontractorId: '',
        phaseId: '',
    };
}

export default function ProjectBillsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [project, setProject] = useState<DbProjectFull | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [adding, setAdding] = useState(false);
    const [form, setForm] = useState<BillFormState>(emptyForm());

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
            await createBill(id, {
                ...form,
                receivedDate: form.receivedDate || null,
                dueDate: form.dueDate || null,
                subcontractorId: form.subcontractorId || null,
                phaseId: form.phaseId || null,
                actor: 'admin',
            });
            setAdding(false);
            setForm(emptyForm());
            await load();
        } catch (e) {
            alert(`Create failed: ${e instanceof Error ? e.message : String(e)}`);
        }
    }

    async function markPaid(bill: DbBill) {
        if (!confirm(`Mark bill ${bill.bill_number ?? bill.id} as paid?`)) return;
        try {
            await updateBill(id, bill.id, { action: 'mark-paid', actor: 'admin' });
            await load();
        } catch (e) {
            alert(`Failed: ${e instanceof Error ? e.message : String(e)}`);
        }
    }

    async function handleDelete(bill: DbBill) {
        if (!confirm('Delete this bill?')) return;
        try {
            await deleteBill(id, bill.id);
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

    const bills = project.bills;
    const unpaidTotal = bills.filter((b) => b.status !== 'Paid').reduce((s, b) => s + n(b.amount), 0);
    const paidTotal = bills.filter((b) => b.status === 'Paid').reduce((s, b) => s + n(b.amount), 0);

    const today = new Date();
    const oneWeekFromNow = new Date(today.getTime() + 7 * 24 * 3600 * 1000);
    const dueThisWeek = bills.filter((b) => {
        if (b.status === 'Paid') return false;
        if (!b.due_date) return false;
        const d = new Date(b.due_date);
        return d >= today && d <= oneWeekFromNow;
    });
    const dueThisWeekTotal = dueThisWeek.reduce((s, b) => s + n(b.amount), 0);

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
                <div>
                    <h1 className="font-serif text-2xl font-bold text-white mb-1">{project.name}</h1>
                    <p className="text-sm text-white/50">Subcontractor Bills & Payouts</p>
                </div>
                <button
                    onClick={() => setAdding((v) => !v)}
                    className="h-10 px-5 bg-[#b8956a] text-black text-sm font-semibold rounded-full flex items-center justify-center gap-2 hover:bg-[#cbb08c] transition-colors whitespace-nowrap"
                >
                    <Plus size={16} /> {adding ? 'Cancel' : 'Add Bill'}
                </button>
            </div>

            <ProjectTabNav projectId={project.id} />

            {adding && (
                <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-5 mb-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                        <input
                            placeholder="Bill / Invoice Number"
                            value={form.billNumber}
                            onChange={(e) => setForm({ ...form, billNumber: e.target.value })}
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
                        <select
                            value={form.status}
                            onChange={(e) => setForm({ ...form, status: e.target.value })}
                            className="h-9 px-3 bg-white/5 border border-white/10 rounded-lg text-base sm:text-sm text-white focus:outline-none focus:border-[#b8956a]/50"
                        >
                            {BILL_STATUSES.map((s) => (
                                <option key={s} value={s}>
                                    {s}
                                </option>
                            ))}
                        </select>
                        <input
                            type="date"
                            value={form.receivedDate}
                            onChange={(e) => setForm({ ...form, receivedDate: e.target.value })}
                            className="h-9 px-3 bg-white/5 border border-white/10 rounded-lg text-base sm:text-sm text-white [color-scheme:dark] focus:outline-none focus:border-[#b8956a]/50"
                        />
                        <input
                            type="date"
                            value={form.dueDate}
                            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                            placeholder="Due"
                            className="h-9 px-3 bg-white/5 border border-white/10 rounded-lg text-base sm:text-sm text-white [color-scheme:dark] focus:outline-none focus:border-[#b8956a]/50"
                        />
                        <input
                            placeholder="Subcontractor ID (optional)"
                            value={form.subcontractorId}
                            onChange={(e) => setForm({ ...form, subcontractorId: e.target.value })}
                            className="h-9 px-3 bg-white/5 border border-white/10 rounded-lg text-base sm:text-sm text-white focus:outline-none focus:border-[#b8956a]/50"
                        />
                        <select
                            value={form.phaseId}
                            onChange={(e) => setForm({ ...form, phaseId: e.target.value })}
                            className="h-9 px-3 bg-white/5 border border-white/10 rounded-lg text-base sm:text-sm text-white focus:outline-none focus:border-[#b8956a]/50 sm:col-span-3"
                        >
                            <option value="">-- No phase --</option>
                            {project.phases.map((ph) => (
                                <option key={ph.id} value={ph.id}>
                                    {ph.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    {/* TODO: re-enable when AccountPicker ships
                    <div className="mb-3">
                        <label className="text-[10px] uppercase tracking-widest text-white/50 mb-2 block">
                            Expense Account
                        </label>
                        <AccountPicker
                            classification="Expense"
                            value={null}
                            onChange={() => {}}
                            placeholder="Pick the expense account this bill posts against"
                        />
                    </div>
                    */}
                    <textarea
                        placeholder="Description"
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
                            disabled={!form.amount}
                            className="h-9 px-4 bg-[#b8956a] text-black rounded-full text-sm font-semibold hover:bg-[#cbb08c] transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            <Save size={14} /> Save Bill
                        </button>
                    </div>
                </div>
            )}

            {bills.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <Stat title="Unpaid Total" amount={unpaidTotal} tone="warn" />
                    <Stat title="Due This Week" amount={dueThisWeekTotal} tone="alert" sub={`${dueThisWeek.length} bill${dueThisWeek.length === 1 ? '' : 's'}`} />
                    <Stat title="Paid To Date" amount={paidTotal} tone="ok" />
                </div>
            )}

            <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead>
                            <tr className="bg-white/5 border-b border-white/5 text-[10px] uppercase tracking-wider text-white/40">
                                <th className="px-5 py-3 font-semibold">Sub / Bill #</th>
                                <th className="px-5 py-3 font-semibold">Phase / Description</th>
                                <th className="px-5 py-3 font-semibold text-right">Amount</th>
                                <th className="px-5 py-3 font-semibold text-center">Status</th>
                                <th className="px-5 py-3 font-semibold text-right">Due</th>
                                <th className="px-5 py-3 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {bills.map((bill) => (
                                <tr key={bill.id} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="px-5 py-4">
                                        <div className="font-medium text-white mb-1">
                                            {bill.subcontractor_name || 'Unknown sub'}
                                        </div>
                                        <div className="text-xs text-white/40 flex items-center gap-1 font-mono">
                                            <FileText size={10} /> {bill.bill_number ?? bill.id}
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-white/70">
                                        <div>{bill.phase_name || 'No phase'}</div>
                                        <div className="text-xs text-white/40">{bill.description}</div>
                                    </td>
                                    <td className="px-5 py-4 text-right font-mono text-white">{fmtCurrency(bill.amount)}</td>
                                    <td className="px-5 py-4 text-center">
                                        <StatusBadge status={bill.status} />
                                    </td>
                                    <td className="px-5 py-4 text-right text-xs text-white/50">{bill.due_date || '—'}</td>
                                    <td className="px-5 py-4 text-right">
                                        <div className="inline-flex items-center gap-1">
                                            {bill.status !== 'Paid' && (
                                                <button
                                                    onClick={() => markPaid(bill)}
                                                    className="h-7 px-2 bg-[#34d399]/10 text-[#34d399] rounded text-[10px] font-semibold hover:bg-[#34d399]/20 transition-colors flex items-center gap-1"
                                                >
                                                    <CheckCircle2 size={10} /> Mark Paid
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDelete(bill)}
                                                className="h-7 px-2 bg-white/5 text-white/50 rounded text-[10px] font-semibold hover:bg-white/10 transition-colors flex items-center gap-1"
                                            >
                                                <Trash2 size={10} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {bills.length === 0 && (
                        <div className="py-16 text-center">
                            <Coins size={48} className="mx-auto text-white/10 mb-4" />
                            <h3 className="font-serif text-lg font-bold text-white mb-2">No Bills Found</h3>
                            <p className="text-white/40 max-w-sm mx-auto">
                                Add a sub bill manually with the “Add Bill” button.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function Stat({
    title,
    amount,
    sub,
    tone,
}: {
    title: string;
    amount: number;
    sub?: string;
    tone: 'ok' | 'warn' | 'alert';
}) {
    const colors = {
        ok: 'text-[#34d399]',
        warn: 'text-amber-400',
        alert: 'text-red-400',
    } as const;
    return (
        <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-5">
            <p className={`text-[10px] font-semibold uppercase tracking-widest mb-1 ${colors[tone]}`}>{title}</p>
            <div className="text-2xl font-bold text-white font-mono">{fmtCurrency(amount)}</div>
            {sub && <p className="text-xs text-white/50 mt-1">{sub}</p>}
        </div>
    );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Filter, Hash, CreditCard, Clock, FileText, Banknote, Loader2, Trash2 } from 'lucide-react';
import { listExpenses, deleteExpense, DbExpense, n, fmtCurrency } from '@/lib/project-api';

export default function ExpensesDirectoryPage() {
    const [expenses, setExpenses] = useState<DbExpense[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'All' | 'Reimbursable' | 'Reimbursed'>('All');
    const [categoryFilter, setCategoryFilter] = useState<string | 'All'>('All');

    async function load() {
        setLoading(true);
        setError(null);
        try {
            const rows = await listExpenses();
            setExpenses(rows);
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    async function handleDelete(id: string) {
        if (!confirm('Delete this expense?')) return;
        try {
            await deleteExpense(id);
            await load();
        } catch (e) {
            alert(`Failed: ${e instanceof Error ? e.message : String(e)}`);
        }
    }

    const categories = Array.from(new Set(expenses.map((e) => e.category)));

    const totalExpenses = expenses.reduce((sum, e) => sum + n(e.amount), 0);
    const reimbursable = expenses.filter((e) => e.reimbursable && !e.reimbursed).reduce((s, e) => s + n(e.amount), 0);
    const reimbursed = expenses.filter((e) => e.reimbursed).reduce((s, e) => s + n(e.amount), 0);

    const filtered = expenses.filter((e) => {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
            e.vendor.toLowerCase().includes(q) ||
            e.description.toLowerCase().includes(q);
        const matchesStatus =
            statusFilter === 'All' ||
            (statusFilter === 'Reimbursable' && e.reimbursable && !e.reimbursed) ||
            (statusFilter === 'Reimbursed' && e.reimbursed);
        const matchesCategory = categoryFilter === 'All' || e.category === categoryFilter;
        return matchesSearch && matchesStatus && matchesCategory;
    });

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                <div>
                    <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white mb-2">Expenses & Job Costs</h1>
                    <p className="text-sm text-white/50">Track material purchases, permits, and miscellaneous project costs.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        href="/admin/expenses/new"
                        className="h-10 px-5 bg-[#b8956a] text-black text-sm font-semibold rounded-full flex items-center justify-center gap-2 hover:bg-[#cbb08c] transition-colors whitespace-nowrap"
                    >
                        <Plus size={16} />
                        Log Expense
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#b8956a] mb-1">Total Job Costs</p>
                    <div className="text-2xl font-bold text-white font-mono">{fmtCurrency(totalExpenses)}</div>
                </div>
                <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-5 relative overflow-hidden">
                    <div className="absolute top-4 right-4 text-amber-500/20"><Clock size={48} /></div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-500 mb-1 relative z-10">Reimbursable (Open)</p>
                    <div className="text-2xl font-bold text-white font-mono relative z-10">{fmtCurrency(reimbursable)}</div>
                </div>
                <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-5 relative overflow-hidden">
                    <div className="absolute top-4 right-4 text-blue-500/20"><Banknote size={48} /></div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-blue-400 mb-1 relative z-10">Reimbursed</p>
                    <div className="text-2xl font-bold text-white font-mono relative z-10">{fmtCurrency(reimbursed)}</div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row justify-between gap-4 mb-6">
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                        <input
                            type="text"
                            placeholder="Search vendors, descriptions..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-10 pl-10 pr-4 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#b8956a]/50 focus:bg-white/10 transition-all"
                        />
                    </div>
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="h-10 px-4 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#b8956a]/50 w-full sm:w-48"
                    >
                        <option value="All">All Categories</option>
                        {categories.map((cat) => (
                            <option key={cat} value={cat}>
                                {cat}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 hide-scrollbar w-full lg:w-auto justify-start lg:justify-end">
                    <Filter className="text-white/20 mr-1 shrink-0" size={14} />
                    {(['All', 'Reimbursable', 'Reimbursed'] as const).map((status) => (
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

            {loading && (
                <div className="py-16 flex items-center justify-center text-white/40 gap-2">
                    <Loader2 size={16} className="animate-spin" /> Loading expenses…
                </div>
            )}

            {error && !loading && (
                <div className="py-12 px-6 border border-red-500/20 bg-red-500/5 rounded-2xl text-red-300 text-sm">
                    Failed to load expenses: {error}
                </div>
            )}

            {!loading && !error && (
                <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead>
                                <tr className="bg-white/5 border-b border-white/5 text-[10px] uppercase tracking-wider text-white/40">
                                    <th className="px-5 py-3 font-semibold">Date</th>
                                    <th className="px-5 py-3 font-semibold">Vendor & Detail</th>
                                    <th className="px-5 py-3 font-semibold">Project</th>
                                    <th className="px-5 py-3 font-semibold text-right">Amount</th>
                                    <th className="px-5 py-3 font-semibold">Tags</th>
                                    <th className="px-5 py-3 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filtered.map((expense) => (
                                    <tr key={expense.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-5 py-4 text-white/70">{expense.date}</td>
                                        <td className="px-5 py-4">
                                            <div className="font-medium text-white mb-1 group-hover:text-[#b8956a] transition-colors">
                                                {expense.vendor}
                                            </div>
                                            <div className="text-xs text-white/40 flex items-center gap-2">
                                                <span className="truncate max-w-[260px]">{expense.description}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            {expense.project_name ? (
                                                <div>
                                                    <div className="text-white text-xs">{expense.project_name}</div>
                                                    <div className="text-white/40 text-[10px] uppercase tracking-widest mt-0.5">
                                                        {expense.category}
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-white/30 italic text-xs">Overhead / Unassigned</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-4 text-right font-mono text-white font-medium">
                                            {fmtCurrency(expense.amount)}
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex gap-2 text-xs">
                                                {expense.payment_method && (
                                                    <span className="px-2 py-0.5 bg-white/5 text-white/50 rounded flex items-center gap-1.5">
                                                        <CreditCard size={10} />
                                                        {expense.payment_method}
                                                    </span>
                                                )}
                                                {expense.reimbursable && !expense.reimbursed && (
                                                    <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded">Billable</span>
                                                )}
                                                {expense.reimbursed && (
                                                    <span className="px-2 py-0.5 bg-[#34d399]/10 text-[#34d399] rounded">Reimbursed</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <button
                                                onClick={() => handleDelete(expense.id)}
                                                className="h-7 w-7 inline-flex items-center justify-center text-red-400/70 hover:text-red-400 bg-white/5 hover:bg-white/10 rounded-full"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {filtered.length === 0 && (
                            <div className="py-16 text-center">
                                <CreditCard size={48} className="mx-auto text-white/10 mb-4" />
                                <h3 className="font-serif text-lg font-bold text-white mb-2">No Expenses Found</h3>
                                <p className="text-white/40 max-w-sm mx-auto">
                                    No expense records match your current filters.
                                </p>
                                <button
                                    onClick={() => {
                                        setSearchQuery('');
                                        setStatusFilter('All');
                                        setCategoryFilter('All');
                                    }}
                                    className="mt-4 text-[#b8956a] hover:text-[#cbb08c] font-semibold text-sm transition-colors"
                                >
                                    Clear All Filters
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

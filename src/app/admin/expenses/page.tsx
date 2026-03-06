'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Filter, Hash, CreditCard, Clock, FileText, Banknote } from 'lucide-react';
import { SAMPLE_EXPENSES } from '@/lib/job-costing';
import { SAMPLE_PROJECTS, formatCurrency } from '@/lib/projects';

export default function ExpensesDirectoryPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'All' | 'Paid' | 'Pending' | 'Flagged'>('All');
    const [categoryFilter, setCategoryFilter] = useState<string | 'All'>('All');

    // Get unique categories for filter
    const categories = Array.from(new Set(SAMPLE_EXPENSES.map(e => e.category)));

    // Stats
    const totalExpenses = SAMPLE_EXPENSES.reduce((sum, e) => sum + e.amount, 0);
    const pendingExpenses = SAMPLE_EXPENSES.filter(e => e.status === 'Pending').reduce((sum, e) => sum + e.amount, 0);
    const reimbursableExpenses = SAMPLE_EXPENSES.filter(e => e.isReimbursable).reduce((sum, e) => sum + e.amount, 0);

    // Filter Logic
    const filteredExpenses = SAMPLE_EXPENSES.filter(expense => {
        const matchesSearch =
            expense.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
            expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            expense.referenceNumber?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === 'All' || expense.status === statusFilter;
        const matchesCategory = categoryFilter === 'All' || expense.category === categoryFilter;

        return matchesSearch && matchesStatus && matchesCategory;
    });

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                <div>
                    <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white mb-2">Expenses & Job Costs</h1>
                    <p className="text-sm text-white/50">Track material purchases, permits, and miscellaneous project costs.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="h-10 px-5 bg-white/10 text-white text-sm font-semibold rounded-full flex items-center justify-center gap-2 hover:bg-white/20 transition-colors whitespace-nowrap">
                        <FileText size={16} />
                        Export Log
                    </button>
                    <Link
                        href="/admin/expenses/new"
                        className="h-10 px-5 bg-[#b8956a] text-black text-sm font-semibold rounded-full flex items-center justify-center gap-2 hover:bg-[#cbb08c] transition-colors whitespace-nowrap"
                    >
                        <Plus size={16} />
                        Log Expense
                    </Link>
                </div>
            </div>

            {/* Quick Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#b8956a] mb-1">Total Job Costs (YTD)</p>
                    <div className="text-2xl font-bold text-white font-mono">{formatCurrency(totalExpenses)}</div>
                </div>
                <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-5 relative overflow-hidden">
                    <div className="absolute top-4 right-4 text-amber-500/20"><Clock size={48} /></div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-500 mb-1 relative z-10">Pending Payment</p>
                    <div className="text-2xl font-bold text-white font-mono relative z-10">{formatCurrency(pendingExpenses)}</div>
                </div>
                <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-5 relative overflow-hidden">
                    <div className="absolute top-4 right-4 text-blue-500/20"><Banknote size={48} /></div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-blue-400 mb-1 relative z-10">Billable to Client</p>
                    <div className="text-2xl font-bold text-white font-mono relative z-10">{formatCurrency(reimbursableExpenses)}</div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col lg:flex-row justify-between gap-4 mb-6">
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                        <input
                            type="text"
                            placeholder="Search vendors, descriptions, ref..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-10 pl-10 pr-4 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#b8956a]/50 focus:bg-white/10 transition-all font-sans"
                        />
                    </div>
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="h-10 px-4 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#b8956a]/50 w-full sm:w-48"
                    >
                        <option value="All">All Categories</option>
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 hide-scrollbar w-full lg:w-auto justify-start lg:justify-end">
                    <Filter className="text-white/20 mr-1 shrink-0" size={14} />
                    {['All', 'Paid', 'Pending', 'Flagged'].map(status => (
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

            {/* Table View */}
            <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead>
                            <tr className="bg-white/5 border-b border-white/5 text-[10px] uppercase tracking-wider text-white/40">
                                <th className="px-5 py-3 font-semibold">Date</th>
                                <th className="px-5 py-3 font-semibold">Vendor & Detail</th>
                                <th className="px-5 py-3 font-semibold">Project Allocation</th>
                                <th className="px-5 py-3 font-semibold text-right">Amount</th>
                                <th className="px-5 py-3 font-semibold text-center">Status</th>
                                <th className="px-5 py-3 font-semibold">Tags</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredExpenses.map(expense => {
                                const project = expense.projectId ? SAMPLE_PROJECTS.find(p => p.id === expense.projectId) : null;

                                return (
                                    <tr key={expense.id} className="hover:bg-white/[0.02] transition-colors group cursor-pointer">
                                        <td className="px-5 py-4 text-white/70">
                                            {expense.dateIncurred}
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="font-medium text-white mb-1 group-hover:text-[#b8956a] transition-colors">{expense.vendor}</div>
                                            <div className="text-xs text-white/40 flex items-center gap-2">
                                                <span className="truncate max-w-[200px]">{expense.description}</span>
                                                {expense.referenceNumber && (
                                                    <span className="flex items-center gap-0.5 text-white/30 font-mono">
                                                        <Hash size={10} /> {expense.referenceNumber}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            {project ? (
                                                <div>
                                                    <div className="text-white text-xs">{project.name}</div>
                                                    <div className="text-white/40 text-[10px] uppercase tracking-widest mt-0.5">{expense.category}</div>
                                                </div>
                                            ) : (
                                                <span className="text-white/30 italic text-xs">Overhead / Unassigned</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-4 text-right font-mono text-white font-medium">
                                            {formatCurrency(expense.amount)}
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <span className={`inline-flex items-center justify-center px-2 py-1 rounded text-[10px] font-semibold uppercase tracking-widest ${expense.status === 'Paid' ? 'bg-[#34d399]/10 text-[#34d399]' :
                                                    expense.status === 'Pending' ? 'bg-amber-500/10 text-amber-400' :
                                                        'bg-red-500/10 text-red-400'
                                                }`}>
                                                {expense.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex gap-2 text-xs">
                                                <span className="px-2 py-0.5 bg-white/5 text-white/50 rounded flex items-center gap-1.5">
                                                    <CreditCard size={10} />
                                                    {expense.paymentMethod}
                                                </span>
                                                {expense.isReimbursable && (
                                                    <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded" title="Billable to client">
                                                        Billable
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {filteredExpenses.length === 0 && (
                        <div className="py-16 text-center">
                            <CreditCard size={48} className="mx-auto text-white/10 mb-4" />
                            <h3 className="font-serif text-lg font-bold text-white mb-2">No Expenses Found</h3>
                            <p className="text-white/40 max-w-sm mx-auto">
                                No expense records match your current filters. Check your spelling or adjust the date/status filters.
                            </p>
                            <button
                                onClick={() => { setSearchQuery(''); setStatusFilter('All'); setCategoryFilter('All'); }}
                                className="mt-4 text-[#b8956a] hover:text-[#cbb08c] font-semibold text-sm transition-colors"
                            >
                                Clear All Filters
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Receipt, Upload, Banknote } from 'lucide-react';
import { SAMPLE_PROJECTS } from '@/lib/projects';

export default function NewExpensePage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [vendor, setVendor] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [projectId, setProjectId] = useState('none');
    const [paymentMethod, setPaymentMethod] = useState('Credit Card');
    const [reference, setReference] = useState('');
    const [isReimbursable, setIsReimbursable] = useState(false);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Simulate API call to save expense
        setTimeout(() => {
            router.push('/admin/expenses');
            router.refresh();
        }, 800);
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <Link href="/admin/expenses" className="inline-flex items-center text-xs font-semibold uppercase tracking-widest text-[#b8956a] hover:text-[#cbb08c] transition-colors mb-4">
                        <ArrowLeft size={14} className="mr-2" />
                        Back to Expenses
                    </Link>
                    <h1 className="font-serif text-3xl font-bold text-white mb-2">Log New Expense</h1>
                    <p className="text-white/50 text-sm">Record a material purchase, permit fee, or other job cost.</p>
                </div>
            </div>

            <form onSubmit={handleSave} className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#b8956a]/5 to-transparent rounded-bl-[100px] pointer-events-none" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">

                    {/* Amount (Hero Input) */}
                    <div className="md:col-span-2 mb-4 p-6 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between">
                        <div>
                            <label className="block text-xs uppercase tracking-widest text-white/40 mb-2 font-semibold">Total Amount *</label>
                            <div className="flex items-center gap-2">
                                <span className="text-3xl font-serif text-white/50">$</span>
                                <input
                                    required
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full bg-transparent border-none p-0 text-4xl sm:text-5xl font-mono text-white focus:ring-0 placeholder-white/20"
                                />
                            </div>
                        </div>
                        <div className="hidden sm:flex w-16 h-16 rounded-full bg-[#b8956a]/10 items-center justify-center text-[#b8956a] shrink-0">
                            <Banknote size={32} />
                        </div>
                    </div>

                    {/* Left Column */}
                    <div className="space-y-6">
                        <div>
                            <label className="block text-xs uppercase tracking-widest text-white/40 mb-2 font-semibold">Vendor / Payee *</label>
                            <input
                                required
                                type="text"
                                value={vendor}
                                onChange={(e) => setVendor(e.target.value)}
                                placeholder="Home Depot, Supplier Inc..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-[#b8956a]/50 focus:bg-white/10 transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-xs uppercase tracking-widest text-white/40 mb-2 font-semibold">Date Incurred *</label>
                            <input
                                required
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-[#b8956a]/50 focus:bg-white/10 transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-xs uppercase tracking-widest text-white/40 mb-2 font-semibold">Cost Category *</label>
                            <select
                                required
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-[#b8956a]/50 focus:bg-white/10 transition-colors"
                            >
                                <option value="" disabled>Select Category...</option>
                                <option value="Materials">Materials</option>
                                <option value="Equipment Rental">Equipment Rental</option>
                                <option value="Permits & Fees">Permits & Fees</option>
                                <option value="Disposal/Dumpster">Disposal/Dumpster</option>
                                <option value="Labor (Temporary)">Labor (Temporary)</option>
                                <option value="Office/Overhead">Office/Overhead</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                        <div>
                            <label className="block text-xs uppercase tracking-widest text-white/40 mb-2 font-semibold">Project Allocation</label>
                            <select
                                value={projectId}
                                onChange={(e) => setProjectId(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-[#b8956a]/50 focus:bg-white/10 transition-colors"
                            >
                                <option value="none">Overhead / Unassigned</option>
                                <optgroup label="Active Projects">
                                    {SAMPLE_PROJECTS.filter(p => p.status === 'Active').map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </optgroup>
                                <optgroup label="Other Projects">
                                    {SAMPLE_PROJECTS.filter(p => p.status !== 'Active').map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </optgroup>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs uppercase tracking-widest text-white/40 mb-2 font-semibold">Payment Method</label>
                            <select
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-[#b8956a]/50 focus:bg-white/10 transition-colors"
                            >
                                <option value="Credit Card">Credit Card</option>
                                <option value="Bank Transfer">ACH / Bank Transfer</option>
                                <option value="Check">Check</option>
                                <option value="Cash">Cash</option>
                                <option value="To Be Reimbursed">To Be Reimbursed (Employee)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs uppercase tracking-widest text-white/40 mb-2 font-semibold">Ref / Receipt #</label>
                            <input
                                type="text"
                                value={reference}
                                onChange={(e) => setReference(e.target.value)}
                                placeholder="Optional"
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-[#b8956a]/50 focus:bg-white/10 transition-colors font-mono"
                            />
                        </div>
                    </div>

                    {/* Full Width */}
                    <div className="md:col-span-2 space-y-6">
                        <div>
                            <label className="block text-xs uppercase tracking-widest text-white/40 mb-2 font-semibold">Description / Notes</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="What was purchased and for what exact purpose?"
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-[#b8956a]/50 focus:bg-white/10 transition-colors min-h-[max(80px,5rem)] resize-y"
                            />
                        </div>

                        {/* Reimbursable Toggle */}
                        {projectId !== 'none' && (
                            <label className="flex items-center gap-3 p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl cursor-pointer hover:bg-blue-500/10 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={isReimbursable}
                                    onChange={(e) => setIsReimbursable(e.target.checked)}
                                    className="w-5 h-5 rounded border-white/20 bg-black/50 text-[#b8956a] focus:ring-[#b8956a] focus:ring-offset-0"
                                />
                                <div>
                                    <p className="text-sm font-medium text-white">Billable to Customer (Reimbursable)</p>
                                    <p className="text-xs text-white/40 mt-1">This expense will be added to the next customer invoice as a reimbursable cost.</p>
                                </div>
                            </label>
                        )}

                        {/* Receipt Upload Mock */}
                        <div className="border-2 border-dashed border-white/10 rounded-xl p-6 text-center hover:border-white/20 hover:bg-white/5 cursor-pointer transition-colors">
                            <Receipt size={32} className="mx-auto text-white/30 mb-3" />
                            <p className="text-sm font-semibold text-white mb-1">Click to upload receipt</p>
                            <p className="text-xs text-white/40">PDF, JPG, or PNG (max 5MB)</p>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/10 flex justify-end gap-4 relative z-10">
                    <Link
                        href="/admin/expenses"
                        className="h-12 px-6 rounded-full flex items-center justify-center font-semibold text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={isSubmitting || !amount || !vendor || !category}
                        className="h-12 px-8 bg-[#b8956a] text-black rounded-full flex items-center justify-center font-bold hover:bg-[#cbb08c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Saving...' : 'Save Expense'}
                    </button>
                </div>
            </form>
        </div>
    );
}

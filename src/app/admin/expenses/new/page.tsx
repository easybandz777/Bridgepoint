'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Receipt, Banknote } from 'lucide-react';
import { listProjects, createExpense, DbProject } from '@/lib/project-api';

export default function NewExpensePage() {
    const router = useRouter();
    const [projects, setProjects] = useState<DbProject[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [vendor, setVendor] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [projectId, setProjectId] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Credit Card');
    const [reference, setReference] = useState('');
    const [isReimbursable, setIsReimbursable] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const rows = await listProjects();
                setProjects(rows);
            } catch {
                /* non-fatal */
            }
        })();
    }, []);

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        try {
            await createExpense({
                vendor,
                date,
                amount: Number(amount),
                category,
                description,
                projectId: projectId || null,
                paymentMethod,
                notes: reference ? `Ref: ${reference}` : '',
                reimbursable: isReimbursable,
                actor: 'admin',
            });
            router.push('/admin/expenses');
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
            setIsSubmitting(false);
        }
    }

    const active = projects.filter((p) => p.status === 'Active');
    const others = projects.filter((p) => p.status !== 'Active');

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <Link
                        href="/admin/expenses"
                        className="inline-flex items-center text-xs font-semibold uppercase tracking-widest text-[#b8956a] hover:text-[#cbb08c] transition-colors mb-4"
                    >
                        <ArrowLeft size={14} className="mr-2" />
                        Back to Expenses
                    </Link>
                    <h1 className="font-serif text-3xl font-bold text-white mb-2">Log New Expense</h1>
                    <p className="text-white/50 text-sm">Record a material purchase, permit fee, or other job cost.</p>
                </div>
            </div>

            <form
                onSubmit={handleSave}
                className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#b8956a]/5 to-transparent rounded-bl-[100px] pointer-events-none" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                    <div className="md:col-span-2 mb-4 p-6 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between">
                        <div>
                            <label className="block text-xs uppercase tracking-widest text-white/40 mb-2 font-semibold">
                                Total Amount *
                            </label>
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
                                    className="w-full bg-transparent border-none p-0 text-4xl sm:text-5xl font-mono text-white focus:ring-0 placeholder-white/20 focus:outline-none"
                                />
                            </div>
                        </div>
                        <div className="hidden sm:flex w-16 h-16 rounded-full bg-[#b8956a]/10 items-center justify-center text-[#b8956a] shrink-0">
                            <Banknote size={32} />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-xs uppercase tracking-widest text-white/40 mb-2 font-semibold">
                                Vendor / Payee *
                            </label>
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
                            <label className="block text-xs uppercase tracking-widest text-white/40 mb-2 font-semibold">
                                Date Incurred *
                            </label>
                            <input
                                required
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white [color-scheme:dark] focus:outline-none focus:border-[#b8956a]/50 focus:bg-white/10 transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-xs uppercase tracking-widest text-white/40 mb-2 font-semibold">
                                Cost Category *
                            </label>
                            <select
                                required
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-[#b8956a]/50 focus:bg-white/10 transition-colors"
                            >
                                <option value="" disabled>
                                    Select Category...
                                </option>
                                <option value="Materials">Materials</option>
                                <option value="Equipment">Equipment</option>
                                <option value="Permits">Permits</option>
                                <option value="Disposal">Disposal</option>
                                <option value="Travel">Travel</option>
                                <option value="Design">Design</option>
                                <option value="Miscellaneous">Miscellaneous</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-xs uppercase tracking-widest text-white/40 mb-2 font-semibold">
                                Project Allocation
                            </label>
                            <select
                                value={projectId}
                                onChange={(e) => setProjectId(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-[#b8956a]/50 focus:bg-white/10 transition-colors"
                            >
                                <option value="">Overhead / Unassigned</option>
                                {active.length > 0 && (
                                    <optgroup label="Active Projects">
                                        {active.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.name}
                                            </option>
                                        ))}
                                    </optgroup>
                                )}
                                {others.length > 0 && (
                                    <optgroup label="Other Projects">
                                        {others.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.name}
                                            </option>
                                        ))}
                                    </optgroup>
                                )}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs uppercase tracking-widest text-white/40 mb-2 font-semibold">
                                Payment Method
                            </label>
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
                            <label className="block text-xs uppercase tracking-widest text-white/40 mb-2 font-semibold">
                                Ref / Receipt #
                            </label>
                            <input
                                type="text"
                                value={reference}
                                onChange={(e) => setReference(e.target.value)}
                                placeholder="Optional"
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-[#b8956a]/50 focus:bg-white/10 transition-colors font-mono"
                            />
                        </div>
                    </div>

                    <div className="md:col-span-2 space-y-6">
                        <div>
                            <label className="block text-xs uppercase tracking-widest text-white/40 mb-2 font-semibold">
                                Description / Notes
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="What was purchased and for what exact purpose?"
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-[#b8956a]/50 focus:bg-white/10 transition-colors min-h-[max(80px,5rem)] resize-y"
                            />
                        </div>

                        {projectId && (
                            <label className="flex items-center gap-3 p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl cursor-pointer hover:bg-blue-500/10 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={isReimbursable}
                                    onChange={(e) => setIsReimbursable(e.target.checked)}
                                    className="w-5 h-5 rounded border-white/20 bg-black/50 text-[#b8956a] focus:ring-[#b8956a] focus:ring-offset-0"
                                />
                                <div>
                                    <p className="text-sm font-medium text-white">Billable to Customer (Reimbursable)</p>
                                    <p className="text-xs text-white/40 mt-1">
                                        Mark this expense as reimbursable to the customer.
                                    </p>
                                </div>
                            </label>
                        )}

                        <div className="border-2 border-dashed border-white/10 rounded-xl p-6 text-center text-white/40 text-xs">
                            <Receipt size={24} className="mx-auto mb-2" />
                            Receipt upload not connected — paste a URL into Description if needed.
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="mt-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
                        {error}
                    </div>
                )}

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

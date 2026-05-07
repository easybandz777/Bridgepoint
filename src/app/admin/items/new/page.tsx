'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { ItemType } from '@/lib/items';
import type { Account } from '@/lib/accounts';

export default function NewItemPage() {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState<ItemType>('Service');
    const [sku, setSku] = useState('');
    const [unitPrice, setUnitPrice] = useState('');
    const [purchaseCost, setPurchaseCost] = useState('');
    const [active, setActive] = useState(true);
    const [taxable, setTaxable] = useState(false);
    const [qtyOnHand, setQtyOnHand] = useState('');
    const [incomeAccountId, setIncomeAccountId] = useState<string>('');
    const [expenseAccountId, setExpenseAccountId] = useState<string>('');
    const [accounts, setAccounts] = useState<Account[]>([]);

    useEffect(() => {
        fetch('/api/accounts?active=true&limit=1000')
            .then(r => r.ok ? r.json() : { rows: [] })
            .then(d => setAccounts(Array.isArray(d?.rows) ? d.rows : []))
            .catch(() => setAccounts([]));
    }, []);

    const incomeAccounts = accounts.filter(a => a.classification === 'Revenue');
    const expenseAccounts = accounts.filter(a => a.classification === 'Expense');

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        try {
            const body = {
                name: name.trim(),
                description: description.trim(),
                type,
                sku: sku.trim() || null,
                unitPrice: unitPrice === '' ? null : Number(unitPrice),
                purchaseCost: purchaseCost === '' ? null : Number(purchaseCost),
                incomeAccountId: incomeAccountId || null,
                expenseAccountId: type === 'Inventory' ? (expenseAccountId || null) : null,
                active,
                taxable,
                qtyOnHand: type === 'Inventory' && qtyOnHand !== '' ? Number(qtyOnHand) : null,
                source: 'crm',
            };
            const res = await fetch('/api/items', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);
            router.push(`/admin/items/${data.id}`);
        } catch (err) {
            setError(String(err));
            setSubmitting(false);
        }
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
            <div className="mb-8">
                <Link href="/admin/items" className="inline-flex items-center gap-2 text-xs text-white/40 hover:text-white/70 transition-colors mb-3">
                    <ArrowLeft size={14} /> Back to items
                </Link>
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white mb-1">New Item</h1>
                <p className="text-sm text-white/50">Create a service, inventory, or non-inventory line item.</p>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-sm text-red-200">{error}</div>
                )}

                <Section title="Basics">
                    <Grid>
                        <Field label="Name" required>
                            <input value={name} onChange={e => setName(e.target.value)} required className={inputCls} />
                        </Field>
                        <Field label="Type" required>
                            <select value={type} onChange={e => setType(e.target.value as ItemType)} className={inputCls}>
                                <option value="Service">Service</option>
                                <option value="Inventory">Inventory</option>
                                <option value="NonInventory">Non-Inventory</option>
                            </select>
                        </Field>
                        <Field label="SKU">
                            <input value={sku} onChange={e => setSku(e.target.value)} className={inputCls} />
                        </Field>
                        <Field label="Status">
                            <select value={active ? '1' : '0'} onChange={e => setActive(e.target.value === '1')} className={inputCls}>
                                <option value="1">Active</option>
                                <option value="0">Inactive</option>
                            </select>
                        </Field>
                        <Field label="Description" full>
                            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className={`${inputCls} resize-none h-auto py-2`} />
                        </Field>
                    </Grid>
                </Section>

                <Section title="Pricing">
                    <Grid>
                        <Field label="Unit price ($)">
                            <input type="number" step="0.01" min="0" value={unitPrice} onChange={e => setUnitPrice(e.target.value)} className={inputCls} />
                        </Field>
                        <Field label="Purchase cost ($)" hint="What you pay">
                            <input type="number" step="0.01" min="0" value={purchaseCost} onChange={e => setPurchaseCost(e.target.value)} className={inputCls} />
                        </Field>
                        <Field label="Taxable" full>
                            <label className="inline-flex items-center gap-2 text-sm text-white/80 cursor-pointer">
                                <input type="checkbox" checked={taxable} onChange={e => setTaxable(e.target.checked)} className="w-4 h-4 rounded border-white/20 bg-black/50 text-[#b8956a] focus:ring-[#b8956a] focus:ring-offset-0" />
                                Charge sales tax on this item
                            </label>
                        </Field>
                    </Grid>
                </Section>

                <Section title="Accounts">
                    <Grid>
                        <Field label="Income account" full={type !== 'Inventory'}>
                            <select value={incomeAccountId} onChange={e => setIncomeAccountId(e.target.value)} className={inputCls}>
                                <option value="">— Select —</option>
                                {incomeAccounts.map(a => (
                                    <option key={a.id} value={a.id}>{a.fullName ?? a.name}</option>
                                ))}
                            </select>
                        </Field>
                        {type === 'Inventory' && (
                            <Field label="Expense account">
                                <select value={expenseAccountId} onChange={e => setExpenseAccountId(e.target.value)} className={inputCls}>
                                    <option value="">— Select —</option>
                                    {expenseAccounts.map(a => (
                                        <option key={a.id} value={a.id}>{a.fullName ?? a.name}</option>
                                    ))}
                                </select>
                            </Field>
                        )}
                    </Grid>
                </Section>

                {type === 'Inventory' && (
                    <Section title="Stock">
                        <Grid>
                            <Field label="Quantity on hand">
                                <input type="number" step="1" min="0" value={qtyOnHand} onChange={e => setQtyOnHand(e.target.value)} className={inputCls} />
                            </Field>
                        </Grid>
                    </Section>
                )}

                <div className="flex items-center justify-end gap-3 pt-2">
                    <Link href="/admin/items" className="px-5 h-10 flex items-center text-sm text-white/60 hover:text-white transition-colors">Cancel</Link>
                    <button
                        type="submit"
                        disabled={submitting || !name.trim()}
                        className="h-10 px-5 bg-[#b8956a] text-black text-sm font-semibold rounded-full flex items-center gap-2 hover:bg-[#cbb08c] transition-colors disabled:opacity-50"
                    >
                        {submitting ? 'Saving…' : 'Save Item'}
                    </button>
                </div>
            </form>
        </div>
    );
}

const inputCls = 'w-full h-10 px-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#b8956a]/50 transition-all';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-5 sm:p-6">
            <h2 className="text-sm font-semibold text-white mb-4">{title}</h2>
            {children}
        </div>
    );
}

function Grid({ children }: { children: React.ReactNode }) {
    return <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>;
}

function Field({
    label,
    children,
    full,
    required,
    hint,
}: {
    label: string;
    children: React.ReactNode;
    full?: boolean;
    required?: boolean;
    hint?: string;
}) {
    return (
        <label className={`flex flex-col gap-1.5 ${full ? 'sm:col-span-2' : ''}`}>
            <span className="text-[10px] uppercase tracking-widest text-white/50">
                {label}{required && <span className="text-[#b8956a] ml-1">*</span>}
                {hint && <span className="ml-2 normal-case tracking-normal text-white/30">{hint}</span>}
            </span>
            {children}
        </label>
    );
}

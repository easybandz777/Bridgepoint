'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Pencil, X, ExternalLink, RefreshCw } from 'lucide-react';
import { Item, ItemType, rowToItem } from '@/lib/items';
import type { Account } from '@/lib/accounts';

const TYPE_LABEL: Record<ItemType, string> = {
    Service: 'Service',
    Inventory: 'Inventory',
    NonInventory: 'Non-Inventory',
};

function fmtPrice(n: number | null): string {
    if (n == null) return '—';
    return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(s: string | null): string {
    if (!s) return '—';
    try {
        const d = new Date(s);
        return d.toLocaleString();
    } catch {
        return s;
    }
}

export default function ItemDetailPage() {
    const params = useParams();
    const id = params?.id as string;
    const [item, setItem] = useState<Item | null>(null);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [notFoundFlag, setNotFoundFlag] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    // Edit form state
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState<ItemType>('Service');
    const [sku, setSku] = useState('');
    const [unitPrice, setUnitPrice] = useState('');
    const [purchaseCost, setPurchaseCost] = useState('');
    const [taxable, setTaxable] = useState(false);
    const [active, setActive] = useState(true);
    const [qtyOnHand, setQtyOnHand] = useState('');
    const [incomeAccountId, setIncomeAccountId] = useState<string>('');
    const [expenseAccountId, setExpenseAccountId] = useState<string>('');

    useEffect(() => {
        if (!id) return;
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    async function load() {
        setLoading(true);
        setError(null);
        try {
            const [itemRes, accountsRes] = await Promise.all([
                fetch(`/api/items/${id}`),
                fetch('/api/accounts?active=true&limit=1000'),
            ]);
            if (itemRes.status === 404) {
                setNotFoundFlag(true);
                setLoading(false);
                return;
            }
            if (!itemRes.ok) throw new Error(`HTTP ${itemRes.status}`);
            const data = await itemRes.json();
            const next = rowToItem({
                id: data.id,
                name: data.name,
                description: data.description ?? '',
                type: data.type,
                sku: data.sku ?? null,
                unit_price: data.unitPrice ?? null,
                purchase_cost: data.purchaseCost ?? null,
                income_account_id: data.incomeAccountId ?? null,
                expense_account_id: data.expenseAccountId ?? null,
                active: Boolean(data.active),
                taxable: Boolean(data.taxable),
                qty_on_hand: data.qtyOnHand ?? null,
                source: data.source ?? 'crm',
                qb_id: data.qbId ?? null,
                qb_sync_token: data.qbSyncToken ?? null,
                qb_synced_at: data.qbSyncedAt ?? null,
                created_at: data.createdAt,
                updated_at: data.updatedAt,
            });
            setItem(next);
            setName(next.name);
            setDescription(next.description);
            setType(next.type);
            setSku(next.sku ?? '');
            setUnitPrice(next.unitPrice == null ? '' : String(next.unitPrice));
            setPurchaseCost(next.purchaseCost == null ? '' : String(next.purchaseCost));
            setTaxable(next.taxable);
            setActive(next.active);
            setQtyOnHand(next.qtyOnHand == null ? '' : String(next.qtyOnHand));
            setIncomeAccountId(next.incomeAccountId ?? '');
            setExpenseAccountId(next.expenseAccountId ?? '');

            const accountsData = await accountsRes.json().catch(() => ({ rows: [] }));
            setAccounts(Array.isArray(accountsData?.rows) ? accountsData.rows : []);
        } catch (e) {
            setError(String(e));
        }
        setLoading(false);
    }

    async function save() {
        if (!item) return;
        setSaving(true);
        try {
            const body: Record<string, unknown> = {
                name: name.trim(),
                description: description.trim(),
                type,
                sku: sku.trim() || null,
                unitPrice: unitPrice === '' ? null : Number(unitPrice),
                purchaseCost: purchaseCost === '' ? null : Number(purchaseCost),
                incomeAccountId: incomeAccountId || null,
                expenseAccountId: type === 'Inventory' ? (expenseAccountId || null) : null,
                taxable,
                active,
                qtyOnHand: type === 'Inventory' && qtyOnHand !== '' ? Number(qtyOnHand) : null,
            };
            const res = await fetch(`/api/items/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);
            setEditing(false);
            await load();
        } catch (e) {
            alert(`Save failed: ${String(e)}`);
        }
        setSaving(false);
    }

    const incomeAccounts = useMemo(() => accounts.filter(a => a.classification === 'Revenue'), [accounts]);
    const expenseAccounts = useMemo(() => accounts.filter(a => a.classification === 'Expense'), [accounts]);

    const incomeAccount = useMemo(
        () => accounts.find(a => a.id === item?.incomeAccountId) ?? null,
        [accounts, item],
    );
    const expenseAccount = useMemo(
        () => accounts.find(a => a.id === item?.expenseAccountId) ?? null,
        [accounts, item],
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32">
                <div className="w-8 h-8 rounded-full border-2 border-[#b8956a]/30 border-t-[#b8956a] animate-spin" />
            </div>
        );
    }

    if (notFoundFlag || !item) {
        return (
            <div className="flex flex-col items-center justify-center py-32 text-white/30">
                <p className="text-lg font-serif font-bold text-white mb-2">Item Not Found</p>
                <p className="text-sm">{error ?? 'This record may have been deleted.'}</p>
                <Link href="/admin/items" className="mt-4 text-[#b8956a] hover:text-[#cbb08c] text-sm font-semibold transition-colors">Back to items</Link>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
            <div className="mb-8">
                <Link href="/admin/items" className="inline-flex items-center gap-2 text-xs text-white/40 hover:text-white/70 transition-colors mb-3">
                    <ArrowLeft size={14} /> Back to items
                </Link>
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-[#b8956a]/30 bg-[#b8956a]/10 text-[#b8956a] text-[10px] font-semibold uppercase tracking-wider">
                                {TYPE_LABEL[item.type]}
                            </span>
                            {item.active ? (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-emerald-400/30 bg-emerald-400/10 text-emerald-300 text-[10px] font-semibold uppercase tracking-wider">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Active
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-white/15 bg-white/5 text-white/50 text-[10px] font-semibold uppercase tracking-wider">
                                    <span className="w-1.5 h-1.5 rounded-full bg-white/40" /> Inactive
                                </span>
                            )}
                            {item.taxable && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md border border-white/15 bg-white/5 text-white/60 text-[10px] font-semibold uppercase tracking-wider">
                                    Taxable
                                </span>
                            )}
                        </div>
                        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white mb-1">{item.name}</h1>
                        <p className="text-sm text-white/50">{item.description || 'No description.'}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        {!editing ? (
                            <button onClick={() => setEditing(true)} className="h-9 px-4 bg-white/5 border border-white/10 text-white/80 text-xs font-semibold rounded-full flex items-center gap-1.5 hover:bg-white/10 transition-colors">
                                <Pencil size={12} /> Edit
                            </button>
                        ) : (
                            <>
                                <button onClick={() => { setEditing(false); load(); }} className="h-9 px-4 text-white/50 hover:text-white text-xs font-semibold rounded-full flex items-center gap-1.5 transition-colors">
                                    <X size={12} /> Cancel
                                </button>
                                <button onClick={save} disabled={saving} className="h-9 px-4 bg-[#b8956a] text-black text-xs font-semibold rounded-full flex items-center gap-1.5 hover:bg-[#cbb08c] transition-colors disabled:opacity-50">
                                    <Save size={12} /> {saving ? 'Saving…' : 'Save'}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Basics */}
                    <Card title="Basics">
                        <Grid>
                            <Info label="Name" editing={editing} value={item.name} edit={
                                <input value={name} onChange={e => setName(e.target.value)} className={inputCls} />
                            } />
                            <Info label="Type" editing={editing} value={TYPE_LABEL[item.type]} edit={
                                <select value={type} onChange={e => setType(e.target.value as ItemType)} className={inputCls}>
                                    <option value="Service">Service</option>
                                    <option value="Inventory">Inventory</option>
                                    <option value="NonInventory">Non-Inventory</option>
                                </select>
                            } />
                            <Info label="SKU" editing={editing} value={item.sku ?? '—'} edit={
                                <input value={sku} onChange={e => setSku(e.target.value)} className={inputCls} />
                            } />
                            <Info label="Status" editing={editing} value={item.active ? 'Active' : 'Inactive'} edit={
                                <select value={active ? '1' : '0'} onChange={e => setActive(e.target.value === '1')} className={inputCls}>
                                    <option value="1">Active</option>
                                    <option value="0">Inactive</option>
                                </select>
                            } />
                            <Info full label="Description" editing={editing} value={item.description || '—'} edit={
                                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className={`${inputCls} resize-none h-auto py-2`} />
                            } />
                        </Grid>
                    </Card>

                    {/* Pricing */}
                    <Card title="Pricing">
                        <Grid>
                            <Info label="Unit price" editing={editing} value={fmtPrice(item.unitPrice)} edit={
                                <input type="number" inputMode="decimal" step="0.01" min="0" value={unitPrice} onChange={e => setUnitPrice(e.target.value)} className={inputCls} />
                            } />
                            <Info label="Purchase cost" editing={editing} value={fmtPrice(item.purchaseCost)} edit={
                                <input type="number" inputMode="decimal" step="0.01" min="0" value={purchaseCost} onChange={e => setPurchaseCost(e.target.value)} className={inputCls} />
                            } />
                            <Info full label="Taxable" editing={editing} value={item.taxable ? 'Yes' : 'No'} edit={
                                <label className="inline-flex items-center gap-2 text-sm text-white/80 cursor-pointer">
                                    <input type="checkbox" checked={taxable} onChange={e => setTaxable(e.target.checked)} className="w-4 h-4 rounded border-white/20 bg-black/50 text-[#b8956a] focus:ring-[#b8956a] focus:ring-offset-0" />
                                    Charge sales tax on this item
                                </label>
                            } />
                        </Grid>
                    </Card>

                    {/* Accounts */}
                    <Card title="Accounts">
                        <Grid>
                            <Info
                                label="Income account"
                                full={type !== 'Inventory'}
                                editing={editing}
                                value={incomeAccount ? (incomeAccount.fullName ?? incomeAccount.name) : '—'}
                                edit={
                                    <select value={incomeAccountId} onChange={e => setIncomeAccountId(e.target.value)} className={inputCls}>
                                        <option value="">— Select —</option>
                                        {incomeAccounts.map(a => (
                                            <option key={a.id} value={a.id}>{a.fullName ?? a.name}</option>
                                        ))}
                                    </select>
                                }
                            />
                            {(item.type === 'Inventory' || type === 'Inventory') && (
                                <Info
                                    label="Expense account"
                                    editing={editing}
                                    value={expenseAccount ? (expenseAccount.fullName ?? expenseAccount.name) : '—'}
                                    edit={
                                        <select value={expenseAccountId} onChange={e => setExpenseAccountId(e.target.value)} className={inputCls}>
                                            <option value="">— Select —</option>
                                            {expenseAccounts.map(a => (
                                                <option key={a.id} value={a.id}>{a.fullName ?? a.name}</option>
                                            ))}
                                        </select>
                                    }
                                />
                            )}
                        </Grid>
                    </Card>

                    {/* Stock */}
                    {(item.type === 'Inventory' || type === 'Inventory') && (
                        <Card title="Stock">
                            <Grid>
                                <Info label="Quantity on hand" editing={editing} value={item.qtyOnHand?.toLocaleString() ?? '0'} edit={
                                    <input type="number" inputMode="numeric" step="1" min="0" value={qtyOnHand} onChange={e => setQtyOnHand(e.target.value)} className={inputCls} />
                                } />
                            </Grid>
                        </Card>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6">
                        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                            <RefreshCw size={14} className="text-[#b8956a]" /> QuickBooks Sync
                        </h2>
                        <div className="space-y-3 text-sm">
                            <SidebarRow label="Source" value={item.source.replace('_', ' ')} />
                            <SidebarRow label="QB Item ID" value={item.qbId ?? '—'} mono />
                            <SidebarRow label="Sync token" value={item.qbSyncToken ?? '—'} mono />
                            <SidebarRow label="Last synced" value={fmtDate(item.qbSyncedAt)} />
                        </div>
                        {item.qbId && (
                            <a
                                href={`https://app.qbo.intuit.com/app/items?nameId=${item.qbId}`}
                                target="_blank"
                                rel="noreferrer noopener"
                                className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#b8956a] hover:text-[#cbb08c] transition-colors"
                            >
                                <ExternalLink size={12} /> Open in QuickBooks
                            </a>
                        )}
                    </div>

                    <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6">
                        <h2 className="text-sm font-semibold text-white mb-4">Metadata</h2>
                        <div className="space-y-3 text-sm">
                            <SidebarRow label="Created" value={fmtDate(item.createdAt)} />
                            <SidebarRow label="Updated" value={fmtDate(item.updatedAt)} />
                            <SidebarRow label="Item ID" value={item.id} mono />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

const inputCls = 'w-full h-10 px-3 bg-white/5 border border-white/10 rounded-xl text-base sm:text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#b8956a]/50 transition-all';

function Card({ title, children }: { title: string; children: React.ReactNode }) {
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

function Info({
    label,
    value,
    full,
    editing,
    edit,
}: {
    label: string;
    value: string;
    full?: boolean;
    editing: boolean;
    edit: React.ReactNode;
}) {
    return (
        <div className={`flex flex-col gap-1.5 ${full ? 'sm:col-span-2' : ''}`}>
            <span className="text-[10px] uppercase tracking-widest text-white/50">{label}</span>
            {editing ? edit : <p className="text-sm text-white">{value}</p>}
        </div>
    );
}

function SidebarRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
    return (
        <div className="flex items-start justify-between gap-3">
            <span className="text-white/40 text-xs uppercase tracking-wider shrink-0">{label}</span>
            <span className={`text-white/80 text-right break-all ${mono ? 'font-mono text-xs' : 'text-sm'}`}>{value}</span>
        </div>
    );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, ChevronDown } from 'lucide-react';

type LineItem = { id: string; description: string; quantity: number; unit: string; unitPrice: number; total: number };
const STATUS_OPTIONS = ['Outstanding', 'Partial', 'Paid', 'Overdue'];

function newItem(): LineItem {
    return { id: `li-${Date.now()}-${Math.random()}`, description: '', quantity: 1, unit: 'job', unitPrice: 0, total: 0 };
}

const inp = `w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-white/25 focus:outline-none focus:border-[#b8956a]/60 transition-all`;
const label = `block text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-1.5`;
const section = `bg-[#1a1a1a] border border-white/6 rounded-2xl p-6 mb-4`;

export default function InvoiceForm() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState('Outstanding');

    // Client
    const [clientName, setClientName] = useState('');
    const [clientCompany, setClientCompany] = useState('');
    const [clientAddress, setClientAddress] = useState('');
    const [clientCity, setClientCity] = useState('');
    const [clientState, setClientState] = useState('GA');
    const [clientZip, setClientZip] = useState('');
    const [clientEmail, setClientEmail] = useState('');
    const [clientPhone, setClientPhone] = useState('');

    // Project
    const [projTitle, setProjTitle] = useState('');
    const [projAddress, setProjAddress] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [estimateRef, setEstimateRef] = useState('');

    // Line items
    const [items, setItems] = useState<LineItem[]>([newItem()]);
    const updateItem = (idx: number, field: keyof LineItem, val: string | number) => {
        setItems(prev => {
            const arr = [...prev];
            const item = { ...arr[idx], [field]: val };
            if (field === 'quantity' || field === 'unitPrice') {
                item.total = Number(item.quantity) * Number(item.unitPrice);
            }
            arr[idx] = item;
            return arr;
        });
    };
    const subtotal = items.reduce((s, i) => s + (i.total || 0), 0);

    // Payment
    const [amountPaid, setAmountPaid] = useState(0);
    const amountDue = subtotal - amountPaid;

    // Payment instructions
    const [bankName, setBankName] = useState('');
    const [accountName, setAccountName] = useState('Bridgepoint');
    const [routing, setRouting] = useState('');
    const [account, setAccount] = useState('');
    const [zelle, setZelle] = useState('');
    const [checkPayable, setCheckPayable] = useState('Bridgepoint');

    const [notes, setNotes] = useState('');

    async function handleSave() {
        if (!clientName || !projTitle) return;
        setSaving(true);
        try {
            const res = await fetch('/api/invoices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status, estimateRef: estimateRef || null, dueDate,
                    client: { name: clientName, company: clientCompany, address: clientAddress, city: clientCity, state: clientState, zip: clientZip, email: clientEmail, phone: clientPhone },
                    project: { title: projTitle, address: projAddress },
                    lineItems: items.filter(i => i.description),
                    subtotal, taxRate: 0, taxAmount: 0, total: subtotal,
                    amountPaid, amountDue,
                    paymentInstructions: { bankName, accountName, routing, account, zelle, check: checkPayable },
                    notes,
                }),
            });
            if (res.ok) router.push('/admin/invoices');
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="p-8 max-w-4xl">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#b8956a] mb-1">Admin · Invoices</p>
                    <h1 className="font-serif text-2xl font-bold text-white">New Invoice</h1>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <select value={status} onChange={e => setStatus(e.target.value)}
                            className="appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm pr-8 focus:outline-none focus:border-[#b8956a]/60 cursor-pointer">
                            {STATUS_OPTIONS.map(s => <option key={s} value={s} className="bg-[#1a1a1a]">{s}</option>)}
                        </select>
                        <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
                    </div>
                    <button onClick={() => router.back()} className="px-4 py-2.5 rounded-xl text-sm text-white/40 hover:text-white/70 transition-colors border border-white/8">
                        Cancel
                    </button>
                    <button onClick={handleSave} disabled={saving || !clientName || !projTitle}
                        className="px-6 py-2.5 rounded-xl text-sm font-semibold uppercase tracking-wider disabled:opacity-40 transition-all"
                        style={{ background: 'linear-gradient(135deg, #b8956a 0%, #9a7a54 100%)', color: 'white' }}>
                        {saving ? 'Saving…' : 'Save Invoice'}
                    </button>
                </div>
            </div>

            {/* Client Info */}
            <div className={section}>
                <h2 className="font-serif text-base font-bold text-white mb-5">Client Information</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className={label}>Client Name *</label>
                        <input className={inp} placeholder="John & Jane Smith" value={clientName} onChange={e => setClientName(e.target.value)} />
                    </div>
                    <div>
                        <label className={label}>Company (optional)</label>
                        <input className={inp} placeholder="Acme Corp" value={clientCompany} onChange={e => setClientCompany(e.target.value)} />
                    </div>
                    <div className="col-span-2">
                        <label className={label}>Street Address</label>
                        <input className={inp} placeholder="123 Main St" value={clientAddress} onChange={e => setClientAddress(e.target.value)} />
                    </div>
                    <div>
                        <label className={label}>City</label>
                        <input className={inp} placeholder="Atlanta" value={clientCity} onChange={e => setClientCity(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div><label className={label}>State</label><input className={inp} placeholder="GA" value={clientState} onChange={e => setClientState(e.target.value)} /></div>
                        <div><label className={label}>ZIP</label><input className={inp} placeholder="30301" value={clientZip} onChange={e => setClientZip(e.target.value)} /></div>
                    </div>
                    <div>
                        <label className={label}>Email</label>
                        <input className={inp} type="email" placeholder="client@email.com" value={clientEmail} onChange={e => setClientEmail(e.target.value)} />
                    </div>
                    <div>
                        <label className={label}>Phone</label>
                        <input className={inp} placeholder="(404) 000-0000" value={clientPhone} onChange={e => setClientPhone(e.target.value)} />
                    </div>
                </div>
            </div>

            {/* Project & Invoice Details */}
            <div className={section}>
                <h2 className="font-serif text-base font-bold text-white mb-5">Project & Invoice Details</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <label className={label}>Project Title *</label>
                        <input className={inp} placeholder="Interior Repaint — Smith Residence" value={projTitle} onChange={e => setProjTitle(e.target.value)} />
                    </div>
                    <div className="col-span-2">
                        <label className={label}>Project Address</label>
                        <input className={inp} placeholder="123 Main St, Atlanta, GA" value={projAddress} onChange={e => setProjAddress(e.target.value)} />
                    </div>
                    <div>
                        <label className={label}>Due Date</label>
                        <input className={inp} type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                    </div>
                    <div>
                        <label className={label}>Estimate Ref (optional)</label>
                        <input className={inp} placeholder="BP-2025-0001" value={estimateRef} onChange={e => setEstimateRef(e.target.value)} />
                    </div>
                </div>
            </div>

            {/* Line Items */}
            <div className={section}>
                <div className="flex items-center justify-between mb-5">
                    <h2 className="font-serif text-base font-bold text-white">Line Items</h2>
                    <button onClick={() => setItems(p => [...p, newItem()])}
                        className="flex items-center gap-1.5 text-xs font-semibold text-[#b8956a] hover:text-[#d4b896] transition-colors">
                        <Plus size={14} /> Add Item
                    </button>
                </div>
                <div className="grid gap-2 mb-2" style={{ gridTemplateColumns: '3fr 80px 80px 90px 90px 36px' }}>
                    {['Description', 'Qty', 'Unit', 'Unit Price', 'Total', ''].map(h => (
                        <span key={h} className="text-[10px] font-semibold uppercase tracking-wider text-white/30">{h}</span>
                    ))}
                </div>
                <div className="space-y-2">
                    {items.map((item, idx) => (
                        <div key={item.id} className="grid gap-2 items-center" style={{ gridTemplateColumns: '3fr 80px 80px 90px 90px 36px' }}>
                            <input value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)}
                                placeholder="Description of work" className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-2 text-white text-xs placeholder-white/25 focus:outline-none focus:border-[#b8956a]/60 transition-all" />
                            <input type="number" value={item.quantity} onChange={e => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                                className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-2 text-white text-xs text-right focus:outline-none focus:border-[#b8956a]/60 transition-all" />
                            <input value={item.unit} onChange={e => updateItem(idx, 'unit', e.target.value)}
                                placeholder="job" className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-2 text-white text-xs focus:outline-none focus:border-[#b8956a]/60 transition-all" />
                            <input type="number" value={item.unitPrice} onChange={e => updateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                                className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-2 text-white text-xs text-right focus:outline-none focus:border-[#b8956a]/60 transition-all" />
                            <div className="text-right text-sm font-semibold text-white/70 px-2.5 py-2 bg-white/3 rounded-lg border border-white/6">
                                ${item.total.toLocaleString()}
                            </div>
                            <button onClick={() => setItems(p => p.filter((_, i) => i !== idx))} disabled={items.length === 1}
                                className="flex items-center justify-center w-8 h-8 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-all disabled:opacity-20">
                                <Trash2 size={13} />
                            </button>
                        </div>
                    ))}
                </div>
                {/* Totals */}
                <div className="mt-5 pt-4 border-t border-white/6 space-y-3">
                    <div className="flex justify-end items-center gap-6">
                        <span className="text-sm text-white/40">Subtotal</span>
                        <span className="font-semibold text-white w-28 text-right">${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-end items-center gap-6">
                        <span className="text-sm text-white/40">Amount Paid</span>
                        <div className="relative w-28">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">$</span>
                            <input type="number" value={amountPaid} onChange={e => setAmountPaid(parseFloat(e.target.value) || 0)}
                                className="w-full bg-white/5 border border-white/10 rounded-lg pl-6 pr-3 py-1.5 text-white text-sm text-right focus:outline-none focus:border-[#b8956a]/60 transition-all" />
                        </div>
                    </div>
                    <div className="flex justify-end items-center gap-6 pt-2">
                        <span className="text-sm text-white/40">Amount Due</span>
                        <span className="font-serif text-xl font-bold w-28 text-right" style={{ color: '#b8956a' }}>
                            ${amountDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                </div>
            </div>

            {/* Payment Instructions */}
            <div className={section}>
                <h2 className="font-serif text-base font-bold text-white mb-5">Payment Instructions</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div><label className={label}>Bank Name</label><input className={inp} placeholder="Chase Bank" value={bankName} onChange={e => setBankName(e.target.value)} /></div>
                    <div><label className={label}>Account Name</label><input className={inp} placeholder="Bridgepoint" value={accountName} onChange={e => setAccountName(e.target.value)} /></div>
                    <div><label className={label}>Routing Number</label><input className={inp} placeholder="021000021" value={routing} onChange={e => setRouting(e.target.value)} /></div>
                    <div><label className={label}>Account Number</label><input className={inp} placeholder="XXXXXXXXXX" value={account} onChange={e => setAccount(e.target.value)} /></div>
                    <div><label className={label}>Zelle (optional)</label><input className={inp} placeholder="phone or email" value={zelle} onChange={e => setZelle(e.target.value)} /></div>
                    <div><label className={label}>Check Payable To</label><input className={inp} placeholder="Bridgepoint" value={checkPayable} onChange={e => setCheckPayable(e.target.value)} /></div>
                </div>
            </div>

            {/* Notes */}
            <div className={section}>
                <h2 className="font-serif text-base font-bold text-white mb-5">Notes</h2>
                <textarea className={`${inp} resize-none`} rows={3} placeholder="Additional notes..." value={notes} onChange={e => setNotes(e.target.value)} />
            </div>

            {/* Save footer */}
            <div className="flex justify-end gap-3 mt-2 pb-8">
                <button onClick={() => router.back()} className="px-5 py-3 rounded-xl text-sm text-white/40 hover:text-white/70 transition-colors border border-white/8">Cancel</button>
                <button onClick={handleSave} disabled={saving || !clientName || !projTitle}
                    className="px-8 py-3 rounded-xl text-sm font-semibold uppercase tracking-wider disabled:opacity-40 transition-all"
                    style={{ background: 'linear-gradient(135deg, #b8956a 0%, #9a7a54 100%)', color: 'white' }}>
                    {saving ? 'Saving…' : 'Save Invoice'}
                </button>
            </div>
        </div>
    );
}

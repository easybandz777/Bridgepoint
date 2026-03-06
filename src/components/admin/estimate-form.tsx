'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, ChevronDown } from 'lucide-react';

type LineItem = { id: string; category: string; description: string; quantity: number; unit: string; unitPrice: number; total: number };
type Milestone = { label: string; percentage: number; amount: number; due: string };

const CATEGORIES = ['Labor', 'Materials', 'Subcontractor', 'Equipment', 'Permits & Fees'];
const STATUS_OPTIONS = ['Draft', 'Sent', 'Approved', 'Declined'];
const DEFAULT_TERMS = [
    'This estimate is valid for 30 days from the date issued.',
    'All work is performed during standard business hours (Mon–Fri, 8 AM–5 PM) unless otherwise agreed.',
    'Client is responsible for moving furniture and personal belongings from work areas prior to start date.',
    'Any unforeseen structural repairs or additional scope will be quoted separately before work proceeds.',
    'Bridgepoint warrants all labor for a period of two (2) years from project completion date.',
    "Materials are covered under the manufacturer's product warranty.",
    'Payment is due within 7 days of milestone completion. A 1.5% monthly finance charge applies to balances over 30 days.',
];

function newItem(): LineItem {
    return { id: `li-${Date.now()}-${Math.random()}`, category: 'Labor', description: '', quantity: 1, unit: 'job', unitPrice: 0, total: 0 };
}
function newMilestone(): Milestone {
    return { label: '', percentage: 0, amount: 0, due: '' };
}

const inp = `w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-white/25 focus:outline-none focus:border-[#b8956a]/60 transition-all`;
const label = `block text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-1.5`;
const section = `bg-[#1a1a1a] border border-white/6 rounded-2xl p-6 mb-4`;

export default function EstimateForm() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState('Draft');

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
    const [projDesc, setProjDesc] = useState('');
    const [projStart, setProjStart] = useState('');
    const [projDuration, setProjDuration] = useState('');
    const [validUntil, setValidUntil] = useState('');

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

    // Payment schedule
    const [milestones, setMilestones] = useState<Milestone[]>([
        { label: 'Deposit — Contract Execution', percentage: 33, amount: 0, due: 'Upon signing' },
        { label: 'Final Payment — Project Completion', percentage: 67, amount: 0, due: 'Upon completion' },
    ]);
    const updateMilestone = (idx: number, field: keyof Milestone, val: string | number) => {
        setMilestones(prev => {
            const arr = [...prev];
            const m = { ...arr[idx], [field]: val };
            if (field === 'percentage') m.amount = Math.round((subtotal * Number(val)) / 100);
            arr[idx] = m;
            return arr;
        });
    };

    // Terms & notes
    const [terms, setTerms] = useState<string[]>(DEFAULT_TERMS);
    const [notes, setNotes] = useState('');

    async function handleSave() {
        if (!clientName || !projTitle || items.every(i => !i.description)) return;
        setSaving(true);
        try {
            const ms = milestones.map(m => ({ ...m, amount: Math.round((subtotal * m.percentage) / 100) }));
            const res = await fetch('/api/estimates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status,
                    validUntil: validUntil || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
                    client: { name: clientName, company: clientCompany, address: clientAddress, city: clientCity, state: clientState, zip: clientZip, email: clientEmail, phone: clientPhone },
                    project: { title: projTitle, address: projAddress, description: projDesc, startDate: projStart, estimatedDuration: projDuration },
                    lineItems: items.filter(i => i.description),
                    subtotal, taxRate: 0, taxAmount: 0, total: subtotal,
                    paymentSchedule: ms,
                    terms: terms.filter(Boolean),
                    notes,
                    preparedBy: 'Bridgepoint',
                }),
            });
            if (res.ok) router.push('/admin/estimates');
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="p-8 max-w-4xl">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#b8956a] mb-1">Admin · Estimates</p>
                    <h1 className="font-serif text-2xl font-bold text-white">New Estimate</h1>
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
                        {saving ? 'Saving…' : 'Save Estimate'}
                    </button>
                </div>
            </div>

            {/* Client Info */}
            <div className={section}>
                <h2 className="font-serif text-base font-bold text-white mb-5">Client Information</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 sm:col-span-1">
                        <label className={label}>Client Name *</label>
                        <input className={inp} placeholder="John & Jane Smith" value={clientName} onChange={e => setClientName(e.target.value)} />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
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
                        <div>
                            <label className={label}>State</label>
                            <input className={inp} placeholder="GA" value={clientState} onChange={e => setClientState(e.target.value)} />
                        </div>
                        <div>
                            <label className={label}>ZIP</label>
                            <input className={inp} placeholder="30301" value={clientZip} onChange={e => setClientZip(e.target.value)} />
                        </div>
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

            {/* Project Details */}
            <div className={section}>
                <h2 className="font-serif text-base font-bold text-white mb-5">Project Details</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <label className={label}>Project Title *</label>
                        <input className={inp} placeholder="Interior Repaint — Smith Residence" value={projTitle} onChange={e => setProjTitle(e.target.value)} />
                    </div>
                    <div className="col-span-2">
                        <label className={label}>Project Address</label>
                        <input className={inp} placeholder="123 Main St, Atlanta, GA" value={projAddress} onChange={e => setProjAddress(e.target.value)} />
                    </div>
                    <div className="col-span-2">
                        <label className={label}>Scope of Work</label>
                        <textarea className={`${inp} resize-none`} rows={3} placeholder="Describe the work to be done..." value={projDesc} onChange={e => setProjDesc(e.target.value)} />
                    </div>
                    <div>
                        <label className={label}>Start Date</label>
                        <input className={inp} type="date" value={projStart} onChange={e => setProjStart(e.target.value)} />
                    </div>
                    <div>
                        <label className={label}>Estimated Duration</label>
                        <input className={inp} placeholder="2 weeks" value={projDuration} onChange={e => setProjDuration(e.target.value)} />
                    </div>
                    <div>
                        <label className={label}>Valid Until</label>
                        <input className={inp} type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} />
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

                {/* Table header */}
                <div className="grid gap-2 mb-2" style={{ gridTemplateColumns: '2fr 3fr 80px 80px 90px 90px 36px' }}>
                    {['Category', 'Description', 'Qty', 'Unit', 'Unit Price', 'Total', ''].map(h => (
                        <span key={h} className="text-[10px] font-semibold uppercase tracking-wider text-white/30">{h}</span>
                    ))}
                </div>

                <div className="space-y-2">
                    {items.map((item, idx) => (
                        <div key={item.id} className="grid gap-2 items-center" style={{ gridTemplateColumns: '2fr 3fr 80px 80px 90px 90px 36px' }}>
                            <div className="relative">
                                <select value={item.category} onChange={e => updateItem(idx, 'category', e.target.value)}
                                    className="w-full appearance-none bg-white/5 border border-white/10 rounded-lg px-2.5 py-2 text-white text-xs focus:outline-none focus:border-[#b8956a]/60 cursor-pointer">
                                    {CATEGORIES.map(c => <option key={c} value={c} className="bg-[#1a1a1a]">{c}</option>)}
                                </select>
                            </div>
                            <input value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)}
                                placeholder="Description" className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-2 text-white text-xs placeholder-white/25 focus:outline-none focus:border-[#b8956a]/60 transition-all" />
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

                {/* Subtotal */}
                <div className="mt-5 pt-4 border-t border-white/6 flex justify-end">
                    <div className="flex items-center gap-6">
                        <span className="text-sm text-white/40">Subtotal</span>
                        <span className="font-serif text-xl font-bold" style={{ color: '#b8956a' }}>
                            ${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                </div>
            </div>

            {/* Payment Schedule */}
            <div className={section}>
                <div className="flex items-center justify-between mb-5">
                    <h2 className="font-serif text-base font-bold text-white">Payment Schedule</h2>
                    <button onClick={() => setMilestones(p => [...p, newMilestone()])}
                        className="flex items-center gap-1.5 text-xs font-semibold text-[#b8956a] hover:text-[#d4b896] transition-colors">
                        <Plus size={14} /> Add Milestone
                    </button>
                </div>
                <div className="space-y-3">
                    {milestones.map((m, idx) => (
                        <div key={idx} className="grid grid-cols-12 gap-3 items-center">
                            <div className="col-span-5">
                                <input value={m.label} onChange={e => updateMilestone(idx, 'label', e.target.value)}
                                    placeholder="Milestone label" className={`${inp} text-xs`} />
                            </div>
                            <div className="col-span-2">
                                <div className="relative">
                                    <input type="number" value={m.percentage} onChange={e => updateMilestone(idx, 'percentage', parseFloat(e.target.value) || 0)}
                                        className={`${inp} text-xs pr-6`} placeholder="%" />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 text-xs">%</span>
                                </div>
                            </div>
                            <div className="col-span-2 text-sm font-semibold text-white/60 text-right">
                                ${Math.round((subtotal * m.percentage) / 100).toLocaleString()}
                            </div>
                            <div className="col-span-2">
                                <input value={m.due} onChange={e => updateMilestone(idx, 'due', e.target.value)}
                                    placeholder="Upon signing" className={`${inp} text-xs`} />
                            </div>
                            <div className="col-span-1 flex justify-end">
                                <button onClick={() => setMilestones(p => p.filter((_, i) => i !== idx))} disabled={milestones.length === 1}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-all disabled:opacity-20">
                                    <Trash2 size={13} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Terms & Notes */}
            <div className={section}>
                <h2 className="font-serif text-base font-bold text-white mb-5">Terms & Notes</h2>
                <div className="space-y-2 mb-5">
                    {terms.map((t, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                            <span className="text-[#b8956a] text-xs font-bold mt-2.5 shrink-0">{idx + 1}.</span>
                            <input value={t} onChange={e => setTerms(p => { const a = [...p]; a[idx] = e.target.value; return a; })}
                                className={`${inp} text-xs flex-1`} />
                            <button onClick={() => setTerms(p => p.filter((_, i) => i !== idx))}
                                className="mt-1.5 w-7 h-7 flex items-center justify-center rounded-lg text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-all">
                                <Trash2 size={12} />
                            </button>
                        </div>
                    ))}
                    <button onClick={() => setTerms(p => [...p, ''])}
                        className="flex items-center gap-1.5 text-xs font-semibold text-[#b8956a]/60 hover:text-[#b8956a] transition-colors mt-2">
                        <Plus size={12} /> Add Term
                    </button>
                </div>
                <div>
                    <label className={label}>Notes</label>
                    <textarea className={`${inp} resize-none`} rows={3} placeholder="Additional notes for the client..." value={notes} onChange={e => setNotes(e.target.value)} />
                </div>
            </div>

            {/* Save footer */}
            <div className="flex justify-end gap-3 mt-2 pb-8">
                <button onClick={() => router.back()} className="px-5 py-3 rounded-xl text-sm text-white/40 hover:text-white/70 transition-colors border border-white/8">
                    Cancel
                </button>
                <button onClick={handleSave} disabled={saving || !clientName || !projTitle}
                    className="px-8 py-3 rounded-xl text-sm font-semibold uppercase tracking-wider disabled:opacity-40 transition-all"
                    style={{ background: 'linear-gradient(135deg, #b8956a 0%, #9a7a54 100%)', color: 'white' }}>
                    {saving ? 'Saving…' : 'Save Estimate'}
                </button>
            </div>
        </div>
    );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, ChevronDown, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { ESTIMATE_TEMPLATES, type EstimateTemplate, type LineItem, type Milestone } from '@/lib/estimate-templates';

const CATEGORIES = ['Labor', 'Materials', 'Subcontractor', 'Equipment', 'Permits & Fees'];
const STATUS_OPTIONS = ['Draft', 'Sent', 'Approved', 'Declined'];

function mkId() { return `li-${Date.now()}-${Math.random().toString(36).slice(2)}`; }
function newItem(): LineItem { return { id: mkId(), category: 'Labor', description: '', quantity: 1, unit: 'job', unitPrice: 0, total: 0 }; }
function newMilestone(): Milestone { return { label: '', percentage: 0, amount: 0, due: '' }; }

const inp = `w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-white/25 focus:outline-none focus:border-[#b8956a]/60 transition-all`;
const lbl = `block text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-1.5`;
const sec = `bg-[#1a1a1a] border border-white/6 rounded-2xl p-6 mb-4`;

// ─── Template Picker ──────────────────────────────────────────────────────────

function TemplatePicker({ onSelect }: { onSelect: (t: EstimateTemplate | null) => void }) {
    const [hovered, setHovered] = useState<string | null>(null);
    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
            <div className="mb-8 sm:mb-10">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#b8956a] mb-2">Admin · Estimates</p>
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white mb-2">New Estimate</h1>
                <p className="text-white/40 text-sm">Choose a project type to pre-load a professional template, or start from scratch.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {ESTIMATE_TEMPLATES.map(t => (
                    <button key={t.id} onClick={() => onSelect(t)}
                        onMouseEnter={() => setHovered(t.id)} onMouseLeave={() => setHovered(null)}
                        className="relative text-left p-6 rounded-2xl border transition-all duration-200 group overflow-hidden"
                        style={{
                            background: hovered === t.id ? `${t.color}0d` : 'rgba(26,26,26,0.8)',
                            borderColor: hovered === t.id ? `${t.color}40` : 'rgba(255,255,255,0.06)',
                            boxShadow: hovered === t.id ? `0 0 32px ${t.color}12` : 'none',
                        }}>
                        {/* Glow orb */}
                        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-500"
                            style={{ background: t.color, filter: 'blur(40px)' }} />

                        <div className="flex items-start justify-between mb-4">
                            <span className="text-3xl">{t.icon}</span>
                            <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full"
                                style={{ background: `${t.color}18`, color: t.color }}>
                                {t.lineItems.length} line items
                            </span>
                        </div>

                        <h3 className="font-serif text-xl font-bold text-white mb-0.5">{t.name}</h3>
                        <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">{t.subtitle}</p>
                        <p className="text-sm text-white/50 mb-5 leading-relaxed">{t.description}</p>

                        <ul className="space-y-1.5">
                            {t.highlights.map(h => (
                                <li key={h} className="flex items-center gap-2 text-xs text-white/45">
                                    <CheckCircle2 size={11} style={{ color: t.color }} className="shrink-0" />
                                    {h}
                                </li>
                            ))}
                        </ul>

                        <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between">
                            <span className="text-xs text-white/25">Duration: {t.defaultDuration}</span>
                            <span className="text-xs font-semibold transition-colors" style={{ color: t.color }}>
                                Use Template →
                            </span>
                        </div>
                    </button>
                ))}
            </div>

            <button onClick={() => onSelect(null)}
                className="w-full py-4 rounded-2xl border border-dashed border-white/10 text-sm text-white/30 hover:text-white/50 hover:border-white/20 transition-all">
                + Start from blank (no template)
            </button>
        </div>
    );
}

// ─── Main Form ────────────────────────────────────────────────────────────────

export default function EstimateForm() {
    const router = useRouter();
    const [template, setTemplate] = useState<EstimateTemplate | null | undefined>(undefined);
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
    const subtotal = items.reduce((s, i) => s + (i.total || 0), 0);

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

    const [terms, setTerms] = useState<string[]>([
        'This estimate is valid for 30 days from the date issued.',
        'All work is performed during standard business hours (Mon–Fri, 8 AM–5 PM) unless otherwise agreed.',
        'Client is responsible for moving furniture and personal belongings from work areas prior to start date.',
        'Any unforeseen structural repairs or additional scope will be quoted separately before work proceeds.',
        'Bridgepointe warrants all labor for a period of two (2) years from project completion date.',
        "Materials are covered under the manufacturer's product warranty.",
        'Payment is due within 7 days of milestone completion. A 1.5% monthly finance charge applies to balances over 30 days.',
    ]);
    const [notes, setNotes] = useState('');

    // Apply template
    function applyTemplate(t: EstimateTemplate | null) {
        setTemplate(t);
        if (!t) return;
        setItems(t.lineItems.map(item => ({ ...item, id: mkId() })));
        setMilestones(t.milestones.map(m => ({ ...m })));
        setTerms([...t.terms]);
        setNotes(t.notes);
        setProjDuration(t.defaultDuration);
        setProjTitle(t.defaultTitle.replace('[Client]', '').trim());
    }

    async function handleSave() {
        if (!clientName || !projTitle) return;
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
                    preparedBy: 'Bridgepointe',
                }),
            });
            if (res.ok) router.push('/admin/estimates');
        } finally {
            setSaving(false);
        }
    }

    // Show picker first
    if (template === undefined) return <TemplatePicker onSelect={applyTemplate} />;

    const templateColor = template?.color ?? '#b8956a';

    return (
        <div className="p-8 max-w-4xl">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <button onClick={() => setTemplate(undefined)}
                            className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors">
                            <ArrowLeft size={12} /> Templates
                        </button>
                        {template && (
                            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                                style={{ background: `${templateColor}18`, color: templateColor }}>
                                {template.icon} {template.name} Template
                            </span>
                        )}
                    </div>
                    <h1 className="font-serif text-2xl font-bold text-white">New Estimate</h1>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <select value={status} onChange={e => setStatus(e.target.value)} aria-label="Estimate status"
                            className="appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm pr-8 focus:outline-none focus:border-[#b8956a]/60 cursor-pointer">
                            {STATUS_OPTIONS.map(s => <option key={s} value={s} className="bg-[#1a1a1a]">{s}</option>)}
                        </select>
                        <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
                    </div>
                    <button onClick={() => router.back()} className="px-4 py-2.5 rounded-xl text-sm text-white/40 hover:text-white/70 border border-white/8 transition-colors">
                        Cancel
                    </button>
                    <button onClick={handleSave} disabled={saving || !clientName || !projTitle}
                        className="px-6 py-2.5 rounded-xl text-sm font-semibold uppercase tracking-wider disabled:opacity-40 transition-all"
                        style={{ background: `linear-gradient(135deg, ${templateColor} 0%, ${templateColor}90 100%)`, color: 'white' }}>
                        {saving ? 'Saving…' : 'Save Estimate'}
                    </button>
                </div>
            </div>

            {/* Client Info */}
            <div className={sec}>
                <h2 className="font-serif text-base font-bold text-white mb-5">Client Information</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><label className={lbl}>Client Name *</label><input className={inp} placeholder="John & Jane Smith" value={clientName} onChange={e => setClientName(e.target.value)} /></div>
                    <div><label className={lbl}>Company (optional)</label><input className={inp} placeholder="Acme Corp" value={clientCompany} onChange={e => setClientCompany(e.target.value)} /></div>
                    <div className="sm:col-span-2"><label className={lbl}>Street Address</label><input className={inp} placeholder="123 Main St" value={clientAddress} onChange={e => setClientAddress(e.target.value)} /></div>
                    <div><label className={lbl}>City</label><input className={inp} placeholder="Atlanta" value={clientCity} onChange={e => setClientCity(e.target.value)} /></div>
                    <div className="grid grid-cols-2 gap-3">
                        <div><label className={lbl}>State</label><input className={inp} placeholder="GA" value={clientState} onChange={e => setClientState(e.target.value)} /></div>
                        <div><label className={lbl}>ZIP</label><input className={inp} placeholder="30301" value={clientZip} onChange={e => setClientZip(e.target.value)} /></div>
                    </div>
                    <div><label className={lbl}>Email</label><input className={inp} type="email" placeholder="client@email.com" value={clientEmail} onChange={e => setClientEmail(e.target.value)} /></div>
                    <div><label className={lbl}>Phone</label><input className={inp} placeholder="(404) 000-0000" value={clientPhone} onChange={e => setClientPhone(e.target.value)} /></div>
                </div>
            </div>

            {/* Project Details */}
            <div className={sec}>
                <h2 className="font-serif text-base font-bold text-white mb-5">Project Details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="col-span-2"><label className={lbl}>Project Title *</label><input className={inp} placeholder="Interior Repaint — Smith Residence" value={projTitle} onChange={e => setProjTitle(e.target.value)} /></div>
                    <div className="col-span-2"><label className={lbl}>Project Address</label><input className={inp} placeholder="123 Main St, Atlanta, GA" value={projAddress} onChange={e => setProjAddress(e.target.value)} /></div>
                    <div className="col-span-2"><label className={lbl}>Scope of Work</label><textarea className={`${inp} resize-none`} rows={3} placeholder="Describe the work to be done..." value={projDesc} onChange={e => setProjDesc(e.target.value)} /></div>
                    <div><label className={lbl}>Start Date</label><input className={inp} type="date" value={projStart} onChange={e => setProjStart(e.target.value)} /></div>
                    <div><label className={lbl}>Estimated Duration</label><input className={inp} placeholder="2 weeks" value={projDuration} onChange={e => setProjDuration(e.target.value)} /></div>
                    <div><label className={lbl}>Valid Until</label><input className={inp} type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} /></div>
                </div>
            </div>

            {/* Line Items */}
            <div className={sec}>
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h2 className="font-serif text-base font-bold text-white">Line Items</h2>
                        {template && <p className="text-xs text-white/30 mt-0.5">{items.length} items pre-loaded from {template.name} template — edit, add, or remove as needed</p>}
                    </div>
                    <button onClick={() => setItems(p => [...p, newItem()])}
                        className="flex items-center gap-1.5 text-xs font-semibold transition-colors" style={{ color: templateColor }}>
                        <Plus size={14} /> Add Item
                    </button>
                </div>

                {/* Group items by category */}
                {(() => {
                    const groups: Record<string, LineItem[]> = {};
                    items.forEach(item => {
                        if (!groups[item.category]) groups[item.category] = [];
                        groups[item.category].push(item);
                    });
                    return Object.entries(groups).map(([cat, catItems]) => (
                        <div key={cat} className="mb-5">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">{cat}</span>
                                <div className="flex-1 h-px bg-white/5" />
                            </div>
                            <div className="grid gap-1.5 mb-1" style={{ gridTemplateColumns: '140px 1fr 72px 64px 86px 80px 30px' }}>
                                {catItems.map(item => {
                                    const idx = items.findIndex(i => i.id === item.id);
                                    return (
                                        <div key={item.id} className="contents">
                                            <select value={item.category} aria-label="Category"
                                                onChange={e => updateItem(idx, 'category', e.target.value)}
                                                className="bg-white/5 border border-white/8 rounded-lg px-2 py-2 text-white text-[11px] focus:outline-none focus:border-[#b8956a]/50 cursor-pointer">
                                                {CATEGORIES.map(c => <option key={c} value={c} className="bg-[#111]">{c}</option>)}
                                            </select>
                                            <input value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)}
                                                placeholder="Description" className="bg-white/5 border border-white/8 rounded-lg px-2.5 py-2 text-white text-[11px] placeholder-white/20 focus:outline-none focus:border-[#b8956a]/50 transition-all" />
                                            <input type="number" value={item.quantity} onChange={e => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                                                className="bg-white/5 border border-white/8 rounded-lg px-2 py-2 text-white text-[11px] text-right focus:outline-none focus:border-[#b8956a]/50 transition-all" />
                                            <input value={item.unit} onChange={e => updateItem(idx, 'unit', e.target.value)}
                                                placeholder="unit" className="bg-white/5 border border-white/8 rounded-lg px-2 py-2 text-white text-[11px] focus:outline-none focus:border-[#b8956a]/50 transition-all" />
                                            <input type="number" value={item.unitPrice} onChange={e => updateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                                                className="bg-white/5 border border-white/8 rounded-lg px-2 py-2 text-white text-[11px] text-right focus:outline-none focus:border-[#b8956a]/50 transition-all" />
                                            <div className="text-right text-[11px] font-semibold text-white/60 px-2 py-2 bg-white/3 rounded-lg border border-white/6">
                                                ${item.total.toLocaleString()}
                                            </div>
                                            <button onClick={() => setItems(p => p.filter(i => i.id !== item.id))} disabled={items.length === 1} aria-label="Remove line item"
                                                className="flex items-center justify-center w-7 h-8 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-all disabled:opacity-20">
                                                <Trash2 size={11} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ));
                })()}

                <div className="mt-4 pt-4 border-t border-white/6 flex justify-end">
                    <div className="flex items-center gap-6">
                        <span className="text-sm text-white/40">Subtotal</span>
                        <span className="font-serif text-xl font-bold" style={{ color: templateColor }}>
                            ${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                </div>
            </div>

            {/* Payment Schedule */}
            <div className={sec}>
                <div className="flex items-center justify-between mb-5">
                    <h2 className="font-serif text-base font-bold text-white">Payment Schedule</h2>
                    <button onClick={() => setMilestones(p => [...p, newMilestone()])}
                        className="flex items-center gap-1.5 text-xs font-semibold transition-colors" style={{ color: templateColor }}>
                        <Plus size={14} /> Add Milestone
                    </button>
                </div>
                <div className="space-y-3">
                    {milestones.map((m, idx) => (
                        <div key={idx} className="grid grid-cols-12 gap-3 items-center">
                            <div className="col-span-5"><input value={m.label} onChange={e => updateMilestone(idx, 'label', e.target.value)} placeholder="Milestone label" className={`${inp} text-xs`} /></div>
                            <div className="col-span-2 relative">
                                <input type="number" value={m.percentage} onChange={e => updateMilestone(idx, 'percentage', parseFloat(e.target.value) || 0)} className={`${inp} text-xs pr-6`} placeholder="%" />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 text-xs">%</span>
                            </div>
                            <div className="col-span-2 text-sm font-semibold text-white/60 text-right">${Math.round((subtotal * m.percentage) / 100).toLocaleString()}</div>
                            <div className="col-span-2"><input value={m.due} onChange={e => updateMilestone(idx, 'due', e.target.value)} placeholder="Upon signing" className={`${inp} text-xs`} /></div>
                            <div className="col-span-1 flex justify-end">
                                <button onClick={() => setMilestones(p => p.filter((_, i) => i !== idx))} disabled={milestones.length === 1} aria-label="Remove milestone"
                                    className="w-8 h-8 flex items-center justify-center rounded-lg text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-all disabled:opacity-20">
                                    <Trash2 size={13} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Terms & Notes */}
            <div className={sec}>
                <h2 className="font-serif text-base font-bold text-white mb-5">Terms & Notes</h2>
                <div className="space-y-2 mb-5">
                    {terms.map((t, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                            <span className="text-xs font-bold mt-2.5 shrink-0" style={{ color: templateColor }}>{idx + 1}.</span>
                            <input value={t} onChange={e => setTerms(p => { const a = [...p]; a[idx] = e.target.value; return a; })}
                                className={`${inp} text-xs flex-1`} />
                            <button onClick={() => setTerms(p => p.filter((_, i) => i !== idx))} aria-label="Remove term"
                                className="mt-1.5 w-7 h-7 flex items-center justify-center rounded-lg text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-all">
                                <Trash2 size={12} />
                            </button>
                        </div>
                    ))}
                    <button onClick={() => setTerms(p => [...p, ''])}
                        className="flex items-center gap-1.5 text-xs font-semibold transition-colors mt-2" style={{ color: `${templateColor}80` }}>
                        <Plus size={12} /> Add Term
                    </button>
                </div>
                <div><label className={lbl}>Notes</label><textarea className={`${inp} resize-none`} rows={3} placeholder="Additional notes for the client..." value={notes} onChange={e => setNotes(e.target.value)} /></div>
            </div>

            {/* Save footer */}
            <div className="flex justify-end gap-3 mt-2 pb-8">
                <button onClick={() => router.back()} className="px-5 py-3 rounded-xl text-sm text-white/40 hover:text-white/70 border border-white/8 transition-colors">Cancel</button>
                <button onClick={handleSave} disabled={saving || !clientName || !projTitle}
                    className="px-8 py-3 rounded-xl text-sm font-semibold uppercase tracking-wider disabled:opacity-40 transition-all"
                    style={{ background: `linear-gradient(135deg, ${templateColor} 0%, ${templateColor}a0 100%)`, color: 'white' }}>
                    {saving ? 'Saving…' : 'Save Estimate'}
                </button>
            </div>
        </div>
    );
}

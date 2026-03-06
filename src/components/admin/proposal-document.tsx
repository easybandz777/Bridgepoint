'use client';

import { type Estimate, formatCurrency } from '@/lib/estimates';
import { Printer } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
    Draft: '#a3a3a3',
    Sent: '#60a5fa',
    Approved: '#34d399',
    Declined: '#f87171',
};

export function ProposalDocument({ estimate }: { estimate: Estimate }) {
    const groupedItems = estimate.lineItems.reduce((acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
    }, {} as Record<string, typeof estimate.lineItems>);

    return (
        <div className="max-w-4xl mx-auto">
            {/* Actions bar — screen only */}
            <div className="print:hidden flex items-center justify-between mb-6 px-1">
                <div className="flex items-center gap-2">
                    <span
                        className="text-[11px] font-semibold uppercase tracking-widest px-3 py-1.5 rounded-full"
                        style={{
                            background: `${STATUS_COLORS[estimate.status]}18`,
                            color: STATUS_COLORS[estimate.status],
                        }}
                    >
                        {estimate.status}
                    </span>
                    <span className="text-sm text-white/30 font-mono">{estimate.estimateNumber}</span>
                </div>
                <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all"
                    style={{ background: 'rgba(184,149,106,0.12)', color: '#b8956a', border: '1px solid rgba(184,149,106,0.25)' }}
                >
                    <Printer size={13} />
                    Print / PDF
                </button>
            </div>

            {/* ── DOCUMENT ─────────────────────────────────────────────────────── */}
            <div
                id="proposal-doc"
                className="bg-white text-[#1a1a1a] rounded-2xl overflow-hidden print:rounded-none print:shadow-none"
                style={{ boxShadow: '0 32px 80px rgba(0,0,0,0.35)' }}
            >
                {/* ── Header / Letterhead ──────────────────────────────────────── */}
                <div className="relative overflow-hidden" style={{ background: '#1a1a1a', paddingBottom: 0 }}>
                    <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 80% 50%, rgba(184,149,106,0.12) 0%, transparent 65%)' }} />
                    <div className="relative px-14 pt-12 pb-10 flex items-start justify-between">
                        <div>
                            <h1 className="font-serif text-3xl font-bold text-white tracking-tight mb-1">
                                Bridgepoint
                            </h1>
                            <p className="text-[11px] uppercase tracking-[0.2em] text-[#b8956a] mb-6">
                                Premium Painting &amp; Remodeling
                            </p>
                            <div className="text-[11px] text-white/35 space-y-0.5 leading-relaxed">
                                <p>Atlanta Metro Area, Georgia</p>
                                <p>(862) 421-8973 · Bridgepointefloors@gmail.com</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] uppercase tracking-[0.18em] text-white/25 mb-1">Proposal</p>
                            <p className="font-mono text-lg font-bold text-white mb-4">{estimate.estimateNumber}</p>

                            <div className="text-[11px] text-white/30 space-y-1 text-right">
                                <div className="flex justify-end gap-3">
                                    <span className="text-white/20">Date Issued</span>
                                    <span className="text-white/50">{estimate.createdDate}</span>
                                </div>
                                <div className="flex justify-end gap-3">
                                    <span className="text-white/20">Valid Until</span>
                                    <span className="text-white/50">{estimate.validUntil}</span>
                                </div>
                                {estimate.sentDate && (
                                    <div className="flex justify-end gap-3">
                                        <span className="text-white/20">Sent</span>
                                        <span className="text-white/50">{estimate.sentDate}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Gold gradient bar */}
                    <div style={{ height: 3, background: 'linear-gradient(90deg, #b8956a 0%, #d4b896 50%, #b8956a 100%)' }} />
                </div>

                {/* ── Client & Project ─────────────────────────────────────────── */}
                <div className="grid grid-cols-2 gap-0 border-b border-[#e8e3dc]">
                    <div className="px-14 py-8 border-r border-[#e8e3dc]">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#b8956a] mb-3">Prepared For</p>
                        <p className="font-serif text-lg font-bold text-[#1a1a1a] leading-tight mb-0.5">{estimate.client.name}</p>
                        {estimate.client.company && (
                            <p className="text-sm text-[#4a4a4a] mb-2">{estimate.client.company}</p>
                        )}
                        <div className="text-[12px] text-[#6a6a6a] space-y-0.5 mt-3">
                            <p>{estimate.client.address}</p>
                            <p>{estimate.client.city}, {estimate.client.state} {estimate.client.zip}</p>
                            <p className="mt-2">{estimate.client.email}</p>
                            <p>{estimate.client.phone}</p>
                        </div>
                    </div>
                    <div className="px-14 py-8">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#b8956a] mb-3">Project Details</p>
                        <p className="font-serif text-base font-bold text-[#1a1a1a] leading-tight mb-2">{estimate.project.title}</p>
                        <div className="text-[12px] text-[#6a6a6a] space-y-1 mb-3">
                            <p>{estimate.project.address}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mt-4 text-[11px]">
                            <div>
                                <p className="text-[#9a9a9a] uppercase tracking-wide mb-0.5">Start Date</p>
                                <p className="font-semibold text-[#1a1a1a]">{estimate.project.startDate}</p>
                            </div>
                            <div>
                                <p className="text-[#9a9a9a] uppercase tracking-wide mb-0.5">Duration</p>
                                <p className="font-semibold text-[#1a1a1a]">{estimate.project.estimatedDuration}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Scope of Work ────────────────────────────────────────────── */}
                <div className="px-14 py-8 border-b border-[#e8e3dc]" style={{ background: '#faf8f5' }}>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#b8956a] mb-3">Scope of Work</p>
                    <p className="text-[13px] leading-relaxed text-[#4a4a4a]">{estimate.project.description}</p>
                </div>

                {/* ── Line Items ────────────────────────────────────────────────── */}
                <div className="px-14 py-8 border-b border-[#e8e3dc]">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#b8956a] mb-6">Itemized Estimate</p>

                    {Object.entries(groupedItems).map(([category, items]) => (
                        <div key={category} className="mb-6 last:mb-0">
                            {/* Category header */}
                            <div className="flex items-center gap-3 mb-3">
                                <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#1a1a1a]">{category}</span>
                                <div className="flex-1 h-px bg-[#e8e3dc]" />
                            </div>

                            <table className="w-full text-[12px]">
                                <thead>
                                    <tr className="text-[10px] uppercase tracking-wide text-[#9a9a9a]">
                                        <th className="text-left pb-2 font-medium w-[50%]">Description</th>
                                        <th className="text-right pb-2 font-medium w-[15%]">Qty</th>
                                        <th className="text-right pb-2 font-medium w-[15%]">Unit</th>
                                        <th className="text-right pb-2 font-medium w-[20%]">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item) => (
                                        <tr key={item.id} className="border-t border-[#f0ece6]">
                                            <td className="py-2.5 pr-4 text-[#4a4a4a] leading-snug">{item.description}</td>
                                            <td className="py-2.5 text-right text-[#6a6a6a]">{item.quantity.toLocaleString()}</td>
                                            <td className="py-2.5 text-right text-[#6a6a6a]">{item.unit}</td>
                                            <td className="py-2.5 text-right font-semibold text-[#1a1a1a]">{formatCurrency(item.total)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ))}

                    {/* Totals */}
                    <div className="mt-8 flex justify-end">
                        <div className="w-64">
                            <div className="flex justify-between text-[12px] py-2 border-t border-[#e8e3dc]">
                                <span className="text-[#6a6a6a]">Subtotal</span>
                                <span className="text-[#1a1a1a] font-medium">{formatCurrency(estimate.subtotal)}</span>
                            </div>
                            {estimate.taxAmount > 0 && (
                                <div className="flex justify-between text-[12px] py-2 border-t border-[#e8e3dc]">
                                    <span className="text-[#6a6a6a]">Tax ({(estimate.taxRate * 100).toFixed(1)}%)</span>
                                    <span className="text-[#1a1a1a] font-medium">{formatCurrency(estimate.taxAmount)}</span>
                                </div>
                            )}
                            <div
                                className="flex justify-between items-center py-3 px-4 rounded-xl mt-2"
                                style={{ background: '#1a1a1a' }}
                            >
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-white/50">Total</span>
                                <span className="font-serif text-xl font-bold" style={{ color: '#b8956a' }}>
                                    {formatCurrency(estimate.total)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Payment Schedule ──────────────────────────────────────────── */}
                <div className="px-14 py-8 border-b border-[#e8e3dc]" style={{ background: '#faf8f5' }}>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#b8956a] mb-5">Payment Schedule</p>
                    <div className="space-y-3">
                        {estimate.paymentSchedule.map((m, i) => (
                            <div key={i} className="flex items-center justify-between py-3 px-5 bg-white rounded-xl border border-[#e8e3dc]">
                                <div className="flex items-center gap-4">
                                    <div
                                        className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                                        style={{ background: 'linear-gradient(135deg, #b8956a 0%, #9a7a54 100%)' }}
                                    >
                                        {i + 1}
                                    </div>
                                    <div>
                                        <p className="text-[12px] font-semibold text-[#1a1a1a]">{m.label}</p>
                                        <p className="text-[11px] text-[#9a9a9a]">Due: {m.due}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-serif text-base font-bold text-[#1a1a1a]">{formatCurrency(m.amount)}</p>
                                    <p className="text-[11px] text-[#b8956a]">{m.percentage}%</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Terms & Conditions ────────────────────────────────────────── */}
                <div className="px-14 py-8 border-b border-[#e8e3dc]">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#b8956a] mb-4">Terms &amp; Conditions</p>
                    <ol className="space-y-2">
                        {estimate.terms.map((t, i) => (
                            <li key={i} className="flex gap-3 text-[12px] text-[#6a6a6a] leading-relaxed">
                                <span className="text-[#b8956a] font-semibold shrink-0 mt-0.5">{i + 1}.</span>
                                <span>{t}</span>
                            </li>
                        ))}
                    </ol>
                </div>

                {/* ── Notes ────────────────────────────────────────────────────── */}
                {estimate.notes && (
                    <div className="px-14 py-6 border-b border-[#e8e3dc]" style={{ background: '#fdf6ed' }}>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#b8956a] mb-2">Notes</p>
                        <p className="text-[12px] text-[#6a6a6a] leading-relaxed italic">{estimate.notes}</p>
                    </div>
                )}

                {/* ── Signature Block ───────────────────────────────────────────── */}
                <div className="px-14 py-10" style={{ background: '#1a1a1a' }}>
                    <div className="relative overflow-hidden">
                        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 0% 100%, rgba(184,149,106,0.08) 0%, transparent 60%)' }} />
                        <div className="relative grid grid-cols-2 gap-16">
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#b8956a] mb-6">Accepted by Client</p>
                                <div className="h-12 border-b border-white/15 mb-2" />
                                <p className="text-[11px] text-white/30">Signature</p>
                                <div className="h-8 border-b border-white/10 mt-4 mb-2" />
                                <p className="text-[11px] text-white/30">Printed Name</p>
                                <div className="h-8 border-b border-white/10 mt-4 mb-2" />
                                <p className="text-[11px] text-white/30">Date</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#b8956a] mb-6">Authorized by Bridgepoint</p>
                                <div className="h-12 border-b border-white/15 mb-2" />
                                <p className="text-[11px] text-white/30">Signature</p>
                                <div className="mt-4 mb-2">
                                    <p className="font-serif text-sm font-bold text-white">Bridgepoint</p>
                                </div>
                                <p className="text-[11px] text-white/30">Printed Name</p>
                                <div className="h-8 border-b border-white/10 mt-4 mb-2" />
                                <p className="text-[11px] text-white/30">Date</p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="mt-10 pt-6 border-t border-white/8 flex items-center justify-between text-[10px] text-white/20">
                            <span>{estimate.preparedBy} · {estimate.estimateNumber}</span>
                            <span>bridgepointefloor.com · (862) 421-8973</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Print styles */}
            <style>{`
        @media print {
          body { background: white !important; }
          .print\\:hidden { display: none !important; }
          #proposal-doc { box-shadow: none !important; }
        }
      `}</style>
        </div>
    );
}

'use client';

import { type Invoice } from '@/lib/invoices';
import { Printer, CheckCircle, AlertCircle, Timer, XCircle } from 'lucide-react';

function fmt(n: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n);
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: typeof CheckCircle; label: string }> = {
    Paid: { color: '#34d399', bg: 'rgba(52,211,153,0.10)', icon: CheckCircle, label: 'Paid in Full' },
    Partial: { color: '#fbbf24', bg: 'rgba(251,191,36,0.10)', icon: Timer, label: 'Partially Paid' },
    Outstanding: { color: '#60a5fa', bg: 'rgba(96,165,250,0.10)', icon: AlertCircle, label: 'Payment Due' },
    Overdue: { color: '#f87171', bg: 'rgba(248,113,113,0.10)', icon: XCircle, label: 'Overdue' },
};

export function InvoiceDocument({ invoice }: { invoice: Invoice }) {
    const s = STATUS_CONFIG[invoice.status];
    const StatusIcon = s.icon;

    return (
        <div className="max-w-3xl mx-auto">
            {/* Actions bar — screen only */}
            <div className="print:hidden flex items-center justify-between mb-6 px-1">
                <div className="flex items-center gap-2">
                    <span
                        className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest px-3 py-1.5 rounded-full"
                        style={{ background: s.bg, color: s.color }}
                    >
                        <StatusIcon size={11} />
                        {s.label}
                    </span>
                    <span className="text-sm text-white/30 font-mono">{invoice.invoiceNumber}</span>
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
                id="invoice-doc"
                className="bg-white text-[#1a1a1a] rounded-2xl overflow-hidden"
                style={{ boxShadow: '0 32px 80px rgba(0,0,0,0.35)' }}
            >
                {/* ── Header ───────────────────────────────────────────────────── */}
                <div className="relative overflow-hidden" style={{ background: '#1a1a1a' }}>
                    <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 80% 50%, rgba(184,149,106,0.10) 0%, transparent 65%)' }} />
                    <div className="relative px-12 pt-10 pb-8 flex items-start justify-between">
                        <div>
                            {/* Company logo */}
                            <img
                                src="/images/logo.png"
                                alt="Bridge Pointe"
                                style={{ height: '72px', width: 'auto', objectFit: 'contain', marginBottom: '12px' }}
                            />
                            <div className="text-[11px] text-white/30 space-y-0.5">
                                <p>Atlanta Metro Area, Georgia</p>
                                <p>(862) 421-8973 · Bridgepointefloors@gmail.com</p>
                            </div>
                        </div>

                        <div className="text-right">
                            <p className="text-[10px] uppercase tracking-[0.2em] text-white/25 mb-1">Invoice</p>
                            <p className="font-mono text-base font-bold text-white mb-4">{invoice.invoiceNumber}</p>
                            {invoice.estimateRef && (
                                <p className="text-[11px] text-white/25 mb-3">Estimate: {invoice.estimateRef}</p>
                            )}

                            {/* Status badge */}
                            <div
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest"
                                style={{ background: s.bg, color: s.color, border: `1px solid ${s.color}30` }}
                            >
                                <StatusIcon size={10} />
                                {s.label}
                            </div>
                        </div>
                    </div>
                    <div style={{ height: 3, background: 'linear-gradient(90deg, #b8956a 0%, #d4b896 50%, #b8956a 100%)' }} />
                </div>

                {/* ── Bill To & Dates ───────────────────────────────────────────── */}
                <div className="grid grid-cols-2 gap-0 border-b border-[#e8e3dc]">
                    <div className="px-12 py-7 border-r border-[#e8e3dc]">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#b8956a] mb-3">Bill To</p>
                        <p className="font-serif text-base font-bold text-[#1a1a1a] mb-0.5">{invoice.client.name}</p>
                        {invoice.client.company && <p className="text-sm text-[#4a4a4a] mb-1">{invoice.client.company}</p>}
                        <div className="text-[12px] text-[#6a6a6a] space-y-0.5 mt-2">
                            <p>{invoice.client.address}</p>
                            <p>{invoice.client.city}, {invoice.client.state} {invoice.client.zip}</p>
                            <p className="mt-1">{invoice.client.email}</p>
                            <p>{invoice.client.phone}</p>
                        </div>
                    </div>
                    <div className="px-12 py-7">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#b8956a] mb-4">Invoice Details</p>
                        <div className="space-y-2.5 text-[12px]">
                            <div className="flex justify-between">
                                <span className="text-[#9a9a9a]">Date Issued</span>
                                <span className="font-medium text-[#1a1a1a]">{invoice.issuedDate}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[#9a9a9a]">Payment Due</span>
                                <span className="font-medium text-[#1a1a1a]">{invoice.dueDate}</span>
                            </div>
                            {invoice.paidDate && (
                                <div className="flex justify-between">
                                    <span className="text-[#9a9a9a]">Date Paid</span>
                                    <span className="font-medium text-[#34d399]">{invoice.paidDate}</span>
                                </div>
                            )}
                        </div>
                        <div className="mt-5 pt-4 border-t border-[#e8e3dc]">
                            <p className="text-[10px] text-[#9a9a9a] uppercase tracking-wide mb-1">Project</p>
                            <p className="text-[12px] font-semibold text-[#1a1a1a] leading-snug">{invoice.project.title}</p>
                            <p className="text-[11px] text-[#9a9a9a] mt-0.5">{invoice.project.address}</p>
                        </div>
                    </div>
                </div>

                {/* ── Services Rendered ─────────────────────────────────────────── */}
                <div className="px-12 py-8 border-b border-[#e8e3dc]">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#b8956a] mb-5">Services Rendered</p>
                    <table className="w-full text-[12px]">
                        <thead>
                            <tr className="text-[10px] uppercase tracking-wide text-[#9a9a9a] border-b border-[#e8e3dc]">
                                <th className="text-left pb-3 font-medium">Description</th>
                                <th className="text-right pb-3 font-medium w-28">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoice.lineItems.map((item, i) => (
                                <tr key={i} className="border-b border-[#f0ece6] last:border-0">
                                    <td className="py-3 pr-6 text-[#4a4a4a] leading-relaxed">{item.description}</td>
                                    <td className="py-3 text-right font-semibold text-[#1a1a1a]">{fmt(item.total)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Totals */}
                    <div className="mt-6 flex justify-end">
                        <div className="w-60 space-y-0">
                            {invoice.taxAmount > 0 && (
                                <>
                                    <div className="flex justify-between text-[12px] py-2 border-t border-[#e8e3dc]">
                                        <span className="text-[#9a9a9a]">Subtotal</span>
                                        <span className="text-[#1a1a1a]">{fmt(invoice.subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between text-[12px] py-2 border-t border-[#e8e3dc]">
                                        <span className="text-[#9a9a9a]">Tax ({(invoice.taxRate * 100).toFixed(1)}%)</span>
                                        <span className="text-[#1a1a1a]">{fmt(invoice.taxAmount)}</span>
                                    </div>
                                </>
                            )}
                            <div className="flex justify-between text-[12px] py-2 border-t border-[#e8e3dc]">
                                <span className="text-[#9a9a9a]">Invoice Total</span>
                                <span className="font-semibold text-[#1a1a1a]">{fmt(invoice.total)}</span>
                            </div>
                            {invoice.amountPaid > 0 && (
                                <div className="flex justify-between text-[12px] py-2 border-t border-[#e8e3dc]">
                                    <span className="text-[#9a9a9a]">Amount Paid</span>
                                    <span className="font-semibold text-[#34d399]">({fmt(invoice.amountPaid)})</span>
                                </div>
                            )}
                            <div
                                className="flex justify-between items-center py-3 px-4 rounded-xl mt-2"
                                style={{ background: invoice.amountDue === 0 ? '#f0fdf8' : '#1a1a1a', border: invoice.amountDue === 0 ? '1px solid #bbf7d0' : 'none' }}
                            >
                                <span
                                    className="text-[11px] font-semibold uppercase tracking-wider"
                                    style={{ color: invoice.amountDue === 0 ? '#34d399' : 'rgba(255,255,255,0.5)' }}
                                >
                                    {invoice.amountDue === 0 ? 'Balance' : 'Amount Due'}
                                </span>
                                <span
                                    className="font-serif text-xl font-bold"
                                    style={{ color: invoice.amountDue === 0 ? '#34d399' : '#b8956a' }}
                                >
                                    {invoice.amountDue === 0 ? 'PAID' : fmt(invoice.amountDue)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Payment Instructions ─────────────────────────────────────── */}
                {invoice.amountDue > 0 && (
                    <div className="px-12 py-7 border-b border-[#e8e3dc]" style={{ background: '#faf8f5' }}>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#b8956a] mb-4">Payment Instructions</p>
                        <div className="grid grid-cols-2 gap-6 text-[12px]">
                            <div className="space-y-2">
                                <p className="text-[10px] text-[#9a9a9a] uppercase tracking-wide mb-1">Bank Transfer (ACH / Wire)</p>
                                <p><span className="text-[#9a9a9a]">Bank:</span> <span className="font-medium text-[#1a1a1a]">{invoice.paymentInstructions.bankName}</span></p>
                                <p><span className="text-[#9a9a9a]">Account Name:</span> <span className="font-medium text-[#1a1a1a]">{invoice.paymentInstructions.accountName}</span></p>
                                <p><span className="text-[#9a9a9a]">Routing:</span> <span className="font-medium text-[#1a1a1a]">{invoice.paymentInstructions.routing}</span></p>
                                <p><span className="text-[#9a9a9a]">Account:</span> <span className="font-medium text-[#1a1a1a]">{invoice.paymentInstructions.account}</span></p>
                            </div>
                            <div className="space-y-2">
                                {invoice.paymentInstructions.zelle && (
                                    <div>
                                        <p className="text-[10px] text-[#9a9a9a] uppercase tracking-wide mb-1">Zelle</p>
                                        <p className="font-medium text-[#1a1a1a]">{invoice.paymentInstructions.zelle}</p>
                                    </div>
                                )}
                                {invoice.paymentInstructions.check && (
                                    <div className="mt-3">
                                        <p className="text-[10px] text-[#9a9a9a] uppercase tracking-wide mb-1">Check</p>
                                        <p className="font-medium text-[#1a1a1a]">{invoice.paymentInstructions.check}</p>
                                        <p className="text-[#9a9a9a] mt-0.5">Include invoice number on memo line.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Notes ────────────────────────────────────────────────────── */}
                {invoice.notes && (
                    <div className="px-12 py-6 border-b border-[#e8e3dc]">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#b8956a] mb-2">Notes</p>
                        <p className="text-[12px] text-[#6a6a6a] leading-relaxed">{invoice.notes}</p>
                    </div>
                )}

                {/* ── Footer ───────────────────────────────────────────────────── */}
                <div className="px-12 py-6" style={{ background: '#1a1a1a' }}>
                    <div className="flex items-center justify-between text-[10px] text-white/20">
                        <span>Thank you for your business. We appreciate the opportunity to serve you.</span>
                        <span>{invoice.invoiceNumber} · bridgepointefloor.com</span>
                    </div>
                </div>
            </div>

            <style>{`
        @media print {
          body { background: white !important; }
          .print\\:hidden { display: none !important; }
          #invoice-doc { box-shadow: none !important; }
        }
      `}</style>
        </div>
    );
}

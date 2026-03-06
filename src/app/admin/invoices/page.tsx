'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Receipt, Plus, Trash2 } from 'lucide-react';
import { InvoiceCard } from '@/components/admin/invoice-card';

export const dynamic = 'force-dynamic';

function fmt(n: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToInvoice(r: any) {
    return {
        id: r.id,
        invoiceNumber: r.invoice_number,
        estimateRef: r.estimate_ref,
        status: r.status,
        issuedDate: r.issued_date,
        dueDate: r.due_date,
        paidDate: r.paid_date,
        client: r.client,
        project: r.project,
        lineItems: r.line_items,
        subtotal: Number(r.subtotal),
        taxRate: Number(r.tax_rate),
        taxAmount: Number(r.tax_amount),
        total: Number(r.total),
        amountPaid: Number(r.amount_paid),
        amountDue: Number(r.amount_due),
        paymentInstructions: r.payment_instructions,
        notes: r.notes,
    };
}

export default function InvoicesPage() {
    const [invoices, setInvoices] = useState<ReturnType<typeof rowToInvoice>[]>([]);
    const [loading, setLoading] = useState(true);

    async function load() {
        setLoading(true);
        const res = await fetch('/api/invoices');
        const data = await res.json();
        setInvoices(Array.isArray(data) ? data.map(rowToInvoice) : []);
        setLoading(false);
    }

    useEffect(() => { load(); }, []);

    async function deleteInvoice(id: string) {
        if (!confirm('Delete this invoice?')) return;
        await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
        setInvoices(p => p.filter(i => i.id !== id));
    }

    const totalInvoiced = invoices.reduce((s, i) => s + i.total, 0);
    const totalCollected = invoices.reduce((s, i) => s + i.amountPaid, 0);
    const totalOutstanding = invoices.reduce((s, i) => s + i.amountDue, 0);

    return (
        <div className="p-8 max-w-5xl">
            {/* Header */}
            <div className="mb-8 flex items-start justify-between">
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#b8956a] mb-1">Admin</p>
                    <h1 className="font-serif text-2xl font-bold text-white">Invoices</h1>
                </div>
                <div className="flex items-center gap-3">
                    {invoices.length > 0 && (
                        <div className="flex items-center gap-3">
                            {[
                                { label: 'Invoiced', value: fmt(totalInvoiced) },
                                { label: 'Collected', value: fmt(totalCollected) },
                                { label: 'Outstanding', value: fmt(totalOutstanding) },
                            ].map(s => (
                                <div key={s.label} className="bg-[#1a1a1a] border border-white/6 rounded-xl px-4 py-3 text-right">
                                    <p className="text-[10px] text-white/30 uppercase tracking-wide mb-0.5">{s.label}</p>
                                    <p className="font-serif text-sm font-bold text-white">{s.value}</p>
                                </div>
                            ))}
                        </div>
                    )}
                    <Link href="/admin/invoices/new"
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold uppercase tracking-wider transition-all"
                        style={{ background: 'linear-gradient(135deg, #b8956a 0%, #9a7a54 100%)', color: 'white' }}>
                        <Plus size={15} /> New Invoice
                    </Link>
                </div>
            </div>

            {/* Summary chips */}
            {invoices.length > 0 && (
                <div className="flex gap-3 mb-7 flex-wrap">
                    {[
                        { label: `${invoices.length} Total`, c: 'rgba(255,255,255,0.06)', t: 'rgba(255,255,255,0.4)' },
                        { label: `${invoices.filter(i => i.status === 'Paid').length} Paid`, c: 'rgba(52,211,153,0.1)', t: '#34d399' },
                        { label: `${invoices.filter(i => i.status === 'Partial').length} Partial`, c: 'rgba(251,191,36,0.1)', t: '#fbbf24' },
                        { label: `${invoices.filter(i => i.status === 'Outstanding').length} Outstanding`, c: 'rgba(96,165,250,0.1)', t: '#60a5fa' },
                    ].map(c => (
                        <span key={c.label} className="text-[11px] font-semibold px-3 py-1.5 rounded-full" style={{ background: c.c, color: c.t }}>{c.label}</span>
                    ))}
                </div>
            )}

            {/* List */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-6 h-6 rounded-full border-2 border-[#b8956a]/30 border-t-[#b8956a] animate-spin" />
                </div>
            ) : invoices.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-white/20">
                    <Receipt size={36} className="mb-3" />
                    <p className="text-sm mb-5">No invoices yet.</p>
                    <Link href="/admin/invoices/new"
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
                        style={{ background: 'rgba(184,149,106,0.12)', color: '#b8956a', border: '1px solid rgba(184,149,106,0.2)' }}>
                        <Plus size={14} /> Create your first invoice
                    </Link>
                </div>
            ) : (
                <div className="space-y-3">
                    {invoices.map(invoice => (
                        <div key={invoice.id} className="relative group">
                            <InvoiceCard invoice={invoice} />
                            <button
                                onClick={() => deleteInvoice(invoice.id)}
                                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 w-8 h-8 flex items-center justify-center rounded-lg text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-all z-10"
                                title="Delete invoice">
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

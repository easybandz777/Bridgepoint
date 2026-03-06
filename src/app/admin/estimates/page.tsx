'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, Plus, Trash2 } from 'lucide-react';
import { EstimateCard } from '@/components/admin/estimate-card';

export const dynamic = 'force-dynamic';

function fmt(n: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

// Map DB row to Estimate shape expected by EstimateCard
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToEstimate(r: any) {
    return {
        id: r.id,
        estimateNumber: r.estimate_number,
        status: r.status,
        createdDate: r.created_date,
        sentDate: r.sent_date,
        validUntil: r.valid_until,
        client: r.client,
        project: r.project,
        lineItems: r.line_items,
        subtotal: Number(r.subtotal),
        taxRate: Number(r.tax_rate),
        taxAmount: Number(r.tax_amount),
        total: Number(r.total),
        paymentSchedule: r.payment_schedule,
        terms: r.terms,
        notes: r.notes,
        preparedBy: r.prepared_by,
    };
}

export default function EstimatesPage() {
    const [estimates, setEstimates] = useState<ReturnType<typeof rowToEstimate>[]>([]);
    const [loading, setLoading] = useState(true);

    async function load() {
        setLoading(true);
        const res = await fetch('/api/estimates');
        const data = await res.json();
        setEstimates(Array.isArray(data) ? data.map(rowToEstimate) : []);
        setLoading(false);
    }

    useEffect(() => { load(); }, []);

    async function deleteEstimate(id: string) {
        if (!confirm('Delete this estimate?')) return;
        await fetch(`/api/estimates/${id}`, { method: 'DELETE' });
        setEstimates(p => p.filter(e => e.id !== id));
    }

    const total = estimates.reduce((s, e) => s + e.total, 0);
    const approved = estimates.filter(e => e.status === 'Approved').length;
    const pending = estimates.filter(e => e.status === 'Sent' || e.status === 'Draft').length;

    return (
        <div className="p-8 max-w-5xl">
            {/* Header */}
            <div className="mb-8 flex items-start justify-between">
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#b8956a] mb-1">Admin</p>
                    <h1 className="font-serif text-2xl font-bold text-white">Estimates & Proposals</h1>
                </div>
                <div className="flex items-center gap-3">
                    {estimates.length > 0 && (
                        <div className="bg-[#1a1a1a] border border-white/6 rounded-xl px-4 py-3 text-right">
                            <p className="text-[10px] text-white/30 uppercase tracking-wide mb-0.5">Pipeline</p>
                            <p className="font-serif text-base font-bold text-white">{fmt(total)}</p>
                        </div>
                    )}
                    <Link href="/admin/estimates/new"
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold uppercase tracking-wider transition-all"
                        style={{ background: 'linear-gradient(135deg, #b8956a 0%, #9a7a54 100%)', color: 'white' }}>
                        <Plus size={15} /> New Estimate
                    </Link>
                </div>
            </div>

            {/* Summary chips */}
            {estimates.length > 0 && (
                <div className="flex gap-3 mb-7 flex-wrap">
                    {[
                        { label: `${estimates.length} Total`, color: 'rgba(255,255,255,0.06)', text: 'rgba(255,255,255,0.4)' },
                        { label: `${approved} Approved`, color: 'rgba(52,211,153,0.1)', text: '#34d399' },
                        { label: `${pending} Pending`, color: 'rgba(96,165,250,0.1)', text: '#60a5fa' },
                    ].map(c => (
                        <span key={c.label} className="text-[11px] font-semibold px-3 py-1.5 rounded-full" style={{ background: c.color, color: c.text }}>{c.label}</span>
                    ))}
                </div>
            )}

            {/* List */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-6 h-6 rounded-full border-2 border-[#b8956a]/30 border-t-[#b8956a] animate-spin" />
                </div>
            ) : estimates.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-white/20">
                    <FileText size={36} className="mb-3" />
                    <p className="text-sm mb-5">No estimates yet.</p>
                    <Link href="/admin/estimates/new"
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
                        style={{ background: 'rgba(184,149,106,0.12)', color: '#b8956a', border: '1px solid rgba(184,149,106,0.2)' }}>
                        <Plus size={14} /> Create your first estimate
                    </Link>
                </div>
            ) : (
                <div className="space-y-3">
                    {estimates.map(estimate => (
                        <div key={estimate.id} className="relative group">
                            <EstimateCard estimate={estimate} />
                            <button
                                onClick={() => deleteEstimate(estimate.id)}
                                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 w-8 h-8 flex items-center justify-center rounded-lg text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-all z-10"
                                title="Delete estimate">
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

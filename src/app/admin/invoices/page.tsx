import { SAMPLE_INVOICES } from '@/lib/invoices';
import { InvoiceCard } from '@/components/admin/invoice-card';
import { Receipt } from 'lucide-react';

function fmt(n: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

export default function InvoicesPage() {
    const totalInvoiced = SAMPLE_INVOICES.reduce((s, i) => s + i.total, 0);
    const totalOutstanding = SAMPLE_INVOICES.reduce((s, i) => s + i.amountDue, 0);
    const totalCollected = SAMPLE_INVOICES.reduce((s, i) => s + i.amountPaid, 0);

    return (
        <div className="p-8 max-w-5xl">
            {/* Header */}
            <div className="mb-8 flex items-start justify-between">
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#b8956a] mb-1">Admin</p>
                    <h1 className="font-serif text-2xl font-bold text-white">Invoices</h1>
                </div>
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
            </div>

            {/* Summary chips */}
            <div className="flex gap-3 mb-7 flex-wrap">
                {[
                    { label: `${SAMPLE_INVOICES.length} Total`, c: 'rgba(255,255,255,0.06)', t: 'rgba(255,255,255,0.4)' },
                    { label: `${SAMPLE_INVOICES.filter(i => i.status === 'Paid').length} Paid`, c: 'rgba(52,211,153,0.1)', t: '#34d399' },
                    { label: `${SAMPLE_INVOICES.filter(i => i.status === 'Partial').length} Partial`, c: 'rgba(251,191,36,0.1)', t: '#fbbf24' },
                    { label: `${SAMPLE_INVOICES.filter(i => i.status === 'Outstanding').length} Outstanding`, c: 'rgba(96,165,250,0.1)', t: '#60a5fa' },
                ].map(c => (
                    <span key={c.label} className="text-[11px] font-semibold px-3 py-1.5 rounded-full" style={{ background: c.c, color: c.t }}>
                        {c.label}
                    </span>
                ))}
            </div>

            {/* List */}
            {SAMPLE_INVOICES.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-white/20">
                    <Receipt size={36} className="mb-3" />
                    <p className="text-sm">No invoices yet.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {SAMPLE_INVOICES.map(invoice => (
                        <InvoiceCard key={invoice.id} invoice={invoice} />
                    ))}
                </div>
            )}
        </div>
    );
}

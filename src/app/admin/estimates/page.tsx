import { SAMPLE_ESTIMATES, formatCurrency } from '@/lib/estimates';
import { EstimateCard } from '@/components/admin/estimate-card';
import { FileText } from 'lucide-react';

export default function EstimatesPage() {
    const total = SAMPLE_ESTIMATES.reduce((s, e) => s + e.total, 0);
    const approved = SAMPLE_ESTIMATES.filter(e => e.status === 'Approved');
    const pending = SAMPLE_ESTIMATES.filter(e => e.status === 'Sent' || e.status === 'Draft');

    return (
        <div className="p-8 max-w-5xl">
            {/* Header */}
            <div className="mb-8 flex items-start justify-between">
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#b8956a] mb-1">Admin</p>
                    <h1 className="font-serif text-2xl font-bold text-white">Estimates & Proposals</h1>
                </div>
                <div className="flex items-center gap-3 text-right">
                    <div className="bg-[#1a1a1a] border border-white/6 rounded-xl px-4 py-3">
                        <p className="text-[10px] text-white/30 uppercase tracking-wide mb-0.5">Pipeline</p>
                        <p className="font-serif text-base font-bold text-white">{formatCurrency(total)}</p>
                    </div>
                </div>
            </div>

            {/* Summary chips */}
            <div className="flex gap-3 mb-7 flex-wrap">
                {[
                    { label: `${SAMPLE_ESTIMATES.length} Total`, color: 'rgba(255,255,255,0.06)', text: 'rgba(255,255,255,0.4)' },
                    { label: `${approved.length} Approved`, color: 'rgba(52,211,153,0.1)', text: '#34d399' },
                    { label: `${pending.length} Pending`, color: 'rgba(96,165,250,0.1)', text: '#60a5fa' },
                ].map(c => (
                    <span key={c.label} className="text-[11px] font-semibold px-3 py-1.5 rounded-full" style={{ background: c.color, color: c.text }}>
                        {c.label}
                    </span>
                ))}
            </div>

            {/* List */}
            {SAMPLE_ESTIMATES.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-white/20">
                    <FileText size={36} className="mb-3" />
                    <p className="text-sm">No estimates yet.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {SAMPLE_ESTIMATES.map(estimate => (
                        <EstimateCard key={estimate.id} estimate={estimate} />
                    ))}
                </div>
            )}
        </div>
    );
}

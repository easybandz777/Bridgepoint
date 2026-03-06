import Link from 'next/link';
import { type Estimate, formatCurrency } from '@/lib/estimates';
import { Eye, Clock } from 'lucide-react';

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
    Draft: { bg: 'rgba(255,255,255,0.06)', text: 'rgba(255,255,255,0.4)' },
    Sent: { bg: 'rgba(96,165,250,0.12)', text: '#60a5fa' },
    Approved: { bg: 'rgba(52,211,153,0.12)', text: '#34d399' },
    Declined: { bg: 'rgba(248,113,113,0.12)', text: '#f87171' },
};

export function EstimateCard({ estimate }: { estimate: Estimate }) {
    const s = STATUS_STYLES[estimate.status];
    return (
        <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-5 hover:border-[#b8956a]/30 transition-all group">
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-2">
                        <span className="text-[10px] font-mono text-white/25">{estimate.estimateNumber}</span>
                        <span
                            className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full"
                            style={{ background: s.bg, color: s.text }}
                        >
                            {estimate.status}
                        </span>
                    </div>
                    <h3 className="font-serif text-base text-white font-semibold leading-snug mb-1 truncate">
                        {estimate.client.name}
                    </h3>
                    <p className="text-xs text-white/40 truncate mb-3">
                        {estimate.project.title}
                    </p>
                    <div className="flex items-center gap-4 text-[11px] text-white/25">
                        <span className="flex items-center gap-1.5">
                            <Clock size={10} />
                            Issued {estimate.createdDate}
                        </span>
                        <span>Valid until {estimate.validUntil}</span>
                    </div>
                </div>

                <div className="text-right shrink-0">
                    <p className="font-serif text-xl font-bold text-white mb-1">
                        {formatCurrency(estimate.total)}
                    </p>
                    <p className="text-[10px] text-white/25 uppercase tracking-wide mb-3">Total</p>
                    <Link
                        href={`/admin/estimates/${estimate.id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#b8956a] hover:text-[#d4b896] transition-colors"
                    >
                        <Eye size={12} />
                        View Proposal
                    </Link>
                </div>
            </div>
        </div>
    );
}

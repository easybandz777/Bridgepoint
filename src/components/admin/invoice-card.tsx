'use client';

import Link from 'next/link';
import { useState } from 'react';
import { type Invoice } from '@/lib/invoices';
import {
    Eye,
    Clock,
    CheckCircle,
    AlertCircle,
    XCircle,
    Timer,
    Copy,
    Check,
    Link as LinkIcon,
} from 'lucide-react';

const STATUS_CONFIG: Record<string, { bg: string; text: string; icon: typeof CheckCircle }> = {
    Paid: { bg: 'rgba(52,211,153,0.12)', text: '#34d399', icon: CheckCircle },
    Partial: { bg: 'rgba(251,191,36,0.12)', text: '#fbbf24', icon: Timer },
    Outstanding: { bg: 'rgba(96,165,250,0.12)', text: '#60a5fa', icon: AlertCircle },
    Overdue: { bg: 'rgba(248,113,113,0.12)', text: '#f87171', icon: XCircle },
};

function fmt(n: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n);
}

function getAppUrlClient(): string {
    if (typeof window !== 'undefined') return window.location.origin;
    return '';
}

export function InvoiceCard({ invoice }: { invoice: Invoice }) {
    const s = STATUS_CONFIG[invoice.status] ?? STATUS_CONFIG.Outstanding;
    const StatusIcon = s.icon;
    const [copied, setCopied] = useState(false);
    const [toast, setToast] = useState<string | null>(null);

    async function handleCopy(e: React.MouseEvent) {
        e.preventDefault();
        e.stopPropagation();
        const url = `${getAppUrlClient()}/pay/${invoice.id}`;
        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(url);
            } else {
                const ta = document.createElement('textarea');
                ta.value = url;
                ta.style.position = 'fixed';
                ta.style.opacity = '0';
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
            }
            setCopied(true);
            setToast('Pay link copied');
            window.setTimeout(() => setCopied(false), 1800);
            window.setTimeout(() => setToast(null), 2200);
        } catch {
            setToast('Could not copy');
            window.setTimeout(() => setToast(null), 2200);
        }
    }

    return (
        <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-5 hover:border-[#b8956a]/30 transition-all group">
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-2">
                        <span className="text-[10px] font-mono text-white/25">{invoice.invoiceNumber}</span>
                        <span
                            className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full"
                            style={{ background: s.bg, color: s.text }}
                        >
                            <StatusIcon size={10} />
                            {invoice.status}
                        </span>
                        {invoice.estimateRef && (
                            <span className="text-[10px] text-white/20">Ref: {invoice.estimateRef}</span>
                        )}
                    </div>
                    <h3 className="font-serif text-base text-white font-semibold leading-snug mb-1 truncate">
                        {invoice.client.name}
                    </h3>
                    <p className="text-xs text-white/40 truncate mb-3">
                        {invoice.project.title}
                    </p>
                    <div className="flex items-center gap-4 text-[11px] text-white/25">
                        <span className="flex items-center gap-1.5">
                            <Clock size={10} />
                            Issued {invoice.issuedDate}
                        </span>
                        <span>Due {invoice.dueDate}</span>
                        {invoice.paidDate && <span className="text-[#34d399]/60">Paid {invoice.paidDate}</span>}
                    </div>
                </div>

                <div className="text-right shrink-0">
                    <p className="font-serif text-xl font-bold text-white mb-0.5">
                        {fmt(invoice.total)}
                    </p>
                    <p className="text-[10px] text-white/25 uppercase tracking-wide mb-1">Total</p>
                    {invoice.amountDue > 0 && (
                        <p className="text-xs mb-3" style={{ color: s.text }}>
                            {fmt(invoice.amountDue)} due
                        </p>
                    )}
                    {invoice.amountDue === 0 && (
                        <p className="text-xs text-[#34d399]/60 mb-3">Paid in full</p>
                    )}
                    <div className="inline-flex items-center gap-3">
                        <button
                            type="button"
                            onClick={handleCopy}
                            title="Copy pay link"
                            aria-label="Copy pay link"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-white/40 hover:text-white transition-colors"
                        >
                            {copied ? (
                                <>
                                    <Check size={12} />
                                    Copied
                                </>
                            ) : (
                                <>
                                    <LinkIcon size={12} />
                                    Pay link
                                    <Copy size={11} className="opacity-60" />
                                </>
                            )}
                        </button>
                        <Link
                            href={`/admin/invoices/${invoice.id}`}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#b8956a] hover:text-[#d4b896] transition-colors"
                        >
                            <Eye size={12} />
                            View Invoice
                        </Link>
                    </div>
                </div>
            </div>

            {toast && (
                <div
                    className="fixed bottom-6 right-6 z-[200] rounded-xl border border-emerald-400/40 bg-[#1a1a1a]/95 backdrop-blur shadow-2xl px-3 py-2 text-xs font-semibold text-emerald-300"
                    role="status"
                    aria-live="polite"
                >
                    {toast}
                </div>
            )}
        </div>
    );
}

'use client';

/**
 * Admin card shown on the invoice detail page. Bundles:
 *   - "Pay Online" link (read-only field + copy button)
 *   - "Record Payment" button (opens RecordPaymentDialog)
 *   - "Send Pay Email" button (TODO stub — logs to console for now)
 *   - List of payments recorded against the invoice
 *
 * Imports the manual-payment dialog from the parallel agent's file; this
 * card only owns the open-state and refetches the payment list when the
 * dialog reports a save.
 */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
    Copy,
    Check,
    Mail,
    Plus,
    Receipt,
    Loader2,
    ExternalLink,
} from 'lucide-react';
import { RecordPaymentDialog } from './record-payment-dialog';
import type { PaymentRow } from '@/lib/stripe/payments';
import { formatCurrency } from '@/lib/estimates';

interface InvoicePaymentsCardProps {
    invoiceId: string;
    invoiceNumber: string;
    amountDue: number;
    /** Optional initial server-rendered list — avoids a flash on first paint. */
    initialPayments?: PaymentRow[];
    /** Absolute public pay URL e.g. `${appUrl}/pay/${invoiceId}` */
    payUrl: string;
}

type ToastKind = 'success' | 'error' | 'info';
interface ToastRow {
    id: number;
    title: string;
    kind: ToastKind;
}

const STATUS_PILL: Record<PaymentRow['status'], { bg: string; text: string; label: string }> = {
    pending: { bg: 'rgba(251,191,36,0.12)', text: '#fbbf24', label: 'Pending' },
    succeeded: { bg: 'rgba(52,211,153,0.12)', text: '#34d399', label: 'Succeeded' },
    failed: { bg: 'rgba(248,113,113,0.12)', text: '#f87171', label: 'Failed' },
    refunded: { bg: 'rgba(148,163,184,0.12)', text: '#94a3b8', label: 'Refunded' },
    disputed: { bg: 'rgba(251,146,60,0.12)', text: '#fb923c', label: 'Disputed' },
};

const METHOD_LABEL: Record<PaymentRow['method'], string> = {
    card: 'Card',
    ach: 'ACH',
    check: 'Check',
    cash: 'Cash',
    other: 'Other',
};

const PROCESSOR_LABEL: Record<NonNullable<PaymentRow['processor']>, string> = {
    stripe: 'Stripe',
    manual: 'Manual',
    qb: 'QuickBooks',
};

function formatDate(iso: string | null): string {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function InvoicePaymentsCard({
    invoiceId,
    invoiceNumber,
    amountDue,
    initialPayments,
    payUrl,
}: InvoicePaymentsCardProps) {
    const [payments, setPayments] = useState<PaymentRow[]>(initialPayments ?? []);
    const [loading, setLoading] = useState<boolean>(initialPayments === undefined);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const [toasts, setToasts] = useState<ToastRow[]>([]);

    const fireToast = useCallback((title: string, kind: ToastKind = 'info') => {
        const id = Date.now() + Math.random();
        setToasts((prev) => [...prev, { id, title, kind }]);
        window.setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 2500);
    }, []);

    const refetch = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/payments?invoiceId=${encodeURIComponent(invoiceId)}`);
            if (!res.ok) throw new Error(`Failed to load payments (${res.status})`);
            const data = (await res.json()) as { payments?: PaymentRow[] };
            setPayments(Array.isArray(data.payments) ? data.payments : []);
        } catch (e) {
            console.error('[invoice-payments-card] refetch failed:', e);
            fireToast('Could not load payments', 'error');
        } finally {
            setLoading(false);
        }
    }, [invoiceId, fireToast]);

    // Only refetch if we weren't given initial data.
    useEffect(() => {
        if (initialPayments === undefined) void refetch();
    }, [initialPayments, refetch]);

    async function handleCopy() {
        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(payUrl);
            } else {
                // Fallback for older browsers
                const ta = document.createElement('textarea');
                ta.value = payUrl;
                ta.style.position = 'fixed';
                ta.style.opacity = '0';
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
            }
            setCopied(true);
            fireToast('Pay link copied to clipboard', 'success');
            window.setTimeout(() => setCopied(false), 1800);
        } catch {
            fireToast('Could not copy — copy manually instead', 'error');
        }
    }

    function handleSendEmail() {
        // TODO: wire to email sender. For now this just logs + toasts so the
        // operator gets a visible confirmation the button is reachable.
        console.log('Email sender not implemented', { invoiceId, payUrl });
        fireToast('Email sending not implemented yet', 'info');
    }

    const showEmpty = !loading && payments.length === 0;

    return (
        <div className="max-w-3xl mx-auto mt-8 print:hidden">
            <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2.5">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#b8956a]">
                            Payments
                        </span>
                        <span className="text-[10px] text-white/25 font-mono">
                            {payments.length === 0 ? '—' : `${payments.length} recorded`}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleSendEmail}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-semibold uppercase tracking-wider transition-all bg-white/5 border border-white/8 text-white/60 hover:text-white hover:bg-white/8"
                        >
                            <Mail size={12} />
                            Send Pay Email
                        </button>
                        <button
                            type="button"
                            onClick={() => setDialogOpen(true)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-semibold uppercase tracking-wider text-white transition-all"
                            style={{
                                background:
                                    'linear-gradient(135deg, #b8956a 0%, #9a7a54 100%)',
                            }}
                        >
                            <Plus size={12} />
                            Record Payment
                        </button>
                    </div>
                </div>

                {/* Pay Online Link */}
                <div className="mb-6">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-2">
                        Pay Online Link
                    </p>
                    <div className="flex items-stretch gap-2">
                        <input
                            type="text"
                            value={payUrl}
                            readOnly
                            onFocus={(e) => e.currentTarget.select()}
                            className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white/80 font-mono focus:outline-none focus:border-[#b8956a]/40"
                        />
                        <button
                            type="button"
                            onClick={handleCopy}
                            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-[11px] font-semibold uppercase tracking-wider bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/8 transition-all"
                            aria-label="Copy pay link"
                        >
                            {copied ? (
                                <>
                                    <Check size={12} />
                                    Copied
                                </>
                            ) : (
                                <>
                                    <Copy size={12} />
                                    Copy
                                </>
                            )}
                        </button>
                    </div>
                    <p className="mt-1.5 text-[10px] text-white/30">
                        Share this URL with the customer to accept card or ACH payments online.
                    </p>
                </div>

                {/* Payments list */}
                <div>
                    {loading && (
                        <div className="flex items-center justify-center py-10 text-white/30">
                            <Loader2 size={18} className="animate-spin" />
                        </div>
                    )}

                    {showEmpty && (
                        <div className="flex flex-col items-center justify-center py-10 text-white/30 border border-dashed border-white/8 rounded-xl">
                            <Receipt size={24} className="mb-2" />
                            <p className="text-xs">
                                No payments recorded for this invoice yet.
                            </p>
                        </div>
                    )}

                    {!loading && payments.length > 0 && (
                        <div className="overflow-hidden rounded-xl border border-white/6">
                            <table className="w-full text-left">
                                <thead className="bg-white/3">
                                    <tr className="text-[10px] uppercase tracking-wider text-white/40">
                                        <th className="px-4 py-2.5 font-semibold">Date</th>
                                        <th className="px-4 py-2.5 font-semibold">Amount</th>
                                        <th className="px-4 py-2.5 font-semibold">Method</th>
                                        <th className="px-4 py-2.5 font-semibold">Processor</th>
                                        <th className="px-4 py-2.5 font-semibold">Status</th>
                                        <th className="px-4 py-2.5 font-semibold text-right" />
                                    </tr>
                                </thead>
                                <tbody className="text-xs text-white/80">
                                    {payments.map((p) => {
                                        const pill = STATUS_PILL[p.status];
                                        const isRefund = p.status === 'refunded';
                                        const dateValue = p.receivedDate ?? p.createdAt;
                                        return (
                                            <tr
                                                key={p.id}
                                                className="border-t border-white/5 hover:bg-white/3 transition-colors"
                                            >
                                                <td className="px-4 py-3 whitespace-nowrap text-white/70">
                                                    {formatDate(dateValue)}
                                                </td>
                                                <td
                                                    className={`px-4 py-3 font-mono whitespace-nowrap ${isRefund ? 'text-white/40 line-through' : 'text-white'}`}
                                                >
                                                    {formatCurrency(p.amount)}
                                                </td>
                                                <td className="px-4 py-3 text-white/60">
                                                    {METHOD_LABEL[p.method] ?? p.method}
                                                </td>
                                                <td className="px-4 py-3 text-white/50">
                                                    {p.processor
                                                        ? (PROCESSOR_LABEL[p.processor] ?? p.processor)
                                                        : '—'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span
                                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide"
                                                        style={{ background: pill.bg, color: pill.text }}
                                                    >
                                                        {pill.label}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <Link
                                                        href={`/admin/payments/${p.id}`}
                                                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#b8956a] hover:text-[#d4b896] transition-colors"
                                                    >
                                                        View
                                                        <ExternalLink size={10} />
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            <RecordPaymentDialog
                isOpen={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onRecorded={() => {
                    fireToast('Payment recorded', 'success');
                    void refetch();
                }}
                invoiceId={invoiceId}
                invoiceNumber={invoiceNumber}
                amountDue={amountDue}
            />

            {/* Inline lightweight toast viewport — admin layout doesn't wrap a
                ToastProvider, so we render our own bottom-right stack. */}
            {toasts.length > 0 && (
                <div
                    className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2 w-[min(92vw,320px)]"
                    role="region"
                    aria-live="polite"
                    aria-label="Notifications"
                >
                    {toasts.map((t) => {
                        const accent =
                            t.kind === 'success'
                                ? 'border-emerald-400/40 text-emerald-300'
                                : t.kind === 'error'
                                    ? 'border-red-400/40 text-red-300'
                                    : 'border-white/15 text-white/80';
                        return (
                            <div
                                key={t.id}
                                className={`rounded-xl border ${accent} bg-[#1a1a1a]/95 backdrop-blur shadow-2xl px-3 py-2 text-xs font-semibold`}
                                role="status"
                            >
                                {t.title}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

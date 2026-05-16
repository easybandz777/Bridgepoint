'use client';

/**
 * Action row for the Payment detail page.
 *
 * - Stripe + succeeded   → "Refund full" + "Refund partial" (dialog)
 * - Manual + succeeded   → "Void / Mark refunded"
 * - Always               → "Resync invoice" (if linked to an invoice)
 *
 * Every destructive action is gated by a confirm step. The refund routes
 * to `/api/payments/[id]/refund`; void uses the same route (server side
 * branches on processor type). Resync uses a server action.
 */
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { RotateCcw, Undo2, RefreshCw, AlertCircle } from 'lucide-react';
import { Modal } from '@/components/admin/modal';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import type { PaymentProcessor, PaymentStatus } from '@/lib/stripe/payments';
import { resyncInvoiceAction } from './actions';

interface PaymentActionsProps {
    paymentId: string;
    invoiceId: string | null;
    amount: number;
    status: PaymentStatus;
    processor: PaymentProcessor | null;
}

type RefundReason = 'duplicate' | 'fraudulent' | 'requested_by_customer';

function fmtMoney(n: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
    }).format(n);
}

export function PaymentActions({
    paymentId,
    invoiceId,
    amount,
    status,
    processor,
}: PaymentActionsProps) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [confirmFullOpen, setConfirmFullOpen] = useState(false);
    const [confirmVoidOpen, setConfirmVoidOpen] = useState(false);
    const [partialOpen, setPartialOpen] = useState(false);

    const isStripe = processor === 'stripe';
    const isManual = processor === 'manual';
    const canRefund = status === 'succeeded';

    async function callRefund(body: {
        amount?: number;
        reason?: RefundReason;
    }): Promise<{ ok: boolean; error?: string }> {
        try {
            setBusy(true);
            setError(null);
            const res = await fetch(`/api/payments/${paymentId}/refund`, {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = (await res.json()) as { ok?: boolean; error?: string };
            if (!res.ok || !data.ok) {
                const msg = data.error ?? 'Refund failed';
                setError(msg);
                return { ok: false, error: msg };
            }
            startTransition(() => router.refresh());
            return { ok: true };
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            setError(msg);
            return { ok: false, error: msg };
        } finally {
            setBusy(false);
        }
    }

    function onRefundFull() {
        void callRefund({});
    }

    function onVoid() {
        void callRefund({});
    }

    async function onResync() {
        if (!invoiceId) return;
        try {
            setBusy(true);
            setError(null);
            const res = await resyncInvoiceAction(paymentId, invoiceId);
            if (!res.ok) {
                setError(res.error ?? 'Resync failed');
                return;
            }
            startTransition(() => router.refresh());
        } finally {
            setBusy(false);
        }
    }

    const showAnything =
        (isStripe && canRefund) || (isManual && canRefund) || !!invoiceId;

    if (!showAnything) {
        return null;
    }

    return (
        <>
            <section className="bg-[#131313] border border-white/10 rounded-2xl p-6">
                <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40 mb-4">
                    Actions
                </h2>
                <div className="flex flex-wrap gap-3">
                    {isStripe && canRefund && (
                        <>
                            <button
                                type="button"
                                onClick={() => setConfirmFullOpen(true)}
                                disabled={busy || pending}
                                className="inline-flex items-center gap-2 h-10 px-5 rounded-full text-sm font-semibold bg-red-500/15 text-red-300 border border-red-500/25 hover:bg-red-500/25 disabled:opacity-50 transition-colors"
                            >
                                <Undo2 size={14} />
                                Refund full
                            </button>
                            <button
                                type="button"
                                onClick={() => setPartialOpen(true)}
                                disabled={busy || pending}
                                className="inline-flex items-center gap-2 h-10 px-5 rounded-full text-sm font-semibold bg-white/5 text-white/80 border border-white/10 hover:bg-white/10 disabled:opacity-50 transition-colors"
                            >
                                <Undo2 size={14} />
                                Refund partial
                            </button>
                        </>
                    )}

                    {isManual && canRefund && (
                        <button
                            type="button"
                            onClick={() => setConfirmVoidOpen(true)}
                            disabled={busy || pending}
                            className="inline-flex items-center gap-2 h-10 px-5 rounded-full text-sm font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/25 hover:bg-amber-500/25 disabled:opacity-50 transition-colors"
                        >
                            <RotateCcw size={14} />
                            Void / Mark refunded
                        </button>
                    )}

                    {invoiceId && (
                        <button
                            type="button"
                            onClick={() => void onResync()}
                            disabled={busy || pending}
                            className="inline-flex items-center gap-2 h-10 px-5 rounded-full text-sm font-semibold text-[#b8956a] border border-[#b8956a]/30 hover:bg-[#b8956a]/10 disabled:opacity-50 transition-colors"
                        >
                            <RefreshCw size={14} className={busy ? 'animate-spin' : ''} />
                            Resync invoice
                        </button>
                    )}
                </div>

                {error && (
                    <div className="mt-4 flex items-start gap-2 bg-red-500/10 border border-red-500/25 text-red-300 text-xs px-3 py-2.5 rounded-xl">
                        <AlertCircle size={14} className="shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{error}</span>
                    </div>
                )}
            </section>

            <ConfirmDialog
                isOpen={confirmFullOpen}
                onClose={() => setConfirmFullOpen(false)}
                onConfirm={onRefundFull}
                title="Refund this payment in full?"
                message={`This will issue a Stripe refund of ${fmtMoney(amount)} back to the original payment method. This action cannot be undone.`}
                confirmText="Refund"
                destructive
            />

            <ConfirmDialog
                isOpen={confirmVoidOpen}
                onClose={() => setConfirmVoidOpen(false)}
                onConfirm={onVoid}
                title="Mark this payment as refunded?"
                message={`The original ${fmtMoney(amount)} payment will be flipped to "refunded" and the linked invoice rebalanced. No money will move — this is for manual / offline payments only.`}
                confirmText="Mark refunded"
                destructive
            />

            <PartialRefundDialog
                isOpen={partialOpen}
                onClose={() => setPartialOpen(false)}
                maxAmount={amount}
                busy={busy}
                onSubmit={(refundAmount, reason) =>
                    callRefund({ amount: refundAmount, reason })
                }
            />
        </>
    );
}

interface PartialRefundDialogProps {
    isOpen: boolean;
    onClose: () => void;
    maxAmount: number;
    busy: boolean;
    onSubmit: (
        amount: number,
        reason?: RefundReason,
    ) => Promise<{ ok: boolean; error?: string }>;
}

function PartialRefundDialog({
    isOpen,
    onClose,
    maxAmount,
    busy,
    onSubmit,
}: PartialRefundDialogProps) {
    const [amountStr, setAmountStr] = useState('');
    const [reason, setReason] = useState<RefundReason | ''>('');
    const [localErr, setLocalErr] = useState<string | null>(null);

    const amountNum = Number(amountStr);
    const valid =
        Number.isFinite(amountNum) && amountNum > 0 && amountNum <= maxAmount;

    async function handleSubmit() {
        setLocalErr(null);
        if (!valid) {
            setLocalErr(`Enter an amount between $0.01 and ${fmtMoney(maxAmount)}.`);
            return;
        }
        const result = await onSubmit(amountNum, reason || undefined);
        if (result.ok) {
            setAmountStr('');
            setReason('');
            onClose();
        } else if (result.error) {
            setLocalErr(result.error);
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Partial refund" className="max-w-md">
            <div className="space-y-4 mb-6">
                <div>
                    <label className="text-[11px] uppercase tracking-wider text-white/40 mb-1.5 block">
                        Amount (max {fmtMoney(maxAmount)})
                    </label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-sm">
                            $
                        </span>
                        <input
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            min="0.01"
                            max={maxAmount}
                            value={amountStr}
                            onChange={(e) => setAmountStr(e.target.value)}
                            placeholder="0.00"
                            className="w-full h-11 pl-8 pr-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/25 focus:outline-none focus:border-[#b8956a]/50 transition-colors text-sm"
                        />
                    </div>
                </div>

                <div>
                    <label className="text-[11px] uppercase tracking-wider text-white/40 mb-1.5 block">
                        Reason (optional)
                    </label>
                    <select
                        value={reason}
                        onChange={(e) => setReason(e.target.value as RefundReason | '')}
                        className="w-full h-11 px-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#b8956a]/50 transition-colors text-sm"
                    >
                        <option value="">No reason</option>
                        <option value="duplicate">Duplicate</option>
                        <option value="fraudulent">Fraudulent</option>
                        <option value="requested_by_customer">Requested by customer</option>
                    </select>
                </div>

                {localErr && (
                    <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/25 text-red-300 text-xs px-3 py-2.5 rounded-xl">
                        <AlertCircle size={14} className="shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{localErr}</span>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/6">
                <button
                    onClick={onClose}
                    disabled={busy}
                    className="h-10 px-5 rounded-full text-sm font-semibold text-white/50 hover:text-white hover:bg-white/5 disabled:opacity-50 transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={() => void handleSubmit()}
                    disabled={!valid || busy}
                    className="h-10 px-5 rounded-full text-sm font-semibold bg-red-500 hover:bg-red-600 text-white disabled:opacity-50 transition-colors"
                >
                    {busy ? 'Refunding…' : 'Refund'}
                </button>
            </div>
        </Modal>
    );
}

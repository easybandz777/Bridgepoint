/**
 * Interactive payment client for the /pay/[invoiceId] landing page.
 *
 * Three modes:
 *
 *   1. 'new'      — render the big "Pay $X" CTA. On click, POST to
 *                   /api/payments/checkout, receive a hosted Stripe Checkout
 *                   URL, and redirect the browser.
 *   2. 'success'  — the customer came back from Checkout with a session_id.
 *                   GET /api/payments/checkout/[sessionId] and read
 *                   `paymentStatus`. Poll every 2s for up to 30s if the
 *                   status is `pending` (ACH still verifying).
 *   3. 'canceled' — Checkout was abandoned. Show a friendly message and
 *                   offer a "Try again" link that drops back to /pay/[id].
 *
 * Visual style matches the warm customer-facing palette used on the
 * about / contact pages (no admin theme leak).
 */
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Loader2, Lock, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { PayInvoiceSummary } from './page';

type Mode = 'new' | 'success' | 'canceled';

interface PayClientProps {
    mode: Mode;
    invoice: PayInvoiceSummary;
    sessionId?: string;
}

const usd = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
});

interface CheckoutPostResponse {
    url?: string;
    sessionId?: string;
    error?: string;
}

interface SessionStatusResponse {
    status: string | null;
    paymentStatus: string | null;
    amountTotal: number;
    invoiceId: string | null;
    error?: string;
}

export function PayClient({ mode, invoice, sessionId }: PayClientProps) {
    if (mode === 'success' && sessionId) {
        return <SuccessView sessionId={sessionId} invoice={invoice} />;
    }
    if (mode === 'canceled') {
        return <CanceledView invoice={invoice} />;
    }
    return <NewView invoice={invoice} />;
}

// ─── New ────────────────────────────────────────────────────────────────────

function NewView({ invoice }: { invoice: PayInvoiceSummary }) {
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handlePay = useCallback(async () => {
        setSubmitting(true);
        setError(null);
        try {
            const res = await fetch('/api/payments/checkout', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ invoiceId: invoice.id }),
            });
            const data = (await res.json()) as CheckoutPostResponse;
            if (!res.ok || !data.url) {
                throw new Error(data.error ?? 'Could not start checkout');
            }
            // Hand off to Stripe-hosted Checkout.
            window.location.href = data.url;
        } catch (e) {
            const message = e instanceof Error ? e.message : String(e);
            setError(message);
            setSubmitting(false);
        }
    }, [invoice.id]);

    return (
        <div>
            <Button
                type="button"
                size="lg"
                onClick={handlePay}
                disabled={submitting}
                className="w-full"
            >
                {submitting ? (
                    <>
                        <Loader2 size={18} className="mr-2 animate-spin" />
                        Redirecting…
                    </>
                ) : (
                    <>
                        <Lock size={16} className="mr-2" />
                        Pay {usd.format(invoice.amountDue)}
                    </>
                )}
            </Button>

            <p className="mt-4 text-center font-sans text-xs leading-relaxed text-slate-light">
                Secure checkout by Stripe. Accepts cards, Apple Pay, Google
                Pay, and bank debit (ACH).
            </p>

            {error && (
                <div
                    role="alert"
                    className="mt-6 border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                >
                    <p className="font-semibold">Something went wrong.</p>
                    <p className="mt-1 text-red-600">{error}</p>
                    <button
                        type="button"
                        onClick={handlePay}
                        className="mt-3 font-sans text-xs font-semibold uppercase tracking-wider text-red-700 underline-offset-4 transition-colors hover:text-red-900 hover:underline"
                    >
                        Try again
                    </button>
                </div>
            )}
        </div>
    );
}

// ─── Success ────────────────────────────────────────────────────────────────

type PaymentPhase = 'loading' | 'paid' | 'pending' | 'unpaid' | 'error';

function SuccessView({
    sessionId,
    invoice,
}: {
    sessionId: string;
    invoice: PayInvoiceSummary;
}) {
    const [phase, setPhase] = useState<PaymentPhase>('loading');
    const [amount, setAmount] = useState<number>(invoice.amountDue);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Cancellable polling: stop ticking on unmount or once we resolve.
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const startedAtRef = useRef<number>(Date.now());
    const cancelledRef = useRef<boolean>(false);

    useEffect(() => {
        cancelledRef.current = false;
        startedAtRef.current = Date.now();

        async function tick() {
            if (cancelledRef.current) return;
            try {
                const res = await fetch(
                    `/api/payments/checkout/${encodeURIComponent(sessionId)}`,
                    { cache: 'no-store' },
                );
                const data = (await res.json()) as SessionStatusResponse;
                if (!res.ok) {
                    throw new Error(data.error ?? 'Could not confirm payment');
                }
                if (cancelledRef.current) return;

                if (data.amountTotal && data.amountTotal > 0) {
                    setAmount(data.amountTotal);
                }

                const paymentStatus = data.paymentStatus ?? 'unpaid';
                if (paymentStatus === 'paid' || paymentStatus === 'no_payment_required') {
                    setPhase('paid');
                    return;
                }
                if (paymentStatus === 'unpaid') {
                    // For ACH, Stripe may keep `unpaid` until the bank
                    // verification finishes. Keep polling for up to 30s
                    // before giving up.
                    const elapsed = Date.now() - startedAtRef.current;
                    if (elapsed >= 30_000) {
                        setPhase('unpaid');
                        return;
                    }
                    setPhase('pending');
                    timeoutRef.current = setTimeout(tick, 2_000);
                    return;
                }
                // Anything else — treat as pending and keep polling within budget.
                const elapsed = Date.now() - startedAtRef.current;
                if (elapsed >= 30_000) {
                    setPhase('pending');
                    return;
                }
                setPhase('pending');
                timeoutRef.current = setTimeout(tick, 2_000);
            } catch (e) {
                if (cancelledRef.current) return;
                const message = e instanceof Error ? e.message : String(e);
                setErrorMessage(message);
                setPhase('error');
            }
        }

        tick();

        return () => {
            cancelledRef.current = true;
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [sessionId]);

    if (phase === 'loading') {
        return (
            <StatusBlock
                tone="neutral"
                icon={<Loader2 size={32} className="animate-spin text-gold" />}
                title="Confirming your payment…"
                body="Just a moment while we check with our payment processor."
            />
        );
    }

    if (phase === 'paid') {
        return (
            <StatusBlock
                tone="success"
                icon={<CheckCircle2 size={40} className="text-emerald-600" />}
                title="Thank you!"
                body={`Your payment of ${usd.format(amount)} has been received.`}
            >
                <p className="mt-3 text-sm leading-relaxed text-slate">
                    A receipt will be emailed to you
                    {invoice.clientEmail ? ` at ${invoice.clientEmail}` : ''}.
                </p>
            </StatusBlock>
        );
    }

    if (phase === 'pending') {
        return (
            <StatusBlock
                tone="neutral"
                icon={<Loader2 size={32} className="animate-spin text-gold" />}
                title="Payment processing"
                body="Bank debit (ACH) payments can take a moment to verify. We'll email you once it clears — there's nothing more to do."
            />
        );
    }

    if (phase === 'unpaid') {
        return (
            <StatusBlock
                tone="warning"
                icon={<XCircle size={36} className="text-red-600" />}
                title="We couldn't confirm your payment"
                body="If you completed checkout, your receipt may still arrive shortly. Otherwise, try again or contact us."
            >
                <div className="mt-5">
                    <Link href={`/pay/${invoice.id}`}>
                        <Button type="button" size="md" variant="primary">
                            Try again
                        </Button>
                    </Link>
                </div>
            </StatusBlock>
        );
    }

    // phase === 'error'
    return (
        <StatusBlock
            tone="warning"
            icon={<XCircle size={36} className="text-red-600" />}
            title="Couldn't reach our payment processor"
            body={errorMessage ?? 'Please refresh or try again in a moment.'}
        >
            <div className="mt-5">
                <Link href={`/pay/${invoice.id}`}>
                    <Button type="button" size="md" variant="primary">
                        Try again
                    </Button>
                </Link>
            </div>
        </StatusBlock>
    );
}

// ─── Canceled ───────────────────────────────────────────────────────────────

function CanceledView({ invoice }: { invoice: PayInvoiceSummary }) {
    return (
        <StatusBlock
            tone="neutral"
            icon={<XCircle size={36} className="text-slate" />}
            title="Payment canceled"
            body="No charge was made. You can return to checkout whenever you're ready."
        >
            <div className="mt-5">
                <Link href={`/pay/${invoice.id}`}>
                    <Button type="button" size="md" variant="primary">
                        Try again
                    </Button>
                </Link>
            </div>
        </StatusBlock>
    );
}

// ─── Shared status block ────────────────────────────────────────────────────

type Tone = 'success' | 'warning' | 'neutral';

const TONE_CLASSES: Record<Tone, string> = {
    success: 'border-emerald-200 bg-emerald-50/60',
    warning: 'border-red-200 bg-red-50/60',
    neutral: 'border-charcoal/10 bg-warm-white',
};

function StatusBlock({
    tone,
    icon,
    title,
    body,
    children,
}: {
    tone: Tone;
    icon: React.ReactNode;
    title: string;
    body: string;
    children?: React.ReactNode;
}) {
    return (
        <div
            className={cn(
                'border p-8 text-center',
                TONE_CLASSES[tone],
            )}
            role="status"
        >
            <div className="mx-auto flex items-center justify-center">
                {icon}
            </div>
            <h3 className="mt-5 font-serif text-2xl font-bold text-charcoal">
                {title}
            </h3>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate">
                {body}
            </p>
            {children}
        </div>
    );
}

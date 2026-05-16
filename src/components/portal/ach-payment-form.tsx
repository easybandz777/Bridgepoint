'use client';

/**
 * Standalone ACH payment form for the customer portal.
 *
 * We don't have `@stripe/react-stripe-js` installed (only the vanilla
 * `@stripe/stripe-js` loader), so this skips PaymentElement and uses
 * the JS API directly:
 *
 *   1. POST /api/payments/ach/payment-intent → get `client_secret`.
 *   2. `stripe.collectBankAccountForPayment(...)` — opens the Stripe-hosted
 *      Financial Connections sheet for bank account selection + ToS consent.
 *   3. `stripe.confirmUsBankAccountPayment(client_secret)` — finalizes the
 *      ACH debit. The PaymentIntent immediately moves to `processing`;
 *      the webhook will land `payment_intent.succeeded` 3–5 business days
 *      later when ACH clears, and the webhook drain will write the payments
 *      row + reconcile the invoice.
 */
import { useState, useCallback, useEffect } from 'react';
import { loadStripe, type Stripe as StripeJs } from '@stripe/stripe-js';
import { getPublishableKey } from '@/lib/stripe/client';

interface AchPaymentFormProps {
    invoiceId: string;
    amount: number;
    /** Billing name attached to the bank account. Required by Stripe ACH. */
    customerName: string;
    /** Billing email attached to the bank account. Required by Stripe ACH. */
    customerEmail: string;
    onSuccess?: () => void;
}

type FormState =
    | { kind: 'idle' }
    | { kind: 'loading' }
    | { kind: 'ready'; clientSecret: string; paymentIntentId: string }
    | { kind: 'verifying' }
    | { kind: 'confirming' }
    | { kind: 'success' }
    | { kind: 'error'; message: string };

let _stripePromise: Promise<StripeJs | null> | null = null;
function getStripePromise(): Promise<StripeJs | null> {
    if (_stripePromise) return _stripePromise;
    const pk = getPublishableKey();
    if (!pk) return Promise.resolve(null);
    _stripePromise = loadStripe(pk);
    return _stripePromise;
}

interface PaymentIntentResponseShape {
    clientSecret: string;
    paymentIntentId: string;
}
interface ErrorResponseShape {
    error: string;
}

function isErrorResponse(j: unknown): j is ErrorResponseShape {
    return typeof j === 'object' && j !== null && typeof (j as { error?: unknown }).error === 'string';
}
function isPiResponse(j: unknown): j is PaymentIntentResponseShape {
    return (
        typeof j === 'object' &&
        j !== null &&
        typeof (j as { clientSecret?: unknown }).clientSecret === 'string' &&
        typeof (j as { paymentIntentId?: unknown }).paymentIntentId === 'string'
    );
}

export function AchPaymentForm({
    invoiceId,
    amount,
    customerName,
    customerEmail,
    onSuccess,
}: AchPaymentFormProps): React.JSX.Element {
    const [state, setState] = useState<FormState>({ kind: 'idle' });

    const fetchClientSecret = useCallback(async (): Promise<void> => {
        setState({ kind: 'loading' });
        try {
            const res = await fetch('/api/payments/ach/payment-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ invoiceId, amount }),
            });
            const json: unknown = await res.json();
            if (!res.ok) {
                const msg = isErrorResponse(json) ? json.error : `HTTP ${res.status}`;
                setState({ kind: 'error', message: msg });
                return;
            }
            if (!isPiResponse(json)) {
                setState({ kind: 'error', message: 'Unexpected response from server' });
                return;
            }
            setState({
                kind: 'ready',
                clientSecret: json.clientSecret,
                paymentIntentId: json.paymentIntentId,
            });
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            setState({ kind: 'error', message: msg });
        }
    }, [invoiceId, amount]);

    useEffect(() => {
        void fetchClientSecret();
    }, [fetchClientSecret]);

    const onPay = useCallback(async (): Promise<void> => {
        if (state.kind !== 'ready') return;
        const clientSecret = state.clientSecret;

        const stripe = await getStripePromise();
        if (!stripe) {
            setState({ kind: 'error', message: 'Stripe.js failed to load (missing publishable key?)' });
            return;
        }

        setState({ kind: 'verifying' });

        const collectResult = await stripe.collectBankAccountForPayment({
            clientSecret,
            params: {
                payment_method_type: 'us_bank_account',
                payment_method_data: {
                    billing_details: {
                        name: customerName,
                        email: customerEmail,
                    },
                },
            },
        });

        if (collectResult.error) {
            setState({
                kind: 'error',
                message: collectResult.error.message ?? 'Bank account collection failed',
            });
            return;
        }

        const collectedIntent = collectResult.paymentIntent;
        if (!collectedIntent) {
            setState({ kind: 'error', message: 'Stripe did not return a PaymentIntent' });
            return;
        }

        // If the user cancelled the FC sheet, status reverts to requires_payment_method.
        if (collectedIntent.status === 'requires_payment_method') {
            setState({ kind: 'error', message: 'Bank account selection cancelled' });
            return;
        }

        // status is now `requires_confirmation` (the customer has consented).
        setState({ kind: 'confirming' });
        const confirmResult = await stripe.confirmUsBankAccountPayment(clientSecret);

        if (confirmResult.error) {
            setState({
                kind: 'error',
                message: confirmResult.error.message ?? 'Payment confirmation failed',
            });
            return;
        }

        // ACH clears in 3-5 business days. `processing` is the success state
        // for the immediate UX; the webhook will finalize the payments row.
        const pi = confirmResult.paymentIntent;
        if (pi && (pi.status === 'processing' || pi.status === 'succeeded')) {
            setState({ kind: 'success' });
            if (onSuccess) onSuccess();
            return;
        }

        setState({
            kind: 'error',
            message: `Unexpected PaymentIntent status: ${pi?.status ?? 'unknown'}`,
        });
    }, [state, customerName, customerEmail, onSuccess]);

    const amountLabel = amount.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
    });

    if (state.kind === 'loading' || state.kind === 'idle') {
        return (
            <div className="rounded-lg border border-neutral-200 p-4 text-sm text-neutral-600">
                Preparing bank payment…
            </div>
        );
    }

    if (state.kind === 'error') {
        return (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 space-y-3">
                <div>{state.message}</div>
                <button
                    type="button"
                    onClick={() => void fetchClientSecret()}
                    className="rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
                >
                    Try again
                </button>
            </div>
        );
    }

    if (state.kind === 'success') {
        return (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                Bank payment of {amountLabel} initiated. ACH transfers typically settle in 3–5 business days.
            </div>
        );
    }

    const busy = state.kind === 'verifying' || state.kind === 'confirming';
    const busyLabel =
        state.kind === 'verifying'
            ? 'Connecting to your bank…'
            : state.kind === 'confirming'
                ? 'Submitting payment…'
                : '';

    return (
        <div className="rounded-lg border border-neutral-200 p-4 space-y-3">
            <div className="text-sm text-neutral-700">
                Pay <span className="font-semibold">{amountLabel}</span> by bank transfer (ACH).
                You'll be asked to log into your bank to authorize the debit.
            </div>
            <button
                type="button"
                onClick={() => void onPay()}
                disabled={busy}
                className="w-full rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {busy ? busyLabel : 'Verify Bank & Pay'}
            </button>
            <div className="text-xs text-neutral-500">
                Secured by Stripe. ACH transfers settle in 3–5 business days.
            </div>
        </div>
    );
}

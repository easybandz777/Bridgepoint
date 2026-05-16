/**
 * Drains unprocessed rows from `payments_webhook_events`.
 *
 * Runs from a Vercel cron via /api/payments/cron. Handles the events we
 * care about (Checkout completion, PaymentIntent succeeded / failed,
 * Charge refunded) and writes them through to the payments table via
 * `recordPayment`, which in turn reconciles the linked invoice.
 *
 * Any handler error stamps `process_error` and leaves `processed_at` null
 * so the next run retries. We cap a single drain at 50 events to stay
 * within Vercel function time limits.
 */
import type Stripe from 'stripe';
import sql from '@/lib/db';
import {
    recordPayment,
    paymentFromIntent,
    fromStripeAmount,
} from './payments';

interface QueueRow {
    id: string;
    type: string;
    payload: { data?: { object?: unknown }; type?: string } & Record<string, unknown>;
    attempts: number;
}

export interface DrainResult {
    processed: number;
    failed: number;
    skipped: number;
    errors: { id: string; type: string; error: string }[];
}

export async function drainWebhookEvents(opts: { limit?: number } = {}): Promise<DrainResult> {
    const limit = opts.limit ?? 50;
    const rows = (await sql`
        SELECT id, type, payload, attempts
        FROM payments_webhook_events
        WHERE processed_at IS NULL
        ORDER BY received_at ASC
        LIMIT ${limit}
    `) as unknown as QueueRow[];

    const result: DrainResult = { processed: 0, failed: 0, skipped: 0, errors: [] };

    for (const row of rows) {
        try {
            await handleEvent(row.type, row.payload);
            await sql`
                UPDATE payments_webhook_events
                SET processed_at = NOW(), process_error = NULL
                WHERE id = ${row.id}
            `;
            result.processed += 1;
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            await sql`
                UPDATE payments_webhook_events
                SET process_error = ${msg}, attempts = attempts + 1
                WHERE id = ${row.id}
            `;
            result.failed += 1;
            result.errors.push({ id: row.id, type: row.type, error: msg });
        }
    }
    return result;
}

async function handleEvent(type: string, payload: QueueRow['payload']): Promise<void> {
    const obj = payload?.data?.object;
    if (!obj || typeof obj !== 'object') return;

    switch (type) {
        case 'checkout.session.completed':
            await onCheckoutCompleted(obj as Stripe.Checkout.Session);
            return;

        case 'payment_intent.succeeded':
        case 'payment_intent.payment_failed':
        case 'payment_intent.canceled':
            await onPaymentIntent(obj as Stripe.PaymentIntent);
            return;

        case 'charge.refunded':
        case 'charge.dispute.created':
            await onCharge(obj as Stripe.Charge);
            return;

        default:
            // Unknown event type — mark processed so it doesn't requeue.
            return;
    }
}

async function onCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    if (session.payment_status !== 'paid') return;
    if (!session.payment_intent || typeof session.payment_intent !== 'string') return;
    // The PaymentIntent webhook will land separately with the full charge
    // details, but record a pending row here so the user sees it instantly.
    const invoiceId = session.metadata?.invoice_id ?? null;
    const customerId = session.metadata?.customer_id ?? null;
    if (!invoiceId) return;
    await recordPayment({
        amount: fromStripeAmount(session.amount_total),
        currency: (session.currency ?? 'usd').toUpperCase(),
        method: 'card',
        status: 'succeeded',
        invoiceId,
        customerId,
        processor: 'stripe',
        processorChargeId: session.payment_intent,
        metadata: { checkout_session: session.id, ...(session.metadata ?? {}) },
    });
}

async function onPaymentIntent(pi: Stripe.PaymentIntent): Promise<void> {
    const invoiceId = pi.metadata?.invoice_id ?? null;
    const customerId = pi.metadata?.customer_id ?? null;
    if (!invoiceId) return; // Not one of ours.
    await recordPayment(paymentFromIntent(pi, { invoiceId, customerId }));
}

async function onCharge(charge: Stripe.Charge): Promise<void> {
    const chargeId = typeof charge.payment_intent === 'string' ? charge.payment_intent : null;
    if (!chargeId) return;
    const refunded = charge.refunded || (charge.amount_refunded ?? 0) > 0;
    const disputed = charge.disputed;
    const newStatus = disputed ? 'disputed' : refunded ? 'refunded' : 'succeeded';
    await sql`
        UPDATE payments SET
            status = ${newStatus},
            updated_at = NOW(),
            metadata = metadata || ${JSON.stringify({
        amount_refunded: fromStripeAmount(charge.amount_refunded),
        disputed,
    })}::jsonb
        WHERE processor_charge_id = ${chargeId}
    `;
    // Reconcile the linked invoice if any.
    const rows = (await sql`
        SELECT invoice_id FROM payments WHERE processor_charge_id = ${chargeId} LIMIT 1
    `) as unknown as { invoice_id: string | null }[];
    const invoiceId = rows[0]?.invoice_id;
    if (invoiceId) {
        const { reconcileInvoice } = await import('./payments');
        await reconcileInvoice(invoiceId);
    }
}

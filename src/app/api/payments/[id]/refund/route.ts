/**
 * POST /api/payments/[id]/refund
 *
 * Refund (Stripe) or void (manual) a payment. For Stripe payments the
 * `charge.refunded` webhook is the canonical source of truth, but this
 * endpoint also marks the row as `refunded` immediately on a full refund
 * so the admin UI reflects the action without waiting for webhook drain.
 *
 * Request body:
 *   {
 *     amount?: number;                                  // omit = full refund
 *     reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
 *   }
 *
 * Response: `{ ok: true, refundId: string }` or `{ error }` with 4xx/5xx.
 */
import { NextResponse } from 'next/server';
import sql, { initDB, logActivity } from '@/lib/db';
import { getStripe } from '@/lib/stripe/client';
import {
    getPayment,
    reconcileInvoice,
    toStripeAmount,
    type PaymentRow,
} from '@/lib/stripe/payments';

type Ctx = { params: Promise<{ id: string }> };

type RefundReason = 'duplicate' | 'fraudulent' | 'requested_by_customer';

interface RefundBody {
    amount?: number;
    reason?: RefundReason;
}

interface SuccessResponse {
    ok: true;
    refundId: string;
    full: boolean;
}

interface ErrorResponse {
    error: string;
}

const VALID_REASONS: readonly RefundReason[] = [
    'duplicate',
    'fraudulent',
    'requested_by_customer',
];

function parseReason(raw: unknown): RefundReason | undefined {
    if (typeof raw !== 'string') return undefined;
    return (VALID_REASONS as readonly string[]).includes(raw)
        ? (raw as RefundReason)
        : undefined;
}

function parseAmount(raw: unknown, max: number): number | undefined {
    if (raw == null || raw === '') return undefined;
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) return undefined;
    // Don't let the caller refund more than the original amount.
    return Math.min(n, max);
}

async function markRowRefunded(id: string): Promise<void> {
    await sql`
        UPDATE payments SET
            status = 'refunded',
            updated_at = NOW()
        WHERE id = ${id}
    `;
}

export async function POST(
    req: Request,
    ctx: Ctx,
): Promise<NextResponse<SuccessResponse | ErrorResponse>> {
    try {
        await initDB();
        const { id } = await ctx.params;

        const payment: PaymentRow | null = await getPayment(id);
        if (!payment) {
            return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
        }

        if (payment.status === 'refunded') {
            return NextResponse.json(
                { error: 'Payment is already refunded' },
                { status: 409 },
            );
        }
        if (payment.status !== 'succeeded') {
            return NextResponse.json(
                { error: `Cannot refund a payment with status "${payment.status}"` },
                { status: 409 },
            );
        }

        // Body is optional; default to full refund with no reason.
        let body: RefundBody = {};
        try {
            body = (await req.json()) as RefundBody;
        } catch {
            // ignore — empty body is allowed
        }

        const refundAmount = parseAmount(body.amount, payment.amount);
        const isFullRefund = refundAmount == null || refundAmount >= payment.amount;
        const reason = parseReason(body.reason);

        // ── Manual / offline payments: there's no Stripe charge to refund.
        //    Treat this as a "void" — flip status locally and reconcile.
        if (payment.processor !== 'stripe') {
            await markRowRefunded(payment.id);
            if (payment.invoiceId) await reconcileInvoice(payment.invoiceId);
            await logActivity(
                'payment',
                payment.id,
                'voided',
                `Voided ${payment.processor ?? 'manual'} payment of $${payment.amount}`,
            );
            return NextResponse.json({
                ok: true,
                refundId: `void-${payment.id}`,
                full: true,
            });
        }

        // ── Stripe path
        if (!payment.processorChargeId) {
            return NextResponse.json(
                { error: 'Stripe payment is missing processor_charge_id' },
                { status: 422 },
            );
        }

        const stripe = getStripe();
        const refund = await stripe.refunds.create({
            payment_intent: payment.processorChargeId,
            amount: refundAmount != null ? toStripeAmount(refundAmount) : undefined,
            reason,
        });

        // The webhook will eventually write back the canonical status, but
        // for full refunds also flip the row immediately for UI feedback.
        if (isFullRefund) {
            await markRowRefunded(payment.id);
        }
        if (payment.invoiceId) await reconcileInvoice(payment.invoiceId);

        await logActivity(
            'payment',
            payment.id,
            'refunded',
            isFullRefund
                ? `Refunded $${payment.amount} via Stripe`
                : `Partial refund of $${refundAmount} via Stripe`,
            'admin',
            { refundId: refund.id, full: isFullRefund, reason: reason ?? null },
        );

        return NextResponse.json({
            ok: true,
            refundId: refund.id,
            full: isFullRefund,
        });
    } catch (e) {
        console.error('[api/payments/[id]/refund] POST failed:', e);
        const message = e instanceof Error ? e.message : String(e);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

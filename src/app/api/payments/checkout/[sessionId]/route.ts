/**
 * Read-only lookup for a Stripe Checkout session. Lets the success page poll
 * for status without ever needing the publishable or secret key on the
 * client. Returns the small set of fields the UI actually cares about.
 */
import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe/client';
import { fromStripeAmount } from '@/lib/stripe/payments';

interface SessionStatusResponse {
    status: string | null;
    paymentStatus: string | null;
    amountTotal: number;
    invoiceId: string | null;
}

interface ErrorResponse {
    error: string;
}

type Ctx = { params: Promise<{ sessionId: string }> };

export async function GET(_req: Request, ctx: Ctx): Promise<NextResponse<SessionStatusResponse | ErrorResponse>> {
    try {
        const { sessionId } = await ctx.params;
        if (!sessionId) {
            return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
        }
        const stripe = getStripe();
        const session = await stripe.checkout.sessions.retrieve(sessionId, {
            expand: ['payment_intent', 'payment_intent.latest_charge'],
        });
        return NextResponse.json({
            status: session.status ?? null,
            paymentStatus: session.payment_status ?? null,
            amountTotal: fromStripeAmount(session.amount_total),
            invoiceId: session.metadata?.invoice_id ?? null,
        });
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        // Stripe surfaces "No such checkout.session" as StripeInvalidRequestError.
        if (message.includes('No such checkout.session')) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }
        console.error('[checkout/:sessionId] GET failed:', e);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

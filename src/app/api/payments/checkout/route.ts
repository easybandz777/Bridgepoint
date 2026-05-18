/**
 * Stripe Checkout session creation for invoice payments.
 *
 * POST { invoiceId } — creates a hosted Checkout session for the named
 * invoice and returns the URL the client should redirect to.
 *
 * GET ?invoiceId=... — same logic but reads the invoice id from the query
 * string. Useful for a public pay page that just needs to forward the user
 * to Stripe without rendering a form.
 *
 * Card + ACH are enabled together; Stripe's hosted UI lets the payer pick.
 * Metadata is written onto both the Session and the underlying PaymentIntent
 * so the webhook drain can match completed payments back to the invoice
 * regardless of which event arrives first.
 */
import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import sql, { initDB } from '@/lib/db';
import { getStripe, getAppUrl } from '@/lib/stripe/client';
import { ensureStripeCustomer, toStripeAmount } from '@/lib/stripe/payments';

interface InvoiceRow {
    id: string;
    invoice_number: string;
    status: string;
    total: string | number;
    amount_due: string | number;
    customer_id: string | null;
    client: { email?: string | null; name?: string | null } | null;
}

interface CheckoutSessionResponse {
    url: string | null;
    sessionId: string;
}

interface ErrorResponse {
    error: string;
}

async function createSession(invoiceId: string): Promise<
    | { ok: true; data: CheckoutSessionResponse }
    | { ok: false; status: number; body: ErrorResponse }
> {
    if (!invoiceId || typeof invoiceId !== 'string') {
        return { ok: false, status: 400, body: { error: 'invoiceId is required' } };
    }

    const rows = (await sql`
        SELECT id, invoice_number, status, total, amount_due, customer_id, client
        FROM invoices WHERE id = ${invoiceId} LIMIT 1
    `) as unknown as InvoiceRow[];

    if (rows.length === 0) {
        return { ok: false, status: 404, body: { error: 'Invoice not found' } };
    }

    const invoice = rows[0];
    const amountDue = Number(invoice.amount_due ?? 0);

    if (invoice.status === 'Paid' || !Number.isFinite(amountDue) || amountDue <= 0) {
        return { ok: false, status: 400, body: { error: 'Invoice already paid or has no balance due' } };
    }

    const stripe = getStripe();

    let stripeCustomerId: string | null = null;
    if (invoice.customer_id) {
        stripeCustomerId = await ensureStripeCustomer(invoice.customer_id);
    }

    const clientEmail = invoice.client?.email ?? null;

    const params: Stripe.Checkout.SessionCreateParams = {
        mode: 'payment',
        payment_method_types: ['card', 'us_bank_account'],
        line_items: [
            {
                quantity: 1,
                price_data: {
                    currency: 'usd',
                    unit_amount: toStripeAmount(amountDue),
                    product_data: {
                        name: `Invoice ${invoice.invoice_number}`,
                    },
                },
            },
        ],
        success_url: `${getAppUrl()}/pay/${invoiceId}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${getAppUrl()}/pay/${invoiceId}?canceled=1`,
        metadata: {
            invoice_id: invoiceId,
            customer_id: invoice.customer_id ?? '',
            invoice_number: invoice.invoice_number,
        },
        payment_intent_data: {
            metadata: {
                invoice_id: invoiceId,
                customer_id: invoice.customer_id ?? '',
            },
        },
    };

    if (stripeCustomerId) {
        params.customer = stripeCustomerId;
    } else if (clientEmail) {
        params.customer_email = clientEmail;
    }

    const session = await stripe.checkout.sessions.create(params);

    return {
        ok: true,
        data: { url: session.url, sessionId: session.id },
    };
}

export async function POST(req: Request): Promise<NextResponse<CheckoutSessionResponse | ErrorResponse>> {
    try {
        await initDB();
        const body = (await req.json()) as { invoiceId?: string };
        const result = await createSession(body.invoiceId ?? '');
        if (!result.ok) {
            return NextResponse.json(result.body, { status: result.status });
        }
        return NextResponse.json(result.data);
    } catch (e) {
        console.error('[checkout] POST failed:', e);
        const message = e instanceof Error ? e.message : String(e);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function GET(req: Request): Promise<NextResponse<CheckoutSessionResponse | ErrorResponse>> {
    try {
        await initDB();
        const invoiceId = new URL(req.url).searchParams.get('invoiceId') ?? '';
        const result = await createSession(invoiceId);
        if (!result.ok) {
            return NextResponse.json(result.body, { status: result.status });
        }
        return NextResponse.json(result.data);
    } catch (e) {
        console.error('[checkout] GET failed:', e);
        const message = e instanceof Error ? e.message : String(e);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

/**
 * Stripe ACH PaymentIntent endpoint — one-off bank debit against an invoice.
 *
 * Standalone ACH-only flow (no Checkout). The client side opens Stripe.js
 * with the returned `client_secret`, walks the user through Financial
 * Connections to attach a bank account, and confirms the PaymentIntent.
 *
 * Webhooks land via /api/payments/webhook → webhook-drain, which detects
 * `us_bank_account` and writes a payments row with `method='ach'`.
 */
import { NextResponse } from 'next/server';
import sql, { initDB } from '@/lib/db';
import { getStripe } from '@/lib/stripe/client';
import { ensureStripeCustomer, toStripeAmount } from '@/lib/stripe/payments';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface PaymentIntentRequest {
    invoiceId: string;
    amount?: number;
}

export interface PaymentIntentResponse {
    clientSecret: string;
    paymentIntentId: string;
}

export interface PaymentIntentErrorResponse {
    error: string;
}

interface InvoiceRow {
    id: string;
    customer_id: string | null;
    amount_due: string | number;
    total: string | number;
}

export async function POST(
    req: Request,
): Promise<NextResponse<PaymentIntentResponse | PaymentIntentErrorResponse>> {
    let body: Partial<PaymentIntentRequest>;
    try {
        body = (await req.json()) as Partial<PaymentIntentRequest>;
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const invoiceId = body.invoiceId;
    if (!invoiceId || typeof invoiceId !== 'string') {
        return NextResponse.json({ error: 'invoiceId is required' }, { status: 400 });
    }

    const requestedAmount = body.amount;
    if (
        requestedAmount !== undefined &&
        (typeof requestedAmount !== 'number' || !Number.isFinite(requestedAmount) || requestedAmount <= 0)
    ) {
        return NextResponse.json(
            { error: 'amount must be a positive number when provided' },
            { status: 400 },
        );
    }

    try {
        await initDB();

        const rows = (await sql`
            SELECT id, customer_id, amount_due, total
            FROM invoices WHERE id = ${invoiceId} LIMIT 1
        `) as unknown as InvoiceRow[];

        if (rows.length === 0) {
            return NextResponse.json({ error: `Invoice ${invoiceId} not found` }, { status: 404 });
        }

        const invoice = rows[0];
        const customerId = invoice.customer_id;
        const amountDue = Number(invoice.amount_due ?? 0);
        const amount = requestedAmount ?? amountDue;

        if (!Number.isFinite(amount) || amount <= 0) {
            return NextResponse.json(
                { error: 'Invoice has no outstanding amount due' },
                { status: 400 },
            );
        }

        const stripeCustomerId = customerId ? await ensureStripeCustomer(customerId) : undefined;
        const stripe = getStripe();

        const pi = await stripe.paymentIntents.create({
            amount: toStripeAmount(amount),
            currency: 'usd',
            customer: stripeCustomerId,
            payment_method_types: ['us_bank_account'],
            payment_method_options: {
                us_bank_account: {
                    financial_connections: {
                        permissions: ['payment_method', 'balances'],
                    },
                    verification_method: 'instant',
                },
            },
            metadata: {
                invoice_id: invoiceId,
                customer_id: customerId ?? '',
            },
        });

        if (!pi.client_secret) {
            return NextResponse.json(
                { error: 'Stripe returned a PaymentIntent without a client_secret' },
                { status: 500 },
            );
        }

        return NextResponse.json({
            clientSecret: pi.client_secret,
            paymentIntentId: pi.id,
        });
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

/**
 * Stripe ACH SetupIntent endpoint.
 *
 * Used when we want a customer to *attach* a bank account (via Stripe
 * Financial Connections) without immediately moving money — e.g. so we
 * can debit them later for recurring or follow-up invoices.
 *
 * The client side opens Stripe.js with the returned `client_secret`,
 * walks the customer through Financial Connections account selection,
 * and the resulting Payment Method is saved against the Stripe Customer.
 */
import { NextResponse } from 'next/server';
import { initDB } from '@/lib/db';
import { getStripe } from '@/lib/stripe/client';
import { ensureStripeCustomer } from '@/lib/stripe/payments';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface SetupIntentRequest {
    customerId: string;
}

export interface SetupIntentResponse {
    clientSecret: string;
}

export interface SetupIntentErrorResponse {
    error: string;
}

export async function POST(
    req: Request,
): Promise<NextResponse<SetupIntentResponse | SetupIntentErrorResponse>> {
    let body: Partial<SetupIntentRequest>;
    try {
        body = (await req.json()) as Partial<SetupIntentRequest>;
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const customerId = body.customerId;
    if (!customerId || typeof customerId !== 'string') {
        return NextResponse.json({ error: 'customerId is required' }, { status: 400 });
    }

    try {
        await initDB();
        const stripeCustomerId = await ensureStripeCustomer(customerId);
        const stripe = getStripe();

        const setupIntent = await stripe.setupIntents.create({
            customer: stripeCustomerId,
            payment_method_types: ['us_bank_account'],
            payment_method_options: {
                us_bank_account: {
                    financial_connections: {
                        permissions: ['payment_method', 'balances'],
                    },
                },
            },
            metadata: { crm_customer_id: customerId },
        });

        if (!setupIntent.client_secret) {
            return NextResponse.json(
                { error: 'Stripe returned a SetupIntent without a client_secret' },
                { status: 500 },
            );
        }

        return NextResponse.json({ clientSecret: setupIntent.client_secret });
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

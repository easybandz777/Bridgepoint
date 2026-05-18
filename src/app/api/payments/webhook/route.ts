/**
 * Stripe webhook receiver.
 *
 * Pattern mirrors /api/quickbooks/webhook: verify signature, persist the
 * raw envelope to payments_webhook_events keyed by event id, return 200
 * immediately, drain on a cron (/api/payments/cron). Keeping the receiver
 * thin avoids Vercel function timeouts and makes retries idempotent.
 *
 * To get the webhook secret in dev: `stripe listen --forward-to localhost:3000/api/payments/webhook`
 * In prod: add an endpoint in the Stripe dashboard pointing at /api/payments/webhook
 * and copy its `whsec_...` into STRIPE_WEBHOOK_SECRET.
 */
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import sql, { initDB } from '@/lib/db';
import { getStripe } from '@/lib/stripe/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    const secret = process.env.STRIPE_WEBHOOK_SECRET ?? '';
    if (!secret || secret.startsWith('whsec_REPLACE')) {
        // 503 + Retry-After so Stripe backs off but eventually redelivers
        // once keys are configured. 500 would also retry but trigger more
        // aggressive alerting on Stripe's side.
        return new NextResponse(
            JSON.stringify({ error: 'STRIPE_WEBHOOK_SECRET not configured' }),
            { status: 503, headers: { 'Content-Type': 'application/json', 'Retry-After': '3600' } },
        );
    }

    const sig = (await headers()).get('stripe-signature');
    if (!sig) {
        return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
    }
    const raw = await req.text();
    if (!raw) {
        return NextResponse.json({ error: 'Empty body' }, { status: 400 });
    }

    let event;
    try {
        event = getStripe().webhooks.constructEvent(raw, sig, secret);
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        return NextResponse.json({ error: `signature verification failed: ${msg}` }, { status: 400 });
    }

    try {
        await initDB();
        // Idempotent insert. If Stripe retries the same event id we just
        // bump attempts and keep moving.
        await sql`
            INSERT INTO payments_webhook_events (id, type, livemode, api_version, payload, attempts)
            VALUES (
                ${event.id},
                ${event.type},
                ${event.livemode},
                ${event.api_version ?? null},
                ${JSON.stringify(event)}::jsonb,
                1
            )
            ON CONFLICT (id) DO UPDATE SET attempts = payments_webhook_events.attempts + 1
        `;
    } catch (e) {
        // Persistence failed — Stripe will retry. Return non-2xx so it does.
        const msg = e instanceof Error ? e.message : String(e);
        return NextResponse.json({ error: `persist failed: ${msg}` }, { status: 500 });
    }

    return NextResponse.json({ received: true });
}

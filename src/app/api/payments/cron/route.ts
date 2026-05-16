/**
 * Cron drain endpoint for Stripe webhook events.
 *
 * Vercel: configure a cron job in vercel.json pointing here at `*\/5 * * * *`.
 * Manual: POST to this URL with CRON_SECRET in the Authorization header to
 * force a drain. Same auth pattern as the existing QB auto-sync cron.
 */
import { NextResponse } from 'next/server';
import { initDB } from '@/lib/db';
import { drainWebhookEvents } from '@/lib/stripe/webhook-drain';

export const dynamic = 'force-dynamic';

function authorized(req: Request): boolean {
    const secret = process.env.CRON_SECRET;
    if (!secret) return true; // Local dev: no secret set, allow.
    const auth = req.headers.get('authorization') ?? '';
    return auth === `Bearer ${secret}` || auth === secret;
}

export async function GET(req: Request) { return run(req); }
export async function POST(req: Request) { return run(req); }

async function run(req: Request) {
    if (!authorized(req)) {
        return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    try {
        await initDB();
        const result = await drainWebhookEvents();
        return NextResponse.json({ ok: result.failed === 0, ...result });
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

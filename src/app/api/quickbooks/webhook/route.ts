import {
    verifyWebhookSignature,
    persistWebhookEvents,
} from '@/lib/quickbooks/webhooks';
import type { QbWebhookEnvelope } from '@/lib/quickbooks/types';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    const raw = await req.text();
    const sig = req.headers.get('intuit-signature');

    if (!verifyWebhookSignature(raw, sig)) {
        return new Response('invalid signature', { status: 401 });
    }

    let envelope: QbWebhookEnvelope;
    try {
        envelope = JSON.parse(raw) as QbWebhookEnvelope;
    } catch {
        return new Response('invalid body', { status: 400 });
    }

    // Validate the basic envelope shape before persisting.
    if (!envelope || typeof envelope !== 'object' || !Array.isArray(envelope.eventNotifications)) {
        return new Response('invalid envelope', { status: 400 });
    }

    await persistWebhookEvents(envelope);

    // NOTE: We deliberately do NOT call processUnprocessedEvents here.
    // Vercel's serverless runtime kills any fire-and-forget Promise once
    // the response is sent, which would silently drop event processing.
    // Processing is driven by a separate cron-callable endpoint:
    //   POST /api/quickbooks/webhook/process
    // Vercel Cron should be configured to hit that route on a short
    // interval so events get processed within a small SLA.

    return new Response('ok', { status: 200 });
}

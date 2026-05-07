import {
    verifyWebhookSignature,
    persistWebhookEvents,
    processUnprocessedEvents,
} from '@/lib/quickbooks/webhooks';
import type { QbWebhookEnvelope } from '@/lib/quickbooks/types';

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

    await persistWebhookEvents(envelope);

    processUnprocessedEvents(50).catch((e) => console.warn('[qb-webhook] inline process failed:', e));

    return new Response('ok', { status: 200 });
}

import { NextResponse } from 'next/server';
import { processUnprocessedEvents } from '@/lib/quickbooks/webhooks';

export async function POST() {
    try {
        const result = await processUnprocessedEvents(200);
        return NextResponse.json({ ok: true, ...result });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

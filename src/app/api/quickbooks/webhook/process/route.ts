import { NextResponse } from 'next/server';
import { processUnprocessedEvents } from '@/lib/quickbooks/webhooks';

export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store' };

export async function POST() {
    try {
        const result = await processUnprocessedEvents(200);
        return NextResponse.json({ ok: true, ...result }, { headers: NO_STORE });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500, headers: NO_STORE });
    }
}

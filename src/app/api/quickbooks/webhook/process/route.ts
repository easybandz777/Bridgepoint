import { NextResponse } from 'next/server';
import { processUnprocessedEvents } from '@/lib/quickbooks/webhooks';
import { isQbDisabled } from '@/lib/feature-flags';

export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store' };

export async function POST() {
    if (isQbDisabled()) {
        return NextResponse.json(
            { error: 'QuickBooks integration is disabled. The CRM is now the system of record.' },
            { status: 410, headers: NO_STORE },
        );
    }
    try {
        const result = await processUnprocessedEvents(200);
        return NextResponse.json({ ok: true, ...result }, { headers: NO_STORE });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500, headers: NO_STORE });
    }
}

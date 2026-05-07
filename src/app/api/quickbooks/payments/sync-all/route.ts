import { NextResponse } from 'next/server';
import { refreshAllInvoicePayments } from '@/lib/quickbooks/payments';

export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store' };

export async function POST() {
    try {
        const result = await refreshAllInvoicePayments('admin');
        return NextResponse.json({ ok: true, ...result }, { headers: NO_STORE });
    } catch (e) {
        const msg = String(e);
        if (msg.includes('not connected')) {
            // Cron-friendly: 200 + skipped so a missing QB connection doesn't
            // page the scheduled-job alerting.
            return NextResponse.json(
                { ok: true, skipped: true, reason: msg },
                { status: 200, headers: NO_STORE },
            );
        }
        return NextResponse.json({ error: msg }, { status: 500, headers: NO_STORE });
    }
}

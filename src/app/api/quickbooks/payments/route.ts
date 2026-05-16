import { NextResponse } from 'next/server';
import { listRecentPayments } from '@/lib/quickbooks/payments';
import { isQbDisabled } from '@/lib/feature-flags';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    if (isQbDisabled()) {
        return NextResponse.json(
            { error: 'QuickBooks integration is disabled. The CRM is now the system of record.' },
            { status: 410 },
        );
    }
    try {
        const url = new URL(req.url);
        const limit = url.searchParams.get('limit');
        const customerId = url.searchParams.get('customerId') ?? undefined;
        const payments = await listRecentPayments(
            limit ? Number(limit) : undefined,
            customerId,
        );
        return NextResponse.json({ ok: true, count: payments.length, payments });
    } catch (e) {
        const msg = String(e);
        if (msg.includes('not connected')) {
            return NextResponse.json({ error: msg }, { status: 412 });
        }
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

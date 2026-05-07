import { NextResponse } from 'next/server';
import { refreshAllInvoicePayments } from '@/lib/quickbooks/payments';

export async function POST() {
    try {
        const result = await refreshAllInvoicePayments('admin');
        return NextResponse.json({ ok: true, ...result });
    } catch (e) {
        const msg = String(e);
        if (msg.includes('not connected')) {
            return NextResponse.json({ error: msg }, { status: 412 });
        }
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

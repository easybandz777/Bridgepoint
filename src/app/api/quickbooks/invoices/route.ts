import { NextResponse } from 'next/server';
import { qbQuery } from '@/lib/quickbooks/client';
import type { QbInvoice } from '@/lib/quickbooks/types';

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const limit = Math.min(Number(url.searchParams.get('limit') ?? '50'), 200);
        const offset = Number(url.searchParams.get('offset') ?? '0');
        const q = `select * from Invoice startposition ${offset + 1} maxresults ${limit}`;
        const r = await qbQuery<{ QueryResponse: { Invoice?: QbInvoice[]; totalCount?: number } }>(q, {
            entityType: 'invoice',
            action: 'list',
        });
        const invoices = r?.QueryResponse?.Invoice ?? [];
        return NextResponse.json({ ok: true, count: invoices.length, invoices });
    } catch (e) {
        if (String(e).includes('not connected')) {
            return NextResponse.json({ error: String(e) }, { status: 412 });
        }
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

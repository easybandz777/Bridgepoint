import { NextResponse } from 'next/server';
import { qbQuery } from '@/lib/quickbooks/client';
import type { QbEstimate } from '@/lib/quickbooks/types';

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const limit = Math.min(Number(url.searchParams.get('limit') ?? '50'), 200);
        const offset = Number(url.searchParams.get('offset') ?? '0');
        const q = `select * from Estimate startposition ${offset + 1} maxresults ${limit}`;
        const r = await qbQuery<{ QueryResponse: { Estimate?: QbEstimate[]; totalCount?: number } }>(q, {
            entityType: 'qb_estimate',
            action: 'list',
        });
        const estimates = r?.QueryResponse?.Estimate ?? [];
        return NextResponse.json({ ok: true, count: estimates.length, estimates });
    } catch (e) {
        if (String(e).includes('not connected')) {
            return NextResponse.json({ error: String(e) }, { status: 412 });
        }
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

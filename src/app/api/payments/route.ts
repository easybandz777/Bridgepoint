/**
 * GET /api/payments
 *
 * Lists payments via the shared CRM-native pipeline (`listPayments`).
 *
 * Query params (all optional):
 *   - customerId : restrict to one customer
 *   - invoiceId  : restrict to one invoice
 *   - status     : pending | succeeded | failed | refunded | disputed
 *   - limit      : max rows (default 100)
 *
 * Response: `{ payments: PaymentRow[] }`
 */
import { NextResponse } from 'next/server';
import { initDB } from '@/lib/db';
import { listPayments, type PaymentRow, type PaymentStatus } from '@/lib/stripe/payments';

const VALID_STATUSES: readonly PaymentStatus[] = [
    'pending',
    'succeeded',
    'failed',
    'refunded',
    'disputed',
];

interface ListResponse {
    payments: PaymentRow[];
}

interface ErrorResponse {
    error: string;
}

function parseStatus(raw: string | null): PaymentStatus | undefined {
    if (!raw) return undefined;
    const v = raw.trim().toLowerCase();
    return (VALID_STATUSES as readonly string[]).includes(v) ? (v as PaymentStatus) : undefined;
}

function parseLimit(raw: string | null): number | undefined {
    if (!raw) return undefined;
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) return undefined;
    return Math.min(Math.floor(n), 1000);
}

export async function GET(
    req: Request,
): Promise<NextResponse<ListResponse | ErrorResponse>> {
    try {
        await initDB();
        const url = new URL(req.url);
        const customerId = url.searchParams.get('customerId')?.trim() || undefined;
        const invoiceId = url.searchParams.get('invoiceId')?.trim() || undefined;
        const status = parseStatus(url.searchParams.get('status'));
        const limit = parseLimit(url.searchParams.get('limit'));

        const payments = await listPayments({
            customerId,
            invoiceId,
            status,
            limit,
        });

        return NextResponse.json({ payments });
    } catch (e) {
        console.error('[api/payments] GET failed:', e);
        const message = e instanceof Error ? e.message : String(e);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

/**
 * GET /api/payments/[id]
 *
 * Returns a single payment row by id. Refunds are handled in the sibling
 * `refund/route.ts` so this endpoint stays read-only.
 */
import { NextResponse } from 'next/server';
import { initDB } from '@/lib/db';
import { getPayment, type PaymentRow } from '@/lib/stripe/payments';

type Ctx = { params: Promise<{ id: string }> };

interface SuccessResponse {
    payment: PaymentRow;
}

interface ErrorResponse {
    error: string;
}

export async function GET(
    _req: Request,
    ctx: Ctx,
): Promise<NextResponse<SuccessResponse | ErrorResponse>> {
    try {
        await initDB();
        const { id } = await ctx.params;
        const payment = await getPayment(id);
        if (!payment) {
            return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
        }
        return NextResponse.json({ payment });
    } catch (e) {
        console.error('[api/payments/[id]] GET failed:', e);
        const message = e instanceof Error ? e.message : String(e);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

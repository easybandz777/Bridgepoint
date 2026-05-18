/**
 * Manual (offline) payment entry for invoices.
 *
 * POST /api/payments/manual
 *   body: {
 *     invoiceId: string;
 *     amount: number;          // dollars
 *     method: 'check' | 'cash' | 'other';
 *     checkNumber?: string;
 *     receivedDate?: string;   // YYYY-MM-DD, defaults to today
 *     depositedDate?: string;
 *     notes?: string;
 *   }
 *
 * Records the payment via the shared CRM-native payments pipeline
 * (recordPayment auto-calls reconcileInvoice when invoiceId is set),
 * so the invoice's amount_paid / amount_due / status will be updated
 * in the same request.
 */
import { NextResponse } from 'next/server';
import sql, { initDB } from '@/lib/db';
import { recordPayment, type PaymentRow } from '@/lib/stripe/payments';

type ManualMethod = 'check' | 'cash' | 'other';

interface ManualPaymentBody {
    invoiceId?: string;
    amount?: number;
    method?: ManualMethod;
    checkNumber?: string;
    receivedDate?: string;
    depositedDate?: string;
    notes?: string;
}

interface SuccessResponse {
    ok: true;
    payment: PaymentRow;
}

interface ErrorResponse {
    error: string;
}

const ALLOWED_METHODS: readonly ManualMethod[] = ['check', 'cash', 'other'];

/** Local-tz YYYY-MM-DD so a check entered at 9pm Pacific doesn't backdate to UTC tomorrow. */
function todayIso(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export async function POST(
    req: Request,
): Promise<NextResponse<SuccessResponse | ErrorResponse>> {
    try {
        await initDB();

        let body: ManualPaymentBody;
        try {
            body = (await req.json()) as ManualPaymentBody;
        } catch {
            return NextResponse.json({ error: 'Invalid or missing JSON body' }, { status: 400 });
        }
        if (!body || typeof body !== 'object') {
            return NextResponse.json({ error: 'Body must be a JSON object' }, { status: 400 });
        }

        const invoiceId = typeof body.invoiceId === 'string' ? body.invoiceId.trim() : '';
        if (!invoiceId) {
            return NextResponse.json({ error: 'invoiceId is required' }, { status: 400 });
        }

        const amount = Number(body.amount);
        if (!Number.isFinite(amount) || amount <= 0) {
            return NextResponse.json(
                { error: 'amount must be a positive number' },
                { status: 400 },
            );
        }

        const method = body.method;
        if (!method || !ALLOWED_METHODS.includes(method)) {
            return NextResponse.json(
                { error: `method must be one of: ${ALLOWED_METHODS.join(', ')}` },
                { status: 400 },
            );
        }

        const rows = (await sql`
            SELECT id, customer_id
            FROM invoices
            WHERE id = ${invoiceId}
            LIMIT 1
        `) as unknown as { id: string; customer_id: string | null }[];

        if (rows.length === 0) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
        }

        const customerId = rows[0].customer_id ?? null;
        const checkNumber = body.checkNumber?.trim() || undefined;
        const receivedDate = body.receivedDate?.trim() || todayIso();
        const depositedDate = body.depositedDate?.trim() || undefined;
        const notes = body.notes?.trim() ?? '';

        const payment = await recordPayment({
            invoiceId,
            amount,
            method,
            status: 'succeeded',
            processor: 'manual',
            customerId,
            receivedDate,
            depositedDate: depositedDate ?? null,
            notes,
            paymentNumber: checkNumber ?? null,
            metadata: { check_number: checkNumber ?? null },
        });

        return NextResponse.json({ ok: true, payment });
    } catch (e) {
        console.error('[payments/manual] POST failed:', e);
        const message = e instanceof Error ? e.message : String(e);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

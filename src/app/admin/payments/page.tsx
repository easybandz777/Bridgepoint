/**
 * Admin · Payments list (server component)
 *
 * Loads every payment with its linked invoice number and customer display
 * name in a single JOIN, then hands the enriched rows off to a client-side
 * filter wrapper for the status-chip UX.
 */
import sql, { initDB } from '@/lib/db';
import { isStripeConfigured } from '@/lib/stripe/client';
import type {
    PaymentDirection,
    PaymentMethod,
    PaymentProcessor,
    PaymentStatus,
} from '@/lib/stripe/payments';
import { PaymentsListClient, type PaymentListItem } from './payments-list-client';

export const dynamic = 'force-dynamic';

interface JoinedRow {
    id: string;
    payment_number: string | null;
    direction: string;
    amount: string | number;
    currency: string;
    method: string;
    status: string;
    customer_id: string | null;
    invoice_id: string | null;
    processor: string | null;
    processor_charge_id: string | null;
    processor_fee: string | number;
    notes: string | null;
    received_date: string | null;
    deposited_date: string | null;
    created_at: string;
    invoice_number: string | null;
    customer_name: string | null;
}

function mapRow(r: JoinedRow): PaymentListItem {
    return {
        id: r.id,
        paymentNumber: r.payment_number,
        direction: (r.direction as PaymentDirection) ?? 'incoming',
        amount: Number(r.amount),
        currency: r.currency ?? 'USD',
        method: (r.method as PaymentMethod) ?? 'other',
        status: (r.status as PaymentStatus) ?? 'pending',
        customerId: r.customer_id,
        invoiceId: r.invoice_id,
        processor: (r.processor as PaymentProcessor) ?? null,
        processorChargeId: r.processor_charge_id,
        processorFee: Number(r.processor_fee ?? 0),
        notes: r.notes ?? '',
        receivedDate: r.received_date,
        depositedDate: r.deposited_date,
        createdAt: r.created_at,
        invoiceNumber: r.invoice_number,
        customerName: r.customer_name,
    };
}

export default async function PaymentsPage() {
    await initDB();

    const rows = (await sql`
        SELECT p.id, p.payment_number, p.direction, p.amount, p.currency,
               p.method, p.status, p.customer_id, p.invoice_id,
               p.processor, p.processor_charge_id, p.processor_fee,
               p.notes, p.received_date, p.deposited_date, p.created_at,
               i.invoice_number,
               c.display_name AS customer_name
        FROM payments p
        LEFT JOIN invoices i ON p.invoice_id = i.id
        LEFT JOIN customers c ON p.customer_id = c.id
        ORDER BY p.created_at DESC
        LIMIT 200
    `) as unknown as JoinedRow[];

    const payments = rows.map(mapRow);
    const stripeReady = isStripeConfigured();

    return <PaymentsListClient payments={payments} stripeReady={stripeReady} />;
}

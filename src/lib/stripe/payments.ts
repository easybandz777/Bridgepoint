/**
 * Server-only library for the CRM-native payments system.
 *
 * Responsibilities:
 *  - Insert / update rows in `payments`.
 *  - Recompute an invoice's `amount_paid` / `amount_due` / `status` from
 *    the sum of succeeded incoming payments against it (the source of truth).
 *  - Resolve a Stripe Customer from a CRM customer record, creating one on
 *    demand and caching the id on `customers.stripe_customer_id`.
 *
 * This file is server-only. It imports `@neondatabase/serverless` and the
 * Stripe SDK; importing it from a browser bundle will fail at build time.
 */
import sql, { genId } from '@/lib/db';
import { getStripe } from './client';
import type Stripe from 'stripe';

export type PaymentMethod = 'card' | 'ach' | 'check' | 'cash' | 'other';
export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'refunded' | 'disputed';
export type PaymentProcessor = 'stripe' | 'manual' | 'qb';
export type PaymentDirection = 'incoming' | 'outgoing';

export interface RecordPaymentInput {
    direction?: PaymentDirection;
    amount: number;
    currency?: string;
    method: PaymentMethod;
    status?: PaymentStatus;
    customerId?: string | null;
    vendorId?: string | null;
    invoiceId?: string | null;
    billId?: string | null;
    receivedDate?: string | null;
    depositedDate?: string | null;
    processor: PaymentProcessor;
    processorChargeId?: string | null;
    processorFee?: number;
    notes?: string;
    metadata?: Record<string, unknown>;
    paymentNumber?: string | null;
}

export interface PaymentRow {
    id: string;
    paymentNumber: string | null;
    direction: PaymentDirection;
    amount: number;
    currency: string;
    method: PaymentMethod;
    status: PaymentStatus;
    customerId: string | null;
    vendorId: string | null;
    invoiceId: string | null;
    billId: string | null;
    receivedDate: string | null;
    depositedDate: string | null;
    processor: PaymentProcessor | null;
    processorChargeId: string | null;
    processorFee: number;
    notes: string;
    metadata: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
}

/**
 * Insert a payment. Idempotent on `processor_charge_id` if provided — a
 * second call with the same charge id updates the existing row in place.
 */
export async function recordPayment(input: RecordPaymentInput): Promise<PaymentRow> {
    const id = genId('pay');
    const direction = input.direction ?? 'incoming';
    const status = input.status ?? 'pending';
    const currency = (input.currency ?? 'USD').toUpperCase();
    const processorFee = input.processorFee ?? 0;
    const notes = input.notes ?? '';
    const metadata = JSON.stringify(input.metadata ?? {});

    if (input.processorChargeId) {
        // Idempotent upsert by processor_charge_id.
        const existing = (await sql`
            SELECT id FROM payments WHERE processor_charge_id = ${input.processorChargeId} LIMIT 1
        `) as unknown as { id: string }[];
        if (existing.length > 0) {
            const existingId = existing[0].id;
            await sql`
                UPDATE payments SET
                    direction = ${direction},
                    amount = ${input.amount},
                    currency = ${currency},
                    method = ${input.method},
                    status = ${status},
                    customer_id = ${input.customerId ?? null},
                    vendor_id = ${input.vendorId ?? null},
                    invoice_id = ${input.invoiceId ?? null},
                    bill_id = ${input.billId ?? null},
                    received_date = ${input.receivedDate ?? null},
                    deposited_date = ${input.depositedDate ?? null},
                    processor = ${input.processor},
                    processor_fee = ${processorFee},
                    notes = ${notes},
                    metadata = ${metadata}::jsonb,
                    payment_number = ${input.paymentNumber ?? null},
                    updated_at = NOW()
                WHERE id = ${existingId}
            `;
            if (input.invoiceId) await reconcileInvoice(input.invoiceId);
            const rows = await getPayment(existingId);
            if (!rows) throw new Error(`Payment ${existingId} vanished mid-update`);
            return rows;
        }
    }

    await sql`
        INSERT INTO payments (
            id, payment_number, direction, amount, currency, method, status,
            customer_id, vendor_id, invoice_id, bill_id,
            received_date, deposited_date,
            processor, processor_charge_id, processor_fee,
            notes, metadata
        ) VALUES (
            ${id},
            ${input.paymentNumber ?? null},
            ${direction},
            ${input.amount},
            ${currency},
            ${input.method},
            ${status},
            ${input.customerId ?? null},
            ${input.vendorId ?? null},
            ${input.invoiceId ?? null},
            ${input.billId ?? null},
            ${input.receivedDate ?? null},
            ${input.depositedDate ?? null},
            ${input.processor},
            ${input.processorChargeId ?? null},
            ${processorFee},
            ${notes},
            ${metadata}::jsonb
        )
    `;

    if (input.invoiceId) await reconcileInvoice(input.invoiceId);
    const row = await getPayment(id);
    if (!row) throw new Error(`Newly-inserted payment ${id} not readable`);
    return row;
}

interface PaymentRowDb {
    id: string;
    payment_number: string | null;
    direction: string;
    amount: string | number;
    currency: string;
    method: string;
    status: string;
    customer_id: string | null;
    vendor_id: string | null;
    invoice_id: string | null;
    bill_id: string | null;
    received_date: string | null;
    deposited_date: string | null;
    processor: string | null;
    processor_charge_id: string | null;
    processor_fee: string | number;
    notes: string;
    metadata: Record<string, unknown> | null;
    created_at: string;
    updated_at: string;
}

function mapPayment(r: PaymentRowDb): PaymentRow {
    return {
        id: r.id,
        paymentNumber: r.payment_number,
        direction: (r.direction as PaymentDirection) ?? 'incoming',
        amount: Number(r.amount),
        currency: r.currency ?? 'USD',
        method: (r.method as PaymentMethod) ?? 'other',
        status: (r.status as PaymentStatus) ?? 'pending',
        customerId: r.customer_id,
        vendorId: r.vendor_id,
        invoiceId: r.invoice_id,
        billId: r.bill_id,
        receivedDate: r.received_date,
        depositedDate: r.deposited_date,
        processor: (r.processor as PaymentProcessor) ?? null,
        processorChargeId: r.processor_charge_id,
        processorFee: Number(r.processor_fee ?? 0),
        notes: r.notes ?? '',
        metadata: r.metadata ?? {},
        createdAt: r.created_at,
        updatedAt: r.updated_at,
    };
}

export async function getPayment(id: string): Promise<PaymentRow | null> {
    const rows = (await sql`SELECT * FROM payments WHERE id = ${id} LIMIT 1`) as unknown as PaymentRowDb[];
    return rows[0] ? mapPayment(rows[0]) : null;
}

export async function getPaymentByCharge(chargeId: string): Promise<PaymentRow | null> {
    const rows = (await sql`
        SELECT * FROM payments WHERE processor_charge_id = ${chargeId} LIMIT 1
    `) as unknown as PaymentRowDb[];
    return rows[0] ? mapPayment(rows[0]) : null;
}

export async function listPayments(opts: {
    customerId?: string;
    invoiceId?: string;
    status?: PaymentStatus;
    limit?: number;
} = {}): Promise<PaymentRow[]> {
    const limit = opts.limit ?? 100;
    if (opts.invoiceId) {
        const rows = (await sql`
            SELECT * FROM payments WHERE invoice_id = ${opts.invoiceId}
            ORDER BY created_at DESC LIMIT ${limit}
        `) as unknown as PaymentRowDb[];
        return rows.map(mapPayment);
    }
    if (opts.customerId) {
        const rows = (await sql`
            SELECT * FROM payments WHERE customer_id = ${opts.customerId}
            ORDER BY created_at DESC LIMIT ${limit}
        `) as unknown as PaymentRowDb[];
        return rows.map(mapPayment);
    }
    if (opts.status) {
        const rows = (await sql`
            SELECT * FROM payments WHERE status = ${opts.status}
            ORDER BY created_at DESC LIMIT ${limit}
        `) as unknown as PaymentRowDb[];
        return rows.map(mapPayment);
    }
    const rows = (await sql`
        SELECT * FROM payments ORDER BY created_at DESC LIMIT ${limit}
    `) as unknown as PaymentRowDb[];
    return rows.map(mapPayment);
}

/**
 * Recompute amount_paid / amount_due / status on an invoice from the sum
 * of succeeded incoming payments. Run after any payment mutation.
 *
 * Refunds are represented as separate rows with status='refunded' OR as
 * negative-amount adjustment rows depending on how the refund was triggered;
 * this query treats only `succeeded incoming` as paid.
 */
export async function reconcileInvoice(invoiceId: string): Promise<void> {
    const rows = (await sql`
        SELECT
            (SELECT total FROM invoices WHERE id = ${invoiceId}) AS total,
            COALESCE(SUM(amount), 0) AS paid
        FROM payments
        WHERE invoice_id = ${invoiceId}
          AND direction = 'incoming'
          AND status = 'succeeded'
    `) as unknown as { total: string | number; paid: string | number }[];
    if (rows.length === 0) return;
    const total = Number(rows[0].total ?? 0);
    const paid = Number(rows[0].paid ?? 0);
    const due = Math.max(total - paid, 0);
    const status =
        paid <= 0 ? 'Outstanding'
            : paid >= total ? 'Paid'
                : 'Partial';
    const paidDate = paid >= total ? new Date().toISOString().slice(0, 10) : null;
    await sql`
        UPDATE invoices SET
            amount_paid = ${paid},
            amount_due = ${due},
            status = ${status},
            paid_date = COALESCE(${paidDate}, paid_date),
            updated_at = NOW()
        WHERE id = ${invoiceId}
    `;
}

/**
 * Get or create a Stripe Customer for a CRM customer row, caching the id
 * on `customers.stripe_customer_id`. Returns the Stripe customer id.
 */
export async function ensureStripeCustomer(customerId: string): Promise<string> {
    const rows = (await sql`
        SELECT stripe_customer_id, display_name, email, phone
        FROM customers WHERE id = ${customerId} LIMIT 1
    `) as unknown as {
        stripe_customer_id: string | null;
        display_name: string | null;
        email: string | null;
        phone: string | null;
    }[];
    if (rows.length === 0) throw new Error(`Customer ${customerId} not found`);
    if (rows[0].stripe_customer_id) return rows[0].stripe_customer_id;

    const stripe = getStripe();
    const created = await stripe.customers.create({
        name: rows[0].display_name ?? undefined,
        email: rows[0].email ?? undefined,
        phone: rows[0].phone ?? undefined,
        metadata: { crm_customer_id: customerId },
    });

    await sql`
        UPDATE customers SET stripe_customer_id = ${created.id}, updated_at = NOW()
        WHERE id = ${customerId}
    `;
    return created.id;
}

/** Cents → dollars. */
export function fromStripeAmount(cents: number | null | undefined, currency = 'USD'): number {
    if (!cents) return 0;
    // Stripe uses minor units; for USD that's cents (×100). Zero-decimal
    // currencies (JPY, KRW) need a different divisor, but we're USD-only today.
    return Math.round(cents) / 100;
}

/** Dollars → cents (Stripe minor units). */
export function toStripeAmount(dollars: number): number {
    return Math.round(dollars * 100);
}

/**
 * Map a Stripe PaymentIntent to a payments-table row shape. Used by the
 * webhook drain and the Checkout success poller.
 */
export function paymentFromIntent(
    pi: Stripe.PaymentIntent,
    extra: { invoiceId?: string | null; customerId?: string | null } = {},
): RecordPaymentInput {
    const charge = (pi.latest_charge && typeof pi.latest_charge === 'object')
        ? (pi.latest_charge as Stripe.Charge)
        : null;
    const method = charge?.payment_method_details?.type === 'us_bank_account' ? 'ach' : 'card';
    return {
        direction: 'incoming',
        amount: fromStripeAmount(pi.amount_received ?? pi.amount, pi.currency),
        currency: pi.currency.toUpperCase(),
        method,
        status: pi.status === 'succeeded' ? 'succeeded'
            : pi.status === 'requires_payment_method' || pi.status === 'canceled' ? 'failed'
                : 'pending',
        customerId: extra.customerId ?? null,
        invoiceId: extra.invoiceId ?? (pi.metadata?.invoice_id ?? null),
        receivedDate: pi.created ? new Date(pi.created * 1000).toISOString().slice(0, 10) : null,
        processor: 'stripe',
        processorChargeId: pi.id,
        processorFee: charge?.balance_transaction && typeof charge.balance_transaction === 'object'
            ? fromStripeAmount((charge.balance_transaction as Stripe.BalanceTransaction).fee)
            : 0,
        metadata: { stripe_payment_intent: pi.id, ...pi.metadata },
    };
}

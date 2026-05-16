'use server';

/**
 * Server actions for the Payment detail page.
 *
 * `resyncInvoiceAction` is a thin wrapper around `reconcileInvoice()` so the
 * detail-page "Resync invoice" button can fire it without a separate API
 * route and without dragging the Stripe client into the client bundle.
 */
import { revalidatePath } from 'next/cache';
import { initDB } from '@/lib/db';
import { reconcileInvoice } from '@/lib/stripe/payments';

export interface ResyncResult {
    ok: boolean;
    error?: string;
}

export async function resyncInvoiceAction(
    paymentId: string,
    invoiceId: string,
): Promise<ResyncResult> {
    try {
        await initDB();
        await reconcileInvoice(invoiceId);
        revalidatePath(`/admin/payments/${paymentId}`);
        revalidatePath(`/admin/invoices/${invoiceId}`);
        return { ok: true };
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return { ok: false, error: message };
    }
}

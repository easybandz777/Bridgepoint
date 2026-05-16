/**
 * Customer-facing invoice payment landing page.
 *
 * URL: /pay/[invoiceId]
 *
 * Server-fetches the invoice and renders the warm, branded shell. The
 * interactive button + Stripe redirect / poll behavior lives in the
 * companion client component (./pay-client). Three modes the client
 * handles based on the URL search params:
 *
 *   - new      → first arrival, render the "Pay $X" CTA.
 *   - success  → returning from Checkout with ?session_id=cs_..., poll
 *                the session-status endpoint to confirm payment.
 *   - canceled → returning from Checkout cancel (?canceled=1).
 *
 * Important: this page sits inside the marketing chrome (ConditionalLayout
 * keeps Navbar/Footer on every non-/admin route). That's intentional — the
 * branded chrome reinforces trust on a payment landing page.
 */
import type { Metadata } from 'next';
import sql, { initDB } from '@/lib/db';
import { SITE_CONFIG } from '@/lib/constants';
import { PayClient } from './pay-client';

export const metadata: Metadata = {
    title: 'Pay Invoice — Bridgepointe',
    description: 'Pay your Bridgepointe invoice securely with card, bank, Apple Pay, or Google Pay.',
    robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

interface InvoiceRow {
    id: string;
    invoice_number: string;
    status: string;
    total: string | number;
    amount_paid: string | number;
    amount_due: string | number;
    issued_date: string | null;
    due_date: string | null;
    client: { name?: string | null; email?: string | null } | null;
    project: { title?: string | null; address?: string | null } | null;
}

export interface PayInvoiceSummary {
    id: string;
    invoiceNumber: string;
    status: string;
    total: number;
    amountPaid: number;
    amountDue: number;
    issuedDate: string | null;
    dueDate: string | null;
    clientName: string;
    clientEmail: string;
    projectTitle: string;
}

const usd = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
});

function formatDate(value: string | null): string {
    if (!value) return '—';
    // The DB stores plain YYYY-MM-DD strings; parse as local-noon to avoid
    // a one-day-back drift when the browser is west of UTC.
    const parsed = new Date(`${value}T12:00:00`);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

interface PageProps {
    params: Promise<{ invoiceId: string }>;
    searchParams: Promise<{ session_id?: string; canceled?: string }>;
}

export default async function PayInvoicePage({ params, searchParams }: PageProps) {
    const { invoiceId } = await params;
    const sp = await searchParams;

    await initDB();
    const rows = (await sql`
        SELECT id, invoice_number, status, total, amount_paid, amount_due,
               issued_date, due_date, client, project
        FROM invoices
        WHERE id = ${invoiceId}
        LIMIT 1
    `) as unknown as InvoiceRow[];

    if (rows.length === 0) {
        return <NotFoundShell invoiceId={invoiceId} />;
    }

    const r = rows[0];
    const invoice: PayInvoiceSummary = {
        id: r.id,
        invoiceNumber: r.invoice_number,
        status: r.status,
        total: Number(r.total ?? 0),
        amountPaid: Number(r.amount_paid ?? 0),
        amountDue: Number(r.amount_due ?? 0),
        issuedDate: r.issued_date,
        dueDate: r.due_date,
        clientName: r.client?.name ?? '',
        clientEmail: r.client?.email ?? '',
        projectTitle: r.project?.title ?? '',
    };

    const mode: 'new' | 'success' | 'canceled' = sp.session_id
        ? 'success'
        : sp.canceled === '1'
            ? 'canceled'
            : 'new';

    const fullyPaid = invoice.amountDue <= 0 || invoice.status === 'Paid';

    return (
        <div className="min-h-screen bg-warm-white pb-24 pt-20 md:pt-28">
            <div className="mx-auto max-w-2xl px-6 lg:px-8">
                {/* Wordmark + tagline */}
                <header className="text-center">
                    <p className="font-serif text-3xl font-bold tracking-tight text-charcoal md:text-4xl">
                        {SITE_CONFIG.name}
                    </p>
                    <div className="mx-auto mt-3 h-px w-10 bg-gold/60" />
                    <p className="mt-5 font-sans text-xs font-semibold uppercase tracking-[0.3em] text-gold">
                        Secure Payment
                    </p>
                    <h1 className="mt-3 font-serif text-2xl font-bold text-charcoal md:text-3xl">
                        Payment for Invoice {invoice.invoiceNumber}
                    </h1>
                </header>

                {/* Invoice summary card */}
                <section
                    className="mt-12 border border-charcoal/10 bg-white p-8 md:p-10"
                    aria-labelledby="invoice-summary-heading"
                >
                    <h2
                        id="invoice-summary-heading"
                        className="font-sans text-xs font-semibold uppercase tracking-[0.25em] text-slate-light"
                    >
                        Invoice Summary
                    </h2>

                    {invoice.projectTitle && (
                        <p className="mt-4 font-serif text-xl font-bold leading-snug text-charcoal">
                            {invoice.projectTitle}
                        </p>
                    )}

                    {/* Issued / Due dates */}
                    <dl className="mt-6 grid grid-cols-2 gap-6 border-t border-charcoal/10 pt-6 text-sm">
                        <div>
                            <dt className="font-sans text-xs font-semibold uppercase tracking-wider text-slate-light">
                                Issued
                            </dt>
                            <dd className="mt-1 text-base text-charcoal">
                                {formatDate(invoice.issuedDate)}
                            </dd>
                        </div>
                        <div>
                            <dt className="font-sans text-xs font-semibold uppercase tracking-wider text-slate-light">
                                Due
                            </dt>
                            <dd className="mt-1 text-base text-charcoal">
                                {formatDate(invoice.dueDate)}
                            </dd>
                        </div>
                    </dl>

                    {/* Totals */}
                    <div className="mt-8 space-y-3 border-t border-charcoal/10 pt-6 text-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-slate">Invoice total</span>
                            <span className="text-charcoal">{usd.format(invoice.total)}</span>
                        </div>
                        {invoice.amountPaid > 0 && (
                            <div className="flex items-center justify-between">
                                <span className="text-slate">Paid to date</span>
                                <span className="text-charcoal">
                                    −{usd.format(invoice.amountPaid)}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Amount due — big */}
                    <div className="mt-6 flex items-end justify-between border-t border-charcoal/10 pt-6">
                        <span className="font-sans text-xs font-semibold uppercase tracking-[0.25em] text-slate-light">
                            Amount Due
                        </span>
                        <span className="font-serif text-3xl font-bold text-charcoal md:text-4xl">
                            {usd.format(invoice.amountDue)}
                        </span>
                    </div>

                    {fullyPaid ? (
                        <div className="mt-8 border border-gold/30 bg-gold/5 p-5">
                            <p className="font-sans text-xs font-semibold uppercase tracking-wider text-gold">
                                Paid in Full
                            </p>
                            <p className="mt-2 text-sm leading-relaxed text-charcoal">
                                This invoice is paid in full. Thank you{' '}
                                {invoice.clientName ? `, ${invoice.clientName}` : ''}
                                — no action needed.
                            </p>
                        </div>
                    ) : (
                        <div className="mt-8">
                            <PayClient mode={mode} invoice={invoice} sessionId={sp.session_id} />
                        </div>
                    )}
                </section>

                {/* Footer help line */}
                <footer className="mt-12 text-center">
                    <p className="font-sans text-xs text-slate-light">
                        Questions about this invoice?
                    </p>
                    <p className="mt-2 font-sans text-sm text-charcoal">
                        Call{' '}
                        <a
                            href={`tel:${SITE_CONFIG.phone}`}
                            className="font-semibold text-gold transition-colors hover:text-gold-dark"
                        >
                            {SITE_CONFIG.phone}
                        </a>{' '}
                        or email{' '}
                        <a
                            href={`mailto:${SITE_CONFIG.email}`}
                            className="font-semibold text-gold transition-colors hover:text-gold-dark"
                        >
                            {SITE_CONFIG.email}
                        </a>
                    </p>
                </footer>
            </div>
        </div>
    );
}

function NotFoundShell({ invoiceId }: { invoiceId: string }) {
    return (
        <div className="min-h-screen bg-warm-white pb-24 pt-20 md:pt-28">
            <div className="mx-auto max-w-xl px-6 text-center lg:px-8">
                <p className="font-serif text-3xl font-bold tracking-tight text-charcoal md:text-4xl">
                    {SITE_CONFIG.name}
                </p>
                <div className="mx-auto mt-3 h-px w-10 bg-gold/60" />
                <h1 className="mt-12 font-serif text-2xl font-bold text-charcoal md:text-3xl">
                    Invoice Not Found
                </h1>
                <p className="mt-4 text-sm leading-relaxed text-slate">
                    We couldn&apos;t locate an invoice with the reference{' '}
                    <span className="font-mono text-charcoal">{invoiceId}</span>.
                    Please double-check the link from your email, or reach out
                    and we&apos;ll send a fresh copy.
                </p>
                <p className="mt-8 font-sans text-sm text-charcoal">
                    Call{' '}
                    <a
                        href={`tel:${SITE_CONFIG.phone}`}
                        className="font-semibold text-gold transition-colors hover:text-gold-dark"
                    >
                        {SITE_CONFIG.phone}
                    </a>{' '}
                    or email{' '}
                    <a
                        href={`mailto:${SITE_CONFIG.email}`}
                        className="font-semibold text-gold transition-colors hover:text-gold-dark"
                    >
                        {SITE_CONFIG.email}
                    </a>
                </p>
            </div>
        </div>
    );
}

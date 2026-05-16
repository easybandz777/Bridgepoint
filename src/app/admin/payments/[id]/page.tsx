/**
 * Admin · Payment detail (server component)
 *
 * Loads the payment + linked invoice/customer in one query and renders the
 * full detail layout. The action buttons (refund / void / resync) live in
 * a client child since they need a confirm-dialog + state.
 */
import { notFound } from 'next/navigation';
import Link from 'next/link';
import sql, { initDB } from '@/lib/db';
import { getPayment } from '@/lib/stripe/payments';
import { ArrowLeft, ExternalLink, Receipt, User } from 'lucide-react';
import { StatusPill } from '@/components/portal/status-pill';
import { PaymentActions } from './payment-actions';
import { CopyButton } from './copy-button';

export const dynamic = 'force-dynamic';

interface RelatedRow {
    invoice_number: string | null;
    invoice_status: string | null;
    invoice_total: string | number | null;
    invoice_amount_due: string | number | null;
    customer_display_name: string | null;
}

function fmtMoney(n: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
    }).format(n);
}

function fmtDate(iso: string | null | undefined): string {
    if (!iso) return '—';
    const d = new Date(iso);
    if (!Number.isFinite(d.getTime())) return '—';
    return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

function methodLabel(method: string): string {
    switch (method) {
        case 'card':
            return 'Card';
        case 'ach':
            return 'Bank / ACH';
        case 'check':
            return 'Check';
        case 'cash':
            return 'Cash';
        default:
            return 'Other';
    }
}

function processorLabel(p: string | null): string {
    if (p === 'stripe') return 'Stripe';
    if (p === 'manual') return 'Manual';
    if (p === 'qb') return 'QuickBooks';
    return '—';
}

function statusLabel(s: string): string {
    return s ? s[0].toUpperCase() + s.slice(1) : '—';
}

function extractReceiptUrl(metadata: Record<string, unknown>): string | null {
    const direct = metadata.receipt_url;
    if (typeof direct === 'string' && direct.startsWith('http')) return direct;
    const charge = metadata.charge;
    if (charge && typeof charge === 'object') {
        const ru = (charge as Record<string, unknown>).receipt_url;
        if (typeof ru === 'string' && ru.startsWith('http')) return ru;
    }
    return null;
}

export default async function PaymentDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    await initDB();
    const { id } = await params;

    const payment = await getPayment(id);
    if (!payment) notFound();

    // Load related invoice + customer in one trip.
    let related: RelatedRow | null = null;
    if (payment.invoiceId || payment.customerId) {
        const rows = (await sql`
            SELECT
                i.invoice_number   AS invoice_number,
                i.status           AS invoice_status,
                i.total            AS invoice_total,
                i.amount_due       AS invoice_amount_due,
                c.display_name     AS customer_display_name
            FROM (SELECT 1) s
            LEFT JOIN invoices  i ON i.id = ${payment.invoiceId ?? null}
            LEFT JOIN customers c ON c.id = ${payment.customerId ?? null}
            LIMIT 1
        `) as unknown as RelatedRow[];
        related = rows[0] ?? null;
    }

    const receiptUrl = extractReceiptUrl(payment.metadata);
    const headerLabel =
        payment.paymentNumber ??
        payment.processorChargeId ??
        payment.id;

    return (
        <div className="p-8 max-w-5xl">
            {/* Back link */}
            <div className="mb-8">
                <Link
                    href="/admin/payments"
                    className="inline-flex items-center gap-2 text-xs font-semibold text-white/30 hover:text-white/60 uppercase tracking-wider transition-colors"
                >
                    <ArrowLeft size={13} /> Back to Payments
                </Link>
            </div>

            {/* Header */}
            <div className="mb-8 flex items-start justify-between gap-6 flex-wrap">
                <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#b8956a] mb-1">
                        Payment
                    </p>
                    <h1 className="font-serif text-2xl font-bold text-white truncate">
                        {headerLabel}
                    </h1>
                    <div className="mt-2">
                        <StatusPill status={statusLabel(payment.status)} />
                    </div>
                </div>
                <div className="text-right">
                    <p className="font-serif text-4xl font-bold text-white">
                        {fmtMoney(payment.amount)}
                    </p>
                    <p className="text-[11px] text-white/35 uppercase tracking-wider mt-1">
                        {payment.currency} · {processorLabel(payment.processor)}
                    </p>
                </div>
            </div>

            {/* Two-column block */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Left — payment details */}
                <section className="bg-[#131313] border border-white/10 rounded-2xl p-6">
                    <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40 mb-4">
                        Payment Details
                    </h2>
                    <dl className="space-y-3 text-sm">
                        <DetailRow label="Method" value={methodLabel(payment.method)} />
                        <DetailRow label="Processor" value={processorLabel(payment.processor)} />
                        <ChargeIdRow value={payment.processorChargeId} />
                        <DetailRow
                            label="Processor fee"
                            value={
                                payment.processorFee > 0
                                    ? fmtMoney(payment.processorFee)
                                    : '—'
                            }
                            mono
                        />
                        <DetailRow
                            label="Received"
                            value={fmtDate(payment.receivedDate ?? payment.createdAt)}
                        />
                        <DetailRow
                            label="Deposited"
                            value={fmtDate(payment.depositedDate)}
                        />
                        <DetailRow
                            label="Direction"
                            value={
                                payment.direction === 'outgoing'
                                    ? 'Outgoing'
                                    : 'Incoming'
                            }
                        />
                        {payment.notes && (
                            <div className="pt-3 border-t border-white/6">
                                <p className="text-[11px] text-white/40 mb-1.5">Notes</p>
                                <p className="text-sm text-white/70 leading-relaxed whitespace-pre-line">
                                    {payment.notes}
                                </p>
                            </div>
                        )}
                    </dl>
                    {receiptUrl && (
                        <a
                            href={receiptUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-[#b8956a] hover:text-[#d4b896] transition-colors"
                        >
                            View receipt
                            <ExternalLink size={12} />
                        </a>
                    )}
                </section>

                {/* Right — linked records */}
                <section className="bg-[#131313] border border-white/10 rounded-2xl p-6">
                    <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40 mb-4">
                        Linked Records
                    </h2>
                    <div className="space-y-3">
                        {payment.invoiceId ? (
                            <Link
                                href={`/admin/invoices/${payment.invoiceId}`}
                                className="block bg-white/[0.02] border border-white/8 rounded-xl px-4 py-3 hover:border-[#b8956a]/30 hover:bg-white/[0.04] transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-[#b8956a]/10 flex items-center justify-center text-[#b8956a]">
                                        <Receipt size={15} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] uppercase tracking-wider text-white/35 mb-0.5">
                                            Invoice
                                        </p>
                                        <p className="text-sm text-white font-medium font-mono truncate">
                                            {related?.invoice_number ?? payment.invoiceId}
                                        </p>
                                    </div>
                                    {related?.invoice_status && (
                                        <StatusPill
                                            status={String(related.invoice_status)}
                                            size="sm"
                                        />
                                    )}
                                </div>
                                {related?.invoice_total != null && (
                                    <div className="mt-3 flex items-center justify-between text-[11px]">
                                        <span className="text-white/40">Invoice total</span>
                                        <span className="font-mono text-white/70">
                                            {fmtMoney(Number(related.invoice_total))}
                                        </span>
                                    </div>
                                )}
                                {related?.invoice_amount_due != null && (
                                    <div className="mt-1 flex items-center justify-between text-[11px]">
                                        <span className="text-white/40">Amount due</span>
                                        <span className="font-mono text-white/70">
                                            {fmtMoney(Number(related.invoice_amount_due))}
                                        </span>
                                    </div>
                                )}
                            </Link>
                        ) : (
                            <EmptyLink label="No linked invoice" />
                        )}

                        {payment.customerId ? (
                            <Link
                                href={`/admin/customers/${payment.customerId}`}
                                className="block bg-white/[0.02] border border-white/8 rounded-xl px-4 py-3 hover:border-[#b8956a]/30 hover:bg-white/[0.04] transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-[#b8956a]/10 flex items-center justify-center text-[#b8956a]">
                                        <User size={15} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] uppercase tracking-wider text-white/35 mb-0.5">
                                            Customer
                                        </p>
                                        <p className="text-sm text-white font-medium truncate">
                                            {related?.customer_display_name ??
                                                payment.customerId}
                                        </p>
                                    </div>
                                    <ExternalLink size={13} className="text-white/35" />
                                </div>
                            </Link>
                        ) : (
                            <EmptyLink label="No linked customer" />
                        )}
                    </div>
                </section>
            </div>

            {/* Action row */}
            <PaymentActions
                paymentId={payment.id}
                invoiceId={payment.invoiceId}
                amount={payment.amount}
                status={payment.status}
                processor={payment.processor}
            />
        </div>
    );
}

function DetailRow({
    label,
    value,
    mono = false,
}: {
    label: string;
    value: string;
    mono?: boolean;
}) {
    return (
        <div className="flex items-center justify-between gap-4">
            <dt className="text-[11px] text-white/40 uppercase tracking-wider">
                {label}
            </dt>
            <dd
                className={
                    'text-sm text-white/80 text-right ' +
                    (mono ? 'font-mono' : '')
                }
            >
                {value}
            </dd>
        </div>
    );
}

function ChargeIdRow({ value }: { value: string | null }) {
    if (!value) {
        return <DetailRow label="Charge ID" value="—" />;
    }
    const short =
        value.length > 22 ? `${value.slice(0, 10)}…${value.slice(-8)}` : value;
    return (
        <div className="flex items-center justify-between gap-4">
            <dt className="text-[11px] text-white/40 uppercase tracking-wider">
                Charge ID
            </dt>
            <dd className="text-sm text-white/80 font-mono flex items-center gap-2">
                <span title={value}>{short}</span>
                <CopyButton value={value} />
            </dd>
        </div>
    );
}

function EmptyLink({ label }: { label: string }) {
    return (
        <div className="bg-white/[0.02] border border-dashed border-white/8 rounded-xl px-4 py-4 text-center text-xs text-white/35">
            {label}
        </div>
    );
}

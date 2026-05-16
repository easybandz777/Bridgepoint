'use client';

/**
 * Client wrapper for the Payments list — filter chips + responsive
 * table-on-desktop / cards-on-mobile rendering.
 */
import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
    CreditCard,
    Banknote,
    FileCheck,
    Coins,
    HelpCircle,
    ChevronRight,
    DollarSign,
    Check,
    X as XIcon,
} from 'lucide-react';
import { StatusPill } from '@/components/portal/status-pill';
import type {
    PaymentDirection,
    PaymentMethod,
    PaymentProcessor,
    PaymentStatus,
} from '@/lib/stripe/payments';

export interface PaymentListItem {
    id: string;
    paymentNumber: string | null;
    direction: PaymentDirection;
    amount: number;
    currency: string;
    method: PaymentMethod;
    status: PaymentStatus;
    customerId: string | null;
    invoiceId: string | null;
    processor: PaymentProcessor | null;
    processorChargeId: string | null;
    processorFee: number;
    notes: string;
    receivedDate: string | null;
    depositedDate: string | null;
    createdAt: string;
    invoiceNumber: string | null;
    customerName: string | null;
}

interface PaymentsListClientProps {
    payments: PaymentListItem[];
    stripeReady: boolean;
}

type StatusFilter = 'all' | PaymentStatus;

const FILTER_CHIPS: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'succeeded', label: 'Succeeded' },
    { key: 'pending', label: 'Pending' },
    { key: 'failed', label: 'Failed' },
    { key: 'refunded', label: 'Refunded' },
];

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

function methodIcon(method: PaymentMethod) {
    switch (method) {
        case 'card':
            return CreditCard;
        case 'ach':
            return Banknote;
        case 'check':
            return FileCheck;
        case 'cash':
            return Coins;
        default:
            return HelpCircle;
    }
}

function methodLabel(method: PaymentMethod): string {
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

function processorLabel(p: PaymentProcessor | null): string {
    if (p === 'stripe') return 'Stripe';
    if (p === 'manual') return 'Manual';
    if (p === 'qb') return 'QuickBooks';
    return '—';
}

function statusLabel(s: PaymentStatus): string {
    return s[0].toUpperCase() + s.slice(1);
}

export function PaymentsListClient({ payments, stripeReady }: PaymentsListClientProps) {
    const [filter, setFilter] = useState<StatusFilter>('all');

    const filtered = useMemo(() => {
        if (filter === 'all') return payments;
        return payments.filter((p) => p.status === filter);
    }, [payments, filter]);

    const counts = useMemo(() => {
        const map = new Map<StatusFilter, number>([['all', payments.length]]);
        for (const p of payments) {
            map.set(p.status, (map.get(p.status) ?? 0) + 1);
        }
        return map;
    }, [payments]);

    return (
        <div className="p-8 max-w-6xl">
            {/* Header */}
            <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#b8956a] mb-1">
                        Admin
                    </p>
                    <div className="flex items-center gap-3 flex-wrap">
                        <h1 className="font-serif text-2xl font-bold text-white">Payments</h1>
                        <StripeBadge configured={stripeReady} />
                    </div>
                </div>
            </div>

            {/* Filter chips */}
            {payments.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-7">
                    {FILTER_CHIPS.map((c) => {
                        const count = counts.get(c.key) ?? 0;
                        const active = filter === c.key;
                        return (
                            <button
                                key={c.key}
                                onClick={() => setFilter(c.key)}
                                className={
                                    'text-[11px] font-semibold uppercase tracking-wide px-3 py-1.5 rounded-full border transition-colors ' +
                                    (active
                                        ? 'bg-[#b8956a]/15 text-[#b8956a] border-[#b8956a]/30'
                                        : 'bg-white/5 text-white/50 border-white/10 hover:text-white/80 hover:bg-white/8')
                                }
                            >
                                {c.label}
                                <span className="ml-2 text-white/30">{count}</span>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* List */}
            {payments.length === 0 ? (
                <EmptyState />
            ) : filtered.length === 0 ? (
                <div className="bg-[#131313] border border-white/10 rounded-2xl p-10 text-center text-white/40">
                    <p className="text-sm">No payments match this filter.</p>
                </div>
            ) : (
                <>
                    {/* Desktop table */}
                    <div className="hidden md:block bg-[#131313] border border-white/10 rounded-2xl overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-white/[0.02] text-[10px] uppercase tracking-wider text-white/35">
                                <tr>
                                    <th className="text-left font-semibold px-5 py-3">Date</th>
                                    <th className="text-left font-semibold px-5 py-3">Reference</th>
                                    <th className="text-left font-semibold px-5 py-3">Customer</th>
                                    <th className="text-right font-semibold px-5 py-3">Amount</th>
                                    <th className="text-left font-semibold px-5 py-3">Method</th>
                                    <th className="text-left font-semibold px-5 py-3">Processor</th>
                                    <th className="text-left font-semibold px-5 py-3">Status</th>
                                    <th className="px-5 py-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/6">
                                {filtered.map((p) => (
                                    <PaymentRow key={p.id} payment={p} />
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile cards */}
                    <div className="md:hidden space-y-3">
                        {filtered.map((p) => (
                            <PaymentMobileCard key={p.id} payment={p} />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

function PaymentRow({ payment }: { payment: PaymentListItem }) {
    const MethodIcon = methodIcon(payment.method);
    return (
        <tr className="hover:bg-white/[0.02] transition-colors">
            <td className="px-5 py-3.5 text-white/70 whitespace-nowrap">
                {fmtDate(payment.receivedDate ?? payment.createdAt)}
            </td>
            <td className="px-5 py-3.5">
                <div className="flex flex-col">
                    <span className="text-white/90 font-medium">
                        {payment.paymentNumber ?? (payment.processorChargeId
                            ? `${payment.processorChargeId.slice(0, 14)}…`
                            : payment.id.slice(0, 12))}
                    </span>
                    {payment.invoiceNumber && (
                        <span className="text-[11px] text-white/35 font-mono">
                            {payment.invoiceNumber}
                        </span>
                    )}
                </div>
            </td>
            <td className="px-5 py-3.5 text-white/70">
                {payment.customerName ?? <span className="text-white/25">—</span>}
            </td>
            <td className="px-5 py-3.5 text-right whitespace-nowrap font-mono font-semibold text-white">
                {fmtMoney(payment.amount)}
            </td>
            <td className="px-5 py-3.5">
                <span className="inline-flex items-center gap-1.5 text-xs text-white/65">
                    <MethodIcon size={13} className="text-white/35" />
                    {methodLabel(payment.method)}
                </span>
            </td>
            <td className="px-5 py-3.5 text-white/65 text-xs">
                {processorLabel(payment.processor)}
            </td>
            <td className="px-5 py-3.5">
                <StatusPill status={statusLabel(payment.status)} size="sm" />
            </td>
            <td className="px-5 py-3.5 text-right">
                <Link
                    href={`/admin/payments/${payment.id}`}
                    className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-white/40 hover:text-[#b8956a] hover:bg-[#b8956a]/10 transition-all"
                    aria-label="View payment"
                >
                    <ChevronRight size={16} />
                </Link>
            </td>
        </tr>
    );
}

function PaymentMobileCard({ payment }: { payment: PaymentListItem }) {
    const MethodIcon = methodIcon(payment.method);
    return (
        <Link
            href={`/admin/payments/${payment.id}`}
            className="block bg-[#131313] border border-white/10 rounded-2xl p-4 hover:border-[#b8956a]/30 transition-all"
        >
            <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-white/35 mb-0.5">
                        {fmtDate(payment.receivedDate ?? payment.createdAt)}
                    </p>
                    <p className="text-sm text-white font-medium truncate">
                        {payment.customerName ?? '—'}
                    </p>
                    {payment.invoiceNumber && (
                        <p className="text-[11px] text-white/40 font-mono">
                            {payment.invoiceNumber}
                        </p>
                    )}
                </div>
                <div className="text-right shrink-0">
                    <p className="font-mono font-semibold text-white">
                        {fmtMoney(payment.amount)}
                    </p>
                    <div className="mt-1">
                        <StatusPill status={statusLabel(payment.status)} size="sm" />
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-white/45 pt-2 border-t border-white/6">
                <span className="inline-flex items-center gap-1.5">
                    <MethodIcon size={12} />
                    {methodLabel(payment.method)}
                </span>
                <span className="text-white/25">·</span>
                <span>{processorLabel(payment.processor)}</span>
            </div>
        </Link>
    );
}

function StripeBadge({ configured }: { configured: boolean }) {
    if (configured) {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide">
                <Check size={11} />
                Stripe configured
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 text-white/45 border border-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide">
            <XIcon size={11} />
            Stripe not configured
        </span>
    );
}

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#b8956a]/10 flex items-center justify-center text-[#b8956a] mb-4">
                <DollarSign size={26} />
            </div>
            <p className="font-serif text-base text-white mb-1.5">No payments recorded yet</p>
            <p className="text-sm text-white/45 max-w-md leading-relaxed">
                Payments will appear here as customers pay invoices online or as you
                record manual checks.
            </p>
        </div>
    );
}

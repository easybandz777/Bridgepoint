'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, Receipt, AlertTriangle, TrendingUp } from 'lucide-react';

interface InvoiceRow {
    id: string;
    invoice_number: string;
    status: string;
    issued_date: string;
    due_date: string;
    paid_date: string | null;
    total: number | string;
    amount_paid: number | string;
    amount_due: number | string;
    client?: { name?: string } | string;
}

interface BillRow {
    id: string;
    project_id: string | null;
    subcontractor_id: string | null;
    bill_number: string | null;
    amount: number | string;
    status: string;
    received_date: string | null;
    due_date: string | null;
    paid_date: string | null;
}

function toNum(v: unknown): number {
    if (v === null || v === undefined) return 0;
    if (typeof v === 'number') return v;
    const n = parseFloat(String(v));
    return Number.isFinite(n) ? n : 0;
}

function fmtCurrency(n: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(n);
}

function clientName(client: InvoiceRow['client']): string {
    if (!client) return '—';
    if (typeof client === 'string') {
        try {
            const parsed = JSON.parse(client);
            return parsed?.name ?? '—';
        } catch {
            return client;
        }
    }
    return client.name ?? '—';
}

interface MonthBucket {
    key: string;
    label: string;
    invoiced: number;
    collected: number;
}

function monthLabel(d: Date): { key: string; label: string } {
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleString('en-US', { month: 'short', year: '2-digit' });
    return { key, label };
}

function build12MonthBuckets(): MonthBucket[] {
    const out: MonthBucket[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const { key, label } = monthLabel(d);
        out.push({ key, label, invoiced: 0, collected: 0 });
    }
    return out;
}

export default function CashFlowReportPage() {
    const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
    const [bills, setBills] = useState<BillRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setLoading(true);
                const [invRes, billRes] = await Promise.all([
                    fetch('/api/invoices', { cache: 'no-store' }).catch(() => null),
                    fetch('/api/project-bills', { cache: 'no-store' }).catch(() => null),
                ]);

                let invs: InvoiceRow[] = [];
                let bs: BillRow[] = [];

                if (invRes && invRes.ok) {
                    const j = await invRes.json();
                    if (Array.isArray(j)) invs = j;
                }
                if (billRes && billRes.ok) {
                    const j = await billRes.json();
                    if (Array.isArray(j)) bs = j;
                }

                if (!cancelled) {
                    setInvoices(invs);
                    setBills(bs);
                    setError(null);
                }
            } catch (e) {
                if (!cancelled) setError(String(e));
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const monthlyData = useMemo(() => {
        const buckets = build12MonthBuckets();
        const lookup = new Map(buckets.map((b) => [b.key, b]));
        for (const inv of invoices) {
            if (inv.issued_date) {
                const d = new Date(inv.issued_date);
                if (!isNaN(d.getTime())) {
                    const { key } = monthLabel(d);
                    const b = lookup.get(key);
                    if (b) b.invoiced += toNum(inv.total);
                }
            }
            if (inv.paid_date) {
                const d = new Date(inv.paid_date);
                if (!isNaN(d.getTime())) {
                    const { key } = monthLabel(d);
                    const b = lookup.get(key);
                    if (b) b.collected += toNum(inv.amount_paid);
                }
            }
        }
        return buckets;
    }, [invoices]);

    const monthlyMax = useMemo(() => {
        return monthlyData.reduce((m, b) => Math.max(m, b.invoiced, b.collected), 0);
    }, [monthlyData]);

    const arAging = useMemo(() => {
        const today = new Date();
        const buckets = { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 };
        const counts = { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 };
        const detail: { bucket: keyof typeof buckets; invoice: InvoiceRow; days: number; amount: number }[] = [];

        for (const inv of invoices) {
            const due = toNum(inv.amount_due);
            if (due <= 0) continue;
            const dueDate = new Date(inv.due_date || inv.issued_date);
            if (isNaN(dueDate.getTime())) continue;
            const days = Math.floor((today.getTime() - dueDate.getTime()) / 86400000);
            let bucket: keyof typeof buckets;
            if (days <= 30) bucket = '0-30';
            else if (days <= 60) bucket = '31-60';
            else if (days <= 90) bucket = '61-90';
            else bucket = '90+';
            buckets[bucket] += due;
            counts[bucket] += 1;
            detail.push({ bucket, invoice: inv, days, amount: due });
        }
        return { buckets, counts, detail };
    }, [invoices]);

    const apAging = useMemo(() => {
        const today = new Date();
        const buckets = { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 };
        const counts = { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 };
        for (const b of bills) {
            if (b.status === 'Paid' || b.status === 'Cancelled' || b.status === 'Void') continue;
            const amount = toNum(b.amount);
            if (amount <= 0) continue;
            const dueDate = new Date(b.due_date || b.received_date || '');
            if (isNaN(dueDate.getTime())) continue;
            const days = Math.floor((today.getTime() - dueDate.getTime()) / 86400000);
            let bucket: keyof typeof buckets;
            if (days <= 30) bucket = '0-30';
            else if (days <= 60) bucket = '31-60';
            else if (days <= 90) bucket = '61-90';
            else bucket = '90+';
            buckets[bucket] += amount;
            counts[bucket] += 1;
        }
        return { buckets, counts };
    }, [bills]);

    const totals = useMemo(() => {
        const invoiced = monthlyData.reduce((s, b) => s + b.invoiced, 0);
        const collected = monthlyData.reduce((s, b) => s + b.collected, 0);
        const totalAR = Object.values(arAging.buckets).reduce((a, b) => a + b, 0);
        const totalAP = Object.values(apAging.buckets).reduce((a, b) => a + b, 0);
        return { invoiced, collected, totalAR, totalAP };
    }, [monthlyData, arAging, apAging]);

    function exportCsv() {
        const lines: string[][] = [
            ['Cash Flow — Monthly Invoiced vs Collected (Last 12 Months)'],
            ['Month', 'Invoiced', 'Collected'],
            ...monthlyData.map((b) => [b.label, b.invoiced.toFixed(2), b.collected.toFixed(2)]),
            [],
            ['A/R Aging'],
            ['Bucket', 'Amount', 'Count'],
            ...(['0-30', '31-60', '61-90', '90+'] as const).map((k) => [k, arAging.buckets[k].toFixed(2), String(arAging.counts[k])]),
            [],
            ['A/P Aging'],
            ['Bucket', 'Amount', 'Count'],
            ...(['0-30', '31-60', '61-90', '90+'] as const).map((k) => [k, apAging.buckets[k].toFixed(2), String(apAging.counts[k])]),
        ];
        const csv = lines.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cash-flow-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <Link href="/admin/reports" className="inline-flex items-center text-xs font-semibold uppercase tracking-widest text-[#b8956a] hover:text-[#cbb08c] transition-colors mb-4">
                    <ArrowLeft size={14} className="mr-2" />
                    Back to Reports
                </Link>
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                        <h1 className="font-serif text-3xl font-bold text-white mb-2">Cash Flow &amp; A/R</h1>
                        <p className="text-white/50 text-sm">12-month cash flow trend, accounts receivable aging, and accounts payable aging.</p>
                    </div>
                    <button
                        onClick={exportCsv}
                        className="h-10 px-5 bg-white/10 text-white text-sm font-semibold rounded-full flex items-center justify-center gap-2 hover:bg-white/20 transition-colors whitespace-nowrap"
                    >
                        <Download size={16} />
                        Export CSV
                    </button>
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 rounded-2xl border border-red-500/20 bg-red-500/5 text-sm text-red-300">
                    Failed to load data: {error}
                </div>
            )}

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <KpiCell label="12-Mo Invoiced" value={fmtCurrency(totals.invoiced)} loading={loading} />
                <KpiCell label="12-Mo Collected" value={fmtCurrency(totals.collected)} accentColor="#34d399" loading={loading} />
                <KpiCell label="Outstanding A/R" value={fmtCurrency(totals.totalAR)} accentColor="#60a5fa" loading={loading} />
                <KpiCell label="Outstanding A/P" value={fmtCurrency(totals.totalAP)} accentColor="#fbbf24" loading={loading} />
            </div>

            {/* Monthly invoiced vs collected — SVG bar chart */}
            <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6 mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-white">Invoiced vs Collected (Last 12 Months)</h3>
                    <div className="flex items-center gap-4 text-[11px]">
                        <span className="flex items-center gap-1.5 text-white/60">
                            <span className="w-3 h-3 rounded-sm bg-[#60a5fa]" /> Invoiced
                        </span>
                        <span className="flex items-center gap-1.5 text-white/60">
                            <span className="w-3 h-3 rounded-sm bg-[#34d399]" /> Collected
                        </span>
                    </div>
                </div>
                {loading ? (
                    <div className="h-48 bg-white/5 rounded-xl animate-pulse" />
                ) : monthlyMax === 0 ? (
                    <div className="h-48 flex items-center justify-center">
                        <p className="text-sm text-white/40">No invoice data yet — run seed.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <CashFlowChart buckets={monthlyData} maxValue={monthlyMax} />
                    </div>
                )}
            </div>

            {/* A/R aging + A/P aging */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <AgingCard
                    title="A/R Aging"
                    subtitle="Outstanding customer invoices, days past due"
                    icon={Receipt}
                    iconColor="#60a5fa"
                    buckets={arAging.buckets}
                    counts={arAging.counts}
                    loading={loading}
                />
                <AgingCard
                    title="A/P Aging"
                    subtitle="Sub bills owed, days past due"
                    icon={AlertTriangle}
                    iconColor="#fbbf24"
                    buckets={apAging.buckets}
                    counts={apAging.counts}
                    loading={loading}
                />
            </div>

            {/* A/R detail */}
            {!loading && arAging.detail.length > 0 && (
                <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/6 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-white">Outstanding A/R Detail</h3>
                        <span className="text-[11px] text-white/40">{arAging.detail.length} open invoices</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="bg-white/5 border-b border-white/5 text-[10px] uppercase tracking-wider text-white/40">
                                    <th className="px-5 py-3 font-semibold">Invoice</th>
                                    <th className="px-5 py-3 font-semibold">Client</th>
                                    <th className="px-5 py-3 font-semibold text-right">Amount Due</th>
                                    <th className="px-5 py-3 font-semibold text-right">Days Past Due</th>
                                    <th className="px-5 py-3 font-semibold text-center">Bucket</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {[...arAging.detail]
                                    .sort((a, b) => b.days - a.days)
                                    .slice(0, 25)
                                    .map(({ invoice, days, amount, bucket }) => {
                                        const color = bucket === '90+' ? '#f87171' : bucket === '61-90' ? '#fb923c' : bucket === '31-60' ? '#fbbf24' : '#60a5fa';
                                        return (
                                            <tr key={invoice.id} className="hover:bg-white/[0.02]">
                                                <td className="px-5 py-3">
                                                    <Link href={`/admin/invoices/${invoice.id}`} className="text-white hover:text-[#b8956a] font-medium">
                                                        {invoice.invoice_number}
                                                    </Link>
                                                </td>
                                                <td className="px-5 py-3 text-white/70">{clientName(invoice.client)}</td>
                                                <td className="px-5 py-3 text-right font-mono text-white">{fmtCurrency(amount)}</td>
                                                <td className="px-5 py-3 text-right font-mono" style={{ color }}>
                                                    {days > 0 ? `${days}d` : 'Not yet due'}
                                                </td>
                                                <td className="px-5 py-3 text-center">
                                                    <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full" style={{ background: `${color}15`, color }}>
                                                        {bucket}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

function CashFlowChart({ buckets, maxValue }: { buckets: MonthBucket[]; maxValue: number }) {
    const width = 800;
    const height = 220;
    const padLeft = 40;
    const padRight = 12;
    const padTop = 12;
    const padBottom = 28;
    const innerW = width - padLeft - padRight;
    const innerH = height - padTop - padBottom;
    const groupW = innerW / buckets.length;
    const barW = (groupW - 6) / 2;

    return (
        <div className="overflow-x-auto">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[640px]" preserveAspectRatio="xMidYMid meet">
                {/* Grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((p) => (
                    <line
                        key={p}
                        x1={padLeft}
                        y1={padTop + innerH * (1 - p)}
                        x2={width - padRight}
                        y2={padTop + innerH * (1 - p)}
                        stroke="rgba(255,255,255,0.05)"
                        strokeWidth={1}
                    />
                ))}
                {/* Y axis labels */}
                {[0, 0.25, 0.5, 0.75, 1].map((p) => (
                    <text
                        key={p}
                        x={padLeft - 6}
                        y={padTop + innerH * (1 - p) + 3}
                        fill="rgba(255,255,255,0.3)"
                        fontSize={9}
                        textAnchor="end"
                    >
                        {fmtCurrency(maxValue * p)}
                    </text>
                ))}
                {buckets.map((b, i) => {
                    const x = padLeft + i * groupW + 3;
                    const invH = maxValue > 0 ? (b.invoiced / maxValue) * innerH : 0;
                    const colH = maxValue > 0 ? (b.collected / maxValue) * innerH : 0;
                    return (
                        <g key={b.key}>
                            <rect
                                x={x}
                                y={padTop + innerH - invH}
                                width={barW}
                                height={invH}
                                fill="#60a5fa"
                                rx={2}
                            >
                                <title>{`${b.label} · Invoiced ${fmtCurrency(b.invoiced)}`}</title>
                            </rect>
                            <rect
                                x={x + barW + 2}
                                y={padTop + innerH - colH}
                                width={barW}
                                height={colH}
                                fill="#34d399"
                                rx={2}
                            >
                                <title>{`${b.label} · Collected ${fmtCurrency(b.collected)}`}</title>
                            </rect>
                            <text
                                x={x + barW + 1}
                                y={height - padBottom + 14}
                                fill="rgba(255,255,255,0.5)"
                                fontSize={10}
                                textAnchor="middle"
                            >
                                {b.label}
                            </text>
                        </g>
                    );
                })}
                {/* Baseline */}
                <line
                    x1={padLeft}
                    y1={padTop + innerH}
                    x2={width - padRight}
                    y2={padTop + innerH}
                    stroke="rgba(255,255,255,0.15)"
                    strokeWidth={1}
                />
            </svg>
        </div>
    );
}

function AgingCard({
    title,
    subtitle,
    icon: Icon,
    iconColor,
    buckets,
    counts,
    loading,
}: {
    title: string;
    subtitle: string;
    icon: typeof Receipt;
    iconColor: string;
    buckets: { '0-30': number; '31-60': number; '61-90': number; '90+': number };
    counts: { '0-30': number; '31-60': number; '61-90': number; '90+': number };
    loading: boolean;
}) {
    const total = buckets['0-30'] + buckets['31-60'] + buckets['61-90'] + buckets['90+'];
    const colorMap = {
        '0-30': '#60a5fa',
        '31-60': '#fbbf24',
        '61-90': '#fb923c',
        '90+': '#f87171',
    };

    return (
        <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-1">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${iconColor}15` }}>
                    <Icon size={16} style={{ color: iconColor }} />
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-white">{title}</h3>
                    <p className="text-[11px] text-white/40">{subtitle}</p>
                </div>
            </div>

            {loading ? (
                <div className="mt-5 space-y-2">
                    {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="h-6 bg-white/5 rounded animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="mt-5 space-y-3">
                    {(['0-30', '31-60', '61-90', '90+'] as const).map((bucket) => {
                        const amt = buckets[bucket];
                        const cnt = counts[bucket];
                        const pct = total > 0 ? (amt / total) * 100 : 0;
                        const color = colorMap[bucket];
                        return (
                            <div key={bucket}>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-white/70">
                                        {bucket} days <span className="text-white/30">({cnt})</span>
                                    </span>
                                    <span className="font-mono text-white/85">{fmtCurrency(amt)}</span>
                                </div>
                                <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                                </div>
                            </div>
                        );
                    })}
                    <div className="pt-3 mt-3 border-t border-white/5 flex justify-between text-sm">
                        <span className="text-white/60">Total</span>
                        <span className="font-mono font-bold text-white">{fmtCurrency(total)}</span>
                    </div>
                </div>
            )}
        </div>
    );
}

function KpiCell({
    label,
    value,
    accentColor,
    loading,
}: {
    label: string;
    value: string;
    accentColor?: string;
    loading: boolean;
}) {
    return (
        <div
            className="bg-[#1a1a1a] border rounded-2xl p-5"
            style={{
                borderColor: accentColor ? `${accentColor}33` : 'rgba(255,255,255,0.06)',
                background: accentColor ? `linear-gradient(135deg, #1a1a1a, ${accentColor}10)` : '#1a1a1a',
            }}
        >
            <p
                className="text-[10px] font-semibold uppercase tracking-widest mb-1"
                style={{ color: accentColor ?? 'rgba(255,255,255,0.4)' }}
            >
                {label}
            </p>
            {loading ? (
                <div className="h-7 bg-white/5 rounded animate-pulse" />
            ) : (
                <div
                    className="text-xl sm:text-2xl font-bold font-mono"
                    style={{ color: accentColor ?? '#fff' }}
                >
                    {value}
                </div>
            )}
        </div>
    );
}

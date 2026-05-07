'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
    Briefcase,
    FileText,
    ClipboardList,
    StickyNote,
    PlugZap,
} from 'lucide-react';
import { StatusBadge } from '@/components/admin/status-badge';

export interface LinkedProject {
    id: string;
    project_number: string | null;
    name: string;
    status: string;
    start_date: string | null;
    end_date: string | null;
    estimated_revenue: string | number | null;
}

export interface LinkedInvoice {
    id: string;
    invoice_number: string | null;
    status: string;
    issued_date: string | null;
    due_date: string | null;
    total: string | number | null;
    amount_paid: string | number | null;
    amount_due: string | number | null;
}

export interface LinkedEstimate {
    id: string;
    estimate_number: string | null;
    status: string;
    created_date: string | null;
    total: string | number | null;
}

export interface SyncLogEntry {
    id: string;
    entityType: string;
    entityId: string | null;
    qbEntityId: string | null;
    direction: string;
    action: string;
    status: string;
    error: string | null;
    actor: string;
    createdAt: string;
}

interface CustomerDetailPaneProps {
    notes: string;
    onNotesSave: (next: string) => Promise<void> | void;
    projects: LinkedProject[];
    invoices: LinkedInvoice[];
    estimates: LinkedEstimate[];
    syncLogEntries: SyncLogEntry[] | null;
}

type Tab = 'projects' | 'invoices' | 'estimates' | 'notes' | 'qb';

function fmtMoney(n: number | string | null | undefined): string {
    const num = Number(n ?? 0);
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
    }).format(num);
}

function fmtDate(s: string | null): string {
    if (!s) return '—';
    try {
        const d = new Date(s);
        if (Number.isNaN(d.getTime())) return s.slice(0, 10);
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
        return s.slice(0, 10);
    }
}

export function CustomerDetailPane({
    notes,
    onNotesSave,
    projects,
    invoices,
    estimates,
    syncLogEntries,
}: CustomerDetailPaneProps) {
    const [activeTab, setActiveTab] = useState<Tab>('projects');
    const [draftNotes, setDraftNotes] = useState(notes);
    const [savingNotes, setSavingNotes] = useState(false);

    const tabs = useMemo(
        () => {
            const base: Array<{ key: Tab; label: string; count: number; icon: typeof Briefcase }> = [
                { key: 'projects', label: 'Projects', count: projects.length, icon: Briefcase },
                { key: 'invoices', label: 'Invoices', count: invoices.length, icon: FileText },
                { key: 'estimates', label: 'Estimates', count: estimates.length, icon: ClipboardList },
                { key: 'notes', label: 'Notes', count: 0, icon: StickyNote },
            ];
            if (syncLogEntries !== null) {
                base.push({
                    key: 'qb',
                    label: 'QuickBooks Activity',
                    count: syncLogEntries.length,
                    icon: PlugZap,
                });
            }
            return base;
        },
        [projects.length, invoices.length, estimates.length, syncLogEntries],
    );

    async function commitNotes() {
        if (draftNotes === notes) return;
        setSavingNotes(true);
        try {
            await onNotesSave(draftNotes);
        } finally {
            setSavingNotes(false);
        }
    }

    return (
        <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl overflow-hidden">
            <div className="flex items-center gap-1 overflow-x-auto px-2 pt-2 border-b border-white/6">
                {tabs.map((t) => {
                    const isActive = activeTab === t.key;
                    return (
                        <button
                            key={t.key}
                            onClick={() => setActiveTab(t.key)}
                            className={`flex items-center gap-2 px-3 py-2.5 rounded-t-xl text-sm font-medium transition-colors whitespace-nowrap ${
                                isActive
                                    ? 'bg-white/5 text-white'
                                    : 'text-white/40 hover:text-white/80 hover:bg-white/[0.03]'
                            }`}
                        >
                            <t.icon size={14} className={isActive ? 'text-[#b8956a]' : 'text-white/30'} />
                            {t.label}
                            {t.count > 0 && (
                                <span
                                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                                        isActive ? 'bg-[#b8956a]/20 text-[#b8956a]' : 'bg-white/5 text-white/40'
                                    }`}
                                >
                                    {t.count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            <div className="p-5 sm:p-6">
                {activeTab === 'projects' && <ProjectsList items={projects} />}
                {activeTab === 'invoices' && <InvoicesList items={invoices} />}
                {activeTab === 'estimates' && <EstimatesList items={estimates} />}
                {activeTab === 'notes' && (
                    <div>
                        <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">
                            Customer notes
                        </label>
                        <textarea
                            value={draftNotes}
                            onChange={(e) => setDraftNotes(e.target.value)}
                            onBlur={commitNotes}
                            rows={6}
                            placeholder="Internal notes about this customer (saves on blur)…"
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#b8956a]/50 transition-all resize-none"
                        />
                        <p className="text-[11px] text-white/40 mt-2">
                            {savingNotes ? 'Saving…' : 'Notes save automatically when you click outside this box.'}
                        </p>
                    </div>
                )}
                {activeTab === 'qb' && syncLogEntries !== null && <SyncLogList items={syncLogEntries} />}
            </div>
        </div>
    );
}

function EmptyRow({ label }: { label: string }) {
    return (
        <div className="py-12 text-center text-sm text-white/40 border border-dashed border-white/10 rounded-xl">
            {label}
        </div>
    );
}

function ProjectsList({ items }: { items: LinkedProject[] }) {
    if (items.length === 0) return <EmptyRow label="No projects linked to this customer." />;
    return (
        <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm">
                <thead className="text-[10px] uppercase tracking-widest text-white/40">
                    <tr>
                        <th className="text-left px-2 py-2">Project</th>
                        <th className="text-left px-2 py-2">Status</th>
                        <th className="text-left px-2 py-2">Dates</th>
                        <th className="text-right px-2 py-2">Est. Revenue</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {items.map((p) => (
                        <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="px-2 py-3">
                                <Link href={`/admin/projects/${p.id}`} className="text-white hover:text-[#b8956a] font-medium">
                                    {p.name}
                                </Link>
                                {p.project_number && (
                                    <p className="text-xs text-white/40 font-mono mt-0.5">{p.project_number}</p>
                                )}
                            </td>
                            <td className="px-2 py-3">
                                <StatusBadge status={p.status} />
                            </td>
                            <td className="px-2 py-3 text-white/60 text-xs">
                                {fmtDate(p.start_date)}
                                {p.end_date ? ` → ${fmtDate(p.end_date)}` : ''}
                            </td>
                            <td className="px-2 py-3 text-right font-mono text-white">
                                {fmtMoney(p.estimated_revenue)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function invoiceCategory(status: string): 'success' | 'warning' | 'danger' | 'neutral' | 'info' {
    const s = status.toLowerCase();
    if (s.includes('paid')) return 'success';
    if (s.includes('partial')) return 'warning';
    if (s.includes('overdue')) return 'danger';
    if (s.includes('outstanding') || s.includes('open') || s.includes('sent')) return 'info';
    return 'neutral';
}

function InvoicesList({ items }: { items: LinkedInvoice[] }) {
    if (items.length === 0) return <EmptyRow label="No invoices for this customer yet." />;
    return (
        <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm">
                <thead className="text-[10px] uppercase tracking-widest text-white/40">
                    <tr>
                        <th className="text-left px-2 py-2">Invoice</th>
                        <th className="text-left px-2 py-2">Status</th>
                        <th className="text-left px-2 py-2">Issued</th>
                        <th className="text-right px-2 py-2">Total</th>
                        <th className="text-right px-2 py-2">Due</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {items.map((iv) => (
                        <tr key={iv.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="px-2 py-3">
                                <Link href={`/admin/invoices/${iv.id}`} className="text-white hover:text-[#b8956a] font-medium font-mono">
                                    {iv.invoice_number ?? iv.id.slice(0, 8)}
                                </Link>
                            </td>
                            <td className="px-2 py-3">
                                <StatusBadge status={iv.status} category={invoiceCategory(iv.status)} />
                            </td>
                            <td className="px-2 py-3 text-white/60 text-xs">{fmtDate(iv.issued_date)}</td>
                            <td className="px-2 py-3 text-right font-mono text-white">{fmtMoney(iv.total)}</td>
                            <td className="px-2 py-3 text-right font-mono text-white/70">{fmtMoney(iv.amount_due)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function estimateCategory(status: string): 'success' | 'warning' | 'danger' | 'neutral' | 'info' {
    const s = status.toLowerCase();
    if (s.includes('accepted') || s.includes('approved')) return 'success';
    if (s.includes('declined') || s.includes('rejected')) return 'danger';
    if (s.includes('sent')) return 'info';
    if (s.includes('draft')) return 'neutral';
    return 'neutral';
}

function EstimatesList({ items }: { items: LinkedEstimate[] }) {
    if (items.length === 0) return <EmptyRow label="No estimates for this customer yet." />;
    return (
        <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm">
                <thead className="text-[10px] uppercase tracking-widest text-white/40">
                    <tr>
                        <th className="text-left px-2 py-2">Estimate</th>
                        <th className="text-left px-2 py-2">Status</th>
                        <th className="text-left px-2 py-2">Created</th>
                        <th className="text-right px-2 py-2">Total</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {items.map((es) => (
                        <tr key={es.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="px-2 py-3">
                                <Link href={`/admin/estimates/${es.id}`} className="text-white hover:text-[#b8956a] font-medium font-mono">
                                    {es.estimate_number ?? es.id.slice(0, 8)}
                                </Link>
                            </td>
                            <td className="px-2 py-3">
                                <StatusBadge status={es.status} category={estimateCategory(es.status)} />
                            </td>
                            <td className="px-2 py-3 text-white/60 text-xs">{fmtDate(es.created_date)}</td>
                            <td className="px-2 py-3 text-right font-mono text-white">{fmtMoney(es.total)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function syncStatusCategory(status: string): 'success' | 'warning' | 'danger' | 'neutral' {
    const s = status.toLowerCase();
    if (s.includes('success')) return 'success';
    if (s.includes('error') || s.includes('fail')) return 'danger';
    if (s.includes('pending')) return 'warning';
    return 'neutral';
}

function SyncLogList({ items }: { items: SyncLogEntry[] }) {
    if (items.length === 0) return <EmptyRow label="No QuickBooks activity recorded for this customer." />;
    return (
        <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm">
                <thead className="text-[10px] uppercase tracking-widest text-white/40">
                    <tr>
                        <th className="text-left px-2 py-2">When</th>
                        <th className="text-left px-2 py-2">Action</th>
                        <th className="text-left px-2 py-2">Direction</th>
                        <th className="text-left px-2 py-2">Status</th>
                        <th className="text-left px-2 py-2">Actor</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {items.map((s) => (
                        <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="px-2 py-3 text-white/70 text-xs">{fmtDate(s.createdAt)}</td>
                            <td className="px-2 py-3 text-white">{s.action}</td>
                            <td className="px-2 py-3 text-white/60 text-xs uppercase tracking-wide">{s.direction}</td>
                            <td className="px-2 py-3">
                                <StatusBadge status={s.status} category={syncStatusCategory(s.status)} />
                            </td>
                            <td className="px-2 py-3 text-white/60 text-xs">{s.actor}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

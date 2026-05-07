'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Package, Download, Boxes, Wrench, Box } from 'lucide-react';
import { Item, ItemType, rowToItem } from '@/lib/items';

type FilterChip = 'All' | 'Service' | 'Inventory' | 'NonInventory' | 'Active' | 'Inactive';

const TYPE_LABEL: Record<ItemType, string> = {
    Service: 'Service',
    Inventory: 'Inventory',
    NonInventory: 'Non-Inventory',
};

function fmtPrice(n: number | null): string {
    if (n == null) return '—';
    return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function TypePill({ type }: { type: ItemType }) {
    const cls =
        type === 'Service'
            ? 'bg-[#b8956a]/10 border-[#b8956a]/30 text-[#b8956a]'
            : type === 'Inventory'
                ? 'bg-blue-400/10 border-blue-400/30 text-blue-300'
                : 'bg-white/5 border-white/15 text-white/60';
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-semibold uppercase tracking-wider ${cls}`}>
            {type === 'Service' ? <Wrench size={10} /> : type === 'Inventory' ? <Boxes size={10} /> : <Box size={10} />}
            {TYPE_LABEL[type]}
        </span>
    );
}

export default function ItemsListPage() {
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<FilterChip>('All');
    const [importing, setImporting] = useState(false);

    async function load() {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/items?limit=500');
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            const rows = Array.isArray(data?.rows) ? data.rows : [];
            setItems(rows.map((r: Item) => r));
        } catch (e) {
            setItems([]);
            setError(String(e));
        }
        setLoading(false);
    }

    useEffect(() => { load(); }, []);

    async function importFromQb() {
        if (!confirm('Pull every Item from QuickBooks? This will create new rows and update existing ones (matched by qb_id).')) return;
        setImporting(true);
        try {
            const res = await fetch('/api/quickbooks/items/import', { method: 'POST' });
            const data = await res.json();
            if (!res.ok || data.error) {
                alert(`Import failed: ${data.error ?? `HTTP ${res.status}`}`);
            } else {
                alert(`Import complete. ${data.imported} new, ${data.updated} updated, ${data.failed} failed.`);
                load();
            }
        } catch (e) {
            alert(`Import failed: ${String(e)}`);
        }
        setImporting(false);
    }

    const filtered = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return items.filter(it => {
            if (filter === 'Service' && it.type !== 'Service') return false;
            if (filter === 'Inventory' && it.type !== 'Inventory') return false;
            if (filter === 'NonInventory' && it.type !== 'NonInventory') return false;
            if (filter === 'Active' && !it.active) return false;
            if (filter === 'Inactive' && it.active) return false;
            if (!q) return true;
            return (
                it.name.toLowerCase().includes(q) ||
                it.description.toLowerCase().includes(q) ||
                (it.sku ?? '').toLowerCase().includes(q)
            );
        });
    }, [items, searchQuery, filter]);

    const counts = useMemo(() => ({
        all: items.length,
        service: items.filter(i => i.type === 'Service').length,
        inventory: items.filter(i => i.type === 'Inventory').length,
        nonInventory: items.filter(i => i.type === 'NonInventory').length,
        active: items.filter(i => i.active).length,
        inactive: items.filter(i => !i.active).length,
    }), [items]);

    const hasInventoryColumn = filter === 'All' || filter === 'Inventory' || filter === 'Active' || filter === 'Inactive';

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#b8956a] mb-1">Admin</p>
                    <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white mb-1">
                        Items <span className="text-white/30 font-sans font-normal text-xl">{items.length}</span>
                    </h1>
                    <p className="text-sm text-white/50">Services, products, and inventory used as line items on invoices and estimates.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={importFromQb}
                        disabled={importing}
                        className="h-10 px-4 bg-white/5 border border-white/10 text-white/80 text-sm font-semibold rounded-full flex items-center justify-center gap-2 hover:bg-white/10 transition-colors disabled:opacity-50"
                    >
                        <Download size={14} /> {importing ? 'Importing…' : 'Pull from QuickBooks'}
                    </button>
                    <Link
                        href="/admin/items/new"
                        className="h-10 px-5 bg-[#b8956a] text-black text-sm font-semibold rounded-full flex items-center justify-center gap-2 hover:bg-[#cbb08c] transition-colors whitespace-nowrap"
                    >
                        <Plus size={16} /> New Item
                    </Link>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col lg:flex-row justify-between gap-4 mb-6">
                <div className="relative flex-1 lg:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                    <input
                        type="text"
                        placeholder="Search by name, description, or SKU…"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-10 pl-10 pr-4 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#b8956a]/50 transition-all"
                    />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <Chip label={`All (${counts.all})`} active={filter === 'All'} onClick={() => setFilter('All')} />
                    <Chip label={`Service (${counts.service})`} active={filter === 'Service'} onClick={() => setFilter('Service')} />
                    <Chip label={`Inventory (${counts.inventory})`} active={filter === 'Inventory'} onClick={() => setFilter('Inventory')} />
                    <Chip label={`Non-Inventory (${counts.nonInventory})`} active={filter === 'NonInventory'} onClick={() => setFilter('NonInventory')} />
                    <span className="w-px h-5 bg-white/10 mx-1" />
                    <Chip label={`Active (${counts.active})`} active={filter === 'Active'} onClick={() => setFilter('Active')} />
                    <Chip label={`Inactive (${counts.inactive})`} active={filter === 'Inactive'} onClick={() => setFilter('Inactive')} />
                </div>
            </div>

            {/* States */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-6 h-6 rounded-full border-2 border-[#b8956a]/30 border-t-[#b8956a] animate-spin" />
                </div>
            ) : error ? (
                <div className="py-16 text-center border border-red-500/20 border-dashed rounded-2xl bg-red-500/5">
                    <h3 className="font-serif text-lg font-bold text-red-300 mb-2">Could not load items</h3>
                    <p className="text-sm text-red-200/70 mb-4 max-w-sm mx-auto">{error}</p>
                    <button onClick={load} className="text-[#b8956a] hover:text-[#cbb08c] font-semibold text-sm transition-colors">
                        Try again
                    </button>
                </div>
            ) : filtered.length === 0 ? (
                <div className="py-16 text-center border border-white/5 border-dashed rounded-2xl bg-white/[0.02]">
                    <Package size={48} className="mx-auto text-white/10 mb-4" />
                    <h3 className="font-serif text-lg font-bold text-white mb-2">
                        {items.length === 0 ? 'No items yet' : 'No matches'}
                    </h3>
                    <p className="text-white/40 mb-6 max-w-sm mx-auto">
                        {items.length === 0
                            ? 'Pull your services and products from QuickBooks, or add one manually.'
                            : 'Try a different search or filter.'}
                    </p>
                    {items.length === 0 ? (
                        <button
                            onClick={importFromQb}
                            disabled={importing}
                            className="inline-flex items-center gap-2 h-10 px-5 bg-[#b8956a] text-black text-sm font-semibold rounded-full hover:bg-[#cbb08c] transition-colors disabled:opacity-50"
                        >
                            <Download size={14} /> {importing ? 'Importing…' : 'Pull from QuickBooks'}
                        </button>
                    ) : (
                        <button
                            onClick={() => { setSearchQuery(''); setFilter('All'); }}
                            className="text-[#b8956a] hover:text-[#cbb08c] font-semibold text-sm transition-colors"
                        >
                            Clear filters
                        </button>
                    )}
                </div>
            ) : (
                <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-white/[0.02] text-[10px] uppercase tracking-widest text-white/40">
                                <tr>
                                    <th className="text-left px-4 py-3 font-semibold">Name</th>
                                    <th className="text-left px-4 py-3 font-semibold">Type</th>
                                    <th className="text-left px-4 py-3 font-semibold">Description</th>
                                    <th className="text-left px-4 py-3 font-semibold">SKU</th>
                                    <th className="text-right px-4 py-3 font-semibold">Unit Price</th>
                                    {hasInventoryColumn && <th className="text-right px-4 py-3 font-semibold">Qty on Hand</th>}
                                    <th className="text-left px-4 py-3 font-semibold">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filtered.map(it => (
                                    <tr
                                        key={it.id}
                                        className="hover:bg-white/[0.02] cursor-pointer transition-colors"
                                        onClick={() => { window.location.href = `/admin/items/${it.id}`; }}
                                    >
                                        <td className="px-4 py-3">
                                            <Link
                                                href={`/admin/items/${it.id}`}
                                                onClick={e => e.stopPropagation()}
                                                className="font-semibold text-white hover:text-[#b8956a] transition-colors"
                                            >
                                                {it.name}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3"><TypePill type={it.type} /></td>
                                        <td className="px-4 py-3 text-white/60 max-w-md truncate">{it.description || '—'}</td>
                                        <td className="px-4 py-3 text-white/70 font-mono text-xs">{it.sku ?? '—'}</td>
                                        <td className="px-4 py-3 text-right text-white font-mono">{fmtPrice(it.unitPrice)}</td>
                                        {hasInventoryColumn && (
                                            <td className="px-4 py-3 text-right text-white/70 font-mono">
                                                {it.type === 'Inventory' ? (it.qtyOnHand ?? 0).toLocaleString() : '—'}
                                            </td>
                                        )}
                                        <td className="px-4 py-3">
                                            {it.active ? (
                                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-emerald-400/30 bg-emerald-400/10 text-emerald-300 text-[10px] font-semibold uppercase tracking-wider">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-white/15 bg-white/5 text-white/50 text-[10px] font-semibold uppercase tracking-wider">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-white/40" /> Inactive
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

// Force linter to keep import — also makes the pattern obvious if we
// move the page to a server component later.
void rowToItem;

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                active ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/70 hover:bg-white/5'
            }`}
        >
            {label}
        </button>
    );
}

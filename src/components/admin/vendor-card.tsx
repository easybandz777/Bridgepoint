'use client';

import Link from 'next/link';
import { Mail, Phone, Building2, User, Link2 } from 'lucide-react';
import { StatusBadge } from '@/components/admin/status-badge';
import type { Vendor } from '@/lib/vendors';

interface VendorCardProps {
    vendor: Vendor;
}

function fmtMoney(n: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
    }).format(n);
}

function initialsFor(v: Vendor): string {
    const cn = (v.companyName ?? v.displayName).trim();
    if (cn) {
        const parts = cn.split(/\s+/).filter(Boolean);
        const first = parts[0]?.[0] ?? '';
        const second = parts[1]?.[0] ?? '';
        return (first + second).toUpperCase() || cn.slice(0, 2).toUpperCase();
    }
    const fn = (v.firstName ?? '').trim();
    const ln = (v.lastName ?? '').trim();
    const fromName = (fn[0] ?? '') + (ln[0] ?? '');
    if (fromName) return fromName.toUpperCase();
    return (v.displayName.trim().slice(0, 2) || 'VN').toUpperCase();
}

function sourceLabel(source: Vendor['source']): { label: string; category: 'brand' | 'info' } {
    if (source === 'crm') return { label: 'CRM', category: 'brand' };
    if (source === 'qb_webhook') return { label: 'QB Webhook', category: 'info' };
    return { label: 'QuickBooks', category: 'info' };
}

export function VendorCard({ vendor }: VendorCardProps) {
    const isCompany = Boolean(vendor.companyName);
    const subtitle = isCompany
        ? vendor.companyName ?? '—'
        : [vendor.firstName, vendor.lastName].filter(Boolean).join(' ') || '—';
    const balance = vendor.balance;
    const hasBalance = balance > 0;
    const src = sourceLabel(vendor.source);

    return (
        <Link
            href={`/admin/vendors/${vendor.id}`}
            className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-5 hover:border-white/10 hover:bg-[#1f1f1f] transition-all flex flex-col group block"
        >
            <div className="flex items-start justify-between mb-4 gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="shrink-0 w-11 h-11 rounded-full bg-gradient-to-br from-[#b8956a] to-[#8c6e4e] flex items-center justify-center text-black text-sm font-bold tracking-wide">
                        {initialsFor(vendor)}
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="font-serif text-lg font-bold text-white group-hover:text-[#b8956a] transition-colors leading-tight truncate">
                            {vendor.displayName}
                        </h3>
                        <p className="text-xs text-white/50 mt-0.5 truncate flex items-center gap-1">
                            {isCompany ? <Building2 size={11} /> : <User size={11} />}
                            <span className="truncate">{subtitle}</span>
                        </p>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                    <StatusBadge
                        status={vendor.active ? 'Active' : 'Inactive'}
                        category={vendor.active ? 'success' : 'neutral'}
                    />
                    <StatusBadge status={src.label} category={src.category} />
                </div>
            </div>

            <div className="space-y-2 flex-grow mb-4">
                {vendor.email && (
                    <div className="flex items-center justify-between text-sm gap-3">
                        <span className="text-white/40 flex items-center gap-1.5 shrink-0">
                            <Mail size={12} /> Email
                        </span>
                        <span className="text-white/80 truncate text-right">{vendor.email}</span>
                    </div>
                )}
                {vendor.phone && (
                    <div className="flex items-center justify-between text-sm gap-3">
                        <span className="text-white/40 flex items-center gap-1.5 shrink-0">
                            <Phone size={12} /> Phone
                        </span>
                        <span className="text-white/80 font-mono text-right">{vendor.phone}</span>
                    </div>
                )}
                {!vendor.email && !vendor.phone && (
                    <p className="text-sm text-white/30 italic">No contact info yet</p>
                )}
            </div>

            <div className="pt-3 border-t border-white/6 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    {vendor.is1099 && (
                        <span className="px-2 py-0.5 bg-[#b8956a]/10 border border-[#b8956a]/20 text-[#b8956a] text-[10px] rounded-full font-semibold uppercase tracking-wide">
                            1099
                        </span>
                    )}
                    {vendor.subcontractorId && (
                        <span className="px-2 py-0.5 bg-white/5 border border-white/10 text-white/60 text-[10px] rounded-full font-semibold uppercase tracking-wide flex items-center gap-1">
                            <Link2 size={10} /> Sub
                        </span>
                    )}
                </div>
                <span className={`font-mono font-bold text-sm ${hasBalance ? 'text-red-400' : 'text-white/60'}`}>
                    {fmtMoney(balance)}
                </span>
            </div>
        </Link>
    );
}

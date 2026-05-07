'use client';

import Link from 'next/link';
import { Mail, Phone, Building2, User } from 'lucide-react';
import { StatusBadge } from '@/components/admin/status-badge';
import type { Customer } from '@/lib/customers';

interface CustomerCardProps {
    customer: Customer;
}

function fmtMoney(n: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
    }).format(n);
}

function initialsFor(c: Customer): string {
    if (c.customerType === 'Company') {
        const cn = (c.companyName ?? c.displayName).trim();
        const parts = cn.split(/\s+/).filter(Boolean);
        const first = parts[0]?.[0] ?? '';
        const second = parts[1]?.[0] ?? '';
        return (first + second).toUpperCase() || cn.slice(0, 2).toUpperCase();
    }
    const fn = (c.firstName ?? '').trim();
    const ln = (c.lastName ?? '').trim();
    const fromName = (fn[0] ?? '') + (ln[0] ?? '');
    if (fromName) return fromName.toUpperCase();
    return (c.displayName.trim().slice(0, 2) || 'CU').toUpperCase();
}

export function CustomerCard({ customer }: CustomerCardProps) {
    const isCompany = customer.customerType === 'Company';
    const subtitle = isCompany
        ? customer.companyName ?? '—'
        : [customer.firstName, customer.lastName].filter(Boolean).join(' ') || '—';
    const balance = customer.balance;
    const hasBalance = balance > 0;

    return (
        <Link
            href={`/admin/customers/${customer.id}`}
            className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-5 hover:border-white/10 hover:bg-[#1f1f1f] transition-all flex flex-col group block"
        >
            <div className="flex items-start justify-between mb-4 gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Initials avatar */}
                    <div className="shrink-0 w-11 h-11 rounded-full bg-gradient-to-br from-[#b8956a] to-[#8c6e4e] flex items-center justify-center text-black text-sm font-bold tracking-wide">
                        {initialsFor(customer)}
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="font-serif text-lg font-bold text-white group-hover:text-[#b8956a] transition-colors leading-tight truncate">
                            {customer.displayName}
                        </h3>
                        <p className="text-xs text-white/50 mt-0.5 truncate flex items-center gap-1">
                            {isCompany ? <Building2 size={11} /> : <User size={11} />}
                            <span className="truncate">{subtitle}</span>
                        </p>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                    <StatusBadge
                        status={customer.active ? 'Active' : 'Inactive'}
                        category={customer.active ? 'success' : 'neutral'}
                    />
                    <StatusBadge
                        status={customer.source === 'crm' ? 'CRM' : 'QuickBooks'}
                        category={customer.source === 'crm' ? 'brand' : 'info'}
                    />
                </div>
            </div>

            <div className="space-y-2 flex-grow mb-4">
                {customer.email && (
                    <div className="flex items-center justify-between text-sm gap-3">
                        <span className="text-white/40 flex items-center gap-1.5 shrink-0">
                            <Mail size={12} /> Email
                        </span>
                        <span className="text-white/80 truncate text-right">{customer.email}</span>
                    </div>
                )}
                {customer.phone && (
                    <div className="flex items-center justify-between text-sm gap-3">
                        <span className="text-white/40 flex items-center gap-1.5 shrink-0">
                            <Phone size={12} /> Phone
                        </span>
                        <span className="text-white/80 font-mono text-right">{customer.phone}</span>
                    </div>
                )}
                {!customer.email && !customer.phone && (
                    <p className="text-sm text-white/30 italic">No contact info yet</p>
                )}
            </div>

            <div className="pt-3 border-t border-white/6 flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-widest text-white/30">Balance</span>
                <span className={`font-mono font-bold text-sm ${hasBalance ? 'text-red-400' : 'text-white/60'}`}>
                    {fmtMoney(balance)}
                </span>
            </div>
        </Link>
    );
}

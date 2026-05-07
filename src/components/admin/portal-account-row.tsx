'use client';

import Link from 'next/link';
import { ChevronRight, User, Users } from 'lucide-react';

export interface PortalAccount {
    credentialId: string;
    userType: 'employee' | 'subcontractor';
    userId: string;
    displayName: string;
    email: string;
    enabled: boolean;
    mustChangePin: boolean;
    lastLoginAt: string | null;
    role: string;
}

interface PortalAccountRowProps {
    account: PortalAccount;
}

function fmtLastLogin(iso: string | null): string {
    if (!iso) return 'Never';
    const d = new Date(iso);
    const ms = Date.now() - d.getTime();
    if (!Number.isFinite(ms) || ms < 0) return d.toLocaleDateString();
    const sec = Math.floor(ms / 1000);
    if (sec < 60) return `${sec}s ago`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const day = Math.floor(hr / 24);
    if (day < 30) return `${day}d ago`;
    return d.toLocaleDateString();
}

export function PortalAccountRow({ account }: PortalAccountRowProps) {
    const href = account.userType === 'employee'
        ? `/admin/employees/${account.userId}/portal`
        : `/admin/subcontractors/${account.userId}/portal`;

    const Icon = account.userType === 'employee' ? User : Users;
    const typeColor = account.userType === 'employee' ? '#f472b6' : '#a78bfa';

    return (
        <Link
            href={href}
            className="group grid grid-cols-12 items-center gap-3 px-4 sm:px-6 py-4 border-b border-white/6 hover:bg-white/3 transition-colors"
        >
            <div className="col-span-12 md:col-span-4 flex items-center gap-3 min-w-0">
                <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${typeColor}15` }}
                >
                    <Icon size={15} style={{ color: typeColor }} />
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate group-hover:text-[#b8956a] transition-colors">
                        {account.displayName || '(no name)'}
                    </p>
                    <p className="text-[11px] text-white/35 truncate">{account.email}</p>
                </div>
            </div>

            <div className="col-span-6 md:col-span-2 hidden md:block">
                <span
                    className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full"
                    style={{ background: `${typeColor}15`, color: typeColor }}
                >
                    {account.userType === 'employee' ? 'Employee' : 'Sub'}
                </span>
            </div>

            <div className="col-span-6 md:col-span-3 hidden md:block min-w-0">
                <p className="text-xs text-white/55 truncate">{account.role || '—'}</p>
            </div>

            <div className="col-span-6 md:col-span-2 text-left md:text-left">
                <p className="text-[11px] text-white/35">Last login</p>
                <p className="text-xs text-white/70 font-mono">{fmtLastLogin(account.lastLoginAt)}</p>
            </div>

            <div className="col-span-6 md:col-span-1 flex items-center justify-end gap-2">
                <span
                    className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border ${
                        account.enabled
                            ? 'bg-[#34d399]/10 text-[#34d399] border-[#34d399]/20'
                            : 'bg-white/5 text-white/40 border-white/10'
                    }`}
                >
                    {account.enabled ? 'Active' : 'Off'}
                </span>
                <ChevronRight size={14} className="text-white/20 group-hover:text-[#b8956a] transition-colors hidden md:block" />
            </div>
        </Link>
    );
}

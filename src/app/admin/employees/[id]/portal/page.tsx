'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Activity as ActivityIcon, ArrowLeft, AlertCircle } from 'lucide-react';
import { EmployeeTabNav } from '@/components/admin/employee-tab-nav';
import { PortalAccessCard } from '@/components/admin/portal-access-card';

interface EmployeeRow {
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
    role: string;
}

interface ActivityRow {
    id: string;
    entity_type: string;
    entity_id: string;
    action: string;
    actor: string | null;
    description: string | null;
    created_at: string;
}

function timeAgo(iso: string): string {
    const then = new Date(iso).getTime();
    if (!Number.isFinite(then)) return '';
    const sec = Math.floor((Date.now() - then) / 1000);
    if (sec < 60) return `${sec}s ago`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const day = Math.floor(hr / 24);
    if (day < 30) return `${day}d ago`;
    return new Date(iso).toLocaleDateString();
}

export default function EmployeePortalPage() {
    const params = useParams();
    const id = params?.id as string;

    const [emp, setEmp] = useState<EmployeeRow | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [notFound, setNotFound] = useState(false);
    const [activity, setActivity] = useState<ActivityRow[]>([]);

    const load = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        setError(null);
        try {
            const r = await fetch(`/api/employees/${id}`, { cache: 'no-store' });
            if (r.status === 404) {
                setNotFound(true);
                setLoading(false);
                return;
            }
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            const j = (await r.json()) as EmployeeRow;
            setEmp(j);

            const aRes = await fetch(
                `/api/activity?entity_type=employee&entity_id=${encodeURIComponent(id)}&limit=10`,
                { cache: 'no-store' },
            );
            if (aRes.ok) {
                const list = (await aRes.json()) as ActivityRow[];
                setActivity(Array.isArray(list) ? list : []);
            }
        } catch (e) {
            setError(String(e));
        }
        setLoading(false);
    }, [id]);

    useEffect(() => {
        load();
    }, [load]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32">
                <div className="w-8 h-8 rounded-full border-2 border-[#b8956a]/30 border-t-[#b8956a] animate-spin" />
            </div>
        );
    }

    if (notFound) {
        return (
            <div className="flex flex-col items-center justify-center py-32 text-white/30">
                <p className="text-lg font-serif font-bold text-white mb-2">Employee Not Found</p>
                <p className="text-sm mb-4">This record may have been deleted.</p>
                <Link href="/admin/employees" className="text-[#b8956a] hover:text-[#cbb08c] text-sm font-semibold">
                    Back to employees
                </Link>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 rounded-2xl border border-red-500/20 bg-red-500/5 text-red-300 flex items-start gap-3 max-w-xl mx-auto mt-12">
                <AlertCircle size={20} className="shrink-0 mt-0.5" />
                <div>
                    <p className="font-semibold mb-1">Failed to load employee</p>
                    <p className="text-xs text-red-300/80">{error}</p>
                </div>
            </div>
        );
    }

    if (!emp) return null;

    const fullName = `${emp.first_name} ${emp.last_name}`.trim();

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
            <Link
                href={`/admin/employees/${id}`}
                className="inline-flex items-center gap-2 text-xs font-semibold text-white/40 hover:text-white/70 transition-colors mb-4"
            >
                <ArrowLeft size={13} />
                Back to {fullName}
            </Link>

            <div className="mb-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#b8956a] mb-1">
                    {fullName} · {emp.role}
                </p>
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white">Portal Access</h1>
            </div>

            <EmployeeTabNav employeeId={id} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-2">
                <div className="lg:col-span-2">
                    <PortalAccessCard userType="employee" userId={id} recordEmail={emp.email ?? null} />
                </div>

                <div className="lg:col-span-1">
                    <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl overflow-hidden">
                        <div className="px-5 py-4 border-b border-white/6 flex items-center gap-2">
                            <ActivityIcon size={14} className="text-[#b8956a]" />
                            <h2 className="font-serif text-sm font-semibold text-white">Recent activity</h2>
                        </div>
                        {activity.length === 0 ? (
                            <div className="px-5 py-10 text-center">
                                <p className="text-xs text-white/40">No recent activity for this employee.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-white/6">
                                {activity.map((row) => (
                                    <div key={row.id} className="px-5 py-3">
                                        <p className="text-xs text-white/85 truncate">
                                            {row.description || `${row.action} on ${row.entity_type}`}
                                        </p>
                                        <p className="text-[11px] text-white/35 font-mono mt-0.5">
                                            {row.action} · {timeAgo(row.created_at)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

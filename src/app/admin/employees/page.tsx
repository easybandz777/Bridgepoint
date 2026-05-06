'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, UserPlus, Trash2, Mail, Phone, Sparkles } from 'lucide-react';
import { StatusBadge } from '@/components/admin/status-badge';
import { Employee, fmtMoney, rowToEmployee } from '@/lib/employees';

export default function EmployeesDirectoryPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    const [seeding, setSeeding] = useState(false);

    async function load() {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/employees');
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            setEmployees(Array.isArray(data) ? data.map(rowToEmployee) : []);
        } catch (e) {
            setEmployees([]);
            setError(String(e));
        }
        setLoading(false);
    }

    useEffect(() => { load(); }, []);

    async function deleteEmployee(id: string) {
        if (!confirm('Delete this employee and all their time entries / documents? This cannot be undone.')) return;
        await fetch(`/api/employees/${id}`, { method: 'DELETE' });
        setEmployees(p => p.filter(e => e.id !== id));
    }

    async function seedSamples() {
        if (!confirm('Load sample employees (only works if directory is empty)?')) return;
        setSeeding(true);
        try {
            const res = await fetch('/api/employees/seed', { method: 'POST' });
            const data = await res.json();
            if (data.error) {
                alert(`Seed failed: ${data.error}`);
            }
        } catch (e) {
            alert(`Seed failed: ${String(e)}`);
        }
        setSeeding(false);
        load();
    }

    const totalEmployees = employees.length;
    const activeCount = employees.filter(e => e.status === 'Active').length;
    const onPayroll = employees.filter(e => e.status === 'Active' && (e.hourlyRate > 0 || (e.salary ?? 0) > 0)).length;
    const totalHoursThisWeek = employees.reduce((s, e) => s + (e.metrics.hoursThisWeek || 0), 0);
    const totalAnnualPayroll = employees
        .filter(e => e.status === 'Active')
        .reduce((s, e) => s + (e.salary ?? e.hourlyRate * 2080), 0);

    const allRoles = useMemo(() => Array.from(new Set(employees.map(e => e.role))).sort(), [employees]);

    const filtered = employees.filter(emp => {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
            !q ||
            `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(q) ||
            (emp.email ?? '').toLowerCase().includes(q) ||
            emp.role.toLowerCase().includes(q) ||
            emp.skills.some(s => s.toLowerCase().includes(q));
        const matchesRole = roleFilter === 'All' || emp.role === roleFilter;
        const matchesStatus = statusFilter === 'All' || emp.status === statusFilter;
        return matchesSearch && matchesRole && matchesStatus;
    });

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#b8956a] mb-1">Admin</p>
                    <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white mb-1">Employees</h1>
                    <p className="text-sm text-white/50">Manage in-house team, time, certifications and pay.</p>
                </div>
                <Link
                    href="/admin/employees/new"
                    className="h-10 px-5 bg-[#b8956a] text-black text-sm font-semibold rounded-full flex items-center justify-center gap-2 hover:bg-[#cbb08c] transition-colors whitespace-nowrap"
                >
                    <Plus size={16} /> Add Employee
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#b8956a] mb-1">Active</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-white">{activeCount}</span>
                        <span className="text-xs text-white/40">of {totalEmployees}</span>
                    </div>
                </div>
                <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#b8956a] mb-1">On Payroll</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-white">{onPayroll}</span>
                        <span className="text-xs text-white/40">paid roles</span>
                    </div>
                </div>
                <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#b8956a] mb-1">Hours This Week</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-white">{totalHoursThisWeek.toFixed(1)}</span>
                        <span className="text-xs text-white/40">logged</span>
                    </div>
                </div>
                <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#b8956a] mb-1">Annual Payroll</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-white">{fmtMoney(totalAnnualPayroll)}</span>
                        <span className="text-xs text-white/40">est.</span>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col lg:flex-row justify-between gap-4 mb-6">
                <div className="flex items-center gap-3 w-full lg:w-auto">
                    <div className="relative flex-1 lg:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                        <input
                            type="text"
                            placeholder="Search names, roles, skills..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-10 pl-10 pr-4 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#b8956a]/50 transition-all"
                        />
                    </div>
                    <select
                        title="Filter by role"
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="h-10 px-4 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none shrink-0"
                    >
                        <option value="All">All Roles</option>
                        {allRoles.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    {['All', 'Active', 'On Leave', 'Inactive', 'Terminated'].map(s => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                                statusFilter === s ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                            }`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* States */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-6 h-6 rounded-full border-2 border-[#b8956a]/30 border-t-[#b8956a] animate-spin" />
                </div>
            ) : error ? (
                <div className="py-16 text-center border border-red-500/20 border-dashed rounded-2xl bg-red-500/5">
                    <h3 className="font-serif text-lg font-bold text-red-300 mb-2">Could not load employees</h3>
                    <p className="text-sm text-red-200/70 mb-4 max-w-sm mx-auto">{error}</p>
                    <button onClick={load} className="text-[#b8956a] hover:text-[#cbb08c] font-semibold text-sm transition-colors">
                        Try again
                    </button>
                </div>
            ) : filtered.length === 0 ? (
                <div className="py-16 text-center border border-white/5 border-dashed rounded-2xl bg-white/[0.02]">
                    <UserPlus size={48} className="mx-auto text-white/10 mb-4" />
                    <h3 className="font-serif text-lg font-bold text-white mb-2">No Employees Yet</h3>
                    <p className="text-white/40 mb-6 max-w-sm mx-auto">
                        {employees.length === 0
                            ? 'Add your first employee or load sample data to explore the module.'
                            : 'No results match your filters.'}
                    </p>
                    {employees.length === 0 ? (
                        <button
                            onClick={seedSamples}
                            disabled={seeding}
                            className="inline-flex items-center gap-2 h-10 px-5 bg-[#b8956a] text-black text-sm font-semibold rounded-full hover:bg-[#cbb08c] transition-colors disabled:opacity-50"
                        >
                            <Sparkles size={14} /> {seeding ? 'Seeding…' : 'Load sample data'}
                        </button>
                    ) : (
                        <button
                            onClick={() => { setSearchQuery(''); setRoleFilter('All'); setStatusFilter('All'); }}
                            className="text-[#b8956a] hover:text-[#cbb08c] font-semibold text-sm transition-colors"
                        >
                            Clear Filters
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map(emp => (
                        <div key={emp.id} className="relative group">
                            <Link
                                href={`/admin/employees/${emp.id}`}
                                className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-5 hover:border-white/10 hover:bg-[#1f1f1f] transition-all flex flex-col relative block"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <StatusBadge status={emp.status} />
                                        </div>
                                        <h3 className="font-serif text-lg font-bold text-white group-hover:text-[#b8956a] transition-colors leading-snug">
                                            {emp.firstName} {emp.lastName}
                                        </h3>
                                        <p className="text-xs text-white/50 uppercase tracking-wider mt-1">{emp.role}</p>
                                    </div>
                                </div>
                                <div className="mb-5 space-y-2 flex-grow">
                                    {emp.email && (
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-white/40 flex items-center gap-1.5"><Mail size={12} /> Email</span>
                                            <span className="text-white truncate ml-2 max-w-[60%]">{emp.email}</span>
                                        </div>
                                    )}
                                    {emp.phone && (
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-white/40 flex items-center gap-1.5"><Phone size={12} /> Phone</span>
                                            <span className="text-white font-mono">{emp.phone}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="pt-4 border-t border-white/6 grid grid-cols-3 gap-2 text-center">
                                    <div>
                                        <div className="text-[10px] text-white/30 uppercase tracking-widest mb-1">Rate</div>
                                        <div className="font-bold text-white font-mono">
                                            {emp.salary ? fmtMoney(emp.salary) : `$${emp.hourlyRate.toFixed(0)}/h`}
                                        </div>
                                    </div>
                                    <div className="border-l border-white/6">
                                        <div className="text-[10px] text-white/30 uppercase tracking-widest mb-1">Type</div>
                                        <div className="font-bold text-white text-xs">{emp.employmentType}</div>
                                    </div>
                                    <div className="border-l border-white/6">
                                        <div className="text-[10px] text-white/30 uppercase tracking-widest mb-1">Hired</div>
                                        <div className="font-bold text-white text-xs">
                                            {emp.hireDate ? emp.hireDate.slice(0, 4) : '—'}
                                        </div>
                                    </div>
                                </div>
                            </Link>
                            <button
                                onClick={() => deleteEmployee(emp.id)}
                                title="Delete employee"
                                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 w-8 h-8 flex items-center justify-center rounded-lg text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-all z-10"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

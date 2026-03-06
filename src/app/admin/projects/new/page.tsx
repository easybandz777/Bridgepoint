'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Briefcase, User, Calendar, DollarSign } from 'lucide-react';
import { SAMPLE_ESTIMATES } from '@/lib/estimates';
import { formatCurrency } from '@/lib/estimates';

export default function NewProjectPage() {
    const router = useRouter();
    const [source, setSource] = useState<'scratch' | 'estimate'>('scratch');
    const [selectedEstimateId, setSelectedEstimateId] = useState('');

    // Form State
    const [name, setName] = useState('');
    const [clientName, setClientName] = useState('');
    const [address, setAddress] = useState('');
    const [startDate, setStartDate] = useState('');
    const [estimatedRevenue, setEstimatedRevenue] = useState(0);
    const [estimatedCost, setEstimatedCost] = useState(0);

    // Load data from estimate
    function handleEstimateSelect(id: string) {
        setSelectedEstimateId(id);
        const est = SAMPLE_ESTIMATES.find(e => e.id === id);
        if (est) {
            setName(est.project.title);
            setClientName(est.client.name);
            setAddress(est.project.address);
            setStartDate(est.project.startDate);
            setEstimatedRevenue(est.total);
            setEstimatedCost(est.total * 0.7); // Roughly 70% cost assumption
        }
    }

    function handleSave(e: React.FormEvent) {
        e.preventDefault();
        // In a real app we'd save to DB here. For now we navigate back to projects
        router.push('/admin/projects');
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link
                    href="/admin/projects"
                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:bg-white/10 hover:text-white transition-colors"
                >
                    <ArrowLeft size={18} />
                </Link>
                <div>
                    <h1 className="font-serif text-2xl font-bold text-white mb-1">New Project Setup</h1>
                    <p className="text-sm text-white/50">Create an active job for tracking and operations.</p>
                </div>
            </div>

            <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl overflow-hidden">
                {/* Source Selection */}
                <div className="p-6 sm:p-8 border-b border-white/6">
                    <h2 className="text-sm font-semibold text-white mb-4">Creation Method</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button
                            type="button"
                            onClick={() => { setSource('scratch'); setSelectedEstimateId(''); }}
                            className={`p-4 rounded-xl border text-left transition-all ${source === 'scratch'
                                    ? 'border-[#b8956a] bg-[#b8956a]/10'
                                    : 'border-white/10 hover:border-white/20 bg-white/5'
                                }`}
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <Briefcase className={source === 'scratch' ? 'text-[#b8956a]' : 'text-white/40'} size={18} />
                                <span className={`font-semibold ${source === 'scratch' ? 'text-[#b8956a]' : 'text-white'}`}>
                                    From Scratch
                                </span>
                            </div>
                            <p className="text-xs text-white/40">Enter all project details manually. Best for jobs without formal estimates.</p>
                        </button>

                        <button
                            type="button"
                            onClick={() => setSource('estimate')}
                            className={`p-4 rounded-xl border text-left transition-all ${source === 'estimate'
                                    ? 'border-[#b8956a] bg-[#b8956a]/10'
                                    : 'border-white/10 hover:border-white/20 bg-white/5'
                                }`}
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <FileText className={source === 'estimate' ? 'text-[#b8956a]' : 'text-white/40'} size={18} />
                                <span className={`font-semibold ${source === 'estimate' ? 'text-[#b8956a]' : 'text-white'}`}>
                                    From Approved Estimate
                                </span>
                            </div>
                            <p className="text-xs text-white/40">Convert an existing proposal into an active job. Migrates client info and totals.</p>
                        </button>
                    </div>

                    {source === 'estimate' && (
                        <div className="mt-6">
                            <label className="block text-xs font-semibold text-white/60 mb-2 uppercase tracking-wide">Select Estimate</label>
                            <select
                                value={selectedEstimateId}
                                onChange={(e) => handleEstimateSelect(e.target.value)}
                                className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#b8956a]/50"
                            >
                                <option value="">-- Choose an approved estimate --</option>
                                {SAMPLE_ESTIMATES.filter(e => e.status === 'Approved' || e.status === 'Sent').map(e => (
                                    <option key={e.id} value={e.id}>{e.estimateNumber} — {e.project.title}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {/* Form */}
                <form onSubmit={handleSave} className="p-6 sm:p-8 space-y-8">
                    {/* Basic Info */}
                    <div>
                        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                            <Briefcase size={16} className="text-[#b8956a]" /> Project Details
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-white/50 mb-1.5">Project Name</label>
                                <input
                                    type="text" required
                                    value={name} onChange={e => setName(e.target.value)}
                                    placeholder="e.g. Master Bath Remodel - Smith"
                                    className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#b8956a]/50"
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-white/50 mb-1.5 flex items-center gap-1.5"><User size={12} /> Client Name</label>
                                    <input
                                        type="text" required
                                        value={clientName} onChange={e => setClientName(e.target.value)}
                                        className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#b8956a]/50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-white/50 mb-1.5 flex items-center gap-1.5"><Calendar size={12} /> Target Start Date</label>
                                    <input
                                        type="date"
                                        value={startDate} onChange={e => setStartDate(e.target.value)}
                                        className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#b8956a]/50 [color-scheme:dark]"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-white/50 mb-1.5">Job Address</label>
                                <input
                                    type="text"
                                    value={address} onChange={e => setAddress(e.target.value)}
                                    className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#b8956a]/50"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Financial Targets */}
                    <div className="pt-6 border-t border-white/6">
                        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                            <DollarSign size={16} className="text-[#b8956a]" /> Initial Budgets
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-white/50 mb-1.5">Estimated Complete Revenue</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30">$</span>
                                    <input
                                        type="number" required min="0" step="any"
                                        value={estimatedRevenue || ''} onChange={e => setEstimatedRevenue(Number(e.target.value))}
                                        className="w-full h-10 pl-8 pr-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#b8956a]/50"
                                    />
                                </div>
                                {source === 'estimate' && <p className="text-[10px] text-white/30 mt-1">Pre-filled from estimate total</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-white/50 mb-1.5">Estimated Total Cost</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30">$</span>
                                    <input
                                        type="number" required min="0" step="any"
                                        value={estimatedCost || ''} onChange={e => setEstimatedCost(Number(e.target.value))}
                                        className="w-full h-10 pl-8 pr-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#b8956a]/50"
                                    />
                                </div>
                                {source === 'estimate' && <p className="text-[10px] text-white/30 mt-1">Estimated at 70% of revenue</p>}
                            </div>
                        </div>

                        {(estimatedRevenue > 0 && estimatedCost > 0) && (
                            <div className="mt-4 p-4 rounded-xl bg-black/30 border border-white/5 flex gap-8">
                                <div>
                                    <p className="text-[10px] uppercase tracking-wide text-white/40 mb-1">Target Gross Profit</p>
                                    <p className="text-sm font-semibold text-white">{formatCurrency(estimatedRevenue - estimatedCost)}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-wide text-white/40 mb-1">Target Margin</p>
                                    <p className="text-sm font-semibold text-[#b8956a]">
                                        {((estimatedRevenue - estimatedCost) / estimatedRevenue * 100).toFixed(1)}%
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Submit */}
                    <div className="pt-6 border-t border-white/6 flex justify-end gap-3">
                        <Link
                            href="/admin/projects"
                            className="h-10 px-5 rounded-full text-sm font-semibold text-white/50 hover:text-white hover:bg-white/5 transition-colors flex items-center"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            className="h-10 px-6 bg-[#b8956a] text-black text-sm font-semibold rounded-full flex items-center gap-2 hover:bg-[#cbb08c] transition-colors"
                        >
                            <Save size={16} />
                            Create Project
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

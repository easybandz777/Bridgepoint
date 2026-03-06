'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, ShieldCheck, Info } from 'lucide-react';
import { TradeCategory } from '@/lib/subcontractors';

const TRADES: TradeCategory[] = [ // Hardcoded array of common trades for the dropdown
    'Framing', 'Plumbing', 'Electrical', 'HVAC', 'Drywall',
    'Painting', 'Flooring', 'Roofing', 'Landscaping', 'General'
];

export default function NewSubcontractorPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [companyName, setCompanyName] = useState('');
    const [primaryContact, setPrimaryContact] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [taxId, setTaxId] = useState('');
    const [selectedTrades, setSelectedTrades] = useState<TradeCategory[]>([]);

    // Compliance State
    const [hasW9, setHasW9] = useState(false);
    const [hasCOI, setHasCOI] = useState(false);
    const [hasMSA, setHasMSA] = useState(false);
    const [insuranceExpiry, setInsuranceExpiry] = useState('');

    const toggleTrade = (trade: TradeCategory) => {
        if (selectedTrades.includes(trade)) {
            setSelectedTrades(current => current.filter(t => t !== trade));
        } else {
            setSelectedTrades(current => [...current, trade]);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Simulate API call to save subcontractor
        // Normally this would POST to /api/subcontractors
        setTimeout(() => {
            // Once saved, redirect back to the directory or the new sub profile
            router.push('/admin/subcontractors');
            router.refresh();
        }, 1000);
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <Link href="/admin/subcontractors" className="inline-flex items-center text-xs font-semibold uppercase tracking-widest text-[#b8956a] hover:text-[#cbb08c] transition-colors mb-4">
                    <ArrowLeft size={14} className="mr-2" />
                    Back to Directory
                </Link>
                <h1 className="font-serif text-3xl font-bold text-white mb-2">Add Subcontractor</h1>
                <p className="text-white/50 text-sm">Create a new profile for a trade partner and track compliance.</p>
            </div>

            <form onSubmit={handleSave} className="space-y-8">

                {/* 1. Basic Information */}
                <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6 sm:p-8">
                    <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs text-white/50 font-mono">1</span>
                        Company Information
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-xs uppercase tracking-widest text-white/40 mb-2 font-semibold">Company Name *</label>
                            <input
                                required
                                type="text"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-[#b8956a]/50 focus:bg-white/10 transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-xs uppercase tracking-widest text-white/40 mb-2 font-semibold">Primary Contact *</label>
                            <input
                                required
                                type="text"
                                value={primaryContact}
                                onChange={(e) => setPrimaryContact(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-[#b8956a]/50 focus:bg-white/10 transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-xs uppercase tracking-widest text-white/40 mb-2 font-semibold">Tax ID / EIN</label>
                            <input
                                type="text"
                                value={taxId}
                                onChange={(e) => setTaxId(e.target.value)}
                                placeholder="XX-XXXXXXX"
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-[#b8956a]/50 focus:bg-white/10 transition-colors font-mono"
                            />
                        </div>

                        <div>
                            <label className="block text-xs uppercase tracking-widest text-white/40 mb-2 font-semibold">Email Address *</label>
                            <input
                                required
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-[#b8956a]/50 focus:bg-white/10 transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-xs uppercase tracking-widest text-white/40 mb-2 font-semibold">Phone Number *</label>
                            <input
                                required
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-[#b8956a]/50 focus:bg-white/10 transition-colors"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-xs uppercase tracking-widest text-white/40 mb-2 font-semibold">Physical Address</label>
                            <textarea
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-[#b8956a]/50 focus:bg-white/10 transition-colors min-h-[80px]"
                            />
                        </div>
                    </div>
                </div>

                {/* 2. Trade Categories */}
                <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6 sm:p-8">
                    <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs text-white/50 font-mono">2</span>
                        Trade Categories
                    </h2>
                    <p className="text-sm text-white/50 mb-6 pl-8">Select all trades this subcontractor is qualified to perform.</p>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pl-8">
                        {TRADES.map((trade) => (
                            <button
                                key={trade}
                                type="button"
                                onClick={() => toggleTrade(trade)}
                                className={`px-4 py-3 rounded-xl border text-sm font-semibold transition-all flex items-center justify-between ${selectedTrades.includes(trade)
                                        ? 'bg-[#b8956a]/10 border-[#b8956a]/50 text-[#b8956a]'
                                        : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                                    }`}
                            >
                                {trade}
                                {selectedTrades.includes(trade) && <div className="w-2 h-2 rounded-full bg-[#b8956a]" />}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 3. Compliance & Documentation */}
                <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6 sm:p-8">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs text-white/50 font-mono">3</span>
                                Compliance Tracking
                            </h2>
                            <p className="text-sm text-white/50 mt-1 pl-8 flex items-center gap-1.5">
                                <Info size={14} /> You can upload the actual files later in the sub profile.
                            </p>
                        </div>
                    </div>

                    <div className="pl-8 space-y-4">
                        <label className="flex items-center gap-3 p-4 bg-white/5 border border-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
                            <input
                                type="checkbox"
                                checked={hasW9}
                                onChange={(e) => setHasW9(e.target.checked)}
                                className="w-5 h-5 rounded border-white/20 bg-black/50 text-[#b8956a] focus:ring-[#b8956a] focus:ring-offset-0"
                            />
                            <div>
                                <p className="text-sm font-medium text-white flex items-center gap-2">
                                    W-9 Form Collected {hasW9 && <span className="text-[10px] uppercase tracking-widest text-[#34d399] font-bold">Verified</span>}
                                </p>
                            </div>
                        </label>

                        <label className="flex items-center gap-3 p-4 bg-white/5 border border-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
                            <input
                                type="checkbox"
                                checked={hasMSA}
                                onChange={(e) => setHasMSA(e.target.checked)}
                                className="w-5 h-5 rounded border-white/20 bg-black/50 text-[#b8956a] focus:ring-[#b8956a] focus:ring-offset-0"
                            />
                            <div>
                                <p className="text-sm font-medium text-white flex items-center gap-2">
                                    Master Subcontractor Agreement (MSA) Signed {hasMSA && <span className="text-[10px] uppercase tracking-widest text-[#34d399] font-bold">Verified</span>}
                                </p>
                            </div>
                        </label>

                        <div className={`p-4 border rounded-xl transition-colors ${hasCOI ? 'bg-[#b8956a]/5 border-[#b8956a]/30' : 'bg-white/5 border-white/5'}`}>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={hasCOI}
                                    onChange={(e) => setHasCOI(e.target.checked)}
                                    className="w-5 h-5 rounded border-white/20 bg-black/50 text-[#b8956a] focus:ring-[#b8956a] focus:ring-offset-0 mt-0.5 self-start"
                                />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-white flex items-center gap-2">
                                        Certificate of Insurance (COI) {hasCOI && <span className="text-[10px] uppercase tracking-widest text-[#34d399] font-bold">Verified</span>}
                                    </p>

                                    {hasCOI && (
                                        <div className="mt-4 pt-4 border-t border-white/10">
                                            <label className="block text-xs uppercase tracking-widest text-white/40 mb-2 font-semibold">Policy Expiration Date *</label>
                                            <input
                                                required={hasCOI}
                                                type="date"
                                                value={insuranceExpiry}
                                                onChange={(e) => setInsuranceExpiry(e.target.value)}
                                                className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#b8956a]/50 text-sm"
                                            />
                                        </div>
                                    )}
                                </div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end gap-4 pt-4 border-t border-white/10">
                    <Link
                        href="/admin/subcontractors"
                        className="h-12 px-6 rounded-full flex items-center justify-center font-semibold text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={isSubmitting || !companyName || !primaryContact || selectedTrades.length === 0}
                        className="h-12 px-8 bg-[#b8956a] text-black rounded-full flex items-center justify-center font-bold hover:bg-[#cbb08c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Saving Profile...' : 'Create Subcontractor'}
                    </button>
                </div>
            </form>
        </div>
    );
}

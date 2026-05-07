'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import {
    ArrowRight,
    Building2,
    CarFront,
    Fence,
    Fuel,
    Home,
    House,
    Sun,
    Truck,
    type LucideIcon,
} from 'lucide-react';

type Category = 'residential' | 'commercial' | 'both';
type Filter = 'residential' | 'commercial' | 'all';
type Badge = 'BUNDLE' | 'MOST POPULAR' | 'HOT';

type Service = {
    id: string;
    name: string;
    category: Category;
    icon: LucideIcon;
    priceFrom: number;
    unit: string;
    blurb: string;
    badge?: Badge;
};

const SERVICES: Service[] = [
    {
        id: 'house',
        name: 'House Wash (Soft Wash)',
        category: 'residential',
        icon: Home,
        priceFrom: 250,
        unit: 'starting price',
        blurb:
            'Low-pressure soft wash with hot water and detergent. Safe for siding, paint, and brick. Kills mildew at the root.',
        badge: 'MOST POPULAR',
    },
    {
        id: 'driveway',
        name: 'Driveway & Concrete',
        category: 'residential',
        icon: CarFront,
        priceFrom: 125,
        unit: 'starting price',
        blurb:
            'Surface cleaner attachment + 200°F hot water. Pulls oil, tire grime, and 8 years of pollen out in one pass.',
    },
    {
        id: 'deck',
        name: 'Deck & Fence',
        category: 'residential',
        icon: Fence,
        priceFrom: 250,
        unit: 'starting price',
        blurb:
            'Soft-wash chemistry plus brightener. Restores grayed wood without etching the grain.',
    },
    {
        id: 'roof',
        name: 'Roof Soft Wash',
        category: 'residential',
        icon: House,
        priceFrom: 400,
        unit: 'starting price',
        blurb:
            'Low-pressure roof wash with mildewcide. Removes black streaks (Gloeocapsa magma algae) without damaging shingles.',
        badge: 'HOT',
    },
    {
        id: 'patio',
        name: 'Patio & Pool Deck',
        category: 'residential',
        icon: Sun,
        priceFrom: 0.2,
        unit: 'per sq ft',
        blurb:
            'Concrete, pavers, travertine, flagstone. Hot water dissolves sunscreen residue, BBQ grease, and food spills.',
    },
    {
        id: 'commercial-pad',
        name: 'Dumpster Pad & Restaurant',
        category: 'commercial',
        icon: Building2,
        priceFrom: 125,
        unit: 'per visit, monthly recurring',
        blurb:
            'Hot water + degreaser dissolves trash juice and rancid grease. Smell goes away when the grease does.',
    },
    {
        id: 'fleet',
        name: 'Fleet & Equipment Wash',
        category: 'commercial',
        icon: Truck,
        priceFrom: 35,
        unit: 'per vehicle',
        blurb:
            'Trucks, trailers, box vans, heavy equipment. Volume discounts on recurring fleet contracts.',
    },
    {
        id: 'forecourt',
        name: 'Gas Station Forecourt',
        category: 'commercial',
        icon: Fuel,
        priceFrom: 400,
        unit: 'starting price',
        blurb:
            'Hot water on petroleum-stained concrete. Quarterly contracts for stations and parking decks.',
    },
];

const FILTERS: { id: Filter; label: string }[] = [
    { id: 'residential', label: 'Residential' },
    { id: 'commercial', label: 'Commercial' },
    { id: 'all', label: 'All' },
];

const wholeDollar = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
});

const fractionalDollar = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

function formatPrice(value: number): string {
    if (value < 1) return fractionalDollar.format(value);
    return wholeDollar.format(value);
}

const BADGE_STYLES: Record<Badge, string> = {
    'MOST POPULAR': 'bg-[#b8956a]/15 text-[#b8956a] border border-[#b8956a]/30',
    HOT: 'bg-red-500/15 text-red-300 border border-red-500/30',
    BUNDLE: 'bg-cyan-400/15 text-cyan-300 border border-cyan-400/30',
};

export function ServicesGrid() {
    const [filter, setFilter] = useState<Filter>('residential');

    const visible = SERVICES.filter((s) => {
        if (filter === 'all') return true;
        if (s.category === 'both') return true;
        return s.category === filter;
    });

    return (
        <section className="relative py-28 bg-[#0a0a0a] overflow-hidden" aria-label="Services and pricing">
            <div className="relative mx-auto max-w-7xl px-6">
                {/* Header */}
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#b8956a]">
                        Services &amp; Pricing
                    </p>
                    <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-white font-bold mt-3">
                        What we wash.
                    </h2>
                    <p className="mt-4 max-w-2xl text-white/55 leading-relaxed">
                        Free on-site estimate, written and itemized. Same crew on every job. Hot-water rig
                        on every appropriate surface.
                    </p>
                </div>

                {/* Filter pills */}
                <div className="mt-12 flex flex-wrap gap-2" role="tablist" aria-label="Filter services">
                    {FILTERS.map((f) => {
                        const active = filter === f.id;
                        return (
                            <button
                                key={f.id}
                                type="button"
                                role="tab"
                                aria-selected={active}
                                onClick={() => setFilter(f.id)}
                                className={[
                                    'px-5 py-2 rounded-full text-sm font-semibold transition-all',
                                    active
                                        ? 'bg-[#b8956a] text-[#0a0a0a] shadow-[0_0_0_1px_rgba(184,149,106,0.4)]'
                                        : 'bg-white/5 text-white/70 border border-white/10 hover:border-white/30 hover:text-white',
                                ].join(' ')}
                            >
                                {f.label}
                            </button>
                        );
                    })}
                </div>

                {/* Grid */}
                <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <AnimatePresence mode="popLayout">
                        {visible.map((service) => {
                            const Icon = service.icon;
                            return (
                                <motion.article
                                    key={service.id}
                                    layout
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -12 }}
                                    transition={{ duration: 0.28, ease: 'easeOut' }}
                                    className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-7 hover:border-[#b8956a]/30 transition-all flex flex-col"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <Icon size={28} className="text-[#b8956a]" aria-hidden="true" />
                                        {service.badge ? (
                                            <span
                                                className={[
                                                    'text-[10px] font-bold uppercase tracking-[0.18em] px-2 py-1 rounded-full whitespace-nowrap',
                                                    BADGE_STYLES[service.badge],
                                                ].join(' ')}
                                            >
                                                {service.badge}
                                            </span>
                                        ) : null}
                                    </div>

                                    <h3 className="font-serif text-lg font-bold text-white mt-5">
                                        {service.name}
                                    </h3>
                                    <p className="text-sm text-white/55 leading-relaxed mt-2 flex-grow">
                                        {service.blurb}
                                    </p>

                                    <div className="mt-6 pt-5 border-t border-white/6">
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/30">
                                            From
                                        </p>
                                        <p className="font-serif text-3xl text-white font-bold mt-1">
                                            {formatPrice(service.priceFrom)}
                                        </p>
                                        <p className="text-xs text-white/40 mt-1">{service.unit}</p>
                                    </div>
                                </motion.article>
                            );
                        })}
                    </AnimatePresence>
                </div>

                {/* Bundles strip */}
                <div className="mt-10 p-8 bg-gradient-to-r from-[#b8956a]/10 to-transparent border-l-2 border-[#b8956a] rounded-r-xl">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#b8956a]">
                        Bundle &amp; Save
                    </p>
                    <p className="mt-3 text-white/80 leading-relaxed">
                        House + driveway from <span className="text-white font-semibold">$325</span>{' '}
                        &middot; Full exterior package (house + driveway + walkway + deck) from{' '}
                        <span className="text-white font-semibold">$700</span>
                    </p>
                    <Link
                        href="/contact"
                        className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold text-[#b8956a] hover:text-white transition-colors group"
                    >
                        Talk to us about a custom bundle
                        <ArrowRight
                            size={16}
                            className="transition-transform group-hover:translate-x-0.5"
                            aria-hidden="true"
                        />
                    </Link>
                </div>
            </div>
        </section>
    );
}

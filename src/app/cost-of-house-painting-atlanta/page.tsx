import type { Metadata } from 'next';
import Link from 'next/link';
import { breadcrumbSchema, faqSchema, jsonLd } from '@/lib/seo';

const BASE = 'https://bridgepointepainting.com';
const HERO = '/images/gallery/painting/52.jpg';

export const metadata: Metadata = {
    title: 'Cost of House Painting in Atlanta, GA — 2026 Interior & Exterior Pricing',
    description:
        'How much does it cost to paint a house in Atlanta? Itemized 2026 pricing for interior and exterior painting by square footage, story count, and prep scope. Real Bridgepointe pricing benchmarks across Metro Atlanta.',
    keywords: [
        'cost of house painting Atlanta', 'house painting cost Atlanta GA',
        'how much to paint a house Atlanta', 'cost to paint house exterior Atlanta',
        'cost to paint house interior Atlanta', 'painting cost per square foot Atlanta',
        'house painting price Atlanta', 'painting estimate Atlanta',
    ],
    openGraph: {
        title: 'Cost of House Painting in Atlanta — 2026 Pricing Guide',
        description: 'Itemized cost ranges for interior and exterior house painting across Metro Atlanta.',
        url: `${BASE}/cost-of-house-painting-atlanta`,
        images: [{ url: HERO, width: 1200, height: 630, alt: 'Cost of house painting Atlanta — pricing guide' }],
    },
    alternates: { canonical: `${BASE}/cost-of-house-painting-atlanta` },
};

const interiorRows = [
    { tier: 'Single room repaint (10x12)', range: '$450 – $1,100', notes: 'Walls + ceiling, standard prep' },
    { tier: 'Small home (1,500 sqft)', range: '$3,500 – $7,000', notes: 'Walls + ceilings + trim, single color' },
    { tier: 'Mid home (2,500–3,500 sqft)', range: '$6,000 – $14,000', notes: 'Walls, ceilings, trim, doors, casings' },
    { tier: 'Large home (4,000–6,000 sqft)', range: '$12,000 – $28,000', notes: 'Includes 2-story foyers, multiple colors' },
    { tier: 'Estate (6,000+ sqft)', range: '$20,000 – $45,000+', notes: 'Custom trim packages, feature walls, two-tone work' },
    { tier: 'Add cabinets (any size)', range: '+$1,800 – $7,500', notes: 'Conversion-varnish spray finish' },
    { tier: 'Add stair railing/balusters', range: '+$1,200 – $3,500', notes: 'Hand prep, spray, mask treads' },
];

const exteriorRows = [
    { tier: 'Small home (under 2,000 sqft)', range: '$3,500 – $8,000', notes: 'Single story, standard prep' },
    { tier: 'Mid home (2,000–3,500 sqft)', range: '$6,500 – $14,000', notes: 'Two story, body + trim two-tone' },
    { tier: 'Large home (3,500–5,500 sqft)', range: '$11,000 – $22,000', notes: 'Multiple stories, complex trim' },
    { tier: 'Estate (5,500+ sqft)', range: '$18,000 – $40,000+', notes: 'Stucco prep, dormers, multi-color schemes' },
    { tier: 'Wood rot repair (per board)', range: '$45 – $180', notes: 'Fascia, sill, corner board replacement' },
    { tier: 'Front door specialty finish', range: '$350 – $750', notes: 'High-gloss enamel or paint-grade lacquer' },
    { tier: 'Deck stain + seal', range: '$1,400 – $4,500', notes: 'Pressure wash, sand, two-coat seal' },
];

const drivers = [
    { title: 'Square Footage', body: 'The biggest single driver. Both interior and exterior pricing scale roughly linearly with finished square footage.' },
    { title: 'Ceiling Height', body: 'Two-story foyers, vaulted ceilings, and stairwells require scaffolding or lift rental. Adds 10–25% to interior bids.' },
    { title: 'Surface Condition', body: 'A fresh-from-builder home paints fast. A 1980s home with peeling exterior, water-damaged drywall, and 14 layers of trim takes 2–3x longer to prep.' },
    { title: 'Trim Complexity', body: 'Crown moulding, wainscoting, custom millwork, and dark trim packages cost more than flat-stock baseboard. We bid trim by linear foot, not lump sum.' },
    { title: 'Color Strategy', body: 'Single-color whole-home is fastest. Multi-color schemes, dark accent walls over light primer, and two-tone exteriors all add masking and cure cycles.' },
    { title: 'Wood Repair (Exterior)', body: 'Hidden rot in fascia, window sills, and corner boards is the #1 reason an exterior bid grows after walk-through. We always include a contingency line.' },
];

const faq = [
    {
        question: 'What\'s the average cost to paint a house in Atlanta in 2026?',
        answer:
            'For a typical 2,500–3,500 sqft single-family home in Metro Atlanta, expect $6,000–$14,000 for a full interior repaint and $6,500–$14,000 for a full exterior repaint. Combined whole-home interior + exterior projects run $14,000–$28,000 for that size range.',
    },
    {
        question: 'Why do painting estimates vary so much between contractors?',
        answer:
            'Because most estimates aren\'t apples-to-apples. A $4,000 bid and a $9,000 bid for the same house usually differ on three things: prep scope (skim coat vs. spot patch), paint quality (builder-grade latex vs. Benjamin Moore Aura), and number of finish coats. Always ask for itemized written estimates.',
    },
    {
        question: 'Should I get an estimate per square foot or per project?',
        answer:
            'Per project, every time. Per-square-foot pricing only works for new construction or ultra-simple repaints. Real homes have trim, ceilings, accent walls, and prep variables that don\'t scale linearly. Bridgepointe quotes the entire project itemized, not by sqft.',
    },
    {
        question: 'How much extra does it cost to paint trim and doors?',
        answer:
            'Trim, doors, and casings typically add 30–45% to a wall-only repaint. The reason: trim work is slower (cutting in, multiple coats, drying between sides of doors) but visually it\'s where most of the impact comes from. We almost always recommend including it.',
    },
    {
        question: 'Does Bridgepointe charge more in Buckhead, Alpharetta, or Sandy Springs?',
        answer:
            'No. Pricing is based on scope, not zip code. We don\'t mark up by neighborhood. The reason luxury repaints in those areas cost more is that the houses are larger and the trim work is more complex — not the address.',
    },
    {
        question: 'What\'s the cheapest way to get my house painted in Atlanta?',
        answer:
            'Honestly: pick the cheapest contractor and accept what you get. The cheapest bids almost always skip prep, use builder-grade paint, and apply one coat instead of two — the result lasts 2–3 years instead of 8–12. A "premium" repaint costs more upfront but is far cheaper amortized over its lifespan.',
    },
];

const crumbs = breadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Painting', url: '/painting' },
    { name: 'Cost of House Painting Atlanta', url: '/cost-of-house-painting-atlanta' },
]);

const fap = faqSchema(faq);

export default function CostOfHousePaintingAtlanta() {
    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(crumbs)} />
            <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(fap)} />

            {/* Hero */}
            <section className="relative min-h-[55vh] flex items-end pb-16 pt-36 overflow-hidden bg-[#0f0f0f]">
                <div className="absolute inset-0">
                    <img src={HERO} alt="Atlanta home exterior — house painting cost guide" className="h-full w-full object-cover opacity-35" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-[#0f0f0f]/85 to-[#0f0f0f]/40" />
                </div>
                <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
                    <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#b8956a] mb-4">2026 Pricing Guide · Atlanta, GA</p>
                    <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight max-w-4xl">
                        Cost of House Painting<br />
                        <span className="text-[#b8956a]">in Atlanta, Georgia</span>
                    </h1>
                    <p className="mt-6 max-w-2xl text-lg text-white/70 leading-relaxed">
                        Itemized interior and exterior pricing for Metro Atlanta — from a contractor who&apos;s painted 240+ homes, not from a directory site that scrapes averages.
                    </p>
                </div>
            </section>

            {/* TL;DR */}
            <section className="py-12 bg-[#111] border-t border-white/5">
                <div className="mx-auto max-w-4xl px-6 lg:px-8 text-center">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#b8956a] mb-4">The Short Answer</p>
                    <p className="font-serif text-2xl md:text-3xl text-white leading-relaxed">
                        A typical 2,500–3,500 sqft Atlanta home runs <span className="text-[#b8956a] font-bold">$6,000–$14,000</span> for interior, <span className="text-[#b8956a] font-bold">$6,500–$14,000</span> for exterior.
                    </p>
                </div>
            </section>

            {/* Interior Pricing */}
            <section className="py-16 bg-[#0f0f0f] border-t border-white/5">
                <div className="mx-auto max-w-5xl px-6 lg:px-8">
                    <h2 className="font-serif text-3xl font-bold text-white mb-3">Interior Painting Cost — Metro Atlanta</h2>
                    <p className="text-white/40 mb-8">Includes prep, paint, application, and protection. Based on Benjamin Moore Aura or equivalent.</p>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left py-4 px-4 text-xs font-bold uppercase tracking-wider text-[#b8956a]">Project Size</th>
                                    <th className="text-left py-4 px-4 text-xs font-bold uppercase tracking-wider text-[#b8956a]">Price Range</th>
                                    <th className="text-left py-4 px-4 text-xs font-bold uppercase tracking-wider text-[#b8956a] hidden md:table-cell">Notes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {interiorRows.map(r => (
                                    <tr key={r.tier} className="border-b border-white/5">
                                        <td className="py-4 px-4 text-white">{r.tier}</td>
                                        <td className="py-4 px-4 text-[#b8956a] font-semibold whitespace-nowrap">{r.range}</td>
                                        <td className="py-4 px-4 text-white/45 text-sm hidden md:table-cell">{r.notes}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* Exterior Pricing */}
            <section className="py-16 bg-[#111] border-t border-white/5">
                <div className="mx-auto max-w-5xl px-6 lg:px-8">
                    <h2 className="font-serif text-3xl font-bold text-white mb-3">Exterior Painting Cost — Metro Atlanta</h2>
                    <p className="text-white/40 mb-8">Includes pressure wash, scrape, prime, two coats, and standard caulking.</p>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left py-4 px-4 text-xs font-bold uppercase tracking-wider text-[#b8956a]">Project Size</th>
                                    <th className="text-left py-4 px-4 text-xs font-bold uppercase tracking-wider text-[#b8956a]">Price Range</th>
                                    <th className="text-left py-4 px-4 text-xs font-bold uppercase tracking-wider text-[#b8956a] hidden md:table-cell">Notes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {exteriorRows.map(r => (
                                    <tr key={r.tier} className="border-b border-white/5">
                                        <td className="py-4 px-4 text-white">{r.tier}</td>
                                        <td className="py-4 px-4 text-[#b8956a] font-semibold whitespace-nowrap">{r.range}</td>
                                        <td className="py-4 px-4 text-white/45 text-sm hidden md:table-cell">{r.notes}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* Cost Drivers */}
            <section className="py-20 bg-[#0f0f0f] border-t border-white/5">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <h2 className="font-serif text-3xl font-bold text-white mb-3">What Drives Painting Costs Up or Down</h2>
                    <p className="text-white/40 mb-12 max-w-2xl">Six variables move every house painting bid in Atlanta. Knowing them lets you read an estimate critically.</p>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {drivers.map(d => (
                            <div key={d.title} className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6">
                                <h3 className="font-serif text-base font-bold text-white mb-2">{d.title}</h3>
                                <p className="text-sm text-white/50 leading-relaxed">{d.body}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="py-20 bg-[#111] border-t border-white/5">
                <div className="mx-auto max-w-4xl px-6 lg:px-8">
                    <h2 className="font-serif text-3xl font-bold text-white mb-12">House Painting Cost FAQs — Atlanta</h2>
                    <div className="space-y-5">
                        {faq.map(q => (
                            <div key={q.question} className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-7">
                                <h3 className="font-semibold text-white mb-3">{q.question}</h3>
                                <p className="text-sm text-white/55 leading-relaxed">{q.answer}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-24 bg-[#0f0f0f] border-t border-white/5 text-center">
                <div className="mx-auto max-w-3xl px-6">
                    <h2 className="font-serif text-3xl font-bold text-white mb-4">Want a Real Number for Your House?</h2>
                    <p className="text-white/40 mb-10">Free on-site estimate. We measure every wall and exterior surface, then quote in writing — itemized.</p>
                    <div className="flex flex-wrap gap-4 justify-center">
                        <Link href="/contact" className="px-8 py-4 rounded-xl font-semibold text-sm uppercase tracking-wider" style={{ background: 'linear-gradient(135deg, #b8956a, #9a7a54)', color: 'white' }}>
                            Request Free Estimate
                        </Link>
                        <Link href="/painting" className="px-8 py-4 rounded-xl font-semibold text-sm uppercase tracking-wider border border-white/15 text-white hover:border-[#b8956a]/50 transition-colors">
                            Painting Services →
                        </Link>
                    </div>
                </div>
            </section>
        </>
    );
}

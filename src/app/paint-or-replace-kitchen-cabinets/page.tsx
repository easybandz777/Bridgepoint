import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { breadcrumbSchema, faqSchema, jsonLd } from '@/lib/seo';

const BASE = 'https://bridgepointepainting.com';
const HERO = '/images/gallery/painting/13.jpg';

export const metadata: Metadata = {
    title: 'Paint or Replace Kitchen Cabinets? Atlanta 2026 Decision Guide',
    description:
        'Should you paint or replace your kitchen cabinets in Atlanta? Side-by-side cost, timeline, longevity, and resale comparison for 2026 — when painting wins, when replacement wins, when refacing makes sense.',
    keywords: [
        'paint or replace kitchen cabinets Atlanta', 'should I paint or replace cabinets',
        'cabinet painting vs replacement Atlanta', 'cabinet refacing vs painting Atlanta',
        'is it cheaper to paint cabinets', 'when to replace kitchen cabinets',
    ],
    openGraph: {
        title: 'Paint or Replace Kitchen Cabinets? Atlanta Decision Guide',
        description: 'Cost, timeline, longevity, and resale — paint vs. reface vs. replace, head to head.',
        url: `${BASE}/paint-or-replace-kitchen-cabinets`,
        images: [{ url: HERO, width: 1200, height: 630, alt: 'Paint or replace kitchen cabinets — Atlanta decision guide' }],
    },
    alternates: { canonical: `${BASE}/paint-or-replace-kitchen-cabinets` },
};

const comparison = [
    { dimension: 'Typical cost', paint: '$1,800 – $4,500', reface: '$5,000 – $12,000', replace: '$15,000 – $45,000+' },
    { dimension: 'Project length', paint: '4 – 7 days', reface: '2 – 4 weeks', replace: '6 – 12 weeks' },
    { dimension: 'Kitchen unusable', paint: '0 – 2 days', reface: '1 – 2 weeks', replace: '4 – 10 weeks' },
    { dimension: 'Finish lifespan', paint: '8 – 12 years', reface: '10 – 15 years', replace: '20 – 30 years' },
    { dimension: 'Layout changes', paint: 'No', reface: 'No', replace: 'Yes' },
    { dimension: 'Box quality matters', paint: 'Boxes must be solid', reface: 'Boxes must be solid', replace: 'N/A — new boxes' },
    { dimension: 'Resale impact', paint: 'Refresh, neutral ROI', reface: 'Modern look, modest ROI', replace: 'Major upgrade, strong ROI' },
];

const paintWins = [
    'Boxes are solid wood or quality plywood, just dated finish',
    'Layout works for the household — nothing structural to change',
    'Budget is under $10K and timeline is under 2 weeks',
    'Selling within 1–3 years and just need it to show well',
    'Hardware can be upgraded for big visual punch at low cost',
];

const replaceWins = [
    'Boxes are particleboard with water damage or sagging shelves',
    'You want to change the layout — island, walls, appliance positions',
    'Cabinet style is fundamentally wrong (wrong height, no soft-close, no pull-outs)',
    'You\'re also replacing countertops, floor, and appliances anyway',
    'This is your forever home and you\'re going to love it for 20+ years',
];

const faq = [
    {
        question: 'Is painting cabinets really 70% cheaper than replacing them?',
        answer:
            'In most Atlanta kitchens, yes. A standard 10x10 kitchen runs $1,800–$4,500 to paint vs. $15,000–$45,000+ to replace with custom cabinetry. The catch: painting only works if the existing boxes are structurally sound. Particleboard with water damage isn\'t worth painting.',
    },
    {
        question: 'How do I know if my cabinet boxes are worth painting?',
        answer:
            'Open every door and pull every drawer. Check for: sagging shelves (bad), water rings on the bottom of sink-base interiors (worse), particleboard swelling at the toe-kick (bad), and whether the doors close flush. Solid wood boxes with intact frames almost always paint beautifully. Particleboard with damage almost never does.',
    },
    {
        question: 'Will painted cabinets look as good as new cabinets?',
        answer:
            'When sprayed with conversion varnish in a controlled environment, painted cabinets are visually indistinguishable from new factory cabinets. The difference is on the inside: you still have the old boxes, old shelves, and original layout. The exterior finish is genuinely new.',
    },
    {
        question: 'What about cabinet refacing — is that a middle option?',
        answer:
            'Refacing keeps your boxes and replaces all door fronts and drawer fronts with new ones, then veneer-wraps the exposed boxes. Cost is $5,000–$12,000 — between painting and replacement. Best fit: boxes are good but you specifically want a new door style (slab vs. raised panel, for instance). For most Atlanta kitchens, painting delivers similar visual outcomes at half the cost.',
    },
    {
        question: 'Will Bridgepointe tell me honestly if my cabinets aren\'t worth painting?',
        answer:
            'Yes. We have walked away from cabinet painting jobs and recommended replacement when the boxes were too far gone to save. Painting bad boxes just hides the problem temporarily. We\'d rather lose a job than hand you a finish that fails in 18 months.',
    },
];

const crumbs = breadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Cabinet Painting Atlanta', url: '/cabinet-painting-atlanta' },
    { name: 'Paint or Replace Cabinets', url: '/paint-or-replace-kitchen-cabinets' },
]);

const fap = faqSchema(faq);

export default function PaintOrReplaceKitchenCabinets() {
    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(crumbs)} />
            <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(fap)} />

            {/* Hero */}
            <section className="relative min-h-[55vh] flex items-end pb-16 pt-36 overflow-hidden bg-[#0f0f0f]">
                <div className="absolute inset-0">
                    <Image src={HERO} alt="Atlanta kitchen wet-bar cabinetry — paint vs replace decision guide" fill priority sizes="100vw" className="object-cover opacity-35" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-[#0f0f0f]/85 to-[#0f0f0f]/40" />
                </div>
                <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
                    <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#b8956a] mb-4">Decision Guide · Atlanta, GA · 2026</p>
                    <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight max-w-4xl">
                        Paint or Replace<br />
                        <span className="text-[#b8956a]">Kitchen Cabinets?</span>
                    </h1>
                    <p className="mt-6 max-w-2xl text-lg text-white/70 leading-relaxed">
                        The honest comparison. When painting wins, when replacement wins, when refacing is the right middle ground — written by a contractor who does both.
                    </p>
                </div>
            </section>

            {/* Comparison Table */}
            <section className="py-20 bg-[#111] border-t border-white/5">
                <div className="mx-auto max-w-6xl px-6 lg:px-8">
                    <h2 className="font-serif text-3xl font-bold text-white mb-3">Paint vs. Reface vs. Replace — Head to Head</h2>
                    <p className="text-white/40 mb-10">Atlanta market, 2026. Standard 10x10 kitchen baseline.</p>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left py-4 px-4 text-xs font-bold uppercase tracking-wider text-white/60"></th>
                                    <th className="text-left py-4 px-4 text-xs font-bold uppercase tracking-wider text-[#34d399]">Paint</th>
                                    <th className="text-left py-4 px-4 text-xs font-bold uppercase tracking-wider text-[#b8956a]">Reface</th>
                                    <th className="text-left py-4 px-4 text-xs font-bold uppercase tracking-wider text-[#f87171]">Replace</th>
                                </tr>
                            </thead>
                            <tbody>
                                {comparison.map(r => (
                                    <tr key={r.dimension} className="border-b border-white/5">
                                        <td className="py-4 px-4 text-white/60 text-sm">{r.dimension}</td>
                                        <td className="py-4 px-4 text-white text-sm">{r.paint}</td>
                                        <td className="py-4 px-4 text-white text-sm">{r.reface}</td>
                                        <td className="py-4 px-4 text-white text-sm">{r.replace}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* When Each Wins */}
            <section className="py-20 bg-[#0f0f0f] border-t border-white/5">
                <div className="mx-auto max-w-6xl px-6 lg:px-8">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-[#1a1a1a] border border-[#34d399]/20 rounded-2xl p-8">
                            <p className="text-xs font-bold uppercase tracking-wider text-[#34d399] mb-3">Painting Wins When…</p>
                            <ul className="space-y-3 mt-4">
                                {paintWins.map(item => (
                                    <li key={item} className="flex items-start gap-3 text-sm text-white/70 leading-relaxed">
                                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#34d399]" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="bg-[#1a1a1a] border border-[#f87171]/20 rounded-2xl p-8">
                            <p className="text-xs font-bold uppercase tracking-wider text-[#f87171] mb-3">Replacement Wins When…</p>
                            <ul className="space-y-3 mt-4">
                                {replaceWins.map(item => (
                                    <li key={item} className="flex items-start gap-3 text-sm text-white/70 leading-relaxed">
                                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#f87171]" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="py-20 bg-[#111] border-t border-white/5">
                <div className="mx-auto max-w-4xl px-6 lg:px-8">
                    <h2 className="font-serif text-3xl font-bold text-white mb-12">Common Questions</h2>
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
                    <h2 className="font-serif text-3xl font-bold text-white mb-4">Not Sure Which Is Right?</h2>
                    <p className="text-white/40 mb-10">Free on-site assessment. We&apos;ll evaluate your boxes honestly and tell you what the right path forward is — even if that means we don&apos;t get the job.</p>
                    <div className="flex flex-wrap gap-4 justify-center">
                        <Link href="/contact" className="px-8 py-4 rounded-xl font-semibold text-sm uppercase tracking-wider" style={{ background: 'linear-gradient(135deg, #b8956a, #9a7a54)', color: 'white' }}>
                            Request Honest Assessment
                        </Link>
                        <Link href="/cost-of-cabinet-painting-atlanta" className="px-8 py-4 rounded-xl font-semibold text-sm uppercase tracking-wider border border-white/15 text-white hover:border-[#b8956a]/50 transition-colors">
                            See Painting Costs →
                        </Link>
                    </div>
                </div>
            </section>
        </>
    );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { breadcrumbSchema, faqSchema, jsonLd } from '@/lib/seo';

const BASE = 'https://bridgepointepainting.com';
const HERO = '/images/gallery/painting/29.jpg';

export const metadata: Metadata = {
    title: 'Cost of Cabinet Painting in Atlanta, GA — 2026 Pricing Guide',
    description:
        'How much does cabinet painting cost in Atlanta? Itemized 2026 pricing for kitchen and bathroom cabinet refinishing — by door count, paint type, and prep scope. Local Bridgepointe pricing benchmarks.',
    keywords: [
        'cost of cabinet painting Atlanta', 'cabinet painting cost Atlanta GA',
        'kitchen cabinet painting price Atlanta', 'how much to paint kitchen cabinets Atlanta',
        'cabinet refinishing cost Atlanta', 'cost to paint cabinets Atlanta GA',
        'cabinet spray painting cost Atlanta', 'price to refinish cabinets Atlanta',
    ],
    openGraph: {
        title: 'Cost of Cabinet Painting in Atlanta — 2026 Pricing Guide',
        description: 'Real, itemized cost ranges for cabinet painting and refinishing in Metro Atlanta.',
        url: `${BASE}/cost-of-cabinet-painting-atlanta`,
        images: [{ url: HERO, width: 1200, height: 630, alt: 'Cost of cabinet painting Atlanta — pricing guide' }],
    },
    alternates: { canonical: `${BASE}/cost-of-cabinet-painting-atlanta` },
};

const faq = [
    {
        question: 'How much does it cost to paint kitchen cabinets in Atlanta?',
        answer:
            'In Metro Atlanta, professional cabinet painting typically runs $1,800–$4,500 for a standard 10x10 kitchen (about 30–35 doors and drawers). Larger kitchens, two-tone finishes, and full conversion-varnish spray jobs can push toward $5,500–$8,000. Pricing is driven by door count, prep scope, and paint system — not square footage.',
    },
    {
        question: 'What\'s included in a Bridgepointe cabinet painting estimate?',
        answer:
            'Door + drawer removal and labeling, full degrease, sanding, fill and skim of grain or dings, spray-applied primer, two finish coats of conversion varnish or catalyzed enamel, and reinstallation. New hardware is optional (pulls + hinges, $8–$25 per piece). Estimates are itemized so you can see exactly what each line costs.',
    },
    {
        question: 'Is cabinet painting cheaper than replacement?',
        answer:
            'Significantly. New custom cabinetry in Atlanta runs $15,000–$45,000+ installed for a typical kitchen. Painting the existing boxes to a factory-grade finish is usually 70–85% less and takes 4–7 days versus 4–10 weeks for replacement.',
    },
    {
        question: 'Why is spray painting more expensive than brush-and-roll?',
        answer:
            'Spray application requires removing every door and drawer, transporting them off-site, building a controlled spray booth environment, masking the entire kitchen, and waiting full cure cycles between coats. The result is a finish indistinguishable from new factory cabinetry. Brush-and-roll cabinet painting is cheaper but always shows brush marks under raking light.',
    },
    {
        question: 'Are there Atlanta neighborhoods where cabinet painting costs more?',
        answer:
            'Pricing is consistent across Buckhead, Alpharetta, Sandy Springs, Roswell, Marietta, Milton, Suwanee, and the rest of Metro Atlanta — Bridgepointe doesn\'t adjust by zip code. Cost differences come from cabinet count and complexity, not neighborhood.',
    },
];

const pricingRows = [
    { tier: 'Small kitchen (15–20 doors)', range: '$1,500 – $2,800', notes: 'Single color, standard prep, conversion-varnish finish' },
    { tier: 'Standard 10x10 kitchen (25–35 doors)', range: '$1,800 – $4,500', notes: 'Single color, full prep, two-coat spray finish' },
    { tier: 'Large kitchen (40–55 doors)', range: '$3,500 – $6,500', notes: 'Includes large island and pantry doors' },
    { tier: 'Two-tone perimeter + island', range: '$4,500 – $7,500', notes: 'Two paint systems, two cure cycles, more masking' },
    { tier: 'Full kitchen + butler\'s pantry', range: '$5,500 – $9,500', notes: 'Heavy door count, glaze options, hardware swap' },
    { tier: 'Bathroom vanity (single)', range: '$650 – $1,400', notes: 'Standalone or as add-on to kitchen project' },
    { tier: 'Hardware swap (per piece)', range: '$8 – $25', notes: 'Pulls, knobs, soft-close hinges' },
];

const drivers = [
    { title: 'Door + Drawer Count', body: 'Each face that gets sprayed adds labor. A pantry alone can add 8–12 doors that drive up the bid.' },
    { title: 'Paint System', body: 'Latex enamel runs less. Conversion varnish costs more but lasts 8–12 years and resists chips and yellowing.' },
    { title: 'Prep Scope', body: 'Oak grain fill, dings, water damage repair, and old varnish all add prep hours before any color goes on.' },
    { title: 'Spray vs. Brush', body: 'Spray is the only way to get a true factory finish. Adds masking, transport, and cure time — and cost.' },
    { title: 'Two-Tone or Glazed', body: 'A perimeter color + island color requires two complete spray cycles, doubling some line items.' },
    { title: 'Hardware', body: 'Reusing existing hardware is free. New pulls, knobs, and soft-close hinges add per-piece cost.' },
];

const crumbs = breadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Cabinet Painting Atlanta', url: '/cabinet-painting-atlanta' },
    { name: 'Cost of Cabinet Painting Atlanta', url: '/cost-of-cabinet-painting-atlanta' },
]);

const fap = faqSchema(faq);

export default function CostOfCabinetPaintingAtlanta() {
    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(crumbs)} />
            <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(fap)} />

            {/* Hero */}
            <section className="relative min-h-[55vh] flex items-end pb-16 pt-36 overflow-hidden bg-[#0f0f0f]">
                <div className="absolute inset-0">
                    <img src={HERO} alt="Two-tone painted shaker cabinets Atlanta — cost guide" className="h-full w-full object-cover opacity-35" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-[#0f0f0f]/85 to-[#0f0f0f]/40" />
                </div>
                <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
                    <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#b8956a] mb-4">2026 Pricing Guide · Atlanta, GA</p>
                    <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight max-w-4xl">
                        Cost of Cabinet Painting<br />
                        <span className="text-[#b8956a]">in Atlanta, Georgia</span>
                    </h1>
                    <p className="mt-6 max-w-2xl text-lg text-white/70 leading-relaxed">
                        Real itemized pricing for kitchen and bathroom cabinet painting across Metro Atlanta — from a contractor that actually does the work, not a directory site.
                    </p>
                </div>
            </section>

            {/* TL;DR */}
            <section className="py-12 bg-[#111] border-t border-white/5">
                <div className="mx-auto max-w-4xl px-6 lg:px-8 text-center">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#b8956a] mb-4">The Short Answer</p>
                    <p className="font-serif text-2xl md:text-3xl text-white leading-relaxed">
                        A standard kitchen in Metro Atlanta runs <span className="text-[#b8956a] font-bold">$1,800–$4,500</span> to professionally paint, including prep, spray finish, and reinstall.
                    </p>
                </div>
            </section>

            {/* Pricing Table */}
            <section className="py-20 bg-[#0f0f0f] border-t border-white/5">
                <div className="mx-auto max-w-5xl px-6 lg:px-8">
                    <h2 className="font-serif text-3xl font-bold text-white mb-3">2026 Pricing by Project Size</h2>
                    <p className="text-white/40 mb-10">Metro Atlanta. Prices include prep, paint, application, and reinstall — hardware separate.</p>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left py-4 px-4 text-xs font-bold uppercase tracking-wider text-[#b8956a]">Project</th>
                                    <th className="text-left py-4 px-4 text-xs font-bold uppercase tracking-wider text-[#b8956a]">Price Range</th>
                                    <th className="text-left py-4 px-4 text-xs font-bold uppercase tracking-wider text-[#b8956a] hidden md:table-cell">Notes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pricingRows.map(r => (
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
            <section className="py-20 bg-[#111] border-t border-white/5">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <h2 className="font-serif text-3xl font-bold text-white mb-3">What Drives the Price Up or Down</h2>
                    <p className="text-white/40 mb-12 max-w-2xl">Six variables move every cabinet painting bid in Atlanta. Knowing them lets you read an estimate critically.</p>
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
            <section className="py-20 bg-[#0f0f0f] border-t border-white/5">
                <div className="mx-auto max-w-4xl px-6 lg:px-8">
                    <h2 className="font-serif text-3xl font-bold text-white mb-12">Cabinet Painting Cost FAQs — Atlanta</h2>
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
            <section className="py-24 bg-[#111] border-t border-white/5 text-center">
                <div className="mx-auto max-w-3xl px-6">
                    <h2 className="font-serif text-3xl font-bold text-white mb-4">Want a Real Number for Your Kitchen?</h2>
                    <p className="text-white/40 mb-10">Free on-site estimate. We count every door, photograph every surface, and quote in writing — no high-pressure tactics.</p>
                    <div className="flex flex-wrap gap-4 justify-center">
                        <Link href="/contact" className="px-8 py-4 rounded-xl font-semibold text-sm uppercase tracking-wider" style={{ background: 'linear-gradient(135deg, #b8956a, #9a7a54)', color: 'white' }}>
                            Request Free Estimate
                        </Link>
                        <Link href="/cabinet-painting-atlanta" className="px-8 py-4 rounded-xl font-semibold text-sm uppercase tracking-wider border border-white/15 text-white hover:border-[#b8956a]/50 transition-colors">
                            Cabinet Process →
                        </Link>
                    </div>
                </div>
            </section>
        </>
    );
}

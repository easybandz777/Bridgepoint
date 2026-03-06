import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Exterior Painting Atlanta, GA | Best Exterior Painters | Bridgepointe',
    description: 'Top-rated exterior painting contractor in Atlanta, GA. Pressure washing, scraping, caulking, priming & premium two-coat finish. Serving Buckhead, Alpharetta, Roswell, Marietta & Metro Atlanta. Free estimates. 18+ years experience.',
    keywords: [
        'exterior painting Atlanta', 'exterior painters Atlanta GA', 'exterior house painting Atlanta',
        'exterior painting company Atlanta', 'exterior painting Alpharetta', 'exterior painting Roswell',
        'exterior painting Buckhead', 'exterior painting Marietta', 'exterior painting Sandy Springs',
        'house painters exterior Atlanta GA', 'professional exterior painting Atlanta', 'luxury exterior painting Atlanta',
        'best exterior painting contractor Atlanta', 'residential exterior painting Atlanta GA',
    ],
    openGraph: {
        title: 'Exterior Painting Atlanta, GA | Bridgepointe',
        description: 'Premium exterior painting across Metro Atlanta. Pressure wash, full prep, two-coat finish. Free estimates.',
        url: 'https://bridgepointepainting.com/exterior-painting-atlanta',
    },
    alternates: { canonical: 'https://bridgepointepainting.com/exterior-painting-atlanta' },
};

const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Exterior Painting',
    provider: { '@type': 'LocalBusiness', name: 'Bridgepointe', url: 'https://bridgepointepainting.com' },
    areaServed: { '@type': 'State', name: 'Metro Atlanta, Georgia' },
    description: 'Full-scope exterior painting with pressure washing, wood repair, caulking, priming, and two coats of premium exterior finish for lasting protection and curb appeal.',
    serviceType: 'Exterior Painting Contractor',
};

const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
        { '@type': 'Question', name: 'How much does exterior painting cost in Atlanta?', acceptedAnswer: { '@type': 'Answer', text: 'Exterior painting for a typical Atlanta home ranges from $3,500–$8,000 for smaller homes (under 2,000 sq ft) to $10,000–$25,000+ for larger luxury homes. Pricing depends on size, story count, substrate condition, and trim complexity. Bridgepointe provides free, itemized estimates.' } },
        { '@type': 'Question', name: 'How long does exterior painting last in Atlanta?', acceptedAnswer: { '@type': 'Answer', text: 'With proper surface preparation and a premium exterior paint like Benjamin Moore Aura Exterior, a professional exterior paint job in Metro Atlanta typically lasts 8–15 years. Proper caulking and wood repairs are critical to longevity in Georgia\'s climate.' } },
        { '@type': 'Question', name: 'What time of year is best for exterior painting in Atlanta?', acceptedAnswer: { '@type': 'Answer', text: 'The best seasons for exterior painting in Atlanta are spring (March–May) and fall (September–November), when temperatures stay between 50°F and 85°F. Bridgepointe schedules paint application only when rain is not forecast within 24 hours of any coat.' } },
        { '@type': 'Question', name: 'Does Bridgepointe repair wood rot before painting?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. Bridgepointe repairs all damaged wood (fascia boards, window sills, corner boards, siding) with epoxy filler or full board replacement before any primer or paint is applied. Painting over rot only hides the problem — we fix it.' } },
    ],
};

const steps = [
    { num: '01', title: 'Pressure Wash', body: 'Full perimeter pressure wash at 3,500 PSI to remove dirt, mildew, chalk, and loose paint.' },
    { num: '02', title: 'Scrape & Repair', body: 'All loose and peeling paint scraped. Wood rot repaired with epoxy or full board replacement.' },
    { num: '03', title: 'Caulk & Seal', body: 'Every seam, penetration, window, and door perimeter caulked with premium siliconized caulk.' },
    { num: '04', title: 'Prime', body: 'All bare wood, stain-bleed zones, and repaired areas primed. Full prime coat on color changes.' },
    { num: '05', title: 'Two-Coat Finish', body: 'Two coats of Benjamin Moore Aura Exterior brushed, rolled, and back-rolled for even coverage.' },
    { num: '06', title: 'Final Walkthrough', body: 'Full client walkthrough before we leave the job site. Touch-ups addressed immediately.' },
];

export default function ExteriorPaintingAtlanta() {
    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

            {/* Hero */}
            <section className="relative min-h-[60vh] flex items-end pb-20 pt-36 overflow-hidden bg-[#0f0f0f]">
                <div className="absolute inset-0 bg-gradient-to-br from-[#60a5fa]/8 via-transparent to-transparent" />
                <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
                    <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#60a5fa] mb-4">Exterior Painting · Metro Atlanta, GA</p>
                    <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight max-w-4xl">
                        Exterior Painting<br />
                        <span className="text-[#b8956a]">Atlanta, GA</span>
                    </h1>
                    <p className="mt-6 max-w-2xl text-lg text-white/60 leading-relaxed">
                        Superior surface preparation is everything. Bridgepointe&apos;s exterior painting process starts with pressure washing, wood repair, and full caulking — before a single brush stroke goes on your home.
                    </p>
                    <div className="mt-10 flex flex-wrap gap-4">
                        <Link href="/select-services" className="px-8 py-4 rounded-xl font-semibold text-sm uppercase tracking-wider" style={{ background: 'linear-gradient(135deg, #b8956a, #9a7a54)', color: 'white' }}>
                            Get Free Estimate
                        </Link>
                        <Link href="/portfolio" className="px-8 py-4 rounded-xl font-semibold text-sm uppercase tracking-wider border border-white/15 text-white hover:border-[#b8956a]/50 transition-colors">
                            View Portfolio
                        </Link>
                    </div>
                </div>
            </section>

            {/* Process */}
            <section className="py-24 bg-[#111] border-t border-white/5">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <h2 className="font-serif text-4xl font-bold text-white text-center mb-4">Our 6-Step Exterior Painting Process</h2>
                    <p className="text-white/40 text-center max-w-2xl mx-auto mb-16">Most painting companies skip steps. We never do. Here&apos;s exactly what happens on every exterior project.</p>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {steps.map(s => (
                            <div key={s.num} className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-7">
                                <span className="text-4xl font-bold text-[#b8956a]/20 font-serif">{s.num}</span>
                                <h3 className="font-serif text-lg font-bold text-white mt-2 mb-2">{s.title}</h3>
                                <p className="text-sm text-white/50 leading-relaxed">{s.body}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Cities */}
            <section className="py-24 bg-[#0f0f0f] border-t border-white/5">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <h2 className="font-serif text-3xl font-bold text-white mb-3">Exterior Painting Service Areas in Metro Atlanta</h2>
                    <p className="text-white/40 mb-10">We serve the entire Metro Atlanta area with our own crews — no day labor, no subcontracted strangers.</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {['Buckhead', 'Alpharetta', 'Roswell', 'Marietta', 'Sandy Springs', 'Milton', 'Kennesaw', 'Suwanee', 'Cobb County', 'East Cobb', 'Dunwoody', 'Peachtree City'].map(c => (
                            <div key={c} className="flex items-center gap-2 text-sm text-white/60">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#b8956a] shrink-0" />
                                {c}, GA
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="py-24 bg-[#111] border-t border-white/5">
                <div className="mx-auto max-w-4xl px-6 lg:px-8">
                    <h2 className="font-serif text-3xl font-bold text-white mb-12">Exterior Painting FAQs — Atlanta, GA</h2>
                    <div className="space-y-6">
                        {faqSchema.mainEntity.map(q => (
                            <div key={q.name} className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-7">
                                <h3 className="font-semibold text-white mb-3">{q.name}</h3>
                                <p className="text-sm text-white/55 leading-relaxed">{q.acceptedAnswer.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-24 bg-[#0f0f0f] border-t border-white/5 text-center">
                <div className="mx-auto max-w-3xl px-6">
                    <h2 className="font-serif text-4xl font-bold text-white mb-4">Get Your Exterior Transformed</h2>
                    <p className="text-white/40 mb-10">Free on-site consultation. Written itemized estimate within 48 hours. No pressure.</p>
                    <Link href="/select-services" className="inline-flex px-10 py-4 rounded-xl font-semibold text-sm uppercase tracking-wider" style={{ background: 'linear-gradient(135deg, #b8956a, #9a7a54)', color: 'white' }}>
                        Schedule Free Consultation
                    </Link>
                </div>
            </section>
        </>
    );
}

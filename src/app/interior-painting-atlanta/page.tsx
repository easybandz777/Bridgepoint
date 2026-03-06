import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Interior Painting Atlanta, GA | Premium Interior Painters | Bridgepointe',
    description: 'Atlanta\'s premier interior painting contractor. We cover walls, ceilings, trim, doors, and cabinetry with meticulous preparation and premium Benjamin Moore paints. Serving Buckhead, Alpharetta, Roswell, Sandy Springs & all Metro Atlanta. Free estimates.',
    keywords: [
        'interior painting Atlanta', 'interior painters Atlanta GA', 'interior painting company Atlanta',
        'house interior painting Atlanta', 'interior painting Buckhead', 'interior painting Alpharetta',
        'interior painting Roswell GA', 'interior painting Sandy Springs', 'interior painting Marietta',
        'premium interior painting Atlanta', 'luxury interior painting Atlanta', 'professional interior painters Atlanta',
        'interior painting contractor Atlanta', 'residential interior painting Atlanta GA',
    ],
    openGraph: {
        title: 'Interior Painting Atlanta, GA | Bridgepointe',
        description: 'Premium interior painting across Metro Atlanta. Walls, ceilings, trim, cabinetry. Benjamin Moore certified. Free estimates.',
        url: 'https://bridgepointepainting.com/interior-painting-atlanta',
    },
    alternates: { canonical: 'https://bridgepointepainting.com/interior-painting-atlanta' },
};

const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Interior Painting',
    provider: { '@type': 'LocalBusiness', name: 'Bridgepointe', url: 'https://bridgepointepainting.com' },
    areaServed: { '@type': 'State', name: 'Metro Atlanta, Georgia' },
    description: 'High-end interior painting for luxury homes — walls, ceilings, trim, doors, and cabinetry — with meticulous surface preparation and premium zero-VOC paints.',
    serviceType: 'Interior Painting Contractor',
    offers: { '@type': 'Offer', areaServed: 'Metro Atlanta, GA', priceCurrency: 'USD' },
};

const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
        { '@type': 'Question', name: 'How much does interior painting cost in Atlanta?', acceptedAnswer: { '@type': 'Answer', text: 'Interior painting in Atlanta typically costs $2.50–$4.50 per square foot for standard finishes, and $4.50–$8 per square foot for premium finishes with full surface prep, skim coat, and specialty application. Bridgepointe provides free itemized estimates.' } },
        { '@type': 'Question', name: 'How long does interior painting take?', acceptedAnswer: { '@type': 'Answer', text: 'A standard 3,000 sq ft interior repaint typically takes 5–10 business days, depending on the number of rooms, ceiling heights, and surface condition. Full-home projects including cabinetry and trim may take 2–3 weeks.' } },
        { '@type': 'Question', name: 'Do I need to move furniture before interior painting?', acceptedAnswer: { '@type': 'Answer', text: 'Bridgepointe will move and protect large furniture as a courtesy. We ask that you remove personal items, fragile decor, and wall hangings from work areas prior to our start date.' } },
        { '@type': 'Question', name: 'What paint does Bridgepointe use for interior painting in Atlanta?', acceptedAnswer: { '@type': 'Answer', text: 'We use Benjamin Moore Aura (zero-VOC, best-in-class coverage and durability) as our standard interior paint. Sherwin-Williams Emerald and other premium lines are also available based on client preference.' } },
    ],
};

const highlights = [
    { icon: '🎨', title: 'Full Surface Preparation', body: 'Every crack, nail pop, and blemish is patched, sanded, and primed before a single drop of finish coat goes on.' },
    { icon: '🖌️', title: 'Walls, Ceilings & Trim', body: 'Walls, ceilings, crown, baseboard, casings, and doors all expertly cut and rolled for a seamless result.' },
    { icon: '🏡', title: 'Cabinetry & Millwork', body: 'Spray-applied enamel finish on kitchen and bath cabinetry, built-ins, and decorative millwork.' },
    { icon: '✨', title: 'Zero-VOC Premium Paint', body: 'Benjamin Moore Aura — best-in-class hide, extreme durability, and virtually no odor after application.' },
    { icon: '🛡️', title: '2-Year Labor Warranty', body: 'Every interior painting project comes with a full two-year warranty on all labor performed.' },
    { icon: '📋', title: 'Free Detailed Estimate', body: 'On-site consultation and itemized written estimate — no surprises, no hidden costs.' },
];

export default function InteriorPaintingAtlanta() {
    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

            {/* Hero */}
            <section className="relative min-h-[60vh] flex items-end pb-20 pt-36 overflow-hidden bg-[#0f0f0f]">
                <div className="absolute inset-0 bg-gradient-to-br from-[#b8956a]/10 via-transparent to-transparent" />
                <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
                    <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#b8956a] mb-4">Interior Painting · Metro Atlanta, GA</p>
                    <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight max-w-4xl">
                        Interior Painting<br />
                        <span className="text-[#b8956a]">Atlanta, GA</span>
                    </h1>
                    <p className="mt-6 max-w-2xl text-lg text-white/60 leading-relaxed">
                        From walls and ceilings to trim, doors, and cabinetry — Bridgepointe delivers flawless interior finishes for luxury homes across Buckhead, Alpharetta, Roswell, Marietta, and all Metro Atlanta.
                    </p>
                    <div className="mt-10 flex flex-wrap gap-4">
                        <Link href="/select-services"
                            className="px-8 py-4 rounded-xl font-semibold text-sm uppercase tracking-wider"
                            style={{ background: 'linear-gradient(135deg, #b8956a, #9a7a54)', color: 'white' }}>
                            Get a Free Estimate
                        </Link>
                        <Link href="/portfolio"
                            className="px-8 py-4 rounded-xl font-semibold text-sm uppercase tracking-wider border border-white/15 text-white hover:border-[#b8956a]/50 transition-colors">
                            View Our Work
                        </Link>
                    </div>
                </div>
            </section>

            {/* Highlights */}
            <section className="py-24 bg-[#111] border-t border-white/5">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <h2 className="font-serif text-4xl font-bold text-white text-center mb-4">Professional Interior Painting in Atlanta</h2>
                    <p className="text-white/40 text-center max-w-2xl mx-auto mb-16 leading-relaxed">
                        We serve Metro Atlanta&apos;s most discerning homeowners. Every project starts with thorough preparation — the foundation of any lasting finish.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {highlights.map(h => (
                            <div key={h.title} className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-7 hover:border-[#b8956a]/25 transition-colors">
                                <span className="text-2xl mb-4 block">{h.icon}</span>
                                <h3 className="font-serif text-lg font-bold text-white mb-2">{h.title}</h3>
                                <p className="text-sm text-white/50 leading-relaxed">{h.body}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Service Areas */}
            <section className="py-24 bg-[#0f0f0f] border-t border-white/5">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <h2 className="font-serif text-3xl font-bold text-white mb-3">Interior Painting Service Areas</h2>
                    <p className="text-white/40 mb-10">We send our own crews — never subcontracted labor — to every city we serve.</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {['Buckhead', 'Alpharetta', 'Roswell', 'Marietta', 'Sandy Springs', 'Milton', 'Kennesaw', 'Suwanee', 'Cobb County', 'East Cobb', 'Peachtree City', 'Dunwoody'].map(city => (
                            <div key={city} className="flex items-center gap-2 text-sm text-white/60">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#b8956a] shrink-0" />
                                {city}, GA
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="py-24 bg-[#111] border-t border-white/5">
                <div className="mx-auto max-w-4xl px-6 lg:px-8">
                    <h2 className="font-serif text-3xl font-bold text-white mb-12">Frequently Asked Questions — Interior Painting Atlanta</h2>
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
                    <h2 className="font-serif text-4xl font-bold text-white mb-4">Ready for a Flawless Interior?</h2>
                    <p className="text-white/40 mb-10">Schedule a complimentary on-site consultation. We&apos;ll walk your home, discuss your vision, and deliver a detailed estimate within 48 hours.</p>
                    <Link href="/select-services"
                        className="inline-flex px-10 py-4 rounded-xl font-semibold text-sm uppercase tracking-wider"
                        style={{ background: 'linear-gradient(135deg, #b8956a, #9a7a54)', color: 'white' }}>
                        Schedule Free Consultation
                    </Link>
                </div>
            </section>
        </>
    );
}

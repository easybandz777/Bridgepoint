import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Cabinet Painting Atlanta, GA | Kitchen Cabinet Refinishing | Bridgepointe',
    description: 'Professional cabinet painting and refinishing in Atlanta, GA. Spray-applied enamel finish for kitchen and bathroom cabinets — factory-quality result at a fraction of replacement cost. Serving all Metro Atlanta. Free estimates.',
    keywords: [
        'cabinet painting Atlanta', 'kitchen cabinet painting Atlanta GA', 'cabinet refinishing Atlanta',
        'kitchen cabinet refinishing Atlanta', 'painting cabinets Atlanta', 'cabinet painters Atlanta',
        'bathroom cabinet painting Atlanta', 'cabinet painting Alpharetta', 'cabinet painting Buckhead',
        'cabinet painting Roswell', 'spray painting cabinets Atlanta', 'kitchen cabinet makeover Atlanta',
        'affordable cabinet refinishing Atlanta GA', 'white cabinet painting Atlanta',
    ],
    openGraph: {
        title: 'Cabinet Painting & Refinishing Atlanta, GA | Bridgepointe',
        description: 'Professional spray-applied cabinet refinishing in Atlanta. New look. Fraction of replacement cost. Free estimates.',
        url: 'https://bridgepointepainting.com/cabinet-painting-atlanta',
    },
    alternates: { canonical: 'https://bridgepointepainting.com/cabinet-painting-atlanta' },
};

const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Cabinet Painting & Refinishing',
    provider: { '@type': 'LocalBusiness', name: 'Bridgepointe', url: 'https://bridgepointepainting.com' },
    areaServed: { '@type': 'State', name: 'Metro Atlanta, Georgia' },
    description: 'Professional spray-applied cabinet painting and refinishing for kitchen and bathroom cabinets. Factory-smooth finish without the cost of replacement.',
    serviceType: 'Cabinet Painting Contractor',
};

const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
        { '@type': 'Question', name: 'How much does cabinet painting cost in Atlanta?', acceptedAnswer: { '@type': 'Answer', text: 'Cabinet painting in Atlanta typically costs $1,500–$4,000 for a full kitchen, depending on the number of doors, drawer fronts, and box faces. This is a fraction of the $15,000–$40,000 cost of replacing cabinets. Bridgepointe provides free estimates.' } },
        { '@type': 'Question', name: 'How long does cabinet painting last?', acceptedAnswer: { '@type': 'Answer', text: 'A professionally spray-painted cabinet finish using a high-quality conversion varnish or catalyzed enamel will last 8–12 years with normal use. Bridgepointe\'s process includes proper degreasing, sanding, priming, and two topcoats for maximum durability.' } },
        { '@type': 'Question', name: 'Can you paint cabinets without removing them?', acceptedAnswer: { '@type': 'Answer', text: 'Bridgepointe removes all doors and drawer fronts and takes them off-site for spray application in a controlled environment. Box faces are carefully masked and spray-finished in place. This ensures a smooth, drip-free finish impossible to achieve with brush-and-roll in situ.' } },
        { '@type': 'Question', name: 'What colors can you paint kitchen cabinets?', acceptedAnswer: { '@type': 'Answer', text: 'Any color is possible. Popular choices in Metro Atlanta include crisp white (Benjamin Moore Simply White OC-17, Chantilly Lace), warm navy, sage green, and two-tone combinations. Bridgepointe offers color consultation to find the perfect match for your home.' } },
    ],
};

const process = [
    { title: 'Hardware & Door Removal', body: 'All doors, drawer fronts, and hardware are removed and catalogued for reassembly.' },
    { title: 'Degreasing & Cleaning', body: 'Thorough degreasing of all surfaces to remove cooking residue, oils, and contaminants.' },
    { title: 'Sanding', body: 'Orbital sanding to scuff and key the existing finish for maximum primer adhesion.' },
    { title: 'Filling & Glazing', body: 'Wood grain, dings, and imperfections filled and sanded smooth for a furniture-grade surface.' },
    { title: 'Spray Prime', body: 'Spray-applied primer on all surfaces for a uniform, adhesion-ready base.' },
    { title: 'Two-Coat Spray Finish', body: 'Two coats of high-performance catalyst enamel, spray-applied for a factory-smooth result.' },
    { title: 'Cure & Reinstall', body: 'Full cure time observed. Doors and hardware reinstalled with new hinges if requested.' },
];

export default function CabinetPaintingAtlanta() {
    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

            {/* Hero */}
            <section className="relative min-h-[60vh] flex items-end pb-20 pt-36 overflow-hidden bg-[#0f0f0f]">
                <div className="absolute inset-0 bg-gradient-to-br from-[#34d399]/8 via-transparent to-transparent" />
                <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
                    <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#34d399] mb-4">Cabinet Painting · Metro Atlanta, GA</p>
                    <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight max-w-4xl">
                        Cabinet Painting &<br />
                        <span className="text-[#b8956a]">Refinishing Atlanta</span>
                    </h1>
                    <p className="mt-6 max-w-2xl text-lg text-white/60 leading-relaxed">
                        Transform your kitchen or bathroom without the cost of new cabinets. Bridgepointe&apos;s spray-applied enamel finish delivers a factory-smooth result that lasts — for a fraction of replacement cost.
                    </p>
                    <div className="mt-10 flex flex-wrap gap-4">
                        <Link href="/select-services" className="px-8 py-4 rounded-xl font-semibold text-sm uppercase tracking-wider" style={{ background: 'linear-gradient(135deg, #b8956a, #9a7a54)', color: 'white' }}>
                            Get Free Estimate
                        </Link>
                        <Link href="/portfolio" className="px-8 py-4 rounded-xl font-semibold text-sm uppercase tracking-wider border border-white/15 text-white hover:border-[#b8956a]/50 transition-colors">
                            View Cabinet Projects
                        </Link>
                    </div>
                </div>
            </section>

            {/* Value Prop */}
            <section className="py-16 bg-[#111] border-t border-white/5">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            { label: 'vs. Cabinet Replacement', value: '70–80% Savings', sub: 'New look. Fraction of the cost.' },
                            { label: 'Project Timeline', value: '3–5 Days', sub: 'Minimal disruption to your kitchen.' },
                            { label: 'Finish Durability', value: '8–12 Years', sub: 'Catalyzed enamel. Chip-resistant.' },
                        ].map(v => (
                            <div key={v.label} className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-7 text-center">
                                <p className="text-xs font-bold uppercase tracking-wider text-white/30 mb-2">{v.label}</p>
                                <p className="font-serif text-3xl font-bold text-[#b8956a] mb-1">{v.value}</p>
                                <p className="text-sm text-white/40">{v.sub}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Process */}
            <section className="py-24 bg-[#0f0f0f] border-t border-white/5">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <h2 className="font-serif text-4xl font-bold text-white text-center mb-4">Our Cabinet Refinishing Process</h2>
                    <p className="text-white/40 text-center max-w-2xl mx-auto mb-16">7 meticulous steps — no shortcuts — for a finish that looks custom-built.</p>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {process.map((s, i) => (
                            <div key={s.title} className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6">
                                <span className="text-3xl font-bold text-[#b8956a]/20 font-serif">0{i + 1}</span>
                                <h3 className="font-serif text-base font-bold text-white mt-2 mb-1.5">{s.title}</h3>
                                <p className="text-sm text-white/45 leading-relaxed">{s.body}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="py-24 bg-[#111] border-t border-white/5">
                <div className="mx-auto max-w-4xl px-6 lg:px-8">
                    <h2 className="font-serif text-3xl font-bold text-white mb-12">Cabinet Painting FAQs — Atlanta, GA</h2>
                    <div className="space-y-5">
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
                    <h2 className="font-serif text-4xl font-bold text-white mb-4">Ready for a Kitchen Transformation?</h2>
                    <p className="text-white/40 mb-10">Free on-site estimate. We measure, photograph, and provide a detailed written proposal — no pressure.</p>
                    <Link href="/select-services" className="inline-flex px-10 py-4 rounded-xl font-semibold text-sm uppercase tracking-wider" style={{ background: 'linear-gradient(135deg, #b8956a, #9a7a54)', color: 'white' }}>
                        Get Free Cabinet Estimate
                    </Link>
                </div>
            </section>
        </>
    );
}

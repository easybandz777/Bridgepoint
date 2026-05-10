import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { NEIGHBORHOODS, getNeighborhood } from '@/lib/neighborhoods';
import { breadcrumbSchema, jsonLd, serviceSchema } from '@/lib/seo';

const BASE = 'https://bridgepointepainting.com';

export async function generateStaticParams() {
    return NEIGHBORHOODS.map((n) => ({ neighborhood: n.slug }));
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ neighborhood: string }>;
}): Promise<Metadata> {
    const { neighborhood } = await params;
    const n = getNeighborhood(neighborhood);
    if (!n) return {};

    const url = `${BASE}/painting-contractor-${n.slug}`;
    return {
        title: `Painting Contractor ${n.name}, GA | Interior, Exterior & Cabinet Painting | Bridgepointe`,
        description: `Top-rated painting contractor in ${n.name}, GA. Interior repaints, cabinet refinishing, exterior painting, and custom trim work for ${n.name} homeowners. ${n.parent}. Free on-site estimates.`,
        keywords: [
            `painting contractor ${n.name}`,
            `painters ${n.name} GA`,
            `interior painting ${n.name}`,
            `exterior painting ${n.name}`,
            `cabinet painting ${n.name}`,
            `house painters ${n.name}`,
            `painting company ${n.name} Georgia`,
            `${n.name} painters`,
            `professional painters ${n.name}`,
        ],
        openGraph: {
            title: `Painting Contractor ${n.name}, GA | Bridgepointe`,
            description: `Premium interior, exterior, and cabinet painting for ${n.name} homeowners. Bridgepointe — 18+ years across Metro Atlanta.`,
            url,
            images: [{ url: '/images/gallery/painting/14.jpg', width: 1200, height: 630, alt: `Painting contractor ${n.name} Georgia — Bridgepointe` }],
        },
        alternates: { canonical: url },
    };
}

const services = [
    { title: 'Interior Painting', body: 'Walls, ceilings, trim, doors, and built-in millwork — coordinated as one project.', href: '/interior-painting-atlanta' },
    { title: 'Cabinet Refinishing', body: 'Spray-applied conversion-varnish finish — factory-grade result without replacement cost.', href: '/cabinet-painting-atlanta' },
    { title: 'Exterior Painting', body: 'Pressure wash, scrape, wood-rot repair, prime, and finish for Atlanta\'s climate.', href: '/exterior-painting-atlanta' },
    { title: 'Trim & Feature Walls', body: 'Custom slat walls, geometric paneling, dark trim packages built and finished on-site.', href: '/painting' },
    { title: 'Bathroom & Tile', body: 'Full bathroom remodels with custom tile, waterproofing, and finish carpentry.', href: '/select-services' },
    { title: 'Whole-Home Remodels', body: 'By-application luxury remodeling for select projects $100K and up.', href: '/select-services' },
];

export default async function NeighborhoodPage({
    params,
}: {
    params: Promise<{ neighborhood: string }>;
}) {
    const { neighborhood } = await params;
    const n = getNeighborhood(neighborhood);
    if (!n) notFound();

    const crumbs = breadcrumbSchema([
        { name: 'Home', url: '/' },
        { name: 'Service Areas', url: '/' },
        { name: `Painting Contractor ${n.name}`, url: `/painting-contractor-${n.slug}` },
    ]);

    const service = serviceSchema({
        name: `Painting Services in ${n.name}, GA`,
        description: `Interior painting, exterior painting, cabinet refinishing, and custom trim work for ${n.name} homes. ${n.blurb}`,
        serviceType: 'Painting Contractor',
        areaName: `${n.name}, ${n.parent}`,
        priceRange: '$$$',
        image: '/images/gallery/painting/14.jpg',
    });

    const otherNeighborhoods = NEIGHBORHOODS.filter((x) => x.slug !== n.slug).slice(0, 5);

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(crumbs)} />
            <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(service)} />

            {/* Hero */}
            <section className="relative min-h-[55vh] flex items-end pb-16 pt-36 overflow-hidden bg-[#0f0f0f]">
                <div className="absolute inset-0">
                    <Image src="/images/gallery/painting/14.jpg" alt={`Atlanta-area kitchen — painting contractor in ${n.name}`} fill priority sizes="100vw" className="object-cover opacity-35" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-[#0f0f0f]/85 to-[#0f0f0f]/40" />
                </div>
                <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
                    <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#b8956a] mb-4">{n.parent}</p>
                    <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight max-w-4xl">
                        Painting Contractor<br />
                        <span className="text-[#b8956a]">in {n.name}, GA</span>
                    </h1>
                    <p className="mt-6 max-w-2xl text-lg text-white/70 leading-relaxed">{n.blurb}</p>
                    <div className="mt-10 flex flex-wrap gap-4">
                        <Link href="/contact" className="px-8 py-4 rounded-xl font-semibold text-sm uppercase tracking-wider" style={{ background: 'linear-gradient(135deg, #b8956a, #9a7a54)', color: 'white' }}>
                            Request Free Estimate
                        </Link>
                        <Link href="/before-and-after" className="px-8 py-4 rounded-xl font-semibold text-sm uppercase tracking-wider border border-white/15 text-white hover:border-[#b8956a]/50 transition-colors">
                            See Before & After
                        </Link>
                    </div>
                </div>
            </section>

            {/* What we see in this neighborhood */}
            <section className="py-16 bg-[#111] border-t border-white/5">
                <div className="mx-auto max-w-5xl px-6 lg:px-8">
                    <h2 className="font-serif text-2xl md:text-3xl font-bold text-white mb-6">What We See in {n.name}</h2>
                    <ul className="space-y-3">
                        {n.traits.map((t) => (
                            <li key={t} className="flex items-start gap-3 text-white/65 leading-relaxed">
                                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#b8956a]" />
                                {t}
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            {/* Services */}
            <section className="py-20 bg-[#0f0f0f] border-t border-white/5">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <h2 className="font-serif text-3xl font-bold text-white mb-3">Services for {n.name} Homeowners</h2>
                    <p className="text-white/40 max-w-2xl mb-12 leading-relaxed">
                        One crew, all services in-house. No coordination problems between cabinets, walls, and trim.
                    </p>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {services.map((s) => (
                            <Link key={s.title} href={s.href} className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6 hover:border-[#b8956a]/30 transition-all group">
                                <h3 className="font-serif text-base font-bold text-white mb-2 group-hover:text-[#b8956a] transition-colors">{s.title}</h3>
                                <p className="text-sm text-white/50 leading-relaxed">{s.body}</p>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* We also pressure wash */}
            <section className="py-12 bg-[#0f0f0f] border-t border-white/5">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 rounded-2xl border border-[#b8956a]/25 bg-[#1a1a1a] p-6">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#b8956a] mb-2">We Also Pressure Wash</p>
                            <h3 className="font-serif text-xl md:text-2xl font-bold text-white">Hot-water pressure washing in {n.name}</h3>
                            <p className="mt-2 text-sm text-white/55 max-w-2xl leading-relaxed">
                                Driveways, siding, decks, fences, and pre-paint exterior prep. Same crew, same standards, now booking across {n.parent}.
                            </p>
                        </div>
                        <Link
                            href="/pressure-washing-atlanta"
                            className="shrink-0 inline-flex items-center gap-2 rounded-xl px-6 py-3 font-semibold text-sm uppercase tracking-wider"
                            style={{ background: 'linear-gradient(135deg, #b8956a, #9a7a54)', color: 'white' }}
                        >
                            Learn More &rarr;
                        </Link>
                    </div>
                </div>
            </section>

            {/* Internal links to other neighborhoods */}
            <section className="py-16 bg-[#111] border-t border-white/5">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <p className="text-xs font-bold uppercase tracking-wider text-white/30 mb-4">Also Serving</p>
                    <div className="flex flex-wrap gap-3">
                        {otherNeighborhoods.map((other) => (
                            <Link
                                key={other.slug}
                                href={`/painting-contractor-${other.slug}`}
                                className="text-sm px-4 py-2 rounded-lg bg-[#1a1a1a] border border-white/6 text-white/55 hover:text-[#b8956a] hover:border-[#b8956a]/30 transition-colors"
                            >
                                Painting Contractor {other.name}
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-24 bg-[#0f0f0f] border-t border-white/5 text-center">
                <div className="mx-auto max-w-3xl px-6">
                    <h2 className="font-serif text-3xl font-bold text-white mb-4">Painting Project in {n.name}?</h2>
                    <p className="text-white/40 mb-10">Free on-site consultation. We measure, photograph, and quote in writing.</p>
                    <Link href="/contact" className="inline-flex px-10 py-4 rounded-xl font-semibold text-sm uppercase tracking-wider" style={{ background: 'linear-gradient(135deg, #b8956a, #9a7a54)', color: 'white' }}>
                        Schedule a Consultation
                    </Link>
                </div>
            </section>
        </>
    );
}

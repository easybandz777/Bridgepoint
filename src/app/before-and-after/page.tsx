import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { breadcrumbSchema, jsonLd } from '@/lib/seo';

const BASE = 'https://bridgepointepainting.com';
const HERO = '/images/gallery/painting/14.jpg';

export const metadata: Metadata = {
    title: 'Before & After | Atlanta Painting & Remodeling Transformations',
    description:
        'Real before-and-after photos from Bridgepointe painting, kitchen, bathroom, and tile projects across Metro Atlanta. See what real prep work, conversion-varnish cabinets, and custom trim packages actually look like.',
    keywords: [
        'before and after painting Atlanta', 'cabinet painting before after Atlanta',
        'kitchen remodel before after Atlanta', 'bathroom remodel before after Atlanta',
        'tile installation before after Atlanta', 'house painting transformation Atlanta',
        'home renovation before after Atlanta GA',
    ],
    openGraph: {
        title: 'Before & After | Bridgepointe Atlanta',
        description: 'Real photos from kitchen, bathroom, tile, and painting transformations across Metro Atlanta.',
        url: `${BASE}/before-and-after`,
        images: [{ url: HERO, width: 1200, height: 630, alt: 'Before and after — Bridgepointe Atlanta painting and remodeling' }],
    },
    alternates: { canonical: `${BASE}/before-and-after` },
};

interface Transformation {
    title: string;
    location: string;
    category: string;
    before: string;
    after: string;
    beforeAlt: string;
    afterAlt: string;
    summary: string;
    investment?: string;
    timeline?: string;
}

const transformations: Transformation[] = [
    {
        title: 'Whole-Home Interior Repaint',
        location: 'East Cobb, GA',
        category: 'Interior Painting',
        before: '/images/gallery/painting/47.jpg',
        after: '/images/gallery/painting/14.jpg',
        beforeAlt: 'Dated yellow-gold walls and stained carpet — before Bridgepointe interior repaint',
        afterAlt: 'Open kitchen with painted coffered ceiling, navy island, and white cabinetry — after Bridgepointe',
        summary:
            'Stripped 1990s gold walls and matched the trim color across the entire main floor. Coffered ceiling sprayed in two tones, island repainted in deep navy, perimeter cabinets in white shaker.',
        investment: '$22,000 – $28,000',
        timeline: '3 weeks',
    },
    {
        title: 'Kitchen Cabinet Refinishing — Two-Tone',
        location: 'Buckhead, GA',
        category: 'Cabinet Refinishing',
        before: '/images/gallery/painting/27.jpg',
        after: '/images/gallery/painting/29.jpg',
        beforeAlt: 'Mid-project cabinet repaint with mudded ceiling, ladders, drop cloths',
        afterAlt: 'Finished two-tone shaker kitchen — light grey perimeter, dark grey island, gold hardware',
        summary:
            'Doors removed, sprayed off-site in conversion varnish. Boxes masked and sprayed in place. Two-tone perimeter and island finish, new gold pulls and soft-close hinges throughout.',
        investment: '$5,500 – $7,000',
        timeline: '7 days',
    },
    {
        title: 'Wet Bar Cabinet Build + Finish',
        location: 'Sandy Springs, GA',
        category: 'Cabinet Refinishing',
        before: '/images/gallery/painting/25.jpg',
        after: '/images/gallery/painting/13.jpg',
        beforeAlt: 'Bedroom mid-project — drywall patches sanded, furniture wrapped in plastic, ready for primer',
        afterAlt: 'Finished navy wet-bar cabinetry with calacatta marble counters and X-pattern wine cabinets',
        summary:
            'Custom wet-bar cabinetry sprayed in deep navy. Marble counters installed only after the finish was fully cured to avoid contact damage. New polished pulls, integrated lighting.',
        investment: '$8,000 – $10,000',
        timeline: '10 days',
    },
    {
        title: 'Sage Living Room with Sprayed Built-Ins',
        location: 'Roswell, GA',
        category: 'Interior + Trim',
        before: '/images/gallery/painting/22.jpg',
        after: '/images/gallery/painting/11.jpg',
        beforeAlt: 'Dated living room with painted-on mural accent wall and floral upholstery — before',
        afterAlt: 'Sage green walls with sprayed white built-ins flanking the fireplace — after',
        summary:
            'Old hand-painted accent mural primed and skim-coated flat. Walls repainted in soft sage. Built-ins around the fireplace stripped, primed, and sprayed white. Textured wave panel added as feature.',
        investment: '$12,000 – $15,000',
        timeline: '12 days',
    },
    {
        title: 'Geometric Sun-Ray Feature Wall',
        location: 'Alpharetta, GA',
        category: 'Trim & Feature Walls',
        before: '/images/gallery/painting/04.jpg',
        after: '/images/gallery/painting/37.jpg',
        beforeAlt: 'Stairwell with navy walls and black painted trim — pre-feature-wall',
        afterAlt: 'Custom built sun-ray geometric feature wall in deep grey, with crisp white shiplap above',
        summary:
            'Stairwell upgraded with custom-built sun-ray geometric trim package. Built on-site from solid trim stock, mitred returns, fill-and-sand smooth, sprayed in deep grey to contrast white shiplap.',
        investment: '$4,500 – $6,500',
        timeline: '6 days',
    },
];

const crumbs = breadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Before & After', url: '/before-and-after' },
]);

export default function BeforeAndAfter() {
    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(crumbs)} />

            {/* Hero */}
            <section className="relative min-h-[50vh] flex items-end pb-16 pt-36 overflow-hidden bg-[#0f0f0f]">
                <div className="absolute inset-0">
                    <Image src={HERO} alt="Before and after — Atlanta painting and remodeling transformations" fill priority sizes="100vw" className="object-cover opacity-35" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-[#0f0f0f]/85 to-[#0f0f0f]/40" />
                </div>
                <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
                    <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#b8956a] mb-4">Before & After · Metro Atlanta</p>
                    <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight max-w-4xl">
                        Real Project<br />
                        <span className="text-[#b8956a]">Transformations</span>
                    </h1>
                    <p className="mt-6 max-w-2xl text-lg text-white/70 leading-relaxed">
                        Five recent projects, photographed before we started and the day we wrapped. Same room, same angle. Real prep work, real finishes, real timelines.
                    </p>
                </div>
            </section>

            {/* Transformations */}
            <section className="py-20 bg-[#0f0f0f] border-t border-white/5">
                <div className="mx-auto max-w-7xl px-6 lg:px-8 space-y-24">
                    {transformations.map((t, i) => (
                        <article key={t.title} className="">
                            {/* Project header */}
                            <div className="mb-8">
                                <p className="text-xs font-bold uppercase tracking-wider text-[#b8956a] mb-2">{t.category} · {t.location}</p>
                                <h2 className="font-serif text-3xl md:text-4xl font-bold text-white">{t.title}</h2>
                                <p className="mt-3 text-white/55 leading-relaxed max-w-3xl">{t.summary}</p>
                                {(t.investment || t.timeline) && (
                                    <div className="mt-5 flex flex-wrap gap-6 text-sm">
                                        {t.investment && (
                                            <span className="text-white/40">
                                                <span className="text-white/60 font-semibold">Investment:</span> {t.investment}
                                            </span>
                                        )}
                                        {t.timeline && (
                                            <span className="text-white/40">
                                                <span className="text-white/60 font-semibold">Timeline:</span> {t.timeline}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Before/After image pair */}
                            <div className="grid md:grid-cols-2 gap-4">
                                <figure className="relative group">
                                    <div className="relative aspect-[4/3] overflow-hidden bg-[#1a1a1a]">
                                        <Image
                                            src={t.before}
                                            alt={t.beforeAlt}
                                            fill
                                            className="object-cover"
                                            sizes="(max-width: 768px) 100vw, 50vw"
                                            priority={i === 0}
                                        />
                                        <span className="absolute top-4 left-4 bg-[#f87171]/90 text-white px-3 py-1.5 text-xs font-bold uppercase tracking-wider">Before</span>
                                    </div>
                                </figure>
                                <figure className="relative group">
                                    <div className="relative aspect-[4/3] overflow-hidden bg-[#1a1a1a]">
                                        <Image
                                            src={t.after}
                                            alt={t.afterAlt}
                                            fill
                                            className="object-cover"
                                            sizes="(max-width: 768px) 100vw, 50vw"
                                            priority={i === 0}
                                        />
                                        <span className="absolute top-4 left-4 bg-[#34d399]/90 text-white px-3 py-1.5 text-xs font-bold uppercase tracking-wider">After</span>
                                    </div>
                                </figure>
                            </div>
                        </article>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section className="py-24 bg-[#111] border-t border-white/5 text-center">
                <div className="mx-auto max-w-3xl px-6">
                    <h2 className="font-serif text-3xl font-bold text-white mb-4">Ready for Your Transformation?</h2>
                    <p className="text-white/40 mb-10">Free on-site consultation. We&apos;ll walk every surface, measure, photograph, and quote in writing — no high-pressure tactics.</p>
                    <div className="flex flex-wrap gap-4 justify-center">
                        <Link href="/contact" className="px-8 py-4 rounded-xl font-semibold text-sm uppercase tracking-wider" style={{ background: 'linear-gradient(135deg, #b8956a, #9a7a54)', color: 'white' }}>
                            Schedule a Consultation
                        </Link>
                        <Link href="/portfolio" className="px-8 py-4 rounded-xl font-semibold text-sm uppercase tracking-wider border border-white/15 text-white hover:border-[#b8956a]/50 transition-colors">
                            See Full Portfolio →
                        </Link>
                    </div>
                </div>
            </section>
        </>
    );
}

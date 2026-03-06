'use client';

import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { AnimatedSection } from '@/components/shared/animated-section';
import { IMAGES } from '@/lib/images';

const U = (id: string, w = 800) =>
    `https://images.unsplash.com/photo-${id}?w=${w}&q=80&fit=crop`;

interface ServiceSection {
    id: string;
    eyebrow: string;
    title: string;
    description: string;
    features: string[];
    cta: { label: string; href: string };
    mainImage: string;
    gallery: string[];
    flip?: boolean;
}

const SECTIONS: ServiceSection[] = [
    {
        id: 'painting',
        eyebrow: 'Interior · Exterior · Cabinets',
        title: 'Painting',
        description:
            'From flawless single-room refreshes to full exterior transformations, our craftsmen deliver a paint job that outlasts and out-performs. We use only premium zero-VOC Benjamin Moore and Sherwin-Williams products.',
        features: [
            'Interior rooms, trim & doors',
            'Exterior siding, fascia & shutters',
            'Cabinet spray finishing — factory quality',
        ],
        cta: { label: 'See Painting Services', href: '/painting' },
        mainImage: IMAGES.interiorPainting,
        gallery: [
            IMAGES.cabinetRefinishing,
            IMAGES.exteriorPainting,
            IMAGES.specialtyFinishes,
        ],
        flip: false,
    },
    {
        id: 'flooring',
        eyebrow: 'Hardwood · LVP · Tile',
        title: 'Flooring',
        description:
            'Beautiful floors transform a home instantly. We install, sand, and finish hardwood, luxury vinyl plank, and tile across Atlanta — with meticulous substrate prep that makes every floor last for decades.',
        features: [
            'Solid & engineered hardwood install',
            'Sand, stain & finish refinishing',
            'Luxury vinyl plank & tile',
        ],
        cta: { label: 'View Portfolio', href: '/portfolio' },
        mainImage: U('1581858726788-d14f2c8cbdbd'),
        gallery: [
            U('1558618666-fcd25c85cd64'),
            U('1524758631624-e2822132304c'),
            U('1600585154340-be6161a56a0c'),
        ],
        flip: true,
    },
    {
        id: 'bathroom',
        eyebrow: 'Full Remodels · Tile · Fixtures',
        title: 'Bathroom Remodels',
        description:
            'A master bath that feels like a five-star spa. We handle everything from demolition to final fixture — tile work, custom shower surrounds, vanity installation, lighting, and a mirror-perfect paint finish.',
        features: [
            'Walk-in & tub-to-shower conversions',
            'Custom tile & stone work',
            'Vanity, fixture & lighting install',
        ],
        cta: { label: 'Inquire About a Bath Remodel', href: '/contact' },
        mainImage: IMAGES.bathroom,
        gallery: [
            U('1552321554-5fefe8c9ef14', 400),
            U('1600566752353-2f46443f19b9', 400),
            U('1600607687939-ce8a6c25118c', 400),
        ],
        flip: false,
    },
    {
        id: 'kitchen',
        eyebrow: 'Cabinets · Counters · Full Remodels',
        title: 'Kitchen Remodels',
        description:
            'Your kitchen should be as hardworking as it is beautiful. Whether it\'s cabinet painting, countertop replacement, or a complete gut renovation, we plan every detail and execute to an uncompromising standard.',
        features: [
            'Cabinet refinishing & refacing',
            'Countertop & backsplash replacement',
            'Full kitchen renovation coordination',
        ],
        cta: { label: 'Request a Kitchen Consultation', href: '/contact' },
        mainImage: IMAGES.kitchen,
        gallery: [
            IMAGES.cabinetRefinishing,
            U('1556911220-bff31c812dba', 400),
            U('1556909114-f6e7ad7d3136', 400),
        ],
        flip: true,
    },
];

function ServiceSectionBlock({ section }: { section: ServiceSection }) {
    const { id, eyebrow, title, description, features, cta, mainImage, gallery, flip } = section;

    return (
        <div
            id={id}
            className="scroll-mt-36 py-24 border-b border-warm-white-dark/40 last:border-none"
        >
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div
                    className={`grid items-center gap-12 md:gap-20 md:grid-cols-2 ${flip ? 'md:[&>*:first-child]:order-2' : ''
                        }`}
                >
                    {/* Image column */}
                    <AnimatedSection direction={flip ? 'right' : 'left'}>
                        <div className="space-y-3">
                            {/* Main image */}
                            <div className="relative overflow-hidden shadow-2xl shadow-charcoal/15">
                                <img
                                    src={mainImage}
                                    alt={title}
                                    className="h-[26rem] w-full object-cover transition-transform duration-700 hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/20 to-transparent pointer-events-none" />
                            </div>
                            {/* Gallery strip */}
                            <div className="grid grid-cols-3 gap-3">
                                {gallery.map((src, i) => (
                                    <div key={i} className="relative overflow-hidden h-24">
                                        <img
                                            src={src}
                                            alt={`${title} example ${i + 1}`}
                                            className="h-full w-full object-cover transition-transform duration-500 hover:scale-110"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </AnimatedSection>

                    {/* Text column */}
                    <AnimatedSection direction={flip ? 'left' : 'right'} delay={0.1}>
                        <div>
                            {/* Eyebrow */}
                            <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.3em] text-gold">
                                {eyebrow}
                            </p>
                            <div className="mt-4 h-px w-12 bg-gold/40" />

                            {/* Title */}
                            <h2 className="mt-6 font-serif text-4xl font-bold text-charcoal md:text-5xl">
                                {title}
                            </h2>

                            {/* Description */}
                            <p className="mt-5 text-base leading-relaxed text-slate-light max-w-md">
                                {description}
                            </p>

                            {/* Features */}
                            <ul className="mt-8 space-y-3">
                                {features.map((f) => (
                                    <li key={f} className="flex items-start gap-3">
                                        <span className="mt-0.5 flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-gold/10 ring-1 ring-gold/25">
                                            <Check size={11} className="text-gold" strokeWidth={2.5} />
                                        </span>
                                        <span className="font-sans text-sm text-slate">{f}</span>
                                    </li>
                                ))}
                            </ul>

                            {/* CTA */}
                            <Link
                                href={cta.href}
                                className="group mt-10 inline-flex items-center gap-3 border border-charcoal/20 bg-white px-7 py-4 font-sans text-xs font-semibold uppercase tracking-[0.18em] text-charcoal shadow-sm transition-all duration-300 hover:border-gold hover:text-gold hover:shadow-md"
                            >
                                {cta.label}
                                <ArrowRight
                                    size={13}
                                    className="transition-transform duration-300 group-hover:translate-x-0.5"
                                />
                            </Link>
                        </div>
                    </AnimatedSection>
                </div>
            </div>
        </div>
    );
}

export function CoreServices() {
    return (
        <section className="bg-warm-white">
            {/* Section intro */}
            <div className="mx-auto max-w-7xl px-6 lg:px-8 pt-20 pb-0">
                <AnimatedSection className="text-center">
                    <p className="font-sans text-xs font-semibold uppercase tracking-[0.35em] text-gold">
                        What We Do Best
                    </p>
                    <div className="mt-5 mx-auto h-px w-12 bg-gold/50" />
                    <h2 className="mt-6 font-serif text-4xl font-bold text-charcoal md:text-5xl">
                        Our Core Services
                    </h2>
                    <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-slate-light">
                        Painting, flooring, and remodeling — the services Atlanta homeowners
                        trust us for, project after project.
                    </p>
                </AnimatedSection>
            </div>

            {/* Individual service sections */}
            {SECTIONS.map((section) => (
                <ServiceSectionBlock key={section.id} section={section} />
            ))}
        </section>
    );
}

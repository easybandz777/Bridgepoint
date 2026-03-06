'use client';

import Link from 'next/link';
import { Lock, ArrowRight } from 'lucide-react';
import { Section } from '@/components/ui/section';
import { AnimatedSection } from '@/components/shared/animated-section';

const FULL_REMODEL_IMG = '/images/gallery/bathrooms/20.jpg';
const CARPENTRY_IMG = '/images/gallery/flooring/20220806_101256.jpg';


export function ExclusiveRemodeling() {
    return (
        <Section variant="dark" spacious className="relative overflow-hidden">
            {/* Decorative texture */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.03]">
                <div className="font-serif text-[30rem] font-bold text-warm-white leading-none select-none">
                    B
                </div>
            </div>

            <AnimatedSection className="relative">
                {/* Header */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/5 px-5 py-2">
                        <Lock size={12} className="text-gold" />
                        <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.3em] text-gold">
                            By Invitation Only
                        </span>
                    </div>
                    <div className="mt-6 h-px w-16 bg-gold/30 mx-auto" />
                    <h2 className="mt-6 font-serif text-4xl font-bold text-warm-white md:text-5xl">
                        Select Remodeling
                    </h2>
                    <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-warm-white/50">
                        For clients who want more than a contractor — they want a true building partner.
                        Our full-scope remodeling services are offered exclusively to a select clientele
                        who value craftsmanship above all else.
                    </p>
                </div>

                {/* Card grid */}
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Full Remodel */}
                    <AnimatedSection direction="left" delay={0.1}>
                        <Link href="/select-services" className="group block">
                            <div className="relative overflow-hidden">
                                <img
                                    src={FULL_REMODEL_IMG}
                                    alt="Full home remodel"
                                    className="h-72 w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/25 to-transparent" />
                                <div className="absolute bottom-0 left-0 right-0 p-6">
                                    <h3 className="font-serif text-2xl font-bold text-white">Full Home Remodels</h3>
                                    <p className="mt-2 text-sm leading-relaxed text-white/55 max-w-xs">
                                        Complete gut-to-finish renovations. Every trade coordinated under one roof.
                                    </p>
                                    <span className="mt-4 inline-flex items-center gap-2 font-sans text-xs font-semibold uppercase tracking-[0.2em] text-gold transition-all duration-300 group-hover:gap-3">
                                        Learn More <ArrowRight size={13} />
                                    </span>
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold scale-x-0 transition-transform duration-500 origin-left group-hover:scale-x-100" />
                            </div>
                        </Link>
                    </AnimatedSection>

                    {/* Custom Carpentry */}
                    <AnimatedSection direction="right" delay={0.2}>
                        <Link href="/select-services" className="group block">
                            <div className="relative overflow-hidden">
                                <img
                                    src={CARPENTRY_IMG}
                                    alt="Custom carpentry and millwork"
                                    className="h-72 w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/25 to-transparent" />
                                <div className="absolute bottom-0 left-0 right-0 p-6">
                                    <h3 className="font-serif text-2xl font-bold text-white">Custom Carpentry & Millwork</h3>
                                    <p className="mt-2 text-sm leading-relaxed text-white/55 max-w-xs">
                                        Built-ins, libraries, wainscoting, and bespoke detail work that defines a home.
                                    </p>
                                    <span className="mt-4 inline-flex items-center gap-2 font-sans text-xs font-semibold uppercase tracking-[0.2em] text-gold transition-all duration-300 group-hover:gap-3">
                                        Learn More <ArrowRight size={13} />
                                    </span>
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold scale-x-0 transition-transform duration-500 origin-left group-hover:scale-x-100" />
                            </div>
                        </Link>
                    </AnimatedSection>
                </div>

                {/* CTA */}
                <div className="mt-12 text-center">
                    <p className="text-sm text-warm-white/35 mb-5 font-sans italic">
                        Select Remodeling projects are accepted on a limited basis. Inquiries are reviewed personally.
                    </p>
                    <Link
                        href="/select-services"
                        className="group inline-flex items-center gap-3 border border-white/20 bg-white/5 px-8 py-4 font-sans text-xs font-semibold uppercase tracking-[0.2em] text-warm-white shadow-sm transition-all duration-300 hover:border-gold hover:text-gold hover:bg-white/10"
                    >
                        Request an Introduction <ArrowRight size={13} className="transition-transform duration-300 group-hover:translate-x-0.5" />
                    </Link>
                </div>
            </AnimatedSection>
        </Section>
    );
}

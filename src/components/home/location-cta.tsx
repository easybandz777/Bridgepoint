'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Section } from '@/components/ui/section';
import { AnimatedSection } from '@/components/shared/animated-section';
import { PhoneCall } from 'lucide-react';
import { SITE_CONFIG } from '@/lib/constants';

export function LocationCTA({ locationName }: { locationName: string }) {
    return (
        <Section variant="default" spacious className="relative overflow-hidden">
            {/* Decorative background element */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.025]">
                <div className="font-serif text-[22rem] font-bold text-charcoal leading-none select-none">
                    {locationName.charAt(0)}
                </div>
            </div>

            {/* Gold accent lines — top and bottom */}
            <div className="absolute left-1/2 top-0 h-px w-32 -translate-x-1/2 bg-gold/30" />
            <div className="absolute left-1/2 bottom-0 h-px w-32 -translate-x-1/2 bg-gold/30" />

            <AnimatedSection className="relative text-center">
                {/* Eyebrow */}
                <div className="flex items-center justify-center gap-4">
                    <span className="h-px w-10 bg-gold/40" />
                    <p className="font-sans text-xs font-semibold uppercase tracking-[0.35em] text-gold">
                        Begin Your {locationName} Project
                    </p>
                    <span className="h-px w-10 bg-gold/40" />
                </div>

                {/* Headline */}
                <h2 className="mx-auto mt-6 max-w-2xl font-serif text-4xl font-bold text-charcoal md:text-5xl">
                    Every Exceptional Project&nbsp;Starts&nbsp;with a&nbsp;Conversation
                </h2>

                {/* Subtext */}
                <p className="mx-auto mt-6 max-w-md text-base leading-relaxed text-slate-light">
                    Tell us about your home in {locationName}. We&apos;ll craft a plan as
                    refined as the result you deserve.
                </p>

                {/* CTAs */}
                <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                    <Link href="/contact">
                        <Button size="lg" className="min-w-[220px] shadow-md shadow-gold/20">
                            Schedule a Consultation
                        </Button>
                    </Link>
                    <Link href="/portfolio">
                        <Button variant="ghost" size="lg" className="min-w-[220px] text-slate hover:text-gold">
                            View Our Work
                        </Button>
                    </Link>
                </div>

                {/* Phone nudge */}
                <div className="mt-10 flex items-center justify-center gap-2 text-slate-light">
                    <PhoneCall size={13} className="text-gold" />
                    <p className="font-sans text-sm">
                        Or call us directly at{' '}
                        <a
                            href={`tel:${SITE_CONFIG.phone}`}
                            className="text-charcoal font-medium transition-colors hover:text-gold"
                        >
                            {SITE_CONFIG.phone}
                        </a>
                    </p>
                </div>
            </AnimatedSection>
        </Section>
    );
}

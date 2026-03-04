'use client';

import Link from 'next/link';
import { ArrowRight, Lock } from 'lucide-react';
import { Section } from '@/components/ui/section';
import { Badge } from '@/components/ui/badge';
import { AnimatedSection } from '@/components/shared/animated-section';
import { IMAGES } from '@/lib/images';

export function ServicesPreview() {
  return (
    <Section variant="default" spacious>
      {/* Section Header */}
      <AnimatedSection>
        <div className="text-center">
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.35em] text-gold">
            Our Services
          </p>
          <div className="gold-rule mt-5" />
          <h2 className="mt-6 font-serif text-4xl font-bold text-charcoal md:text-5xl">
            Two Ways to Work With Us
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-slate-light">
            Whether you&apos;re refreshing a room or reimagining an entire home,
            we bring the same standard of uncompromising quality.
          </p>
        </div>
      </AnimatedSection>

      {/* Service Cards */}
      <div className="mt-16 grid gap-8 md:grid-cols-2">

        {/* Painting — Primary */}
        <AnimatedSection direction="left" delay={0.1}>
          <Link href="/painting" className="group block">
            <div className="relative overflow-hidden shadow-xl shadow-charcoal/10 transition-shadow duration-500 group-hover:shadow-2xl group-hover:shadow-charcoal/20">
              <img
                src={IMAGES.servicesPreviewPainting}
                alt="Professional painting service"
                className="h-[26rem] w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/30 to-transparent" />

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <Badge variant="gold">Now Booking</Badge>
                <h3 className="mt-4 font-serif text-3xl font-bold leading-tight text-white">
                  Painting Services
                </h3>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-white/65">
                  Interior, exterior, cabinet refinishing, and specialty
                  finishes. Premium results with meticulous preparation.
                </p>
                <span className="mt-5 inline-flex items-center gap-2 font-sans text-xs font-semibold uppercase tracking-[0.2em] text-gold transition-all duration-300 group-hover:gap-3">
                  Explore Services <ArrowRight size={14} />
                </span>
              </div>

              {/* Bottom gold accent line */}
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold scale-x-0 transition-transform duration-500 origin-left group-hover:scale-x-100" />
            </div>
          </Link>
        </AnimatedSection>

        {/* Select Remodeling — Exclusive */}
        <AnimatedSection direction="right" delay={0.2}>
          <Link href="/select-services" className="group block">
            <div className="relative overflow-hidden shadow-xl shadow-charcoal/10 transition-shadow duration-500 group-hover:shadow-2xl group-hover:shadow-charcoal/20">
              <img
                src={IMAGES.servicesPreviewRemodel}
                alt="High-end kitchen remodel"
                className="h-[26rem] w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/30 to-transparent" />

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <Badge variant="dark">
                  <span className="inline-flex items-center gap-1.5">
                    <Lock size={10} /> By Invitation
                  </span>
                </Badge>
                <h3 className="mt-4 font-serif text-3xl font-bold leading-tight text-white">
                  Select Remodeling
                </h3>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-white/65">
                  Full remodels, kitchens, bathrooms, and custom carpentry.
                  Available exclusively for select clients.
                </p>
                <span className="mt-5 inline-flex items-center gap-2 font-sans text-xs font-semibold uppercase tracking-[0.2em] text-gold transition-all duration-300 group-hover:gap-3">
                  Learn More <ArrowRight size={14} />
                </span>
              </div>

              {/* Bottom gold accent line */}
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold scale-x-0 transition-transform duration-500 origin-left group-hover:scale-x-100" />
            </div>
          </Link>
        </AnimatedSection>
      </div>
    </Section>
  );
}

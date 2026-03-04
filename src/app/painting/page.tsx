import type { Metadata } from 'next';
import Link from 'next/link';
import { Section } from '@/components/ui/section';
import { Button } from '@/components/ui/button';
import { AnimatedSection } from '@/components/shared/animated-section';
import { ServiceCard } from '@/components/painting/service-card';
import { ProcessTimeline } from '@/components/painting/process-timeline';
import { BeforeAfter } from '@/components/painting/before-after';
import { paintingServices } from '@/content/services';
import { IMAGES } from '@/lib/images';

export const metadata: Metadata = {
  title: 'Painting Services',
  description:
    'Premium interior, exterior, cabinet refinishing, and specialty painting services. Meticulous preparation and flawless execution on every project.',
};

export default function PaintingPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative flex min-h-[60vh] items-end overflow-hidden pb-16 pt-32">
        <div className="absolute inset-0">
          <img
            src={IMAGES.paintingHero}
            alt="Professional painting"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-charcoal/60" />
        </div>
        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
          <AnimatedSection>
            <p className="font-sans text-xs font-semibold uppercase tracking-[0.3em] text-gold">
              Our Primary Service
            </p>
            <h1 className="mt-4 font-serif text-5xl font-bold text-white md:text-6xl lg:text-7xl">
              Painting Services
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/70">
              Premium finishes demand premium preparation. Every surface
              is treated with the care and expertise of a true craftsman.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Service Types */}
      <Section variant="default" spacious>
        <AnimatedSection>
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.3em] text-gold">
            What We Offer
          </p>
          <h2 className="mt-4 font-serif text-4xl font-bold text-charcoal md:text-5xl">
            Painting Expertise
          </h2>
        </AnimatedSection>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {paintingServices.map((service, index) => (
            <ServiceCard
              key={service.id}
              service={service}
              index={index}
            />
          ))}
        </div>
      </Section>

      {/* Before & After */}
      <Section variant="alternate" spacious>
        <AnimatedSection>
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.3em] text-gold">
            The Difference
          </p>
          <h2 className="mt-4 font-serif text-4xl font-bold text-charcoal md:text-5xl">
            Before & After
          </h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-slate">
            Drag the slider to see the transformation. Quality preparation
            and expert application make all the difference.
          </p>
        </AnimatedSection>

        <div className="mt-12 space-y-8">
          <BeforeAfter
            beforeImage={IMAGES.afterPaint}
            afterImage={IMAGES.afterPaint}
          />
        </div>
      </Section>

      {/* Process */}
      <Section variant="default" spacious>
        <ProcessTimeline />
      </Section>

      {/* CTA */}
      <Section variant="dark" spacious>
        <AnimatedSection className="text-center">
          <h2 className="font-serif text-4xl font-bold text-warm-white md:text-5xl">
            Ready for a Transformation?
          </h2>
          <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-warm-white/70">
            Schedule a complimentary consultation. We will visit your home,
            discuss your vision, and provide a detailed proposal.
          </p>
          <div className="mt-10">
            <Link href="/contact">
              <Button size="lg">Schedule a Consultation</Button>
            </Link>
          </div>
        </AnimatedSection>
      </Section>
    </>
  );
}

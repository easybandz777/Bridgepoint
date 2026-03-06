import type { Metadata } from 'next';
import Link from 'next/link';
import { Section } from '@/components/ui/section';
import { Button } from '@/components/ui/button';
import { AnimatedSection } from '@/components/shared/animated-section';
import { TestimonialCard } from '@/components/shared/testimonial-card';
import { testimonials } from '@/content/testimonials';
import { IMAGES } from '@/lib/images';

export const metadata: Metadata = {
  title: 'Testimonials',
  description:
    'Read what our clients say about working with Bridgepointe. Real stories from homeowners who trusted us with their most valuable investment.',
};

export default function TestimonialsPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative flex min-h-[50vh] items-end overflow-hidden pb-16 pt-32">
        <div className="absolute inset-0">
          <img
            src={IMAGES.testimonialsHero}
            alt="Happy homeowner"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-charcoal/60" />
        </div>
        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
          <AnimatedSection>
            <p className="font-sans text-xs font-semibold uppercase tracking-[0.3em] text-gold">
              Client Stories
            </p>
            <h1 className="mt-4 font-serif text-5xl font-bold text-white md:text-6xl lg:text-7xl">
              Testimonials
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/70">
              Our most powerful marketing has always been the same thing:
              delighted clients who share their experience.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Testimonial Grid */}
      <Section variant="alternate" spacious>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard
              key={testimonial.id}
              testimonial={testimonial}
              index={index}
            />
          ))}
        </div>
      </Section>

      {/* CTA */}
      <Section variant="default" spacious>
        <AnimatedSection className="text-center">
          <h2 className="font-serif text-4xl font-bold text-charcoal md:text-5xl">
            Ready to Join Our Story?
          </h2>
          <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-slate">
            Every testimonial here started with a simple conversation.
            Let&apos;s start yours.
          </p>
          <div className="mt-10">
            <Link href="/contact">
              <Button size="lg">Begin a Conversation</Button>
            </Link>
          </div>
        </AnimatedSection>
      </Section>
    </>
  );
}

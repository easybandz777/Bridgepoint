import type { Metadata } from 'next';
import Link from 'next/link';
import { Section } from '@/components/ui/section';
import { Button } from '@/components/ui/button';
import { AnimatedSection } from '@/components/shared/animated-section';
import { SITE_CONFIG } from '@/lib/constants';
import { IMAGES } from '@/lib/images';

export const metadata: Metadata = {
  title: 'About',
  description:
    'Meet the craftsman behind Bridgepointe. Over 18 years of experience in high-end remodeling and premium painting, with an unwavering commitment to quality.',
};

const VALUES = [
  {
    title: 'Uncompromising Quality',
    description:
      'Every joint, every finish, every detail is held to the highest standard. There are no shortcuts in craftsmanship.',
  },
  {
    title: 'Client Relationships',
    description:
      'We build trust before we build anything else. Open communication, transparent pricing, and genuine care for your home.',
  },
  {
    title: 'Honest Work',
    description:
      'The work behind the walls matters as much as what you see. We do things right, even when no one is watching.',
  },
  {
    title: 'Continuous Mastery',
    description:
      'Techniques evolve, materials improve, and standards rise. We invest in learning so our craft never stands still.',
  },
];

const TIMELINE = [
  {
    year: '2008',
    title: 'The Beginning',
    description:
      'Started as a solo craftsman, taking on small remodeling jobs with a focus on doing them exceptionally well.',
  },
  {
    year: '2012',
    title: 'First Major Project',
    description:
      'Completed our first six-figure remodel -- a full kitchen and living area transformation that established our reputation.',
  },
  {
    year: '2016',
    title: 'Growing Reputation',
    description:
      'Word of mouth drove steady growth. Began working exclusively on high-end projects by client referral.',
  },
  {
    year: '2020',
    title: 'Expanding Services',
    description:
      'Added premium painting as a dedicated service line, bringing the same meticulous approach to every surface.',
  },
  {
    year: '2024',
    title: 'Select Model',
    description:
      'Transitioned to a select client model for remodeling, focusing primarily on painting while reserving large projects for the right fit.',
  },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative flex min-h-[60vh] items-end overflow-hidden pb-16 pt-32">
        <div className="absolute inset-0">
          <img
            src={IMAGES.aboutHero}
            alt="Craftsman at work"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-charcoal/60" />
        </div>
        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
          <AnimatedSection>
            <p className="font-sans text-xs font-semibold uppercase tracking-[0.3em] text-gold">
              Our Story
            </p>
            <h1 className="mt-4 font-serif text-5xl font-bold text-white md:text-6xl lg:text-7xl">
              The Craftsman
            </h1>
          </AnimatedSection>
        </div>
      </section>

      {/* Story */}
      <Section variant="default" spacious>
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <AnimatedSection direction="left">
            <div className="overflow-hidden">
              <img
                src={IMAGES.craftsmanPortrait}
                alt="The craftsman"
                className="h-[500px] w-full object-cover"
              />
            </div>
          </AnimatedSection>

          <AnimatedSection direction="right" delay={0.2}>
            <p className="font-sans text-xs font-semibold uppercase tracking-[0.3em] text-gold">
              {SITE_CONFIG.stats.yearsExperience} Years of Craft
            </p>
            <h2 className="mt-4 font-serif text-4xl font-bold text-charcoal">
              Built on a Simple Belief
            </h2>
            <div className="mt-6 space-y-4 text-base leading-relaxed text-slate">
              <p>
                Some people build houses. We build something more
                personal. Every home we touch becomes a reflection of the
                people who live there, crafted with the kind of care that
                only comes from genuinely loving the work.
              </p>
              <p>
                After {SITE_CONFIG.stats.yearsExperience} years and over{' '}
                {SITE_CONFIG.stats.projectsCompleted} projects, the
                philosophy hasn&apos;t changed: do it right, do it with
                integrity, and never cut corners. The result is work that
                doesn&apos;t just look beautiful -- it endures.
              </p>
              <p>
                Today, we focus primarily on premium painting services,
                bringing that same craftsman&apos;s attention to every
                surface. For select clients and the right projects, we
                still take on the large-scale remodeling work that built
                our reputation.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </Section>

      {/* Values */}
      <Section variant="alternate" spacious>
        <AnimatedSection>
          <p className="text-center font-sans text-xs font-semibold uppercase tracking-[0.3em] text-gold">
            What Guides Us
          </p>
          <h2 className="mt-4 text-center font-serif text-4xl font-bold text-charcoal md:text-5xl">
            Our Values
          </h2>
        </AnimatedSection>

        <div className="mt-16 grid gap-8 md:grid-cols-2">
          {VALUES.map((value, index) => (
            <AnimatedSection key={value.title} delay={index * 0.1}>
              <div className="border-l-2 border-gold pl-6">
                <h3 className="font-serif text-xl font-bold text-charcoal">
                  {value.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate">
                  {value.description}
                </p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </Section>

      {/* Timeline */}
      <Section variant="default" spacious>
        <AnimatedSection>
          <p className="text-center font-sans text-xs font-semibold uppercase tracking-[0.3em] text-gold">
            The Journey
          </p>
          <h2 className="mt-4 text-center font-serif text-4xl font-bold text-charcoal md:text-5xl">
            Our Story Over the Years
          </h2>
        </AnimatedSection>

        <div className="mx-auto mt-16 max-w-2xl space-y-12">
          {TIMELINE.map((event, index) => (
            <AnimatedSection key={event.year} delay={index * 0.1}>
              <div className="flex gap-6">
                <div className="shrink-0">
                  <span className="font-serif text-2xl font-bold text-gold">
                    {event.year}
                  </span>
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-charcoal">
                    {event.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate">
                    {event.description}
                  </p>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <Section variant="dark" spacious>
        <AnimatedSection className="text-center">
          <h2 className="font-serif text-4xl font-bold text-warm-white md:text-5xl">
            Let&apos;s Build Something Together
          </h2>
          <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-warm-white/70">
            Whether it&apos;s a fresh coat of paint or a complete
            transformation, every great project starts with a
            conversation.
          </p>
          <div className="mt-10">
            <Link href="/contact">
              <Button size="lg">Get in Touch</Button>
            </Link>
          </div>
        </AnimatedSection>
      </Section>
    </>
  );
}

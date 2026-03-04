import type { Metadata } from 'next';
import Link from 'next/link';
import { Lock, Shield, Star } from 'lucide-react';
import { Section } from '@/components/ui/section';
import { IMAGES } from '@/lib/images';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AnimatedSection } from '@/components/shared/animated-section';
import { selectServices } from '@/content/services';

export const metadata: Metadata = {
  title: 'Select Services',
  description:
    'Exclusive high-end remodeling services available by application only. Full home remodels, kitchen transformations, luxury bathrooms, and custom carpentry.',
};

const PILLARS = [
  {
    icon: Lock,
    title: 'By Application Only',
    description:
      'We intentionally limit the number of large projects we take on each year to ensure every client receives our full attention and resources.',
  },
  {
    icon: Shield,
    title: 'Vetted & Aligned',
    description:
      'We work with clients who share our values: patience for the process, respect for the craft, and a commitment to doing things right.',
  },
  {
    icon: Star,
    title: '$100K+ Investments',
    description:
      'Our select projects start at six figures. This ensures the scope and budget to deliver truly exceptional, uncompromised results.',
  },
];

export default function SelectServicesPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative flex min-h-[60vh] items-end overflow-hidden pb-16 pt-32">
        <div className="absolute inset-0">
          <img
            src={IMAGES.selectHero}
            alt="Luxury home remodel"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-charcoal/70" />
        </div>
        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
          <AnimatedSection>
            <Badge variant="dark">
              <span className="inline-flex items-center gap-1.5">
                <Lock size={10} /> By Invitation Only
              </span>
            </Badge>
            <h1 className="mt-6 font-serif text-5xl font-bold text-white md:text-6xl lg:text-7xl">
              Select Services
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/70">
              For those who demand nothing less than extraordinary.
              Our most comprehensive remodeling services, reserved for
              select clients and exceptional projects.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Exclusivity Pillars */}
      <Section variant="default" spacious>
        <AnimatedSection>
          <p className="text-center font-sans text-xs font-semibold uppercase tracking-[0.3em] text-gold">
            Why Select
          </p>
          <h2 className="mt-4 text-center font-serif text-4xl font-bold text-charcoal md:text-5xl">
            A Different Kind of Partnership
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-center text-base leading-relaxed text-slate">
            Not every project is a fit, and that&apos;s by design. We choose
            our projects as carefully as our clients choose us. The result
            is work that&apos;s truly exceptional.
          </p>
        </AnimatedSection>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {PILLARS.map((pillar, index) => (
            <AnimatedSection key={pillar.title} delay={index * 0.15}>
              <div className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center bg-charcoal">
                  <pillar.icon size={24} className="text-gold" />
                </div>
                <h3 className="mt-6 font-serif text-xl font-bold text-charcoal">
                  {pillar.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate">
                  {pillar.description}
                </p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </Section>

      {/* Service Categories */}
      <Section variant="alternate" spacious>
        <AnimatedSection>
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.3em] text-gold">
            Our Capabilities
          </p>
          <h2 className="mt-4 font-serif text-4xl font-bold text-charcoal md:text-5xl">
            What We Build
          </h2>
        </AnimatedSection>

        <div className="mt-16 space-y-12">
          {selectServices.map((service, index) => (
            <AnimatedSection
              key={service.id}
              direction={index % 2 === 0 ? 'left' : 'right'}
              delay={0.1}
            >
              <div
                className={`grid items-center gap-8 lg:grid-cols-2 ${
                  index % 2 !== 0 ? 'lg:direction-rtl' : ''
                }`}
              >
                <div className={index % 2 !== 0 ? 'lg:order-2' : ''}>
                  <div className="overflow-hidden">
                    <img
                      src={service.image}
                      alt={service.title}
                      className="h-80 w-full object-cover"
                    />
                  </div>
                </div>
                <div className={index % 2 !== 0 ? 'lg:order-1' : ''}>
                  <Badge variant="outline">
                    Starting at {service.startingAt}
                  </Badge>
                  <h3 className="mt-4 font-serif text-3xl font-bold text-charcoal">
                    {service.title}
                  </h3>
                  <p className="mt-4 text-base leading-relaxed text-slate">
                    {service.description}
                  </p>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </Section>

      {/* Application CTA */}
      <Section variant="dark" spacious>
        <AnimatedSection className="text-center">
          <Badge variant="gold">Limited Availability</Badge>
          <h2 className="mt-6 font-serif text-4xl font-bold text-warm-white md:text-5xl">
            Inquire About a Select Project
          </h2>
          <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-warm-white/70">
            Tell us about your home and your vision. If it&apos;s the
            right fit, we&apos;d be honored to bring it to life.
          </p>
          <div className="mt-10">
            <Link href="/contact">
              <Button size="lg">Submit an Inquiry</Button>
            </Link>
          </div>
        </AnimatedSection>
      </Section>
    </>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Section } from '@/components/ui/section';
import { Button } from '@/components/ui/button';
import { AnimatedSection } from '@/components/shared/animated-section';
import { ServiceCard } from '@/components/painting/service-card';
import { ProcessTimeline } from '@/components/painting/process-timeline';
import { paintingServices } from '@/content/services';
import { IMAGES } from '@/lib/images';

export const metadata: Metadata = {
  title: 'Professional Painting Services Atlanta, GA | Interior & Exterior',
  description: 'Premium painting services in Atlanta, GA. Expert interior painting, exterior painting, cabinet refinishing & specialty finishes. Serving Buckhead, Alpharetta, Roswell & all Metro Atlanta. Benjamin Moore certified. Free estimates. 18 years experience.',
  keywords: [
    'painting services Atlanta GA', 'interior painting Atlanta', 'exterior painting Atlanta',
    'painting company Atlanta Georgia', 'house painters Atlanta', 'residential painting Atlanta',
    'interior exterior painting Metro Atlanta', 'cabinet painting Atlanta', 'premium painting services Atlanta',
    'professional painters Atlanta GA', 'painting contractor Buckhead', 'luxury painters Atlanta',
  ],
  openGraph: {
    title: 'Professional Painting Services in Atlanta, GA | Bridgepointe',
    description: 'Interior painting, exterior painting & cabinet refinishing across Metro Atlanta. Meticulous prep, premium paints, expert craftsmen.',
    url: 'https://bridgepointepainting.com/painting',
    images: [{ url: '/images/gallery/painting/14.jpg', width: 1200, height: 630, alt: 'Open kitchen with coffered ceiling and painted millwork by Bridgepointe Atlanta' }],
  },
  alternates: { canonical: 'https://bridgepointepainting.com/painting' },
};

interface Transformation {
  src: string;
  title: string;
  caption: string;
}

const transformations: Transformation[] = [
  {
    src: '/images/gallery/painting/14.jpg',
    title: 'Open Kitchen + Coffered Ceiling',
    caption: 'Coffered ceiling, decorative columns, white shaker cabinets and a navy island — every surface painted in-place.',
  },
  {
    src: '/images/gallery/painting/04.jpg',
    title: 'Navy Walls, Black Trim',
    caption: 'Saturated navy walls paired with black-painted doors, casing, and crown. Sprayed and back-rolled for an even sheen.',
  },
  {
    src: '/images/gallery/painting/13.jpg',
    title: 'Wet Bar Cabinetry',
    caption: 'Custom wet-bar cabinets sprayed in deep navy with new pulls. Calacatta marble counters set after the finish was fully cured.',
  },
  {
    src: '/images/gallery/painting/09.jpg',
    title: 'Geometric Slat Feature Wall',
    caption: 'Custom-built diagonal slat wall, sanded and finished on-site against painted casework and dark stained columns.',
  },
  {
    src: '/images/gallery/painting/11.jpg',
    title: 'Sage Living Room + Built-Ins',
    caption: 'Soft sage walls, sprayed white built-ins flanking the fireplace, and a textured wave panel for a focal accent.',
  },
  {
    src: '/images/gallery/painting/37.jpg',
    title: 'Sun-Ray Geometric Wall',
    caption: 'Stairwell feature wall fabricated from solid trim stock, finished in deep grey with crisp white shiplap above.',
  },
];

const detailShots = [
  {
    src: '/images/gallery/painting/27.jpg',
    title: 'Mid-Project: Ceiling Repaint',
    caption: 'Crew rolling out a freshly mudded soffit. Ladders, drop cloths, drywall repair, and plastic masking — the unglamorous half of the job that makes the finish coat possible.',
  },
  {
    src: '/images/gallery/painting/25.jpg',
    title: 'Mid-Project: Furniture Wrap + Prep',
    caption: 'Heavy plastic over the bedroom furniture, taped at the seams. Drywall patches sanded flush, ready for primer. Nothing in the room moves until the room is ready to paint.',
  },
];

export default function PaintingPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative flex min-h-[60vh] items-end overflow-hidden pb-16 pt-32">
        <div className="absolute inset-0">
          <img
            src={IMAGES.paintingHero}
            alt="Open kitchen with coffered ceiling, painted millwork, and navy island"
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
              Whole-house repaints, custom cabinetry finishes, exterior
              restorations, and built-on-site feature walls. Every job is prepped
              like the finish coat is being judged from six inches away — because
              it will be.
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
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate">
            Four core services, every one of them executed by the same crew that
            shows up the first morning. No subbed-out finishers, no day-laborers
            on cabinets, no shortcuts on prep.
          </p>
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

      {/* Recent Transformations */}
      <Section variant="alternate" spacious>
        <AnimatedSection>
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.3em] text-gold">
            Recent Work
          </p>
          <h2 className="mt-4 font-serif text-4xl font-bold text-charcoal md:text-5xl">
            Transformations
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate">
            A cross-section of recent finishes — open-plan kitchens, custom
            built-ins, dark trim packages, and feature walls. Real photos of
            real homes, taken the day we wrapped.
          </p>
        </AnimatedSection>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {transformations.map((t, i) => (
            <AnimatedSection key={t.src} delay={i * 0.06}>
              <article className="group flex h-full flex-col overflow-hidden bg-white">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={t.src}
                    alt={t.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="font-serif text-lg font-bold text-charcoal">
                    {t.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate">
                    {t.caption}
                  </p>
                </div>
              </article>
            </AnimatedSection>
          ))}
        </div>
      </Section>

      {/* Inside the Job — process photos */}
      <Section variant="default" spacious>
        <AnimatedSection>
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.3em] text-gold">
            Inside the Job
          </p>
          <h2 className="mt-4 font-serif text-4xl font-bold text-charcoal md:text-5xl">
            What Prep Actually Looks Like
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate">
            The finish coat gets the photos. The prep is what makes it last —
            patched drywall, masked surfaces, protected furniture, and a clean
            floor at the end of every day.
          </p>
        </AnimatedSection>

        <div className="mt-12 grid gap-8 md:grid-cols-2">
          {detailShots.map((shot, i) => (
            <AnimatedSection key={shot.src} delay={i * 0.08}>
              <div className="overflow-hidden bg-cream">
                <div className="relative aspect-[4/3]">
                  <Image
                    src={shot.src}
                    alt={shot.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
                <div className="p-6">
                  <h3 className="font-serif text-lg font-bold text-charcoal">
                    {shot.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate">
                    {shot.caption}
                  </p>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </Section>

      {/* Process */}
      <Section variant="alternate" spacious>
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

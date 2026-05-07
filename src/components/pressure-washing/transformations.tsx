'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Camera } from 'lucide-react';

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
};

/** PLACEHOLDER PHOTOS — these are painting-project photos used to demonstrate the layout. Swap to real pressure-washing before/afters when shot. */
const transformations = [
  {
    type: 'House Wash · Soft Wash',
    title: '1990s Brick + Vinyl Home — East Cobb',
    body: 'Eight years of mildew streaks and pollen on the north-facing siding. Hot-water soft wash with mildewcide pre-treat. Homeowner thought they needed a paint job; they didn’t.',
    investment: '$275 – $325',
    timeline: '3 hours',
    before: '/images/gallery/painting/47.jpg',
    after: '/images/gallery/painting/14.jpg',
  },
  {
    type: 'Driveway · Surface Cleaner',
    title: 'Three-Car Concrete Driveway — Vinings',
    body: '20-inch surface cleaner with 200°F water on stained concrete. Tire grime, oil drips, and pollen lifted in one pass. Side-by-side strip lasted about ten seconds before the homeowner asked us to do the rest.',
    investment: '$200 – $250',
    timeline: '90 minutes',
    before: '/images/gallery/painting/22.jpg',
    after: '/images/gallery/painting/11.jpg',
  },
  {
    type: 'Roof Soft Wash',
    title: 'Asphalt Shingle Roof — Sandy Springs',
    body: 'Black streaks (Gloeocapsa magma algae) on the north slope. Low-pressure soft wash with shingle-safe chemistry. Re-treats free for 12 months under our mildew-free guarantee.',
    investment: '$450 – $650',
    timeline: '2 – 3 hours',
    before: '/images/gallery/painting/25.jpg',
    after: '/images/gallery/painting/37.jpg',
  },
];

export function Transformations() {
  return (
    <section
      id="transformations"
      className="relative bg-[#0a0a0a] py-28 overflow-hidden"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          background:
            'radial-gradient(ellipse at 20% 10%, rgba(184,149,106,0.25), transparent 55%), radial-gradient(ellipse at 85% 90%, rgba(56,189,248,0.15), transparent 55%)',
        }}
      />

      <div className="relative mx-auto max-w-7xl px-6 md:px-10">
        {/* Section header */}
        <motion.div {...fadeUp} className="max-w-3xl">
          <p className="text-xs uppercase tracking-[0.3em] text-[#b8956a]">
            BEFORE &amp; AFTER · REAL JOBS
          </p>
          <h2 className="mt-6 font-serif text-4xl md:text-5xl text-white leading-[1.1]">
            Same surface. 30 minutes apart.
          </h2>
          <p className="max-w-2xl mt-4 text-white/55 leading-relaxed">
            What 200°F hot water plus a 20-inch surface cleaner does to 8 years
            of Atlanta pollen, algae, and tire grime. (Note: as of launch, our
            pressure-washing photo library is small. We&apos;ll keep adding
            real before/afters every week.)
          </p>
        </motion.div>

        {/* Transformation cards */}
        <div className="mt-12 grid grid-cols-1 gap-12">
          {transformations.map((t, i) => (
            <motion.article
              key={t.title}
              {...fadeUp}
              transition={{
                duration: 0.7,
                delay: 0.05 + i * 0.05,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="rounded-2xl overflow-hidden border border-white/10 bg-[#0f0f0f] shadow-[0_30px_80px_-30px_rgba(0,0,0,0.7)]"
            >
              {/* Image row — side by side */}
              <div className="relative grid grid-cols-2 gap-1 aspect-[16/9] bg-black">
                {/* BEFORE */}
                <div className="relative overflow-hidden">
                  <Image
                    src={t.before}
                    alt={`Before — ${t.title}`}
                    fill
                    sizes="(min-width: 1024px) 640px, (min-width: 768px) 50vw, 50vw"
                    className="object-cover"
                    priority={i === 0}
                  />
                  <span className="absolute top-4 left-4 z-10 bg-[#f87171] text-white text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-sm shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
                    Before
                  </span>
                </div>

                {/* AFTER */}
                <div className="relative overflow-hidden">
                  <Image
                    src={t.after}
                    alt={`After — ${t.title}`}
                    fill
                    sizes="(min-width: 1024px) 640px, (min-width: 768px) 50vw, 50vw"
                    className="object-cover"
                    priority={i === 0}
                  />
                  <span className="absolute top-4 left-4 z-10 bg-[#34d399] text-black text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-sm shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
                    After
                  </span>
                </div>
              </div>

              {/* Card body */}
              <div className="p-6 md:p-8 bg-[#0f0f0f]">
                <p className="text-xs uppercase tracking-widest text-[#38bdf8]">
                  {t.type}
                </p>
                <h3 className="mt-3 font-serif text-xl md:text-2xl font-bold text-white leading-snug">
                  {t.title}
                </h3>
                <p className="mt-3 text-sm text-white/55 leading-relaxed max-w-3xl">
                  {t.body}
                </p>

                <div className="mt-4 flex flex-wrap gap-6 text-xs">
                  <div className="flex items-baseline gap-2">
                    <span className="uppercase tracking-widest text-white/35">
                      Investment
                    </span>
                    <span className="text-white/85 font-mono">
                      {t.investment}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="uppercase tracking-widest text-white/35">
                      Timeline
                    </span>
                    <span className="text-white/85 font-mono">
                      {t.timeline}
                    </span>
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        {/* "More coming" footer card */}
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="mt-12 bg-[#101418] border border-white/8 border-dashed rounded-2xl p-8 text-center"
        >
          <div className="flex justify-center">
            <Camera size={32} className="text-white/30" strokeWidth={1.5} />
          </div>
          <p className="mt-4 text-white/65 leading-relaxed max-w-xl mx-auto">
            More transformations roll in every week. Every job we wash gets
            photographed and added to this gallery.
          </p>
          <Link
            href="/portfolio"
            className="mt-5 inline-block text-sm uppercase tracking-[0.25em] text-[#b8956a] hover:text-white transition-colors"
          >
            View the full portfolio →
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

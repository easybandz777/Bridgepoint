'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { XCircle, CheckCircle2 } from 'lucide-react';

type Cell = { ok: boolean; value: string };
type Row = { feature: string; typical: Cell; bp: Cell };

const rows: Row[] = [
  {
    feature: 'Water temperature',
    typical: { ok: false, value: 'Cold (60°F)' },
    bp: { ok: true, value: 'Hot (200°F+)' },
  },
  {
    feature: 'Mildew regrowth window',
    typical: { ok: false, value: '4 – 8 weeks' },
    bp: { ok: true, value: '12+ months' },
  },
  {
    feature: 'Crew model',
    typical: { ok: false, value: 'Subbed-out / day labor' },
    bp: { ok: true, value: 'In-house, same crew every job' },
  },
  {
    feature: 'Soft-wash technique on siding/roofs',
    typical: { ok: false, value: 'Cranks pressure, etches paint' },
    bp: { ok: true, value: 'Low-pressure soft wash, paint-safe' },
  },
  {
    feature: 'Surface cleaner attachment',
    typical: { ok: false, value: 'Wand only — leaves stripes' },
    bp: { ok: true, value: '20-inch surface cleaner — even result' },
  },
  {
    feature: 'Detergents',
    typical: { ok: false, value: 'Bleach in a pump sprayer' },
    bp: { ok: true, value: 'Surface-appropriate biodegradable mix' },
  },
  {
    feature: 'Landscaping protection',
    typical: { ok: false, value: 'Hopes for the best' },
    bp: { ok: true, value: 'Tarps + pre-rinse + post-rinse' },
  },
  {
    feature: 'Insurance',
    typical: { ok: false, value: 'Often uninsured' },
    bp: { ok: true, value: 'Fully insured, GL + WC' },
  },
  {
    feature: 'Estimate format',
    typical: { ok: false, value: 'Verbal "ballpark"' },
    bp: { ok: true, value: 'Written, itemized, line-by-line' },
  },
  {
    feature: 'Pricing surprise',
    typical: { ok: false, value: '"That\'s extra" mid-job' },
    bp: { ok: true, value: 'Final price = quoted price' },
  },
  {
    feature: 'Walkthrough at end',
    typical: { ok: false, value: 'Drives off when done' },
    bp: { ok: true, value: 'Walk every surface with you' },
  },
  {
    feature: 'Workmanship guarantee',
    typical: { ok: false, value: 'None' },
    bp: { ok: true, value: '2 years' },
  },
  {
    feature: 'Mildew-free guarantee',
    typical: { ok: false, value: 'None' },
    bp: { ok: true, value: '12 months — we re-treat free if it returns' },
  },
];

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

const rowVariants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
};

export function VsTypical() {
  return (
    <section
      id="vs-typical"
      className="relative bg-[#0a0a0a] py-28 overflow-hidden"
    >
      {/* Subtle ambient flourish */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.10]"
        style={{
          background:
            'radial-gradient(ellipse at 85% 15%, rgba(184,149,106,0.35), transparent 55%), radial-gradient(ellipse at 10% 90%, rgba(184,149,106,0.18), transparent 60%)',
        }}
      />

      <div className="relative mx-auto max-w-7xl px-6 md:px-10">
        {/* ---------- Header ---------- */}
        <motion.div {...fadeUp}>
          <p className="text-xs uppercase tracking-[0.3em] text-[#b8956a]">
            BRIDGEPOINTE vs. TYPICAL ATLANTA PRESSURE WASHER
          </p>
          <h2 className="mt-6 font-serif text-4xl md:text-5xl lg:text-6xl text-white font-bold leading-[1.05]">
            We&apos;re not in the same league.
          </h2>
          <p className="max-w-2xl mt-4 text-white/55 text-base md:text-lg leading-relaxed">
            13 things that separate Bridgepointe from a guy with a Home Depot
            rental and a Facebook ad.
          </p>
        </motion.div>

        {/* ---------- Matrix (Desktop) ---------- */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          className="mt-16 hidden md:block"
        >
          {/* Header row */}
          <div className="grid grid-cols-[1.4fr_1fr_1fr] gap-0">
            <div aria-hidden />
            <div className="bg-[#0c0c0c] border border-white/[0.06] px-5 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/40 opacity-70">
                TYPICAL ATLANTA PRESSURE WASHER
              </p>
            </div>
            <div className="bg-[#b8956a] border border-[#b8956a] px-5 py-4 flex items-center gap-2">
              <span className="text-black text-sm leading-none">✦</span>
              <p className="text-xs uppercase tracking-[0.2em] text-black font-semibold">
                BRIDGEPOINTE
              </p>
            </div>
          </div>

          {/* Body rows */}
          <div>
            {rows.map((row, i) => {
              const zebra = i % 2 === 0 ? 'bg-[#0d0d0d]' : 'bg-[#111]';
              return (
                <motion.div
                  key={row.feature}
                  variants={rowVariants}
                  className={`grid grid-cols-[1.4fr_1fr_1fr] border-b border-white/[0.04] ${zebra}`}
                >
                  {/* Feature label */}
                  <div className="px-5 py-4 flex items-center">
                    <p className="text-sm text-white/65">{row.feature}</p>
                  </div>

                  {/* Typical */}
                  <div className="px-5 py-4 flex items-start gap-3 opacity-70">
                    <XCircle
                      size={16}
                      className="text-[#f87171] shrink-0 mt-[3px]"
                    />
                    <p className="text-sm text-white/40 leading-snug">
                      {row.typical.value}
                    </p>
                  </div>

                  {/* Bridgepointe */}
                  <div className="px-5 py-4 flex items-start gap-3 border-l-2 border-[#b8956a]">
                    <CheckCircle2
                      size={16}
                      className="text-[#34d399] shrink-0 mt-[3px]"
                    />
                    <p className="text-sm text-white leading-snug">
                      {row.bp.value}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* ---------- Matrix (Mobile — card per row) ---------- */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          className="mt-12 md:hidden space-y-3"
        >
          {rows.map((row) => (
            <motion.div
              key={row.feature}
              variants={rowVariants}
              className="rounded-xl border border-white/[0.06] bg-[#0d0d0d] overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-white/[0.05] bg-[#111]">
                <p className="text-sm text-white/75 font-medium">
                  {row.feature}
                </p>
              </div>
              <div className="grid grid-cols-2 divide-x divide-white/[0.05]">
                {/* Typical */}
                <div className="px-4 py-4 opacity-70">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-white/35 mb-2">
                    Typical
                  </p>
                  <div className="flex items-start gap-2">
                    <XCircle
                      size={14}
                      className="text-[#f87171] shrink-0 mt-[3px]"
                    />
                    <p className="text-xs text-white/45 leading-snug">
                      {row.typical.value}
                    </p>
                  </div>
                </div>
                {/* Bridgepointe */}
                <div className="px-4 py-4 border-l-2 border-[#b8956a]">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-[#b8956a] mb-2">
                    Bridgepointe
                  </p>
                  <div className="flex items-start gap-2">
                    <CheckCircle2
                      size={14}
                      className="text-[#34d399] shrink-0 mt-[3px]"
                    />
                    <p className="text-xs text-white leading-snug">
                      {row.bp.value}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* ---------- Footer band ---------- */}
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="mt-16 md:mt-20 max-w-3xl"
        >
          <p className="italic text-white/50 text-base md:text-lg leading-relaxed">
            Yes, we charge more than the cheapest guy in your DMs.
          </p>
          <p className="mt-2 font-bold text-white text-lg md:text-xl leading-relaxed">
            We also don&apos;t have to come back in 6 weeks.
          </p>
          <div className="mt-8">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-full bg-[#b8956a] px-7 py-3.5 text-sm font-semibold uppercase tracking-[0.18em] text-black transition-all duration-300 hover:bg-[#c9a47a] hover:shadow-[0_10px_30px_-10px_rgba(184,149,106,0.6)]"
            >
              Get a real estimate
              <span aria-hidden>→</span>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

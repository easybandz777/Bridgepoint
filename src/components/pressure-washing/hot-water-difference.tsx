'use client';

import { motion } from 'framer-motion';
import {
  ThermometerSnowflake,
  ThermometerSun,
  XCircle,
  CheckCircle2,
  Star,
} from 'lucide-react';

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
};

export function HotWaterDifference() {
  return (
    <section
      id="difference"
      className="relative bg-[#0a0a0a] py-32 md:py-40 overflow-hidden"
    >
      {/* Ambient background flourish */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.18]"
        style={{
          background:
            'radial-gradient(ellipse at 80% 20%, rgba(248,113,113,0.25), transparent 55%), radial-gradient(ellipse at 15% 80%, rgba(56,189,248,0.18), transparent 55%)',
        }}
      />

      <div className="relative mx-auto max-w-7xl px-6 md:px-10">
        {/* ---------- MOVEMENT 1: The Promise ---------- */}
        <motion.div {...fadeUp} className="text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-[#38bdf8]">
            THE BRIDGEPOINTE DIFFERENCE
          </p>
          <h2 className="mt-6 font-serif text-4xl md:text-6xl lg:text-7xl text-white font-bold leading-[1.05]">
            Cold water just rinses.
          </h2>
          <p
            className="mt-3 font-serif text-4xl md:text-6xl lg:text-7xl text-[#f87171] font-bold leading-[1.05]"
            style={{ textShadow: '0 0 40px rgba(248,113,113,0.35)' }}
          >
            Hot water dissolves.
          </p>
        </motion.div>

        {/* ---------- MOVEMENT 2: Split-Screen Comparison ---------- */}
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="mt-24 grid md:grid-cols-2 rounded-3xl overflow-hidden border border-white/10 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)]"
        >
          {/* LEFT — Cold Water */}
          <div className="relative bg-gradient-to-br from-[#0c1929] to-[#0a0a0a] p-12 md:p-16 min-h-[600px] border-b md:border-b-0 md:border-r border-white/10">
            <div className="flex items-center gap-3">
              <ThermometerSnowflake size={48} className="text-[#38bdf8]" />
            </div>

            <div className="mt-8">
              <p className="font-serif text-3xl md:text-4xl text-white tracking-tight">
                COLD WATER
              </p>
              <p
                className="mt-4 font-mono text-5xl md:text-6xl text-[#38bdf8]"
                style={{ textShadow: '0 0 30px rgba(56,189,248,0.25)' }}
              >
                60°F
              </p>
              <p className="mt-4 text-sm md:text-base text-white/60 max-w-sm">
                What 95% of Atlanta pressure washers use
              </p>
            </div>

            <div className="my-10 h-px w-full bg-gradient-to-r from-transparent via-white/15 to-transparent" />

            <ul className="space-y-5">
              {[
                'Surfaces look clean for 6 weeks. Mildew comes back.',
                'Grease and oil get spread around, not removed.',
                'Takes twice as long. More water, more surface wear.',
              ].map((item) => (
                <li key={item} className="flex items-start gap-4">
                  <XCircle
                    size={22}
                    className="text-[#f87171] shrink-0 mt-[3px]"
                  />
                  <span className="text-white/80 text-base md:text-lg leading-relaxed">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* RIGHT — Hot Water (Bridgepointe) */}
          <div className="relative bg-gradient-to-br from-[#3a1208] via-[#1f0a05] to-[#0a0a0a] p-12 md:p-16 min-h-[600px]">
            {/* Heat haze accent */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-30"
              style={{
                background:
                  'radial-gradient(circle at 70% 0%, rgba(248,113,113,0.35), transparent 60%)',
              }}
            />

            <div className="relative">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <span
                    aria-hidden
                    className="absolute inset-0 rounded-full bg-[#f87171]/30 blur-xl animate-pulse"
                  />
                  <ThermometerSun
                    size={48}
                    className="relative text-[#f87171]"
                  />
                </div>
              </div>

              <div className="mt-8">
                <div className="flex items-center gap-3 flex-wrap">
                  <p className="font-serif text-3xl md:text-4xl text-white tracking-tight">
                    HOT WATER
                  </p>
                  <span className="inline-flex items-center gap-1 rounded-full border border-[#b8956a]/40 bg-[#b8956a]/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#b8956a]">
                    <Star size={10} className="fill-[#b8956a] text-[#b8956a]" />
                    Our Rig
                  </span>
                </div>
                <p
                  className="mt-4 font-mono text-5xl md:text-6xl text-[#f87171]"
                  style={{ textShadow: '0 0 35px rgba(248,113,113,0.55)' }}
                >
                  200°F+
                </p>
                <p className="mt-4 text-sm md:text-base text-white/65 max-w-sm">
                  What we just brought to Metro Atlanta
                </p>
              </div>

              <div className="my-10 h-px w-full bg-gradient-to-r from-transparent via-white/15 to-transparent" />

              <ul className="space-y-5">
                {[
                  'Kills mold and algae spores at the root. Stops 12+ months of regrowth.',
                  'Dissolves grease, oil, gum, and bug splatter on contact.',
                  'Cuts cleaning time roughly in half — less surface wear, deeper clean.',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-4">
                    <CheckCircle2
                      size={22}
                      className="text-[#34d399] shrink-0 mt-[3px]"
                    />
                    <span className="text-white/85 text-base md:text-lg leading-relaxed">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>

        {/* ---------- MOVEMENT 3: The Science Strip ---------- */}
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="mt-20 max-w-5xl mx-auto bg-[#0f0f0f] border border-white/10 rounded-2xl p-10 md:p-12"
        >
          <p className="text-xs uppercase tracking-[0.3em] text-[#b8956a]">
            WHY 200°F MATTERS
          </p>
          <p className="mt-6 font-serif text-xl md:text-2xl leading-relaxed text-white/85">
            At 200°F, water reaches the temperature where mildew, algae, and
            mold spores die at the cellular level — not just the surface bloom
            you see, but the root system embedded in your siding, deck, or
            concrete. That&rsquo;s why a Bridgepointe wash lasts a year. A
            cold-water wash lasts six weeks.
          </p>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                temp: '140°F',
                label: 'Bacteria die',
                color: '#38bdf8',
              },
              {
                temp: '180°F',
                label: 'Grease emulsifies',
                color: '#fbbf24',
              },
              {
                temp: '200°F+',
                label: 'Mold spores rupture',
                color: '#f87171',
              },
            ].map((stat) => (
              <div
                key={stat.temp}
                className="rounded-xl border border-white/10 bg-black/40 px-6 py-7 text-center"
              >
                <p
                  className="font-mono text-3xl md:text-4xl font-semibold"
                  style={{
                    color: stat.color,
                    textShadow: `0 0 25px ${stat.color}55`,
                  }}
                >
                  {stat.temp}
                </p>
                <p className="mt-3 text-[11px] md:text-xs uppercase tracking-[0.25em] text-white/50">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

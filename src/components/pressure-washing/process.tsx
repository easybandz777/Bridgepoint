'use client';

import { motion } from 'framer-motion';
import {
  ClipboardList,
  Shield,
  Flame,
  Droplets,
  Sparkles,
  Handshake,
  type LucideIcon,
} from 'lucide-react';

type Step = {
  n: string;
  title: string;
  duration: string;
  body: string;
  Icon: LucideIcon;
};

const steps: Step[] = [
  {
    n: '01',
    title: 'On-Site Walkthrough',
    duration: '20 min',
    body: 'We walk every surface with you. Identify mildew zones, soft surfaces that need a soft-wash approach, and anything fragile (windows, lights, planters) that needs masking.',
    Icon: ClipboardList,
  },
  {
    n: '02',
    title: 'Prep & Protect',
    duration: '30 – 60 min',
    body: 'Cover landscaping with breathable tarps. Mask outlets, fixtures, and door seals. Pre-rinse and pre-treat with a biodegradable surfactant on heavy-mildew surfaces.',
    Icon: Shield,
  },
  {
    n: '03',
    title: 'Hot Water + Detergent',
    duration: 'main wash',
    body: '200°F+ water plus a surface-appropriate detergent does the heavy lifting. Surface cleaner attachment on flat concrete; wand for vertical surfaces; soft-wash tip on painted/delicate surfaces.',
    Icon: Flame,
  },
  {
    n: '04',
    title: 'Soft Wash on Sensitive Surfaces',
    duration: 'as needed',
    body: 'Siding, painted wood, roof shingles, and stained surfaces never see high pressure. Low-pressure soft-wash chemistry kills the mildew without etching or stripping.',
    Icon: Droplets,
  },
  {
    n: '05',
    title: 'Final Rinse & Detail',
    duration: '30 min',
    body: 'Hot-water rinse from top to bottom. Hand-detail corners, eaves, and trim that the surface cleaner missed. Re-rinse landscaping. Pull every tarp.',
    Icon: Sparkles,
  },
  {
    n: '06',
    title: 'Walkthrough & 2-Year Guarantee',
    duration: '15 min',
    body: "We walk every surface with you again. If you're not happy with any part of it, we re-do it before the rig leaves. Two-year mildew-free guarantee starts today.",
    Icon: Handshake,
  },
];

export function Process() {
  return (
    <section
      id="process"
      className="relative bg-gradient-to-b from-[#0a0a0a] via-[#0c1216] to-[#0a0a0a] py-28 overflow-hidden"
    >
      <div className="relative mx-auto max-w-7xl px-6 md:px-10">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-xs uppercase tracking-[0.3em] text-[#38bdf8]">
            OUR PROCESS · SAME ON EVERY JOB
          </p>
          <h2 className="font-serif text-4xl md:text-5xl text-white mt-3">
            Six steps. No shortcuts.
          </h2>
          <p className="max-w-2xl mt-4 text-white/55 leading-relaxed">
            Hot-water rigs only matter if the prep is right. Here&apos;s exactly
            what happens between the moment we pull up and the moment we walk
            you through the result.
          </p>
        </motion.div>

        {/* ---------- MOBILE: vertical timeline (< lg) ---------- */}
        <div className="lg:hidden mt-14 relative">
          <ol className="space-y-6">
            {steps.map((step, i) => {
              const Icon = step.Icon;
              const isLast = i === steps.length - 1;
              return (
                <motion.li
                  key={step.n}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{
                    duration: 0.6,
                    delay: i * 0.08,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="relative flex"
                >
                  {/* Left rail: circle + connecting line */}
                  <div className="relative flex flex-col items-center mr-2">
                    <div
                      className="relative z-10 flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-[#f87171] to-[#b8956a] text-white font-serif text-base shadow-[0_8px_24px_-8px_rgba(248,113,113,0.6)]"
                      aria-hidden
                    >
                      <Icon className="size-5" />
                    </div>
                    {!isLast && (
                      <div
                        aria-hidden
                        className="absolute top-12 bottom-[-1.5rem] w-[2px] bg-gradient-to-b from-[#b8956a] to-[#b8956a]/0"
                      />
                    )}
                  </div>

                  {/* Content card */}
                  <div className="ml-4 flex-1 bg-[#1a1a1a] border border-white/[0.06] rounded-2xl p-6">
                    <div className="flex items-baseline gap-3">
                      <span className="font-serif text-sm text-[#b8956a]">
                        {step.n}
                      </span>
                      <span className="text-[10px] uppercase tracking-widest text-[#38bdf8] bg-[#38bdf8]/10 px-2 py-0.5 rounded-full">
                        {step.duration}
                      </span>
                    </div>
                    <h3 className="font-serif text-xl font-bold text-white mt-2">
                      {step.title}
                    </h3>
                    <p className="text-sm text-white/60 mt-2 leading-relaxed">
                      {step.body}
                    </p>
                  </div>
                </motion.li>
              );
            })}
          </ol>
        </div>

        {/* ---------- DESKTOP: horizontal stepper (lg+) ---------- */}
        <div className="hidden lg:block mt-20 relative">
          {/* Thin horizontal progress line behind cards */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-0 right-0 top-[5.25rem] h-px opacity-30"
            style={{
              background:
                'linear-gradient(to right, transparent 0%, #b8956a 12%, #f87171 50%, #b8956a 88%, transparent 100%)',
            }}
          />

          <ol className="grid grid-cols-6 gap-4 relative">
            {steps.map((step, i) => {
              const Icon = step.Icon;
              return (
                <motion.li
                  key={step.n}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{
                    duration: 0.7,
                    delay: i * 0.08,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="bg-[#101418] border border-white/[0.08] rounded-2xl p-6 hover:border-[#f87171]/30 transition-all"
                >
                  {/* Number + icon overlay */}
                  <div className="relative h-16">
                    <span
                      aria-hidden
                      className="absolute -top-2 left-0 font-serif text-7xl text-[#1f1f1f] leading-none select-none"
                    >
                      {step.n}
                    </span>
                    <Icon
                      aria-hidden
                      className="absolute top-3 left-3 size-10 text-[#f87171]"
                    />
                  </div>

                  <h3 className="font-serif text-lg font-bold text-white mt-4">
                    {step.title}
                  </h3>

                  <span className="inline-block text-[10px] uppercase tracking-widest text-[#38bdf8] bg-[#38bdf8]/10 px-2 py-0.5 rounded-full mt-2">
                    {step.duration}
                  </span>

                  <p className="text-sm text-white/55 mt-3 leading-relaxed">
                    {step.body}
                  </p>
                </motion.li>
              );
            })}
          </ol>
        </div>

        {/* ---------- Reassurance band ---------- */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mt-16 text-center"
        >
          <p className="font-serif italic text-2xl md:text-3xl text-white/85 max-w-3xl mx-auto leading-snug">
            &ldquo;Every step is in the estimate. No surprise add-ons. No
            &lsquo;oh that&apos;s extra&rsquo;.&rdquo;
          </p>
          <p className="mt-4 text-xs uppercase tracking-widest text-[#b8956a]">
            — how we quote every job
          </p>
        </motion.div>
      </div>
    </section>
  );
}

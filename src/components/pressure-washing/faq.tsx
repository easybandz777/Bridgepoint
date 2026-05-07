'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    q: 'Is hot water actually better than cold water?',
    a: 'Significantly, on the surfaces that matter. Cold water moves dirt around — it doesn’t kill mildew, it doesn’t dissolve grease, and it doesn’t break the molecular bond on tire residue or oil. Water at 200°F+ does all three. Cold water on your house lasts about 6 weeks before the mildew comes back. A hot-water wash with mildewcide lasts 12+ months.',
  },
  {
    q: 'What’s the difference between pressure washing and soft washing?',
    a: 'Pressure washing uses high pressure to physically blast surfaces — appropriate for concrete, brick, stone. Soft washing uses low pressure (think garden-hose force) plus surface-appropriate chemistry to clean delicate surfaces — siding, painted wood, roof shingles, stained surfaces. Bridgepointe does both, and we know which one to use on each surface. Most “pressure washing” companies crank pressure on everything and damage paint, shingles, and wood grain doing it.',
  },
  {
    q: 'Will pressure washing damage my paint, siding, or roof?',
    a: 'Not when it’s done right. Painted wood and vinyl siding always get soft-washed at low pressure. Roof shingles always get soft-washed — high pressure on shingles strips the granules and voids most warranties. Brick and concrete can take higher pressure. We assess every surface during the on-site walkthrough.',
  },
  {
    q: 'How much does a typical job cost?',
    a: 'Whole-house soft wash starts at $250. Driveway with surface cleaner starts at $125. Roof soft wash starts at $400. Decks, fences, patios, and concrete are quoted by surface area or per-job. Bundles save real money — house + driveway from $325, full exterior package from $700. We provide a written, itemized estimate before any work starts.',
  },
  {
    q: 'How long does the mildew stay gone?',
    a: '12+ months on our standard soft wash with mildewcide pre-treat. We back that with a mildew-free guarantee — if mildew returns within the first year on the same surfaces, we re-treat free. (Standard residential surfaces only, not roofs, which carry their own 12-month warranty.)',
  },
  {
    q: 'Do you do commercial accounts? Restaurants? Property managers?',
    a: 'Yes — and our hot-water rig is the difference-maker for commercial. Hot water plus a degreaser dissolves the kind of buildup cold-water rigs just spread around: dumpster pads, kitchen exhaust pads, gas station forecourts, parking deck oil drippings. We book monthly and quarterly recurring contracts with built-in price locks. Reach out for a walkthrough.',
  },
  {
    q: 'How often should I have my house and driveway pressure washed?',
    a: 'In Atlanta’s humidity, once a year keeps mildew under control on most surfaces. Driveways tolerate every 18 – 24 months unless they get heavy traffic. Decks and fences love an annual wash plus a re-stain every 3 – 5 years. We’ll tell you honestly — not everything needs annual washing, and we won’t upsell something you don’t need.',
  },
  {
    q: 'Will the chemicals hurt my plants or pets?',
    a: 'We use biodegradable detergents at appropriate dilution. Landscaping gets pre-rinsed before any chemistry hits the surface, covered with breathable tarps during the wash, and rinsed again afterward. Pets should stay inside while we work, but the surfaces are safe to walk on as soon as we’re done rinsing.',
  },
  {
    q: 'Are you insured?',
    a: 'Yes. General liability and workers’ comp, both verifiable. We’ll send a current COI on request before any job — most professional property managers ask for it, and we have it ready.',
  },
  {
    q: 'When can you start?',
    a: 'Free estimate within 48 hours of your call. Job typically scheduled within 1 – 2 weeks of estimate approval. Faster turnaround on smaller residential jobs (driveways especially). Commercial recurring accounts get priority scheduling once the contract is set.',
  },
];

export function PWFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-28 bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-[#b8956a]">FAQ</p>
          <h2 className="font-serif text-4xl md:text-5xl text-white mt-4">
            Things people actually ask.
          </h2>
          <p className="max-w-2xl mt-4 text-white/55 mx-auto">
            If something here doesn&apos;t answer your question, just call. We pick up. (862) 421-8973.
          </p>
        </div>

        <div className="flex flex-col gap-3 mt-12 max-w-3xl mx-auto">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            const panelId = `pw-faq-panel-${index}`;
            const headerId = `pw-faq-header-${index}`;

            return (
              <div
                key={index}
                className="bg-[#0f0f0f] border border-white/[0.06] rounded-2xl overflow-hidden"
              >
                <h3>
                  <button
                    id={headerId}
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    className="w-full p-6 flex items-center justify-between text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#b8956a] focus-visible:ring-inset"
                  >
                    <span className="font-serif text-base md:text-lg font-semibold text-white pr-4">
                      {faq.q}
                    </span>
                    <ChevronDown
                      size={20}
                      className={`text-[#b8956a] flex-shrink-0 transition-transform duration-300 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                </h3>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={headerId}
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isOpen ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="px-6 pb-6">
                    <div className="border-t border-white/[0.04] pt-5">
                      <p className="text-sm md:text-base text-white/65 leading-relaxed">
                        {faq.a}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-16">
          <p className="font-serif text-xl text-white">Still have questions?</p>
          <a
            href="tel:8624218973"
            className="inline-block mt-2 text-[#b8956a] font-mono text-lg hover:text-[#d4ad7f] transition-colors"
          >
            (862) 421-8973 — we pick up.
          </a>
        </div>
      </div>
    </section>
  );
}

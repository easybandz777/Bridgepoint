'use client';

import { Section } from '@/components/ui/section';
import { AnimatedSection } from '@/components/shared/animated-section';
import { SITE_CONFIG } from '@/lib/constants';

const stats = [
  {
    value: `${SITE_CONFIG.stats.yearsExperience}`,
    unit: 'yrs',
    label: 'Years of Experience',
    description: 'Expert craftsmen in the trade',
  },
  {
    value: `${SITE_CONFIG.stats.projectsCompleted}`,
    unit: '+',
    label: 'Projects Completed',
    description: 'Across Austin and beyond',
  },
  {
    value: SITE_CONFIG.stats.averageProjectValue,
    unit: '',
    label: 'Average Project Value',
    description: 'Premium scope, premium result',
  },
  {
    value: SITE_CONFIG.stats.satisfactionRate,
    unit: '',
    label: 'Client Satisfaction',
    description: 'No exceptions, no compromises',
  },
];

export function CredibilityStrip() {
  return (
    <Section variant="dark">
      <div className="grid grid-cols-2 gap-x-8 gap-y-12 md:grid-cols-4">
        {stats.map((stat, index) => (
          <AnimatedSection key={stat.label} delay={index * 0.1}>
            <div className="text-center relative">
              {/* Vertical separator on desktop */}
              {index > 0 && (
                <div className="hidden md:block absolute -left-4 top-1/2 -translate-y-1/2 h-10 w-px bg-warm-white/10" />
              )}

              {/* Number */}
              <p className="font-serif text-4xl font-bold text-gold md:text-5xl">
                {stat.value}
                {stat.unit && (
                  <span className="font-serif text-2xl text-gold/70 md:text-3xl">{stat.unit}</span>
                )}
              </p>

              {/* Label */}
              <p className="mt-3 font-sans text-xs font-semibold uppercase tracking-[0.2em] text-warm-white/55">
                {stat.label}
              </p>

              {/* Description */}
              <p className="mt-1.5 font-sans text-xs leading-relaxed text-warm-white/30">
                {stat.description}
              </p>
            </div>
          </AnimatedSection>
        ))}
      </div>
    </Section>
  );
}

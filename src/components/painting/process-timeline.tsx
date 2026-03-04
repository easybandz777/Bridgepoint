'use client';

import { AnimatedSection } from '@/components/shared/animated-section';
import { paintingProcess } from '@/content/services';

export function ProcessTimeline() {
  return (
    <div className="mt-16">
      <AnimatedSection>
        <p className="font-sans text-xs font-semibold uppercase tracking-[0.3em] text-gold">
          Our Process
        </p>
        <h2 className="mt-4 font-serif text-4xl font-bold text-charcoal md:text-5xl">
          How We Work
        </h2>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-slate">
          Every project follows a proven process designed to deliver
          exceptional results without surprises.
        </p>
      </AnimatedSection>

      <div className="relative mt-16">
        {/* Vertical line connector */}
        <div className="absolute left-6 top-0 hidden h-full w-px bg-gold/20 md:block" />

        <div className="space-y-12">
          {paintingProcess.map((step, index) => (
            <AnimatedSection
              key={step.number}
              direction="left"
              delay={index * 0.1}
            >
              <div className="flex gap-6 md:gap-8">
                {/* Step number */}
                <div className="relative flex h-12 w-12 shrink-0 items-center justify-center bg-charcoal">
                  <span className="font-serif text-lg font-bold text-gold">
                    {step.number}
                  </span>
                </div>

                {/* Content */}
                <div className="pt-1">
                  <h3 className="font-serif text-xl font-bold text-charcoal">
                    {step.title}
                  </h3>
                  <p className="mt-2 max-w-lg text-sm leading-relaxed text-slate">
                    {step.description}
                  </p>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </div>
  );
}

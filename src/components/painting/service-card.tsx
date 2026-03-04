'use client';

import { AnimatedSection } from '@/components/shared/animated-section';
import type { PaintingService } from '@/content/services';

interface ServiceCardProps {
  service: PaintingService;
  index: number;
}

export function ServiceCard({ service, index }: ServiceCardProps) {
  return (
    <AnimatedSection delay={index * 0.1}>
      <div className="group overflow-hidden bg-white">
        <div className="overflow-hidden">
          <img
            src={service.image}
            alt={service.title}
            className="h-56 w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </div>
        <div className="p-6">
          <h3 className="font-serif text-xl font-bold text-charcoal">
            {service.title}
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-slate">
            {service.description}
          </p>
          <ul className="mt-4 space-y-2">
            {service.features.map((feature) => (
              <li
                key={feature}
                className="flex items-start gap-2 text-sm text-slate-light"
              >
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gold" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AnimatedSection>
  );
}

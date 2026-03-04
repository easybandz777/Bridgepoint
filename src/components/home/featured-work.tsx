'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Section } from '@/components/ui/section';
import { Badge } from '@/components/ui/badge';
import { AnimatedSection } from '@/components/shared/animated-section';
import { getFeaturedProjects } from '@/content/projects';

export function FeaturedWork() {
  const featured = getFeaturedProjects();

  return (
    <Section variant="alternate" spacious>
      {/* Header */}
      <AnimatedSection>
        <p className="font-sans text-xs font-semibold uppercase tracking-[0.35em] text-gold">
          Selected Projects
        </p>
        <div className="gold-rule-left mt-5" />
        <h2 className="mt-6 font-serif text-4xl font-bold text-charcoal md:text-5xl">
          Craftsmanship That Speaks
        </h2>
        <p className="mt-5 max-w-lg text-base leading-relaxed text-slate-light">
          A curated selection from our portfolio. Each project reflects
          an unwavering commitment to quality and client vision.
        </p>
      </AnimatedSection>

      {/* Project Grid */}
      <div className="mt-16 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {featured.map((project, index) => (
          <AnimatedSection
            key={project.slug}
            delay={index * 0.12}
            className={index === 0 ? 'md:col-span-2 lg:col-span-2' : ''}
          >
            <Link
              href={`/portfolio/${project.slug}`}
              className="group block"
            >
              <div className="relative overflow-hidden shadow-lg shadow-charcoal/8 transition-shadow duration-500 group-hover:shadow-xl group-hover:shadow-charcoal/15">
                <img
                  src={project.image}
                  alt={project.title}
                  className={`w-full object-cover transition-transform duration-700 group-hover:scale-105 ${index === 0 ? 'h-[26rem]' : 'h-72'
                    }`}
                />

                {/* Always-visible subtle gradient at bottom */}
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 via-transparent to-transparent" />

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-charcoal/20 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                {/* Caption — always visible at bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-1 transition-transform duration-400 group-hover:translate-y-0">
                  <Badge>{project.categoryLabel}</Badge>
                  <h3 className="mt-2 font-serif text-xl font-bold leading-snug text-white md:text-2xl">
                    {project.title}
                  </h3>
                  <span className="mt-2 inline-flex items-center gap-1.5 font-sans text-xs font-semibold uppercase tracking-widest text-gold opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:gap-2.5">
                    View Project <ArrowRight size={12} />
                  </span>
                </div>
              </div>
            </Link>
          </AnimatedSection>
        ))}
      </div>

      {/* View All */}
      <AnimatedSection delay={0.4} className="mt-14 text-center">
        <Link
          href="/portfolio"
          className="group inline-flex items-center gap-3 border border-charcoal/20 bg-white px-8 py-4 font-sans text-xs font-semibold uppercase tracking-[0.2em] text-charcoal shadow-sm transition-all duration-300 hover:border-gold hover:text-gold hover:shadow-md"
        >
          View All Projects <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-0.5" />
        </Link>
      </AnimatedSection>
    </Section>
  );
}

'use client';

import Link from 'next/link';
import { Star } from 'lucide-react';
import { AnimatedSection } from '@/components/shared/animated-section';
import type { Testimonial } from '@/content/testimonials';

interface TestimonialCardProps {
  testimonial: Testimonial;
  index: number;
}

export function TestimonialCard({
  testimonial,
  index,
}: TestimonialCardProps) {
  return (
    <AnimatedSection delay={index * 0.1}>
      <div className="flex h-full flex-col bg-white p-8">
        {/* Stars */}
        <div className="flex gap-1">
          {Array.from({ length: testimonial.rating }).map((_, i) => (
            <Star
              key={i}
              size={14}
              className="fill-gold text-gold"
            />
          ))}
        </div>

        {/* Quote */}
        <blockquote className="mt-4 flex-1 text-base italic leading-relaxed text-slate">
          &ldquo;{testimonial.quote}&rdquo;
        </blockquote>

        {/* Author */}
        <div className="mt-6 flex items-center gap-4 border-t border-charcoal/10 pt-6">
          {testimonial.image && (
            <img
              src={testimonial.image}
              alt={testimonial.author}
              className="h-12 w-12 rounded-full object-cover"
            />
          )}
          <div>
            <p className="font-sans text-sm font-semibold text-charcoal">
              {testimonial.author}
            </p>
            <p className="text-xs text-slate-light">
              {testimonial.projectType} &middot; {testimonial.location}
            </p>
          </div>
        </div>

        {/* Project link */}
        {testimonial.projectSlug && (
          <Link
            href={`/portfolio/${testimonial.projectSlug}`}
            className="mt-4 font-sans text-xs font-medium uppercase tracking-wider text-gold transition-colors hover:text-gold-dark"
          >
            View Project
          </Link>
        )}
      </div>
    </AnimatedSection>
  );
}

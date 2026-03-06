'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { FilterBar } from '@/components/portfolio/filter-bar';
import { ProjectCard } from '@/components/portfolio/project-card';
import { projects, type ProjectCategory } from '@/content/projects';
import { AnimatedSection } from '@/components/shared/animated-section';

type FilterOption = ProjectCategory | 'all';

/** Map from portfolio category to gallery folder name */
const CATEGORY_TO_GALLERY: Partial<Record<ProjectCategory, string>> = {
  bathroom: 'bathrooms',
  kitchen: 'kitchens',
  painting: 'painting',
  'full-remodel': 'full-remodel',
  custom: 'custom',
  flooring: 'flooring',
};

interface ProjectGridProps {
  /** Pre-fetched gallery images keyed by gallery folder name */
  galleryImages?: Record<string, string[]>;
}

export function ProjectGrid({ galleryImages = {} }: ProjectGridProps) {
  const [filter, setFilter] = useState<FilterOption>('all');

  const filtered = useMemo(() => {
    if (filter === 'all') return projects;
    return projects.filter((p) => p.category === filter);
  }, [filter]);

  const galleryFolder = filter !== 'all' ? CATEGORY_TO_GALLERY[filter] : undefined;
  const categoryGalleryImages = galleryFolder ? (galleryImages[galleryFolder] ?? []) : [];

  return (
    <div>
      <FilterBar active={filter} onChange={setFilter} />

      {/* Project cards */}
      {filtered.length > 0 && (
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((project, index) => (
            <ProjectCard
              key={project.slug}
              project={project}
              index={index}
            />
          ))}
        </div>
      )}

      {filtered.length === 0 && categoryGalleryImages.length === 0 && (
        <p className="mt-12 text-center text-sm text-slate">
          No projects found in this category.
        </p>
      )}

      {/* Full photo gallery for the selected category */}
      {categoryGalleryImages.length > 0 && (
        <div className="mt-16">
          <AnimatedSection>
            <p className="font-sans text-xs font-semibold uppercase tracking-[0.3em] text-gold">
              Photo Gallery
            </p>
            <h2 className="mt-2 font-serif text-2xl font-bold text-charcoal">
              {categoryGalleryImages.length} Photos
            </h2>
          </AnimatedSection>
          <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {categoryGalleryImages.map((src, i) => (
              <li key={src} className="overflow-hidden">
                <AnimatedSection delay={i * 0.02}>
                  <div className="relative aspect-[4/3] overflow-hidden bg-charcoal/5">
                    <Image
                      src={src}
                      alt={`Bathroom project photo ${i + 1}`}
                      fill
                      className="object-cover transition-transform duration-500 hover:scale-105"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                  </div>
                </AnimatedSection>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

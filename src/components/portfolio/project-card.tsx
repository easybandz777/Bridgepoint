'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { AnimatedSection } from '@/components/shared/animated-section';
import type { Project } from '@/content/projects';

interface ProjectCardProps {
  project: Project;
  index: number;
}

export function ProjectCard({ project, index }: ProjectCardProps) {
  return (
    <AnimatedSection delay={index * 0.08}>
      <Link
        href={`/portfolio/${project.slug}`}
        className="group block"
      >
        <div className="relative overflow-hidden">
          <img
            src={project.image}
            alt={project.title}
            className="h-72 w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          <div className="absolute bottom-0 left-0 right-0 translate-y-2 p-5 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
            <Badge>{project.categoryLabel}</Badge>
          </div>
        </div>
        <div className="mt-4">
          <h3 className="font-serif text-lg font-bold text-charcoal transition-colors group-hover:text-gold">
            {project.title}
          </h3>
          <p className="mt-1 text-sm text-slate line-clamp-2">
            {project.description}
          </p>
        </div>
      </Link>
    </AnimatedSection>
  );
}

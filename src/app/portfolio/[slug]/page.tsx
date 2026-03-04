import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Section } from '@/components/ui/section';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AnimatedSection } from '@/components/shared/animated-section';
import { projects, getProjectBySlug } from '@/content/projects';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return projects.map((project) => ({
    slug: project.slug,
  }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) return { title: 'Project Not Found' };

  return {
    title: project.title,
    description: project.description,
  };
}

export default async function ProjectDetailPage({
  params,
}: PageProps) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) notFound();

  return (
    <>
      {/* Hero */}
      <section className="relative flex min-h-[60vh] items-end overflow-hidden pb-16 pt-32">
        <div className="absolute inset-0">
          <img
            src={project.image}
            alt={project.title}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-charcoal/60" />
        </div>
        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
          <Link
            href="/portfolio"
            className="mb-6 inline-flex items-center gap-2 font-sans text-sm font-medium uppercase tracking-wider text-white/60 transition-colors hover:text-white"
          >
            <ArrowLeft size={16} /> Back to Portfolio
          </Link>
          <Badge>{project.categoryLabel}</Badge>
          <h1 className="mt-4 font-serif text-5xl font-bold text-white md:text-6xl">
            {project.title}
          </h1>
        </div>
      </section>

      {/* Project Details */}
      <Section variant="default" spacious>
        <div className="grid gap-12 lg:grid-cols-3">
          {/* Description */}
          <div className="lg:col-span-2">
            <AnimatedSection>
              <h2 className="font-serif text-3xl font-bold text-charcoal">
                About This Project
              </h2>
              <p className="mt-6 text-base leading-relaxed text-slate">
                {project.description}
              </p>
            </AnimatedSection>

            {/* Gallery */}
            <AnimatedSection delay={0.2} className="mt-12">
              <div className="grid gap-4 sm:grid-cols-2">
                {project.gallery.map((image, index) => (
                  <div key={index} className="overflow-hidden">
                    <img
                      src={image}
                      alt={`${project.title} - Image ${index + 1}`}
                      className="h-64 w-full object-cover transition-transform duration-700 hover:scale-105"
                    />
                  </div>
                ))}
              </div>
            </AnimatedSection>
          </div>

          {/* Sidebar */}
          <div>
            <AnimatedSection direction="right" delay={0.1}>
              <div className="space-y-6 bg-cream p-8">
                <div>
                  <p className="font-sans text-xs font-semibold uppercase tracking-widest text-gold">
                    Scope
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-slate">
                    {project.scope}
                  </p>
                </div>
                <div className="border-t border-charcoal/10 pt-6">
                  <p className="font-sans text-xs font-semibold uppercase tracking-widest text-gold">
                    Timeline
                  </p>
                  <p className="mt-2 text-sm text-charcoal">
                    {project.timeline}
                  </p>
                </div>
                <div className="border-t border-charcoal/10 pt-6">
                  <p className="font-sans text-xs font-semibold uppercase tracking-widest text-gold">
                    Investment
                  </p>
                  <p className="mt-2 text-sm text-charcoal">
                    {project.investmentRange}
                  </p>
                </div>

                {project.testimonial && (
                  <div className="border-t border-charcoal/10 pt-6">
                    <blockquote className="text-sm italic leading-relaxed text-slate">
                      &ldquo;{project.testimonial.quote}&rdquo;
                    </blockquote>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-gold">
                      &mdash; {project.testimonial.author}
                    </p>
                  </div>
                )}

                <div className="pt-4">
                  <Link href="/contact">
                    <Button className="w-full">
                      Discuss Your Project
                    </Button>
                  </Link>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </Section>
    </>
  );
}

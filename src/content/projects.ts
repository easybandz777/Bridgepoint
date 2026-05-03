import { PROJECT_IMAGES } from '@/lib/images';

export type ProjectCategory =
  | 'painting'
  | 'kitchen'
  | 'bathroom'
  | 'tile'
  | 'flooring';

export interface Project {
  slug: string;
  title: string;
  category: ProjectCategory;
  categoryLabel: string;
  description: string;
  scope: string;
  timeline: string;
  investmentRange: string;
  /** Primary image for cards and hero */
  image: string;
  /** Additional gallery images for detail page */
  gallery: string[];
  testimonial?: {
    quote: string;
    author: string;
  };
  featured: boolean;
}

/**
 * Portfolio project data. Currently static -- designed to be
 * swapped for database queries when backend is implemented.
 */
export const projects: Project[] = [
  {
    slug: 'barton-creek-kitchen',
    title: 'Barton Creek Kitchen',
    category: 'kitchen',
    categoryLabel: 'Kitchen',
    description:
      'A chef-grade kitchen with custom cabinetry, stone countertops, and hand-laid tile backsplash. Designed for serious cooking and elegant entertaining.',
    scope: 'Complete kitchen renovation with custom cabinetry, stone surfaces, and premium appliance integration',
    timeline: '4 months',
    investmentRange: '$175,000 - $210,000',
    image: PROJECT_IMAGES['barton-creek-kitchen'].main,
    gallery: PROJECT_IMAGES['barton-creek-kitchen'].gallery,
    testimonial: {
      quote:
        'Our kitchen is now the heart of our home. The craftsmanship in every joint and finish is beyond what we imagined possible.',
      author: 'Michael & Sarah Chen',
    },
    featured: true,
  },
  {
    slug: 'lake-travis-master-bath',
    title: 'Lake Travis Master Bath',
    category: 'bathroom',
    categoryLabel: 'Bathroom',
    description:
      'A spa-inspired master bathroom featuring book-matched stone walls, a freestanding soaking tub, and a frameless glass walk-in shower with custom tile work.',
    scope: 'Master bathroom expansion and complete renovation',
    timeline: '3 months',
    investmentRange: '$120,000 - $145,000',
    image: PROJECT_IMAGES['lake-travis-master-bath'].main,
    gallery: PROJECT_IMAGES['lake-travis-master-bath'].gallery,
    featured: true,
  },
  {
    slug: 'artisan-tile-work',
    title: 'Artisan Tile Installations',
    category: 'tile',
    categoryLabel: 'Tile Work',
    description:
      'Hand-laid tile installations across showers, floors, backsplashes, and accent walls. Precision layout, perfect grout lines, and meticulous waterproofing on every project.',
    scope: 'Custom tile design and installation including shower surrounds, floors, backsplashes, and decorative inlays',
    timeline: '1 - 4 weeks per project',
    investmentRange: '$8,000 - $45,000',
    image: PROJECT_IMAGES['artisan-tile-work'].main,
    gallery: PROJECT_IMAGES['artisan-tile-work'].gallery,
    testimonial: {
      quote:
        'Every tile is set perfectly. The detail in our shower niche and herringbone floor is the kind of work you only see in magazines.',
      author: 'The Patel Family',
    },
    featured: true,
  },
  {
    slug: 'tarrytown-interior-painting',
    title: 'Tarrytown Interior Repaint',
    category: 'painting',
    categoryLabel: 'Painting',
    description:
      'Complete interior repaint of a historic home. Meticulous prep work to preserve original trim details, with a sophisticated neutral palette that honors the home\'s character.',
    scope: 'Full interior painting including trim, ceilings, and specialty finishes on accent walls',
    timeline: '3 weeks',
    investmentRange: '$18,000 - $24,000',
    image: PROJECT_IMAGES['tarrytown-interior-painting'].main,
    gallery: PROJECT_IMAGES['tarrytown-interior-painting'].gallery,
    testimonial: {
      quote:
        'The attention to prep work was remarkable. Our 1920s trim looks better than it did when the house was built.',
      author: 'David & Lisa Thompson',
    },
    featured: false,
  },
  {
    slug: 'rollingwood-exterior',
    title: 'Rollingwood Exterior Refresh',
    category: 'painting',
    categoryLabel: 'Painting',
    description:
      'A complete exterior transformation. Power-washed, meticulously prepped, and finished with a curated three-tone color scheme that elevated the home\'s curb appeal dramatically.',
    scope: 'Full exterior painting, trim, shutters, and front door specialty finish',
    timeline: '2 weeks',
    investmentRange: '$14,000 - $18,000',
    image: PROJECT_IMAGES['rollingwood-exterior'].main,
    gallery: PROJECT_IMAGES['rollingwood-exterior'].gallery,
    featured: false,
  },
  {
    slug: 'bee-cave-cabinet-refinishing',
    title: 'Bee Cave Cabinet Refinishing',
    category: 'painting',
    categoryLabel: 'Painting',
    description:
      'Transformed dated oak cabinets with a hand-brushed two-tone finish. Soft-close hardware upgrade, new pulls, and a glaze that added depth and sophistication.',
    scope: 'Full kitchen and butler pantry cabinet refinishing',
    timeline: '10 days',
    investmentRange: '$12,000 - $16,000',
    image: PROJECT_IMAGES['bee-cave-cabinet-refinishing'].main,
    gallery: PROJECT_IMAGES['bee-cave-cabinet-refinishing'].gallery,
    featured: false,
  },
  {
    slug: 'custom-flooring-installation',
    title: 'Custom Flooring Installation',
    category: 'flooring',
    categoryLabel: 'Flooring',
    description:
      'Premium hardwood and engineered flooring installation. Precision-laid with meticulous attention to transitions, subfloor prep, and finishing details.',
    scope: 'Full home flooring replacement and refinishing',
    timeline: '2 weeks',
    investmentRange: '$15,000 - $35,000',
    image: '/images/gallery/flooring/20210218_171520.jpg',
    gallery: [
      '/images/gallery/flooring/20200810_175717.jpg',
      '/images/gallery/flooring/20200811_102238.jpg',
      '/images/gallery/flooring/20200920_132234.jpg',
      '/images/gallery/flooring/20201007_133347.jpg',
    ],
    featured: false,
  },
];

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

export function getFeaturedProjects(): Project[] {
  return projects.filter((p) => p.featured);
}

export function getProjectsByCategory(
  category: ProjectCategory
): Project[] {
  return projects.filter((p) => p.category === category);
}

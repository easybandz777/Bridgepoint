import { PROJECT_IMAGES } from '@/lib/images';

export type ProjectCategory =
  | 'painting'
  | 'kitchen'
  | 'bathroom'
  | 'full-remodel'
  | 'custom'
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
 * Images are themed (remodeling, painting, interiors) via lib/images.
 */
export const projects: Project[] = [
  {
    slug: 'westlake-hills-estate',
    title: 'Westlake Hills Estate',
    category: 'full-remodel',
    categoryLabel: 'Full Remodel',
    description:
      'A complete transformation of a 4,800 sq ft estate. Every room reimagined with custom millwork, imported stone, and hand-finished surfaces throughout.',
    scope: 'Full interior remodel including kitchen, three bathrooms, living areas, and custom built-ins',
    timeline: '8 months',
    investmentRange: '$285,000 - $320,000',
    image: PROJECT_IMAGES['westlake-hills-estate'].main,
    gallery: PROJECT_IMAGES['westlake-hills-estate'].gallery,
    testimonial: {
      quote:
        'The level of craftsmanship is extraordinary. Every corner of our home tells a story of meticulous care and artistry.',
      author: 'The Harrison Family',
    },
    featured: true,
  },
  {
    slug: 'barton-creek-kitchen',
    title: 'Barton Creek Kitchen',
    category: 'kitchen',
    categoryLabel: 'Kitchen',
    description:
      'A chef-grade kitchen with custom walnut cabinetry, quartzite countertops, and hand-laid herringbone tile. Designed for both serious cooking and elegant entertaining.',
    scope: 'Complete kitchen renovation with structural modifications, custom cabinetry, and premium appliance integration',
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
      'A spa-inspired master bathroom featuring book-matched marble walls, a freestanding soaking tub, and a frameless glass steam shower with multiple body sprays.',
    scope: 'Master bathroom expansion and complete renovation',
    timeline: '3 months',
    investmentRange: '$120,000 - $145,000',
    image: PROJECT_IMAGES['lake-travis-master-bath'].main,
    gallery: PROJECT_IMAGES['lake-travis-master-bath'].gallery,
    featured: true,
  },
  {
    slug: 'tarrytown-interior-painting',
    title: 'Tarrytown Victorian Interior',
    category: 'painting',
    categoryLabel: 'Painting',
    description:
      'Complete interior repaint of a historic Victorian home. Meticulous prep work to preserve original trim details, with a sophisticated neutral palette that honors the home\'s character.',
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
    slug: 'clarksville-custom-library',
    title: 'Clarksville Custom Library',
    category: 'custom',
    categoryLabel: 'Custom',
    description:
      'A floor-to-ceiling custom library with rolling ladder, integrated lighting, and hand-finished shelving. Built entirely on-site from select-grade white oak.',
    scope: 'Custom built-in library with concealed storage and integrated desk',
    timeline: '6 weeks',
    investmentRange: '$65,000 - $85,000',
    image: PROJECT_IMAGES['clarksville-custom-library'].main,
    gallery: PROJECT_IMAGES['clarksville-custom-library'].gallery,
    testimonial: {
      quote:
        'This library is a work of art. Friends walk in and their jaw drops. The rolling ladder alone is a conversation piece.',
      author: 'Dr. Rebecca Owens',
    },
    featured: false,
  },
  {
    slug: 'bee-cave-cabinet-refinishing',
    title: 'Bee Cave Cabinet Refinishing',
    category: 'painting',
    categoryLabel: 'Painting',
    description:
      'Transformed dated oak cabinets into a stunning two-tone finish. Soft-close hardware upgrade, new pulls, and a hand-brushed glaze that added depth and sophistication.',
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
    image: '/images/gallery/flooring/20210218_171520.jpg', // Using one of the uploaded images as the project hero
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

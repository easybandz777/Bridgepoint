import { IMAGES } from '@/lib/images';

export interface PaintingService {
  id: string;
  title: string;
  description: string;
  features: string[];
  image: string;
}

export interface SelectService {
  id: string;
  title: string;
  description: string;
  startingAt: string;
  image: string;
}

export interface ProcessStep {
  number: number;
  title: string;
  description: string;
}

/**
 * Service data. Currently static -- designed to be swapped
 * for database queries when backend is implemented.
 * Images are themed (interior, exterior, cabinets, etc.) via lib/images.
 */
export const paintingServices: PaintingService[] = [
  {
    id: 'interior',
    title: 'Interior Painting',
    description:
      'From single accent walls to whole-home transformations. Meticulous surface preparation, premium paints, and flawless execution on walls, ceilings, and trim.',
    features: [
      'Thorough surface preparation and repair',
      'Premium Benjamin Moore and Sherwin-Williams paints',
      'Clean, crisp lines on all trim and transitions',
      'Furniture protection and post-project cleanup',
    ],
    image: IMAGES.interiorPainting,
  },
  {
    id: 'exterior',
    title: 'Exterior Painting',
    description:
      'Restore curb appeal and protect your investment. Full power washing, surface repair, caulking, and expertly applied coatings built to withstand the Texas climate.',
    features: [
      'Complete power washing and prep',
      'Wood rot repair and surface restoration',
      'Weather-resistant premium coatings',
      'Custom color consultation included',
    ],
    image: IMAGES.exteriorPainting,
  },
  {
    id: 'cabinets',
    title: 'Cabinet Refinishing',
    description:
      'Transform your kitchen without the full remodel. Our multi-step refinishing process delivers a factory-smooth finish that rivals brand-new custom cabinetry.',
    features: [
      'Full degreasing and sanding process',
      'Spray-applied conversion varnish',
      'Hardware upgrade options',
      'Two-tone and glazed finish options',
    ],
    image: IMAGES.cabinetRefinishing,
  },
  {
    id: 'specialty',
    title: 'Specialty Finishes',
    description:
      'Venetian plaster, limewash, faux finishes, and decorative techniques that add depth, texture, and character to feature walls and architectural elements.',
    features: [
      'Venetian plaster and lime wash',
      'Faux wood grain and marbling',
      'Metallic and textured accent walls',
      'Color-matched custom formulations',
    ],
    image: IMAGES.specialtyFinishes,
  },
];

export const selectServices: SelectService[] = [
  {
    id: 'full-remodel',
    title: 'Full Home Remodeling',
    description:
      'Complete interior transformations for discerning homeowners. Every element considered, from structural modifications to the final coat of paint.',
    startingAt: '$100,000+',
    image: IMAGES.fullRemodel,
  },
  {
    id: 'kitchen',
    title: 'Kitchen Transformations',
    description:
      'Chef-grade kitchens with custom cabinetry, premium stone, and thoughtful layouts that balance beauty and function.',
    startingAt: '$125,000+',
    image: IMAGES.kitchen,
  },
  {
    id: 'bathroom',
    title: 'Luxury Bathrooms',
    description:
      'Spa-inspired sanctuaries with imported tile, custom vanities, and fixtures that elevate daily rituals to experiences.',
    startingAt: '$80,000+',
    image: IMAGES.bathroom,
  },
  {
    id: 'custom',
    title: 'Custom Carpentry',
    description:
      'Built-in libraries, wet bars, wine rooms, and bespoke furniture pieces. Handcrafted from select hardwoods, designed for your exact space.',
    startingAt: '$40,000+',
    image: IMAGES.customCarpentry,
  },
];

export const paintingProcess: ProcessStep[] = [
  {
    number: 1,
    title: 'Consultation',
    description:
      'We visit your home, discuss your vision, assess surfaces, and provide a detailed, transparent proposal.',
  },
  {
    number: 2,
    title: 'Color Selection',
    description:
      'Complimentary color consultation with large-format samples tested in your actual lighting conditions.',
  },
  {
    number: 3,
    title: 'Preparation',
    description:
      'Meticulous surface prep: patching, sanding, caulking, and priming. This is where quality work begins.',
  },
  {
    number: 4,
    title: 'Execution',
    description:
      'Expert application with premium materials. Clean lines, even coverage, and constant attention to detail.',
  },
  {
    number: 5,
    title: 'Final Walkthrough',
    description:
      'A thorough inspection together. We do not consider a project complete until you are genuinely delighted.',
  },
];

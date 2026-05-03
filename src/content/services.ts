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
      'Whole-room repaints, ceilings, accent walls, and built-in millwork. Sage greens, deep navies, soft whites — every surface patched, sanded, caulked, and rolled or sprayed to a gallery-grade finish.',
    features: [
      'Drywall repair, patching, and skim-coating',
      'Premium Benjamin Moore and Sherwin-Williams paints',
      'Razor-sharp cut lines at trim, ceilings, and corners',
      'Furniture protection, plastic-and-tape masking, daily cleanup',
    ],
    image: IMAGES.interiorPainting,
  },
  {
    id: 'exterior',
    title: 'Exterior Painting',
    description:
      'Siding, fascia, soffits, doors, and trim — pressure-washed, scraped, primed, and finished with coatings spec\'d for Atlanta heat, humidity, and UV. We handle the carpentry repairs, not just the color.',
    features: [
      'Pressure washing and full surface scrape',
      'Wood rot tear-out and replacement before painting',
      'Caulking, priming, and weather-rated topcoats',
      'Color consultation with large-format on-site samples',
    ],
    image: IMAGES.exteriorPainting,
  },
  {
    id: 'cabinets',
    title: 'Cabinet Refinishing',
    description:
      'Spray-finished cabinetry that reads as new construction. Doors come off, get degreased and sanded; boxes are masked and sprayed in place with conversion varnish. Two-tone perimeter + island combinations are a specialty.',
    features: [
      'Doors and drawers removed, sprayed off-site',
      'Conversion varnish for a factory-smooth, durable finish',
      'New pulls, knobs, and soft-close hardware available',
      'Two-tone and glazed combinations on request',
    ],
    image: IMAGES.cabinetRefinishing,
  },
  {
    id: 'specialty',
    title: 'Trim & Feature Walls',
    description:
      'Custom slat walls, geometric paneling, board-and-batten, dark trim packages, and feature walls. Built and finished on-site with mitred returns and crisp paint lines that hold up under close inspection.',
    features: [
      'Custom geometric and slat accent walls',
      'Board-and-batten, picture-frame moulding, wainscoting',
      'Dark trim packages: doors, casings, baseboard',
      'On-site fabrication, fill, sand, prime, and finish',
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

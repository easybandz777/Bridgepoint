import { TESTIMONIAL_IMAGES } from '@/lib/images';

export interface Testimonial {
  id: string;
  quote: string;
  author: string;
  location: string;
  projectType: string;
  rating: number;
  /** Associated project slug for linking, if applicable */
  projectSlug?: string;
  image?: string;
}

/**
 * Client testimonial data. Currently static -- designed to be
 * swapped for database queries when backend is implemented.
 * Images are themed to project type (interior, kitchen, bathroom, etc.) via lib/images.
 */
export const testimonials: Testimonial[] = [
  {
    id: 'harrison',
    quote:
      'The level of craftsmanship is extraordinary. Every corner of our home tells a story of meticulous care and artistry. We have had many contractors over the years, but none come close to this caliber of work.',
    author: 'The Harrison Family',
    location: 'Westlake Hills',
    projectType: 'Full Remodel',
    rating: 5,
    projectSlug: 'westlake-hills-estate',
    image: TESTIMONIAL_IMAGES.harrison,
  },
  {
    id: 'chen',
    quote:
      'Our kitchen is now the heart of our home. The craftsmanship in every joint and finish is beyond what we imagined possible. He treated our home like it was his own.',
    author: 'Michael & Sarah Chen',
    location: 'Barton Creek',
    projectType: 'Kitchen',
    rating: 5,
    projectSlug: 'barton-creek-kitchen',
    image: TESTIMONIAL_IMAGES.chen,
  },
  {
    id: 'thompson',
    quote:
      'The attention to prep work was remarkable. Our 1920s trim looks better than it did when the house was built. You can tell this is someone who genuinely loves the craft.',
    author: 'David & Lisa Thompson',
    location: 'Tarrytown',
    projectType: 'Interior Painting',
    rating: 5,
    projectSlug: 'tarrytown-interior-painting',
    image: TESTIMONIAL_IMAGES.thompson,
  },
  {
    id: 'owens',
    quote:
      'This library is a work of art. Friends walk in and their jaw drops. The rolling ladder alone is a conversation piece. Worth every penny and then some.',
    author: 'Dr. Rebecca Owens',
    location: 'Clarksville',
    projectType: 'Custom Build',
    rating: 5,
    projectSlug: 'clarksville-custom-library',
    image: TESTIMONIAL_IMAGES.owens,
  },
  {
    id: 'martinez',
    quote:
      'We hired Bridgepointe for exterior painting and the transformation was jaw-dropping. Neighbors have stopped to compliment the house. The color consultation alone was invaluable.',
    author: 'Carlos & Maria Martinez',
    location: 'Rollingwood',
    projectType: 'Exterior Painting',
    rating: 5,
    image: TESTIMONIAL_IMAGES.martinez,
  },
  {
    id: 'williams',
    quote:
      'From the initial consultation to the final walkthrough, every step was handled with professionalism and care. Our master bathroom is now a genuine retreat.',
    author: 'James Williams',
    location: 'Lake Travis',
    projectType: 'Bathroom',
    rating: 5,
    projectSlug: 'lake-travis-master-bath',
    image: TESTIMONIAL_IMAGES.williams,
  },
];

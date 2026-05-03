/**
 * Themed image URLs for remodeling, painting, and craftsmanship.
 * Uses Unsplash (free to use, no attribution required).
 * Replace with your own project photos when ready.
 */

const U = (id: string, w = 1200, q = 80) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&q=${q}&fit=crop`;

export const IMAGES = {
  /** Home hero: real project house photo */
  hero: '/images/hero-home.png',
  /** Painting page hero: open kitchen w/ coffered ceiling, navy island, painted millwork */
  paintingHero: '/images/gallery/painting/14.jpg',
  /** Services preview - painting: refined interior with painted built-ins */
  servicesPreviewPainting: '/images/gallery/painting/11.jpg',
  /** Services preview - select: high-end interior */
  servicesPreviewRemodel: U('1600607687939-ce8a6c25118c', 800),
  /** Painting services — local photos */
  interiorPainting: '/images/gallery/painting/11.jpg',
  exteriorPainting: '/images/gallery/painting/52.jpg',
  cabinetRefinishing: '/images/gallery/painting/29.jpg',
  specialtyFinishes: '/images/gallery/painting/37.jpg',
  /** Select services */
  fullRemodel: U('1600585154340-be6161a56a0c', 800),
  kitchen: U('1556911220-bff31c812dba', 800),
  bathroom: U('1552321554-5fefe8c9ef14', 800),
  customCarpentry: U('1495446815904-a4c6f8f9c71b', 800),
  /** Page heroes */
  portfolioHero: U('1600566752353-2f46443f19b9', 1920),
  selectHero: U('1600607687939-ce8a6c25118c', 1920),
  testimonialsHero: U('1600585154340-be6161a56a0c', 1920),
  aboutHero: U('1600566752353-2f46443f19b9', 1920),
  /** About: craftsman / builder */
  craftsmanPortrait: U('1560250097-0bf428fe8f58', 800),
} as const;

/** Project-type image for portfolio (main + gallery from same themed set). */
export const PROJECT_IMAGES: Record<string, { main: string; gallery: string[] }> = {
  'barton-creek-kitchen': {
    main: '/images/gallery/kitchens/01.jpg',
    gallery: [
      '/images/gallery/kitchens/01.jpg',
      '/images/gallery/kitchens/02.jpg',
      '/images/gallery/kitchens/03.jpg',
      '/images/gallery/kitchens/04.jpg',
      '/images/gallery/kitchens/05.jpg',
      '/images/gallery/kitchens/06.jpg',
    ],
  },
  'lake-travis-master-bath': {
    main: '/images/gallery/bathrooms/01.jpg',
    gallery: [
      '/images/gallery/bathrooms/01.jpg',
      '/images/gallery/bathrooms/03.jpg',
      '/images/gallery/bathrooms/05.jpg',
      '/images/gallery/bathrooms/07.jpg',
      '/images/gallery/bathrooms/09.jpg',
      '/images/gallery/bathrooms/11.jpg',
      '/images/gallery/bathrooms/13.jpg',
      '/images/gallery/bathrooms/15.jpg',
    ],
  },
  'artisan-tile-work': {
    main: '/images/gallery/tile/01.jpg',
    gallery: [
      '/images/gallery/tile/01.jpg',
      '/images/gallery/tile/02.jpg',
      '/images/gallery/tile/03.jpg',
      '/images/gallery/tile/04.jpg',
      '/images/gallery/tile/05.jpg',
      '/images/gallery/tile/06.jpg',
      '/images/gallery/tile/07.jpg',
      '/images/gallery/tile/08.jpg',
    ],
  },
  'tarrytown-interior-painting': {
    main: '/images/gallery/painting/01.jpg',
    gallery: [
      '/images/gallery/painting/01.jpg',
      '/images/gallery/painting/02.jpg',
      '/images/gallery/painting/03.jpg',
      '/images/gallery/painting/04.jpg',
    ],
  },
  'rollingwood-exterior': {
    main: '/images/gallery/painting/05.jpg',
    gallery: [
      '/images/gallery/painting/05.jpg',
      '/images/gallery/painting/06.jpg',
      '/images/gallery/painting/07.jpg',
      '/images/gallery/painting/08.jpg',
    ],
  },
  'bee-cave-cabinet-refinishing': {
    main: '/images/gallery/painting/09.jpg',
    gallery: [
      '/images/gallery/painting/09.jpg',
      '/images/gallery/painting/10.jpg',
      '/images/gallery/painting/11.jpg',
      '/images/gallery/painting/12.jpg',
    ],
  },
};

/** Themed testimonial images (project-type interiors or neutral). */
export const TESTIMONIAL_IMAGES: Record<string, string> = {
  harrison: U('1600585154340-be6161a56a0c', 400),
  chen: U('1556911220-bff31c812dba', 400),
  thompson: U('1615873968403-89e068629265', 400),
  owens: U('1495446815904-a4c6f8f9c71b', 400),
  martinez: U('1568605114967-8130f3a36994', 400),
  williams: U('1552321554-5fefe8c9ef14', 400),
};

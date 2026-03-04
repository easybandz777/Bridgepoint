/**
 * Themed image URLs for remodeling, painting, and craftsmanship.
 * Uses Unsplash (free to use, no attribution required).
 * Replace with your own project photos when ready.
 */

const U = (id: string, w = 1200, q = 80) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&q=${q}&fit=crop`;

export const IMAGES = {
  /** Home hero: luxury living room / interior */
  hero: U('1600585154340-be6161a56a0c', 1920),
  /** Painting page hero: refined interior with paint */
  paintingHero: U('1615873968403-89e068629265', 1920),
  /** Services preview - painting: interior room */
  servicesPreviewPainting: U('1615873968403-89e068629265', 800),
  /** Services preview - select: high-end interior */
  servicesPreviewRemodel: U('1600607687939-ce8a6c25118c', 800),
  /** Painting services */
  interiorPainting: U('1615873968403-89e068629265', 800),
  exteriorPainting: U('1568605114967-8130f3a36994', 800),
  cabinetRefinishing: U('1556909114-f6e7ad7d3136', 800),
  specialtyFinishes: U('1600566752353-2f46443f19b9', 800),
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
  /** Before/after: older interior vs refreshed (same theme). */
  beforePaint: U('1600566752353-2f46443f19b9', 1200),
  afterPaint: U('1615873968403-89e068629265', 1200),
} as const;

/** Real Unsplash IDs for gallery variety (interiors, kitchen, bath, exterior, library). */
const GALLERY_IDS = [
  '1600566752353-2f46443f19b9',
  '1600607687939-ce8a6c25118c',
  '1556911220-bff31c812dba',
  '1552321554-5fefe8c9ef14',
  '1568605114967-8130f3a36994',
  '1495446815904-a4c6f8f9c71b',
  '1556909114-f6e7ad7d3136',
  '1600585154340-be6161a56a0c',
];

/** Project-type image for portfolio (main + gallery from same themed set). */
export const PROJECT_IMAGES: Record<string, { main: string; gallery: string[] }> = {
  'westlake-hills-estate': {
    main: U('1600585154340-be6161a56a0c', 1200),
    gallery: GALLERY_IDS.slice(0, 4).map((id) => U(id, 1200)),
  },
  'barton-creek-kitchen': {
    main: U('1556911220-bff31c812dba', 1200),
    gallery: [U('1556909114-f6e7ad7d3136', 1200), U('1556911220-bff31c812dba', 1200), U('1600585154340-be6161a56a0c', 1200)],
  },
  'lake-travis-master-bath': {
    main: '/images/gallery/bathrooms/01.jpg',
    gallery: [
      '/images/gallery/bathrooms/01.jpg',
      '/images/gallery/bathrooms/02.jpg',
      '/images/gallery/bathrooms/03.jpg',
      '/images/gallery/bathrooms/04.jpg',
      '/images/gallery/bathrooms/05.jpg',
      '/images/gallery/bathrooms/06.jpg',
      '/images/gallery/bathrooms/07.jpg',
      '/images/gallery/bathrooms/08.jpg',
    ],
  },
  'tarrytown-interior-painting': {
    main: U('1615873968403-89e068629265', 1200),
    gallery: [U('1615873968403-89e068629265', 1200), U('1600566752353-2f46443f19b9', 1200)],
  },
  'rollingwood-exterior': {
    main: U('1568605114967-8130f3a36994', 1200),
    gallery: [U('1568605114967-8130f3a36994', 1200), U('1600585154340-be6161a56a0c', 1200)],
  },
  'clarksville-custom-library': {
    main: U('1495446815904-a4c6f8f9c71b', 1200),
    gallery: [U('1495446815904-a4c6f8f9c71b', 1200), U('1600566752353-2f46443f19b9', 1200), U('1600607687939-ce8a6c25118c', 1200)],
  },
  'bee-cave-cabinet-refinishing': {
    main: U('1556909114-f6e7ad7d3136', 1200),
    gallery: [U('1556909114-f6e7ad7d3136', 1200), U('1556911220-bff31c812dba', 1200)],
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

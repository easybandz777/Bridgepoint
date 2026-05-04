/**
 * Neighborhood-level pages for hyperlocal SEO. These are sub-city locations
 * worth their own landing page, distinct from the city-level SERVICE_LOCATIONS.
 *
 * Each generates a route at /painting-contractor-{slug} so the URL itself
 * carries the keyword. Add to sitemap.ts and footer when expanded.
 */

export interface Neighborhood {
    /** URL slug (becomes /painting-contractor-{slug}) */
    slug: string;
    /** Display name */
    name: string;
    /** Parent city or area for context */
    parent: string;
    /** Short positioning paragraph for hero */
    blurb: string;
    /** Two or three notable architectural / homeowner traits */
    traits: string[];
}

export const NEIGHBORHOODS: Neighborhood[] = [
    {
        slug: 'vinings',
        name: 'Vinings',
        parent: 'Cobb County, GA',
        blurb: 'A Bridgepointe favorite. Vinings homes blend Buckhead-level finish expectations with Cobb-County practicality — the perfect fit for our prep-heavy approach.',
        traits: [
            'Heavy demand for cabinet refinishing in Vinings\' updated 90s and 2000s kitchens',
            'Dark trim packages and accent walls common in newer construction',
            'Frequent exterior repaints on stucco and cement-board sided homes',
        ],
    },
    {
        slug: 'east-cobb',
        name: 'East Cobb',
        parent: 'Marietta, GA',
        blurb: 'East Cobb\'s established neighborhoods are hitting their 20–30 year repaint window. Brick-and-trim exteriors, refinished cabinets, and whole-home interior repaints are our most-requested work in this corridor.',
        traits: [
            'Heavy on whole-home interior repaints and trim package refreshes',
            'Cabinet refinishing without full kitchen tear-out',
            'Exterior trim, fascia, soffit, and front-door repaints',
        ],
    },
    {
        slug: 'smyrna',
        name: 'Smyrna',
        parent: 'Cobb County, GA',
        blurb: 'Smyrna\'s mix of new-build townhomes and established single-families means we see everything from cabinet refinishing to full feature-wall builds in the same week.',
        traits: [
            'Shaker cabinet refinishing in newer townhome builds',
            'Custom feature walls and slat accents in newer construction',
            'Standard-scope interior + exterior repaints in Smyrna\'s established neighborhoods',
        ],
    },
    {
        slug: 'dunwoody',
        name: 'Dunwoody',
        parent: 'DeKalb County, GA',
        blurb: 'Dunwoody\'s mature neighborhoods deliver a steady stream of whole-home interior repaints and cabinet refinishing projects. Many of these homes are on their second or third repaint cycle — and the homeowners know quality when they see it.',
        traits: [
            'Whole-home interior repaints with trim and cabinetry coordination',
            'High demand for two-tone cabinet finishes',
            'Exterior repaints on traditional Dunwoody brick and cedar siding',
        ],
    },
    {
        slug: 'brookhaven',
        name: 'Brookhaven',
        parent: 'DeKalb County, GA',
        blurb: 'Brookhaven sits at the intersection of intown convenience and northern-crescent space. The homes are larger and the finish expectations match — this is one of our top areas for luxury cabinet refinishing and custom trim work.',
        traits: [
            'Conversion-varnish cabinet refinishing for 2010s and 2020s kitchens',
            'Custom built-in painting and feature wall fabrication',
            'Interior + exterior whole-home coordinated repaints',
        ],
    },
    {
        slug: 'johns-creek',
        name: 'Johns Creek',
        parent: 'North Fulton County, GA',
        blurb: 'Johns Creek\'s newer-construction luxury homes are a perfect match for Bridgepointe\'s spray-applied finish work. Two-tone shaker kitchens, custom feature walls, and premium exterior repaints make up the bulk of our Johns Creek portfolio.',
        traits: [
            'Two-tone shaker cabinet refinishing in larger kitchens',
            'Custom geometric feature walls and trim packages',
            'Exterior repaints on stucco, cement-board, and brick surrounds',
        ],
    },
];

export function getNeighborhood(slug: string): Neighborhood | undefined {
    return NEIGHBORHOODS.find((n) => n.slug === slug);
}

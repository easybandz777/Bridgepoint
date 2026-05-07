import { getGalleryCollections } from '@/lib/gallery';

const BASE = 'https://bridgepointepainting.com';

const CATEGORY_PAGES: Record<string, { loc: string; titleTemplate: (i: number) => string; caption: string }> = {
    bathrooms: {
        loc: `${BASE}/portfolio?filter=bathroom`,
        titleTemplate: (i) => `Atlanta bathroom remodel — photo ${i}`,
        caption: 'Master bathroom remodel by Bridgepointe — Metro Atlanta. Tile, vanities, fixtures.',
    },
    kitchens: {
        loc: `${BASE}/portfolio?filter=kitchen`,
        titleTemplate: (i) => `Atlanta kitchen remodel — photo ${i}`,
        caption: 'Kitchen renovation by Bridgepointe — Metro Atlanta. Cabinetry, stone, tile.',
    },
    painting: {
        loc: `${BASE}/painting`,
        titleTemplate: (i) => `Atlanta interior & exterior painting — photo ${i}`,
        caption: 'Painting project by Bridgepointe — Metro Atlanta. Interior, exterior, cabinets, trim.',
    },
    tile: {
        loc: `${BASE}/portfolio?filter=tile`,
        titleTemplate: (i) => `Atlanta custom tile installation — photo ${i}`,
        caption: 'Custom tile installation by Bridgepointe — Metro Atlanta. Showers, floors, backsplashes.',
    },
    flooring: {
        loc: `${BASE}/portfolio?filter=flooring`,
        titleTemplate: (i) => `Atlanta hardwood flooring installation — photo ${i}`,
        caption: 'Flooring project by Bridgepointe — Metro Atlanta. Hardwood, engineered, tile transitions.',
    },
};

function escapeXml(s: string): string {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

export const dynamic = 'force-static';
export const revalidate = 3600;

const PRESSURE_WASHING_IMAGES: { src: string; title: string; caption: string }[] = [
    {
        src: '/images/gallery/painting/52.jpg',
        title: 'Atlanta hot-water pressure washing — exterior siding restoration',
        caption: 'Hot-water pressure washing by Bridgepointe — Metro Atlanta home exterior siding restoration.',
    },
    {
        src: '/images/gallery/painting/14.jpg',
        title: 'Atlanta pressure washing — driveway and walkway cleaning',
        caption: 'Driveway and walkway pressure washing by Bridgepointe — Metro Atlanta concrete restoration.',
    },
    {
        src: '/images/gallery/painting/47.jpg',
        title: 'Atlanta pressure washing — deck and patio cleaning',
        caption: 'Deck and patio pressure washing by Bridgepointe — Metro Atlanta wood and stone surfaces.',
    },
    {
        src: '/images/gallery/painting/22.jpg',
        title: 'Atlanta pressure washing — house wash with soft-wash technique',
        caption: 'Soft-wash exterior cleaning by Bridgepointe — Metro Atlanta painted siding and trim.',
    },
    {
        src: '/images/gallery/painting/25.jpg',
        title: 'Atlanta pressure washing — roof and gutter cleaning',
        caption: 'Roof and gutter cleaning by Bridgepointe — Metro Atlanta low-pressure soft wash.',
    },
    {
        src: '/images/gallery/painting/37.jpg',
        title: 'Atlanta pressure washing — fence and exterior trim restoration',
        caption: 'Fence and exterior trim cleaning by Bridgepointe — Metro Atlanta hot-water pressure washing.',
    },
    {
        src: '/images/gallery/painting/11.jpg',
        title: 'Atlanta pressure washing — pre-paint exterior preparation',
        caption: 'Pre-paint pressure wash by Bridgepointe — Metro Atlanta exterior surface preparation.',
    },
];

export async function GET() {
    const collections = getGalleryCollections();

    const galleryUrls = collections
        .filter((col) => CATEGORY_PAGES[col.id])
        .map((col) => {
            const meta = CATEGORY_PAGES[col.id];
            const images = col.images
                .map((src, i) => {
                    const fullUrl = `${BASE}${src}`;
                    return `    <image:image>
      <image:loc>${escapeXml(fullUrl)}</image:loc>
      <image:title>${escapeXml(meta.titleTemplate(i + 1))}</image:title>
      <image:caption>${escapeXml(meta.caption)}</image:caption>
    </image:image>`;
                })
                .join('\n');
            return `  <url>
    <loc>${escapeXml(meta.loc)}</loc>
${images}
  </url>`;
        })
        .join('\n');

    const pressureWashingImages = PRESSURE_WASHING_IMAGES
        .map((img) => `    <image:image>
      <image:loc>${escapeXml(`${BASE}${img.src}`)}</image:loc>
      <image:title>${escapeXml(img.title)}</image:title>
      <image:caption>${escapeXml(img.caption)}</image:caption>
    </image:image>`)
        .join('\n');

    const pressureWashingUrl = `  <url>
    <loc>${escapeXml(`${BASE}/pressure-washing-atlanta`)}</loc>
${pressureWashingImages}
  </url>`;

    const urls = [galleryUrls, pressureWashingUrl].filter(Boolean).join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls}
</urlset>`;

    return new Response(xml, {
        headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        },
    });
}

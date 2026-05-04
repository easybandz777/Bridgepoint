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

export async function GET() {
    const collections = getGalleryCollections();

    const urls = collections
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

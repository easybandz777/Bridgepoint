import type { MetadataRoute } from 'next';
import { SERVICE_LOCATIONS } from '@/lib/locations';

export default function sitemap(): MetadataRoute.Sitemap {
    const base = 'https://bridgepointepainting.com';
    const now = new Date();

    const staticPages: MetadataRoute.Sitemap = [
        { url: base, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
        { url: `${base}/painting`, lastModified: now, changeFrequency: 'monthly', priority: 0.95 },
        { url: `${base}/interior-painting-atlanta`, lastModified: now, changeFrequency: 'monthly', priority: 0.95 },
        { url: `${base}/exterior-painting-atlanta`, lastModified: now, changeFrequency: 'monthly', priority: 0.95 },
        { url: `${base}/cabinet-painting-atlanta`, lastModified: now, changeFrequency: 'monthly', priority: 0.90 },
        { url: `${base}/luxury-home-painting`, lastModified: now, changeFrequency: 'monthly', priority: 0.90 },
        { url: `${base}/portfolio`, lastModified: now, changeFrequency: 'weekly', priority: 0.85 },
        { url: `${base}/gallery`, lastModified: now, changeFrequency: 'weekly', priority: 0.80 },
        { url: `${base}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.75 },
        { url: `${base}/testimonials`, lastModified: now, changeFrequency: 'monthly', priority: 0.75 },
        { url: `${base}/select-services`, lastModified: now, changeFrequency: 'monthly', priority: 0.70 },
    ];

    const locationPages: MetadataRoute.Sitemap = SERVICE_LOCATIONS.map(loc => ({
        url: `${base}/${loc.id}`,
        lastModified: now,
        changeFrequency: 'monthly' as const,
        priority: 0.88,
    }));

    return [...staticPages, ...locationPages];
}

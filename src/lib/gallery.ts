/**
 * Server-only: discovers gallery images from public/images/gallery by category.
 * Add photos to public/images/gallery/{category}/ and they appear on the Gallery page.
 */

import { readdirSync, existsSync } from 'fs';
import path from 'path';

const GALLERY_BASE = path.join(process.cwd(), 'public', 'images', 'gallery');
const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp']);

/**
 * Exclude specific filenames from gallery by category (e.g. mistaken imports).
 * Add bathroom image filenames here to hide them from /gallery and keep only
 * appropriate project photos. Re-run import with ballerina in skip list to avoid re-adding.
 */

export const GALLERY_CATEGORIES = [
  { id: 'bathrooms', label: 'Bathrooms' },
  { id: 'kitchens', label: 'Kitchens' },
  { id: 'painting', label: 'Painting' },
  { id: 'flooring', label: 'Flooring' },
  { id: 'full-remodel', label: 'Full Remodel' },
  { id: 'custom', label: 'Custom' },
] as const;

export type GalleryCategoryId = (typeof GALLERY_CATEGORIES)[number]['id'];

/**
 * Exclude specific filenames from gallery by category (e.g. mistaken imports).
 * Add bathroom image filenames here to hide them from /gallery.
 */
export const GALLERY_BLOCKLIST: Partial<Record<GalleryCategoryId, Set<string>>> = {
  bathrooms: new Set([
    // Add filenames to exclude, e.g. '07.jpg', '23.jpg'
  ]),
};

export interface GalleryCollection {
  id: GalleryCategoryId;
  label: string;
  images: string[];
}

function isImageFile(name: string): boolean {
  const ext = path.extname(name).toLowerCase();
  return ALLOWED_EXT.has(ext);
}

/**
 * Returns image paths for each category (e.g. /images/gallery/bathrooms/01.jpg).
 * Only includes categories that have at least one image. Sorted by filename.
 */
export function getGalleryCollections(): GalleryCollection[] {
  if (!existsSync(GALLERY_BASE)) {
    return [];
  }

  const result: GalleryCollection[] = [];

  for (const cat of GALLERY_CATEGORIES) {
    const dir = path.join(GALLERY_BASE, cat.id);
    if (!existsSync(dir)) continue;

    const blocklist = GALLERY_BLOCKLIST[cat.id];
    const files = readdirSync(dir, { withFileTypes: true })
      .filter((f) => f.isFile() && isImageFile(f.name) && !blocklist?.has(f.name))
      .map((f) => f.name)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    if (files.length > 0) {
      result.push({
        id: cat.id,
        label: cat.label,
        images: files.map((f) => `/images/gallery/${cat.id}/${encodeURIComponent(f)}`),
      });
    }
  }

  return result;
}

/**
 * Import images from a downloaded folder (e.g. from Google Photos) into the gallery.
 *
 * Usage (from project root):
 *   node scripts/import-gallery.js <path-to-downloaded-folder> [category]
 *
 * Example - BATHROOMS album downloaded to Downloads:
 *   node scripts/import-gallery.js "C:\Users\You\Downloads\BATHROOMS" bathrooms
 *
 * Categories: bathrooms | kitchens | painting | flooring | full-remodel | custom
 * Default category if omitted: bathrooms
 */

const fs = require('fs');
const path = require('path');

const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const VALID_CATEGORIES = ['bathrooms', 'kitchens', 'painting', 'flooring', 'full-remodel', 'custom'];

const sourceDir = process.argv[2];
const category = (process.argv[3] || 'bathrooms').toLowerCase();

if (!sourceDir) {
  console.error('Usage: node scripts/import-gallery.js <path-to-downloaded-folder> [category]');
  console.error('Example: node scripts/import-gallery.js "C:\\Users\\You\\Downloads\\BATHROOMS" bathrooms');
  process.exit(1);
}

if (!VALID_CATEGORIES.includes(category)) {
  console.error('Invalid category. Use one of:', VALID_CATEGORIES.join(', '));
  process.exit(1);
}

const galleryDir = path.join(process.cwd(), 'public', 'images', 'gallery', category);

if (!fs.existsSync(sourceDir)) {
  console.error('Source folder not found:', sourceDir);
  process.exit(1);
}

function isImage(name) {
  return ALLOWED_EXT.has(path.extname(name).toLowerCase());
}

const skipPatterns = ['logo', 'quantlab', 'srs logo', 'ballerina'];
function shouldSkip(name) {
  const lower = name.toLowerCase();
  return skipPatterns.some((p) => lower.includes(p));
}

const files = fs.readdirSync(sourceDir, { withFileTypes: true })
  .filter((f) => f.isFile() && isImage(f.name) && !shouldSkip(f.name))
  .map((f) => f.name)
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

if (files.length === 0) {
  console.error('No image files (.jpg, .jpeg, .png, .webp) found in', sourceDir);
  process.exit(1);
}

if (!fs.existsSync(galleryDir)) {
  fs.mkdirSync(galleryDir, { recursive: true });
}

let copied = 0;
files.forEach((file, i) => {
  const ext = path.extname(file).toLowerCase();
  const newName = `${String(i + 1).padStart(2, '0')}${ext}`;
  const src = path.join(sourceDir, file);
  const dest = path.join(galleryDir, newName);
  fs.copyFileSync(src, dest);
  console.log('  ', file, '->', newName);
  copied++;
});

console.log('\nDone. Copied', copied, 'image(s) to', galleryDir);
console.log('Restart or refresh the dev server and open /gallery to see them.');

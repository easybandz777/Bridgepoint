/**
 * Remove irrelevant or mistaken images from the gallery (by filename).
 * Use after identifying which files to remove (e.g. from the Gallery page).
 *
 * Usage (from project root):
 *   node scripts/remove-gallery-images.js <category> <file1> [file2 ...]
 *
 * Example - remove two bathroom images:
 *   node scripts/remove-gallery-images.js bathrooms 07.jpg 15.jpg
 *
 * List portrait images (often non-bathroom; e.g. mistaken "ballerina" photo):
 *   node scripts/remove-gallery-images.js bathrooms --list-portrait
 */

const fs = require('fs');
const path = require('path');

const VALID_CATEGORIES = ['bathrooms', 'kitchens', 'painting', 'flooring', 'full-remodel', 'custom'];
const galleryBase = path.join(process.cwd(), 'public', 'images', 'gallery');

function readJpegDimensions(filePath) {
  const buf = fs.readFileSync(filePath, { encoding: null });
  let i = 0;
  while (i < buf.length - 1) {
    if (buf[i] === 0xff && (buf[i + 1] === 0xc0 || buf[i + 1] === 0xc1 || buf[i + 1] === 0xc2)) {
      const height = buf.readUInt16BE(i + 5);
      const width = buf.readUInt16BE(i + 7);
      return { width, height };
    }
    i++;
  }
  return null;
}

function listPortrait(category) {
  const dir = path.join(galleryBase, category);
  if (!fs.existsSync(dir)) {
    console.error('Category folder not found:', dir);
    process.exit(1);
  }
  const files = fs.readdirSync(dir, { withFileTypes: true })
    .filter((f) => f.isFile() && /\.(jpg|jpeg|png|webp)$/i.test(f.name))
    .map((f) => f.name)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  console.log('Portrait (height > width) images in', category + ':');
  const portrait = [];
  for (const name of files) {
    const ext = path.extname(name).toLowerCase();
    if (ext !== '.jpg' && ext !== '.jpeg') {
      console.log('  ', name, '(dimensions not read for non-JPEG)');
      continue;
    }
    const dim = readJpegDimensions(path.join(dir, name));
    if (dim && dim.height > dim.width) {
      portrait.push(name);
      console.log('  ', name, dim.width + 'x' + dim.height, 'portrait');
    }
  }
  if (portrait.length === 0) {
    console.log('  (none)');
  } else {
    console.log('\nTo remove these portrait images run:');
    console.log('  node scripts/remove-gallery-images.js', category, portrait.join(' '));
  }
}

function removeFiles(category, filenames) {
  const dir = path.join(galleryBase, category);
  if (!fs.existsSync(dir)) {
    console.error('Category folder not found:', dir);
    process.exit(1);
  }
  let removed = 0;
  for (const name of filenames) {
    const filePath = path.join(dir, name);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('  Removed:', name);
      removed++;
    } else {
      console.warn('  Not found:', name);
    }
  }
  console.log('\nDone. Removed', removed, 'file(s). Refresh the Gallery page to see changes.');
}

const category = process.argv[2];
const rest = process.argv.slice(3);

if (!category || !VALID_CATEGORIES.includes(category)) {
  console.error('Usage: node scripts/remove-gallery-images.js <category> <file1> [file2 ...]');
  console.error('       node scripts/remove-gallery-images.js <category> --list-portrait');
  console.error('Category must be one of:', VALID_CATEGORIES.join(', '));
  process.exit(1);
}

if (rest.length === 1 && rest[0] === '--list-portrait') {
  listPortrait(category);
} else if (rest.length === 0) {
  console.error('Provide at least one filename to delete, or --list-portrait');
  process.exit(1);
} else {
  removeFiles(category, rest);
}

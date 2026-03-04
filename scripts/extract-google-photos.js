/**
 * Extract image URLs from a saved Google Photos HTML page and download them
 * into the gallery. Run from project root:
 *   node scripts/extract-google-photos.js "C:\Users\hones\OneDrive\Pictures\bridgepoint.html" bathrooms
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const htmlPath = process.argv[2];
const category = (process.argv[3] || 'bathrooms').toLowerCase();
const VALID_CATEGORIES = ['bathrooms', 'kitchens', 'painting', 'flooring', 'full-remodel', 'custom'];

if (!htmlPath || !VALID_CATEGORIES.includes(category)) {
  console.error('Usage: node scripts/extract-google-photos.js <path-to-bridgepoint.html> [category]');
  console.error('Category: bathrooms | kitchens | painting | flooring | full-remodel | custom');
  process.exit(1);
}

const galleryDir = path.join(process.cwd(), 'public', 'images', 'gallery', category);
if (!fs.existsSync(galleryDir)) {
  fs.mkdirSync(galleryDir, { recursive: true });
}

const html = fs.readFileSync(htmlPath, 'utf8');
const urlRegex = /https:\/\/lh3\.googleusercontent\.com\/pw\/[A-Za-z0-9_-]+=w\d+-h\d+[^"'\s)*]+/g;
const matches = html.match(urlRegex) || [];
const urls = [...new Set(matches)].map((u) => u.replace(/&quot;$/, '').trim());

console.log('Found', urls.length, 'image URLs in HTML.\n');

function download(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'image/*',
        },
      },
      (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', reject);
      }
    );
    req.on('error', reject);
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('timeout'));
    });
  });
}

async function main() {
  let saved = 0;
  let failed = 0;
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const num = String(i + 1).padStart(2, '0');
    const ext = url.includes('png') || url.includes('=s') ? '.png' : '.jpg';
    const outPath = path.join(galleryDir, `${num}${ext}`);
    try {
      const buf = await download(url);
      if (buf.length < 1000) {
        console.log('  Skip', num, '(too small, likely not image)');
        failed++;
        continue;
      }
      fs.writeFileSync(outPath, buf);
      console.log('  Saved', num, buf.length, 'bytes');
      saved++;
    } catch (e) {
      console.log('  Fail', num, e.message);
      failed++;
    }
  }
  console.log('\nDone. Saved', saved, 'images to', galleryDir);
  if (failed > 0) console.log('Failed:', failed, '(URLs may require Google sign-in to access)');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

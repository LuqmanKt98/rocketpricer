// Renders public/og-image.png (1200x630) and the PWA/touch icons from
// the SVG favicon. Run with: node scripts/generate-assets.mjs
import { chromium } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pub = path.join(root, 'public');

const browser = await chromium.launch();

// --- OG image ---
const og = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await og.goto('file://' + path.join(root, 'scripts', 'og-template.html').replace(/\\/g, '/'));
await og.waitForLoadState('networkidle');
await og.evaluate(() => document.fonts.ready);
await og.waitForTimeout(300);
await og.screenshot({ path: path.join(pub, 'og-image.png') });
console.log('✓ public/og-image.png (1200x630)');

// --- Icons from favicon.svg ---
const svg = fs.readFileSync(path.join(pub, 'favicon.svg'), 'utf8');
for (const { size, name } of [
  { size: 512, name: 'icon-512.png' },
  { size: 192, name: 'icon-192.png' },
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 32, name: 'favicon-32.png' },
]) {
  const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
  const html = `<!doctype html><body style="margin:0">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body>`;
  await page.setContent(html);
  await page.screenshot({ path: path.join(pub, name), omitBackground: true });
  await page.close();
  console.log(`✓ public/${name} (${size}x${size})`);
}

await browser.close();

/**
 * Builds the home-screen / PWA icons from the app icon master.
 *
 *   node scripts/generate-icons.mjs
 *
 * Source: assets/app-icon-1024.png — the full-bleed square master.
 * (assets/app-icon.svg is the vector it came from, kept for reference.)
 *
 * Note the master is deliberately the *square* cut, not the rounded one. iOS
 * applies its own squircle mask to whatever you hand it, so an icon that
 * arrives with rounded transparent corners gets rounded twice and shows dark
 * notches at the corners. Home-screen icons must be full-bleed and opaque.
 *
 * Tabs are the opposite case: nothing masks them, so the designed rounded
 * corners should survive. src/app/icon.png is rasterized from the SVG for that,
 * and src/app/favicon.ico is the hand-made 16/32/48 file that ships alongside
 * it (not generated here).
 */
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = path.join(ROOT, 'assets/app-icon-1024.png');
const VECTOR = path.join(ROOT, 'assets/app-icon.svg');

/** The master's ground, used to pad the maskable variant. */
const GROUND = { r: 0x11, g: 0x11, b: 0x11 };

/** Square, opaque, no alpha channel — flattened so no corner can go clear. */
const scaled = (size) =>
  sharp(SOURCE).resize(size, size, { fit: 'cover' }).flatten({ background: GROUND }).png().toBuffer();

/**
 * Android may crop icons to a circle. The master's baseline bar runs close
 * enough to the edges to lose its ends under that crop, so the maskable
 * variant insets the whole design inside the safe zone.
 */
async function maskable(size, coverage = 0.76) {
  const inner = Math.round(size * coverage);
  const art = await sharp(SOURCE).resize(inner, inner, { fit: 'cover' }).toBuffer();
  const offset = Math.round((size - inner) / 2);

  return sharp({
    create: { width: size, height: size, channels: 3, background: GROUND },
  })
    .composite([{ input: art, left: offset, top: offset }])
    .png()
    .toBuffer();
}

await mkdir(path.join(ROOT, 'public/icons'), { recursive: true });
const write = (rel, buf) => writeFile(path.join(ROOT, rel), buf);

// Browser tab. Rounded corners kept — see the note at the top of this file.
await write(
  'src/app/icon.png',
  await sharp(VECTOR, { density: 384 }).resize(192, 192).png().toBuffer(),
);

await write('src/app/apple-icon.png', await scaled(180)); // iOS Add to Home Screen
await write('public/icons/icon-192x192.png', await scaled(192));
await write('public/icons/icon-512x512.png', await scaled(512));
await write('public/icons/icon-maskable-512x512.png', await maskable(512));

console.log('icons written');

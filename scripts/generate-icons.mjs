/**
 * Builds the app icon set from the park logo.
 *
 *   node scripts/generate-icons.mjs
 *
 * Source: public/brands/holiday-motel/logo.png (1088x876, logo on white).
 *
 * Two crops come out of it:
 *   FULL — starburst + "Holiday" + "MOTEL". The "EMMETT, IDAHO" band is left
 *          off; at home-screen size it is unreadable and only adds noise.
 *   MARK — the starburst on its own, for 16-48px favicons where a wordmark
 *          turns to mush.
 *
 * Everything sits on an opaque cream square. iOS applies its own rounded mask,
 * so the file itself must be a full-bleed square with no transparency.
 */
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = path.join(ROOT, 'public/brands/holiday-motel/logo.png');

const CREAM = { r: 0xf6, g: 0xed, b: 0xdf };

// Ink bounds measured off the source. Top-left origin, inclusive of the crop.
const FULL = { left: 24, top: 33, width: 1029, height: 659 };
const MARK = { left: 450, top: 33, width: 291, height: 245 };

/** Repaint the logo's white ground (and its distressed white speckles) cream. */
async function creamed() {
  const { data, info } = await sharp(SOURCE)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    if (data[i] > 232 && data[i + 1] > 232 && data[i + 2] > 232) {
      data[i] = CREAM.r;
      data[i + 1] = CREAM.g;
      data[i + 2] = CREAM.b;
      data[i + 3] = 255;
    }
  }

  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer();
}

/**
 * Centers `crop` on a cream square of `size`, scaled so it spans `coverage` of
 * the square's width (or height, whichever binds first).
 */
async function square(base, crop, size, coverage) {
  const art = await sharp(base)
    .extract(crop)
    .resize({
      width: Math.round(size * coverage),
      height: Math.round(size * coverage),
      fit: 'inside',
    })
    .toBuffer();
  const { width, height } = await sharp(art).metadata();

  return sharp({
    create: { width: size, height: size, channels: 3, background: CREAM },
  })
    .composite([
      {
        input: art,
        left: Math.round((size - width) / 2),
        top: Math.round((size - height) / 2),
      },
    ])
    .png()
    .toBuffer();
}

/** Pack PNGs into a multi-resolution .ico. */
function ico(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(images.length, 4);

  let offset = 6 + images.length * 16;
  const entries = images.map(({ size, data }) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2); // palette size
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += data.length;
    return entry;
  });

  return Buffer.concat([header, ...entries, ...images.map((i) => i.data)]);
}

const base = await creamed();
await mkdir(path.join(ROOT, 'public/icons'), { recursive: true });

const write = (rel, buf) => writeFile(path.join(ROOT, rel), buf);

// Home screen / PWA. 0.8 coverage keeps the wordmark clear of iOS's rounded
// mask; the maskable variant pulls in far enough to survive a circle crop.
await write('src/app/apple-icon.png', await square(base, FULL, 180, 0.8));
await write('public/icons/icon-192x192.png', await square(base, FULL, 192, 0.8));
await write('public/icons/icon-512x512.png', await square(base, FULL, 512, 0.8));
await write(
  'public/icons/icon-maskable-512x512.png',
  await square(base, MARK, 512, 0.5),
);

// Browser tab.
await write('src/app/icon.png', await square(base, MARK, 96, 0.72));
await write(
  'src/app/favicon.ico',
  ico(
    await Promise.all(
      [16, 32, 48].map(async (size) => ({
        size,
        data: await square(base, MARK, size, 0.72),
      })),
    ),
  ),
);

console.log('icons written');

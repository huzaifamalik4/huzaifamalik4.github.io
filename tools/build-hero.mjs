// Builds the wide hero image: the portrait with its plain wall extended to both sides,
// so the photo can fill a stage of any shape.
// Usage: node tools/build-hero.mjs
import sharp from 'sharp';
import path from 'node:path';

const SRC = 'C:/Users/Huzaifa Malik/Downloads/Change_picture_to_second_one_592a93a8.jpg';
const OUT = path.resolve('assets/img/hero-portrait.webp');

const TOP = 150; // rows of the original kept: 150 to 1000, which frames head and shoulders
const H = 850;
const PW = 896; // photo width
const W = 2040; // 2.4 : 1
const PX = 858; // where the photo's left edge sits, putting the face at 64% across
const FEATHER = 90;
const OVERLAP = 100;

const photo = await sharp(SRC).extract({ left: 0, top: TOP, width: PW, height: H }).toBuffer();

// The wall on each side is the photo's own edge strip, smoothed and stretched outward.
async function wall(fromLeft, width) {
  const strip = await sharp(photo)
    .extract({ left: fromLeft ? 0 : PW - 36, top: 0, width: 36, height: H })
    .blur(14)
    .toBuffer();
  return sharp(strip).resize(width, H, { fit: 'fill' }).blur(22).toBuffer();
}
const leftWidth = PX + OVERLAP;
const rightWidth = W - PX - PW + OVERLAP;
const leftWall = await wall(true, leftWidth);
const rightWall = await wall(false, rightWidth);

// Fade the photo's side edges so it melts into the extended wall.
const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${PW}" height="${H}">
  <defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="0">
    <stop offset="0" stop-color="#000"/><stop offset="${FEATHER / PW}" stop-color="#fff"/>
    <stop offset="${1 - FEATHER / PW}" stop-color="#fff"/><stop offset="1" stop-color="#000"/>
  </linearGradient></defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
</svg>`);
const alpha = await sharp(mask).resize(PW, H).extractChannel(0).raw().toBuffer();
const feathered = await sharp(photo)
  .removeAlpha()
  .joinChannel(alpha, { raw: { width: PW, height: H, channels: 1 } })
  .png()
  .toBuffer();

await sharp({ create: { width: W, height: H, channels: 3, background: '#e6e6e6' } })
  .composite([
    { input: leftWall, left: 0, top: 0 },
    { input: rightWall, left: W - rightWidth, top: 0 },
    { input: feathered, left: PX, top: 0 },
  ])
  .webp({ quality: 86 })
  .toFile(OUT);

const { size } = await sharp(OUT).metadata();
console.log(`hero-portrait.webp ${W}x${H}`, size ? `${Math.round(size / 1024)} kB` : '');

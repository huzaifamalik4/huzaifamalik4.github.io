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

// The figure on its own, with the wall cut away, for the "decode" hero. The wall is found by
// flooding inward from the image border through light, colourless pixels. The result is a
// square power-of-two texture (so WebGL 1 can mipmap it); the page stretches it back.
const FIGURE_OUT = path.resolve('assets/img/hero-figure.webp');
const FIGURE_SIZE = 1024;
{
  const { data, info } = await sharp(photo).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const wall = new Uint8Array(w * h);
  for (let i = 0, p = 0; i < w * h; i++, p += 3) {
    const lo = Math.min(data[p], data[p + 1], data[p + 2]);
    const hi = Math.max(data[p], data[p + 1], data[p + 2]);
    wall[i] = lo >= 198 && hi - lo <= 22 ? 1 : 0;
  }
  const bg = new Uint8Array(w * h);
  const stack = [];
  const push = (x, y) => {
    const i = y * w + x;
    if (wall[i] && !bg[i]) { bg[i] = 1; stack.push(i); }
  };
  // The bottom edge is the sweater, so the flood starts from the other three sides only.
  for (let x = 0; x < w; x++) push(x, 0);
  for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }
  while (stack.length) {
    const i = stack.pop();
    const x = i % w, y = (i - x) / w;
    if (x > 0) push(x - 1, y);
    if (x < w - 1) push(x + 1, y);
    if (y > 0) push(x, y - 1);
    if (y < h - 1) push(x, y + 1);
  }
  const alpha = Buffer.alloc(w * h);
  for (let i = 0; i < w * h; i++) alpha[i] = bg[i] ? 0 : 255;
  // Pull the edge in a little: the stage is dark, so any wall-coloured fringe would glow.
  const soft = await sharp(alpha, { raw: { width: w, height: h, channels: 1 } })
    .blur(1.5)
    .linear(2.6, -205)
    .extractChannel(0)
    .raw()
    .toBuffer();
  if (soft.length !== w * h) throw new Error(`alpha is ${soft.length} bytes, expected ${w * h}`);
  // Joined first and resized second: in one pipeline sharp would resize before joining.
  const cut = await sharp(data, { raw: { width: w, height: h, channels: 3 } })
    .joinChannel(soft, { raw: { width: w, height: h, channels: 1 } })
    .png()
    .toBuffer();
  await sharp(cut)
    .resize(FIGURE_SIZE, FIGURE_SIZE, { fit: 'fill' })
    .webp({ quality: 84, alphaQuality: 92 })
    .toFile(FIGURE_OUT);
  // Preview on the stage colour, for checking the cut by eye.
  const onStage = await sharp({ create: { width: FIGURE_SIZE, height: FIGURE_SIZE, channels: 3, background: '#07081f' } })
    .composite([{ input: await sharp(FIGURE_OUT).png().toBuffer() }])
    .png()
    .toBuffer();
  await sharp(onStage)
    .resize(Math.round((FIGURE_SIZE * w) / h / 1.3), Math.round(FIGURE_SIZE / 1.3), { fit: 'fill' })
    .jpeg({ quality: 84 })
    .toFile(path.resolve('tools/shots/hero-figure-check.jpg'));
  const { size: bytes } = await (await import('node:fs/promises')).stat(FIGURE_OUT);
  console.log(`hero-figure.webp ${FIGURE_SIZE}x${FIGURE_SIZE} (shown at ${w}:${h})`, `${Math.round(bytes / 1024)} kB`);
}

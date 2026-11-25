// Builds the hero image: the figure from the portrait with the plain wall behind it cut
// away, so the stage can show the person on its own dark ground.
// Usage: node tools/build-hero.mjs
import sharp from 'sharp';
import path from 'node:path';
import { stat } from 'node:fs/promises';

const SRC = 'C:/Users/Huzaifa Malik/Downloads/Change_picture_to_second_one_592a93a8.jpg';
const OUT = path.resolve('assets/img/hero-figure.webp');

const TOP = 150; // rows of the original kept: 150 to 1000, which frames head and shoulders
const H = 850;
const PW = 896; // photo width
const SIZE = 1024;

const photo = await sharp(SRC).extract({ left: 0, top: TOP, width: PW, height: H }).toBuffer();

// The wall is found by flooding inward from the image border through light, colourless
// pixels. The result is a square power-of-two texture (so WebGL 1 can mipmap it); the page
// stretches it back.
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
  .resize(SIZE, SIZE, { fit: 'fill' })
  .webp({ quality: 84, alphaQuality: 92 })
  .toFile(OUT);

// Preview on the stage colour, for checking the cut by eye.
const onStage = await sharp({ create: { width: SIZE, height: SIZE, channels: 3, background: '#07081f' } })
  .composite([{ input: await sharp(OUT).png().toBuffer() }])
  .png()
  .toBuffer();
await sharp(onStage)
  .resize(Math.round((SIZE * w) / h / 1.3), Math.round(SIZE / 1.3), { fit: 'fill' })
  .jpeg({ quality: 84 })
  .toFile(path.resolve('tools/shots/hero-figure-check.jpg'));

const { size: bytes } = await stat(OUT);
console.log(`hero-figure.webp ${SIZE}x${SIZE} (shown at ${w}:${h})`, `${Math.round(bytes / 1024)} kB`);

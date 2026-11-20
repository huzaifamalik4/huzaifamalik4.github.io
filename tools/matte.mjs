// Cuts the plain paper background out of the triptychs and the silhouette, so page
// text can pass behind them. Flood-fills "paper" pixels inward from the image border.
// Usage: node tools/matte.mjs
import sharp from 'sharp';
import path from 'node:path';

const DL = 'C:/Users/Huzaifa Malik/Downloads';
const OUT = path.resolve('assets/img');

const jobs = [
  { out: 'triptych-a-cut', file: 'Modify_picture_to_match_another_0102b290.jpg', minLight: 200, maxSat: 24 },
  { out: 'triptych-b-cut', file: 'Edit_picture_to_match_second_31c7161e.jpg', minLight: 200, maxSat: 24 },
  { out: 'silhouette-cut', file: 'Change_picture_matching_second_one_f8c94100.jpg', minLight: 222, maxSat: 16 },
];

for (const job of jobs) {
  const { data, info } = await sharp(path.join(DL, job.file)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const paper = new Uint8Array(w * h);
  for (let i = 0, p = 0; i < w * h; i++, p += 3) {
    const r = data[p], g = data[p + 1], b = data[p + 2];
    const lo = Math.min(r, g, b), hi = Math.max(r, g, b);
    paper[i] = lo >= job.minLight && hi - lo <= job.maxSat ? 1 : 0;
  }
  // Flood from every border pixel.
  const bg = new Uint8Array(w * h);
  const stack = [];
  const push = (x, y) => {
    const i = y * w + x;
    if (paper[i] && !bg[i]) { bg[i] = 1; stack.push(i); }
  };
  for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
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
  let kept = 0;
  for (let i = 0; i < w * h; i++) { alpha[i] = bg[i] ? 0 : 255; kept += bg[i] ? 0 : 1; }
  // Soften and pull the edge in slightly so no paper-coloured fringe is left.
  const soft = await sharp(alpha, { raw: { width: w, height: h, channels: 1 } })
    .blur(1.1)
    .linear(2.2, -150)
    .extractChannel(0)
    .raw()
    .toBuffer();
  if (soft.length !== w * h) throw new Error(`alpha is ${soft.length} bytes, expected ${w * h}`);
  await sharp(data, { raw: { width: w, height: h, channels: 3 } })
    .joinChannel(soft, { raw: { width: w, height: h, channels: 1 } })
    .webp({ quality: 86, alphaQuality: 90 })
    .toFile(path.join(OUT, `${job.out}.webp`));
  // Preview on a strong colour, for checking the cut by eye.
  const onBlue = await sharp({ create: { width: w, height: h, channels: 3, background: '#2238ff' } })
    .composite([{ input: await sharp(path.join(OUT, `${job.out}.webp`)).png().toBuffer() }])
    .png()
    .toBuffer();
  await sharp(onBlue)
    .resize({ width: 520 })
    .jpeg({ quality: 80 })
    .toFile(path.resolve('tools/shots', `${job.out}-check.jpg`));
  console.log(job.out, `${w}x${h}`, 'kept', Math.round((kept / (w * h)) * 100) + '%');
}

// Builds the project covers that are not a straight screenshot of a page.
// Usage: node tools/build-covers.mjs            (writes assets/img/work-*.webp)
//        node tools/build-covers.mjs --sources  (only a contact sheet of the source shots)
// The source screenshots live in tools/shots (not in git): src-printrun-*.png are phone
// screens of Print Run, src-radar-*.png are the Remote Radar dashboard.
import sharp from 'sharp';
import path from 'node:path';
import { stat } from 'node:fs/promises';

const SHOTS = path.resolve('tools/shots');
const OUT = path.resolve('assets/img');
const W = 1440;
const H = 810;

if (process.argv.includes('--sources')) {
  const names = ['src-printrun-1', 'src-printrun-2', 'src-printrun-3', 'src-printrun-4', 'src-printrun-5'];
  const tiles = await Promise.all(names.map((name) => sharp(path.join(SHOTS, `${name}.png`)).resize({ height: 620 }).toBuffer()));
  const radar = await sharp(path.join(SHOTS, 'src-radar-1.png')).resize({ height: 620 }).toBuffer();
  const radarWidth = (await sharp(radar).metadata()).width;
  await sharp({ create: { width: 5 * 296 + radarWidth + 20, height: 640, channels: 3, background: '#222' } })
    .composite([...tiles.map((input, i) => ({ input, left: 10 + i * 296, top: 10 })), { input: radar, left: 10 + 5 * 296, top: 10 }])
    .jpeg({ quality: 82 })
    .toFile(path.join(SHOTS, 'covers-sources.jpg'));
  console.log('wrote tools/shots/covers-sources.jpg');
  process.exit(0);
}

const report = async (name) => console.log(name, `${Math.round((await stat(path.join(OUT, name))).size / 1024)} kB`);

// A phone: the screenshot with rounded corners inside a dark body, with a soft shadow.
async function phone(file, height, tilt) {
  const screenH = Math.round(height * 0.955);
  const screenW = Math.round((screenH * 780) / 1688);
  const bezel = Math.round((height - screenH) / 2);
  const bodyW = screenW + bezel * 2;
  const radius = Math.round(screenW * 0.115);
  const screen = await sharp(path.join(SHOTS, file))
    .resize(screenW, screenH)
    .composite([{ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${screenW}" height="${screenH}"><rect width="100%" height="100%" rx="${radius}" ry="${radius}"/></svg>`), blend: 'dest-in' }])
    .png()
    .toBuffer();
  const body = await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${bodyW}" height="${height}"><rect width="100%" height="100%" rx="${radius + bezel}" ry="${radius + bezel}" fill="#15120f"/></svg>`))
    .composite([{ input: screen, left: bezel, top: bezel }])
    .png()
    .toBuffer();
  const turned = await sharp(body).rotate(tilt, { background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  const meta = await sharp(turned).metadata();
  // The shadow is the phone's own outline, blurred. Each step is its own pipeline because
  // sharp does not run a chain in the order it is written.
  const outline = await sharp(turned).extractChannel('alpha').raw().toBuffer();
  const spread = await sharp(outline, { raw: { width: meta.width, height: meta.height, channels: 1 } })
    .extend({ top: 60, bottom: 60, left: 60, right: 60, background: { r: 0, g: 0, b: 0 } })
    .blur(26)
    .linear(0.5, 0)
    .extractChannel(0)
    .raw()
    .toBuffer();
  const shadowLayer = await sharp({ create: { width: meta.width + 120, height: meta.height + 120, channels: 3, background: '#3a1c05' } })
    .joinChannel(spread, { raw: { width: meta.width + 120, height: meta.height + 120, channels: 1 } })
    .png()
    .toBuffer();
  return { image: turned, shadow: shadowLayer, width: meta.width, height: meta.height };
}

// Print Run: three phone screens on a warm yellow that sets off the game's teal.
{
  const background = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs><radialGradient id="g" cx="50%" cy="42%" r="78%"><stop offset="0" stop-color="#ffe59a"/><stop offset="0.6" stop-color="#fbbf3d"/><stop offset="1" stop-color="#ee9a1e"/></radialGradient></defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
  </svg>`);
  const phones = [
    { file: 'src-printrun-2.png', height: 650, tilt: -9, cx: 372, cy: 452 },
    { file: 'src-printrun-4.png', height: 650, tilt: 9, cx: 1068, cy: 452 },
    { file: 'src-printrun-1.png', height: 760, tilt: 0, cx: 720, cy: 420 },
  ];
  const layers = [];
  for (const spec of phones) {
    const made = await phone(spec.file, spec.height, spec.tilt);
    layers.push({ input: made.shadow, left: Math.round(spec.cx - made.width / 2 - 60 + 14), top: Math.round(spec.cy - made.height / 2 - 60 + 30) });
    layers.push({ input: made.image, left: Math.round(spec.cx - made.width / 2), top: Math.round(spec.cy - made.height / 2) });
  }
  // Layers may hang over the edge, so they are placed on a larger sheet and the cover is cut out.
  const margin = 200;
  const sheet = await sharp({ create: { width: W + margin * 2, height: H + margin * 2, channels: 3, background: '#f4a340' } })
    .composite([{ input: await sharp(background).png().toBuffer(), left: margin, top: margin }, ...layers.map((layer) => ({ ...layer, left: layer.left + margin, top: layer.top + margin }))])
    .png()
    .toBuffer();
  await sharp(sheet).extract({ left: margin, top: margin, width: W, height: H }).webp({ quality: 82 }).toFile(path.join(OUT, 'work-printrun.webp'));
  await report('work-printrun.webp');
}

// Remote Radar: the dashboard as it is, cut to the cover's shape below the page header.
{
  const top = Number(process.env.RADAR_TOP || 0);
  await sharp(path.join(SHOTS, 'src-radar-1.png')).extract({ left: 0, top, width: 1440, height: 810 }).webp({ quality: 80 }).toFile(path.join(OUT, 'work-radar.webp'));
  await report('work-radar.webp');
}

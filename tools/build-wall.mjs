// Builds the picture sheet for the "screens" wall: 32 screens from the projects, each
// squeezed into a 256 px square, laid out 8 x 4 in one 2048 x 1024 image. The page
// un-squeezes them back to 4:3 when it draws the wall.
// Also writes src/wall-data.js, which says which project each tile belongs to.
// Usage: node tools/build-wall.mjs
import sharp from 'sharp';
import { mkdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const SALVO = 'D:/salvo/docs';
const DING = 'D:/dingline/docs/screenshots';
const QURAN = 'D:/quran-classroom/test/out';
const IMG = path.resolve('assets/img');

const COLS = 8;
const ROWS = 4;
const CELL = 256;
const WORK_W = 640; // each tile is composed at 4:3 before it is squeezed
const WORK_H = 480;

// A cell of one of the SALVO sheets, which hold a grid of screenshots each.
const sheetCell = (file, cols, rows, width, height, col, row) => {
  const w = Math.floor(width / cols);
  const h = Math.floor(height / rows);
  const cropW = Math.round((h * 4) / 3);
  return { file, extract: { left: col * w + Math.round((w - cropW) / 2), top: row * h, width: cropW, height: h } };
};
const landfall = (col, row) => sheetCell(`${SALVO}/landfall.jpg`, 3, 2, 1928, 724, col, row);
const maps = (col, row) => sheetCell(`${SALVO}/maps.jpg`, 3, 3, 1920, 1080, col, row);

// Each tile: where the picture comes from, how to fit it, which project, and a caption.
const BUCKETS = {
  salvo: [
    { ...landfall(2, 0), caption: 'Parachute drop' },
    { ...landfall(1, 0), caption: 'The island from above' },
    { ...maps(1, 1), caption: 'Neon city map' },
    { ...landfall(0, 0), caption: 'Flying in' },
    { ...landfall(1, 1), caption: 'Harbour' },
    { ...maps(1, 2), caption: 'Snow base map' },
    { ...landfall(0, 1), caption: 'Village' },
    { ...maps(1, 0), caption: 'Desert town map' },
    { ...landfall(2, 1), caption: 'Forest' },
    { ...maps(2, 1), caption: 'Neon alley' },
  ],
  dingline: [
    { file: `${DING}/landing.png`, extract: { left: 120, top: 0, width: 1200, height: 900 }, caption: 'Landing page' },
    { file: `${DING}/customer-your-turn.png`, extract: { left: 0, top: 110, width: 780, height: 585 }, caption: 'It is your turn' },
    { file: `${DING}/tv-display.png`, contain: '#1b1712', caption: 'Waiting room TV' },
    { file: `${DING}/staff-console.png`, extract: { left: 0, top: 0, width: 1146, height: 860 }, caption: 'Staff console' },
    { file: `${DING}/order-tracking.png`, extract: { left: 0, top: 70, width: 780, height: 585 }, caption: 'Order tracking' },
    { file: `${DING}/insights.png`, extract: { left: 0, top: 0, width: 900, height: 675 }, caption: 'Insights' },
    { file: `${DING}/poster.png`, extract: { left: 0, top: 40, width: 900, height: 675 }, caption: 'Door poster' },
    { file: `${DING}/urdu.png`, extract: { left: 0, top: 90, width: 780, height: 585 }, caption: 'Queue ticket in Urdu' },
    { file: `${DING}/customer-almost.png`, extract: { left: 0, top: 30, width: 390, height: 292 }, caption: 'You are next' },
    { file: `${DING}/staff-console-phone.png`, extract: { left: 0, top: 180, width: 780, height: 585 }, caption: 'Staff console on a phone' },
  ],
  quran: [
    { file: `${QURAN}/08-teacher-student-pointer.png`, extract: { left: 171, top: 0, width: 1024, height: 768 }, caption: 'Live pointer' },
    { file: `${QURAN}/02-teacher-lobby.png`, extract: { left: 171, top: 0, width: 1024, height: 768 }, caption: 'Teacher lobby' },
    { file: `${QURAN}/01-dashboard.png`, extract: { left: 171, top: 0, width: 1024, height: 768 }, caption: 'Class list' },
    { file: `${QURAN}/10-invite.png`, extract: { left: 171, top: 0, width: 1024, height: 768 }, caption: 'Invite a student' },
    { file: `${QURAN}/03-student-lobby.png`, extract: { left: 0, top: 50, width: 390, height: 292 }, caption: 'Student lobby' },
    { file: `${QURAN}/11-settings.png`, extract: { left: 342, top: 0, width: 1024, height: 768 }, caption: 'Settings' },
  ],
  morra: [
    { file: `${IMG}/work-morra.webp`, extract: { left: 740, top: 90, width: 700, height: 525 }, caption: 'Coffee bags' },
    { file: `${IMG}/work-morra.webp`, extract: { left: 10, top: 80, width: 800, height: 600 }, caption: 'Store home page' },
  ],
  mehrab: [
    { file: `${IMG}/work-mehrab.webp`, extract: { left: 720, top: 60, width: 720, height: 540 }, caption: 'Arches' },
    { file: `${IMG}/work-mehrab.webp`, extract: { left: 10, top: 40, width: 800, height: 600 }, caption: 'Studio home page' },
  ],
  ginti: [
    { file: `${IMG}/work-ginti.webp`, extract: { left: 690, top: 100, width: 750, height: 562 }, caption: 'App screens' },
    { file: `${IMG}/work-ginti.webp`, extract: { left: 10, top: 110, width: 800, height: 600 }, caption: 'Landing page' },
  ],
};

// Deal the tiles out so neighbours on the wall come from different projects.
const ORDER = ['salvo', 'dingline', 'quran', 'morra', 'salvo', 'dingline', 'quran', 'mehrab', 'salvo', 'dingline', 'quran', 'ginti'];
const queues = Object.fromEntries(Object.entries(BUCKETS).map(([key, list]) => [key, [...list]]));
const tiles = [];
for (let turn = 0; tiles.length < COLS * ROWS && turn < 400; turn++) {
  const key = ORDER[turn % ORDER.length];
  const next = queues[key].shift();
  if (next) tiles.push({ ...next, project: key });
}
if (tiles.length !== COLS * ROWS) throw new Error(`need ${COLS * ROWS} tiles, have ${tiles.length}`);

async function compose(tile) {
  let image = sharp(tile.file);
  if (tile.extract) {
    image = image.extract(tile.extract).resize(WORK_W, WORK_H, { fit: 'cover' });
  } else {
    image = image.resize(WORK_W, WORK_H, { fit: 'contain', background: tile.contain });
  }
  return image.flatten({ background: '#000' }).png().toBuffer();
}

const composed = await Promise.all(tiles.map(compose));
const cells = await Promise.all(composed.map((buffer) => sharp(buffer).resize(CELL, CELL, { fit: 'fill' }).toBuffer()));

await mkdir(IMG, { recursive: true });
const atlasPath = path.join(IMG, 'wall-atlas.webp');
await sharp({ create: { width: COLS * CELL, height: ROWS * CELL, channels: 3, background: '#000' } })
  .composite(cells.map((input, i) => ({ input, left: (i % COLS) * CELL, top: Math.floor(i / COLS) * CELL })))
  .webp({ quality: 78, effort: 6 })
  .toFile(atlasPath);

const data = `// Written by tools/build-wall.mjs. One entry per tile of assets/img/wall-atlas.webp,
// in reading order: the project it belongs to and what the screen shows.
export const WALL_COLS = ${COLS};
export const WALL_ROWS = ${ROWS};
export const WALL_TILES = ${JSON.stringify(tiles.map(({ project, caption }) => [project, caption]))};
`;
await writeFile('src/wall-data.js', data);

// A sheet for checking the crops by eye, with the tiles back at 4:3.
if (process.argv.includes('--preview')) {
  const pw = 300;
  const ph = 225;
  const thumbs = await Promise.all(composed.map((buffer) => sharp(buffer).resize(pw, ph).toBuffer()));
  await mkdir('tools/shots', { recursive: true });
  await sharp({ create: { width: COLS * (pw + 4) + 4, height: ROWS * (ph + 4) + 4, channels: 3, background: '#ff3b8d' } })
    .composite(thumbs.map((input, i) => ({ input, left: 4 + (i % COLS) * (pw + 4), top: 4 + Math.floor(i / COLS) * (ph + 4) })))
    .jpeg({ quality: 82 })
    .toFile('tools/shots/wall-preview.jpg');
}

const { size } = await stat(atlasPath);
console.log(`wall-atlas.webp ${COLS * CELL}x${ROWS * CELL}, ${tiles.length} tiles, ${Math.round(size / 1024)} kB`);
console.log(tiles.map((t, i) => `${i}:${t.project}`).join(' '));

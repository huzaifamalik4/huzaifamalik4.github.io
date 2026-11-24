// Turns the source photos and project screenshots into the web images in assets/img.
// Usage: node tools/build-images.mjs
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const DL = 'C:/Users/Huzaifa Malik/Downloads';
const OUT = path.resolve('assets/img');
await mkdir(OUT, { recursive: true });

// Portraits shown as framed photos. The triptychs and the silhouette are cut out
// separately by tools/matte.mjs.
const photos = {
  'portrait-a': 'Change_picture_to_second_one_592a93a8.jpg',
  'portrait-c': 'Change_picture_to_second_one_2d865620.jpg',
  'portrait-tall': 'Modify_image_to_match_second_f5ea8cb6.jpg',
};

for (const [name, file] of Object.entries(photos)) {
  await sharp(path.join(DL, file)).webp({ quality: 84 }).toFile(path.join(OUT, `${name}.webp`));
}

// Small round avatar for the hero, cut from the face in the fourth portrait.
await sharp(path.join(DL, 'Change_picture_format_43b6842c.jpg'))
  .extract({ left: 262, top: 300, width: 380, height: 380 })
  .resize(160, 160)
  .webp({ quality: 82 })
  .toFile(path.join(OUT, 'avatar.webp'));

// Project covers.
await sharp('D:/salvo/docs/landfall.jpg')
  .extract({ left: 644, top: 0, width: 1284, height: 724 })
  .webp({ quality: 82 })
  .toFile(path.join(OUT, 'work-salvo.webp'));

await sharp('D:/dingline/docs/screenshots/landing.png')
  .extract({ left: 0, top: 0, width: 1440, height: 810 })
  .webp({ quality: 86 })
  .toFile(path.join(OUT, 'work-dingline.webp'));

await sharp('D:/quran-classroom/test/out/04-teacher-quran.png')
  .extract({ left: 0, top: 0, width: 1076, height: 605 })
  .webp({ quality: 86 })
  .toFile(path.join(OUT, 'work-quran.webp'));

// Social preview card.
const og = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="#ecebe7"/>
  <text x="72" y="118" font-family="Segoe UI, Arial, sans-serif" font-size="26" fill="#55555a" letter-spacing="3">HUZAIFAMALIK.ME</text>
  <text x="68" y="318" font-family="Segoe UI, Arial, sans-serif" font-weight="600" font-size="112" fill="#0d0d0e" letter-spacing="-5">Huzaifa</text>
  <text x="68" y="430" font-family="Segoe UI, Arial, sans-serif" font-weight="600" font-size="112" fill="#0d0d0e" letter-spacing="-5">Malik</text>
  <circle cx="84" cy="532" r="10" fill="#2238ff"/>
  <text x="108" y="542" font-family="Segoe UI, Arial, sans-serif" font-size="32" fill="#0d0d0e">Web developer and designer</text>
</svg>`);
const face = await sharp(path.join(DL, photos['portrait-a']))
  // right-hand side of the card
  .extract({ left: 96, top: 150, width: 800, height: 1000 })
  .resize({ height: 630 })
  .toBuffer();
await sharp(og)
  .composite([{ input: face, left: 1200 - 504, top: 0 }])
  .jpeg({ quality: 86 })
  .toFile(path.join(OUT, 'og.jpg'));

console.log('images written to', OUT);

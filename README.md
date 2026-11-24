# huzaifamalik.me

Portfolio of Huzaifa Malik, web developer and designer. Live at [huzaifamalik.me](https://huzaifamalik.me).

A static site served by GitHub Pages from the root of `main`. No framework: one HTML page, one stylesheet and a small script bundle.

## Layout

| Path | What it is |
| --- | --- |
| `index.html` | The whole page. All text lives here. |
| `assets/css/style.css` | Styles. Colours and spacing are variables at the top. |
| `assets/js/` | Built script bundle. Do not edit by hand. |
| `assets/img/`, `assets/fonts/` | Photos, project covers and the two fonts. |
| `src/main.js` | Scrolling, animations, menu, loader. |
| `src/hero.js` | The picture at the top of the page: a portrait covered in code that the pointer wipes away (plain WebGL). |
| `src/theme.js`, `src/prism.js` | Light and dark themes. The switch is a ring of light that spreads from the button. Colours for both themes are variables at the top of `style.css`. |
| `src/wall.js`, `src/wall-data.js` | The "Look closer" wall: small screens from the projects, with a lens that follows the pointer. `wall-data.js` and `assets/img/wall-atlas.webp` are written by `tools/build-wall.mjs`. |
| `src/dial.js` | Experience layout 4: a dial that turns through the years, built from the timeline lists in `index.html`. |
| `src/details.js` | Typed section labels, the capsule in the corner that turns with the scroll, and the time difference in the footer. |
| `assets/css/variants.css`, `src/variants.js` | Alternative layouts for each section and the picker that compares them. Open the site with `?pick` in the address to use it. |
| `concepts/` | Three one-page design concepts shown in the Work section. They are not real companies. |
| `tools/` | Build, preview and image scripts. `shoot.mjs`, `shoot-variants.mjs` and `probe.mjs` photograph the site in headless Chrome to check it. |
| `CNAME` | Keeps the custom domain. Do not delete. |

## Changing things

Text, links and prices: edit `index.html`, commit, push. No build needed.

Scripts in `src/`: rebuild, then commit the new files in `assets/js/`.

```
npm install
npm run build
npm run dev      # preview at http://localhost:4173
```

Photos: `tools/build-images.mjs`, `tools/build-hero.mjs` and `tools/matte.mjs` turn the original pictures into the web images. The paths at the top of each file point at the originals on the author's computer.

Screens on the wall: the list is at the top of `tools/build-wall.mjs`. Add or change a screen there, run `node tools/build-wall.mjs --preview`, check `tools/shots/wall-preview.jpg`, then rebuild. Each screen is tied to a Work card through the card's `data-project` attribute, and the wall reads the project's name and text from that card.

## Credits

Type: Geist, Instrument Serif, Fraunces and Bricolage Grotesque (SIL Open Font License). Libraries: GSAP and Lenis.

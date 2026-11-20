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
| `src/hero.js` | The 3D scene at the top of the page (three.js). |
| `tools/` | Build, preview and image scripts. |
| `CNAME` | Keeps the custom domain. Do not delete. |

## Changing things

Text, links and prices: edit `index.html`, commit, push. No build needed.

Scripts in `src/`: rebuild, then commit the new files in `assets/js/`.

```
npm install
npm run build
npm run dev      # preview at http://localhost:4173
```

Photos: `tools/build-images.mjs` and `tools/matte.mjs` turn the original pictures into the web images. The paths at the top of each file point at the originals on the author's computer.

## Credits

Type: Geist and Instrument Serif (SIL Open Font License). Libraries: three.js, GSAP and Lenis.

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
| `src/hero.js` | The stage at the top of the page: a wall of code with a person behind it. Every character is a particle. Scrolling flips the characters into a portrait drawn in code, then the photograph comes through; the pointer pushes the characters apart (plain WebGL). `src/code-lines.js` holds the code that is shown. |
| `src/archive.js`, `assets/css/archive.css` | The "Twelve projects" section. The list of projects is plain HTML in `index.html`; on wide screens the script flies the covers in as a ribbon that settles into a grid, and a cover opens a sheet with the project's details. |
| `src/theme.js`, `src/prism.js` | Light and dark themes. The switch is a ring of light that spreads from the button. Colours for both themes are variables at the top of `style.css`. |
| `src/wall.js`, `src/wall-data.js` | The "Look closer" wall: small screens from the projects, with a lens that follows the pointer. `wall-data.js` and `assets/img/wall-atlas.webp` are written by `tools/build-wall.mjs`. |
| `src/details.js` | Typed section labels, the capsule in the corner that turns with the scroll, and the time difference in the footer. |
| `concepts/` | Six one-page design concepts shown in the Work and archive sections. They are not real companies, and each page says so. |
| `crm/` | The CRM and inside sales page: what I do, a client case study (the lead route into GoHighLevel) and a sample follow-up playbook. One self-contained HTML file. Its two dark and light panels (`#flow`, `#board`) are also the covers of the "Lead Route" and "First Five Minutes" projects. |
| `tools/` | Build, preview and image scripts. `shoot.mjs` and `probe.mjs` photograph the site in headless Chrome to check it. |
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

Project covers: a concept's cover is a picture of its own page (`node tools/snap.mjs /concepts/<name>/ 1440 810 tools/shots/concept-<name>.png .credit`, then saved as `assets/img/work-<name>.webp`). `tools/build-covers.mjs` makes the Print Run and Remote Radar covers from screenshots kept in `tools/shots`. The two CRM covers are pictures of panels on the CRM page: `node tools/snap.mjs "/crm/#flow" 1440 810 tools/shots/crm-flow.png .nav` (and `#board`), saved as `work-leads.webp` and `work-playbook.webp`. The Momentum Studio cover is a screenshot of its editor. To add a project to the archive, copy one `<li class="tile">` in `index.html`.

Earlier layouts: the site was first built with several layouts for each section and a picker to compare them. The ones that were not chosen (an earlier hero, glass folders for the archive, a dial for the experience section and others) have been removed. The last commit that has them is `051a7b5`.

Screens on the wall: the list is at the top of `tools/build-wall.mjs`. Add or change a screen there, run `node tools/build-wall.mjs --preview`, check `tools/shots/wall-preview.jpg`, then rebuild. Each screen is tied to a Work card through the card's `data-project` attribute, and the wall reads the project's name and text from that card.

## Credits

Type: Geist, Instrument Serif, Fraunces and Bricolage Grotesque (SIL Open Font License). Libraries: GSAP and Lenis.

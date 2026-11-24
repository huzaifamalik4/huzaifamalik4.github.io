// Checks the moving parts that a still screenshot cannot show: the opening, the theme
// switch, the screens wall and the experience dial.
// Usage: node tools/probe.mjs <intro|theme|wall|dial> [width] [height] [mobile] [dark]
import { withPage, sheet, sleep, presets } from './cdp.mjs';

const [what = 'theme', width = '1440', height = '900', ...flags] = process.argv.slice(2);
const W = Number(width);
const H = Number(height);
const mobile = flags.includes('mobile');
const theme = flags.includes('dark') ? 'dark' : '';
const tag = `${mobile ? 'm' : 'd'}${theme ? '-dark' : ''}`;
const URL_ = 'http://localhost:4173/';

const scenarios = {
  // Frames across the opening, to see the loader break up.
  async intro(page) {
    await page.send('Page.navigate', { url: URL_ });
    const frames = [];
    await sleep(1500);
    for (let i = 0; i < 16; i++) {
      frames.push(await page.shot());
      await sleep(110);
    }
    return sheet(`probe-intro-${tag}.jpg`, frames, { perRow: 4, tileWidth: mobile ? 240 : 470 });
  },

  // Press the theme button and photograph the sweep.
  async theme(page) {
    await page.goto(URL_, 6500);
    if (process.env.PROBE_SCROLL) {
      await page.scrollTo(Number(process.env.PROBE_SCROLL));
      await sleep(2500);
    }
    const frames = [await page.shot()];
    const selector = mobile ? '.menu__theme [data-theme-toggle]' : '.theme-btn';
    if (mobile) {
      await page.evaluate(`document.querySelector('[data-menu-btn]').click()`);
      await sleep(700);
    }
    await page.evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
    for (let i = 0; i < 11; i++) {
      await sleep(120);
      frames.push(await page.shot());
    }
    await sleep(1200);
    frames.push(await page.shot());
    const state = await page.evaluate(`JSON.stringify({ theme: document.documentElement.dataset.theme, stored: localStorage.getItem('hm-theme'), theming: document.documentElement.classList.contains('is-theming'), vt: Boolean(document.startViewTransition), prismLost: (() => { const c = document.querySelector('.prism'); return c ? c.getContext('webgl').isContextLost() : 'no canvas'; })() })`);
    console.log('state', state);
    return sheet(`probe-theme-${tag}.jpg`, frames, { perRow: 4, tileWidth: mobile ? 240 : 470 });
  },

  // One full-size frame part-way through the sweep (PROBE_AT = milliseconds after the press),
  // plus how long the whole change took.
  async themeAt(page) {
    await page.goto(URL_, 6500);
    const at = Number(process.env.PROBE_AT || 500);
    const y = Number(process.env.PROBE_SCROLL || 0);
    if (y) {
      await page.scrollTo(y);
      await sleep(1500);
    }
    await page.evaluate(`(() => {
      window.__t0 = performance.now();
      window.__took = null;
      new MutationObserver(() => {
        if (!document.documentElement.classList.contains('is-theming') && window.__took === null) window.__took = Math.round(performance.now() - window.__t0);
      }).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
      document.querySelector('.theme-btn').click();
    })()`);
    await sleep(at);
    const file = await page.save(`probe-theme-at-${at}-${tag}.png`);
    await sleep(2500);
    console.log('took ms', await page.evaluate('window.__took'));
    return file;
  },

  // Scroll to the wall, move the pointer across it, then click a screen.
  async wall(page) {
    await page.goto(URL_, 6500);
    const top = await page.evaluate(`(() => { const el = document.querySelector('[data-wall-stage]'); return el.getBoundingClientRect().top + window.scrollY; })()`);
    await page.scrollTo(top - (H - await page.evaluate(`document.querySelector('[data-wall-stage]').offsetHeight`)) / 2);
    await sleep(3500);
    const frames = [await page.shot()];
    const box = await page.evaluate(`(() => { const r = document.querySelector('[data-wall-stage]').getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; })()`);
    const path = [[0.62, 0.55], [0.3, 0.62], [0.78, 0.3]];
    for (const [fx, fy] of path) {
      for (let i = 0; i <= 12; i++) {
        await page.move(box.x + box.w * (fx - 0.1 + 0.1 * (i / 12)), box.y + box.h * fy);
        await sleep(40);
      }
      await sleep(900);
      frames.push(await page.shot());
    }
    await page.click(box.x + box.w * 0.45, box.y + box.h * 0.55);
    await sleep(1600);
    frames.push(await page.shot());
    const info = await page.evaluate(`JSON.stringify({ live: document.querySelector('[data-wall-stage]').className, label: document.querySelector('[data-wall-label]').innerText, card: document.querySelector('[data-wall-card]').innerText })`);
    console.log('wall', info);
    await page.save(`probe-wall-${tag}-last.png`);
    return sheet(`probe-wall-${tag}.jpg`, frames, { perRow: mobile ? 5 : 2, tileWidth: mobile ? 300 : 900 });
  },

  // The design picker, open.
  async picker(page) {
    await page.evaluate(`sessionStorage.removeItem('hm-design-picker-closed')`);
    await page.goto(`${URL_}?pick=1`, 4500);
    await page.evaluate(`sessionStorage.removeItem('hm-design-picker-closed'); document.querySelector('.picker').classList.remove('is-closed')`);
    await sleep(300);
    console.log('picker', await page.evaluate(`document.querySelector('[data-picker-summary]').textContent`));
    return page.save(`probe-picker-${tag}.png`);
  },

  // Walk through the experience dial.
  async dial(page) {
    await page.goto(`${URL_}?pick=1`, 5000);
    const info = await page.evaluate(`(() => { const d = document.querySelector('.dial'); if (!d) return null; return { top: d.getBoundingClientRect().top + window.scrollY, height: d.offsetHeight }; })()`);
    if (!info) throw new Error('dial was not built');
    const frames = [];
    for (const k of [-0.12, 0.08, 0.3, 0.5, 0.7, 0.9, 1, 1.12]) {
      await page.scrollTo(info.top + (info.height - H) * k);
      await sleep(1700);
      frames.push(await page.shot());
    }
    return sheet(`probe-dial-${tag}.jpg`, frames, { perRow: mobile ? 4 : 2, tileWidth: mobile ? 300 : 900 });
  },
};

// "novt" hides the browser's view transitions, to check the fallback for older browsers.
// "reduced" asks for reduced motion, the way a visitor's system setting would.
const preload = presets({ theme, choices: what === 'dial' ? { experience: 'd' } : null })
  + (flags.includes('novt') ? '\ntry { Object.defineProperty(Document.prototype, "startViewTransition", { value: undefined }); } catch (e) {}' : '');
const file = await withPage({ width: W, height: H, mobile, preload, port: 9341 }, async (page) => {
  if (flags.includes('reduced')) {
    await page.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  }
  const out = await scenarios[what](page);
  const overflow = await page.evaluate('document.documentElement.scrollWidth - window.innerWidth');
  console.log(page.errors.length ? `PROBLEMS:\n${page.errors.join('\n')}` : 'no script errors', `| sideways overflow: ${overflow}px`);
  return out;
});
console.log(file);

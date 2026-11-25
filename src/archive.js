// The archive: every project in one list. On wide screens the covers fly in as a ribbon
// and settle into a grid; elsewhere the grid is simply there. A cover opens a sheet with
// the project's details.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const clamp = gsap.utils.clamp(0, 1);
const smooth = (t) => t * t * (3 - 2 * t);
const mix = (a, b, t) => a + (b - a) * t;

/* ---------- Project sheet ---------- */

function createSheet(section, tiles, { lenis }) {
  const dialog = section.querySelector('[data-sheet]');
  const part = (name) => dialog.querySelector(`[data-sheet-${name}]`);
  const canOpen = typeof dialog.showModal === 'function';
  let workCard = null;

  function open(index) {
    const tile = tiles[index];
    const text = (selector) => {
      const el = tile.querySelector(selector);
      return el ? el.textContent : '';
    };
    const status = tile.querySelector('.tag');
    part('index').textContent = `[${String(index + 1).padStart(2, '0')}]`;
    part('kind').textContent = text('.tile__kind');
    part('status').textContent = status.textContent;
    part('status').className = status.className;
    part('title').textContent = text('h3');
    part('line').textContent = text('.tile__line');
    part('more').textContent = text('.tile__more');
    part('stack').innerHTML = tile.querySelector('.tile__stack').innerHTML;
    part('image').src = tile.querySelector('img').getAttribute('src');

    // Where the main button leads: the concept page, the project's card in Work, or contact.
    const link = part('link');
    const own = tile.querySelector('.tile__link');
    workCard = tile.dataset.work ? document.querySelector(`[data-section="work"] [data-project="${tile.dataset.work}"]`) : null;
    const label = link.querySelector('span');
    link.removeAttribute('target');
    link.removeAttribute('rel');
    if (own) {
      link.href = own.getAttribute('href');
      link.target = '_blank';
      link.rel = 'noopener';
      label.textContent = own.textContent;
      workCard = null;
    } else if (workCard) {
      link.href = '#work';
      label.textContent = 'Show it in Work';
    } else {
      link.href = '#contact';
      label.textContent = 'Ask me about it';
    }

    if (!canOpen) {
      if (own) window.open(own.href, '_blank', 'noopener');
      return;
    }
    dialog.showModal();
    if (lenis) lenis.stop();
  }

  dialog.addEventListener('close', () => {
    if (lenis) lenis.start();
  });
  // A click on the dimmed page around the sheet closes it.
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  part('close').addEventListener('click', () => dialog.close());
  part('link').addEventListener('click', (event) => {
    const card = workCard;
    if (part('link').getAttribute('href').startsWith('#')) dialog.close();
    if (!card) return;
    event.preventDefault();
    event.stopPropagation();
    if (lenis) lenis.scrollTo(card, { offset: -110, duration: 1.4 });
    else card.scrollIntoView({ block: 'center' });
  });

  return { open };
}

/* ---------- Grid and reel ---------- */

// The line above the grid names whichever project the pointer or the keyboard is on.
function initBar(section, tiles, sheet) {
  const grid = section.querySelector('[data-archive-grid]');
  const index = section.querySelector('[data-bar-index]');
  const name = section.querySelector('[data-bar-name]');
  const line = section.querySelector('[data-bar-line]');
  const openButton = section.querySelector('[data-bar-open]');
  let current = -1;
  const pick = (i) => {
    if (i === current) return;
    current = i;
    tiles.forEach((tile, j) => tile.classList.toggle('is-picked', j === i));
    grid.classList.add('has-pick');
    index.textContent = `[${String(i + 1).padStart(2, '0')}]`;
    name.textContent = tiles[i].querySelector('h3').textContent;
    line.textContent = tiles[i].querySelector('.tile__line').textContent;
    openButton.disabled = false;
  };
  tiles.forEach((tile, i) => {
    tile.addEventListener('pointerenter', () => pick(i));
    tile.querySelector('.tile__open').addEventListener('focus', () => pick(i));
  });
  openButton.addEventListener('click', () => {
    if (current >= 0) sheet.open(current);
  });
}

// The ribbon's path across the stage, as fractions of its width and height: in from the
// bottom right, up over the headline, down, and out at the top left.
const PATH = [[1.2, 1.1], [0.7, 0.06], [0.36, 1.02], [-0.24, 0.12]];
function pathAt(s) {
  const u = 1 - s;
  const a = u * u * u;
  const b = 3 * u * u * s;
  const c = 3 * u * s * s;
  const d = s * s * s;
  const da = -3 * u * u;
  const db = 3 * u * u - 6 * u * s;
  const dc = 6 * u * s - 3 * s * s;
  const dd = 3 * s * s;
  return {
    x: a * PATH[0][0] + b * PATH[1][0] + c * PATH[2][0] + d * PATH[3][0],
    y: a * PATH[0][1] + b * PATH[1][1] + c * PATH[2][1] + d * PATH[3][1],
    dx: da * PATH[0][0] + db * PATH[1][0] + dc * PATH[2][0] + dd * PATH[3][0],
    dy: da * PATH[0][1] + db * PATH[1][1] + dc * PATH[2][1] + dd * PATH[3][1],
  };
}

function initReel(section, tiles) {
  const track = section.querySelector('[data-archive-track]');
  const pin = section.querySelector('[data-archive-pin]');
  const head = section.querySelector('[data-archive-head]');
  const bar = section.querySelector('[data-archive-bar]');
  const SPACING = 0.074; // how far apart the covers sit along the ribbon

  gsap.matchMedia().add('(min-width: 900px) and (min-height: 600px)', () => {
    section.classList.add('is-reel');
    let slots = [];
    let width = 1;
    let height = 1;
    const state = { q: 0 };

    // Where each cover rests in the grid, measured with nothing moved.
    const measure = () => {
      tiles.forEach((tile) => { tile.style.transform = ''; });
      const base = pin.getBoundingClientRect();
      width = base.width;
      height = base.height;
      slots = tiles.map((tile) => {
        const rect = tile.querySelector('.tile__open').getBoundingClientRect();
        return { x: rect.left - base.left + rect.width / 2, y: rect.top - base.top + rect.height / 2, w: rect.width };
      });
    };

    const apply = () => {
      const q = state.q;
      // The ribbon runs in quickly, then keeps drifting while the covers leave it.
      const lead = q < 0.5 ? -0.08 + 0.9 * smooth(q / 0.5) : 0.82 + (q - 0.5) * 0.3;
      tiles.forEach((tile, i) => {
        const slot = slots[i];
        // Held just off stage at either end, so nothing wanders far outside the page.
        const s = Math.max(-0.2, Math.min(1.14, lead - i * SPACING));
        const point = pathAt(s);
        const settle = smooth(clamp((q - 0.5 - i * 0.016) / 0.17));
        const near = 1 - clamp(s); // 1 where the ribbon enters, close to the eye; 0 where it leaves
        const x = mix(point.x * width - slot.x, 0, settle);
        const y = mix(point.y * height - slot.y, 0, settle);
        const turn = mix((Math.atan2(-point.dy * height, -point.dx * width) * 180) / Math.PI, 0, settle);
        const swing = mix(-46 + 26 * near, 0, settle);
        const scale = mix(((0.52 + 1.02 * near * near) * width * 0.22) / slot.w, 1, settle);
        tile.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotate(${turn.toFixed(2)}deg) rotateY(${swing.toFixed(2)}deg) scale(${scale.toFixed(4)})`;
        tile.style.zIndex = settle >= 1 ? '' : String(1 + i);
        tile.lastElementChild.style.opacity = settle.toFixed(3);
      });
      const leaving = smooth(clamp((q - 0.4) / 0.14));
      head.style.opacity = (1 - leaving).toFixed(3);
      head.style.transform = `scale(${(1 - leaving * 0.06).toFixed(4)})`;
      const arrived = smooth(clamp((q - 0.8) / 0.1));
      bar.style.opacity = arrived.toFixed(3);
      bar.style.transform = `translateY(${((1 - arrived) * 14).toFixed(1)}px)`;
      pin.classList.toggle('is-settled', q > 0.86);
    };

    measure();
    apply();
    gsap.to(state, {
      q: 1,
      ease: 'none',
      onUpdate: apply,
      scrollTrigger: { trigger: track, start: 'top 80%', end: 'bottom bottom', scrub: 0.7 },
    });
    const onRefresh = () => {
      measure();
      apply();
    };
    ScrollTrigger.addEventListener('refreshInit', onRefresh);

    // Runs when the window becomes too small for the reel. By then gsap has already undone
    // the tween and its ScrollTrigger; this puts the plain grid back.
    return () => {
      ScrollTrigger.removeEventListener('refreshInit', onRefresh);
      section.classList.remove('is-reel');
      pin.classList.remove('is-settled');
      tiles.forEach((tile) => {
        tile.style.transform = '';
        tile.style.zIndex = '';
        tile.lastElementChild.style.opacity = '';
      });
      [head, bar].forEach((el) => {
        el.style.opacity = '';
        el.style.transform = '';
      });
    };
  });
}

/* ---------- Start ---------- */

export function initArchive({ lenis = null, reducedMotion = false } = {}) {
  const section = document.querySelector('[data-section="archive"]');
  if (!section) return;
  const tiles = Array.from(section.querySelectorAll('.tile'));
  const sheet = createSheet(section, tiles, { lenis });
  tiles.forEach((tile, index) => tile.querySelector('.tile__open').addEventListener('click', () => sheet.open(index)));

  initBar(section, tiles, sheet);
  // The stylesheet keeps the bar hidden until it can do something.
  section.classList.add('is-live');
  if (!reducedMotion) initReel(section, tiles);
}

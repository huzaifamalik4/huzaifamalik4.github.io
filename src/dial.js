// Experience "Dial": the years since 2020 laid out round a dial. As the page scrolls,
// a hand sweeps from 2020 to today, each job draws itself as an arc while the hand
// passes over its years, and the number in the middle counts the years up.
// The dial is built from the timeline lists already in the page, so the text lives in one place.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const START_YEAR = 2020;
const SVG_NS = 'http://www.w3.org/2000/svg';

const clamp01 = (value) => Math.min(1, Math.max(0, value));
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

function svg(name, attributes = {}, parent) {
  const el = document.createElementNS(SVG_NS, name);
  Object.entries(attributes).forEach(([key, value]) => el.setAttribute(key, String(value)));
  if (parent) parent.appendChild(el);
  return el;
}

// 0 degrees is the top of the dial; angles run clockwise.
function point(degrees, radius) {
  const a = (degrees * Math.PI) / 180;
  return [radius * Math.sin(a), -radius * Math.cos(a)];
}

function arcPath(from, to, radius) {
  const [x0, y0] = point(from, radius);
  const [x1, y1] = point(to, radius);
  return `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${radius} ${radius} 0 ${to - from > 180 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
}

// "2020 to 2024" runs to the end of 2024; "2026 to now" runs to today.
function readItems(section, now) {
  const items = [];
  section.querySelectorAll('.exp__lists > div').forEach((group, groupIndex) => {
    group.querySelectorAll('.timeline li').forEach((row) => {
      const when = row.querySelector('.timeline__year');
      const what = row.querySelector('.timeline__what');
      if (!when || !what) return;
      const years = when.textContent.match(/\d{4}/g);
      if (!years) return;
      const from = Number(years[0]);
      const to = /now/i.test(when.textContent) ? now : Math.min(now, Number(years[1] || years[0]) + 1);
      if (to <= from) return;
      items.push({ from, to, when: when.textContent.trim(), what: what.firstChild.textContent.trim(), study: groupIndex > 0 });
    });
  });
  return items.sort((a, b) => a.from - b.from || b.to - a.to);
}

export function initDial() {
  const section = document.querySelector('[data-section="experience"]');
  const lists = section && section.querySelector('.exp__lists');
  if (!lists) return;

  const today = new Date();
  const now = today.getFullYear() + (today.getMonth() + today.getDate() / 31) / 12;
  const span = Math.max(1, Math.ceil(now) - START_YEAR);
  const angleOf = (year) => ((year - START_YEAR) / span) * 360;
  const items = readItems(section, now);
  if (!items.length) return;

  const dial = document.createElement('div');
  dial.className = 'dial';
  dial.setAttribute('aria-hidden', 'true');
  dial.innerHTML = `
    <div class="dial__sticky">
      <div class="dial__side">
        <p class="dial__kicker">Since ${START_YEAR}</p>
        <ul class="dial__legend"></ul>
      </div>
      <div class="dial__face">
        <div class="dial__count"><span data-dial-number>0</span><small>years</small></div>
      </div>
    </div>`;
  const face = dial.querySelector('.dial__face');
  const legend = dial.querySelector('.dial__legend');
  const number = dial.querySelector('[data-dial-number]');

  const root = svg('svg', { class: 'dial__svg', viewBox: '-500 -500 1000 1000' });
  const ring = svg('circle', { class: 'dial__ring', r: 470, pathLength: 1, transform: 'rotate(-90)' }, root);

  const ticks = svg('g', { class: 'dial__ticks' }, root);
  for (let month = 0; month < span * 12; month++) {
    const degrees = (month / (span * 12)) * 360;
    const isYear = month % 12 === 0;
    const [x0, y0] = point(degrees, 452);
    const [x1, y1] = point(degrees, isYear ? 418 : 440);
    const line = svg('line', { x1: x0.toFixed(2), y1: y0.toFixed(2), x2: x1.toFixed(2), y2: y1.toFixed(2) }, ticks);
    if (isYear) line.classList.add('is-year');
  }

  const years = svg('g', { class: 'dial__years' }, root);
  for (let i = 0; i < span; i++) {
    const [x, y] = point(angleOf(START_YEAR + i), 386);
    const text = svg('text', { x: x.toFixed(2), y: y.toFixed(2), 'text-anchor': 'middle', 'dominant-baseline': 'central' }, years);
    text.textContent = String(START_YEAR + i);
  }

  const arcs = svg('g', { class: 'dial__arcs' }, root);
  const parts = items.map((item, i) => {
    const radius = 336 - i * 30;
    const path = svg('path', { class: `dial__arc${item.study ? ' is-study' : ''}`, d: arcPath(angleOf(item.from), angleOf(item.to) - 0.01, radius), pathLength: 1 }, arcs);
    const row = document.createElement('li');
    if (item.study) row.classList.add('is-study');
    row.innerHTML = '<i></i><span></span><b></b>';
    row.children[1].textContent = item.when;
    row.children[2].textContent = item.what;
    legend.appendChild(row);
    return { ...item, path, row };
  });

  const hand = svg('g', { class: 'dial__hand' }, root);
  svg('line', { x1: 0, y1: 34, x2: 0, y2: -462 }, hand);
  svg('circle', { r: 17 }, hand);
  face.appendChild(root);

  lists.parentElement.insertBefore(dial, lists);
  section.classList.add('is-dial');

  let shown = -1;
  function render(progress) {
    ring.style.strokeDashoffset = String(1 - clamp01(progress / 0.24));
    const sweep = easeInOut(clamp01((progress - 0.1) / 0.72));
    const handYear = START_YEAR + sweep * (now - START_YEAR);
    hand.setAttribute('transform', `rotate(${angleOf(handYear).toFixed(2)})`);
    parts.forEach(({ from, to, path, row }) => {
      const drawn = clamp01((handYear - from) / (to - from));
      path.style.strokeDashoffset = String(1 - drawn);
      path.style.opacity = drawn > 0.001 ? '1' : '0';
      row.classList.toggle('is-on', drawn > 0.001);
    });
    const count = Math.floor(handYear - START_YEAR + 0.0001);
    if (count !== shown) {
      shown = count;
      number.textContent = String(count);
    }
    dial.classList.toggle('is-full', sweep > 0.995);
  }
  render(0);

  const state = { progress: 0 };
  gsap.to(state, {
    progress: 1,
    ease: 'none',
    onUpdate: () => render(state.progress),
    scrollTrigger: { trigger: dial, start: 'top top', end: 'bottom bottom', scrub: 0.6, invalidateOnRefresh: true },
  });
  ScrollTrigger.refresh();
}

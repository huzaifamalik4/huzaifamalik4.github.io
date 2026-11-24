// Alternative section layouts and the picker used to compare them.
// Add ?pick to the address to open the picker; ?pick=off closes it again.
// Visitors without the picker always get the defaults below.
import gsap from 'gsap';

const STORE_KEY = 'hm-design-choices';
const PICK_KEY = 'hm-design-picker';

// "root" entries are page-wide switches, set on <html> instead of on a section;
// "anchor" is where the page returns to after the choice reloads it.
export const SECTIONS = [
  { id: 'work', label: 'Work', options: { a: 'Grid', b: 'List', c: 'Slider', d: 'Stack' } },
  { id: 'about', label: 'About', options: { a: 'Classic', b: 'Sticky photo', c: 'Centred' } },
  { id: 'services', label: 'Services', options: { a: 'Accordion', b: 'Cards', c: 'Open list' } },
  { id: 'experience', label: 'Experience', options: { a: 'Photo left', b: 'Two cards', c: 'Big years', d: 'Dial' } },
  { id: 'pricing', label: 'Pricing', options: { a: 'Cards', b: 'Rows', c: 'Dark' } },
  { id: 'contact', label: 'Contact', options: { a: 'Classic', b: 'Centred', c: 'Blue' } },
  { id: 'wall', label: 'Screens wall', options: { a: 'On', b: 'Off' }, root: true, anchor: 'screens' },
  { id: 'intro', label: 'Opening', options: { a: 'Blocks', b: 'Slide' }, root: true, anchor: 'top' },
];

const DEFAULTS = Object.fromEntries(SECTIONS.map(({ id }) => [id, 'a']));

function readStore(storage, key) {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}
function writeStore(storage, key, value) {
  try {
    storage.setItem(key, value);
  } catch { /* private mode: the choice just will not persist */ }
}

// Sets data-variant on each section. Must run before any layout-dependent script.
export function applyVariants() {
  const param = new URLSearchParams(location.search).get('pick');
  if (param === 'off') writeStore(sessionStorage, PICK_KEY, '');
  else if (param !== null) writeStore(sessionStorage, PICK_KEY, '1');
  const pick = param !== 'off' && (param !== null || readStore(sessionStorage, PICK_KEY) === '1');

  const choices = { ...DEFAULTS };
  if (pick) {
    try {
      const saved = JSON.parse(readStore(localStorage, STORE_KEY) || '{}');
      SECTIONS.forEach(({ id, options }) => {
        if (saved[id] && options[saved[id]]) choices[id] = saved[id];
      });
    } catch { /* bad data: keep the defaults */ }
  }

  SECTIONS.forEach(({ id, root }) => {
    if (root) {
      document.documentElement.dataset[id] = choices[id];
      return;
    }
    const section = document.querySelector(`[data-section="${id}"]`);
    if (section) section.dataset.variant = choices[id];
  });
  document.documentElement.dataset.work = choices.work;
  return { pick, choices };
}

export function initPicker({ choices }) {
  const number = (options, key) => Object.keys(options).indexOf(key) + 1;
  const summary = () => SECTIONS.map(({ id, label, options }) => `${label} ${number(options, choices[id])}`).join(', ');

  const panel = document.createElement('div');
  panel.className = 'picker';
  panel.innerHTML = `
    <div class="picker__top">
      <div><strong>Design picker</strong> <span data-picker-summary></span></div>
      <div>
        <button class="picker__copy" type="button">Copy my choices</button>
        <button class="picker__toggle" type="button">Hide</button>
      </div>
    </div>
    <div class="picker__rows">
      ${SECTIONS.map(({ id, label, options }) => `
        <div class="picker__row">
          <span>${label}</span>
          <div>${Object.entries(options).map(([key, name], i) => `<button type="button" data-section-id="${id}" data-option="${key}" aria-pressed="${choices[id] === key}">${i + 1} ${name}</button>`).join('')}</div>
        </div>`).join('')}
    </div>`;
  document.body.appendChild(panel);
  document.documentElement.classList.add('is-picking');

  const summaryEl = panel.querySelector('[data-picker-summary]');
  summaryEl.textContent = summary();
  if (readStore(sessionStorage, `${PICK_KEY}-closed`) === '1') panel.classList.add('is-closed');

  panel.addEventListener('click', (event) => {
    const option = event.target.closest('[data-option]');
    if (option) {
      choices[option.dataset.sectionId] = option.dataset.option;
      writeStore(localStorage, STORE_KEY, JSON.stringify(choices));
      // Layouts are wired up at load, so reload and come back to the same section.
      const entry = SECTIONS.find(({ id }) => id === option.dataset.sectionId);
      location.hash = (entry && entry.anchor) || option.dataset.sectionId;
      location.reload();
      return;
    }
    if (event.target.closest('.picker__toggle')) {
      const closed = panel.classList.toggle('is-closed');
      event.target.closest('.picker__toggle').textContent = closed ? 'Show' : 'Hide';
      writeStore(sessionStorage, `${PICK_KEY}-closed`, closed ? '1' : '');
      return;
    }
    const copy = event.target.closest('.picker__copy');
    if (copy) {
      const text = `My choices: ${summary()}`;
      const done = () => { copy.textContent = 'Copied'; setTimeout(() => { copy.textContent = 'Copy my choices'; }, 1600); };
      if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, done);
      else done();
    }
  });
  const toggle = panel.querySelector('.picker__toggle');
  if (panel.classList.contains('is-closed')) toggle.textContent = 'Show';
}

// Work "List": a picture of the hovered project follows the pointer.
function initWorkList(section, finePointer) {
  if (!finePointer) return;
  const preview = document.createElement('div');
  preview.className = 'work-preview';
  preview.setAttribute('aria-hidden', 'true');
  const cards = Array.from(section.querySelectorAll('.card'));
  const pictures = cards.map((card) => {
    const img = card.querySelector('.card__media img');
    if (!img) return null;
    const copy = new Image();
    copy.src = img.getAttribute('src');
    copy.alt = '';
    preview.appendChild(copy);
    return copy;
  });
  document.body.appendChild(preview);

  const xTo = gsap.quickTo(preview, 'x', { duration: 0.55, ease: 'power3' });
  const yTo = gsap.quickTo(preview, 'y', { duration: 0.55, ease: 'power3' });
  const tiltTo = gsap.quickTo(preview, 'rotation', { duration: 0.7, ease: 'power3' });
  let lastX = 0;
  section.addEventListener('pointermove', (event) => {
    const width = preview.offsetWidth;
    const height = preview.offsetHeight;
    xTo(Math.min(event.clientX + 30, window.innerWidth - width - 16));
    yTo(Math.max(12, Math.min(event.clientY - height / 2, window.innerHeight - height - 12)));
    tiltTo(gsap.utils.clamp(-7, 7, (event.clientX - lastX) * 0.5));
    lastX = event.clientX;
  }, { passive: true });
  cards.forEach((card, i) => {
    card.addEventListener('pointerenter', () => {
      pictures.forEach((picture) => picture && picture.classList.toggle('is-on', picture === pictures[i]));
      preview.classList.toggle('is-on', Boolean(pictures[i]));
    });
    card.addEventListener('pointerleave', () => preview.classList.remove('is-on'));
  });
}

// Work "Slider": the row of cards moves sideways while the section is held in place.
function initWorkSlider(section) {
  const viewport = section.querySelector('[data-work-viewport]');
  const track = section.querySelector('[data-work-track]');
  if (!viewport || !track) return;
  gsap.matchMedia().add('(min-width: 701px)', () => {
    const distance = () => Math.max(0, track.scrollWidth - viewport.clientWidth);
    gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: viewport,
        start: 'center center',
        end: () => `+=${distance()}`,
        pin: true,
        scrub: 0.6,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });
  });
}

export function initWorkVariant(choice, { finePointer }) {
  const section = document.querySelector('[data-section="work"]');
  if (!section) return;
  if (choice === 'b') initWorkList(section, finePointer);
  if (choice === 'c') initWorkSlider(section);
}

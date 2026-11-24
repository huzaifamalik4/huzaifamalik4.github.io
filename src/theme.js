// Light and dark themes. The choice is kept for the next visit. The switch itself is a
// ring of light that spreads from the button, with the new theme following behind it.

const STORE_KEY = 'hm-theme';
const PAPER = { light: '#eeede8', dark: '#0b0b0c' };

const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

export function initTheme({ reducedMotion = false, pause = () => {}, resume = () => {} } = {}) {
  const root = document.documentElement;
  const toggles = Array.from(document.querySelectorAll('[data-theme-toggle]'));
  if (!toggles.length) return;
  const meta = document.querySelector('meta[name="theme-color"]');
  const names = Array.from(document.querySelectorAll('[data-theme-name]'));
  const current = () => (root.dataset.theme === 'dark' ? 'dark' : 'light');

  function apply(theme) {
    root.dataset.theme = theme;
    if (meta) meta.content = PAPER[theme];
    toggles.forEach((button) => {
      button.setAttribute('aria-pressed', String(theme === 'dark'));
      button.setAttribute('aria-label', theme === 'dark' ? 'Switch to the light theme' : 'Switch to the dark theme');
    });
    names.forEach((el) => {
      el.textContent = theme === 'dark' ? 'Dark' : 'Light';
    });
  }
  apply(current());

  let busy = false;
  let prismPromise = null;
  const loadPrism = () => {
    if (!prismPromise) prismPromise = import('./prism.js').then((module) => module.createPrism()).catch(() => null);
    return prismPromise;
  };

  async function sweep(prism, next, origin) {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const band = Math.max(width, height) * 0.085;
    const reach = Math.hypot(Math.max(origin.x, width - origin.x), Math.max(origin.y, height - origin.y)) + band * 3.5;
    const duration = width < 700 ? 1250 : 1550;

    pause();
    root.classList.add('is-theming');
    prism.prepare();
    try {
      if (document.startViewTransition) {
        // The browser keeps a picture of the old theme under the live page; a round
        // mask on the live page grows with the ring and lets the new theme through.
        root.style.setProperty('--prism-x', `${origin.x}px`);
        root.style.setProperty('--prism-y', `${origin.y}px`);
        root.style.setProperty('--prism-soft', `${band * 0.9}px`);
        const transition = document.startViewTransition(() => apply(next));
        await transition.ready;
        // Keyframes sampled from the same easing the ring uses, so the two stay together.
        const frames = [];
        for (let i = 0; i <= 40; i++) frames.push({ '--prism-r': `${(easeInOut(i / 40) * reach).toFixed(1)}px` });
        const timing = { duration, easing: 'linear', fill: 'both' };
        root.animate(frames, { ...timing, pseudoElement: '::view-transition-new(root)' });
        root.animate(frames, { ...timing, pseudoElement: '::view-transition-group(prism)' });
        prism.play({ ...origin, reach, width: band, duration, ease: easeInOut, theme: next });
        await transition.finished;
      } else {
        // Older browsers: the ring paints the new page colour behind it, the theme
        // changes under that cover, then the cover fades.
        await prism.play({ ...origin, reach, width: band, duration: duration * 0.7, ease: easeInOut, theme: next, fill: true });
        apply(next);
        await prism.fadeOut({ ...origin, reach, width: band, duration: 380, theme: next });
      }
    } catch (error) {
      console.error(error);
      apply(next);
    } finally {
      prism.stop();
      root.classList.remove('is-theming');
      resume();
    }
  }

  async function change(origin) {
    if (busy) return;
    const next = current() === 'dark' ? 'light' : 'dark';
    try {
      localStorage.setItem(STORE_KEY, next);
    } catch { /* private mode: the choice just will not persist */ }
    if (reducedMotion) {
      apply(next);
      return;
    }
    busy = true;
    try {
      const prism = await loadPrism();
      if (prism) await sweep(prism, next, origin);
      else apply(next);
    } finally {
      busy = false;
    }
  }

  toggles.forEach((button) => {
    button.addEventListener('click', () => {
      const rect = button.getBoundingClientRect();
      change({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    });
    // Fetch the effect as soon as the visitor shows interest, so the first click is instant.
    button.addEventListener('pointerenter', loadPrism, { once: true });
    button.addEventListener('focus', loadPrism, { once: true });
  });
}

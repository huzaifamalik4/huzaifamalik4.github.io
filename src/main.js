import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';
import { applyVariants, initPicker, initWorkVariant } from './variants.js';
import { initTheme } from './theme.js';
import { initTypedLabels, initScrollPill, initTimeDifference } from './details.js';
import { initArchive } from './archive.js';

gsap.registerPlugin(ScrollTrigger, SplitText);

const root = document.documentElement;
const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

let lenis = null;

/* ---------- Small pieces that work with or without motion ---------- */

function initMenu() {
  const button = $('[data-menu-btn]');
  const menu = $('[data-menu]');
  if (!button || !menu) return;

  const setOpen = (open) => {
    button.setAttribute('aria-expanded', String(open));
    menu.classList.toggle('is-open', open);
  };
  button.addEventListener('click', () => setOpen(button.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', (event) => {
    if (event.target.closest('a')) setOpen(false);
  });
  document.addEventListener('pointerdown', (event) => {
    if (!menu.classList.contains('is-open')) return;
    if (!event.target.closest('[data-menu], [data-menu-btn]')) setOpen(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menu.classList.contains('is-open')) {
      setOpen(false);
      button.focus();
    }
  });
}

function initAnchors() {
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;
    const id = link.getAttribute('href');
    const target = id === '#top' ? document.body : $(id);
    if (!target) return;
    event.preventDefault();
    if (lenis) {
      lenis.scrollTo(id === '#top' ? 0 : target, { duration: 1.5, easing: (t) => 1 - Math.pow(1 - t, 4) });
    } else {
      target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
    }
  });
}

function initAccordion(interactive) {
  const items = $$('[data-accordion] .svc__item');
  if (!interactive) {
    // Layouts that show every service at once: the rows are no longer controls.
    items.forEach((item) => {
      const head = $('.svc__head', item);
      head.setAttribute('aria-expanded', 'true');
      head.setAttribute('tabindex', '-1');
    });
    return;
  }
  const setOpen = (item, open) => {
    item.classList.toggle('is-open', open);
    $('.svc__head', item).setAttribute('aria-expanded', String(open));
  };
  items.forEach((item) => {
    $('.svc__head', item).addEventListener('click', () => {
      const wasOpen = item.classList.contains('is-open');
      items.forEach((other) => setOpen(other, false));
      if (!wasOpen) setOpen(item, true);
      // The list changes height, so pinned sections below need new positions.
      setTimeout(() => ScrollTrigger.refresh(), 720);
    });
  });
}

function initClock() {
  const el = $('[data-time]');
  const year = $('[data-year]');
  if (year) year.textContent = String(new Date().getFullYear());
  if (!el) return;
  const format = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Karachi' });
  const update = () => {
    el.textContent = format.format(new Date());
  };
  update();
  setInterval(update, 20000);
}

function initCursor() {
  const cursor = $('.cursor');
  const label = $('[data-cursor-label]');
  if (!cursor || !finePointer) return;
  const xTo = gsap.quickTo(cursor, 'x', { duration: 0.45, ease: 'power3' });
  const yTo = gsap.quickTo(cursor, 'y', { duration: 0.45, ease: 'power3' });
  window.addEventListener('pointermove', (event) => {
    xTo(event.clientX);
    yTo(event.clientY);
  }, { passive: true });
  $$('[data-cursor]').forEach((el) => {
    el.addEventListener('pointerenter', () => {
      label.textContent = el.dataset.cursor;
      cursor.classList.add('is-on');
    });
    el.addEventListener('pointerleave', () => cursor.classList.remove('is-on'));
  });
}

function initMagnetic() {
  if (!finePointer) return;
  $$('[data-magnetic]').forEach((el) => {
    const xTo = gsap.quickTo(el, 'x', { duration: 0.8, ease: 'elastic.out(1, 0.45)' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.8, ease: 'elastic.out(1, 0.45)' });
    el.addEventListener('pointermove', (event) => {
      const rect = el.getBoundingClientRect();
      xTo((event.clientX - (rect.left + rect.width / 2)) * 0.28);
      yTo((event.clientY - (rect.top + rect.height / 2)) * 0.28);
    });
    el.addEventListener('pointerleave', () => {
      xTo(0);
      yTo(0);
    });
  });
}

function loadHero() {
  const container = $('[data-hero-canvas]');
  if (!container) return Promise.resolve(null);
  const stage = container.parentElement;
  // "Wipe" is the earlier hero, still offered in the design picker.
  const wipe = root.dataset.hero === 'b';
  if (wipe) {
    $('[data-hero-label]').textContent = 'Code view';
    $('.hint-fine', stage).textContent = 'Move your cursor to meet the person behind the code';
    $('.hint-touch', stage).textContent = 'Drag to wipe the code away';
  }
  return (wipe ? import('./hero-wipe.js') : import('./hero.js'))
    .then((module) => module.createHero(container, { reducedMotion }))
    .catch(() => null)
    .then((hero) => {
      // Without WebGL the stage falls back to the still picture set in the stylesheet.
      if (!hero) stage.classList.add('is-still');
      // The decode hero is held on screen while the page scrolls through it.
      else if (hero.setProgress && !reducedMotion) {
        $('[data-hero-track]').classList.add('is-pinned');
        ScrollTrigger.refresh();
      }
      return hero;
    });
}

// The screens wall is only fetched once the visitor is getting close to it.
function initWall() {
  const stage = $('[data-wall-stage]');
  if (!stage || root.dataset.wall === 'b' || !('IntersectionObserver' in window)) return;
  const showProject = (card) => {
    if (lenis) lenis.scrollTo(card, { offset: -110, duration: 1.4 });
    else card.scrollIntoView({ block: 'center' });
  };
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      import('./wall.js')
        .then((module) => module.createWall(stage, { reducedMotion, onOpen: showProject }))
        .catch(() => null)
        .then((wall) => {
          // Without WebGL the stage falls back to the still sheet set in the stylesheet.
          if (!wall) stage.classList.add('is-still');
        });
    },
    { rootMargin: '120% 0px' },
  );
  observer.observe(stage);
}

/* ---------- Scroll-driven motion ---------- */

function initSmoothScroll() {
  lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

function initLines() {
  $$('[data-lines]').forEach((el) => {
    SplitText.create(el, {
      type: 'lines',
      mask: 'lines',
      linesClass: 'line',
      autoSplit: true,
      onSplit(self) {
        gsap.set(el, { visibility: 'visible' });
        return gsap.from(self.lines, {
          yPercent: 112,
          duration: 1.15,
          ease: 'expo.out',
          stagger: 0.09,
          scrollTrigger: { trigger: el, start: 'top 90%', once: true },
        });
      },
    });
  });
}

function initWords() {
  $$('[data-words]').forEach((el) => {
    const split = SplitText.create(el, { type: 'words' });
    gsap.fromTo(
      split.words,
      { opacity: 0.13 },
      {
        opacity: 1,
        ease: 'none',
        stagger: 0.1,
        scrollTrigger: { trigger: el, start: 'top 82%', end: 'bottom 52%', scrub: 0.5 },
      },
    );
  });
}

function initFades() {
  const els = $$('[data-fade]');
  gsap.set(els, { opacity: 0, y: 30 });
  ScrollTrigger.batch(els, {
    start: 'top 92%',
    once: true,
    onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.08, overwrite: true }),
  });
}

function initMedia() {
  $$('[data-media]').forEach((el) => {
    const img = $('img', el);
    gsap.fromTo(
      el,
      { clipPath: 'inset(100% 0% 0% 0%)' },
      {
        clipPath: 'inset(0% 0% 0% 0%)',
        duration: 1.5,
        ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 92%', once: true },
        onComplete: () => gsap.set(el, { clearProps: 'clipPath' }),
      },
    );
    // Cards keep their hover zoom in CSS; everything else drifts inside its frame.
    if (img && !el.classList.contains('card__media')) {
      gsap.fromTo(
        img,
        { scale: 1.16, yPercent: -5 },
        { scale: 1.16, yPercent: 5, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } },
      );
    }
  });

  $$('[data-parallax]').forEach((el) => {
    const amount = Number(el.dataset.parallax) || 10;
    gsap.fromTo(
      el,
      { y: amount * 6 },
      { y: -amount * 6, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } },
    );
  });
}

function initHeroScroll(heroPromise) {
  const stage = $('[data-hero-stage]');
  if (!stage) return;
  gsap.to('.hero__top', {
    yPercent: -18,
    opacity: 0.2,
    ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: () => `+=${$('.hero__top').offsetHeight + 120}`, scrub: true },
  });

  // The decode hero: scrolling from the top of the page to the end of the held stretch
  // takes the stage from a wall of code to the photograph.
  heroPromise.then((hero) => {
    const track = $('[data-hero-track]');
    if (!hero || !hero.setProgress || !track.classList.contains('is-pinned')) return;
    const label = $('[data-hero-label]');

    // The words on the stage turn over letter by letter as the photograph arrives.
    const split = SplitText.create($$('.hero__reveal p', stage), { type: 'words,chars', charsClass: 'char' });
    const words = gsap.timeline({ paused: true });
    words.from(split.chars, { rotationX: -92, yPercent: 46, opacity: 0, duration: 0.5, ease: 'power2.out', stagger: 0.016, transformOrigin: '50% 50% -0.35em' });
    stage.classList.add('has-reveal');

    let phase = '';
    ScrollTrigger.create({
      start: 0,
      end: () => {
        const top = track.getBoundingClientRect().top + window.scrollY;
        return top + track.offsetHeight - stage.offsetHeight - (parseFloat(getComputedStyle(stage).top) || 0);
      },
      invalidateOnRefresh: true,
      onUpdate(self) {
        const p = self.progress;
        hero.setProgress(p);
        gsap.to(words, { progress: gsap.utils.clamp(0, 1, (p - 0.7) / 0.24), duration: 0.45, ease: 'power2.out', overwrite: true });
        const decoded = Math.round(gsap.utils.clamp(0, 1, (p - 0.03) / 0.57) * 100);
        const next = p < 0.035 ? 'Code view' : p < 0.62 ? `Decoding ${decoded}%` : 'Huzaifa Malik';
        if (next !== phase) {
          phase = next;
          label.textContent = next;
          stage.classList.toggle('is-decoded', p >= 0.5);
        }
      },
    });
  });
}

function initAngles() {
  const section = $('[data-angles]');
  if (!section) return;
  const text = $('[data-angles-text]', section);
  const figure = $('[data-angles-figure]', section);
  const first = $('.angles__img', section);
  const swap = $('[data-angles-swap]', section);
  const labels = $$('[data-angles-label]', section);
  const caption = $('[data-angles-caption]', section);

  gsap.set(text, { x: 0, y: 0, xPercent: 6, yPercent: -54 });

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: '+=170%',
      pin: $('.angles__pin', section),
      scrub: 0.7,
      anticipatePin: 1,
      invalidateOnRefresh: true,
    },
  });
  tl.fromTo(text, { xPercent: 6 }, { xPercent: -64, duration: 1 }, 0)
    .fromTo(figure, { scale: 0.74, yPercent: 10 }, { scale: 1, yPercent: 0, duration: 0.42, ease: 'power2.out' }, 0)
    .fromTo(labels, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.1, stagger: 0.07 }, 0.24)
    .to(swap, { opacity: 1, duration: 0.08 }, 0.56)
    .to(first, { opacity: 0, duration: 0.08 }, 0.58)
    .fromTo(caption, { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.16, ease: 'power2.out' }, 0.62);

  // Lead-in: the words already drift while the section rises into view.
  gsap.fromTo(
    figure,
    { opacity: 0.4 },
    { opacity: 1, ease: 'none', scrollTrigger: { trigger: section, start: 'top 85%', end: 'top 25%', scrub: true } },
  );
}

function initMarquee() {
  const track = $('[data-marquee]');
  if (!track) return;
  const tween = gsap.to(track, { xPercent: -50, duration: 42, ease: 'none', repeat: -1 });
  if (!lenis) return;
  lenis.on('scroll', ({ velocity }) => {
    const boost = 1 + Math.min(Math.abs(velocity) * 0.14, 6);
    gsap.to(tween, {
      timeScale: boost,
      duration: 0.25,
      overwrite: true,
      onComplete: () => gsap.to(tween, { timeScale: 1, duration: 1.2 }),
    });
  });
}

function initContact() {
  const figure = $('[data-contact-figure]');
  if (figure) {
    gsap.fromTo(
      figure,
      { yPercent: 16 },
      { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.contact', start: 'top bottom', end: 'bottom bottom', scrub: true } },
    );
  }
  const name = $('.footer__name');
  if (name) {
    const split = SplitText.create(name, { type: 'chars' });
    gsap.from(split.chars, {
      yPercent: 70,
      opacity: 0,
      duration: 1.2,
      ease: 'expo.out',
      stagger: 0.035,
      scrollTrigger: { trigger: name, start: 'top 96%', once: true },
    });
  }
}

/* ---------- Intro ---------- */

// The loader breaks up into blocks from the middle outwards, a few flashing blue as they go.
function createDissolve(loader) {
  const canvas = document.createElement('canvas');
  canvas.className = 'loader__blocks';
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const width = window.innerWidth;
  const height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
  loader.appendChild(canvas);

  const cols = width > 900 ? 16 : width > 560 ? 10 : 7;
  const size = Math.ceil(width / cols);
  const rows = Math.ceil(height / size);
  const ink = getComputedStyle(loader).backgroundColor;
  const flashes = ['#2238ff', '#2238ff', '#8f9bff', '#ffffff'];
  const far = Math.hypot(cols / 2, rows / 2);
  const cells = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const distance = Math.hypot(col + 0.5 - cols / 2, row + 0.5 - rows / 2) / far;
      cells.push({
        x: col * size,
        y: row * size,
        at: distance * 0.55 + Math.random() * 0.3,
        flash: Math.random() < 0.22 ? flashes[Math.floor(Math.random() * flashes.length)] : null,
      });
    }
  }

  return {
    draw(progress) {
      ctx.clearRect(0, 0, width, height);
      cells.forEach((cell) => {
        if (progress < cell.at) ctx.fillStyle = ink;
        else if (cell.flash && progress < cell.at + 0.1) ctx.fillStyle = cell.flash;
        else return;
        ctx.fillRect(cell.x, cell.y, size + 1, size + 1);
      });
    },
    start() {
      this.draw(0);
      loader.style.background = 'transparent';
    },
  };
}

function runIntro(heroPromise, quick, blocks) {
  const loader = $('.loader');
  const countEl = $('[data-loader-count]');
  const bar = $('[data-loader-bar]');
  const title = $('[data-hero-title]');
  let introDone = false;
  let titleTween = null;
  let titleReleased = false;

  const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  const withTimeout = (promise, ms) => Promise.race([promise, new Promise((resolve) => setTimeout(resolve, ms, null))]);

  // The counter runs on its own clock; the page opens when it and the assets are both done.
  const counter = { value: 0 };
  const counting = new Promise((resolve) => {
    gsap.to(counter, {
      value: 100,
      duration: quick ? 0.3 : 1.9,
      ease: 'power2.inOut',
      onUpdate: () => {
        countEl.textContent = String(Math.round(counter.value));
        gsap.set(bar, { scaleX: counter.value / 100 });
      },
      onComplete: resolve,
    });
  });

  const ready = Promise.all([counting, withTimeout(fontsReady, 2500), withTimeout(heroPromise, 4000)]);

  ready.then(([, , hero]) => {
    SplitText.create(title, {
      type: 'lines',
      mask: 'lines',
      linesClass: 'line',
      autoSplit: true,
      onSplit(self) {
        gsap.set(title, { visibility: 'visible' });
        if (introDone) return null;
        // The split can run again when fonts land, so the tween is rebuilt here each time
        // and held until the loader has cleared.
        titleTween = gsap.from(self.lines, { yPercent: 112, duration: 1.3, ease: 'expo.out', stagger: 0.09, paused: !titleReleased });
        return titleTween;
      },
    });

    gsap.set('[data-hero-fade]', { opacity: 0, y: 26 });
    gsap.set('[data-hero-stage]', { opacity: 0, y: 90, scale: 0.965 });
    gsap.set('.logo, .header > *', { opacity: 0, y: -18 });

    const tl = gsap.timeline({
      onComplete: () => {
        introDone = true;
        loader.style.display = 'none';
        gsap.set('[data-hero-stage]', { clearProps: 'transform' });
        ScrollTrigger.refresh();
      },
    });
    tl.to(countEl, { yPercent: -108, duration: 0.7, ease: 'power3.in' }).to(bar, { opacity: 0, duration: 0.3 }, '<');

    const dissolve = blocks ? createDissolve(loader) : null;
    if (dissolve) {
      const state = { progress: 0 };
      tl.add(() => dissolve.start(), '-=0.12')
        .to('.loader__top', { opacity: 0, duration: 0.3 }, '<')
        .to(state, { progress: 1, duration: 1.15, ease: 'power1.inOut', onUpdate: () => dissolve.draw(state.progress) }, '<');
    } else {
      tl.to(loader, { yPercent: -100, duration: 1.15, ease: 'expo.inOut' }, '-=0.2');
    }

    tl.add(() => {
      if (hero) hero.start();
      if (lenis) lenis.start();
    }, '-=0.95')
      .add(() => {
        titleReleased = true;
        if (titleTween) titleTween.play();
      }, '-=0.62')
      .to('[data-hero-stage]', { opacity: 1, y: 0, scale: 1, duration: 1.5, ease: 'expo.out' }, '<0.12')
      .to('[data-hero-fade]', { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.1 }, '<0.2')
      .to('.logo, .header > *', { opacity: 1, y: 0, duration: 1, ease: 'expo.out', stagger: 0.06, clearProps: 'transform,opacity' }, '<0.1');

    // A link like /#work should still land on its section once the page has opened.
    if (location.hash && $(location.hash)) {
      tl.add(() => (lenis ? lenis.scrollTo($(location.hash), quick ? { immediate: true } : { duration: 1.4 }) : $(location.hash).scrollIntoView()));
    }
    // While comparing layouts the page reloads often, so the opening plays fast.
    if (quick) tl.timeScale(3);
  });
}

/* ---------- Start ---------- */

function start() {
  root.classList.add('is-ready');
  const design = applyVariants();
  initMenu();
  initAnchors();
  initAccordion(design.choices.services === 'a');
  initClock();
  initTimeDifference();
  if (design.pick) initPicker(design);

  // While the theme changes the page holds still, then scrolls again if it could before.
  let scrollWasFree = false;
  initTheme({
    reducedMotion,
    pause: () => {
      scrollWasFree = Boolean(lenis) && !lenis.isStopped;
      if (scrollWasFree) lenis.stop();
    },
    resume: () => {
      if (scrollWasFree) lenis.start();
    },
  });
  initWall();

  const heroPromise = loadHero();

  if (reducedMotion) {
    // No scroll effects: show the page as it is and keep the scene still but alive.
    root.classList.add('is-fallback', 'no-motion');
    heroPromise.then((hero) => {
      if (!hero) return;
      hero.start();
      // The decode hero stands still on its last picture, so its labels say so.
      if (hero.setProgress) {
        $('[data-hero-label]').textContent = 'Huzaifa Malik';
        $('[data-hero-stage]').classList.add('is-decoded');
      }
    });
    initArchive({ variant: design.choices.archive, reducedMotion: true });
    return;
  }

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);

  initSmoothScroll();
  lenis.stop();
  initCursor();
  initMagnetic();
  runIntro(heroPromise, design.pick, design.choices.intro === 'a');

  const afterFonts = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  Promise.race([afterFonts, new Promise((resolve) => setTimeout(resolve, 2500))]).then(() => {
    initLines();
    initWords();
    initFades();
    initMedia();
    initTypedLabels();
    initHeroScroll(heroPromise);
    initWorkVariant(design.choices.work, { finePointer });
    initArchive({ variant: design.choices.archive, lenis });
    initAngles();
    initMarquee();
    initContact();
    initScrollPill(lenis);
    ScrollTrigger.refresh();
    // The dial adds a long scroll of its own, so everything below it is measured again.
    if (design.choices.experience === 'd') {
      import('./dial.js').then((module) => module.initDial()).catch(() => null);
    }
  });

  window.addEventListener('load', () => ScrollTrigger.refresh());
}

try {
  start();
} catch (error) {
  console.error(error);
  root.classList.add('is-fallback');
}

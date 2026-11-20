import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';

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

function initAccordion() {
  const items = $$('[data-accordion] .svc__item');
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
  return import('./hero.js')
    .then((module) => module.createHero(container, { reducedMotion }))
    .catch(() => null);
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

function initHeroScroll() {
  const stage = $('[data-hero-stage]');
  if (!stage) return;
  gsap.to('.hero__top', {
    yPercent: -18,
    opacity: 0.2,
    ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: () => `+=${$('.hero__top').offsetHeight + 120}`, scrub: true },
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

function runIntro(heroPromise) {
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
      duration: 1.9,
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
    tl.to(countEl, { yPercent: -108, duration: 0.7, ease: 'power3.in' })
      .to(bar, { opacity: 0, duration: 0.3 }, '<')
      .to(loader, { yPercent: -100, duration: 1.15, ease: 'expo.inOut' }, '-=0.2')
      .add(() => {
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
      tl.add(() => (lenis ? lenis.scrollTo($(location.hash), { duration: 1.4 }) : $(location.hash).scrollIntoView()));
    }
  });
}

/* ---------- Start ---------- */

function start() {
  root.classList.add('is-ready');
  initMenu();
  initAnchors();
  initAccordion();
  initClock();

  const heroPromise = loadHero();

  if (reducedMotion) {
    // No scroll effects: show the page as it is and keep the scene still but alive.
    root.classList.add('is-fallback', 'no-motion');
    heroPromise.then((hero) => hero && hero.start());
    return;
  }

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);

  initSmoothScroll();
  lenis.stop();
  initCursor();
  initMagnetic();
  runIntro(heroPromise);

  const afterFonts = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  Promise.race([afterFonts, new Promise((resolve) => setTimeout(resolve, 2500))]).then(() => {
    initLines();
    initWords();
    initFades();
    initMedia();
    initHeroScroll();
    initAngles();
    initMarquee();
    initContact();
    ScrollTrigger.refresh();
  });

  window.addEventListener('load', () => ScrollTrigger.refresh());
}

try {
  start();
} catch (error) {
  console.error(error);
  root.classList.add('is-fallback');
}

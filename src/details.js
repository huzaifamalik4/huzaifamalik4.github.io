// Small touches: section labels that type themselves, a capsule that turns with the
// scroll, and the time difference between the visitor and Pakistan.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

// Section labels are typed out one character at a time, behind a block cursor.
export function initTypedLabels() {
  document.querySelectorAll('.sec-head').forEach((head) => {
    const target = head.lastElementChild;
    if (!target) return;
    const split = SplitText.create(target, { type: 'chars' });
    const caret = document.createElement('i');
    caret.className = 'caret';
    caret.setAttribute('aria-hidden', 'true');
    target.appendChild(caret);
    gsap.set(split.chars, { display: 'none' });
    ScrollTrigger.create({
      trigger: head,
      start: 'top 94%',
      once: true,
      onEnter: () => {
        gsap.to(split.chars, {
          display: 'inline-block',
          duration: 0.001,
          stagger: 0.06,
          delay: 0.2,
          onComplete: () => caret.classList.add('is-done'),
        });
      },
    });
  });
}

// A capsule in the corner that turns as the page moves. Clicking it goes back to the top.
export function initScrollPill(lenis) {
  const pill = document.querySelector('[data-scroll-pill]');
  if (!pill || !lenis) return;
  const body = pill.firstElementChild;
  const rotateTo = gsap.quickTo(body, 'rotation', { duration: 0.7, ease: 'power3' });
  let shown = false;
  lenis.on('scroll', ({ scroll, limit, velocity }) => {
    const progress = limit > 0 ? scroll / limit : 0;
    rotateTo(progress * 1080 + gsap.utils.clamp(-60, 60, velocity * 3));
    // Hidden at the very top, and at the very bottom where the footer has its own way up.
    const next = scroll > window.innerHeight * 0.4 && scroll < limit - 120;
    if (next !== shown) {
      shown = next;
      pill.classList.toggle('is-on', shown);
    }
  });
}

// "5 hours ahead of you": how far Pakistan's clock is from the visitor's.
export function initTimeDifference() {
  const el = document.querySelector('[data-time-diff]');
  if (!el) return;
  // Pakistan is five hours ahead of UTC all year; getTimezoneOffset counts minutes behind UTC.
  const minutes = 300 + new Date().getTimezoneOffset();
  if (!Number.isFinite(minutes)) return;
  const size = Math.abs(minutes);
  if (size === 0) {
    el.textContent = 'The same time as you';
    return;
  }
  const hours = Math.floor(size / 60);
  const rest = size % 60;
  const amount = rest ? `${hours} h ${rest} min` : `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  el.textContent = `${amount} ${minutes > 0 ? 'ahead of' : 'behind'} you`;
}

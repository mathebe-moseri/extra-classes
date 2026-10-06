// src/app/shared/smooth-scroll.ts
// One eased scroll used by every navigation button, so all jumps feel the same.

const HEADER = 56;   // fixed header height (3.5rem)
const GAP = 16;      // breathing room under the header (matches .screen scroll-margin-top)

let cancelCurrent: (() => void) | null = null;

const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export function smoothScrollToY(target: number) {
  cancelCurrent?.();

  const max = document.documentElement.scrollHeight - window.innerHeight;
  const to = Math.max(0, Math.min(target, max));
  const from = window.scrollY;
  const dist = to - from;
  const root = document.documentElement;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || Math.abs(dist) < 2) {
    root.classList.add('is-scrolling');
    window.scrollTo(0, to);
    root.classList.remove('is-scrolling');
    return;
  }

  // longer trips take longer, but never feel slow or rushed
  const duration = Math.min(1000, Math.max(450, Math.abs(dist) * 0.3));
  const startTime = performance.now();
  let frame = 0;

  root.classList.add('is-scrolling');   // pauses CSS smooth-scroll + snapping while we animate

  const stop = () => {
    cancelAnimationFrame(frame);
    root.classList.remove('is-scrolling');
    ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(e => window.removeEventListener(e, stop));
    cancelCurrent = null;
  };
  cancelCurrent = stop;
  // if the person grabs the page, let them take over immediately
  ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(e =>
    window.addEventListener(e, stop, { passive: true, once: true }));

  const step = (now: number) => {
    const t = Math.min(1, (now - startTime) / duration);
    window.scrollTo(0, from + dist * easeInOutCubic(t));
    if (t < 1) frame = requestAnimationFrame(step);
    else stop();
  };
  frame = requestAnimationFrame(step);
}

export function smoothScrollToId(id: string, block: 'start' | 'center' = 'start') {
  const el = document.getElementById(id);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY;
  const target = block === 'center'
    ? top - (window.innerHeight - el.offsetHeight) / 2
    : top - HEADER - GAP;
  smoothScrollToY(target);
}

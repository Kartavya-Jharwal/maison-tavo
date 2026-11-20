/**
 * Maison motion pass — GSAP edition.
 *
 * Previously this file pulled two vendored animation libraries (anime.js
 * ~291 KB + Motion ESM ~138 KB) on top of the GSAP bundle that already ships
 * in maison-runtime.js. It now runs on the runtime's `window.gsap`, so the
 * page carries one animation engine instead of three.
 *
 *   - Hero content stagger + media settle (homepage)
 *   - Product-card / resource-card scroll reveals
 *   - Spec-table row stagger (scroll-triggered)
 *   - Cart icon feedback on add
 *
 * D10 compliance:
 *   - Skipped entirely under `prefers-reduced-motion: reduce` or the consent
 *     bar's reduced-motion toggle.
 *   - Opacity / transform only — zero layout shift.
 *   - Content stays visible if GSAP never loads (prep hides below-fold only
 *     once the engine is confirmed).
 *   - Removable: delete this file, `maison-motion.css`, and the motion tags in
 *     `snippets/scripts.liquid`.
 */

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const CART_LINES_UPDATE = 'shopify:cart:lines-update';
const CARD_SELECTOR = 'product-card, .resource-card';

/** @type {WeakSet<Element>} */
const revealed = new WeakSet();
/** @type {IntersectionObserver | null} */
let observer = null;
let cartBound = false;

function motionAllowed() {
  if (document.documentElement.dataset.reducedMotion === 'true') return false;
  return !prefersReducedMotion.matches;
}

function markMotionActive() {
  document.documentElement.classList.add('maison-motion-active');
}

function clearInlineReveal(el) {
  el.style.removeProperty('opacity');
  el.style.removeProperty('transform');
  el.style.removeProperty('will-change');
  el.removeAttribute('data-maison-motion');
}

/**
 * Hide only targets still below the fold so scroll reveals do not flash.
 * @param {Element[]} elements
 */
function prepBelowFold(elements) {
  const viewportBottom = window.innerHeight * 0.92;
  for (const el of elements) {
    if (revealed.has(el)) continue;
    if (el.getBoundingClientRect().top > viewportBottom) {
      el.style.opacity = '0';
      el.style.willChange = 'opacity, transform';
      el.setAttribute('data-maison-motion', 'pending');
    }
  }
}

/**
 * @param {Element[]} items
 * @param {{ y?: number, delayMs?: number, duration?: number }} [opts]
 */
function staggerIn(items, opts = {}) {
  const gsap = window.gsap;
  if (!items.length || !gsap) return;

  const y = opts.y ?? 18;
  const staggerSeconds = (opts.delayMs ?? 70) / 1000;
  const duration = (opts.duration ?? 720) / 1000;

  for (const el of items) {
    revealed.add(el);
    el.setAttribute('data-maison-motion', 'running');
  }

  gsap.fromTo(
    items,
    { opacity: 0, y },
    {
      opacity: 1,
      y: 0,
      duration,
      ease: 'power3.out',
      stagger: staggerSeconds,
      overwrite: 'auto',
      onComplete: () => {
        for (const el of items) {
          clearInlineReveal(el);
          el.setAttribute('data-maison-motion', 'done');
        }
      },
    },
  );
}

function heroReveal() {
  const gsap = window.gsap;
  if (!gsap) return;

  const content = document.querySelector('.hero__content-wrapper');
  if (content) {
    const blocks = Array.from(content.children);
    if (blocks.length) {
      gsap.fromTo(
        blocks,
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.88, ease: 'power4.out', stagger: 0.12, overwrite: 'auto' },
      );
    }
  }

  const media = document.querySelector('.hero__media-wrapper');
  if (media) {
    gsap.fromTo(
      media,
      { opacity: 0, scale: 1.04 },
      { opacity: 1, scale: 1, duration: 1.35, ease: 'power3.out', overwrite: 'auto' },
    );
  }
}

function revealSpecTable(table) {
  if (!(table instanceof Element) || revealed.has(table)) return;
  revealed.add(table);

  const parts = Array.from(
    table.querySelectorAll(
      '.maison-spec-table__heading, .maison-spec-table__status, .maison-spec-table__row',
    ),
  );
  staggerIn(parts, { y: 10, delayMs: 55, duration: 560 });
}

function observeReveals() {
  observer?.disconnect();

  const cards = Array.from(document.querySelectorAll(CARD_SELECTOR));
  const tables = Array.from(document.querySelectorAll('.maison-spec-table'));
  const specParts = tables.flatMap((table) =>
    Array.from(
      table.querySelectorAll(
        '.maison-spec-table__heading, .maison-spec-table__status, .maison-spec-table__row',
      ),
    ),
  );

  prepBelowFold([...cards, ...specParts]);

  observer = new IntersectionObserver(
    (entries) => {
      /** @type {Element[]} */
      const cardBatch = [];

      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target;
        observer?.unobserve(el);

        if (el.classList?.contains('maison-spec-table')) {
          revealSpecTable(el);
          continue;
        }

        if (!revealed.has(el)) cardBatch.push(el);
      }

      if (cardBatch.length) staggerIn(cardBatch, { y: 22, delayMs: 90, duration: 700 });
    },
    { root: null, rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
  );

  for (const el of cards) observer.observe(el);
  for (const el of tables) observer.observe(el);
}

function pulse(target, peak, duration) {
  const gsap = window.gsap;
  if (!target || !gsap) return;
  gsap.fromTo(
    target,
    { scale: 1 },
    { scale: peak, duration, ease: 'sine.inOut', yoyo: true, repeat: 1, overwrite: 'auto', clearProps: 'scale' },
  );
}

function cartFeedback() {
  if (cartBound) return;
  cartBound = true;

  document.addEventListener(CART_LINES_UPDATE, (event) => {
    if (!motionAllowed()) return;
    const action = event?.detail?.action ?? event?.action;
    if (action && action !== 'add') return;

    const icon =
      document.querySelector('cart-icon.header-actions__cart-icon') ||
      document.querySelector('.header-actions__cart-icon') ||
      document.querySelector('cart-icon');

    pulse(icon, 1.14, 0.21);

    const bubble = icon?.querySelector?.('.cart-bubble') ?? document.querySelector('.cart-bubble');
    pulse(bubble, 1.2, 0.19);
  });
}

function boot() {
  if (!motionAllowed() || !window.gsap) return;
  markMotionActive();
  heroReveal();
  observeReveals();
  cartFeedback();
}

function stop() {
  document.documentElement.classList.remove('maison-motion-active');
  document.querySelectorAll('[data-maison-motion]').forEach((el) => clearInlineReveal(el));
  window.gsap?.killTweensOf?.('[data-maison-motion]');
  observer?.disconnect();
  observer = null;
}

/* Defer to DOMContentLoaded: maison-runtime.js is a deferred classic script and
   publishes window.gsap right before this event fires. */
if (document.readyState === 'loading' || document.readyState === 'interactive') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}

prefersReducedMotion.addEventListener?.('change', (event) => {
  if (event.matches) stop();
  else boot();
});

document.addEventListener('maison:reduced-motion', (event) => {
  if (event?.detail?.reduced) stop();
  else boot();
});

document.addEventListener('shopify:section:load', () => {
  if (motionAllowed()) observeReveals();
});

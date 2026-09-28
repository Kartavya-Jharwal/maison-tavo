/**
 * Maison motion pass (M0 spike → M3/M4 eye-candy).
 *
 * anime.js v4 + Motion (motion.dev vanilla) as vendored ESM under `assets/`.
 *   - Hero content stagger + media settle (homepage)
 *   - Product-card / resource-card scroll reveals
 *   - Spec-table row stagger (scroll-triggered)
 *   - Cart icon feedback on add
 *
 * D10 compliance:
 *   - Skipped entirely under `prefers-reduced-motion: reduce`.
 *   - Opacity / transform only — zero layout shift.
 *   - Removable: delete this file, `maison-motion.css`, `anime.esm.js` /
 *     `motion.esm.js`, and the motion tags in `snippets/scripts.liquid`.
 */

import { animate, stagger } from './anime.esm.js';
import { animate as motionAnimate } from './motion.esm.js';

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const CART_LINES_UPDATE = 'shopify:cart:lines-update';
const CARD_SELECTOR = 'product-card, .resource-card';

/** @type {WeakSet<Element>} */
const revealed = new WeakSet();

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
  if (items.length === 0) return;

  const y = opts.y ?? 18;
  const delayMs = opts.delayMs ?? 70;
  const duration = opts.duration ?? 720;

  for (const el of items) {
    revealed.add(el);
    el.setAttribute('data-maison-motion', 'running');
  }

  animate(items, {
    opacity: [0, 1],
    translateY: [y, 0],
    delay: stagger(delayMs),
    duration,
    ease: 'outCubic',
    onComplete: () => {
      for (const el of items) {
        clearInlineReveal(el);
        el.setAttribute('data-maison-motion', 'done');
      }
    },
  });
}

function heroReveal() {
  const content = document.querySelector('.hero__content-wrapper');
  if (content) {
    const blocks = Array.from(content.children);
    if (blocks.length > 0) {
      animate(blocks, {
        opacity: [0, 1],
        translateY: [24, 0],
        delay: stagger(120),
        duration: 880,
        ease: 'outExpo',
      });
    }
  }

  const media = document.querySelector('.hero__media-wrapper');
  if (media) {
    motionAnimate(
      media,
      { opacity: [0, 1], scale: [1.04, 1] },
      { duration: 1.35, easing: [0.16, 1, 0.3, 1] },
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
  const cards = Array.from(document.querySelectorAll(CARD_SELECTOR));
  const tables = Array.from(document.querySelectorAll('.maison-spec-table'));
  const specParts = tables.flatMap((t) =>
    Array.from(
      t.querySelectorAll(
        '.maison-spec-table__heading, .maison-spec-table__status, .maison-spec-table__row',
      ),
    ),
  );

  prepBelowFold([...cards, ...specParts]);

  const observer = new IntersectionObserver(
    (entries) => {
      /** @type {Element[]} */
      const cardBatch = [];

      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target;
        observer.unobserve(el);

        if (el.classList?.contains('maison-spec-table')) {
          revealSpecTable(el);
          continue;
        }

        if (!revealed.has(el)) cardBatch.push(el);
      }

      if (cardBatch.length > 0) {
        staggerIn(cardBatch, { y: 22, delayMs: 90, duration: 700 });
      }
    },
    { root: null, rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
  );

  for (const el of cards) observer.observe(el);
  for (const el of tables) observer.observe(el);
}

function cartFeedback() {
  document.addEventListener(CART_LINES_UPDATE, (event) => {
    const action = event?.detail?.action ?? event?.action;
    if (action && action !== 'add') return;

    const icon =
      document.querySelector('cart-icon.header-actions__cart-icon') ||
      document.querySelector('.header-actions__cart-icon') ||
      document.querySelector('cart-icon');

    if (icon) {
      motionAnimate(
        icon,
        { scale: [1, 1.14, 1] },
        { duration: 0.42, easing: [0.22, 1, 0.36, 1] },
      );
    }

    const bubble = icon?.querySelector?.('.cart-bubble') ?? document.querySelector('.cart-bubble');
    if (bubble) {
      motionAnimate(
        bubble,
        { scale: [1, 1.2, 1] },
        { duration: 0.38, easing: [0.22, 1, 0.36, 1] },
      );
    }
  });
}

function boot() {
  if (prefersReducedMotion.matches) return;
  markMotionActive();
  heroReveal();
  observeReveals();
  cartFeedback();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}

prefersReducedMotion.addEventListener?.('change', (event) => {
  if (event.matches) {
    document.documentElement.classList.remove('maison-motion-active');
    document.querySelectorAll('[data-maison-motion]').forEach((el) => clearInlineReveal(el));
  }
});

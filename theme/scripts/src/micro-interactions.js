import gsap from 'gsap';

/**
 * Quiet GSAP micro-interactions for buttons and cards.
 * Intentionally calmer than Strike rings — scale/y only, fine-pointer only.
 * Delegated so Barba MainContent swaps keep working without per-node rebinds.
 * Skips form controls, drawers, and reduced-motion sessions.
 */

const PRESS = 'mt-press';
const HOVER = 'mt-hover';

const SELECTOR = [
  '.maison-btn',
  '.maison-lineups__link',
  '.provenance-col',
  'product-card',
  '.finder-opt-btn',
  '.finder-view-btn',
  '.maison-last-call__submit-btn',
  '.maison-collection-hero__cta',
  'a.button, button.button, .button-primary, .button-secondary',
].join(', ');

const SKIP = 'input, textarea, select, [data-mt-no-micro], [aria-disabled="true"], [disabled]';

let started = false;
let reducedListener = null;

function motionAllowed() {
  if (document.documentElement.dataset.reducedMotion === 'true') return false;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  return true;
}

function finePointer() {
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}

function resolveTarget(node) {
  if (!(node instanceof Element)) return null;
  if (node.closest(SKIP)) return null;
  const hit = node.closest(SELECTOR);
  if (!hit || hit.closest('theme-drawer, [data-barba-prevent], dialog[open]')) return null;
  // Prefer the interactive child link/button inside product-card chrome.
  if (hit.matches('product-card')) {
    const link = hit.querySelector('a.product-card__link, a[href]');
    return link || hit;
  }
  return hit;
}

function clearTween(el) {
  gsap.killTweensOf(el);
  delete el.dataset[PRESS];
  delete el.dataset[HOVER];
}

function settle(el) {
  clearTween(el);
  gsap.to(el, {
    y: 0,
    scale: 1,
    duration: 0.38,
    ease: 'power3.out',
    overwrite: 'auto',
    clearProps: 'transform',
  });
}

function onEnter(event) {
  if (!motionAllowed() || !finePointer()) return;
  const el = resolveTarget(event.target);
  if (!el || el.dataset[PRESS] === 'true') return;
  el.dataset[HOVER] = 'true';
  gsap.to(el, {
    y: -2,
    scale: 1.012,
    duration: 0.32,
    ease: 'power2.out',
    overwrite: 'auto',
  });
}

function onLeave(event) {
  const el = resolveTarget(event.target);
  if (!el) return;
  if (event.relatedTarget instanceof Node && el.contains(event.relatedTarget)) return;
  settle(el);
}

function onDown(event) {
  if (!motionAllowed()) return;
  if (event.pointerType === 'touch') return;
  const el = resolveTarget(event.target);
  if (!el) return;
  el.dataset[PRESS] = 'true';
  gsap.to(el, {
    y: 0,
    scale: 0.985,
    duration: 0.14,
    ease: 'power2.out',
    overwrite: 'auto',
  });
}

function onUp(event) {
  const el = resolveTarget(event.target);
  if (!el) return;
  delete el.dataset[PRESS];
  if (!motionAllowed() || !finePointer()) {
    settle(el);
    return;
  }
  if (el.matches(':hover') || el.dataset[HOVER] === 'true') {
    el.dataset[HOVER] = 'true';
    gsap.to(el, {
      y: -2,
      scale: 1.012,
      duration: 0.28,
      ease: 'power2.out',
      overwrite: 'auto',
    });
    return;
  }
  settle(el);
}

function onReduced(event) {
  if (!event?.detail?.reduced) return;
  document.querySelectorAll(`[data-${PRESS}], [data-${HOVER}]`).forEach((el) => {
    clearTween(el);
    gsap.set(el, { clearProps: 'transform' });
  });
}

export function initMicroInteractions() {
  if (started || window.Shopify?.designMode) return;
  started = true;

  document.addEventListener('pointerenter', onEnter, true);
  document.addEventListener('pointerleave', onLeave, true);
  document.addEventListener('pointerdown', onDown, true);
  document.addEventListener('pointerup', onUp, true);
  document.addEventListener('pointercancel', onUp, true);

  if (!reducedListener) {
    reducedListener = onReduced;
    document.addEventListener('maison:reduced-motion', reducedListener);
  }
}

export function refreshMicroInteractions() {
  // Delegated listeners — nothing to rebind after Barba enter.
  if (!motionAllowed()) {
    document.querySelectorAll(`[data-${PRESS}], [data-${HOVER}]`).forEach((el) => {
      clearTween(el);
      gsap.set(el, { clearProps: 'transform' });
    });
  }
}

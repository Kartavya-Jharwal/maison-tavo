import { animate, inView, scroll, stagger } from 'motion';
import { createStore } from 'zustand/vanilla';

/**
 * Vanilla storefront runtime for Liquid islands.
 * Bundled to assets/maison-runtime.js (IIFE → window.MaisonRuntime).
 * Do not import React from here — Horizon stays the storefront.
 */
const MaisonRuntime = {
  animate,
  stagger,
  inView,
  scroll,
  createStore,
};

globalThis.MaisonRuntime = MaisonRuntime;

// Cart add-to-cart feedback — scale pulse on the cart icon (D10: reduced-motion aware)
if (typeof document !== 'undefined') {
  document.addEventListener('shopify:cart:lines-update', (e) => {
    if (e && e.detail && e.detail.action !== 'add') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const el = document.querySelector(
      '[data-cart-icon-bubble], .cart-count-bubble, .header__icon--cart',
    );
    if (!el) return;
    animate(el, {scale: [1, 0.88, 1.12, 1]}, {duration: 0.35, easing: [0.22, 1, 0.36, 1]});
  });
}

// Cart add-to-cart feedback — scale pulse on the cart icon (D10: reduced-motion aware)
if (typeof document !== 'undefined') {
  document.addEventListener('shopify:cart:lines-update', (e) => {
    if (e && e.detail && e.detail.action !== 'add') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const el = document.querySelector(
      '[data-cart-icon-bubble], .cart-count-bubble, .header__icon--cart'
    );
    if (!el) return;
    animate(el, { scale: [1, 0.88, 1.12, 1] }, { duration: 0.35, easing: [0.22, 1, 0.36, 1] });
  });
}

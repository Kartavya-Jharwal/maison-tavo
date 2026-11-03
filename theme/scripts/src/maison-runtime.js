import { animate, inView, scroll, stagger } from 'motion';
import { createStore } from 'zustand/vanilla';

/**
 * Vanilla storefront runtime for Liquid islands.
 * Bundled to assets/maison-runtime.js (IIFE → window.MaisonRuntime).
 */
const MaisonRuntime = {
  animate,
  stagger,
  inView,
  scroll,
  createStore,
};

globalThis.MaisonRuntime = MaisonRuntime;

// Cart add-to-cart feedback - scale pulse on the cart icon (D10: reduced-motion aware)
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

// ─── V1 The Strike (global) - Concentric rings radiating in bell bronze ───
function triggerStrike(e) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const x = e.clientX;
  const y = e.clientY;
  
  const container = document.createElement('div');
  container.className = 'maison-strike-container';
  container.style.cssText = `
    position: fixed;
    top: 0; left: 0; width: 100vw; height: 100vh;
    pointer-events: none;
    z-index: 999999;
    overflow: hidden;
  `;
  
  // 3 concentric bell-bronze rings
  [0, 120, 240].forEach((delay) => {
    const ring = document.createElement('div');
    ring.style.cssText = `
      position: absolute;
      top: ${y}px; left: ${x}px;
      width: 12px; height: 12px;
      border: 1.5px solid var(--bell, #B8893A);
      border-radius: 50%;
      transform: translate(-50%, -50%) scale(0.1);
      opacity: 0.85;
      box-shadow: 0 0 12px rgba(184, 137, 58, 0.45);
    `;
    container.appendChild(ring);
    
    setTimeout(() => {
      animate(
        ring,
        { transform: ['translate(-50%, -50%) scale(0.1)', 'translate(-50%, -50%) scale(16)'], opacity: [0.85, 0] },
        { duration: 0.9, easing: [0.2, 0.8, 0.2, 1] }
      );
    }, delay);
  });
  
  document.body.appendChild(container);
  setTimeout(() => container.remove(), 1400);

  playTempleBell();
}

function playTempleBell() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const now = ctx.currentTime;
    
    // Fundamental bell frequencies (~880Hz, 1320Hz, 2200Hz)
    [880, 1320, 2200].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      
      const initialVol = 0.03 / (idx + 1);
      gain.gain.setValueAtTime(initialVol, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 1.15);
    });
  } catch (e) {
    // Audio context not permitted yet
  }
}

if (typeof document !== 'undefined') {
  document.addEventListener('pointerdown', (e) => {
    const target = e.target.closest('[data-strike], .button-primary, .kansa-mic-action, .maison-view-as__seg-btn, .maison-collection-hero__cta');
    if (target) {
      triggerStrike(e);
    }
  });
}

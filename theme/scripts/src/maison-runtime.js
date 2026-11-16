import { animate, inView, scroll, stagger } from 'motion';
import { createStore } from 'zustand/vanilla';
import { initHorizonScroll } from './horizon-scroll.js';
import { initDrawerGesture } from './drawer-gesture.js';
import { initPageTransitions } from './page-transition.js';

/**
 * Lightweight Spring Physics Helper
 * Attribution & Inspiration: [Abdughafur Khujzoda on CodePen](https://codepen.io/Abdughafur-Khujzoda)
 */
function spring(element, property, target, options = {}) {
  const tension = options.tension || 210;
  const friction = options.friction || 24;
  const state = spring.states || (spring.states = new WeakMap());
  let data = state.get(element);
  if (!data) data = {};
  if (!data[property]) data[property] = { value: 0, velocity: 0, target: 0 };
  const s = data[property];
  s.target = target;
  state.set(element, data);
  function tick(dt) {
    const acceleration = -tension * (s.value - s.target) - friction * s.velocity;
    s.velocity += acceleration * dt;
    s.value += s.velocity * dt;
    return Math.abs(s.value - s.target) < 0.001 && Math.abs(s.velocity) < 0.001;
  }
  return { state: s, tick };
}

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
  spring,
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

const PROFILE_KEY = 'mt_user_profile';
const SOUND_KEY = 'maison:sound-enabled';
const PROFILER_LATER_KEY = 'mt_profiler_later';
const VIEWS_KEY = 'mt_product_views';

// Horizon scrolls `.page-wrapper` instead of the window from 990px up.
function getScroller() {
  const wrapper = document.querySelector('.page-wrapper');
  if (wrapper && wrapper.scrollHeight > wrapper.clientHeight + 1) return wrapper;
  return document.scrollingElement || document.documentElement;
}

function readProfile() {
  try {
    return JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null');
  } catch {
    return null;
  }
}

function soundEnabled() {
  try {
    return localStorage.getItem(SOUND_KEY) === 'true';
  } catch {
    return false;
  }
}

const FIT_COPY = {
  induction: 'Ideal for your induction stove',
  flame: 'Made for your open flame',
  sear: 'Built for high-heat searing',
  simmer: 'Suited to your slow simmer',
};

function tagProfileFits(root = document) {
  const profile = readProfile();
  root.querySelectorAll('[data-mt-heat]').forEach((card) => {
    const chip = card.querySelector('[data-mt-fit]');
    if (!chip) return;
    if (!profile) {
      chip.hidden = true;
      return;
    }
    const heat = card.dataset.mtHeat || '';
    const lineup = card.dataset.mtLineup || '';
    let copy = '';
    if (profile.heat === 'induction' && heat.includes('induction')) copy = FIT_COPY.induction;
    else if (profile.heat === 'flame' && /gas|flame|charcoal/.test(heat)) copy = FIT_COPY.flame;
    else if (profile.style === 'sear' && lineup.includes('forge')) copy = FIT_COPY.sear;
    else if (profile.style === 'simmer' && /terre|clay/.test(lineup)) copy = FIT_COPY.simmer;
    if (chip.textContent !== copy) chip.textContent = copy;
    if (chip.hidden !== !copy) chip.hidden = !copy;
  });
}

function initProfiler() {
  const drawer = document.querySelector('[data-mt-profiler]');
  if (!drawer) return;
  const form = drawer.querySelector('[data-mt-profiler-form]');
  let returnFocus = null;

  if (document.getElementById('MainContent')?.dataset.template?.startsWith('product')) {
    sessionStorage.setItem(VIEWS_KEY, String(Number(sessionStorage.getItem(VIEWS_KEY) || 0) + 1));
  }

  const eligible = () =>
    !readProfile() && !sessionStorage.getItem(PROFILER_LATER_KEY) && drawer.hidden;

  const open = () => {
    if (!eligible()) return;
    returnFocus = document.activeElement;
    drawer.hidden = false;
    drawer.querySelector('input')?.focus({ preventScroll: true });
    window.removeEventListener('scroll', onScroll, { capture: true });
  };

  const close = () => {
    drawer.hidden = true;
    sessionStorage.setItem(PROFILER_LATER_KEY, '1');
    if (returnFocus instanceof HTMLElement) returnFocus.focus({ preventScroll: true });
  };

  const onScroll = () => {
    const scroller = getScroller();
    const max = scroller.scrollHeight - scroller.clientHeight;
    if (max > 0 && scroller.scrollTop / max >= 0.45) open();
  };

  if (!eligible()) return;
  window.addEventListener('scroll', onScroll, { passive: true, capture: true });
  setTimeout(() => {
    if (Number(sessionStorage.getItem(VIEWS_KEY) || 0) >= 2) open();
  }, 45000);

  drawer.querySelector('[data-mt-profiler-later]').addEventListener('click', close);
  drawer.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') close();
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    localStorage.setItem(
      PROFILE_KEY,
      JSON.stringify({
        heat: data.get('heat'),
        style: data.get('style'),
        email: data.get('email') || null,
        savedAt: new Date().toISOString(),
      }),
    );
    drawer.hidden = true;
    tagProfileFits();
    if (returnFocus instanceof HTMLElement) returnFocus.focus({ preventScroll: true });
  });
}

function initStorageReset() {
  document.addEventListener('click', (event) => {
    if (!event.target.closest('[data-mt-reset]')) return;
    event.preventDefault();
    localStorage.clear();
    sessionStorage.clear();
    document.cookie.split(';').forEach((cookie) => {
      const name = cookie.split('=')[0].trim();
      if (name.startsWith('mt_')) document.cookie = `${name}=; Max-Age=0; path=/`;
    });
    window.location.reload();
  });
}

function initReducedMotionPreference() {
  const toggleBtn = document.querySelector('[data-mt-reduced-motion-toggle]');
  const label = document.querySelector('[data-mt-motion-label]');
  
  const saved = localStorage.getItem('mt_reduced_motion');
  const isReduced = saved === 'true' || (saved === null && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  if (isReduced) {
    document.documentElement.dataset.reducedMotion = 'true';
    if (toggleBtn) toggleBtn.setAttribute('aria-pressed', 'true');
    if (label) label.textContent = 'ON';
  }

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const current = document.documentElement.dataset.reducedMotion === 'true';
      const next = !current;
      document.documentElement.dataset.reducedMotion = String(next);
      localStorage.setItem('mt_reduced_motion', String(next));
      toggleBtn.setAttribute('aria-pressed', String(next));
      if (label) label.textContent = next ? 'ON' : 'OFF';
    });
  }
}

function initConsentBar() {
  const bar = document.querySelector('[data-mt-consent-bar]');
  if (!bar) return;
  const existingTier = localStorage.getItem('mt_cookie_tier');
  if (!existingTier) {
    setTimeout(() => {
      if (!localStorage.getItem('mt_cookie_tier')) {
        bar.hidden = false;
      }
    }, 1500);
  }

  bar.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-mt-consent-action]');
    if (!btn) return;
    const tier = btn.dataset.mtConsentAction;
    localStorage.setItem('mt_cookie_tier', tier);
    bar.hidden = true;
  });
}

function playTempleBell() {
  if (!soundEnabled()) return;
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
    const target = e.target.closest('[data-strike], .kansa-mic-action, .maison-lens__option, .maison-collection-hero__cta');
    if (target) {
      triggerStrike(e);
    }
  });

  /**
   * Staggered Text Mask & Element Reveals
   * Attribution & Inspiration: [Abdughafur Khujzoda on CodePen](https://codepen.io/Abdughafur-Khujzoda)
   */
  function initInViewReveals() {
    if (typeof IntersectionObserver === 'undefined') return;

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          const delay = Number(el.dataset.delay || 0);
          setTimeout(() => {
            el.classList.add('revealed', 'is-visible', 'visible');
          }, delay);
          revealObserver.unobserve(el);
        });
      },
      { threshold: 0.12 }
    );

    document.querySelectorAll('.clip-line, .inview, .inview-scale, .stacked-title, [data-reveal]').forEach((el) => {
      if (el.dataset.mtRevealBound) return;
      el.dataset.mtRevealBound = 'true';
      revealObserver.observe(el);
    });

    // Auto-reveal hero headline on load
    const hero = document.querySelector('.maison-hero');
    if (hero) {
      setTimeout(() => {
        hero.classList.add('is-revealed', 'revealed');
      }, 120);
    }
  }

  /**
   * Ambient Parallax Drift for Ghost Metallurgy Typography
   * Attribution & Inspiration: [Abdughafur Khujzoda on CodePen](https://codepen.io/Abdughafur-Khujzoda)
   */
  function initGhostParallax() {
    // Owned by horizon-scroll.js (GSAP ScrollTrigger on the Horizon scroller).
  }

  MaisonRuntime.initInViewReveals = initInViewReveals;
  MaisonRuntime.initGhostParallax = initGhostParallax;

  MaisonRuntime.tagProfileFits = tagProfileFits;

  function loadScript(src) {
    if (!src) return Promise.reject(new Error('missing asset'));
    if (window.__mtVesselScript) return window.__mtVesselScript;
    if (window.MaisonVessel) return Promise.resolve();
    const existing = [...document.scripts].find((script) => script.src === src);
    if (existing?.dataset.loaded === 'true') return Promise.resolve();
    if (existing) {
      return new Promise((resolve, reject) => {
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', () => reject(new Error('asset failed')), { once: true });
      });
    }
    const pending = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = false;
      script.onload = () => {
        script.dataset.loaded = 'true';
        resolve();
      };
      script.onerror = () => reject(new Error('asset failed'));
      document.body.appendChild(script);
    });
    window.__mtVesselScript = pending;
    return pending;
  }

  let vesselWatch = null;

  function ensureVessel() {
    vesselWatch?.disconnect();
    const nodes = [...document.querySelectorAll('[data-mt-vessel]')];
    if (!nodes.length) return;
    if (window.MaisonVessel) {
      window.MaisonVessel.mountAll();
      return;
    }
    const start = () => {
      loadScript(window.MaisonAssets?.vessel)
        .then(() => window.MaisonVessel?.mountAll())
        .catch(() => {
          document.querySelectorAll('[data-mt-fallback]').forEach((node) => {
            node.hidden = false;
          });
        });
    };
    const scroller = getScroller();
    const root =
      scroller instanceof Element && scroller !== document.body && scroller !== document.documentElement
        ? scroller
        : null;
    vesselWatch = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        vesselWatch?.disconnect();
        vesselWatch = null;
        start();
      },
      { root, rootMargin: '480px' },
    );
    nodes.forEach((node) => vesselWatch.observe(node));
  }

  const boot = () => {
    initReducedMotionPreference();
    initConsentBar();
    initInViewReveals();
    initGhostParallax();
    initHorizonScroll();
    initPageTransitions();
    initDrawerGesture();
    initProfiler();
    initStorageReset();
    tagProfileFits();
    ensureVessel();
  };

  document.addEventListener('maison:page-enter', () => {
    if (document.documentElement.dataset.mtRouteBound === 'busy') return;
    document.documentElement.dataset.mtRouteBound = 'busy';
    queueMicrotask(() => {
      delete document.documentElement.dataset.mtRouteBound;
    });
    initInViewReveals();
    tagProfileFits();
    ensureVessel();
    const template = document.getElementById('MainContent')?.dataset.template || '';
    if (!template.startsWith('product')) return;
    const seen = Number(sessionStorage.getItem(VIEWS_KEY) || 0) + 1;
    sessionStorage.setItem(VIEWS_KEY, String(seen));
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // Shopify Theme Editor dynamic section reload support
  document.addEventListener('shopify:section:load', (event) => {
    initInViewReveals();
    initGhostParallax();
    tagProfileFits(event.target);
  });

  // Horizon re-renders cards on filter, sort, and pagination.
  let fitFrame = 0;
  new MutationObserver(() => {
    cancelAnimationFrame(fitFrame);
    fitFrame = requestAnimationFrame(() => tagProfileFits());
  }).observe(document.getElementById('MainContent') || document.body, {
    childList: true,
    subtree: true,
  });
}

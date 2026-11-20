import { animate, inView, scroll, stagger } from 'motion';
import { createStore } from 'zustand/vanilla';
import gsap from 'gsap';
import { initHorizonScroll } from './horizon-scroll.js';
import { initDrawerGesture } from './drawer-gesture.js';
import { initPageTransitions } from './page-transition.js';
import { initMicroInteractions, refreshMicroInteractions } from './micro-interactions.js';
import { initIdleBlazeLoader } from './effects/idle-blaze-loader.js';
import { initMaisonToasts, MaisonToast, showToast } from './maison-toasts.js';
import { initStreak, streakApi } from './streak.js';
import { initLens } from './lens.js';

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
  toast: showToast,
  MaisonToast,
  gsap,
};

globalThis.MaisonRuntime = MaisonRuntime;
globalThis.gsap = gsap;

/** Respect OS preference and the footer / consent-bar motion toggle. */
function motionReduced() {
  const flag = document.documentElement.dataset.reducedMotion;
  if (flag === 'true') return true;
  if (flag === 'false') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function announceMotionPreference(reduced) {
  document.dispatchEvent(
    new CustomEvent('maison:reduced-motion', { detail: { reduced: Boolean(reduced) } }),
  );
}

// Cart add-to-cart feedback - scale pulse on the cart icon (D10: reduced-motion aware)
if (typeof document !== 'undefined') {
  document.addEventListener('shopify:cart:lines-update', (e) => {
    if (e && e.detail && e.detail.action !== 'add') return;
    if (motionReduced()) return;
    const el = document.querySelector(
      '[data-cart-icon-bubble], .cart-count-bubble, .header__icon--cart',
    );
    if (!el) return;
    animate(el, {scale: [1, 0.88, 1.12, 1]}, {duration: 0.35, easing: [0.22, 1, 0.36, 1]});
  });
}

// ─── V1 The Strike (global) - Concentric rings radiating in bell bronze ───
function triggerStrike(e) {
  if (motionReduced()) return;
  const x = e.clientX;
  const y = e.clientY;
  
  const container = document.createElement('div');
  container.className = 'maison-strike-container';
  container.setAttribute('aria-hidden', 'true');
  container.style.cssText = `
    position: fixed;
    top: 0; left: 0; width: 100vw; height: 100vh;
    pointer-events: none;
    z-index: 999999;
    overflow: hidden;
  `;
  
  // Restrained Strike: two soft rings, lower opacity, shorter life
  [0, 160].forEach((delay) => {
    const ring = document.createElement('div');
    ring.style.cssText = `
      position: absolute;
      top: ${y}px; left: ${x}px;
      width: 10px; height: 10px;
      border: 1px solid var(--bell, #B8893A);
      border-radius: 50%;
      transform: translate(-50%, -50%) scale(0.15);
      opacity: 0.35;
      box-shadow: none;
    `;
    container.appendChild(ring);

    setTimeout(() => {
      animate(
        ring,
        {
          transform: ['translate(-50%, -50%) scale(0.15)', 'translate(-50%, -50%) scale(8)'],
          opacity: [0.35, 0],
        },
        { duration: 0.55, easing: [0.2, 0.8, 0.2, 1] },
      );
    }, delay);
  });

  document.body.appendChild(container);
  setTimeout(() => container.remove(), 900);

  playTempleBell();
}

const PROFILE_KEY = 'mt_user_profile';
const SOUND_KEY = 'maison:sound-enabled';
const PROFILER_LATER_KEY = 'mt_profiler_later';
const VIEWS_KEY = 'mt_engaged_page_views';

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
  const profiler = document.querySelector('[data-mt-profiler]');
  const mail = document.querySelector('[data-mt-exit-mail]');
  if (!profiler?.showModal || !mail?.showModal) return;
  try {
    sessionStorage.getItem(VIEWS_KEY);
    localStorage.getItem(PROFILE_KEY);
  } catch {
    return;
  }

  const form = profiler.querySelector('[data-mt-profiler-form]');
  const MAIL_SEEN = 'mt_exit_mail_seen';
  const MAIL_PENDING = 'mt_exit_mail_pending';
  const NEWSLETTER = 'mt-mail-subscribed';
  let pageViews = Number(sessionStorage.getItem(VIEWS_KEY) || 0);
  let pageStarted = null;
  let deepest = 0;
  let timer;
  let profilerShown = false;
  let mailShown = Boolean(sessionStorage.getItem(MAIL_SEEN));

  function showStep(dialog, index, focus = true) {
    const steps = [...dialog.querySelectorAll('[data-mt-step]')];
    if (!steps[index]) return;
    steps.forEach((step, i) => {
      step.hidden = i !== index;
      step.removeAttribute('data-mt-step-enter');
    });
    steps[index].setAttribute('data-mt-step-enter', '');
    if (focus) steps[index].querySelector('h3')?.focus({ preventScroll: true });
  }

  [profiler, mail].forEach((dialog) => {
    dialog.addEventListener('click', (event) => {
      if (event.target.closest('[data-mt-dialog-close]')) {
        dialog.close();
        return;
      }
      const step = event.target.closest('[data-mt-step]');
      const index = [...dialog.querySelectorAll('[data-mt-step]')].indexOf(step);
      if (event.target.closest('[data-mt-next]')) showStep(dialog, index + 1);
      else if (event.target.closest('[data-mt-back]')) showStep(dialog, index - 1);
    });
  });

  form.addEventListener('change', (event) => {
    if (event.target.matches('input[type="radio"]')) {
      event.target.closest('[data-mt-step]').querySelector('[data-mt-next]').disabled = false;
    }
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const values = new FormData(form);
    if (!values.has('heat') || !values.has('style')) return;
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify({
        heat: values.get('heat'),
        style: values.get('style'),
        email: values.get('email')?.trim() || null,
        savedAt: new Date().toISOString(),
      }));
    } catch {
      form.querySelector('[data-mt-profile-error]').hidden = false;
      return;
    }
    profiler.close();
    tagProfileFits();
  });

  function canOffer() {
    return !document.hidden &&
      !document.querySelector('dialog[open], [data-mt-consent-bar]:not([hidden])') &&
      !/\/(?:cart|checkout|account|password|challenge)(?:\/|$)|\/pages\/(?:mail|privacy-policy|cookie-policy|terms-of-service)(?:\/|$)/.test(location.pathname);
  }

  function checkProfiler() {
    if (pageStarted === null || performance.now() - pageStarted < 10000 ||
      (deepest < 0.45 && pageViews < 2) || profilerShown ||
      readProfile() || sessionStorage.getItem(PROFILER_LATER_KEY) || !canOffer()) return;
    profilerShown = true;
    sessionStorage.setItem(PROFILER_LATER_KEY, '1');
    profiler.showModal();
    showStep(profiler, 0);
  }

  function onScroll() {
    const scroller = getScroller();
    const range = scroller.scrollHeight - scroller.clientHeight;
    if (range > 0) deepest = Math.max(deepest, scroller.scrollTop / range);
    checkProfiler();
  }

  function startPage() {
    pageStarted = performance.now();
    deepest = 0;
    pageViews += 1;
    sessionStorage.setItem(VIEWS_KEY, String(pageViews));
    clearTimeout(timer);
    timer = setTimeout(checkProfiler, 10000);
  }

  const splash = document.querySelector('#SplashIntro[open]');
  if (splash) splash.addEventListener('close', startPage, { once: true });
  else startPage();

  window.addEventListener('scroll', onScroll, { passive: true, capture: true });
  document.addEventListener('visibilitychange', checkProfiler);
  document.querySelector('[data-mt-consent-bar]')?.addEventListener('click', () => queueMicrotask(checkProfiler));
  document.addEventListener('maison:page-enter', startPage);
  document.addEventListener('maison:page-leave', () => {
    pageStarted = null;
    clearTimeout(timer);
    [profiler, mail].forEach((dialog) => { if (dialog.open) dialog.close(); });
  });

  mail.querySelector('form').addEventListener('submit', () => sessionStorage.setItem(MAIL_PENDING, '1'));
  if (sessionStorage.getItem(MAIL_PENDING)) {
    sessionStorage.removeItem(MAIL_PENDING);
    if (mail.querySelector('[data-mt-newsletter-success], [data-mt-newsletter-error]')) {
      const showMailResult = () => {
        if (!mail.open) {
          mail.showModal();
          showStep(mail, 1);
        }
      };
      if (splash) splash.addEventListener('close', showMailResult, { once: true });
      else showMailResult();
    }
  }

  document.addEventListener('mouseout', (event) => {
    if (event.relatedTarget || event.clientY > 0 || !matchMedia('(hover: hover) and (pointer: fine)').matches ||
      pageStarted === null || performance.now() - pageStarted < 10000 || (deepest < 0.3 && pageViews < 2) ||
      mailShown || readProfile()?.email || localStorage.getItem(NEWSLETTER) === '1' || !canOffer()) return;
    mailShown = true;
    sessionStorage.setItem(MAIL_SEEN, '1');
    mail.showModal();
    showStep(mail, 0);
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

function initAboutScreens() {
  const routes = {
    curator: '/collections',
    agent: '/pages/ucp',
    voice: '/pages/kansa',
    pass: '/pages/releases',
  };

  function activate(tab) {
    const root = tab.closest('[data-component="maison-screens"]');
    if (!root) return;
    root.querySelectorAll('[data-screen-target]').forEach((item) => {
      const selected = item === tab;
      item.classList.toggle('is-active', selected);
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
    });
    root.querySelectorAll('[data-screen]').forEach((panel) => {
      const selected = panel.dataset.screen === tab.dataset.screenTarget;
      panel.classList.toggle('is-active', selected);
      panel.hidden = !selected;
    });
    const address = root.querySelector('[data-screen-address]');
    if (address) address.textContent = routes[tab.dataset.screenTarget];
    const label = root.querySelector('[data-screen-meta] .meta-tag');
    if (label) label.textContent = tab.querySelector('.tab-title').textContent;
  }

  document.addEventListener('click', (event) => {
    const tab = event.target.closest('.maison-screens__tab[data-screen-target]');
    if (tab) activate(tab);
  });
  document.addEventListener('keydown', (event) => {
    const tab = event.target.closest('.maison-screens__tab[data-screen-target]');
    if (!tab || !['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const tabs = [...tab.closest('[role="tablist"]').querySelectorAll('[role="tab"]')];
    const index = tabs.indexOf(tab);
    let next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    else if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
    activate(tabs[next]);
    tabs[next].focus();
  });
}

function initReducedMotionPreference() {
  const toggleBtn = document.querySelector('[data-mt-reduced-motion-toggle]');
  const label = document.querySelector('[data-mt-motion-label]');

  let saved = null;
  try {
    saved = localStorage.getItem('mt_reduced_motion');
  } catch {
    saved = null;
  }
  const isReduced =
    saved === 'true' || (saved === null && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  document.documentElement.dataset.reducedMotion = String(isReduced);
  if (toggleBtn) toggleBtn.setAttribute('aria-pressed', String(isReduced));
  if (label) label.textContent = isReduced ? 'ON' : 'OFF';

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const next = document.documentElement.dataset.reducedMotion !== 'true';
      document.documentElement.dataset.reducedMotion = String(next);
      try {
        localStorage.setItem('mt_reduced_motion', String(next));
      } catch {
        /* private mode */
      }
      toggleBtn.setAttribute('aria-pressed', String(next));
      if (label) label.textContent = next ? 'ON' : 'OFF';
      announceMotionPreference(next);
      if (next) MaisonRuntime.initInViewReveals?.();
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
  // Prefer shared MaisonSound API (same opt-in flag + kansa partials).
  if (window.MaisonSound?.playBell) {
    window.MaisonSound.playBell();
    return;
  }
  if (!soundEnabled()) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    const now = ctx.currentTime;
    // Fallback kansa partials (~880 Hz) when maison-sound.js is absent.
    [
      [880, 0.028, 1.35],
      [1320, 0.014, 1.05],
      [2200, 0.006, 0.7],
    ].forEach(([freq, vol, decay]) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + decay + 0.05);
    });
  } catch {
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
    const targets = document.querySelectorAll(
      '.clip-line, .inview, .inview-scale, .stacked-title, [data-reveal], .maison-hero',
    );

    if (motionReduced()) {
      targets.forEach((el) => {
        el.classList.add('revealed', 'is-visible', 'visible', 'is-revealed');
        el.dataset.mtRevealBound = 'true';
      });
      return;
    }

    if (typeof IntersectionObserver === 'undefined') {
      targets.forEach((el) => el.classList.add('revealed', 'is-visible', 'visible', 'is-revealed'));
      return;
    }

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
      { threshold: 0.12 },
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
  MaisonRuntime.streak = streakApi;

  function loadScript(src) {
    return loadAsset('vessel', src);
  }

  /** One in-flight promise per lazily loaded theme asset. */
  const assetPromises = new Map();

  function loadAsset(key, src) {
    if (!src) return Promise.reject(new Error(`missing asset: ${key}`));
    const pending = assetPromises.get(key);
    if (pending) return pending;

    const created = new Promise((resolve, reject) => {
      const existing = [...document.scripts].find((script) => script.src === src);
      if (existing?.dataset.loaded === 'true') {
        resolve();
        return;
      }
      if (existing) {
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', () => reject(new Error('asset failed')), { once: true });
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = () => {
        script.dataset.loaded = 'true';
        resolve();
      };
      script.onerror = () => reject(new Error('asset failed'));
      document.body.appendChild(script);
    });

    assetPromises.set(key, created);
    created.catch(() => assetPromises.delete(key));
    return created;
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
    // Tight margin: prefetch near viewport without competing with hero LCP.
    vesselWatch = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        vesselWatch?.disconnect();
        vesselWatch = null;
        start();
      },
      { root, rootMargin: '200px 0px' },
    );
    nodes.forEach((node) => vesselWatch.observe(node));
  }

  let carouselWatch = null;

  /**
   * Embla is only on the page when a merchant adds a carousel, so it ships as
   * a lazy asset like the vessel study. Mount is idempotent.
   */
  function ensureCarousel() {
    const nodes = [...document.querySelectorAll('[data-mt-carousel]')];
    if (!nodes.length) return;
    if (window.MaisonCarousel) {
      window.MaisonCarousel.mountAll();
      return;
    }
    if (carouselWatch) return;

    const scroller = getScroller();
    const root =
      scroller instanceof Element && scroller !== document.body && scroller !== document.documentElement
        ? scroller
        : null;

    carouselWatch = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        carouselWatch?.disconnect();
        carouselWatch = null;
        loadAsset('carousel', window.MaisonAssets?.carousel)
          .then(() => window.MaisonCarousel?.mountAll())
          .catch(() => {
            document.querySelectorAll('[data-mt-carousel]').forEach((node) => {
              node.classList.add('is-carousel-static');
            });
          });
      },
      { root, rootMargin: '320px 0px' },
    );
    nodes.forEach((node) => carouselWatch.observe(node));
  }

  globalThis.MaisonToast = MaisonToast;

  const boot = () => {
    initReducedMotionPreference();
    initConsentBar();
    initMaisonToasts();
    initInViewReveals();
    initGhostParallax();
    initHorizonScroll();
    initPageTransitions();
    initDrawerGesture();
    initMicroInteractions();
    initProfiler();
    initAboutScreens();
    initStorageReset();
    initStreak();
    tagProfileFits();
    initLens();
    ensureVessel();
    ensureCarousel();
    MaisonRuntime.idleBlaze = initIdleBlazeLoader();
  };

  document.addEventListener('maison:page-enter', () => {
    if (document.documentElement.dataset.mtRouteBound === 'busy') return;
    document.documentElement.dataset.mtRouteBound = 'busy';
    queueMicrotask(() => {
      delete document.documentElement.dataset.mtRouteBound;
    });
    initInViewReveals();
    refreshMicroInteractions();
    tagProfileFits();
    initLens();
    ensureVessel();
    ensureCarousel();
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
    initLens(event.target);
    ensureCarousel();
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

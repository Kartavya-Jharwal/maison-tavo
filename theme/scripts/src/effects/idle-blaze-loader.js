/**
 * Lightweight idle timer that lives in maison-runtime.
 * Loads assets/maison-idle-blaze.js only after 90s of inactivity so vgpu
 * is not on the critical path. CSS underlay still paints first inside the
 * heavy module once it mounts.
 */
export const IDLE_BLAZE_MS = 18_000;
export const IDLE_BLAZE_STORAGE_KEY = 'mt-idle-blaze';

const ACTIVITY_EVENTS = [
  'pointerdown',
  'pointermove',
  'keydown',
  'wheel',
  'scroll',
  'touchstart',
  'touchmove',
];

const BLOCKED_PATH = /\/(checkout|account|challenge|discount|apps|tools)(\/|$)/;

let started = false;
let enabled = true;
let idleTimer = 0;
let loading = null;
let handedOff = false;
let api = null;

function motionReduced() {
  const flag = document.documentElement.dataset.reducedMotion;
  if (flag === 'true') return true;
  if (flag === 'false') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function storageDisabled() {
  try {
    const v = localStorage.getItem(IDLE_BLAZE_STORAGE_KEY);
    return v === 'off' || v === '0' || v === 'false';
  } catch {
    return false;
  }
}

function isBlockedHost() {
  if (!enabled || storageDisabled()) return true;
  if (document.documentElement.dataset.mtIdleBlaze === 'off') return true;
  if (motionReduced()) return true;
  if (BLOCKED_PATH.test(location.pathname)) return true;
  const template = document.getElementById('MainContent')?.dataset.template || '';
  if (/password/i.test(template)) return true;
  if (document.body.classList.contains('password')) return true;
  if (document.querySelector('form#login_form, form[action*="/password"]')) return true;
  if (document.querySelector('[data-mt-flame-wrap], [data-mt-heat-blaze], [data-mt-no-idle-blaze]')) {
    return true;
  }
  return false;
}

function clearIdleTimer() {
  if (idleTimer) {
    window.clearTimeout(idleTimer);
    idleTimer = 0;
  }
}

function loadScript(src) {
  if (!src) return Promise.reject(new Error('missing idle blaze asset'));
  if (window.MaisonIdleBlaze) return Promise.resolve();
  if (window.__mtIdleBlazeScript) return window.__mtIdleBlazeScript;
  const existing = [...document.scripts].find((script) => script.src === src);
  if (existing?.dataset.loaded === 'true') return Promise.resolve();
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('idle blaze failed')), {
        once: true,
      });
    });
  }
  const pending = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => {
      script.dataset.loaded = 'true';
      resolve();
    };
    script.onerror = () => reject(new Error('idle blaze failed'));
    document.body.appendChild(script);
  });
  window.__mtIdleBlazeScript = pending;
  return pending;
}

async function handOff() {
  if (handedOff && api) return api;
  if (!loading) {
    loading = loadScript(window.MaisonAssets?.idleBlaze)
      .then(() => {
        api = window.MaisonIdleBlaze.init({ startImmediately: true });
        handedOff = true;
        clearIdleTimer();
        return api;
      })
      .catch(() => {
        loading = null;
        return null;
      });
  }
  return loading;
}

function scheduleIdle() {
  clearIdleTimer();
  if (handedOff || !enabled || isBlockedHost()) return;
  idleTimer = window.setTimeout(() => {
    idleTimer = 0;
    handOff();
  }, IDLE_BLAZE_MS);
}

function onActivity() {
  if (handedOff) return;
  if (document.documentElement.dataset.mtRouteBound === 'busy') return;
  clearIdleTimer();
  scheduleIdle();
}

function bindActivity() {
  for (const type of ACTIVITY_EVENTS) {
    window.addEventListener(type, onActivity, { passive: true, capture: true });
  }
  document.addEventListener('visibilitychange', () => {
    if (handedOff) return;
    if (document.visibilityState === 'hidden') {
      clearIdleTimer();
    } else {
      scheduleIdle();
    }
  });
}

export function initIdleBlazeLoader() {
  if (started) {
    return facade;
  }
  started = true;
  bindActivity();
  document.addEventListener('maison:page-leave', () => {
    if (handedOff) return;
    clearIdleTimer();
  });
  document.addEventListener('maison:page-enter', () => {
    if (handedOff) return;
    scheduleIdle();
  });
  document.addEventListener('maison:reduced-motion', (event) => {
    if (event.detail?.reduced) {
      clearIdleTimer();
      api?.disable?.();
      api?.destroy?.();
      return;
    }
    if (!handedOff) scheduleIdle();
  });
  scheduleIdle();
  return facade;
}

const facade = {
  enable() {
    enabled = true;
    try {
      localStorage.removeItem(IDLE_BLAZE_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    delete document.documentElement.dataset.mtIdleBlaze;
    api?.enable?.();
    if (!handedOff) scheduleIdle();
  },
  disable() {
    enabled = false;
    try {
      localStorage.setItem(IDLE_BLAZE_STORAGE_KEY, 'off');
    } catch {
      /* ignore */
    }
    document.documentElement.dataset.mtIdleBlaze = 'off';
    clearIdleTimer();
    api?.disable?.();
    api?.destroy?.();
  },
  destroy() {
    clearIdleTimer();
    api?.destroy?.();
  },
  isActive() {
    return Boolean(api?.isActive?.());
  },
};

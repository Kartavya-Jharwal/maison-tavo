/**
 * Time-bound idle Blaze: after 90s with no activity, show a bottom fire overlay.
 * First frame is a CSS underlay; the WebGPU canvas fades in only after paint.
 * Activity fades the host out and tears GPU work down. Shared device via acquireGpu.
 *
 * Bundled as assets/maison-idle-blaze.js and loaded on demand by idle-blaze-loader.
 */
import { createBlaze, type BlazeInstance } from './blaze';
import { supportsWebGPU } from './shared';

export const IDLE_BLAZE_MS = 90_000;
export const IDLE_BLAZE_FADE_OUT_MS = 1600;
export const IDLE_BLAZE_FADE_IN_MS = 900;
export const IDLE_BLAZE_STORAGE_KEY = 'mt-idle-blaze';

const ACTIVITY_EVENTS = [
  'pointerdown',
  'pointermove',
  'keydown',
  'wheel',
  'scroll',
  'touchstart',
  'touchmove',
] as const;

const BLOCKED_PATH = /\/(checkout|account|challenge|discount|apps|tools)(\/|$)/;
const PAINT_WATCHDOG_MS = 4000;

type IdleBlazeApi = {
  enable: () => void;
  disable: () => void;
  destroy: () => void;
  isActive: () => boolean;
};

type InitOptions = {
  /** When loaded after the runtime idle timer already elapsed, start immediately. */
  startImmediately?: boolean;
};

let started = false;
let enabled = true;
let idleTimer = 0;
let fadeTimer = 0;
let paintWatchdog = 0;
let host: HTMLElement | null = null;
let blaze: BlazeInstance | null = null;
let active = false;
let fading = false;
let activityBound = false;

function motionReduced(): boolean {
  const flag = document.documentElement.dataset.reducedMotion;
  if (flag === 'true') return true;
  if (flag === 'false') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function storageDisabled(): boolean {
  try {
    const v = localStorage.getItem(IDLE_BLAZE_STORAGE_KEY);
    return v === 'off' || v === '0' || v === 'false';
  } catch {
    return false;
  }
}

function datasetDisabled(): boolean {
  return document.documentElement.dataset.mtIdleBlaze === 'off';
}

function isBlockedHost(): boolean {
  if (!enabled || datasetDisabled() || storageDisabled()) return true;
  if (motionReduced()) return true;
  if (!supportsWebGPU()) return true;
  if (BLOCKED_PATH.test(location.pathname)) return true;

  const main = document.getElementById('MainContent');
  const template = main?.dataset.template || '';
  if (/password/i.test(template)) return true;
  if (document.body.classList.contains('password')) return true;
  if (document.querySelector('form#login_form, form[action*="/password"]')) return true;

  // Heat-page FlameWrap owns the heavy capture path; idle overlay stays off there.
  if (document.querySelector('[data-mt-flame-wrap], [data-mt-heat-blaze], [data-mt-no-idle-blaze]')) {
    return true;
  }

  return false;
}

function mountRoot(): HTMLElement | null {
  return (
    document.querySelector<HTMLElement>('.page-wrapper') ||
    document.getElementById('MainContent') ||
    document.body
  );
}

function clearIdleTimer() {
  if (idleTimer) {
    window.clearTimeout(idleTimer);
    idleTimer = 0;
  }
}

function clearFadeTimer() {
  if (fadeTimer) {
    window.clearTimeout(fadeTimer);
    fadeTimer = 0;
  }
}

function clearPaintWatchdog() {
  if (paintWatchdog) {
    window.clearTimeout(paintWatchdog);
    paintWatchdog = 0;
  }
}

function destroyEffect() {
  clearPaintWatchdog();
  clearFadeTimer();
  blaze?.destroy();
  blaze = null;
  if (host) {
    host.remove();
    host = null;
  }
  active = false;
  fading = false;
}

function scheduleIdle() {
  clearIdleTimer();
  if (!enabled || isBlockedHost()) return;
  idleTimer = window.setTimeout(() => {
    idleTimer = 0;
    startEffect();
  }, IDLE_BLAZE_MS);
}

function startEffect() {
  if (active || fading || isBlockedHost()) return;

  const root = mountRoot();
  if (!root) return;

  const el = document.createElement('div');
  el.className = 'mt-idle-blaze';
  el.setAttribute('aria-hidden', 'true');
  el.dataset.mtIdleBlazeHost = 'true';

  // CSS underlay = first frame (never a blank canvas over content).
  const underlay = document.createElement('div');
  underlay.className = 'mt-idle-blaze__underlay';

  const output = document.createElement('canvas');
  output.className = 'mt-idle-blaze__output';

  // Overlay-only: content is NOT inside source → no html-in-canvas capture.
  const source = document.createElement('canvas');
  source.className = 'mt-idle-blaze__source';
  source.width = 1;
  source.height = 1;
  source.setAttribute('aria-hidden', 'true');

  const content = document.createElement('div');
  content.className = 'mt-idle-blaze__content';

  el.append(underlay, output, source, content);
  root.appendChild(el);
  host = el;

  // Reveal underlay immediately (HTML/CSS first frame) while GPU inits.
  requestAnimationFrame(() => {
    el.classList.add('is-active');
  });

  active = true;

  const instance = createBlaze(
    { source, content, output },
    {
      height: 0.4,
      distortion: 0,
      distortionScale: 0.5,
      speed: 0.85,
      sparks: 0.32,
      sparkDensity: 1.35,
      sparkSize: 0.9,
      layers: 3,
      smoke: 0.38,
      glow: 1.05,
      sparkColor: [1, 0.38, 0.06],
      smokeColor: [1, 0.42, 0.12],
      onFirstFrame: () => {
        clearPaintWatchdog();
        if (!host || host !== el) return;
        // Fade canvas in only after first successful paint; underlay yields.
        host.classList.add('is-painted');
      },
    },
  );

  if (!instance) {
    destroyEffect();
    return;
  }

  blaze = instance;

  // If GPU never paints, drop the temporary underlay — no blank canvas left behind.
  paintWatchdog = window.setTimeout(() => {
    paintWatchdog = 0;
    if (host && !host.classList.contains('is-painted')) {
      destroyEffect();
      scheduleIdle();
    }
  }, PAINT_WATCHDOG_MS);
}

function fadeAndTeardown() {
  if (!active || fading) {
    scheduleIdle();
    return;
  }
  fading = true;
  clearPaintWatchdog();
  clearIdleTimer();

  const el = host;
  if (!el) {
    destroyEffect();
    scheduleIdle();
    return;
  }

  el.classList.add('is-fading');
  el.classList.remove('is-active');

  const finish = () => {
    destroyEffect();
    scheduleIdle();
  };

  fadeTimer = window.setTimeout(finish, IDLE_BLAZE_FADE_OUT_MS + 80);
}

function onActivity() {
  if (document.documentElement.dataset.mtRouteBound === 'busy') return;
  clearIdleTimer();
  if (active || fading) {
    fadeAndTeardown();
    return;
  }
  scheduleIdle();
}

function bindActivity() {
  if (activityBound) return;
  activityBound = true;
  for (const type of ACTIVITY_EVENTS) {
    window.addEventListener(type, onActivity, { passive: true, capture: true });
  }
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      clearIdleTimer();
      if (active) fadeAndTeardown();
    } else if (!active && !fading) {
      scheduleIdle();
    }
  });
}

function onPageLeave() {
  clearIdleTimer();
  destroyEffect();
}

function onPageEnter() {
  destroyEffect();
  scheduleIdle();
}

function onMotionPreference(event: Event) {
  const detail = (event as CustomEvent<{ reduced?: boolean }>).detail;
  if (detail?.reduced) {
    clearIdleTimer();
    destroyEffect();
    return;
  }
  scheduleIdle();
}

export function initIdleBlaze(options: InitOptions = {}): IdleBlazeApi {
  if (started) {
    if (options.startImmediately && !active && !fading) {
      startEffect();
    }
    return api;
  }
  started = true;
  bindActivity();
  document.addEventListener('maison:page-leave', onPageLeave);
  document.addEventListener('maison:page-enter', onPageEnter);
  document.addEventListener('maison:reduced-motion', onMotionPreference);
  if (options.startImmediately) {
    startEffect();
  } else {
    scheduleIdle();
  }
  return api;
}

const api: IdleBlazeApi = {
  enable() {
    enabled = true;
    try {
      localStorage.removeItem(IDLE_BLAZE_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    delete document.documentElement.dataset.mtIdleBlaze;
    scheduleIdle();
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
    destroyEffect();
  },
  destroy() {
    clearIdleTimer();
    destroyEffect();
  },
  isActive() {
    return active && !fading;
  },
};

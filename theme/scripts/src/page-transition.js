import barba from '@barba/core';
import gsap from 'gsap';
import {
  pauseHorizonScroll,
  refreshHorizonScroll,
  resetHorizonScroll,
  resumeHorizonScroll,
  scrollHorizonTo,
} from './horizon-scroll.js';

/**
 * Real documents, animated between rooms.
 * Barba swaps #MainContent only. Header, footer, cart, and checkout stay put.
 * Checkout, account, discount, and non-http links are left to the browser.
 *
 * Fail-safe: leave covers the bronze veil and pauses Lenis. If the request,
 * enter animation, or Barba lifecycle aborts, releaseTransition() always
 * clears covering state so the storefront cannot stay blocked.
 */

const BLOCKED = /\/(checkout|account|challenge|discount|apps|tools)(\/|$)/;
/**
 * Hard ceiling past Barba request timeout + leave/enter motion + asset adopt.
 * Re-armed at enter so a slow fetch does not false-trigger mid-animation.
 */
const TRANSITION_WATCHDOG_MS = 14000;
const ENTER_WATCHDOG_MS = 8000;

let started = false;
let watchdogId = 0;
let releasing = false;

function reduced() {
  return document.documentElement.dataset.reducedMotion === 'true';
}

function shouldPrevent({ el, event, href }) {
  if (reduced()) return true;
  if (!(el instanceof HTMLAnchorElement)) return true;
  if (el.closest('[data-barba-prevent]')) return true;
  if (el.hasAttribute('download') || el.target === '_blank') return true;
  const click = event instanceof MouseEvent ? event : null;
  if (click && (click.button !== 0 || click.metaKey || click.ctrlKey || click.shiftKey || click.altKey)) return true;

  let url;
  try {
    url = new URL(href, location.href);
  } catch {
    return true;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return true;
  if (url.origin !== location.origin) return true;
  if (BLOCKED.test(url.pathname)) return true;
  const here = location.pathname.replace(/\/$/, '') || '/';
  const next = url.pathname.replace(/\/$/, '') || '/';
  if (next === here && url.search === location.search) return true;
  return false;
}

function closeDrawers() {
  document.querySelectorAll('theme-drawer[open]').forEach((drawer) => {
    if (typeof drawer.close === 'function') drawer.close();
  });
}

const adoptedStyles = new Set();

function styleKey(style) {
  const text = style.textContent.trim();
  return text && `${style.media}\n${text}`;
}

function rememberStyles(root) {
  root.querySelectorAll('style').forEach((style) => {
    const key = styleKey(style);
    if (key) adoptedStyles.add(key);
  });
}

function srcPath(src) {
  try {
    return new URL(src, location.href).pathname;
  } catch {
    return '';
  }
}

function needsDocumentNavigation(container) {
  if (!container || container.querySelector('[data-mt-document-navigation]')) return true;

  return [...container.querySelectorAll('script')].some((script) => {
    const type = script.type.trim().toLowerCase();
    if (type === 'module') return !script.hasAttribute('src');
    return !type || /^(?:text|application)\/(?:java|ecma)script$/.test(type);
  });
}

async function adoptAssets(doc, incomingContainer) {
  const title = doc.querySelector('title')?.textContent;
  if (title) document.title = title;

  const canonical = doc.querySelector('link[rel="canonical"]')?.href;
  const currentCanonical = document.querySelector('link[rel="canonical"]');
  if (canonical && currentCanonical) currentCanonical.href = canonical;

  const loads = [];
  const stylesheetKey = (link) => `${link.href} ${link.media}`;
  const present = new Set([...document.querySelectorAll('link[rel="stylesheet"]')].map(stylesheetKey));
  doc.head.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
    const key = stylesheetKey(link);
    if (!link.href || present.has(key)) return;
    const node = document.importNode(link, false);
    present.add(key);
    loads.push(
      new Promise((resolve) => {
        node.addEventListener('load', resolve, { once: true });
        node.addEventListener('error', resolve, { once: true });
      }),
    );
    document.head.appendChild(node);
  });

  doc.head.querySelectorAll('style').forEach((style) => {
    const key = styleKey(style);
    if (!key || adoptedStyles.has(key)) return;
    adoptedStyles.add(key);
    document.head.appendChild(document.importNode(style, true));
  });

  // Barba has already inserted the incoming container. Its parsed scripts are inert.
  const loaded = new Set(
    [...document.scripts]
      .filter((script) => !incomingContainer.contains(script))
      .map((script) => srcPath(script.src))
      .filter(Boolean),
  );
  doc.querySelectorAll('script[src][type="module"]').forEach((script) => {
    const path = srcPath(script.src);
    if (!path || loaded.has(path)) return;
    if (!/\/assets\//.test(path)) return;
    if (/trekkie|monorail|web-pixel|perf-kit/i.test(path)) return;
    const node = document.createElement('script');
    node.src = script.src;
    node.type = 'module';
    loads.push(
      new Promise((resolve) => {
        node.addEventListener('load', resolve, { once: true });
        node.addEventListener('error', resolve, { once: true });
      }),
    );
    document.head.appendChild(node);
    loaded.add(path);
  });

  await Promise.race([Promise.all(loads), new Promise((resolve) => setTimeout(resolve, 1800))]);
}

function isPassword(html) {
  return /action=["']\/password["']/.test(html) || html.includes('id="password"');
}

function markCurrent() {
  const path = location.pathname.replace(/\/$/, '') || '/';
  document.querySelectorAll('#header-group a[href], footer a[href]').forEach((link) => {
    let next = '';
    try {
      next = new URL(link.href).pathname.replace(/\/$/, '') || '/';
    } catch {
      return;
    }
    if (next === path) link.setAttribute('aria-current', 'page');
    else if (link.getAttribute('aria-current') === 'page') link.removeAttribute('aria-current');
  });
}

async function rememberProduct() {
  const main = document.getElementById('MainContent');
  if (!main?.dataset.template?.startsWith('product')) return;
  const id = main.querySelector('sticky-add-to-cart')?.dataset.productId;
  if (!id) return;
  const map = document.querySelector('script[type="importmap"]');
  if (!map) return;
  try {
    const specifier = JSON.parse(map.textContent).imports?.['@theme/recently-viewed-products'];
    if (!specifier) return;
    const mod = await import(specifier);
    mod.RecentlyViewed?.addProduct(id);
  } catch {
    /* The product form still records nothing if the module is unavailable. */
  }
}

function clearWatchdog() {
  if (!watchdogId) return;
  window.clearTimeout(watchdogId);
  watchdogId = 0;
}

function armWatchdog(release, ms = TRANSITION_WATCHDOG_MS) {
  clearWatchdog();
  watchdogId = window.setTimeout(() => {
    watchdogId = 0;
    release('watchdog');
  }, ms);
}

/**
 * Undo leave/enter side effects so the UI cannot stay covered or inert.
 * Safe to call multiple times; used on success, error, abort, and watchdog.
 */
function releaseTransition(veil, reason = 'ok') {
  if (releasing) return;
  releasing = true;
  clearWatchdog();
  try {
    gsap.killTweensOf(veil);
    gsap.set(veil, { yPercent: -100 });
    veil.classList.remove('is-covering');
    document.documentElement.classList.remove('mt-transitioning');

    const main = document.getElementById('MainContent');
    if (main) {
      gsap.killTweensOf(main);
      gsap.set(main, { clearProps: 'transform,opacity,visibility' });
      main.removeAttribute('aria-busy');
      if (main.style) {
        main.style.removeProperty('opacity');
        main.style.removeProperty('visibility');
        main.style.removeProperty('transform');
      }
    }

    document.querySelectorAll('[aria-busy="true"]').forEach((node) => {
      if (node.id === 'MainContent' || node.hasAttribute('data-barba')) {
        node.removeAttribute('aria-busy');
      }
    });

    resumeHorizonScroll();

    if (reason !== 'ok' && typeof console !== 'undefined') {
      console.warn(`[maison] page transition released (${reason})`);
    }
  } finally {
    releasing = false;
  }
}

export function initPageTransitions() {
  if (started || window.Shopify?.designMode) return;
  const wrapper = document.querySelector('[data-barba="wrapper"]');
  const container = document.querySelector('[data-barba="container"]');
  const veil = document.querySelector('[data-mt-veil]');
  if (!wrapper || !container || !veil) return;
  started = true;
  rememberStyles(document.head);

  const release = (reason) => releaseTransition(veil, reason);

  gsap.set(veil, { yPercent: -100 });
  veil.addEventListener(
    'wheel',
    (event) => {
      if (veil.classList.contains('is-covering')) event.preventDefault();
    },
    { passive: false },
  );

  const status = document.querySelector('[data-mt-route-status]');
  let navigatingDocument = false;

  try {
    barba.init({
      timeout: 8000,
      cacheIgnore: true,
      preventRunning: true,
      prevent: shouldPrevent,
      transitions: [
        {
          name: 'bronze-sheet',
          async leave({ current }) {
            armWatchdog(release);
            document.documentElement.classList.add('mt-transitioning');
            veil.classList.add('is-covering');
            const leaving = current.container || document.getElementById('MainContent');
            leaving?.setAttribute('aria-busy', 'true');
            closeDrawers();
            pauseHorizonScroll();
            try {
              if (reduced()) {
                document.dispatchEvent(new CustomEvent('maison:page-leave'));
                return;
              }
              await gsap
                .timeline({ defaults: { ease: 'power3.inOut' } })
                .to(leaving, { y: 18, autoAlpha: 0.35, duration: 0.28 }, 0)
                .to(veil, { yPercent: 0, duration: 0.42 }, 0.04);
              document.dispatchEvent(new CustomEvent('maison:page-leave'));
            } catch (error) {
              release('leave');
              throw error;
            }
          },
          async enter(data) {
            armWatchdog(release, ENTER_WATCHDOG_MS);
            try {
              const html = data.next.html || '';
              const doc = new DOMParser().parseFromString(html, 'text/html');
              if (isPassword(html) || needsDocumentNavigation(data.next.container)) {
                navigatingDocument = true;
                release('ok');
                // Barba has already updated history for this navigation.
                window.location.replace(data.next.url.href);
                return;
              }
              await adoptAssets(doc, data.next.container);
              if (data.next.url.hash) {
                const target = document.querySelector(data.next.url.hash);
                if (target) scrollHorizonTo(target, true);
                else resetHorizonScroll();
              } else {
                resetHorizonScroll();
              }
              const arriving = data.next.container || document.getElementById('MainContent');
              if (reduced()) {
                gsap.set(arriving, { clearProps: 'transform,opacity,visibility' });
                release('reduced');
                return;
              }
              gsap.set(arriving, { y: 22, autoAlpha: 0.2, scale: 0.992 });
              await gsap
                .timeline({ defaults: { ease: 'power3.out' } })
                .to(veil, { yPercent: -100, duration: 0.48 }, 0)
                .to(arriving, { y: 0, autoAlpha: 1, scale: 1, duration: 0.55 }, 0.12);
              release('ok');
            } catch (error) {
              release('enter');
              throw error;
            }
          },
        },
      ],
    });
  } catch {
    started = false;
    release('init');
    return;
  }

  // Wrap go so request/timeout failures after leave always clear the veil.
  const go = barba.go.bind(barba);
  barba.go = async (...args) => {
    try {
      return await go(...args);
    } catch (error) {
      release('go');
      throw error;
    }
  };

  barba.hooks.after(() => {
    if (navigatingDocument) return;
    release('ok');
    const main = document.getElementById('MainContent');
    if (main) {
      main.tabIndex = -1;
      main.focus({ preventScroll: true });
    }
    if (status) status.textContent = document.title;
    markCurrent();
    refreshHorizonScroll(main || document);
    document.dispatchEvent(new CustomEvent('maison:page-enter', { detail: { url: location.href } }));
    rememberProduct();
  });

  window.addEventListener('unhandledrejection', (event) => {
    const message = String(event.reason?.message || event.reason || '');
    if (/barba|transition|timeout|fetch/i.test(message) && document.documentElement.classList.contains('mt-transitioning')) {
      release('rejection');
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (
      document.visibilityState === 'visible' &&
      document.documentElement.classList.contains('mt-transitioning') &&
      veil.classList.contains('is-covering') &&
      !watchdogId
    ) {
      armWatchdog(release, ENTER_WATCHDOG_MS);
    }
  });
}

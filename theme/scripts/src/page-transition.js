import barba from '@barba/core';
import gsap from 'gsap';
import { pauseHorizonScroll, refreshHorizonScroll, resetHorizonScroll, scrollHorizonTo } from './horizon-scroll.js';

/**
 * Real documents, animated between rooms.
 * Barba swaps #MainContent only. Header, footer, cart, and checkout stay put.
 * Checkout, account, discount, and non-http links are left to the browser.
 */

const BLOCKED = /\/(checkout|account|challenge|discount|apps|tools)(\/|$)/;

let started = false;

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

function styleKey(text) {
  return `${text.length}:${text.slice(0, 64)}:${text.slice(-64)}`;
}

function rememberStyles(root) {
  root.querySelectorAll('style').forEach((style) => {
    const text = style.textContent || '';
    if (text.trim()) adoptedStyles.add(styleKey(text));
  });
}

function srcPath(src) {
  try {
    return new URL(src, location.href).pathname;
  } catch {
    return '';
  }
}

async function adoptAssets(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const title = doc.querySelector('title')?.textContent;
  if (title) document.title = title;

  const canonical = doc.querySelector('link[rel="canonical"]')?.href;
  const currentCanonical = document.querySelector('link[rel="canonical"]');
  if (canonical && currentCanonical) currentCanonical.href = canonical;

  const loads = [];
  const present = new Set([...document.querySelectorAll('link[rel="stylesheet"]')].map((link) => link.href));
  doc.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
    if (!link.href || present.has(link.href)) return;
    const node = document.createElement('link');
    node.rel = 'stylesheet';
    node.href = link.href;
    loads.push(
      new Promise((resolve) => {
        node.addEventListener('load', resolve, { once: true });
        node.addEventListener('error', resolve, { once: true });
      }),
    );
    document.head.appendChild(node);
  });

  doc.querySelectorAll('style').forEach((style) => {
    const text = style.textContent || '';
    if (!text.trim()) return;
    const key = styleKey(text);
    if (adoptedStyles.has(key)) return;
    adoptedStyles.add(key);
    const node = document.createElement('style');
    node.textContent = text;
    document.head.appendChild(node);
  });

  const loaded = new Set([...document.scripts].map((script) => srcPath(script.src)).filter(Boolean));
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
  return html;
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

export function initPageTransitions() {
  if (started || window.Shopify?.designMode) return;
  const wrapper = document.querySelector('[data-barba="wrapper"]');
  const container = document.querySelector('[data-barba="container"]');
  const veil = document.querySelector('[data-mt-veil]');
  if (!wrapper || !container || !veil) return;
  started = true;
  rememberStyles(document);

  gsap.set(veil, { yPercent: -100 });
  veil.addEventListener(
    'wheel',
    (event) => {
      if (veil.classList.contains('is-covering')) event.preventDefault();
    },
    { passive: false },
  );

  const status = document.querySelector('[data-mt-route-status]');

  try {
    barba.init({
    timeout: 12000,
    cacheIgnore: true,
    preventRunning: true,
    prevent: shouldPrevent,
    transitions: [
      {
        name: 'bronze-sheet',
        async leave() {
          document.documentElement.classList.add('mt-transitioning');
          veil.classList.add('is-covering');
          document.getElementById('MainContent')?.setAttribute('aria-busy', 'true');
          closeDrawers();
          pauseHorizonScroll();
          if (reduced()) {
            document.dispatchEvent(new CustomEvent('maison:page-leave'));
            return;
          }
          await gsap.to(veil, { yPercent: 0, duration: 0.42, ease: 'power3.inOut' });
          document.dispatchEvent(new CustomEvent('maison:page-leave'));
        },
        async enter(data) {
          const html = data.next.html || '';
          if (isPassword(html)) {
            window.location.assign(data.next.url.href);
            return;
          }
          await adoptAssets(html);
          if (data.next.url.hash) {
            const target = document.querySelector(data.next.url.hash);
            if (target) scrollHorizonTo(target, true);
            else resetHorizonScroll();
          } else {
            resetHorizonScroll();
          }
          if (!reduced()) await gsap.to(veil, { yPercent: -100, duration: 0.48, ease: 'power3.out' });
          veil.classList.remove('is-covering');
          document.documentElement.classList.remove('mt-transitioning');
        },
      },
    ],
    });
  } catch {
    started = false;
    veil.classList.remove('is-covering');
    document.documentElement.classList.remove('mt-transitioning');
    return;
  }

  barba.hooks.after(() => {
    const main = document.getElementById('MainContent');
    if (main) {
      main.removeAttribute('aria-busy');
      main.tabIndex = -1;
      main.focus({ preventScroll: true });
    }
    if (status) status.textContent = document.title;
    markCurrent();
    refreshHorizonScroll(main || document);
    document.dispatchEvent(new CustomEvent('maison:page-enter', { detail: { url: location.href } }));
    rememberProduct();
  });
}

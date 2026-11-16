import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

/**
 * Horizon scroll contract (assets/scroll-container.js):
 *   below --brand-breakpoint-xl (990px) the document scrolls, so the mobile
 *   address bar can collapse.
 *   at that breakpoint and above, `.page-wrapper` is the only scroller
 *   (`overflow-y: auto`, document locked).
 * Lenis 1.3 writes that element's scrollTop. It never translates content,
 * so sticky header, drawers, and Horizon's own scroll restoration keep working.
 *
 * Input, matched to the grand plan:
 *   touch / coarse pointer, or below xl: native scroll, Lenis not created
 *   trackpad: native 1:1 (smoothWheel off)
 *   mouse wheel: Lenis lerp 0.08, driven by one GSAP ticker
 *   Tab and arrows: Lenis reset, so focus jumps instantly
 */

const KEYS = new Set([
  'Tab',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'PageUp',
  'PageDown',
  'Home',
  'End',
  ' ',
]);

function readLength(name, fallback) {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
  const probe = document.createElement('div');
  probe.style.cssText = `position:absolute;visibility:hidden;width:${raw}`;
  document.documentElement.appendChild(probe);
  const px = probe.getBoundingClientRect().width;
  probe.remove();
  return px || parseFloat(fallback);
}

let lenis = null;
let scroller = null;
let wheelSamples = [];

function wrapper() {
  return document.querySelector('.page-wrapper');
}

function classifyWheel(event) {
  if (event.deltaMode !== 0) return 'mouse';
  const distance = Math.abs(event.deltaY);
  if (!distance) return null;
  wheelSamples.push(distance);
  if (wheelSamples.length > 6) wheelSamples.shift();
  const average = wheelSamples.reduce((sum, value) => sum + value, 0) / wheelSamples.length;
  const fractional = wheelSamples.some((value) => Math.round(value) !== value);
  return average < 50 || fractional ? 'trackpad' : 'mouse';
}

function setMode(kind) {
  const root = document.documentElement;
  // Keep reveal hooks on [data-mt-scroll]; input mode uses a separate attribute.
  root.dataset.mtScrollInput = kind;
  if (root.getAttribute('data-mt-scroll') === 'document'
    || root.getAttribute('data-mt-scroll') === 'mouse'
    || root.getAttribute('data-mt-scroll') === 'trackpad'
    || root.getAttribute('data-mt-scroll') === 'keyboard'
    || root.getAttribute('data-mt-scroll') === 'pointer') {
    root.removeAttribute('data-mt-scroll');
  }
  if (!lenis) return;
  if (kind === 'mouse') {
    lenis.options.smoothWheel = true;
    lenis.options.lerp = 0.08;
  } else {
    lenis.options.smoothWheel = false;
    lenis.options.lerp = 1;
    if (kind === 'keyboard') lenis.reset();
  }
}

function motionAllowed() {
  return document.documentElement.dataset.reducedMotion !== 'true';
}

function bindMotion(root = document) {
  if (!motionAllowed()) return;
  root.querySelectorAll('[data-mt-scroll]:not(html):not([data-mt-bound])').forEach((el) => {
    el.dataset.mtBound = 'true';
    gsap.from(el, {
      y: scroller ? 32 : 16,
      opacity: 0,
      duration: 0.9,
      ease: 'power3.out',
      clearProps: 'opacity,transform',
      scrollTrigger: {
        trigger: el,
        scroller: scroller || undefined,
        start: 'top 90%',
        once: true,
      },
    });
  });

  root.querySelectorAll('.ghost-word, [data-parallax-drift]').forEach((el, index) => {
    if (el.dataset.mtBound) return;
    el.dataset.mtBound = 'true';
    const direction = index % 2 === 0 ? -1 : 1;
    gsap.fromTo(
      el,
      { xPercent: direction * 3.5 },
      {
        xPercent: direction * -3.5,
        ease: 'none',
        scrollTrigger: {
          trigger: el,
          scroller: scroller || undefined,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      },
    );
  });
}

function mountLenis(element) {
  lenis = new Lenis({
    wrapper: element,
    content: element,
    eventsTarget: element,
    lerp: 0.08,
    smoothWheel: false,
    syncTouch: false,
    autoRaf: false,
    anchors: true,
    allowNestedScroll: true,
    stopInertiaOnNavigate: true,
    respectReducedMotion: true,
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(onTick);
  gsap.ticker.lagSmoothing(0);
  element.addEventListener('wheel', onWheel, { passive: true });
  setMode('trackpad');
}

function onTick(time) {
  lenis?.raf(time * 1000);
}

function unmountLenis() {
  const element = lenis?.options?.wrapper;
  if (element instanceof Element) element.removeEventListener('wheel', onWheel);
  gsap.ticker.remove(onTick);
  lenis?.destroy();
  lenis = null;
}

function onWheel(event) {
  const kind = classifyWheel(event);
  if (kind) setMode(kind);
}

function onKey(event) {
  if (!lenis || !KEYS.has(event.key)) return;
  setMode('keyboard');
}

export function initHorizonScroll() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.Shopify?.designMode) return;

  const xl = readLength('--brand-breakpoint-xl', '990px');
  const desktop = window.matchMedia(`(min-width: ${xl}px)`);
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)');

  const apply = () => {
    unmountLenis();
    scroller = null;
    document.querySelectorAll('[data-mt-bound]').forEach((el) => {
      delete el.dataset.mtBound;
    });
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill());

    const element = wrapper();
    const smooth = desktop.matches && fine.matches && element;
    if (smooth) {
      scroller = element;
      mountLenis(element);
    } else {
      document.documentElement.dataset.mtScrollInput = desktop.matches ? 'pointer' : 'document';
    }
    bindMotion(document);
    ScrollTrigger.refresh();
  };

  document.addEventListener('keydown', onKey, true);
  apply();
  desktop.addEventListener('change', apply);
  fine.addEventListener('change', apply);

  document.addEventListener('shopify:section:load', (event) => {
    bindMotion(event.target);
    lenis?.resize();
    ScrollTrigger.refresh();
  });
}

export function pauseHorizonScroll() {
  lenis?.stop();
}

export function resetHorizonScroll() {
  const element = wrapper();
  if (element) element.scrollTop = 0;
  if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
  window.scrollTo(0, 0);
}

export function scrollHorizonTo(target, immediate = false) {
  if (!(target instanceof Element)) return;
  if (lenis) {
    lenis.scrollTo(target, { offset: -24, immediate, force: true });
    return;
  }
  target.scrollIntoView({ block: 'start' });
}

export function refreshHorizonScroll(root = document) {
  ScrollTrigger.getAll().forEach((trigger) => {
    if (trigger.trigger instanceof Element && !trigger.trigger.isConnected) trigger.kill();
  });
  bindMotion(root);
  lenis?.resize();
  lenis?.start();
  ScrollTrigger.refresh();
}

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger, SplitText);

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
 *
 * Chapter reveals (`data-mt-scroll`):
 *   rise|""     soft single rise
 *   chapter     staggered children (kicker → title → lede)
 *   stagger     staggered [data-mt-scroll-item] (or direct children)
 *   kinetic     Instrument Serif word reveal via GSAP SplitText (aria auto)
 *   coda        quiet scale/fade for the footer wordmark
 *   image       soft scale settle for hero / media frames
 *   beat        compact rise+scale for CTA clusters and forms
 * Optional `data-mt-when="load"` plays on mount (hero) instead of scroll.
 * Optional `data-mt-scrub` on media for light ScrollTrigger parallax (no pin).
 * Optional `data-mt-chapter` for quiet scrubbed section beats.
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

const MODE_VALUES = new Set([
  '',
  'rise',
  'chapter',
  'stagger',
  'kinetic',
  'coda',
  'image',
  'beat',
  'true',
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
/** @type {Set<InstanceType<typeof SplitText>>} */
const splits = new Set();
let reducedMotionListener = null;

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
  if (
    root.getAttribute('data-mt-scroll') === 'document' ||
    root.getAttribute('data-mt-scroll') === 'mouse' ||
    root.getAttribute('data-mt-scroll') === 'trackpad' ||
    root.getAttribute('data-mt-scroll') === 'keyboard' ||
    root.getAttribute('data-mt-scroll') === 'pointer'
  ) {
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
  if (document.documentElement.dataset.reducedMotion === 'true') return false;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  return true;
}

function scrollRoot() {
  return scroller || undefined;
}

function markBound(el) {
  el.dataset.mtBound = 'true';
}

function clearBoundFlags(scope = document) {
  scope.querySelectorAll('[data-mt-bound]').forEach((el) => {
    delete el.dataset.mtBound;
  });
}

function revertSplits() {
  splits.forEach((split) => {
    try {
      split.revert();
    } catch {
      /* already gone with Barba swap */
    }
  });
  splits.clear();
}

function revealStart(el, start = 'top 88%') {
  return {
    trigger: el,
    scroller: scrollRoot(),
    start,
    once: true,
  };
}

function whenLoad(el) {
  return el.getAttribute('data-mt-when') === 'load';
}

function modeOf(el) {
  const raw = (el.getAttribute('data-mt-scroll') || '').trim().toLowerCase();
  if (!raw || raw === 'true') return 'rise';
  return MODE_VALUES.has(raw) ? raw || 'rise' : 'rise';
}

function chapterParts(el) {
  return [...el.children].filter(
    (child) => child.nodeType === 1 && !child.hasAttribute('data-mt-scroll'),
  );
}

function staggerItems(el) {
  const marked = el.querySelectorAll(':scope > [data-mt-scroll-item]');
  if (marked.length) return [...marked];
  const nested = el.querySelectorAll('[data-mt-scroll-item]');
  if (nested.length) return [...nested];
  return [...el.children].filter((child) => child.nodeType === 1);
}

function afterFonts(run) {
  if (document.fonts?.ready) {
    document.fonts.ready.then(run).catch(run);
    return;
  }
  run();
}

function bindRise(el) {
  markBound(el);
  const tween = {
    y: scroller ? 28 : 14,
    opacity: 0,
    duration: 0.82,
    ease: 'power3.out',
    immediateRender: false,
    clearProps: 'opacity,visibility,transform',
  };
  if (whenLoad(el)) {
    gsap.from(el, tween);
    return;
  }
  gsap.from(el, {
    ...tween,
    scrollTrigger: revealStart(el),
  });
}

function bindChapter(el) {
  markBound(el);
  const parts = chapterParts(el);
  if (!parts.length) {
    bindRise(el);
    return;
  }

  const play = () => {
    gsap.fromTo(
      parts,
      { y: 18, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.72,
        ease: 'power3.out',
        stagger: 0.11,
        clearProps: 'opacity,visibility,transform',
      },
    );
  };

  if (whenLoad(el)) {
    play();
    return;
  }

  gsap.set(parts, { opacity: 0, y: 18 });
  ScrollTrigger.create({
    ...revealStart(el, 'top 86%'),
    onEnter: play,
  });
}

function bindStagger(el) {
  markBound(el);
  const items = staggerItems(el);
  if (!items.length) {
    bindRise(el);
    return;
  }

  const play = () => {
    gsap.fromTo(
      items,
      { y: scroller ? 22 : 12, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.7,
        ease: 'power3.out',
        stagger: 0.08,
        clearProps: 'opacity,visibility,transform',
      },
    );
  };

  if (whenLoad(el)) {
    play();
    return;
  }

  gsap.set(items, { opacity: 0, y: scroller ? 22 : 12 });
  ScrollTrigger.create({
    ...revealStart(el, 'top 90%'),
    onEnter: play,
  });
}

function bindKinetic(el) {
  markBound(el);
  gsap.set(el, { opacity: 0 });

  const play = () => {
    if (el.dataset.mtKineticDone === 'true') return;
    el.dataset.mtKineticDone = 'true';
    gsap.set(el, { opacity: 1 });

    const split = SplitText.create(el, {
      type: 'words',
      aria: 'auto',
      tag: 'span',
      wordsClass: 'mt-word',
      mask: 'words',
    });
    splits.add(split);

    gsap.from(split.words, {
      yPercent: 110,
      opacity: 0,
      duration: 0.92,
      ease: 'power3.out',
      stagger: 0.05,
      clearProps: 'opacity,visibility,transform',
    });
  };

  if (whenLoad(el)) {
    afterFonts(play);
    return;
  }

  ScrollTrigger.create({
    ...revealStart(el, 'top 90%'),
    onEnter: () => afterFonts(play),
  });
}

function bindCoda(el) {
  markBound(el);
  gsap.from(el, {
    opacity: 0,
    scale: 0.96,
    y: 12,
    duration: 1.05,
    ease: 'power2.out',
    immediateRender: false,
    clearProps: 'opacity,visibility,transform',
    scrollTrigger: revealStart(el, 'top 95%'),
  });
}

function bindImage(el) {
  markBound(el);
  const media = el.querySelector('img, .maison-hero__img, [data-mt-media]') || el;
  const tween = {
    scale: 1.06,
    opacity: 0.35,
    duration: 1.05,
    ease: 'power2.out',
    immediateRender: false,
    clearProps: 'opacity,visibility,transform',
    transformOrigin: '50% 60%',
  };
  if (whenLoad(el)) {
    gsap.from(media, tween);
    return;
  }
  gsap.from(media, {
    ...tween,
    scrollTrigger: revealStart(el, 'top 92%'),
  });
}

function bindBeat(el) {
  markBound(el);
  const parts = chapterParts(el);
  const targets = parts.length ? parts : [el];
  const play = () => {
    gsap.fromTo(
      targets,
      { y: 14, opacity: 0, scale: 0.985 },
      {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.62,
        ease: 'power3.out',
        stagger: 0.07,
        clearProps: 'opacity,visibility,transform',
      },
    );
  };
  if (whenLoad(el)) {
    play();
    return;
  }
  gsap.set(targets, { opacity: 0, y: 14, scale: 0.985 });
  ScrollTrigger.create({
    ...revealStart(el, 'top 90%'),
    onEnter: play,
  });
}

function bindOne(el) {
  if (el.dataset.mtBound === 'true') return;
  const mode = modeOf(el);
  switch (mode) {
    case 'chapter':
      bindChapter(el);
      break;
    case 'stagger':
      bindStagger(el);
      break;
    case 'kinetic':
      bindKinetic(el);
      break;
    case 'coda':
      bindCoda(el);
      break;
    case 'image':
      bindImage(el);
      break;
    case 'beat':
      bindBeat(el);
      break;
    default:
      bindRise(el);
  }
}

function bindParallax(root = document) {
  root.querySelectorAll('.ghost-word, [data-parallax-drift]').forEach((el, index) => {
    if (el.dataset.mtBound) return;
    markBound(el);
    const direction = index % 2 === 0 ? -1 : 1;
    gsap.fromTo(
      el,
      { xPercent: direction * 3.5 },
      {
        xPercent: direction * -3.5,
        ease: 'none',
        scrollTrigger: {
          trigger: el,
          scroller: scrollRoot(),
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      },
    );
  });
}

/** Light scrub parallax — no pin, Jakob-safe (content still scrolls normally). */
function bindScrub(root = document) {
  root.querySelectorAll('[data-mt-scrub]:not([data-mt-bound])').forEach((el) => {
    markBound(el);
    const amount = Number(el.getAttribute('data-mt-scrub') || 18);
    const y = Number.isFinite(amount) ? amount : 18;
    // Scrub the marked host itself so image-mode scale on nested media does not fight.
    gsap.fromTo(
      el,
      { y: -y * 0.35 },
      {
        y,
        ease: 'none',
        scrollTrigger: {
          trigger: el,
          scroller: scrollRoot(),
          start: 'top bottom',
          end: 'bottom top',
          scrub: 0.55,
        },
      },
    );
  });
}

/** Section progress beats — quiet opacity/y scrub on chapter markers. */
function bindChapterBeats(root = document) {
  root.querySelectorAll('[data-mt-chapter]:not([data-mt-bound])').forEach((el) => {
    markBound(el);
    gsap.fromTo(
      el,
      { opacity: 0.55, y: 10 },
      {
        opacity: 1,
        y: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: el,
          scroller: scrollRoot(),
          start: 'top 92%',
          end: 'top 48%',
          scrub: 0.4,
        },
      },
    );
  });
}

function bindMotion(root = document) {
  if (!motionAllowed()) return;

  const nodes = [...root.querySelectorAll('[data-mt-scroll]:not(html):not([data-mt-bound])')];
  // Nested kinetic/chapter hooks first so parents can skip owned children.
  nodes
    .sort((a, b) => (a.contains(b) ? 1 : b.contains(a) ? -1 : 0))
    .forEach(bindOne);

  bindParallax(root);
  bindScrub(root);
  bindChapterBeats(root);
}

function tearDownMotion() {
  revertSplits();
  document
    .querySelectorAll(
      '[data-mt-bound], [data-mt-scroll], [data-mt-scroll-item], [data-mt-scrub], [data-mt-chapter]',
    )
    .forEach((el) => {
      gsap.killTweensOf(el);
      gsap.set(el, { clearProps: 'opacity,visibility,transform' });
      [...el.children].forEach((child) => {
        gsap.killTweensOf(child);
        gsap.set(child, { clearProps: 'opacity,visibility,transform' });
      });
    });
  clearBoundFlags();
  document.querySelectorAll('[data-mt-kinetic-done]').forEach((el) => {
    delete el.dataset.mtKineticDone;
  });
  ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
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

function onReducedMotionChange(event) {
  const reduced = Boolean(event?.detail?.reduced);
  if (reduced) {
    unmountLenis();
    scroller = null;
    tearDownMotion();
    document.documentElement.dataset.mtScrollInput = 'document';
    return;
  }
  applyScrollSystem();
}

function applyScrollSystem() {
  unmountLenis();
  scroller = null;
  tearDownMotion();

  if (!motionAllowed()) {
    document.documentElement.dataset.mtScrollInput = 'document';
    return;
  }

  const xl = readLength('--brand-breakpoint-xl', '990px');
  const desktop = window.matchMedia(`(min-width: ${xl}px)`);
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
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
}

export function initHorizonScroll() {
  if (window.Shopify?.designMode) return;

  const xl = readLength('--brand-breakpoint-xl', '990px');
  const desktop = window.matchMedia(`(min-width: ${xl}px)`);
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)');

  document.addEventListener('keydown', onKey, true);
  if (!reducedMotionListener) {
    reducedMotionListener = onReducedMotionChange;
    document.addEventListener('maison:reduced-motion', reducedMotionListener);
  }

  document.addEventListener('shopify:section:load', (event) => {
    if (!motionAllowed()) return;
    bindMotion(event.target);
    lenis?.resize();
    ScrollTrigger.refresh();
  });

  desktop.addEventListener('change', applyScrollSystem);
  fine.addEventListener('change', applyScrollSystem);
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', applyScrollSystem);

  // Still register listeners when reduced-motion starts ON so the footer
  // toggle can re-enable Lenis + chapter reveals without a full reload.
  if (!motionAllowed()) {
    document.documentElement.dataset.mtScrollInput = 'document';
    return;
  }

  applyScrollSystem();
}

export function pauseHorizonScroll() {
  lenis?.stop();
}

export function resumeHorizonScroll() {
  lenis?.start();
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
  splits.forEach((split) => {
    const live = split.elements?.some((node) => node.isConnected);
    if (live) return;
    try {
      split.revert();
    } catch {
      /* swapped out */
    }
    splits.delete(split);
  });
  if (!motionAllowed()) {
    resumeHorizonScroll();
    return;
  }
  bindMotion(root);
  lenis?.resize();
  lenis?.start();
  ScrollTrigger.refresh();
}

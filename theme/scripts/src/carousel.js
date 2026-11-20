import EmblaCarousel from 'embla-carousel';

/**
 * Maison carousel — Embla core + GSAP accents.
 *
 * GSAP is not imported here on purpose: maison-runtime.js already bundles it
 * and exposes `window.gsap`. Importing again would duplicate ~70 KB into this
 * lazy chunk. When the global is missing the carousel still works, just
 * without the accent tweens.
 *
 * Contract:
 *   [data-mt-carousel]                host (section or block wrapper)
 *   [data-mt-carousel-viewport]       Embla viewport (overflow hidden, tabbable)
 *   [data-mt-carousel-track]          Embla container (direct slide parent)
 *   [data-mt-carousel-slide]          slides (optional; defaults to container children)
 *   [data-mt-carousel-prev|next]      controls
 *   [data-mt-carousel-dots]           dot host (buttons are generated)
 *   [data-mt-carousel-progress]       progress rail; inner span is scaled
 *   [data-mt-carousel-status]         polite live region
 *   [data-mt-carousel-reveal]         children staggered on slide select
 *
 * Inter-page continuity: the selected snap is written to sessionStorage under
 * `mt-carousel:<id>`, so a Barba room change (or a return visit) resumes the
 * same slide instead of snapping back to the first.
 *
 * Removable: delete this file, scripts/src/carousel.js, the build job, the
 * MaisonAssets.carousel line, and sections/maison-carousel.liquid.
 */

const STORAGE_PREFIX = 'mt-carousel:';
/** Runtime owns the GSAP bundle; reuse it instead of shipping a copy. */
const gsap = typeof window !== 'undefined' ? window.gsap : undefined;
/** @type {Map<HTMLElement, { api: any, off: (() => void)[] }>} */
const instances = new Map();

function motionReduced() {
  if (document.documentElement.dataset.reducedMotion === 'true') return true;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function storageKey(host, index) {
  const id = host.dataset.mtCarouselId || host.id || `index-${index}`;
  return `${STORAGE_PREFIX}${id}`;
}

function readIndex(key) {
  try {
    const raw = window.sessionStorage.getItem(key);
    if (raw === null) return null;
    const value = Number(raw);
    return Number.isInteger(value) ? value : null;
  } catch {
    return null;
  }
}

function writeIndex(key, value) {
  try {
    window.sessionStorage.setItem(key, String(value));
  } catch {
    /* private mode — continuity simply won't persist */
  }
}

function truthy(value) {
  return value === 'true' || value === '' || value === '1';
}

function buildDots(host, api) {
  const container = host.querySelector('[data-mt-carousel-dots]');
  if (!container) return () => {};
  container.innerHTML = '';
  const count = api.scrollSnapList().length;
  if (count < 2) {
    container.hidden = true;
    return () => {};
  }
  container.hidden = false;

  const buttons = [];
  for (let i = 0; i < count; i += 1) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'maison-carousel__dot';
    button.setAttribute('aria-label', `Go to slide ${i + 1} of ${count}`);
    button.addEventListener('click', () => {
      if (motionReduced()) api.scrollTo(i, true);
      else api.scrollTo(i);
    });
    container.appendChild(button);
    buttons.push(button);
  }

  const sync = () => {
    const selected = api.selectedScrollSnap();
    buttons.forEach((button, i) => {
      const active = i === selected;
      button.setAttribute('aria-current', active ? 'true' : 'false');
      button.classList.toggle('is-active', active);
    });
  };

  sync();
  api.on('select', sync);
  api.on('reInit', sync);
  return () => {
    api.off('select', sync);
    api.off('reInit', sync);
  };
}

function ensureStatus(host) {
  let status = host.querySelector('[data-mt-carousel-status]');
  if (status) return status;
  status = document.createElement('p');
  status.className = 'visually-hidden';
  status.dataset.mtCarouselStatus = '';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  host.appendChild(status);
  return status;
}

function ensureProgress(host) {
  const rail = host.querySelector('[data-mt-carousel-progress]');
  if (!rail) return null;
  let bar = rail.querySelector('span');
  if (!bar) {
    bar = document.createElement('span');
    rail.appendChild(bar);
  }
  rail.setAttribute('aria-hidden', 'true');
  return bar;
}

function mount(host) {
  if (host.dataset.mtCarouselReady === 'true') return instances.get(host)?.api;
  const viewport = host.querySelector('[data-mt-carousel-viewport]');
  if (!viewport) return null;

  const loop = truthy(host.dataset.mtCarouselLoop ?? 'false');
  const api = EmblaCarousel(
    viewport,
    {
      align: host.dataset.mtCarouselAlign || 'start',
      containScroll: loop ? false : 'trimSnaps',
      loop,
      dragFree: truthy(host.dataset.mtCarouselDragFree ?? 'false'),
      skipSnaps: false,
      slidesToScroll: 1,
      duration: 26,
    },
  );

  host.dataset.mtCarouselReady = 'true';
  viewport.setAttribute('aria-roledescription', 'carousel');

  const slides = api.slideNodes();
  slides.forEach((slide, i) => {
    if (!slide.hasAttribute('role')) slide.setAttribute('role', 'group');
    slide.setAttribute('aria-roledescription', 'slide');
    if (!slide.hasAttribute('aria-label')) {
      slide.setAttribute('aria-label', `${i + 1} of ${slides.length}`);
    }
  });

  const status = ensureStatus(host);
  const progress = ensureProgress(host);
  const prev = host.querySelector('[data-mt-carousel-prev]');
  const next = host.querySelector('[data-mt-carousel-next]');
  const key = storageKey(host, 0);

  const setProgress = (value) => {
    if (!progress) return;
    if (!gsap || motionReduced()) progress.style.transform = `scaleX(${value})`;
    else gsap.to(progress, { scaleX: value, duration: 0.45, ease: 'power2.out' });
  };

  const syncChrome = () => {
    const index = api.selectedScrollSnap();
    const count = api.scrollSnapList().length;
    status.textContent = `Slide ${index + 1} of ${count}`;
    if (prev) prev.disabled = !loop && !api.canScrollPrev();
    if (next) next.disabled = !loop && !api.canScrollNext();
    const raw = api.scrollProgress();
    setProgress(Number.isFinite(raw) ? Math.min(1, Math.max(0, raw)) : 0);
  };

  const revealSlide = () => {
    if (motionReduced() || !gsap) return;
    const slide = slides[api.selectedScrollSnap()];
    if (!slide) return;
    const targets = slide.querySelectorAll('[data-mt-carousel-reveal]');
    if (!targets.length) return;
    gsap.fromTo(
      targets,
      { y: 14, autoAlpha: 0 },
      {
        y: 0,
        autoAlpha: 1,
        duration: 0.55,
        ease: 'power3.out',
        stagger: 0.06,
        overwrite: 'auto',
        clearProps: 'opacity,visibility,transform',
      },
    );
  };

  const onSelect = () => {
    syncChrome();
    revealSlide();
  };
  const onSettle = () => writeIndex(key, api.selectedScrollSnap());

  api.on('select', onSelect);
  api.on('settle', onSettle);
  api.on('scroll', () => {
    const raw = api.scrollProgress();
    if (!progress || !Number.isFinite(raw)) return;
    if (!motionReduced()) progress.style.transform = `scaleX(${Math.min(1, Math.max(0, raw))})`;
  });

  const goPrev = () => (motionReduced() ? api.scrollPrev(true) : api.scrollPrev());
  const goNext = () => (motionReduced() ? api.scrollNext(true) : api.scrollNext());

  prev?.addEventListener('click', goPrev);
  next?.addEventListener('click', goNext);

  const onKeydown = (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      goPrev();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      goNext();
    } else if (event.key === 'Home') {
      event.preventDefault();
      motionReduced() ? api.scrollTo(0, true) : api.scrollTo(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      const last = api.scrollSnapList().length - 1;
      motionReduced() ? api.scrollTo(last, true) : api.scrollTo(last);
    }
  };
  viewport.addEventListener('keydown', onKeydown);

  const unmountDots = buildDots(host, api);
  syncChrome();

  const stored = readIndex(key);
  if (stored !== null && stored > 0) {
    const last = api.scrollSnapList().length - 1;
    if (stored <= last) api.scrollTo(stored, true);
  }

  instances.set(host, {
    api,
    off: () => {
      prev?.removeEventListener('click', goPrev);
      next?.removeEventListener('click', goNext);
      viewport.removeEventListener('keydown', onKeydown);
      unmountDots();
      api.destroy();
      host.removeAttribute('data-mt-carousel-ready');
    },
  });

  return api;
}

export function mountAll(root = document) {
  root.querySelectorAll('[data-mt-carousel]').forEach((host) => mount(host));
}

export function destroyAll(root = document) {
  root.querySelectorAll('[data-mt-carousel]').forEach((host) => {
    const entry = instances.get(host);
    if (!entry) return;
    entry.off();
    instances.delete(host);
  });
}

export function initCarousel(root = document) {
  mountAll(root);
}

export const MaisonCarousel = { mountAll, destroyAll, init: initCarousel };

if (typeof window !== 'undefined') {
  window.MaisonCarousel = MaisonCarousel;
}

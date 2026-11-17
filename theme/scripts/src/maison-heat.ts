/**
 * Lazy heat-page island: FlameWrap border fire + profile Blaze bottom heat.
 * Thermal FTCS sim lives in the Liquid custom element (first-frame SVG poster).
 * First-frame rule: HTML/SVG posters stay visible until GPU/canvas paints once.
 */
import {
  createBlaze,
  createFlameWrap,
  showHtmlFallback,
  supportsHtmlInCanvas,
  supportsWebGPU,
  type BlazeInstance,
  type FlameWrapInstance,
} from './effects';

type Destroyable = { destroy: () => void };

const instances = new Set<Destroyable>();

function prefersReduced(): boolean {
  return (
    matchMedia('(prefers-reduced-motion: reduce)').matches ||
    document.documentElement.dataset.reducedMotion === 'true'
  );
}

function markReady(stage: HTMLElement) {
  stage.dataset.mtFxReady = 'true';
  stage.classList.add('is-fx-ready');
}

function mountFlameWrap(root: HTMLElement): FlameWrapInstance | null {
  const source = root.querySelector<HTMLCanvasElement>('[data-mt-fx-source]');
  const content = root.querySelector<HTMLElement>('[data-mt-fx-content]');
  const output = root.querySelector<HTMLCanvasElement>('[data-mt-fx-output]');
  if (!source || !content || !output) return null;

  // Poster / content is visible in the DOM immediately (first frame).
  // Without html-in-canvas or WebGPU, keep that HTML and hide GPU canvases.
  if (!supportsWebGPU() || prefersReduced()) {
    showHtmlFallback(source, content, output);
    markReady(root);
    return null;
  }

  if (!supportsHtmlInCanvas()) {
    showHtmlFallback(source, content, null);
  }

  const flame = createFlameWrap(
    { source, content, output },
    {
      color: [0.88, 0.42, 0.12],
      intensity: 0.65,
      height: 120,
      spread: 14,
      radius: 28,
      speed: 0.35,
      sparks: 1.1,
      smoke: 0.9,
      ember: 1.4,
      melt: 3.5,
      distortion: 8,
    },
  );

  if (!flame) {
    showHtmlFallback(source, content, output);
    markReady(root);
    return null;
  }

  // Reveal GPU overlay after a short paint window so the poster never blanks.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => markReady(root));
  });

  return flame;
}

function mountBlazeProfile(root: HTMLElement): BlazeInstance | null {
  const source = root.querySelector<HTMLCanvasElement>('[data-mt-fx-source]');
  const content = root.querySelector<HTMLElement>('[data-mt-fx-content]');
  const output = root.querySelector<HTMLCanvasElement>('[data-mt-fx-output]');
  if (!source || !content || !output) return null;

  if (!supportsWebGPU() || prefersReduced()) {
    showHtmlFallback(source, content, output);
    markReady(root);
    return null;
  }

  if (!supportsHtmlInCanvas()) {
    showHtmlFallback(source, content, null);
  }

  const blaze = createBlaze(
    { source, content, output },
    {
      height: 0.55,
      distortion: 0.45,
      speed: 0.85,
      sparks: 0.7,
      sparkDensity: 1.35,
      sparkSize: 0.9,
      layers: 4,
      smoke: 0.55,
      glow: 1.25,
      sparkColor: [1, 0.38, 0.06],
      smokeColor: [1, 0.4, 0.1],
    },
  );

  if (!blaze) {
    showHtmlFallback(source, content, output);
    markReady(root);
    return null;
  }

  requestAnimationFrame(() => {
    requestAnimationFrame(() => markReady(root));
  });

  return blaze;
}

function mountAll(scope: ParentNode = document) {
  scope.querySelectorAll<HTMLElement>('[data-mt-flame-wrap]').forEach((el) => {
    if (el.dataset.mtFxMounted === '1') return;
    el.dataset.mtFxMounted = '1';
    const instance = mountFlameWrap(el);
    if (instance) instances.add(instance);
  });

  scope.querySelectorAll<HTMLElement>('[data-mt-blaze-profile]').forEach((el) => {
    if (el.dataset.mtFxMounted === '1') return;
    el.dataset.mtFxMounted = '1';
    const instance = mountBlazeProfile(el);
    if (instance) instances.add(instance);
  });
}

function destroyAll() {
  for (const instance of instances) {
    try {
      instance.destroy();
    } catch {
      /* ignore */
    }
  }
  instances.clear();
  document.querySelectorAll<HTMLElement>('[data-mt-fx-mounted]').forEach((el) => {
    delete el.dataset.mtFxMounted;
    delete el.dataset.mtFxReady;
    el.classList.remove('is-fx-ready');
  });
  // also clear mount flags
  document.querySelectorAll<HTMLElement>('[data-mt-flame-wrap], [data-mt-blaze-profile]').forEach((el) => {
    delete el.dataset.mtFxMounted;
    delete el.dataset.mtFxReady;
    el.classList.remove('is-fx-ready');
  });
}

function boot() {
  if (!document.querySelector('[data-mt-flame-wrap], [data-mt-blaze-profile], maison-thermal')) {
    return;
  }
  mountAll();
}

document.addEventListener('maison:page-leave', destroyAll);
document.addEventListener('maison:page-enter', () => {
  destroyAll();
  boot();
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}

const MaisonHeat = {
  mount: mountAll,
  destroy: destroyAll,
  createFlameWrap,
  createBlaze,
};

(globalThis as unknown as { MaisonHeat: typeof MaisonHeat }).MaisonHeat = MaisonHeat;

export { MaisonHeat };

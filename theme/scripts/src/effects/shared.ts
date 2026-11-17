/// <reference types="@webgpu/types" />
import { init, type Gpu } from 'vgpu';

const canvasDimensionLimits = new WeakMap<
  WebGLRenderingContext | WebGL2RenderingContext,
  number
>();

/** Keep the existing DPR budget, then account for browser pinch zoom. */
export function getCanvasPixelRatio(
  element: HTMLElement,
  context?: WebGLRenderingContext | WebGL2RenderingContext,
): number {
  const scale = window.visualViewport?.scale || 1;
  const requested = Math.min(window.devicePixelRatio || 1, 2) * scale;
  const width = Math.max(element.clientWidth, 1);
  const height = Math.max(element.clientHeight, 1);
  let maxDimension = 8192;
  if (context) {
    let limit = canvasDimensionLimits.get(context);
    if (limit === undefined) {
      limit = Math.min(
        maxDimension,
        context.getParameter(context.MAX_TEXTURE_SIZE),
        context.getParameter(context.MAX_RENDERBUFFER_SIZE),
      );
      canvasDimensionLimits.set(context, limit);
    }
    maxDimension = limit;
  }
  return Math.min(
    requested,
    maxDimension / Math.max(width, height),
    Math.sqrt(16_777_216 / (width * height)),
  );
}

/** Pinch zoom changes visualViewport without resizing the element's CSS box. */
export function createCanvasResizeObserver(onResize: () => void) {
  const viewport = window.visualViewport;
  let frame = 0;
  let disconnected = false;
  const schedule = () => {
    if (frame || disconnected) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      onResize();
    });
  };
  const observer = new ResizeObserver(schedule);
  window.addEventListener('resize', schedule, { passive: true });
  viewport?.addEventListener('resize', schedule, { passive: true });
  return {
    observe(element: Element, options?: ResizeObserverOptions) {
      observer.observe(element, options);
    },
    unobserve(element: Element) {
      observer.unobserve(element);
    },
    disconnect() {
      disconnected = true;
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', schedule);
      viewport?.removeEventListener('resize', schedule);
    },
  };
}

type HtmlInCanvasContext = CanvasRenderingContext2D & {
  drawElementImage: (element: Element, x: number, y: number) => DOMMatrix | void;
};

type HtmlInCanvasElement = HTMLCanvasElement & {
  updateElementGeometry?: (
    element: Element,
    options: { canvasTransform: DOMMatrix },
  ) => void;
};

/**
 * Android can expose the API, but renderer crashes were reported on effect
 * pages. Keep Android on the DOM/overlay fallback.
 */
export function isHtmlInCanvasBlocked(): boolean {
  if (typeof navigator === 'undefined') return false;
  const platform = (navigator as Navigator & {
    userAgentData?: { platform?: string };
  }).userAgentData?.platform;
  return platform === 'Android' || /Android/i.test(navigator.userAgent);
}

/** Configure the capture subtree for both generations of the experimental API. */
export function prepareHtmlInCanvas(source: HTMLCanvasElement, content: HTMLElement) {
  if ('content' in source) {
    source.setAttribute('content', 'drawable');
    content.setAttribute('drawable', '');
  } else {
    source.setAttribute('layoutsubtree', '');
  }
}

/** Capture pixels and keep the native DOM hit-test region aligned with them. */
export function drawHtmlInCanvas(
  source: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  content: HTMLElement,
) {
  const transform = (context as HtmlInCanvasContext).drawElementImage(content, 0, 0);
  const canvas = source as HtmlInCanvasElement;
  if (transform && typeof canvas.updateElementGeometry === 'function') {
    canvas.updateElementGeometry(content, { canvasTransform: transform });
  }
}

export type PaintableCanvas = HTMLCanvasElement & {
  onpaint?: (() => void) | null;
  requestPaint?: () => void;
};

export type ElementImageContext = CanvasRenderingContext2D & {
  drawElementImage?: (element: Element, x: number, y: number) => void;
};

export function supportsHtmlInCanvas(): boolean {
  if (typeof document === 'undefined' || isHtmlInCanvasBlocked()) return false;
  const probe = document.createElement('canvas') as PaintableCanvas;
  const ctx = probe.getContext('2d') as ElementImageContext | null;
  return Boolean(
    ctx &&
      typeof ctx.drawElementImage === 'function' &&
      typeof probe.requestPaint === 'function',
  );
}

/** True when the browser exposes WebGPU. The device itself is requested lazily. */
export function supportsWebGPU(): boolean {
  return typeof navigator !== 'undefined' && Boolean(navigator.gpu);
}

const SHARED_GPU_KEY = '__mtSharedVgpu';

type SharedGpuHost = typeof globalThis & {
  [SHARED_GPU_KEY]?: Promise<Gpu> | null;
};

/** One WebGPU device per page across IIFE assets (idle Blaze + heat FlameWrap). */
export function acquireGpu(): Promise<Gpu> {
  const host = globalThis as SharedGpuHost;
  if (!host[SHARED_GPU_KEY]) {
    host[SHARED_GPU_KEY] = init().catch((error) => {
      host[SHARED_GPU_KEY] = null;
      throw error;
    });
  }
  return host[SHARED_GPU_KEY] as Promise<Gpu>;
}

/** Fallback: move content out of the source canvas when html-in-canvas is unavailable. */
export function showHtmlFallback(
  source: HTMLCanvasElement,
  content: HTMLElement,
  output?: HTMLCanvasElement | null,
) {
  if (content.parentElement === source) {
    source.after(content);
  }
  source.style.display = 'none';
  if (output) output.style.display = 'none';
}

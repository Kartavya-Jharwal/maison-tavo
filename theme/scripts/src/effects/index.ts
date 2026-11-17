/**
 * Shared WebGPU canvas effects for heat page + idle Blaze.
 * Import createBlaze / createFlameWrap / acquireGpu from here to avoid circular deps.
 */
export {
  acquireGpu,
  supportsHtmlInCanvas,
  supportsWebGPU,
  showHtmlFallback,
  getCanvasPixelRatio,
  createCanvasResizeObserver,
  isHtmlInCanvasBlocked,
  prepareHtmlInCanvas,
  drawHtmlInCanvas,
} from './shared';

export { createFlameWrap } from './flame-wrap';
export type {
  FlameWrapOptions,
  FlameWrapElements,
  FlameWrapInstance,
} from './flame-wrap';

export { createBlaze } from './blaze';
export type { BlazeOptions, BlazeElements, BlazeInstance } from './blaze';

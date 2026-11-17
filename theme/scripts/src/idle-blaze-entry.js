/**
 * Separate Shopify asset entry for the idle Blaze / vgpu chunk.
 * Loaded on demand from maison-runtime after 90s of inactivity.
 */
import {
  initIdleBlaze,
  IDLE_BLAZE_MS,
  IDLE_BLAZE_FADE_OUT_MS,
  IDLE_BLAZE_STORAGE_KEY,
} from './effects/idle-blaze.ts';

const MaisonIdleBlaze = {
  init: initIdleBlaze,
  IDLE_MS: IDLE_BLAZE_MS,
  FADE_OUT_MS: IDLE_BLAZE_FADE_OUT_MS,
  STORAGE_KEY: IDLE_BLAZE_STORAGE_KEY,
};

globalThis.MaisonIdleBlaze = MaisonIdleBlaze;

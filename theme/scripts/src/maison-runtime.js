import { animate, inView, scroll, stagger } from 'motion';
import { createStore } from 'zustand/vanilla';

/**
 * Vanilla storefront runtime for Liquid islands.
 * Bundled to assets/maison-runtime.js (IIFE → window.MaisonRuntime).
 * Do not import React from here — Horizon stays the storefront.
 */
const MaisonRuntime = {
  animate,
  stagger,
  inView,
  scroll,
  createStore,
};

globalThis.MaisonRuntime = MaisonRuntime;

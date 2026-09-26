/**
 * M0 SPIKE — Motion (WS5).
 *
 * Proves anime.js v4 + Motion (motion.dev vanilla) run as vendored ESM browser
 * builds in the Horizon theme with no build step (flat under `assets/` —
 * Shopify rejects asset subfolders):
 *   - anime.js v4.1.4   → staggered hero content reveal (homepage)
 *   - motion v12.43.0   → hero media settle (scale + fade)
 *
 * D10 compliance:
 *   - Skipped entirely under `prefers-reduced-motion: reduce`.
 *   - Animates opacity/transform only — zero layout shift.
 *   - Fully removable: delete this file, `anime.esm.js` / `motion.esm.js`,
 *     and the `maison-motion.js` script tag in `snippets/scripts.liquid`.
 *
 * Note: Shopify rejects assets subfolders, so vendors live flat under assets/.
 */

import { animate, stagger } from './anime.esm.js';
import { animate as motionAnimate } from './motion.esm.js';

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function heroReveal() {
  const content = document.querySelector('.hero__content-wrapper');
  if (!content) return;

  const blocks = Array.from(content.children);
  if (blocks.length > 0) {
    // anime.js v4 — staggered headline/button reveal. Opacity + translate only.
    animate(blocks, {
      opacity: [0, 1],
      translateY: [28, 0],
      delay: stagger(140),
      duration: 900,
      ease: 'outExpo',
    });
  }

  // Motion (vanilla) — hero media settles in with a slow scale-down.
  const media = document.querySelector('.hero__media-wrapper');
  if (media) {
    motionAnimate(
      media,
      { opacity: [0, 1], scale: [1.05, 1] },
      { duration: 1.4, easing: [0.16, 1, 0.3, 1] },
    );
  }
}

if (!prefersReducedMotion.matches) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', heroReveal, { once: true });
  } else {
    heroReveal();
  }
}

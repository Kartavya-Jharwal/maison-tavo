import { DragGesture } from '@use-gesture/vanilla';
import gsap from 'gsap';

/**
 * Horizontal drag on drawer grips and headers.
 * Works for the bag and any other theme-drawer that exposes a dialog.
 * Close controls, quantities, and checkout stay clickable.
 * Past a threshold the drawer finishes its own close; otherwise it eases back.
 */

const bound = new WeakSet();
let watching = false;
let tween = null;

function reduced() {
  return document.documentElement.dataset.reducedMotion === 'true';
}

function bindDrawer(drawer) {
  if (!(drawer instanceof HTMLElement) || bound.has(drawer)) return;
  const dialog = drawer.querySelector('dialog');
  if (!dialog || typeof drawer.close !== 'function') return;
  bound.add(drawer);

  dialog.addEventListener('close', () => {
    tween?.kill();
    dialog.style.removeProperty('inset-inline-end');
    dialog.style.removeProperty('animation');
  });

  new DragGesture(
    dialog,
    (state) => {
      const { first, last, movement, velocity, event, memo, cancel } = state;
      if (!dialog.open) {
        cancel();
        return false;
      }
      let allowed = memo;
      if (first) {
        const target = event.target instanceof Element ? event.target : null;
        const handle = target?.closest(
          '[data-mt-drawer-grip], .theme-drawer__header, .cart-drawer__grip',
        );
        const control = target?.closest('button, a, input, select, textarea, label');
        allowed = Boolean(handle) && !control;
      }
      if (!allowed) return false;

      const rtl = document.documentElement.dir === 'rtl';
      const toward = rtl ? -movement[0] : movement[0];
      const offset = toward < 0 ? toward * 0.18 : toward;
      tween?.kill();
      dialog.style.insetInlineEnd = `${-offset}px`;

      if (!last) return allowed;

      const width = dialog.getBoundingClientRect().width || 360;
      const speed = rtl ? -velocity[0] : velocity[0];
      const shouldClose = toward > width * 0.28 || (toward > 28 && speed > 0.65);

      if (shouldClose) {
        dialog.style.insetInlineEnd = `${-width}px`;
        dialog.style.animation = 'none';
        Promise.resolve(drawer.close()).finally(() => {
          dialog.style.removeProperty('inset-inline-end');
          dialog.style.removeProperty('animation');
        });
        return allowed;
      }

      if (reduced()) {
        dialog.style.removeProperty('inset-inline-end');
        return allowed;
      }

      const from = { x: offset };
      tween = gsap.to(from, {
        x: 0,
        duration: 0.48,
        ease: 'back.out(1.5)',
        onUpdate: () => {
          dialog.style.insetInlineEnd = `${-from.x}px`;
        },
        onComplete: () => {
          dialog.style.removeProperty('inset-inline-end');
        },
      });
      return allowed;
    },
    {
      axis: 'x',
      filterTaps: true,
      threshold: 12,
      preventDefault: false,
      pointer: { touch: true },
    },
  );
}

function scan(root = document) {
  root.querySelectorAll('theme-drawer').forEach(bindDrawer);
}

export function initDrawerGesture() {
  scan();
  if (watching) return;
  watching = true;
  new MutationObserver(() => scan()).observe(document.body, {
    childList: true,
    subtree: true,
  });
  document.addEventListener('maison:page-enter', () => scan());
}

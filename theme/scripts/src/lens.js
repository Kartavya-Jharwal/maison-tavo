import gsap from 'gsap';

/**
 * Panopticon lens — Human / Engineer / Machine.
 *
 * Lives in the runtime bundle instead of a `{% javascript %}` tag inside
 * blocks/_product-card-lens.liquid so that:
 *   - sections/maison-view-as.liquid works even when no product-card lens
 *     block is on the page (it used to ship markup with no behaviour),
 *   - the definition is emitted once, not once per card block instance,
 *   - Barba room swaps and `shopify:section:load` re-bind through one path.
 *
 * The custom element is still registered under the same tag name, so the
 * markup contract is unchanged.
 */

const LENSES = ['human', 'engineer', 'machine'];
const BOUND = 'mtLensBound';

function motionReduced() {
  if (document.documentElement.dataset.reducedMotion === 'true') return true;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function panelsOf(host) {
  return [...host.querySelectorAll('[data-lens-panel]')];
}

function optionsOf(host) {
  return [...host.querySelectorAll('[data-lens-option]')];
}

/**
 * Switch a lens host. Returns true when the lens actually changed.
 * @param {HTMLElement} host
 * @param {string} lens
 */
export function setLens(host, lens) {
  if (!LENSES.includes(lens)) return false;
  if (host.dataset.lens === lens) return true;

  const before = host.getBoundingClientRect().height;
  const staggerTargets = [];

  optionsOf(host).forEach((option) => {
    const active = option.dataset.lensOption === lens;
    option.setAttribute('aria-pressed', String(active));
    option.classList.toggle('is-active', active);
  });

  panelsOf(host).forEach((panel) => {
    const active = panel.dataset.lensPanel === lens;
    panel.hidden = !active;
    if (active) staggerTargets.push(...panel.children);
  });

  host.dataset.lens = lens;

  const after = host.getBoundingClientRect().height;
  const flowChange = Number.isFinite(before) && Number.isFinite(after) && Math.abs(after - before) > 1;
  const allowed = !motionReduced();

  if (flowChange && allowed) {
    gsap.fromTo(
      host,
      { height: before },
      {
        height: after,
        duration: 0.45,
        ease: 'power3.out',
        overwrite: 'auto',
        clearProps: 'height',
      },
    );
  }

  if (allowed && staggerTargets.length) {
    gsap.fromTo(
      staggerTargets,
      { y: 10, autoAlpha: 0 },
      {
        y: 0,
        autoAlpha: 1,
        duration: 0.42,
        ease: 'power2.out',
        stagger: 0.05,
        overwrite: 'auto',
        clearProps: 'opacity,visibility,transform',
      },
    );
  }

  host.dispatchEvent(new CustomEvent('maison:lens', { bubbles: true, detail: { lens } }));
  return true;
}

function bind(host) {
  if (host.dataset[BOUND] === 'true') return;
  host.dataset[BOUND] = 'true';

  host.addEventListener('click', (event) => {
    const option = event.target.closest('[data-lens-option]');
    if (!option || !host.contains(option)) return;
    event.preventDefault();
    setLens(host, option.dataset.lensOption);
  });

  host.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    if (!event.target.closest('[data-lens-option]')) return;
    event.preventDefault();
    const options = optionsOf(host);
    const index = options.indexOf(document.activeElement);
    if (index < 0) return;
    const step = event.key === 'ArrowRight' ? 1 : -1;
    const next = options[(index + step + options.length) % options.length];
    next.focus();
    setLens(host, next.dataset.lensOption);
  });
}

export function initLens(root = document) {
  root.querySelectorAll('maison-lens, .maison-lens').forEach(bind);
}

export const MaisonLens = { init: initLens, setLens, LENSES };

if (typeof window !== 'undefined') {
  window.MaisonLens = MaisonLens;
}

if (typeof customElements !== 'undefined' && !customElements.get('maison-lens')) {
  customElements.define(
    'maison-lens',
    class MaisonLensElement extends HTMLElement {
      connectedCallback() {
        bind(this);
      }
    },
  );
}

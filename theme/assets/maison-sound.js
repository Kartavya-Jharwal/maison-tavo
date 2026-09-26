/**
 * M0 SPIKE — Sound (WS5, D10).
 *
 * Howler.js (vendored UMD build, loaded as a classic script so it can attach
 * `window.Howl`) powers one subtle interaction sound on add-to-cart.
 *
 * D10 compliance:
 *   - Silent by default. Sound only plays after an explicit opt-in via the
 *     toggle this module renders (bottom-left of the viewport).
 *   - Preference persists in localStorage (`maison:sound-enabled`).
 *   - The toggle and all behaviour are created here in JS — removing this
 *     file (and its script tags in `snippets/scripts.liquid`) removes every
 *     trace of the feature.
 */

const STORAGE_KEY = 'maison:sound-enabled';
const CART_LINES_UPDATE = 'shopify:cart:lines-update';

const isEnabled = () => {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
};

const setEnabled = (value) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, value ? 'true' : 'false');
  } catch {
    /* private mode — preference simply won't persist */
  }
};

/** Lazily create the Howl so no audio is loaded until sound has been opted into at least once. */
let clickSound = null;
function getClickSound() {
  if (clickSound || typeof window.Howl !== 'function' || !window.maisonSound?.src) {
    return clickSound;
  }
  clickSound = new window.Howl({
    src: [window.maisonSound.src],
    preload: isEnabled(),
    volume: 0.45,
  });
  return clickSound;
}

function playAddToCartSound(event) {
  if (!isEnabled()) return;
  // CartLinesUpdateEvent carries `action` ('add' | 'update' | 'remove') in its payload.
  const action = event?.detail?.action ?? event?.action;
  if (action && action !== 'add') return;
  getClickSound()?.play();
}

function renderToggle() {
  const button = document.createElement('button');
  button.type = 'button';
  button.id = 'maison-sound-toggle';
  button.setAttribute('aria-pressed', String(isEnabled()));

  Object.assign(button.style, {
    position: 'fixed',
    insetInlineStart: '12px',
    insetBlockEnd: '12px',
    zIndex: '100',
    padding: '6px 12px',
    font: '500 11px/1.4 system-ui, sans-serif',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'inherit',
    background: 'rgb(0 0 0 / 0.55)',
    colorScheme: 'dark',
    border: '1px solid rgb(255 255 255 / 0.35)',
    borderRadius: '999px',
    cursor: 'pointer',
    backdropFilter: 'blur(6px)',
  });
  button.style.color = '#fff';

  const paint = () => {
    const on = isEnabled();
    button.textContent = on ? '♪ Sound on' : '♪ Sound off';
    button.setAttribute('aria-pressed', String(on));
  };

  button.addEventListener('click', () => {
    const next = !isEnabled();
    setEnabled(next);
    if (next) {
      // The click is a user gesture, so this also unlocks the AudioContext.
      getClickSound()?.play();
    }
    paint();
  });

  paint();
  document.body.appendChild(button);
}

document.addEventListener(CART_LINES_UPDATE, playAddToCartSound);

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderToggle, { once: true });
} else {
  renderToggle();
}

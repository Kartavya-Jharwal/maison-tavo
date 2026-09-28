/**
 * Maison sound (M0 spike → M3/M4, D10).
 *
 * Howler.js (vendored UMD, classic script → `window.Howl`) powers soft
 * interaction cues. Silent by default behind an explicit opt-in toggle.
 *
 * Removable: delete this file, `howler.core.min.js`, `maison-add-to-cart.wav`,
 * and the Howler / maisonSound / module block in `snippets/scripts.liquid`.
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

/** Lazily create the Howl so no audio loads until the shopper opts in once. */
let clickSound = null;
function getClickSound() {
  if (clickSound || typeof window.Howl !== 'function' || !window.maisonSound?.src) {
    return clickSound;
  }
  clickSound = new window.Howl({
    src: [window.maisonSound.src],
    preload: isEnabled(),
    volume: 0.4,
  });
  return clickSound;
}

function playSoftClick() {
  if (!isEnabled()) return;
  const sound = getClickSound();
  if (!sound) return;
  sound.volume(0.4);
  sound.play();
}

function playAddToCartSound(event) {
  if (!isEnabled()) return;
  const action = event?.detail?.action ?? event?.action;
  if (action && action !== 'add') return;
  playSoftClick();
}

function renderToggle() {
  if (document.getElementById('maison-sound-toggle')) return;

  const button = document.createElement('button');
  button.type = 'button';
  button.id = 'maison-sound-toggle';
  button.className = 'maison-sound-toggle';
  button.setAttribute('aria-pressed', String(isEnabled()));
  button.setAttribute(
    'aria-label',
    isEnabled() ? 'Mute sound effects' : 'Enable sound effects (off by default)',
  );
  button.title = 'Sound effects — off until you turn them on';

  const paint = () => {
    const on = isEnabled();
    button.textContent = on ? 'Sound on' : 'Sound off';
    button.dataset.state = on ? 'on' : 'off';
    button.setAttribute('aria-pressed', String(on));
    button.setAttribute(
      'aria-label',
      on ? 'Mute sound effects' : 'Enable sound effects (currently off)',
    );
    button.title = on
      ? 'Sound effects on — click to mute'
      : 'Sound effects off — click to enable soft cues';
  };

  button.addEventListener('click', () => {
    const next = !isEnabled();
    setEnabled(next);
    if (next) {
      // User gesture unlocks AudioContext; short cue confirms opt-in.
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

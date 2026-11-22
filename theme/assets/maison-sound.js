/**
 * Maison sound — opt-in sonic atmosphere (D10 / Awwwards Gap 6).
 *
 * Howler.js (vendored UMD → `window.Howl`) powers soft interaction cues.
 * Silent by default. Preference persists in `localStorage`.
 * No ambient bed / autoplay loop — restrained cues only (cart + strike bell).
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
    volume: 0.38,
  });
  return clickSound;
}

function playSoftClick() {
  if (!isEnabled()) return;
  const sound = getClickSound();
  if (!sound) return;
  sound.volume(0.38);
  sound.play();
}

/**
 * Soft kansa-style partials (~880 Hz fundamental) for strike / last-call.
 * Web Audio only — no extra asset; gated by the same opt-in flag.
 */
let audioCtx = null;
function playBell() {
  if (!isEnabled()) return;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) {
      playSoftClick();
      return;
    }
    if (!audioCtx) audioCtx = new AC();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const now = audioCtx.currentTime;
    // Bell-metal partials: fundamental + inharmonic overtones (restrained gain).
    const partials = [
      { freq: 880, gain: 0.028, decay: 1.35 },
      { freq: 1320, gain: 0.014, decay: 1.05 },
      { freq: 1760 * 1.02, gain: 0.008, decay: 0.85 },
      { freq: 2200, gain: 0.006, decay: 0.7 },
    ];

    partials.forEach(({ freq, gain, decay }) => {
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      g.gain.setValueAtTime(gain, now);
      g.gain.exponentialRampToValueAtTime(0.0001, now + decay);
      osc.connect(g);
      g.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + decay + 0.05);
    });
  } catch {
    playSoftClick();
  }
}

function stopAll() {
  try {
    clickSound?.stop();
  } catch {
    /* ignore */
  }
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
  button.setAttribute('aria-pressed', 'false');
  button.setAttribute('aria-label', 'Sound effects');
  button.title = 'Sound effects — off until you turn them on';

  const paint = () => {
    const on = isEnabled();
    button.textContent = on ? 'Sound on' : 'Sound off';
    button.dataset.state = on ? 'on' : 'off';
    button.setAttribute('aria-pressed', String(on));
    button.title = on
      ? 'Sound effects on — click to mute'
      : 'Sound effects off — click to enable soft cues';
  };

  button.addEventListener('click', () => {
    const next = !isEnabled();
    setEnabled(next);
    if (next) {
      // User gesture unlocks AudioContext; short cue confirms opt-in.
      playSoftClick();
    } else {
      stopAll();
    }
    paint();
    window.dispatchEvent(
      new CustomEvent('maison:sound-change', { detail: { enabled: next } }),
    );
  });

  paint();
  (document.querySelector('[data-mt-sound-controls]') || document.body).appendChild(button);
}

document.addEventListener(CART_LINES_UPDATE, playAddToCartSound);

window.MaisonSound = {
  isEnabled,
  playCue: playSoftClick,
  playBell,
  stopAll,
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderToggle, { once: true });
} else {
  renderToggle();
}

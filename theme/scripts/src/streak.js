/**
 * Maison Tavo — client-side Streak scaffold (theme only).
 *
 * Scope: localStorage signals + cart/pre-checkout chrome + CSS skin hooks.
 * Out of scope: Shopify Checkout SPA, payment steps, thank-you / order status.
 * Those require Checkout UI / Customer Account UI extensions — see docs/streak-system.md.
 */

export const STREAK_KEY = 'mt_streak';
export const STREAK_VERSION = 1;

/** @typedef {'none' | 'ember' | 'flame' | 'forge'} StreakTier */

/**
 * @typedef {object} ReleaseRecord
 * @property {string} joinedAt
 * @property {'joined' | 'waitlisted' | string} status
 */

/**
 * @typedef {object} StreakState
 * @property {number} version
 * @property {string[]} visitDays          ISO dates YYYY-MM-DD (newest last; capped)
 * @property {number} visitStreak          consecutive calendar days ending today/yesterday
 * @property {number} cartReturns          cart drawer opens while bag has items
 * @property {string | null} lastCartOpenAt
 * @property {Record<string, ReleaseRecord>} releases
 * @property {number} checkoutHandoffs     theme → Shopify checkout button clicks
 * @property {string | null} lastCheckoutHandoffAt
 * @property {StreakTier} tier
 * @property {string} updatedAt
 */

const VISIT_CAP = 90;

/** @returns {StreakState} */
export function defaultStreakState() {
  return {
    version: STREAK_VERSION,
    visitDays: [],
    visitStreak: 0,
    cartReturns: 0,
    lastCartOpenAt: null,
    releases: {},
    checkoutHandoffs: 0,
    lastCheckoutHandoffAt: null,
    tier: 'none',
    updatedAt: new Date().toISOString(),
  };
}

function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function dayOffset(isoDay, delta) {
  const d = new Date(`${isoDay}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

function consecutiveStreak(days) {
  if (!days.length) return 0;
  const set = new Set(days);
  const today = todayKey();
  const yesterday = dayOffset(today, -1);
  let cursor = set.has(today) ? today : set.has(yesterday) ? yesterday : null;
  if (!cursor) return 0;
  let count = 0;
  while (set.has(cursor)) {
    count += 1;
    cursor = dayOffset(cursor, -1);
  }
  return count;
}

/**
 * Derive visual tier from counters. Extension point: replace or wrap via
 * `MaisonRuntime.streak.computeTier = (state) => …`.
 * @param {StreakState} state
 * @returns {StreakTier}
 */
export function computeTier(state) {
  const releaseCount = Object.keys(state.releases || {}).length;
  if (state.visitStreak >= 14 || releaseCount >= 2) return 'forge';
  if (state.visitStreak >= 5 || state.cartReturns >= 3) return 'flame';
  if (state.visitStreak >= 2 || state.cartReturns >= 1 || releaseCount >= 1) return 'ember';
  return 'none';
}

/** @param {unknown} raw @returns {StreakState} */
function normalize(raw) {
  const base = defaultStreakState();
  if (!raw || typeof raw !== 'object') return base;
  const o = /** @type {Record<string, unknown>} */ (raw);
  return {
    ...base,
    version: STREAK_VERSION,
    visitDays: Array.isArray(o.visitDays)
      ? o.visitDays.filter((d) => typeof d === 'string').slice(-VISIT_CAP)
      : [],
    visitStreak: Number(o.visitStreak) || 0,
    cartReturns: Number(o.cartReturns) || 0,
    lastCartOpenAt: typeof o.lastCartOpenAt === 'string' ? o.lastCartOpenAt : null,
    releases:
      o.releases && typeof o.releases === 'object' && !Array.isArray(o.releases)
        ? /** @type {Record<string, ReleaseRecord>} */ (o.releases)
        : {},
    checkoutHandoffs: Number(o.checkoutHandoffs) || 0,
    lastCheckoutHandoffAt:
      typeof o.lastCheckoutHandoffAt === 'string' ? o.lastCheckoutHandoffAt : null,
    tier: 'none',
    updatedAt: typeof o.updatedAt === 'string' ? o.updatedAt : base.updatedAt,
  };
}

export function readStreak() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STREAK_KEY) || 'null');
    const state = normalize(parsed);
    state.visitStreak = consecutiveStreak(state.visitDays);
    state.tier = computeTier(state);
    return state;
  } catch {
    return defaultStreakState();
  }
}

/** @param {StreakState} state */
export function writeStreak(state) {
  const next = {
    ...state,
    version: STREAK_VERSION,
    visitStreak: consecutiveStreak(state.visitDays),
    updatedAt: new Date().toISOString(),
  };
  next.tier = (typeof MaisonStreakHooks.computeTier === 'function'
    ? MaisonStreakHooks.computeTier(next)
    : computeTier(next));
  try {
    localStorage.setItem(STREAK_KEY, JSON.stringify(next));
  } catch {
    /* private mode / quota */
  }
  applySkin(next);
  renderChip(next);
  MaisonStreakHooks.onChange?.(next);
  return next;
}

/** Hook bag — assign from outside without editing this file. */
export const MaisonStreakHooks = {
  /** @type {((state: StreakState) => StreakTier) | null} */
  computeTier: null,
  /** @type {((state: StreakState) => void) | null} */
  onChange: null,
  /**
   * Future signal types: 'visit' | 'cart_return' | 'checkout_handoff' | 'release' | string
   * @type {((type: string, payload: unknown, state: StreakState) => StreakState | void) | null}
   */
  onSignal: null,
};

/** @param {StreakState} state */
function applySkin(state) {
  const root = document.documentElement;
  root.dataset.mtStreakTier = state.tier;
  root.style.setProperty('--mt-streak-tier', state.tier);
  const accents = {
    none: 'transparent',
    ember: 'rgb(var(--color-foreground-rgb) / 0.55)',
    flame: 'rgb(var(--color-foreground-rgb) / 0.75)',
    forge: 'var(--color-foreground)',
  };
  root.style.setProperty('--mt-streak-accent', accents[state.tier] || accents.none);
  root.style.setProperty('--mt-streak-intensity', String(Math.min(1, state.visitStreak / 14)));
}

/**
 * @param {string} type
 * @param {unknown} [payload]
 */
export function recordSignal(type, payload) {
  let state = readStreak();
  const patched = MaisonStreakHooks.onSignal?.(type, payload, state);
  if (patched && typeof patched === 'object') {
    return writeStreak(/** @type {StreakState} */ (patched));
  }

  switch (type) {
    case 'visit': {
      const day = todayKey();
      if (!state.visitDays.includes(day)) {
        state.visitDays = [...state.visitDays, day].slice(-VISIT_CAP);
      }
      break;
    }
    case 'cart_return': {
      // One cart-return credit per calendar day (drawer may open many times).
      try {
        const gate = 'mt_streak_cart_return_day';
        const day = todayKey();
        if (sessionStorage.getItem(gate) === day) break;
        sessionStorage.setItem(gate, day);
      } catch {
        /* private mode */
      }
      state.cartReturns += 1;
      state.lastCartOpenAt = new Date().toISOString();
      break;
    }
    case 'checkout_handoff': {
      state.checkoutHandoffs += 1;
      state.lastCheckoutHandoffAt = new Date().toISOString();
      break;
    }
    case 'release': {
      const id =
        payload && typeof payload === 'object' && 'id' in payload
          ? String(/** @type {{ id: unknown }} */ (payload).id)
          : '';
      if (!id) break;
      const status =
        payload && typeof payload === 'object' && 'status' in payload
          ? String(/** @type {{ status: unknown }} */ (payload).status)
          : 'joined';
      state.releases = {
        ...state.releases,
        [id]: { joinedAt: new Date().toISOString(), status },
      };
      break;
    }
    default:
      break;
  }

  return writeStreak(state);
}

/** Chip copy — keep short; never blocks checkout. */
function chipCopy(state) {
  if (state.tier === 'none' || state.visitStreak < 1) return null;
  if (state.visitStreak >= 2) return `${state.visitStreak}-day heat`;
  if (state.cartReturns >= 1) return 'Returning bag';
  return null;
}

/** @param {StreakState} state */
export function renderChip(state) {
  const chips = document.querySelectorAll('[data-mt-streak-chip]');
  if (!chips.length) return;
  const copy = chipCopy(state);
  chips.forEach((chip) => {
    if (!(chip instanceof HTMLElement)) return;
    const label = chip.querySelector('[data-mt-streak-label]');
    if (!copy) {
      chip.hidden = true;
      chip.setAttribute('aria-hidden', 'true');
      if (label) label.textContent = '';
      return;
    }
    chip.hidden = false;
    chip.removeAttribute('aria-hidden');
    chip.dataset.mtStreakTier = state.tier;
    if (label) label.textContent = copy;
  });
}

function cartHasItems() {
  const badge = document.querySelector('#cart-drawer .theme-drawer__badge');
  if (badge && !badge.classList.contains('visually-hidden')) {
    const n = Number(badge.textContent?.trim());
    if (Number.isFinite(n) && n > 0) return true;
  }
  return Boolean(document.querySelector('#cart-drawer .cart-items__table-row'));
}

function wireCartReturn() {
  const drawer = document.getElementById('cart-drawer');
  if (!drawer) return;

  const onOpen = () => {
    if (!cartHasItems()) {
      renderChip(readStreak());
      return;
    }
    recordSignal('cart_return');
  };

  drawer.addEventListener('theme-drawer:open', onOpen);
  if (drawer.hasAttribute('open') && cartHasItems()) {
    // Restore path may skip the open event — paint chip only (no double-count).
    renderChip(readStreak());
  }
}

function wireCheckoutHandoff() {
  document.addEventListener(
    'click',
    (event) => {
      const btn = event.target instanceof Element ? event.target.closest('[name="checkout"]') : null;
      if (!btn) return;
      // Record only — never preventDefault. Checkout remains Shopify-hosted.
      recordSignal('checkout_handoff');
    },
    true,
  );
}

/**
 * Boot streak scaffold. Safe to call once per full page load.
 */
export function initStreak() {
  const state = recordSignal('visit');
  applySkin(state);
  renderChip(state);
  wireCartReturn();
  wireCheckoutHandoff();

  document.addEventListener('maison:page-enter', () => {
    renderChip(readStreak());
  });

  document.addEventListener('shopify:section:load', () => {
    renderChip(readStreak());
  });
}

export const streakApi = {
  key: STREAK_KEY,
  read: readStreak,
  write: writeStreak,
  record: recordSignal,
  recordRelease: (id, status = 'joined') => recordSignal('release', { id, status }),
  computeTier,
  renderChip,
  hooks: MaisonStreakHooks,
  /** Documented boundary: theme stops here. */
  checkoutBoundary:
    'Shopify Checkout Extensibility / Thank-you / Order status — not Liquid theme JS',
};

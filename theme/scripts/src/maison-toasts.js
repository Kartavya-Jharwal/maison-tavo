/**
 * Maison toast / edge-nudge layer.
 *
 * Horizon has no visual toast stack — only cart live-regions + drawer.
 * This module adds polite aria-live toasts for commerce feedback and a
 * secondary mailing-list nudge when the primary mail CTA is ignored.
 *
 * Contract with popup-releases / mail page agent:
 *   Handles:  /pages/mail  ·  /pages/releases
 *   Primary:  [data-mt-mail-primary]
 *   Storage:  mt-mail-primary  { shownAt?, dismissedAt?, convertedAt? }
 *             mt-mail-nudge    { shownAt?, dismissedAt?, clickedAt? }
 *             mt-mail-subscribed = '1' on convert
 *   Events:   maison:mail-primary-show | dismiss | convert
 *             maison:toast  { detail: { type, message, href?, label?, duration?, icon? } }
 */

const CART_LINES = 'shopify:cart:lines-update';
const CART_ERROR = 'shopify:cart:error';
const TOAST_EVENT = 'maison:toast';

const LS_PRIMARY = 'mt-mail-primary';
const LS_NUDGE = 'mt-mail-nudge';
const LS_SUBSCRIBED = 'mt-mail-subscribed';
const SS_NUDGE_SESSION = 'mt-mail-nudge-session';
const SS_PAGE_VIEWS = 'mt-mail-nudge-views';
const SS_PRIMARY_IGNORED = 'mt-mail-primary-ignored';

const NUDGE_MIN_VIEWS = 3;
const NUDGE_IDLE_MS = 45000;
const NUDGE_AFTER_DISMISS_MS = 20000;
const PRIMARY_DELAY_MS = 7000;
const TOAST_DEFAULT_MS = 4200;
const TOAST_ERROR_MS = 5600;

const MAIL_HREF = '/pages/mail';

/** @type {HTMLElement | null} */
let host = null;
/** @type {number} */
let toastSeq = 0;
/** @type {ReturnType<typeof setTimeout> | null} */
let nudgeIdleTimer = null;
/** @type {ReturnType<typeof setTimeout> | null} */
let nudgeDelayTimer = null;
let started = false;

function motionReduced() {
  const flag = document.documentElement.dataset.reducedMotion;
  if (flag === 'true') return true;
  if (flag === 'false') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function readJson(key, storage = localStorage) {
  try {
    return JSON.parse(storage.getItem(key) || 'null');
  } catch {
    return null;
  }
}

function writeJson(key, value, storage = localStorage) {
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode */
  }
}

function isSubscribed() {
  try {
    if (localStorage.getItem(LS_SUBSCRIBED) === '1') return true;
  } catch {
    /* ignore */
  }
  const primary = readJson(LS_PRIMARY);
  if (primary?.convertedAt) return true;
  const nudge = readJson(LS_NUDGE);
  if (nudge?.clickedAt) return true;
  return false;
}

function ensureHost() {
  if (host?.isConnected) return host;
  host = document.querySelector('[data-mt-toasts]');
  if (!host) {
    host = document.createElement('div');
    host.className = 'mt-toasts';
    host.setAttribute('data-mt-toasts', '');
    host.setAttribute('aria-live', 'polite');
    host.setAttribute('aria-relevant', 'additions text');
    host.setAttribute('aria-atomic', 'false');
    document.body.appendChild(host);
  }
  return host;
}

function iconHtml(name) {
  const map = {
    bag: 'fa-bag-shopping',
    error: 'fa-circle-exclamation',
    mail: 'fa-envelope',
    check: 'fa-circle-check',
    info: 'fa-circle-info',
  };
  const cls = map[name] || map.info;
  return `<i class="fa-solid ${cls}" aria-hidden="true"></i>`;
}

/**
 * @param {{
 *   type?: 'success' | 'error' | 'info' | 'nudge',
 *   message: string,
 *   href?: string,
 *   label?: string,
 *   duration?: number,
 *   icon?: string,
 *   id?: string,
 *   onDismiss?: () => void,
 * }} opts
 */
export function showToast(opts) {
  const {
    type = 'info',
    message,
    href,
    label,
    duration = type === 'error' ? TOAST_ERROR_MS : TOAST_DEFAULT_MS,
    icon,
    id,
    onDismiss,
  } = opts;
  if (!message) return null;

  const root = ensureHost();
  const el = document.createElement('div');
  const toastId = id || `mt-toast-${++toastSeq}`;
  el.id = toastId;
  el.className = `mt-toast mt-toast--${type}`;
  el.setAttribute('data-mt-toast', type);
  el.setAttribute('role', type === 'error' ? 'alert' : 'status');
  // Nested live region: errors assertive, everything else polite. Do not steal focus.
  el.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
  el.setAttribute('aria-atomic', 'true');

  const iconName = icon || (type === 'success' ? 'check' : type === 'error' ? 'error' : type === 'nudge' ? 'mail' : 'info');

  const action =
    href
      ? `<a class="mt-toast__action" href="${href}" data-mt-toast-action>${label || 'Open'}</a>`
      : '';

  el.innerHTML = `
    <span class="mt-toast__icon">${iconHtml(iconName)}</span>
    <span class="mt-toast__body">
      <span class="mt-toast__message">${escapeHtml(message)}</span>
      ${action}
    </span>
    <button type="button" class="mt-toast__dismiss" aria-label="Dismiss notification" data-mt-toast-dismiss>
      <i class="fa-solid fa-xmark" aria-hidden="true"></i>
    </button>
  `;

  if (motionReduced()) {
    el.dataset.static = 'true';
  }

  const dismiss = () => {
    if (!el.isConnected) return;
    el.dataset.leaving = 'true';
    const remove = () => {
      el.remove();
      onDismiss?.();
    };
    if (motionReduced()) {
      remove();
      return;
    }
    window.setTimeout(remove, 280);
  };

  el.querySelector('[data-mt-toast-dismiss]')?.addEventListener('click', dismiss);
  el.querySelector('[data-mt-toast-action]')?.addEventListener('click', () => {
    onDismiss?.();
  });

  root.appendChild(el);

  if (duration > 0) {
    window.setTimeout(dismiss, duration);
  }

  return { id: toastId, dismiss, el };
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function cartAddCopy(itemCount) {
  const n = Number(itemCount) || 1;
  const t = window.Theme?.translations || {};
  if (n === 1 && t.items_added_to_cart_one) return t.items_added_to_cart_one;
  if (t.items_added_to_cart_other) {
    return String(t.items_added_to_cart_other).replace('{{ count }}', String(n));
  }
  if (n === 1) return '1 piece added to bag';
  return `${n} pieces added to bag`;
}

function bindCommerceToasts() {
  document.addEventListener(CART_LINES, (event) => {
    const detail = event.detail || {};
    const action = detail.action || event.action;
    if (action && action !== 'add') return;

    const promise = event.promise || detail.promise;
    if (promise?.then) {
      promise
        .then((result) => {
          if (result?.detail?.didError) return;
          const count = result?.detail?.itemCount || detail.lines?.length || 1;
          showToast({
            type: 'success',
            icon: 'bag',
            message: cartAddCopy(count),
          });
        })
        .catch(() => {
          /* AbortError / network — cart:error handles visible failures */
        });
      return;
    }

    showToast({
      type: 'success',
      icon: 'bag',
      message: cartAddCopy(detail.itemCount || 1),
    });
  });

  document.addEventListener(CART_ERROR, (event) => {
    const detail = event.detail || {};
    const message =
      detail.error ||
      detail.message ||
      detail.description ||
      window.Theme?.translations?.add_to_cart_error ||
      'Could not add that piece to the bag';
    showToast({ type: 'error', message: String(message) });
  });

  document.addEventListener(TOAST_EVENT, (event) => {
    const detail = event.detail || {};
    if (!detail.message) return;
    showToast(detail);
  });
}

function onMailPage() {
  const path = location.pathname.replace(/\/$/, '');
  return path.endsWith('/pages/mail') || path.endsWith('/pages/list');
}

function primaryIgnored() {
  try {
    if (sessionStorage.getItem(SS_PRIMARY_IGNORED) === '1') return true;
  } catch {
    /* ignore */
  }
  const primary = readJson(LS_PRIMARY);
  return Boolean(primary?.dismissedAt && !primary?.convertedAt);
}

function markPrimaryIgnored() {
  try {
    sessionStorage.setItem(SS_PRIMARY_IGNORED, '1');
  } catch {
    /* ignore */
  }
  const prev = readJson(LS_PRIMARY) || {};
  if (!prev.dismissedAt) {
    writeJson(LS_PRIMARY, { ...prev, dismissedAt: new Date().toISOString() });
  }
}

function nudgeEligible() {
  if (isSubscribed() || onMailPage()) return false;
  const nudge = readJson(LS_NUDGE);
  if (nudge?.dismissedAt || nudge?.shownAt) return false;
  try {
    if (sessionStorage.getItem(SS_NUDGE_SESSION) === '1') return false;
  } catch {
    /* ignore */
  }
  if (!primaryIgnored()) return false;
  // Avoid stacking over open primary popup / profiler / release dialog.
  if (document.querySelector('[data-mt-mail-primary]:not([hidden])')) return false;
  if (document.querySelector('[data-mt-profiler]:not([hidden])')) return false;
  if (
    document.querySelector(
      '[data-mt-release-dialog][open], [data-mt-releases-popup][open], [data-mt-releases-popup]:not([hidden])',
    )
  ) {
    return false;
  }
  return true;
}

function showMailNudge() {
  if (!nudgeEligible()) return;

  try {
    sessionStorage.setItem(SS_NUDGE_SESSION, '1');
  } catch {
    /* ignore */
  }
  writeJson(LS_NUDGE, {
    ...(readJson(LS_NUDGE) || {}),
    shownAt: new Date().toISOString(),
  });

  showToast({
    type: 'nudge',
    icon: 'mail',
    message: 'Join the list for the next heat cycle.',
    href: MAIL_HREF,
    label: 'Open mail',
    duration: 10000,
    onDismiss: () => {
      writeJson(LS_NUDGE, {
        ...(readJson(LS_NUDGE) || {}),
        dismissedAt: new Date().toISOString(),
      });
    },
  });

  document.dispatchEvent(new CustomEvent('maison:mail-nudge-show'));
}

function bumpPageViews() {
  let views = 0;
  try {
    views = Number(sessionStorage.getItem(SS_PAGE_VIEWS) || 0) + 1;
    sessionStorage.setItem(SS_PAGE_VIEWS, String(views));
  } catch {
    views = 1;
  }
  if (views >= NUDGE_MIN_VIEWS && primaryIgnored()) {
    scheduleNudge(800);
  }
}

function scheduleNudge(delayMs = NUDGE_AFTER_DISMISS_MS) {
  if (nudgeDelayTimer) clearTimeout(nudgeDelayTimer);
  nudgeDelayTimer = setTimeout(() => {
    if (nudgeEligible()) showMailNudge();
  }, delayMs);
}

function armIdleNudge() {
  if (nudgeIdleTimer) clearTimeout(nudgeIdleTimer);
  if (!primaryIgnored() || !nudgeEligible()) return;

  const reset = () => {
    if (nudgeIdleTimer) clearTimeout(nudgeIdleTimer);
    nudgeIdleTimer = setTimeout(() => {
      if (nudgeEligible()) showMailNudge();
    }, NUDGE_IDLE_MS);
  };

  ['pointerdown', 'keydown', 'scroll', 'touchstart'].forEach((name) => {
    window.addEventListener(name, reset, { passive: true, capture: true });
  });
  reset();
}

function bindMailNudge() {
  document.addEventListener('maison:mail-primary-show', () => {
    const prev = readJson(LS_PRIMARY) || {};
    writeJson(LS_PRIMARY, { ...prev, shownAt: prev.shownAt || new Date().toISOString() });
  });

  document.addEventListener('maison:mail-primary-dismiss', () => {
    markPrimaryIgnored();
    scheduleNudge(NUDGE_AFTER_DISMISS_MS);
    armIdleNudge();
  });

  document.addEventListener('maison:mail-primary-convert', () => {
    try {
      localStorage.setItem(LS_SUBSCRIBED, '1');
    } catch {
      /* ignore */
    }
    const prev = readJson(LS_PRIMARY) || {};
    writeJson(LS_PRIMARY, { ...prev, convertedAt: new Date().toISOString() });
  });

  // Observe primary popup dismiss via close controls if the other agent marks them.
  document.addEventListener(
    'click',
    (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest('[data-mt-mail-primary-dismiss], [data-mt-mail-primary] [data-dismiss], [data-mt-mail-primary] [data-close]')) {
        markPrimaryIgnored();
        scheduleNudge(NUDGE_AFTER_DISMISS_MS);
        armIdleNudge();
        return;
      }
      if (target.closest('[data-mt-toast-action][href*="/pages/mail"]')) {
        writeJson(LS_NUDGE, {
          ...(readJson(LS_NUDGE) || {}),
          clickedAt: new Date().toISOString(),
        });
      }
    },
    true,
  );

  // Shopify customer newsletter forms (mail page + footer).
  document.addEventListener('submit', (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    if (!form.querySelector('input[name="contact[tags]"][value="newsletter"]')) return;
    try {
      localStorage.setItem(LS_SUBSCRIBED, '1');
    } catch {
      /* ignore */
    }
    document.dispatchEvent(new CustomEvent('maison:mail-primary-convert'));
  });

  bumpPageViews();
  if (primaryIgnored()) {
    scheduleNudge(NUDGE_AFTER_DISMISS_MS);
    armIdleNudge();
  }

  document.addEventListener('maison:page-enter', () => {
    bumpPageViews();
  });

  document.addEventListener('maison:page-leave', () => {
    const openPrimary = document.querySelector('[data-mt-mail-primary]:not([hidden])');
    if (!openPrimary || isSubscribed()) return;
    openPrimary.hidden = true;
    delete openPrimary.dataset.open;
    let engaging = false;
    try {
      engaging = sessionStorage.getItem('mt-mail-primary-engaging') === '1';
      sessionStorage.removeItem('mt-mail-primary-engaging');
    } catch {
      /* ignore */
    }
    // Navigating into the mail room is engagement, not an ignore.
    if (engaging) return;
    document.dispatchEvent(new CustomEvent('maison:mail-primary-dismiss'));
  });
}

function releaseDialogOpen() {
  return Boolean(document.querySelector('[data-mt-release-dialog][open]'));
}

function splashOpen() {
  return Boolean(document.querySelector('.splash-intro[open], dialog.splash-intro[open]'));
}

/**
 * Fallback primary mail CTA when the mail/releases agent has not mounted one.
 * Uses contracted `[data-mt-mail-primary]` so secondary nudge timing stays shared.
 */
function initPrimaryMailInvite() {
  if (isSubscribed() || onMailPage()) return;

  const primaryState = readJson(LS_PRIMARY);
  if (primaryState?.dismissedAt || primaryState?.convertedAt) return;

  const existing = document.querySelector('[data-mt-mail-primary]');
  if (existing && !existing.hasAttribute('data-mt-mail-primary-fallback')) {
    // External primary owns show/dismiss events.
    return;
  }

  if (primaryState?.shownAt) {
    // Offered once already without convert — unlock secondary path.
    markPrimaryIgnored();
    return;
  }

  let invite = existing;
  if (!invite) {
    invite = document.querySelector('[data-mt-mail-primary-fallback]');
  }
  if (!invite) return;

  const open = () => {
    if (!invite || invite.dataset.open === 'true') return;
    if (isSubscribed() || onMailPage() || releaseDialogOpen() || splashOpen()) return;
    if (document.querySelector('[data-mt-profiler]:not([hidden])')) return;
    invite.hidden = false;
    invite.dataset.open = 'true';
    const prev = readJson(LS_PRIMARY) || {};
    writeJson(LS_PRIMARY, { ...prev, shownAt: new Date().toISOString() });
    document.dispatchEvent(new CustomEvent('maison:mail-primary-show'));
  };

  const dismiss = () => {
    if (!invite || invite.hidden) return;
    invite.hidden = true;
    delete invite.dataset.open;
    document.dispatchEvent(new CustomEvent('maison:mail-primary-dismiss'));
  };

  invite.querySelectorAll('[data-mt-mail-primary-dismiss]').forEach((btn) => {
    btn.addEventListener('click', dismiss);
  });
  invite.querySelector('[data-mt-mail-primary-join]')?.addEventListener('click', () => {
    try {
      sessionStorage.setItem('mt-mail-primary-engaging', '1');
    } catch {
      /* ignore */
    }
    writeJson(LS_NUDGE, {
      ...(readJson(LS_NUDGE) || {}),
      clickedAt: new Date().toISOString(),
    });
  });

  window.setTimeout(() => {
    if (splashOpen()) {
      const splash = document.querySelector('.splash-intro');
      splash?.addEventListener(
        'close',
        () => window.setTimeout(open, 1200),
        { once: true },
      );
      return;
    }
    open();
  }, PRIMARY_DELAY_MS);
}

/**
 * Wire silent Maison surfaces that previously had no toast feedback.
 * Last-call waitlist dispatches `maison:toast` + `maison:mail-primary-convert`
 * from its section script (avoid double-firing here).
 */
function bindSilentMaisonEvents() {
  // Mail page success after Shopify customer form round-trip.
  if (onMailPage() && document.getElementById('MaisonMailSuccess')) {
    document.dispatchEvent(new CustomEvent('maison:mail-primary-convert'));
    showToast({
      type: 'success',
      icon: 'mail',
      message: document.getElementById('MaisonMailSuccess')?.textContent?.trim() || 'You are on the list.',
    });
  }
}

export function initMaisonToasts() {
  if (started || typeof document === 'undefined') return;
  started = true;
  ensureHost();
  bindCommerceToasts();
  bindMailNudge();
  bindSilentMaisonEvents();
  initPrimaryMailInvite();
}

export const MaisonToast = {
  show: showToast,
  init: initMaisonToasts,
};

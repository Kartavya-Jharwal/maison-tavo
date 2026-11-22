/** Commerce and confirmed newsletter feedback. */

const CART_LINES = 'shopify:cart:lines-update';
const CART_ERROR = 'shopify:cart:error';
const TOAST_EVENT = 'maison:toast';

const LS_SUBSCRIBED = 'mt-mail-subscribed';

/** @type {HTMLElement | null} */
let host = null;
/** @type {number} */
let toastSeq = 0;
let started = false;
/** @type {Element | null} */
let focusBeforeNotifications = null;

function motionReduced() {
  const flag = document.documentElement.dataset.reducedMotion;
  if (flag === 'true') return true;
  if (flag === 'false') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
    icon,
    id,
    onDismiss,
  } = opts;
  if (!message) return null;

  const root = ensureHost();
  if (!root.contains(document.activeElement)) focusBeforeNotifications = document.activeElement;
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
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path d="M5 5l14 14M19 5L5 19" fill="none" stroke="currentColor" stroke-width="2"/></svg>
    </button>
  `;

  if (motionReduced()) {
    el.dataset.static = 'true';
  }

  const dismiss = () => {
    if (!el.isConnected || el.dataset.leaving === 'true') return;
    if (el.contains(document.activeElement)) {
      const nextDismiss = Array.from(root.querySelectorAll('[data-mt-toast]:not([data-leaving="true"]) [data-mt-toast-dismiss]'))
        .find((button) => !el.contains(button));
      if (nextDismiss instanceof HTMLElement) nextDismiss.focus();
      else if (focusBeforeNotifications instanceof HTMLElement && focusBeforeNotifications.isConnected) focusBeforeNotifications.focus();
    }
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

function bindNewsletterFeedback() {
  const markSubscribed = () => {
    try { localStorage.setItem(LS_SUBSCRIBED, '1'); } catch { /* Storage unavailable. */ }
  };
  document.addEventListener('maison:mail-primary-convert', markSubscribed);
  const success = document.querySelector('[data-mt-newsletter-success], #MaisonMailSuccess');
  if (!success) return;
  markSubscribed();
  if (!success.closest('dialog')) showToast({ type: 'success', icon: 'mail', message: success.textContent.trim() });
}

export function initMaisonToasts() {
  if (started || typeof document === 'undefined') return;
  started = true;
  ensureHost();
  bindCommerceToasts();
  bindNewsletterFeedback();
}

export const MaisonToast = {
  show: showToast,
  init: initMaisonToasts,
};

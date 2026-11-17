import { createStore } from 'zustand/vanilla';

export const KANSA_STORAGE_KEY = 'mt_kansa_session';

/**
 * @typedef {{
 *  handle: string | null,
 *  activeTab: string,
 *  messages: Array<{ role: string, text?: string, tag?: string, tools?: string[], activity?: string }>,
 *  followUps: string[],
 * }} KansaSession
 */

/** @returns {KansaSession} */
function emptySession() {
  return { handle: null, activeTab: 'chat', messages: [], followUps: [] };
}

function readPersisted() {
  try {
    const raw = localStorage.getItem(KANSA_STORAGE_KEY);
    if (!raw) return emptySession();
    const parsed = JSON.parse(raw);
    return {
      handle: parsed.handle || null,
      activeTab: parsed.activeTab || 'chat',
      messages: Array.isArray(parsed.messages) ? parsed.messages.slice(-40) : [],
      followUps: Array.isArray(parsed.followUps) ? parsed.followUps : [],
    };
  } catch {
    return emptySession();
  }
}

function persist(state) {
  try {
    localStorage.setItem(
      KANSA_STORAGE_KEY,
      JSON.stringify({
        handle: state.handle,
        activeTab: state.activeTab,
        messages: state.messages.slice(-40),
        followUps: state.followUps,
        updatedAt: Date.now(),
      }),
    );
  } catch {
    /* quota */
  }
}

export const kansaStore = createStore((set, get) => ({
  ...readPersisted(),
  setHandle(handle) {
    set({ handle, messages: [], followUps: [] });
    persist(get());
  },
  setTab(activeTab) {
    set({ activeTab });
    persist(get());
  },
  setMessages(messages, followUps = []) {
    set({ messages, followUps });
    persist(get());
  },
  pushMessage(message, followUps) {
    const messages = [...get().messages, message].slice(-40);
    const nextFollow = followUps !== undefined ? followUps : get().followUps;
    set({ messages, followUps: nextFollow });
    persist(get());
  },
  resetThread() {
    set({ messages: [], followUps: [] });
    persist(get());
  },
}));

export function soundEnabled() {
  try {
    return localStorage.getItem('maison:sound-enabled') === 'true';
  } catch {
    return false;
  }
}

export function motionReduced() {
  return (
    document.documentElement.dataset.reducedMotion === 'true' ||
    window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
  );
}

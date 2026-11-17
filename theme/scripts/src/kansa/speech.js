/**
 * D9 — replaceable speech adapters (Web Speech now; Realtime later).
 */

/** @typedef {{ start: () => void, stop: () => void, onResult: (cb: (text: string) => void) => void, onError: (cb: (err: string) => void) => void, onEnd: (cb: () => void) => void, supported: boolean }} SpeechRecognitionInterface */

/** @typedef {{ speak: (text: string) => void, cancel: () => void, supported: boolean }} SpeechSynthesisInterface */

/** @returns {SpeechRecognitionInterface} */
export function createWebSpeechRecognition() {
  const SR = typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null;
  /** @type {((text: string) => void) | null} */
  let resultCb = null;
  /** @type {((err: string) => void) | null} */
  let errorCb = null;
  /** @type {(() => void) | null} */
  let endCb = null;
  /** @type {SpeechRecognition | null} */
  let recognition = null;

  if (SR) {
    recognition = new SR();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.onresult = (e) => {
      const text = e.results?.[0]?.[0]?.transcript || '';
      if (resultCb) resultCb(text);
    };
    recognition.onerror = (e) => {
      if (errorCb) errorCb(String(e.error || 'error'));
    };
    recognition.onend = () => {
      if (endCb) endCb();
    };
  }

  return {
    supported: Boolean(recognition),
    onResult(cb) {
      resultCb = cb;
    },
    onError(cb) {
      errorCb = cb;
    },
    onEnd(cb) {
      endCb = cb;
    },
    start() {
      if (!recognition) {
        if (errorCb) errorCb('Voice recognition needs Chrome, Safari, or Edge over HTTPS.');
        return;
      }
      try {
        recognition.start();
      } catch {
        /* already started */
      }
    },
    stop() {
      try {
        recognition?.stop();
      } catch {
        /* ignore */
      }
    },
  };
}

/** @returns {SpeechSynthesisInterface} */
export function createWebSpeechSynthesis() {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  return {
    supported,
    cancel() {
      if (supported) window.speechSynthesis.cancel();
    },
    speak(text) {
      if (!supported) return;
      try {
        window.speechSynthesis.cancel();
        const clean = String(text || '')
          .replace(/<[^>]+>/g, '')
          .replace(/[#*_`]/g, '');
        const utterance = new SpeechSynthesisUtterance(clean);
        utterance.rate = 0.95;
        utterance.pitch = 0.95;
        const voices = window.speechSynthesis.getVoices();
        const natural = voices.find(
          (v) =>
            v.lang.startsWith('en') &&
            (v.name.includes('Natural') ||
              v.name.includes('Premium') ||
              v.name.includes('Google') ||
              v.name.includes('Alex')),
        );
        if (natural) utterance.voice = natural;
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.debug('SpeechSynthesis notice:', err);
      }
    },
  };
}

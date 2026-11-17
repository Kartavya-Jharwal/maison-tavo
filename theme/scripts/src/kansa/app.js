import gsap from 'gsap';
import { loadCatalog } from './catalog.js';
import { matchIntent, buildFixtureAnswer, thermalMatrix, activityFor } from './engine.js';
import { remediesFor, suggestRemedyFromCues } from './remedies.js';
import { createWebSpeechRecognition, createWebSpeechSynthesis } from './speech.js';
import { kansaStore, soundEnabled, motionReduced } from './store.js';
import { CV_CONFIRM_CHIPS } from './fixtures.js';

const ALL_HEAT = ['induction', 'gas', 'electric', 'oven', 'open_flame'];

function preferReducedMotion() {
  return motionReduced();
}

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * @param {HTMLElement} root
 */
export class KansaApp {
  /**
   * @param {HTMLElement} root
   * @param {{ byHandle: Record<string, import('./catalog.js').KansaPiece>, list: import('./catalog.js').KansaPiece[] }} catalog
   */
  constructor(root, catalog) {
    this.root = root;
    this.byHandle = catalog.byHandle;
    this.list = catalog.list;
    this.listening = false;
    this.error = null;
    this.unknownHandle = null;
    this.cvSuggestion = null;
    this.cvStep = 'capture'; // capture | confirm
    this.activity = null;
    this.composerDraft = '';
    this.abortTalk = null;

    const session = kansaStore.getState();
    this.activeTab = session.activeTab || 'chat';
    this.messages = session.messages || [];
    this.followUps = session.followUps || [];

    const params = new URLSearchParams(window.location.search);
    const pieceParam = params.get('piece');

    if (pieceParam) {
      if (this.byHandle[pieceParam]) {
        this.selectedPiece = this.byHandle[pieceParam];
        kansaStore.getState().setHandle(pieceParam);
        this.messages = [];
        this.followUps = [];
      } else {
        this.unknownHandle = pieceParam;
        this.selectedPiece = null;
      }
    } else if (session?.handle && this.byHandle[session.handle]) {
      this.selectedPiece = this.byHandle[session.handle];
    } else {
      this.selectedPiece =
        this.byHandle['forge-relay-dual-mass-skillet'] || this.list[0] || null;
      if (this.selectedPiece) kansaStore.getState().setHandle(this.selectedPiece.handle);
    }

    this.speechIn = createWebSpeechRecognition();
    this.speechOut = createWebSpeechSynthesis();
    this.speechIn.onResult((text) => {
      this.listening = false;
      this.processQuery(text);
    });
    this.speechIn.onError((err) => {
      this.listening = false;
      this.error = `Speech input: ${err}`;
      this.render();
    });
    this.speechIn.onEnd(() => {
      this.listening = false;
      this.render();
    });

    this.syncUrl();
    this.render();
    this.hideSsrJobs();
    this.consumeBootQuery(params);
  }

  /**
   * Honour SSR job links and ?q= search without requiring a second navigation.
   * @param {URLSearchParams} params
   */
  consumeBootQuery(params) {
    const job = params.get('job');
    const q = params.get('q');
    /** @type {Record<string, string>} */
    const jobMap = {
      season: 'How do I season this piece?',
      heat: 'What are the heat sources for this piece?',
      acid: 'Can I cook tomato or wine in this?',
      triage: 'Something is wrong with the surface',
      ar: 'Show me this piece in AR',
      look: 'Look at a photo of my pan',
      ritual: 'Take me to the care rites',
    };
    const bootQ = q || (job && jobMap[job]) || '';
    if (!bootQ) return;
    // Clean job/q from URL after consuming (keep piece)
    const url = new URL(window.location.href);
    url.searchParams.delete('job');
    url.searchParams.delete('q');
    history.replaceState({}, '', url);
    if (job === 'ar') {
      this.activeTab = 'ar';
      this.render();
      this.ensureModelViewer();
      return;
    }
    if (job === 'look') {
      this.activeTab = 'look';
      this.render();
      return;
    }
    if (job === 'ritual') {
      this.jumpToCare(this.selectedPiece?.ritualTrack);
      return;
    }
    this.processQuery(bootQ);
  }

  hideSsrJobs() {
    const ssr = document.querySelector('[data-kansa-ssr]');
    if (ssr) ssr.hidden = true;
  }

  syncUrl() {
    const url = new URL(window.location.href);
    if (this.selectedPiece) {
      url.searchParams.set('piece', this.selectedPiece.handle);
    } else if (this.unknownHandle) {
      url.searchParams.set('piece', this.unknownHandle);
    } else {
      url.searchParams.delete('piece');
    }
    history.replaceState({}, '', url);
  }

  persist() {
    kansaStore.setState({
      handle: this.selectedPiece?.handle || null,
      activeTab: this.activeTab,
    });
    kansaStore.getState().setTab(this.activeTab);
    kansaStore.getState().setMessages(this.messages, this.followUps);
  }

  selectPiece(handle) {
    if (!this.byHandle[handle]) return;
    this.selectedPiece = this.byHandle[handle];
    this.unknownHandle = null;
    this.messages = [];
    this.followUps = [];
    this.cvSuggestion = null;
    this.cvStep = 'capture';
    this.activity = null;
    kansaStore.getState().setHandle(handle);
    this.syncUrl();
    this.render();
    this.revealStage();
  }

  startListening() {
    if (!this.speechIn.supported) {
      this.error = 'Voice recognition needs Chrome, Safari, or Edge over HTTPS.';
      this.render();
      return;
    }
    this.listening = true;
    this.error = null;
    this.render();
    this.speechIn.start();
  }

  /**
   * @param {string} query
   */
  processQuery(query) {
    if (!query || !query.trim()) return;
    if (this.abortTalk) {
      clearTimeout(this.abortTalk);
      this.abortTalk = null;
    }

    const userText = query.trim();
    this.messages.push({ role: 'user', text: userText });
    this.composerDraft = '';

    const { intent, confidence } = matchIntent(userText);
    const intentId = intent && confidence >= 0.35 ? intent : 'default';
    const meta = activityFor(intentId === 'default' ? 'default' : intentId);
    this.activity = meta.activity;
    this.render();

    const fixture = buildFixtureAnswer(
      this.selectedPiece,
      intentId === 'default' ? '' : intentId,
    );

    this.abortTalk = window.setTimeout(() => {
      this.activity = null;
      this.pushAssistant(fixture);

      if (fixture.tools?.includes('check_heat') && intentId === 'heat_check') {
        /* keep chat; tool card embeds thermal */
      }
      if (fixture.tools?.includes('open_ar') && intentId === 'ar_place') this.activeTab = 'ar';
      if (fixture.tools?.includes('cv_triage') && intentId === 'cv_triage') this.activeTab = 'look';
      if (fixture.tools?.includes('open_triage') && intentId === 'triage') {
        /* stay in chat with triage tool card */
      }

      this.persist();
      this.render();
      this.animateAnswer();
      if (soundEnabled() && !preferReducedMotion()) {
        this.speechOut.speak(fixture.text);
      }
      this.abortTalk = null;
    }, preferReducedMotion() ? 0 : 280);
  }

  /**
   * @param {{ tag: string, text: string, tools: string[], followUps: string[] }} fixture
   */
  pushAssistant(fixture) {
    this.messages.push({
      role: 'assistant',
      tag: fixture.tag,
      text: fixture.text,
      tools: fixture.tools || [],
    });
    this.followUps = fixture.followUps || [];
  }

  fillComposer(text) {
    this.composerDraft = text;
    this.render();
    const input = this.root.querySelector('#kansa-text-field');
    if (input) {
      input.value = text;
      input.focus();
      input.setSelectionRange(text.length, text.length);
    }
  }

  animateAnswer() {
    if (preferReducedMotion()) return;
    const card = this.root.querySelector('.kansa-msg--assistant:last-child');
    if (card) {
      gsap.fromTo(card, { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'power2.out' });
    }
  }

  revealStage() {
    if (preferReducedMotion()) return;
    const stage = this.root.querySelector('.kansa-stage');
    if (stage) {
      gsap.fromTo(stage, { autoAlpha: 0.65 }, { autoAlpha: 1, duration: 0.35, ease: 'power2.out' });
    }
  }

  /**
   * Generative tool cards beside answers (plan Amendment I).
   * @param {string[]} tools
   */
  renderToolCards(tools) {
    const p = this.selectedPiece;
    if (!tools?.length) return '';
    const cards = [];
    for (const t of tools.slice(0, 3)) {
      if (t === 'check_heat' && p) {
        const rows = thermalMatrix(p).filter((r) => r.status === 'compatible');
        cards.push(`
          <button type="button" class="kansa-tool-card" data-tool="check_heat">
            <span class="kansa-tool-card__kicker">Heat</span>
            <span class="kansa-tool-card__body">${
              rows.length
                ? escapeHtml(rows.map((r) => r.source.replace('_', ' ')).join(' · '))
                : 'Open thermal matrix'
            }</span>
          </button>`);
      } else if (t === 'open_care_ritual') {
        cards.push(`
          <button type="button" class="kansa-tool-card" data-tool="open_care_ritual">
            <span class="kansa-tool-card__kicker">Rites</span>
            <span class="kansa-tool-card__body">Full ${escapeHtml(
              p?.ritualTrack === 'clay' ? 'clay' : 'metal',
            )} care covenant</span>
          </button>`);
      } else if (t === 'link_product' || t === 'lookup_piece') {
        cards.push(`
          <a class="kansa-tool-card" data-tool="link_product" href="${escapeHtml(
            p?.productUrl || '#',
          )}">
            <span class="kansa-tool-card__kicker">Product</span>
            <span class="kansa-tool-card__body">${escapeHtml(
              p?.title || 'View in catalogue',
            )} — add to bag on the PDP</span>
          </a>`);
      } else if (t === 'open_triage') {
        cards.push(`
          <button type="button" class="kansa-tool-card" data-tool="open_triage">
            <span class="kansa-tool-card__kicker">Triage</span>
            <span class="kansa-tool-card__body">Surface restoration cards</span>
          </button>`);
      } else if (t === 'open_ar') {
        cards.push(`
          <button type="button" class="kansa-tool-card" data-tool="open_ar">
            <span class="kansa-tool-card__kicker">Sight</span>
            <span class="kansa-tool-card__body">Place the piece in the room</span>
          </button>`);
      } else if (t === 'cv_triage') {
        cards.push(`
          <button type="button" class="kansa-tool-card" data-tool="cv_triage">
            <span class="kansa-tool-card__kicker">Look</span>
            <span class="kansa-tool-card__body">Photograph the cooking surface</span>
          </button>`);
      }
    }
    return cards.length ? `<div class="kansa-tool-cards">${cards.join('')}</div>` : '';
  }

  jumpToCare(track) {
    const t = track || this.selectedPiece?.ritualTrack || 'metal';
    window.location.href = `/pages/care?track=${encodeURIComponent(t)}#care-ritual`;
  }

  runTool(toolId) {
    const p = this.selectedPiece;
    switch (toolId) {
      case 'check_heat':
        this.activeTab = 'thermal';
        this.render();
        break;
      case 'open_care_ritual':
        this.jumpToCare(p?.ritualTrack);
        break;
      case 'open_triage':
        this.activeTab = 'diagnostic';
        this.render();
        break;
      case 'open_ar':
        this.activeTab = 'ar';
        this.render();
        this.ensureModelViewer();
        break;
      case 'cv_triage':
        this.activeTab = 'look';
        this.render();
        break;
      case 'link_product':
      case 'lookup_piece':
        if (p?.productUrl) window.location.href = p.productUrl;
        break;
      default:
        break;
    }
  }

  ensureModelViewer() {
    if (customElements.get('model-viewer')) return;
    const existing = document.querySelector('script[data-kansa-model-viewer]');
    if (existing) return;
    const s = document.createElement('script');
    s.type = 'module';
    s.dataset.kansaModelViewer = '1';
    s.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js';
    document.head.appendChild(s);
  }

  /**
   * Guided CV: sample average colour from uploaded image.
   * @param {File} file
   */
  async analysePhoto(file) {
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = reject;
        i.src = url;
      });
      const canvas = document.createElement('canvas');
      const size = 64;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, size, size);
      const { data } = ctx.getImageData(0, 0, size, size);
      let r = 0;
      let g = 0;
      let b = 0;
      let n = 0;
      for (let i = 0; i < data.length; i += 4) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        n += 1;
      }
      const cues = {
        avgR: r / n,
        avgG: g / n,
        avgB: b / n,
        materialCategory: this.selectedPiece?.materialCategory || 'metal',
      };
      const key = suggestRemedyFromCues(cues);
      this.cvSuggestion = { key, posterUrl: url, cues };
      this.render();
    } catch (err) {
      this.error = 'Could not read that image. Try another photo.';
      URL.revokeObjectURL(url);
      this.render();
    }
  }

  confirmCvRemedy() {
    if (!this.cvSuggestion) return;
    const remedies = remediesFor(this.selectedPiece?.materialCategory || 'metal');
    const rem = remedies[this.cvSuggestion.key];
    if (!rem) return;
    this.pushAssistant({
      tag: 'LOOK · TRIAGE',
      text: `${rem.label}. Cause: ${rem.cause} Remedy: ${rem.fix}`,
      tools: ['open_care_ritual'],
      followUps: ['Show care rites', 'Heat sources?'],
    });
    this.activeTab = 'chat';
    this.cvSuggestion = null;
    this.persist();
    this.render();
    if (soundEnabled() && !preferReducedMotion()) this.speechOut.speak(rem.fix);
  }

  copyLastAnswer() {
    const last = [...this.messages].reverse().find((m) => m.role === 'assistant');
    if (!last?.text) return;
    navigator.clipboard?.writeText(last.text).catch(() => {});
  }

  jobsForPiece() {
    const p = this.selectedPiece;
    const isClay = p?.materialCategory === 'clay';
    return [
      {
        id: 'care_season',
        label: isClay ? 'Water cure' : 'Season',
        lede: isClay ? 'Hydrate the clay before heat.' : 'Build the dark glass patina.',
        q: isClay ? 'How do I water cure this clay vessel?' : 'How do I season this pan?',
      },
      {
        id: 'heat_check',
        label: 'Heat',
        lede: 'What this piece may take.',
        q: 'What are the heat sources for this piece?',
      },
      {
        id: 'triage',
        label: 'Surface',
        lede: 'When the finish feels wrong.',
        q: 'Something is wrong with the surface',
      },
      {
        id: 'ritual',
        label: 'Rites',
        lede: 'The full care covenant.',
        q: 'Take me to the care rites',
      },
    ];
  }

  render() {
    const p = this.selectedPiece;
    const isClay = p?.materialCategory === 'clay';
    const remedies = remediesFor(p?.materialCategory || 'metal');
    const jobs = this.jobsForPiece();
    const lineups = [...new Set(this.list.map((x) => x.lineup))];

    this.root.innerHTML = `
      <div class="kansa-chamber" data-kansa-app>
        ${
          this.unknownHandle
            ? `<div class="kansa-error-banner" role="status">Unknown piece “${escapeHtml(
                this.unknownHandle,
              )}”. Choose another from the catalogue.</div>`
            : ''
        }

        <header class="kansa-piece-bar">
          <div class="kansa-piece-bar__copy">
            <p class="kansa-eyebrow">The piece in hand</p>
            <p class="kansa-piece-bar__title">${escapeHtml(p?.title || 'Choose a piece')}</p>
            ${
              p
                ? `<p class="kansa-piece-bar__meta">${escapeHtml(p.lineup)}${
                    p.materialCategory ? ` · ${escapeHtml(p.materialCategory)}` : ''
                  }</p>`
                : ''
            }
          </div>
          <label class="kansa-select-wrap">
            <span class="visually-hidden">Select cookware piece</span>
            <select class="kansa-select" id="kansa-piece-select">
              ${lineups
                .map((lineup) => {
                  const items = this.list.filter((x) => x.lineup === lineup);
                  return `<optgroup label="${escapeHtml(lineup)}">${items
                    .map(
                      (item) =>
                        `<option value="${escapeHtml(item.handle)}" ${
                          p && item.handle === p.handle ? 'selected' : ''
                        }>${escapeHtml(item.title)}</option>`,
                    )
                    .join('')}</optgroup>`;
                })
                .join('')}
            </select>
          </label>
        </header>

        <nav class="kansa-mode-nav" role="tablist" aria-label="Kansa modes">
          ${[
            ['chat', 'Ask'],
            ['thermal', 'Heat'],
            ['diagnostic', 'Triage'],
            ['specs', 'Spec'],
            ['ar', 'Sight'],
            ['look', 'Look'],
          ]
            .map(
              ([id, label]) => `
            <button type="button" role="tab" class="kansa-mode-btn ${
              this.activeTab === id ? 'is-active' : ''
            }" data-tab="${id}" aria-selected="${this.activeTab === id}">${label}</button>`,
            )
            .join('')}
        </nav>

        <div class="kansa-stage">
          ${this.activeTab === 'chat' ? this.renderChat(jobs) : ''}
          ${this.activeTab === 'thermal' && p ? this.renderThermal(p) : ''}
          ${this.activeTab === 'diagnostic' ? this.renderDiagnostic(remedies, isClay) : ''}
          ${this.activeTab === 'specs' && p ? this.renderSpecs(p) : ''}
          ${this.activeTab === 'ar' ? this.renderAr(p) : ''}
          ${this.activeTab === 'look' ? this.renderLook() : ''}
        </div>

        ${
          this.error
            ? `<div class="kansa-error-banner" role="alert">${escapeHtml(this.error)}</div>`
            : ''
        }
      </div>
    `;

    this.bindEvents();
    if (this.activeTab === 'ar') this.ensureModelViewer();
  }

  renderChat(jobs) {
    const empty = this.messages.length === 0 && !this.activity;
    return `
      <div class="kansa-chat-panel">
        ${
          empty
            ? `
          <div class="kansa-welcome">
            <h2 class="kansa-panel-heading" data-mt-scroll="chapter">What do you need?</h2>
            <p class="kansa-panel-sub">Choose a job — it fills the composer so you can edit before asking.</p>
            <div class="kansa-jobs" aria-label="Suggested jobs" data-mt-scroll="stagger">
              <div class="kansa-jobs-grid">
                ${jobs
                  .map(
                    (j) => `
                  <button type="button" class="kansa-job-card" data-job-fill="${escapeHtml(
                    j.q,
                  )}" data-mt-scroll-item data-strike>
                    <span class="kansa-job-label">${escapeHtml(j.label)}</span>
                    <span class="kansa-job-lede">${escapeHtml(j.lede || '')}</span>
                  </button>`,
                  )
                  .join('')}
              </div>
            </div>
          </div>`
            : `
          <div class="kansa-thread" id="kansa-thread" aria-live="polite">
            ${this.messages
              .map((m) => {
                if (m.role === 'user') {
                  return `<div class="kansa-msg kansa-msg--user"><p>${escapeHtml(m.text)}</p></div>`;
                }
                return `
                  <div class="kansa-msg kansa-msg--assistant">
                    <p class="kansa-answer-kicker">${escapeHtml(m.tag || 'Kansa')}</p>
                    <p class="kansa-answer-text">${escapeHtml(m.text)}</p>
                    ${this.renderToolCards(m.tools || [])}
                  </div>`;
              })
              .join('')}
            ${
              this.activity
                ? `<div class="kansa-activity" role="status">${escapeHtml(this.activity)}</div>`
                : ''
            }
          </div>
          ${
            this.followUps.length && !this.activity
              ? `<div class="kansa-chips" aria-label="Continue">
                  ${this.followUps
                    .slice(0, 3)
                    .map(
                      (f) =>
                        `<button type="button" class="kansa-chip" data-q="${escapeHtml(
                          f,
                        )}" data-strike>${escapeHtml(f)}</button>`,
                    )
                    .join('')}
                </div>`
              : ''
          }
          ${
            !this.activity
              ? `<div class="kansa-answer-actions">
            <button type="button" class="kansa-text-btn" id="kansa-replay">Read aloud</button>
            <button type="button" class="kansa-text-btn" id="kansa-copy">Copy</button>
            <button type="button" class="kansa-text-btn kansa-text-btn--accent" id="kansa-goto-ritual" data-track="${
              this.selectedPiece?.ritualTrack || 'metal'
            }">Care rites</button>
          </div>`
              : ''
          }`
        }

        <div class="kansa-composer">
          <button type="button" class="kansa-mic-action ${
            this.listening ? 'is-listening' : ''
          }" id="kansa-mic-trigger" aria-pressed="${this.listening}" aria-label="${
            this.listening ? 'Listening' : 'Ask by voice'
          }">
            <span class="kansa-mic-dot" aria-hidden="true"></span>
            <span class="kansa-mic-text">${this.listening ? 'Listening' : 'Voice'}</span>
          </button>
          <form class="kansa-input-form" id="kansa-form">
            <input type="text" class="kansa-text-input" id="kansa-text-field" placeholder="Ask Kansa…" autocomplete="off" value="${escapeHtml(
              this.composerDraft,
            )}" />
            <button type="submit" class="kansa-send-btn" data-strike>Ask</button>
          </form>
        </div>
      </div>
    `;
  }

  /**
   * @param {import('./catalog.js').KansaPiece} p
   */
  renderThermal(p) {
    const rows = thermalMatrix(p);
    const fill = { compatible: 100, not: 12, unknown: 40 };
    return `
      <div class="kansa-thermal-panel kansa-panel">
        <header class="kansa-panel__header">
          <p class="kansa-eyebrow">Heat</p>
          <h2 class="kansa-panel-heading">${escapeHtml(p.title)}</h2>
          <p class="kansa-panel-sub">${escapeHtml(
            p.heat_compatibility || 'Compatibility from the catalogue heat sources.',
          )}</p>
        </header>
        <ul class="kansa-heat-list">
          ${rows
            .map(
              (r) => `
            <li class="kansa-heat-row kansa-heat-row--${r.status}">
              <div class="kansa-heat-row__top">
                <span class="kansa-heat-name">${escapeHtml(r.source.replace('_', ' '))}</span>
                <span class="kansa-heat-status">${
                  r.status === 'compatible'
                    ? 'Yes'
                    : r.status === 'not'
                      ? 'No'
                      : 'Unknown'
                }</span>
              </div>
              <div class="kansa-heat-track" aria-hidden="true">
                <span class="kansa-heat-fill" style="width:${fill[r.status] || 40}%"></span>
              </div>
            </li>`,
            )
            .join('')}
        </ul>
        <footer class="kansa-panel__footer">
          <button type="button" class="kansa-text-btn kansa-text-btn--accent" data-track="${
            p.ritualTrack
          }">Open care rites</button>
        </footer>
      </div>
    `;
  }

  renderDiagnostic(remedies, isClay) {
    return `
      <div class="kansa-diagnostic-panel kansa-panel">
        <header class="kansa-panel__header">
          <p class="kansa-eyebrow">Triage</p>
          <h2 class="kansa-panel-heading">${isClay ? 'Clay surface' : 'Metal surface'}</h2>
          <p class="kansa-panel-sub">Name what you see. Receive the restoration.</p>
        </header>
        <div class="kansa-remedy-grid">
          ${Object.entries(remedies)
            .map(
              ([, rem]) => `
            <article class="kansa-remedy-card">
              <h3 class="kansa-remedy-title">${escapeHtml(rem.label)}</h3>
              <p class="kansa-remedy-cause">${escapeHtml(rem.cause)}</p>
              <p class="kansa-remedy-fix">${escapeHtml(rem.fix)}</p>
            </article>`,
            )
            .join('')}
        </div>
        <footer class="kansa-panel__footer">
          <button type="button" class="kansa-text-btn kansa-text-btn--accent" data-track="${
            this.selectedPiece?.ritualTrack || 'metal'
          }">Open care rites</button>
        </footer>
      </div>
    `;
  }

  /**
   * @param {import('./catalog.js').KansaPiece} p
   */
  renderSpecs(p) {
    const rows = [
      ['Material', p.primary_material],
      ['Architecture', p.material_architecture],
      ['Heat', (p.heat_sources || []).join(', ') || '—'],
      ['Note', p.heat_compatibility],
      ['Care', p.care_hypothesis || p.care_instructions],
      ['Dishwasher', p.dishwasher_suitability],
    ].filter(([, v]) => v);
    return `
      <div class="kansa-specs-panel kansa-panel">
        <header class="kansa-panel__header">
          <p class="kansa-eyebrow">Spec</p>
          <h2 class="kansa-panel-heading">${escapeHtml(p.title)}</h2>
          <p class="kansa-panel-sub">The working record — not marketing copy.</p>
        </header>
        <dl class="kansa-spec-sheet">
          ${rows
            .map(
              ([k, v]) => `
            <div class="kansa-spec-row">
              <dt>${escapeHtml(k)}</dt>
              <dd>${escapeHtml(v || '—')}</dd>
            </div>`,
            )
            .join('')}
        </dl>
        <footer class="kansa-panel__footer">
          <button type="button" class="kansa-text-btn kansa-text-btn--accent" data-track="${
            p.ritualTrack
          }">Open care rites</button>
          <a class="kansa-text-btn" href="${escapeHtml(p.productUrl)}">View product</a>
        </footer>
      </div>
    `;
  }

  /**
   * @param {import('./catalog.js').KansaPiece | null} p
   */
  renderAr(p) {
    const title = p?.title || 'Maison Tavo piece';
    const poster =
      this.root.closest('[data-kansa-ar-poster]')?.getAttribute('data-kansa-ar-poster') ||
      '';
    const src =
      this.root.closest('[data-kansa-ar-src]')?.getAttribute('data-kansa-ar-src') || '';
    return `
      <div class="kansa-ar-panel kansa-panel">
        <header class="kansa-panel__header">
          <p class="kansa-eyebrow">Sight</p>
          <h2 class="kansa-panel-heading">${escapeHtml(title)}</h2>
          <p class="kansa-panel-sub">The first frame holds until the model is ready. Then place it in the room.</p>
        </header>
        <div class="kansa-ar-stage">
          ${
            src
              ? `<model-viewer
                  class="kansa-model-viewer"
                  src="${escapeHtml(src)}"
                  ${poster ? `poster="${escapeHtml(poster)}"` : ''}
                  alt="${escapeHtml(title)}"
                  ar
                  ar-modes="webxr scene-viewer quick-look"
                  camera-controls
                  touch-action="pan-y"
                  shadow-intensity="0.55"
                  exposure="1"
                ></model-viewer>`
              : `<div class="kansa-ar-poster" role="img" aria-label="${escapeHtml(title)}">
                   <p class="kansa-ar-poster-title">${escapeHtml(title)}</p>
                   <p class="kansa-panel-sub">Poster waiting for a GLB in section settings.</p>
                 </div>`
          }
        </div>
      </div>
    `;
  }

  renderLook() {
    const cat = this.selectedPiece?.materialCategory || 'metal';
    const chipSet = CV_CONFIRM_CHIPS[cat] || CV_CONFIRM_CHIPS.metal;
    const rem = this.cvSuggestion
      ? remediesFor(cat)[this.cvSuggestion.key]
      : null;
    return `
      <div class="kansa-look-panel kansa-panel">
        <header class="kansa-panel__header">
          <p class="kansa-eyebrow">Look</p>
          <h2 class="kansa-panel-heading">Show the surface</h2>
          <p class="kansa-panel-sub">Photograph, then confirm what you see. No silent diagnosis.</p>
        </header>
        <div class="kansa-look-stage">
          ${
            this.cvSuggestion?.posterUrl
              ? `<img class="kansa-look-poster" src="${escapeHtml(
                  this.cvSuggestion.posterUrl,
                )}" alt="Uploaded surface" />`
              : `<div class="kansa-look-placeholder">
                   <span class="kansa-look-glyph" aria-hidden="true"></span>
                   <p class="kansa-panel-sub">Still frame appears here</p>
                 </div>`
          }
          <label class="kansa-look-upload">
            <span>Open camera or file</span>
            <input type="file" id="kansa-cv-input" accept="image/*" capture="environment" />
          </label>
        </div>
        ${
          this.cvSuggestion
            ? `<div class="kansa-look-verdict">
                <p class="kansa-answer-kicker">Confirm what you see</p>
                <div class="kansa-chips kansa-chips--cv" role="group" aria-label="Surface confirm">
                  ${chipSet
                    .map(
                      (c) => `
                    <button type="button" class="kansa-chip ${
                      this.cvSuggestion.key === c.key ? 'is-active' : ''
                    }" data-cv-key="${escapeHtml(c.key)}">${escapeHtml(c.label)}</button>`,
                    )
                    .join('')}
                </div>
                ${
                  rem
                    ? `<p class="kansa-answer-text">${escapeHtml(rem.cause)}</p>
                       <p class="kansa-remedy-fix">${escapeHtml(rem.fix)}</p>`
                    : ''
                }
                <div class="kansa-answer-actions">
                  <button type="button" class="kansa-send-btn" id="kansa-cv-confirm" data-strike>Confirm remedy</button>
                  <button type="button" class="kansa-text-btn" id="kansa-cv-reject">Start over</button>
                </div>
              </div>`
            : ''
        }
      </div>
    `;
  }

  bindEvents() {
    const select = this.root.querySelector('#kansa-piece-select');
    if (select) {
      select.addEventListener('change', () => this.selectPiece(select.value));
    }
    this.root.querySelectorAll('.kansa-mode-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.activeTab = btn.dataset.tab;
        this.persist();
        this.render();
        this.revealStage();
        if (window.MaisonRuntime?.initInViewReveals) {
          window.MaisonRuntime.initInViewReveals(this.root);
        } else {
          document.dispatchEvent(new CustomEvent('maison:page-enter'));
        }
      });
    });
    const mic = this.root.querySelector('#kansa-mic-trigger');
    if (mic) mic.addEventListener('click', () => this.startListening());

    const form = this.root.querySelector('#kansa-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = this.root.querySelector('#kansa-text-field');
        if (input?.value.trim()) {
          this.processQuery(input.value.trim());
          input.value = '';
        }
      });
    }

    this.root.querySelectorAll('.kansa-job-card[data-job-fill]').forEach((el) => {
      el.addEventListener('click', () => this.fillComposer(el.dataset.jobFill || ''));
    });
    this.root.querySelectorAll('.kansa-chip[data-q]').forEach((el) => {
      el.addEventListener('click', () => {
        if (el.dataset.q) this.processQuery(el.dataset.q);
      });
    });
    this.root.querySelectorAll('.kansa-chip[data-cv-key]').forEach((el) => {
      el.addEventListener('click', () => {
        if (!this.cvSuggestion) return;
        this.cvSuggestion = { ...this.cvSuggestion, key: el.dataset.cvKey };
        this.render();
      });
    });

    this.root.querySelectorAll('.kansa-tool-btn, .kansa-tool-card[data-tool]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        if (btn.tagName === 'A') return;
        e.preventDefault();
        this.runTool(btn.dataset.tool);
      });
    });

    this.root.querySelectorAll('[data-track]').forEach((link) => {
      if (link.classList.contains('kansa-mode-btn')) return;
      link.addEventListener('click', (e) => {
        if (link.tagName === 'A' && link.getAttribute('href')?.startsWith('/products')) return;
        e.preventDefault();
        this.jumpToCare(link.dataset.track);
      });
    });

    const replay = this.root.querySelector('#kansa-replay');
    if (replay) {
      replay.addEventListener('click', () => {
        const last = [...this.messages].reverse().find((m) => m.role === 'assistant');
        if (last) this.speechOut.speak(last.text);
      });
    }
    const copy = this.root.querySelector('#kansa-copy');
    if (copy) copy.addEventListener('click', () => this.copyLastAnswer());

    const cvInput = this.root.querySelector('#kansa-cv-input');
    if (cvInput) {
      cvInput.addEventListener('change', () => {
        const file = cvInput.files?.[0];
        if (file) this.analysePhoto(file);
      });
    }
    const cvConfirm = this.root.querySelector('#kansa-cv-confirm');
    if (cvConfirm) cvConfirm.addEventListener('click', () => this.confirmCvRemedy());
    const cvReject = this.root.querySelector('#kansa-cv-reject');
    if (cvReject) {
      cvReject.addEventListener('click', () => {
        this.cvSuggestion = null;
        this.render();
      });
    }
  }
}

function toolLabel(id) {
  const map = {
    check_heat: 'Heat',
    open_care_ritual: 'Rites',
    open_triage: 'Triage',
    open_ar: 'Sight',
    cv_triage: 'Look',
    link_product: 'Product',
    lookup_piece: 'Detail',
  };
  return map[id] || id;
}

/**
 * @param {HTMLElement} mount
 */
export async function mountKansa(mount) {
  if (mount.dataset.kansaInitialized === 'true') return;
  mount.dataset.kansaInitialized = 'true';
  const catalog = await loadCatalog(mount);
  new KansaApp(mount, catalog);
}

void ALL_HEAT;

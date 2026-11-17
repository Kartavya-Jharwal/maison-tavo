import { animate } from 'motion';
import { loadCatalog, readSession, writeSession } from './catalog.js';
import { matchIntent, buildFixtureAnswer, thermalMatrix } from './engine.js';
import { remediesFor, suggestRemedyFromCues } from './remedies.js';
import { createWebSpeechRecognition, createWebSpeechSynthesis } from './speech.js';

const ALL_HEAT = ['induction', 'gas', 'electric', 'oven', 'open_flame'];

function preferReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
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
    this.activeTab = 'chat';
    this.listening = false;
    this.error = null;
    this.messages = [];
    this.followUps = [];
    this.unknownHandle = null;
    this.cvSuggestion = null;
    this.arReady = false;

    const params = new URLSearchParams(window.location.search);
    const pieceParam = params.get('piece');
    const session = readSession();

    if (pieceParam) {
      if (this.byHandle[pieceParam]) {
        this.selectedPiece = this.byHandle[pieceParam];
      } else {
        this.unknownHandle = pieceParam;
        this.selectedPiece = null;
      }
    } else if (session?.handle && this.byHandle[session.handle]) {
      this.selectedPiece = this.byHandle[session.handle];
      if (Array.isArray(session.messages) && session.messages.length) {
        this.messages = session.messages;
      }
      if (session.activeTab) this.activeTab = session.activeTab;
    } else {
      this.selectedPiece =
        this.byHandle['forge-relay-dual-mass-skillet'] || this.list[0] || null;
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
    writeSession({
      handle: this.selectedPiece?.handle || null,
      messages: this.messages.slice(-40),
      activeTab: this.activeTab,
    });
  }

  selectPiece(handle) {
    if (!this.byHandle[handle]) return;
    this.selectedPiece = this.byHandle[handle];
    this.unknownHandle = null;
    this.messages = [];
    this.followUps = [];
    this.cvSuggestion = null;
    this.syncUrl();
    this.persist();
    this.render();
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
    const userText = query.trim();
    this.messages.push({ role: 'user', text: userText });

    const { intent, confidence } = matchIntent(userText);
    const intentId = intent || 'default';
    const fixture = buildFixtureAnswer(this.selectedPiece, intentId === 'default' ? '' : intentId);

    if (!intent && confidence < 0.35) {
      const fallback = buildFixtureAnswer(this.selectedPiece, '');
      this.pushAssistant(fallback);
    } else {
      this.pushAssistant(fixture);
    }

    // Mode shortcuts from tools
    if (fixture.tools.includes('check_heat')) this.activeTab = 'thermal';
    if (fixture.tools.includes('open_triage')) this.activeTab = 'diagnostic';
    if (fixture.tools.includes('open_ar')) this.activeTab = 'ar';
    if (fixture.tools.includes('cv_triage') && intentId === 'cv_triage') this.activeTab = 'look';

    this.persist();
    this.render();
    this.animateAnswer();
    if (!preferReducedMotion()) {
      this.speechOut.speak(fixture.text);
    }
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

  animateAnswer() {
    if (preferReducedMotion()) return;
    const card = this.root.querySelector('.kansa-msg--assistant:last-child');
    if (card) {
      animate(card, { opacity: [0, 1] }, { duration: 0.4, easing: 'ease-out' });
    }
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
    this.persist();
    this.render();
    if (!preferReducedMotion()) this.speechOut.speak(rem.fix);
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
    const empty = this.messages.length === 0;
    return `
      <div class="kansa-chat-panel">
        ${
          empty
            ? `
          <div class="kansa-welcome">
            <h2 class="kansa-panel-heading">What do you need?</h2>
            <p class="kansa-panel-sub">Four doors into the house. Speak, or begin with a job.</p>
            <div class="kansa-jobs" aria-label="Suggested jobs">
              <div class="kansa-jobs-grid">
                ${jobs
                  .map(
                    (j) => `
                  <button type="button" class="kansa-job-card" data-job-q="${escapeHtml(
                    j.q,
                  )}" data-strike>
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
                    ${
                      m.tools?.length
                        ? `<div class="kansa-tool-row">${m.tools
                            .slice(0, 2)
                            .map(
                              (t) =>
                                `<button type="button" class="kansa-tool-btn" data-tool="${escapeHtml(
                                  t,
                                )}">${escapeHtml(toolLabel(t))}</button>`,
                            )
                            .join('')}</div>`
                        : ''
                    }
                  </div>`;
              })
              .join('')}
          </div>
          ${
            this.followUps.length
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
          <div class="kansa-answer-actions">
            <button type="button" class="kansa-text-btn" id="kansa-replay">Read aloud</button>
            <button type="button" class="kansa-text-btn" id="kansa-copy">Copy</button>
            <button type="button" class="kansa-text-btn kansa-text-btn--accent" id="kansa-goto-ritual" data-track="${
              this.selectedPiece?.ritualTrack || 'metal'
            }">Care rites</button>
          </div>`
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
            <input type="text" class="kansa-text-input" id="kansa-text-field" placeholder="Ask Kansa…" autocomplete="off" />
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
    const rem = this.cvSuggestion
      ? remediesFor(this.selectedPiece?.materialCategory || 'metal')[this.cvSuggestion.key]
      : null;
    return `
      <div class="kansa-look-panel kansa-panel">
        <header class="kansa-panel__header">
          <p class="kansa-eyebrow">Look</p>
          <h2 class="kansa-panel-heading">Show the surface</h2>
          <p class="kansa-panel-sub">One photograph. A suggested triage. You confirm before any remedy.</p>
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
          rem
            ? `<div class="kansa-look-verdict">
                <p class="kansa-answer-kicker">${escapeHtml(rem.label)}</p>
                <p class="kansa-answer-text">${escapeHtml(rem.cause)}</p>
                <p class="kansa-remedy-fix">${escapeHtml(rem.fix)}</p>
                <div class="kansa-answer-actions">
                  <button type="button" class="kansa-send-btn" id="kansa-cv-confirm" data-strike>Confirm</button>
                  <button type="button" class="kansa-text-btn" id="kansa-cv-reject">Not this</button>
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

    this.root.querySelectorAll('.kansa-chip, .kansa-job-card').forEach((el) => {
      el.addEventListener('click', () => {
        const q = el.dataset.q || el.dataset.jobQ;
        if (!q) return;
        // Fill composer pattern: if job, prefer send for ready jobs
        this.processQuery(q);
      });
    });

    this.root.querySelectorAll('.kansa-tool-btn').forEach((btn) => {
      btn.addEventListener('click', () => this.runTool(btn.dataset.tool));
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

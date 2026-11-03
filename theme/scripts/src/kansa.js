/**
 * Kansa — Culinary Voice Companion & Cookware Maintenance Diagnostic
 * Built for Maison Tavo. Bundled by Bun into theme/assets/microapp-kansa.js.
 */
import { animate } from 'motion';

// --- Preset Catalog & Maintenance Data ---
const PRESET_PIECES = {
  'forge-hybrid-26cm-skillet': {
    handle: 'forge-hybrid-26cm-skillet',
    title: 'Forge Hybrid 26cm Skillet',
    lineup: 'Forge Hybrid',
    alloy: '1.2mm carbon steel (1.0085)',
    finish: 'Drop-forged, beeswax lipid seasoned',
    heat_sources: ['Induction', 'Gas', 'Electric', 'Oven (safe to 450°C)', 'Open Flame'],
    care: 'Wipe hot with warm water and brush. Dry over low heat immediately. Rub with half a drop of high-smoke oil. Never soak; never use dish soap or dishwasher.',
    acid_rule: 'Avoid heavy acidic reductions (wine, vinegar, citrus) during the first 15 cooking cycles until the patina polymerizes fully.',
    searing_note: 'Pre-heat slowly for 2 minutes on induction or gas before introducing oil to prevent thermal shock warping.',
  },
  'terre-clay-braiser-vessel': {
    handle: 'terre-clay-braiser-vessel',
    title: 'Terre Clay Braiser Vessel',
    lineup: 'Terre Clay',
    alloy: 'High-fire stoneware clay with feldspathic glaze',
    finish: 'Lead-free vitrified slip',
    heat_sources: ['Gas (with heat diffuser)', 'Oven (up to 260°C)'],
    care: 'Allow vessel to cool to room temperature before washing with warm water and soft sponge. Never plunge a hot vessel into cold water. Store completely dry with lid slightly ajar.',
    acid_rule: 'Vitrified glazed interior is non-reactive and highly acid-resistant.',
    searing_note: 'Not designed for high dry searing. Ideal for slow thermal convection and braises.',
  },
  'kuro-strip-chef-knife': {
    handle: 'kuro-strip-chef-knife',
    title: "Kuro Strip Chef's Knife 210mm",
    lineup: 'Kuro Strip',
    alloy: 'VG10 core Damascus 67-layer steel (60 HRC)',
    finish: 'Mirror polished micro-bevel, acid relief',
    heat_sources: ['None — avoid dishwasher thermal cycles'],
    care: 'Hand wash with mild soap immediately after cutting. Wipe bone dry with lint-free towel. Apply camellia mineral oil if stored in humid climates.',
    acid_rule: 'Wipe blade immediately after slicing lemons, shallots, or tomatoes to prevent micro-etching the Damascus relief.',
    searing_note: 'Hone at 15° per side on a 1000/6000 ceramic whetstone. Never cut frozen food or hard bones.',
  },
};

// --- Speech Synthesis Helper ---
function speakAnswer(text) {
  if (!('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/<[^>]+>/g, '').replace(/[#*_`]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.95;
    utterance.pitch = 0.95;
    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Premium') || v.name.includes('Google') || v.name.includes('Alex')));
    if (naturalVoice) utterance.voice = naturalVoice;
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.debug('SpeechSynthesis notice:', err);
  }
}

// --- Intent Engine for Pan Care ---
function answerQuery(query, piece) {
  const q = query.toLowerCase();
  const title = piece.title;

  if (q.includes('season') || q.includes('re-season') || q.includes('black')) {
    return {
      text: `To season the ${title}: Wash clean with warm water and dry over medium heat. When completely dry, apply a dime-sized amount of high-smoke point oil (grapeseed or beeswax blend) across the cooking surface and buff it until the surface looks nearly dry. Heat until wisps of smoke appear, maintain for 60 seconds, then allow to cool completely. Repeat twice for a resilient dark glass patina.`,
      tag: 'SEASONING PROTOCOL'
    };
  }
  if (q.includes('soap') || q.includes('wash') || q.includes('clean') || q.includes('dishwasher') || q.includes('rust')) {
    return {
      text: `${piece.care} ${q.includes('rust') ? ' If you notice light surface rust: scrub with a paste of coarse kosher salt and oil, rinse, dry on the stovetop, and immediately re-season.' : ''}`,
      tag: 'CLEANING & HYGIENE'
    };
  }
  if (q.includes('acid') || q.includes('tomato') || q.includes('lemon') || q.includes('wine') || q.includes('vinegar')) {
    return {
      text: piece.acid_rule,
      tag: 'ACID TOLERANCE'
    };
  }
  if (q.includes('heat') || q.includes('induction') || q.includes('oven') || q.includes('sear') || q.includes('temp') || q.includes('temperature')) {
    return {
      text: `${piece.searing_note} Compatible with: ${piece.heat_sources.join(', ')}.`,
      tag: 'THERMAL SPECIFICATION'
    };
  }
  if (q.includes('alloy') || q.includes('material') || q.includes('made of') || q.includes('metal')) {
    return {
      text: `Constructed from ${piece.alloy}. Finished with ${piece.finish}.`,
      tag: 'METALLURGY & SPEC'
    };
  }

  return {
    text: `For ${title}: ${piece.care} You can ask me how to season it, how to handle acidic cooking, cleaning stuck food, or induction heating recommendations.`,
    tag: 'KANSA GUIDE'
  };
}

// --- Diagnosis Remedies ---
const REMEDIES = {
  gummy: {
    label: 'Sticky / Gummy Surface',
    cause: 'Too much oil was applied during seasoning and did not reach full polymerization temperature.',
    fix: 'Place pan on burner over medium heat for 10–12 minutes until the sticky oil fully smokes off and leaves a smooth matte dry surface. Buff lightly with dry cotton cloth while warm.'
  },
  dull: {
    label: 'Dry / Dull Grey Surface',
    cause: 'Cooking without fat or stripped patina from acidic deglazing.',
    fix: 'Stovetop touch-up: Warm the pan, wipe a drop of oil across the surface, smoke lightly for 1 minute, and let cool before storing.'
  },
  stuck: {
    label: 'Stuck Food / Carbon Crust',
    cause: 'Pan was too cold when protein was added, or carbon residue accumulated.',
    fix: 'Simmer 1 inch of water in the skillet for 3 minutes to soften debris. Scrape with a flat wooden spatula. Discard water, dry over heat, and rub with fresh oil.'
  },
  rust: {
    label: 'Orange Surface Rust',
    cause: 'Pan was left damp or air-dried in a dish rack without stovetop heat drying.',
    fix: 'Scrub the rust spots with coarse salt and a few drops of oil. Wipe clean, rinse quickly, dry completely over heat, and run 1 full seasoning coat.'
  }
};

// --- App State ---
class KansaApp {
  constructor(root) {
    this.root = root;
    this.selectedPiece = PRESET_PIECES['forge-hybrid-26cm-skillet'];
    this.activeTab = 'chat'; // 'chat' | 'diagnostic' | 'specs'
    this.listening = false;
    this.transcript = '';
    this.lastAnswer = null;
    this.error = null;
    this.initRecognition();
    this.render();
  }

  initRecognition() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      this.recognition = new SR();
      this.recognition.continuous = false;
      this.recognition.lang = 'en-US';
      this.recognition.interimResults = false;
      this.recognition.onresult = (e) => {
        const text = e.results[0][0].transcript;
        this.transcript = text;
        this.listening = false;
        this.processQuery(text);
      };
      this.recognition.onerror = (e) => {
        this.listening = false;
        this.error = 'Speech input: ' + e.error;
        this.render();
      };
      this.recognition.onend = () => {
        this.listening = false;
        this.render();
      };
    }
  }

  startListening() {
    if (!this.recognition) {
      this.error = 'Voice recognition is supported in Chrome, Safari, or Edge over HTTPS.';
      this.render();
      return;
    }
    this.listening = true;
    this.error = null;
    this.render();
    try {
      this.recognition.start();
    } catch {
      this.listening = false;
      this.render();
    }
  }

  processQuery(query) {
    if (!query || !query.trim()) return;
    this.transcript = query;
    const answer = answerQuery(query, this.selectedPiece);
    this.lastAnswer = answer;
    this.render();
    speakAnswer(answer.text);
  }

  render() {
    const p = this.selectedPiece;

    this.root.innerHTML = `
      <div class="kansa-container">
        <!-- Piece selector strip -->
        <div class="kansa-piece-selector">
          <label class="kansa-label">SELECT COOKWARE PIECE:</label>
          <div class="kansa-piece-buttons">
            ${Object.values(PRESET_PIECES).map(item => `
              <button class="kansa-piece-btn ${item.handle === p.handle ? 'is-active' : ''}" data-handle="${item.handle}">
                ${item.title}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Mode navigation -->
        <div class="kansa-mode-nav">
          <button class="kansa-mode-btn ${this.activeTab === 'chat' ? 'is-active' : ''}" data-tab="chat">
            🎙️ Voice & Care Companion
          </button>
          <button class="kansa-mode-btn ${this.activeTab === 'diagnostic' ? 'is-active' : ''}" data-tab="diagnostic">
            🧪 Pan Condition Diagnostic
          </button>
          <button class="kansa-mode-btn ${this.activeTab === 'specs' ? 'is-active' : ''}" data-tab="specs">
            📜 Metallurgy & Heat Limits
          </button>
        </div>

        <!-- TAB 1: Voice & Care Companion -->
        ${this.activeTab === 'chat' ? `
          <div class="kansa-chat-panel">
            <div class="kansa-voice-hero">
              <button class="kansa-mic-action ${this.listening ? 'is-listening' : ''}" id="kansa-mic-trigger" aria-pressed="${this.listening}">
                <span class="kansa-mic-icon">${this.listening ? '◉' : '🎙️'}</span>
                <span class="kansa-mic-text">${this.listening ? 'Listening to your question…' : 'Tap to Ask Kansa by Voice'}</span>
              </button>
              <p class="kansa-caption">Voice responses speak back with natural culinary instruction · Or type below</p>
            </div>

            <!-- Text input bar -->
            <form class="kansa-input-form" id="kansa-form">
              <input type="text" class="kansa-text-input" id="kansa-text-field" placeholder="Ask about seasoning, soap, searing, rust, or heat sources…" autocomplete="off" />
              <button type="submit" class="kansa-send-btn">Ask</button>
            </form>

            <!-- Quick questions chips -->
            <div class="kansa-chips">
              <span class="kansa-chips-label">Quick Prompts:</span>
              <button class="kansa-chip" data-q="How do I season this pan?">How do I season this pan?</button>
              <button class="kansa-chip" data-q="Can I use soap or dishwasher?">Can I use soap?</button>
              <button class="kansa-chip" data-q="Can I cook tomatoes or wine?">Acidic foods?</button>
              <button class="kansa-chip" data-q="What is the induction searing technique?">Induction searing?</button>
            </div>

            ${this.transcript ? `
              <div class="kansa-transcript">
                <span class="kansa-transcript-tag">HEARD:</span> "${this.transcript}"
              </div>
            ` : ''}

            ${this.lastAnswer ? `
              <div class="kansa-answer-card">
                <div class="kansa-answer-badge">${this.lastAnswer.tag}</div>
                <div class="kansa-answer-text">${this.lastAnswer.text}</div>
                <button class="kansa-replay-btn" id="kansa-replay">🔊 Read aloud again</button>
              </div>
            ` : ''}

            ${this.error ? `
              <div class="kansa-error-banner">${this.error}</div>
            ` : ''}
          </div>
        ` : ''}

        <!-- TAB 2: Pan Condition Diagnostic -->
        ${this.activeTab === 'diagnostic' ? `
          <div class="kansa-diagnostic-panel">
            <h3 class="kansa-panel-heading">Interactive Pan Condition Triage</h3>
            <p class="kansa-panel-sub">Select your cookware's current surface state to receive an exact restoration prescription:</p>
            <div class="kansa-remedy-grid">
              ${Object.entries(REMEDIES).map(([key, rem]) => `
                <div class="kansa-remedy-card">
                  <h4 class="kansa-remedy-title">${rem.label}</h4>
                  <p class="kansa-remedy-cause"><strong>Cause:</strong> ${rem.cause}</p>
                  <div class="kansa-remedy-fix"><strong>Remedy:</strong> ${rem.fix}</div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- TAB 3: Metallurgy & Heat Limits -->
        ${this.activeTab === 'specs' ? `
          <div class="kansa-specs-panel">
            <h3 class="kansa-panel-heading">${p.title} Technical Spec</h3>
            <table class="kansa-spec-table">
              <tbody>
                <tr><th>Material Alloy</th><td>${p.alloy}</td></tr>
                <tr><th>Craft Finish</th><td>${p.finish}</td></tr>
                <tr><th>Heat Sources</th><td>${p.heat_sources.join(', ')}</td></tr>
                <tr><th>Acid Compatibility</th><td>${p.acid_rule}</td></tr>
                <tr><th>Thermal Discipline</th><td>${p.searing_note}</td></tr>
                <tr><th>Daily Care</th><td>${p.care}</td></tr>
              </tbody>
            </table>
          </div>
        ` : ''}
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    // Piece selector buttons
    this.root.querySelectorAll('.kansa-piece-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const h = btn.dataset.handle;
        if (PRESET_PIECES[h]) {
          this.selectedPiece = PRESET_PIECES[h];
          this.transcript = '';
          this.lastAnswer = null;
          this.render();
        }
      });
    });

    // Mode tabs
    this.root.querySelectorAll('.kansa-mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeTab = btn.dataset.tab;
        this.render();
      });
    });

    // Voice button
    const mic = this.root.querySelector('#kansa-mic-trigger');
    if (mic) {
      mic.addEventListener('click', () => this.startListening());
    }

    // Input form
    const form = this.root.querySelector('#kansa-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = this.root.querySelector('#kansa-text-field');
        if (input && input.value.trim()) {
          this.processQuery(input.value.trim());
          input.value = '';
        }
      });
    }

    // Quick chips
    this.root.querySelectorAll('.kansa-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        this.processQuery(chip.dataset.q);
      });
    });

    // Replay speech
    const replay = this.root.querySelector('#kansa-replay');
    if (replay && this.lastAnswer) {
      replay.addEventListener('click', () => speakAnswer(this.lastAnswer.text));
    }
  }
}

// --- Initialize when root is present ---
document.addEventListener('DOMContentLoaded', () => {
  const mount = document.getElementById('kansa-root');
  if (mount) {
    new KansaApp(mount);
  }
});

// Also initialize immediately if script loaded after DOM
const immediateMount = document.getElementById('kansa-root');
if (immediateMount && !immediateMount.dataset.kansaInitialized) {
  immediateMount.dataset.kansaInitialized = 'true';
  new KansaApp(immediateMount);
}

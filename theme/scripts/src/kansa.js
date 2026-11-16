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
    materialCategory: 'metal',
    alloy: '1.2mm carbon steel (1.0085) with dual-mass base',
    finish: 'Drop-forged, bell-bronze rivets, beeswax lipid seasoned',
    heat_sources: ['Induction', 'Gas', 'Electric', 'Oven (safe to 450°C)', 'Open Hearth Flame'],
    care: 'Wipe hot with warm water and natural brush. Dry over stovetop heat for 60 seconds immediately. Rub with half a drop of high-smoke oil until bone dry. Zero soap, never soak, never dishwasher.',
    acid_rule: 'Avoid heavy acidic reductions (wine, vinegar, tomato, citrus) during the first 15 cooking cycles until the patina polymerizes fully into black glass.',
    searing_note: 'Pre-heat slowly for 2 minutes on induction or gas before introducing oil. Dual-mass core prevents thermal shock warping.',
    ritualTrack: 'metal'
  },
  'terre-clay-braiser-vessel': {
    handle: 'terre-clay-braiser-vessel',
    title: 'Terre Clay Braiser Vessel',
    lineup: 'Terre Clay',
    materialCategory: 'clay',
    alloy: 'High-fire refractory stoneware clay',
    finish: 'Lead-free vitrified feldspathic slip interior, unglazed porous exterior base',
    heat_sources: ['Gas (with heat diffuser)', 'Oven (cold-start, safe to 260°C)'],
    care: 'Always allow vessel to return to room temperature before washing with warm water and soft sponge. Never plunge a hot vessel into cold water. Store completely bone dry with lid slightly ajar.',
    acid_rule: 'Vitrified glazed interior is completely non-reactive and highly acid-tolerant. Tomato braises, wine marinades, and citrus reductions are welcome.',
    searing_note: 'Not engineered for high dry searing or sudden temperature spikes. Ideal for slow thermal convection, tagines, braises, and gentle simmer.',
    ritualTrack: 'clay'
  },
  'kuro-strip-chef-knife': {
    handle: 'kuro-strip-chef-knife',
    title: "Kuro Strip Chef's Knife 210mm",
    lineup: 'Kuro Strip',
    materialCategory: 'metal',
    alloy: 'VG10 core Damascus 67-layer steel (60 HRC)',
    finish: 'Mirror polished micro-bevel, acid relief damascus',
    heat_sources: ['None — keep away from heat sources & dishwasher thermal cycles'],
    care: 'Hand wash with mild soap immediately after cutting. Wipe bone dry with lint-free towel. Apply camellia mineral oil if stored in humid climates. Store in sheath or magnetic wooden rack.',
    acid_rule: 'Wipe blade immediately after slicing citrus, tomatoes, or shallots to prevent micro-etching the Damascus relief.',
    searing_note: 'Hone at 15° per side on a 1000/6000 ceramic whetstone. Never cut frozen food or hard bones.',
    ritualTrack: 'metal'
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

// --- Intent Engine for Pan & Clay Care ---
function answerQuery(query, piece) {
  const q = query.toLowerCase();
  const title = piece.title;
  const isClay = piece.materialCategory === 'clay';
  const isBlade = piece.handle === 'kuro-strip-chef-knife';

  // 1. Seasoning / Water Cure Intent
  if (q.includes('season') || q.includes('re-season') || q.includes('black') || q.includes('cure') || q.includes('soak')) {
    if (isClay) {
      return {
        text: `Terre Clay vessels must never be seasoned with oil or high heat. Instead, perform the Water Cure: submerge the entire vessel in cold water for 15 minutes before the first five uses. The absorbed moisture acts as a thermal buffer throughout the clay matrix to prevent micro-fracture under heat.`,
        tag: 'CLAY WATER CURE'
      };
    }
    if (isBlade) {
      return {
        text: `Kuro Strip Damascus blades do not undergo seasoning. Never heat the blade. Simply apply a micro-film of camellia mineral oil to the blade flat after washing to prevent moisture oxidation.`,
        tag: 'BLADE PRESERVATION'
      };
    }
    return {
      text: `To season the ${title}: Wash clean with warm water and dry over medium heat for 60 seconds. When dry, buff a half-teaspoon of grapeseed or beeswax blend across the cooking surface until it looks bone dry. Heat until light wisps of smoke appear, hold for 60 seconds, then allow to cool. Repeat twice for a resilient dark glass patina.`,
      tag: 'CARBON STEEL SEASONING'
    };
  }

  // 2. Soap, Cleaning, Dishwasher, Rust, Soaking
  if (q.includes('soap') || q.includes('wash') || q.includes('clean') || q.includes('dishwasher') || q.includes('rust') || q.includes('sink')) {
    if (isClay) {
      return {
        text: `For Terre Clay: Always let the vessel cool to room temperature first. Plunging hot clay into cold water will crack it. Wash the glazed interior with warm water and a soft sponge. Mild soap is fine inside, but never soak the porous unglazed base in soapy water. Never place in the dishwasher.`,
        tag: 'CLAY HYGIENE & CARE'
      };
    }
    if (isBlade) {
      return {
        text: `For the Kuro Strip knife: Hand wash with mild soap and warm water immediately after cutting. Wipe bone dry with a clean cloth. Never soak in the sink or place in a dishwasher, which destroys the temper and micro-bevel.`,
        tag: 'BLADE HYGIENE'
      };
    }
    return {
      text: `${piece.care} ${q.includes('rust') ? ' If orange surface rust appears: scrub with a paste of coarse kosher salt and oil, rinse, dry over flame for 60s, and immediately apply a seasoning coat.' : ''}`,
      tag: 'ZERO SOAP DISCIPLINE'
    };
  }

  // 3. Acidic Ingredients: Tomato, Wine, Vinegar, Lemon
  if (q.includes('acid') || q.includes('tomato') || q.includes('lemon') || q.includes('wine') || q.includes('vinegar') || q.includes('citrus')) {
    if (isClay) {
      return {
        text: `Terre Clay's vitrified feldspathic glaze interior is completely non-reactive and highly acid-tolerant. You can simmer tomatoes, wine, vinegar, and tamarind braises for hours without affecting the vessel or food flavour.`,
        tag: 'ACID TOLERANCE · CLAY'
      };
    }
    if (isBlade) {
      return {
        text: `Kuro Strip VG10 Damascus steel can slice citrus, tomatoes, and shallots, but wipe the blade clean immediately after use. Leaving acid residue on the blade will etch and dull the relief pattern.`,
        tag: 'ACID TOLERANCE · BLADE'
      };
    }
    return {
      text: piece.acid_rule,
      tag: 'ACID TOLERANCE · METAL'
    };
  }

  // 4. Heat Sources, Induction, Oven, Gas, Searing
  if (q.includes('heat') || q.includes('induction') || q.includes('oven') || q.includes('sear') || q.includes('temp') || q.includes('diffuser') || q.includes('gas')) {
    if (isClay) {
      return {
        text: `Terre Clay requires thermal patience: It is NOT compatible with induction cooktops. On gas burners, you must always use a heat diffuser plate on low to medium flame. In the oven, start cold (place pot in cold oven, then preheat, max 260°C). Never place under a direct broiler.`,
        tag: 'THERMAL DISCIPLINE · CLAY'
      };
    }
    return {
      text: `${piece.searing_note} Compatible with: ${piece.heat_sources.join(', ')}.`,
      tag: 'THERMAL SPECIFICATION'
    };
  }

  // 5. Material & Alloy
  if (q.includes('alloy') || q.includes('material') || q.includes('made of') || q.includes('metal') || q.includes('clay') || q.includes('stoneware')) {
    return {
      text: `Constructed from ${piece.alloy}. Finished with ${piece.finish}.`,
      tag: 'METALLURGY & MATERIAL'
    };
  }

  // 6. Default Fallback
  return {
    text: `For ${title}: ${piece.care} Ask me about ${isClay ? 'the water cure, heat diffusers, acid tolerance, or cleaning without shock' : 'seasoning protocols, soap avoidance, induction searing, or rust remediation'}.`,
    tag: 'KANSA GUIDE'
  };
}

// --- Diagnosis Remedies: Metal Skillets vs Clay Pots ---
const METAL_REMEDIES = {
  gummy: {
    label: 'Sticky / Gummy Surface',
    cause: 'Too much oil was applied during seasoning and did not reach full polymerization temperature.',
    fix: 'Place pan on burner over medium heat for 10–12 minutes until the sticky lipid fully smokes off into a smooth matte dry surface. Buff lightly with dry cotton cloth while warm.'
  },
  dull: {
    label: 'Dry / Stripped Grey Surface',
    cause: 'Cooking without fat or stripped patina from acidic wine/tomato deglazing during early cycles.',
    fix: 'Stovetop touch-up: Warm the pan, wipe a drop of oil across the surface, smoke lightly for 1 minute, and let cool before storing.'
  },
  stuck: {
    label: 'Stuck Food / Carbon Crust',
    cause: 'Pan was too cold when protein contacted the surface, or carbon residue accumulated.',
    fix: 'Deglaze by simmering 1 inch of hot water in the skillet for 3 minutes to loosen fond. Scrape with a flat wooden spatula. Discard water, dry over flame for 60s, and buff with fresh oil.'
  },
  rust: {
    label: 'Orange Surface Rust',
    cause: 'Pan was left damp or air-dried in a dish rack without stovetop heat drying.',
    fix: 'Scrub the rust spots with coarse salt and a few drops of oil. Wipe clean, rinse quickly, dry completely over heat for 60 seconds, and run 1 full seasoning coat.'
  }
};

const CLAY_REMEDIES = {
  crazing: {
    label: 'Fine Glaze Crazing Lines',
    cause: 'Differential thermal expansion between the clay body and glazed slip during rapid heating.',
    fix: 'Hairline crazing is normal in traditional high-fire ceramics and does not affect integrity. To prevent deepening: always heat gradually using a diffuser on gas, and start cold in the oven.'
  },
  odour: {
    label: 'Trapped Food Aromas / Odour',
    cause: 'Porous unglazed exterior base absorbed food steam or soapy wash water.',
    fix: 'Fill the vessel with warm water and 2 tablespoons of baking soda. Simmer gently on low heat with a diffuser for 15 minutes. Rinse with warm water and dry thoroughly in open air.'
  },
  scorch: {
    label: 'Scorched Braise Base Residue',
    cause: 'Starch or sugars settled at the bottom during prolonged low-moisture braising.',
    fix: 'Allow vessel to cool completely to room temperature. Soak with warm water and 1 tablespoon baking soda for 30 minutes. Gently lift with a wooden spatula or soft natural sponge. Never use abrasive metal scouring pads.'
  },
  sweat: {
    label: 'Base Moisture Sweating / Seepage',
    cause: 'New clay vessel has not completed its pore hydration cure.',
    fix: 'Perform a starch cure: fill vessel with water and 1/2 cup rice flour or cooked rice water. Simmer on low heat for 30 minutes. The rice starches vitrify micro-pores in the clay body, creating a natural impermeable seal.'
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

  jumpToCareRitual(track) {
    const ritualSec = document.getElementById('care-ritual');
    if (!ritualSec) return;
    const tab = ritualSec.querySelector(`.maison-ritual-v7__tab[data-track="${track}"]`);
    if (tab) tab.click();
    ritualSec.scrollIntoView({ behavior: 'smooth' });
  }

  render() {
    const p = this.selectedPiece;
    const isClay = p.materialCategory === 'clay';
    const isBlade = p.handle === 'kuro-strip-chef-knife';
    const currentRemedies = isClay ? CLAY_REMEDIES : METAL_REMEDIES;

    // Dynamic prompt suggestions per piece material
    const quickPrompts = isClay
      ? [
          { q: 'How do I water cure a clay pot?', label: 'Water Cure Ritual?' },
          { q: 'Can I use this on gas or induction?', label: 'Heat Diffuser / Induction?' },
          { q: 'Can I cook tomato or wine in clay?', label: 'Safe for Tomatoes & Wine?' },
          { q: 'How to clean clay without cracking?', label: 'Thermal Shock Cleaning?' },
        ]
      : isBlade
      ? [
          { q: 'How do I care for this Damascus blade?', label: 'Blade Maintenance?' },
          { q: 'Can I cut lemons or acidic food?', label: 'Acid Etching Rule?' },
          { q: 'How should I sharpen this knife?', label: '15° Whetstone Honing?' },
          { q: 'Can I put this in the dishwasher?', label: 'Dishwasher Safe?' },
        ]
      : [
          { q: 'How do I season this pan?', label: 'How to Season?' },
          { q: 'Can I use soap or dishwasher?', label: 'Zero Soap Rule?' },
          { q: 'Can I cook tomatoes or wine?', label: 'Acidic Foods?' },
          { q: 'What is the 2-minute preheat rule?', label: '2-Min Induction Preheat?' },
        ];

    this.root.innerHTML = `
      <div class="kansa-container">
        <!-- Piece selector strip -->
        <div class="kansa-piece-selector">
          <label class="kansa-label">SELECT COOKWARE PIECE:</label>
          <div class="kansa-piece-buttons">
            ${Object.values(PRESET_PIECES).map(item => `
              <button class="kansa-piece-btn ${item.handle === p.handle ? 'is-active' : ''}" data-handle="${item.handle}" data-strike>
                <span class="piece-indicator">${item.materialCategory === 'clay' ? '◉' : '⚒'}</span>
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
            🧪 ${isClay ? 'Clay Surface Triage' : 'Metal Surface Triage'}
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
              <input type="text" class="kansa-text-input" id="kansa-text-field" placeholder="Ask about ${isClay ? 'water cure, heat diffusers, acids, or cleaning clay…' : 'seasoning, soap, searing, rust, or induction…'}" autocomplete="off" />
              <button type="submit" class="kansa-send-btn" data-strike>Ask</button>
            </form>

            <!-- Quick questions chips -->
            <div class="kansa-chips">
              <span class="kansa-chips-label">Quick Prompts (${isClay ? 'Terre Clay' : 'Metal'}):</span>
              ${quickPrompts.map(pr => `
                <button class="kansa-chip" data-q="${pr.q}" data-strike>${pr.label}</button>
              `).join('')}
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
                <div class="kansa-answer-actions">
                  <button class="kansa-replay-btn" id="kansa-replay">🔊 Read aloud again</button>
                  <button class="kansa-ritual-link" id="kansa-goto-ritual" data-track="${p.ritualTrack}">
                    View Full ${isClay ? 'Clay' : 'Metal'} Rites Below ↓
                  </button>
                </div>
              </div>
            ` : ''}

            ${this.error ? `
              <div class="kansa-error-banner">${this.error}</div>
            ` : ''}
          </div>
        ` : ''}

        <!-- TAB 2: Condition Diagnostic / Triage -->
        ${this.activeTab === 'diagnostic' ? `
          <div class="kansa-diagnostic-panel">
            <h3 class="kansa-panel-heading">${isClay ? 'Terre Clay Vessel Condition Triage' : 'Carbon Steel & Iron Pan Triage'}</h3>
            <p class="kansa-panel-sub">Select your cookware's current surface state to receive an exact restoration prescription:</p>
            <div class="kansa-remedy-grid">
              ${Object.entries(currentRemedies).map(([key, rem]) => `
                <div class="kansa-remedy-card">
                  <h4 class="kansa-remedy-title">${rem.label}</h4>
                  <p class="kansa-remedy-cause"><strong>Cause:</strong> ${rem.cause}</p>
                  <div class="kansa-remedy-fix"><strong>Remedy:</strong> ${rem.fix}</div>
                </div>
              `).join('')}
            </div>
            <div class="kansa-triage-footer">
              <button class="kansa-ritual-link" id="kansa-goto-ritual-diag" data-track="${p.ritualTrack}">
                Explore Full ${isClay ? 'Terre Clay' : 'Forge Metal'} Care Ritual Below ↓
              </button>
            </div>
          </div>
        ` : ''}

        <!-- TAB 3: Metallurgy & Heat Limits -->
        ${this.activeTab === 'specs' ? `
          <div class="kansa-specs-panel">
            <h3 class="kansa-panel-heading">${p.title} Technical Spec</h3>
            <table class="kansa-spec-table">
              <tbody>
                <tr><th>Material & Craft</th><td>${p.alloy}</td></tr>
                <tr><th>Surface Finish</th><td>${p.finish}</td></tr>
                <tr><th>Heat Sources</th><td>${p.heat_sources.join(', ')}</td></tr>
                <tr><th>Acid Compatibility</th><td>${p.acid_rule}</td></tr>
                <tr><th>Thermal Discipline</th><td>${p.searing_note}</td></tr>
                <tr><th>Daily Care Protocol</th><td>${p.care}</td></tr>
              </tbody>
            </table>
            <div class="kansa-triage-footer">
              <button class="kansa-ritual-link" id="kansa-goto-ritual-spec" data-track="${p.ritualTrack}">
                View Step-by-Step ${isClay ? 'Clay' : 'Metal'} Rites Below ↓
              </button>
            </div>
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

    // Jump to care ritual anchors
    const ritualLinks = this.root.querySelectorAll('.kansa-ritual-link');
    ritualLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const track = link.dataset.track || 'metal';
        this.jumpToCareRitual(track);
      });
    });
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

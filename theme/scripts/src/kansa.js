import { animate } from 'motion';
import { createStore } from 'zustand/vanilla';

// --- State store ---
const store = createStore((set) => ({
  piece: null,
  transcript: '',
  response: '',
  listening: false,
  error: null,
  setPiece: (piece) => set({ piece }),
  setTranscript: (t) => set({ transcript: t }),
  setResponse: (r) => set({ response: r }),
  setListening: (b) => set({ listening: b }),
  setError: (e) => set({ error: e }),
}));

// --- Speech Recognition interface (D9 seam — replaceable with OpenAI Realtime later) ---
class SpeechRecognitionInterface {
  constructor(onResult) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      this.available = false;
      return;
    }
    this.available = true;
    this.recognition = new SR();
    this.recognition.continuous = false;
    this.recognition.lang = 'en-US';
    this.recognition.interimResults = false;
    this.recognition.onresult = (e) => onResult(e.results[0][0].transcript);
    this.recognition.onerror = (e) => {
      store.getState().setError('Speech error: ' + e.error);
      store.getState().setListening(false);
    };
    this.recognition.onend = () => store.getState().setListening(false);
  }
  start() {
    if (!this.available) return;
    store.getState().setListening(true);
    store.getState().setError(null);
    this.recognition.start();
  }
}

// --- Scripted intent dispatch ---
function processIntent(transcript, piece) {
  const t = transcript.toLowerCase();
  if (!piece) return 'No piece loaded. Scan a QR code or search for a piece below.';
  const s = piece.specs;

  if (/season|care|wash|clean/.test(t)) {
    return s.care_hypothesis || 'No care data available for this piece.';
  }
  if (/sear|temperature|heat|induction|source/.test(t)) {
    const sources = Array.isArray(s.heat_sources)
      ? s.heat_sources.join(', ')
      : (s.heat_sources || '—');
    const intent = s.interaction_performance_intent ? ' — ' + s.interaction_performance_intent : '';
    return 'Heat sources: ' + sources + intent;
  }
  if (/concept|what is|about|tell me|thesis/.test(t)) {
    return s.concept_thesis || 'No concept data available.';
  }
  if (/material|made of|construction/.test(t)) {
    return s.material_architecture || 'No material data available.';
  }
  if (/cart|buy|add|purchase/.test(t)) {
    showCartCta(piece);
    return 'Showing cart option for ' + piece.title + '.';
  }
  return 'Heard: "' + transcript + '". Try asking about care, heat sources, the concept, or material.';
}

// --- Thermal calculator ---
function buildThermalTable(piece) {
  if (!piece || !piece.specs) return null;
  const rawSources = piece.specs.heat_sources;
  if (!rawSources) return null;
  const sources = Array.isArray(rawSources)
    ? rawSources
    : rawSources.split(',').map((s) => s.trim()).filter(Boolean);
  if (!sources.length) return null;

  const intent = piece.specs.interaction_performance_intent || '—';
  const table = document.createElement('table');
  table.className = 'kansa-thermal';
  const caption = document.createElement('caption');
  caption.textContent = 'Thermal compatibility';
  table.appendChild(caption);
  table.innerHTML += '<thead><tr><th>Heat source</th><th>Performance intent</th></tr></thead>';
  const tbody = document.createElement('tbody');
  sources.forEach((src) => {
    const tr = document.createElement('tr');
    tr.innerHTML = '<td>' + src + '</td><td>' + intent + '</td>';
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  return table;
}

// --- Cart CTA ---
function showCartCta(piece) {
  const el = document.getElementById('kansa-cart-cta');
  if (!el) return;
  el.innerHTML = '<a href="/products/' + piece.handle + '" class="button">View ' + piece.title + '</a>';
  el.hidden = false;
}

// --- Fetch piece from Shopify AJAX API ---
async function fetchPiece(handle) {
  try {
    const res = await fetch('/products/' + handle + '.js');
    if (!res.ok) return null;
    const data = await res.json();
    const heatSourceKeys = ['induction', 'gas', 'electric', 'oven', 'open_flame'];
    return {
      handle: data.handle,
      title: data.title,
      specs: {
        concept_thesis: data.description
          ? data.description.replace(/<[^>]+>/g, '').slice(0, 250)
          : '',
        care_hypothesis: 'Hand wash recommended. Refer to the product page for full care instructions.',
        heat_sources: (data.tags || []).filter((t) => heatSourceKeys.includes(t)),
        interaction_performance_intent: data.variants && data.variants[0]
          ? data.variants[0].title
          : '',
        material_architecture: '',
      },
    };
  } catch {
    return null;
  }
}

// --- Render ---
function render(root) {
  const state = store.getState();
  const piece = state.piece;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const pieceBarHTML = piece
    ? '<p class="kansa-ui__piece-name"><strong>' + piece.title + '</strong>'
      + '<span class="kansa-badge" aria-label="Evidence tier: concept specification">CONCEPT SPEC</span></p>'
    : '<div class="kansa-ui__search">'
      + '<label for="kansa-search" class="kansa-ui__search-label">Search for a piece</label>'
      + '<input id="kansa-search" type="search" placeholder="e.g. forge relay skillet"'
      + ' class="kansa-ui__search-input" autocomplete="off" aria-label="Search catalog by product name">'
      + '</div>';

  const thermalId = 'kansa-thermal-mount';
  const micLabel = state.listening ? 'Listening\u2026' : 'Ask a question';
  const micIcon = state.listening ? '\u25c9' : '\u25cb';
  const micActive = state.listening ? ' kansa-ui__mic-btn--active' : '';

  root.innerHTML =
    '<div class="kansa-ui">'
    + '<div class="kansa-ui__piece-bar">' + pieceBarHTML + '</div>'
    + (piece ? '<div id="' + thermalId + '"></div>' : '')
    + '<div class="kansa-ui__voice">'
    + '<button id="kansa-mic-btn" class="kansa-ui__mic-btn' + micActive + '"'
    + ' aria-label="' + (state.listening ? 'Listening, speak now' : 'Ask a question by voice') + '"'
    + ' aria-pressed="' + state.listening + '">'
    + '<span aria-hidden="true">' + micIcon + '</span> ' + micLabel
    + '</button>'
    + '<p class="kansa-ui__voice-note">Requires microphone permission \u00b7 HTTPS only</p>'
    + '</div>'
    + (state.transcript ? '<p class="kansa-ui__transcript"><em>\u201c' + state.transcript + '\u201d</em></p>' : '')
    + (state.response ? '<div class="kansa-ui__response">' + state.response + '</div>' : '')
    + (state.error ? '<p class="kansa-ui__error" role="alert">' + state.error + '</p>' : '')
    + '<div id="kansa-cart-cta" hidden></div>'
    + '</div>';

  // Mount thermal table with animation
  if (piece) {
    const thermalMount = document.getElementById(thermalId);
    const table = buildThermalTable(piece);
    if (table && thermalMount) {
      thermalMount.appendChild(table);
      if (!reduceMotion) {
        animate(table, { opacity: [0, 1], y: [8, 0] }, { duration: 0.4 });
      }
    }
  }

  // Wire mic button
  const sr = new SpeechRecognitionInterface((transcript) => {
    store.getState().setTranscript(transcript);
    store.getState().setResponse(processIntent(transcript, store.getState().piece));
    render(root);
  });

  const micBtn = document.getElementById('kansa-mic-btn');
  if (micBtn) {
    if (!sr.available) {
      micBtn.disabled = true;
      micBtn.title = 'Speech recognition not supported in this browser or context';
    } else {
      micBtn.addEventListener('click', () => {
        sr.start();
        render(root);
      }, { once: true });
    }
  }

  // Wire search input with debounce
  const searchInput = document.getElementById('kansa-search');
  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      const val = e.target.value.trim();
      if (val.length < 3) return;
      debounceTimer = setTimeout(async () => {
        const handle = val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const piece = await fetchPiece(handle);
        if (piece) {
          store.getState().setPiece(piece);
          render(root);
        }
      }, 400);
    });
  }
}

// --- Init ---
const root = document.getElementById('kansa-root');
if (root) {
  const urlHandle = new URLSearchParams(window.location.search).get('piece');
  const attrHandle = root.dataset.pieceHandle || '';
  const handle = urlHandle || attrHandle;

  if (handle) {
    fetchPiece(handle).then((piece) => {
      if (piece) store.getState().setPiece(piece);
      render(root);
    });
  } else {
    render(root);
  }
}

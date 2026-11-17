/**
 * Maison Tavo — client search assist for Horizon predictive + /search.
 * Fuzzy typo tolerance + synonym/alias expansion over Shopify results.
 * No new screens; hooks existing predictive-search-component and search forms.
 */

/** @typedef {{ canon: string, boost?: number }} AliasTarget */

/**
 * Intent aliases → Shopify-indexed catalog terms (titles, types, tags, lineups).
 * Sourced from packages/catalog seed lineups / product_types / agent intents.
 * @type {Record<string, string[]>}
 */
/** Keys are preferred Shopify-indexed terms; values are user synonyms/intents. */
const ALIAS_GROUPS = {
  skillet: [
    'skillet',
    'kadai',
    'karahi',
    'wok',
    'frying pan',
    'fry pan',
    'saute',
    'sauté',
    'deep pan',
  ],
  tava: ['tava', 'tawa', 'griddle', 'flat pan', 'roti pan'],
  forge: ['forge', 'forge hybrid', 'carbon steel', 'steel pan', 'dual mass'],
  terre: [
    'terre',
    'terre clay',
    'clay',
    'clay pot',
    'earthenware',
    'ceramic',
    'tagine',
    'kulhad',
    'braiser',
  ],
  kansa: ['kansa', 'bronze', 'bell bronze', 'care', 'seasoning', 'patina'],
  knife: ['knife', 'knives', 'chef knife', 'kuro', 'blade', 'strip'],
  induction: ['induction', 'induction ready', 'hob'],
};

/** Lineup / collection ranking boosts (matched against tags + title). */
const LINEUP_BOOSTS = [
  { needle: 'forge hybrid', score: 28 },
  { needle: 'forge × terre', score: 26 },
  { needle: 'forge x terre', score: 26 },
  { needle: 'terre clay', score: 26 },
  { needle: 'kuro strip', score: 24 },
  { needle: 'forge', score: 14 },
  { needle: 'terre', score: 14 },
  { needle: 'kuro', score: 12 },
  { needle: 'skillet', score: 10 },
  { needle: 'tava', score: 10 },
  { needle: 'kansa', score: 8 },
];

/** Vocabulary for typo correction (unique tokens from aliases + lineups). */
const VOCAB = [
  ...new Set(
    Object.values(ALIAS_GROUPS)
      .flat()
      .concat([
        'forge hybrid',
        'terre clay',
        'kuro strip',
        'carbon steel',
        'bell bronze',
        'braiser',
        'griddle',
        'tagine',
        'kulhad',
        'tongs',
        'platter',
      ]),
  ),
];

/**
 * @param {string} s
 * @returns {string}
 */
function normalize(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const rows = a.length + 1;
  const cols = b.length + 1;
  /** @type {number[]} */
  let prev = new Array(cols);
  /** @type {number[]} */
  let curr = new Array(cols);
  for (let j = 0; j < cols; j++) prev[j] = j;
  for (let i = 1; i < rows; i++) {
    curr[0] = i;
    const ca = a.charCodeAt(i - 1);
    for (let j = 1; j < cols; j++) {
      const cost = ca === b.charCodeAt(j - 1) ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[b.length];
}

/**
 * @param {string} token
 * @param {number} [maxDist]
 * @returns {string | null}
 */
function closestVocab(token, maxDist = 2) {
  const t = normalize(token);
  if (!t || t.length < 3) return null;
  let best = null;
  let bestDist = maxDist + 1;
  for (const word of VOCAB) {
    const w = normalize(word);
    if (Math.abs(w.length - t.length) > maxDist) continue;
    const d = levenshtein(t, w);
    if (d < bestDist) {
      bestDist = d;
      best = w;
    }
  }
  return bestDist <= maxDist ? best : null;
}

/**
 * Exact synonym match only. Never treat "hybrid" as a hit for "forge hybrid"
 * (that caused fetch query "forge forge").
 * @param {string} token
 * @param {string} synonym
 */
function tokenMatchesSynonym(token, synonym) {
  const t = normalize(token);
  const s = normalize(synonym);
  return Boolean(t && s && t === s);
}

/**
 * Map a single token to its alias-group canon (Shopify-indexed title/type/tag).
 * @param {string} token
 * @returns {string | null}
 */
function canonForToken(token) {
  const raw = normalize(token);
  if (!raw) return null;

  for (const [canon, group] of Object.entries(ALIAS_GROUPS)) {
    if (normalize(canon) === raw) return canon;
    if (group.some((g) => tokenMatchesSynonym(raw, g))) return canon;
  }

  const maxDist = raw.length <= 4 ? 1 : 2;
  const fuzzy = closestVocab(raw, maxDist);
  if (!fuzzy || fuzzy === raw) return null;

  // Only accept single-token fuzzy corrections (ignore multi-word vocab like "forge hybrid").
  if (fuzzy.includes(' ')) return null;

  for (const [canon, group] of Object.entries(ALIAS_GROUPS)) {
    if (normalize(canon) === fuzzy) return canon;
    if (group.some((g) => tokenMatchesSynonym(fuzzy, g))) return canon;
  }
  return fuzzy;
}

/**
 * Expand a raw query into Shopify-friendly search terms.
 * Synonyms (kadai → skillet) and typos (skilet → skillet) become indexed terms
 * for the Shopify predictive/search request; original intent is kept for re-rank.
 * @param {string} raw
 */
function expandQuery(raw) {
  const original = String(raw || '').trim();
  const norm = normalize(original);
  if (!norm) {
    return { query: original, original, expanded: false, aliases: /** @type {string[]} */ ([]) };
  }

  // Full-phrase synonym before token splitting ("forge hybrid", "clay pot", "frying pan").
  // Always fetch with the indexed canon; original is kept for client re-rank.
  for (const [canon, group] of Object.entries(ALIAS_GROUPS)) {
    const exactCanon = normalize(canon) === norm;
    const exactSynonym = group.some((g) => normalize(g) === norm);
    if (exactCanon || exactSynonym) {
      const related = new Set([canon]);
      for (const g of group.slice(0, 3)) related.add(normalize(g).split(' ')[0]);
      return {
        query: canon,
        original,
        expanded: normalize(canon) !== norm,
        aliases: [...related],
      };
    }
  }

  const tokens = norm.split(' ');
  /** @type {Set<string>} */
  const aliases = new Set();
  /** @type {string[]} */
  const fetchTokens = [];

  const stop = new Set(['a', 'an', 'the', 'and', 'or', 'for', 'pot', 'pan', 'of']);

  for (const token of tokens) {
    const canon = canonForToken(token);
    if (canon) {
      aliases.add(canon);
      const group = ALIAS_GROUPS[canon];
      if (group) {
        for (const g of group.slice(0, 3)) aliases.add(normalize(g).split(' ')[0]);
      }
      if (!fetchTokens.includes(canon)) fetchTokens.push(canon);
    } else if (!stop.has(token) && !fetchTokens.includes(token)) {
      fetchTokens.push(token);
    }
  }

  // Single-token synonym/typo → one strong Shopify-indexed term.
  // Multi-word: unique corrected tokens only (never "forge forge").
  const query =
    (aliases.size && tokens.length === 1
      ? [...aliases][0]
      : fetchTokens.join(' ')) || original;
  const expanded = normalize(query) !== norm;
  return { query, original, expanded, aliases: [...aliases] };
}

/**
 * Score a searchable corpus string against the user query + aliases.
 * @param {string} corpus
 * @param {string} originalQuery
 * @param {string[]} aliases
 */
function scoreCorpus(corpus, originalQuery, aliases = []) {
  const hay = normalize(corpus);
  if (!hay) return 0;
  const q = normalize(originalQuery);
  let score = 0;

  if (q && hay.includes(q)) score += 100;
  if (q) {
    for (const token of q.split(' ')) {
      if (token.length < 2) continue;
      if (hay.includes(token)) score += 36;
      else {
        // Fuzzy token presence against each hay word
        for (const word of hay.split(' ')) {
          if (word.length < 3) continue;
          const d = levenshtein(token, word);
          if (d <= 1) score += 22;
          else if (d === 2 && token.length > 4) score += 10;
        }
      }
    }
  }

  for (const alias of aliases) {
    const a = normalize(alias);
    if (a && hay.includes(a)) score += 40;
  }

  for (const boost of LINEUP_BOOSTS) {
    if (hay.includes(boost.needle)) score += boost.score;
  }

  return score;
}

/**
 * Re-rank product result cards already rendered by Shopify Liquid.
 * @param {ParentNode} root
 * @param {string} originalQuery
 * @param {string[]} [aliases]
 */
function rerankResults(root, originalQuery, aliases = []) {
  if (!root || !originalQuery) return 0;

  const list =
    root.querySelector('.predictive-search-results__wrapper-products') ||
    root.querySelector('.product-grid') ||
    root.querySelector('[data-maison-search-list]');

  if (!list) return 0;

  const items = Array.from(
    list.querySelectorAll(
      ':scope > .predictive-search-results__card--product, :scope > .product-grid__item, :scope > [data-maison-search-item]',
    ),
  ).filter((el) => el instanceof HTMLElement);

  if (items.length < 2) return items.length;

  const ranked = items
    .map((el, index) => {
      const corpus =
        el.getAttribute('data-search-corpus') ||
        el.querySelector('[data-search-corpus]')?.getAttribute('data-search-corpus') ||
        el.textContent ||
        '';
      return {
        el,
        index,
        score: scoreCorpus(corpus, originalQuery, aliases),
      };
    })
    .sort((a, b) => b.score - a.score || a.index - b.index);

  for (const { el } of ranked) list.appendChild(el);
  return ranked.length;
}

/**
 * Open Horizon search modal and run predictive search with expanded query.
 * @param {string} rawQuery
 */
function openPredictiveWithQuery(rawQuery) {
  const modal = document.getElementById('search-modal');
  if (!(modal instanceof HTMLElement) || typeof /** @type {any} */ (modal).showDialog !== 'function') {
    // Fallback: native Shopify search page with expanded q
    const { query } = expandQuery(rawQuery);
    const url = new URL('/search', location.origin);
    url.searchParams.set('q', query || rawQuery);
    url.searchParams.set('type', 'product');
    location.assign(url.toString());
    return;
  }

  /** @type {any} */ (modal).showDialog();

  const input = modal.querySelector('predictive-search-component [ref="searchInput"], .search-input');
  if (!(input instanceof HTMLInputElement)) return;

  const { query, original, aliases } = expandQuery(rawQuery);
  input.value = query || rawQuery;
  input.focus();

  // Stash original intent for re-rank after morph
  const host = input.closest('predictive-search-component');
  if (host instanceof HTMLElement) {
    host.dataset.maisonOriginalQuery = original || rawQuery;
    host.dataset.maisonAliases = aliases.join(',');
  }

  input.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: input.value }));
}

/**
 * Wire hero search form → existing #search-modal (no new screen).
 */
function wireHeroSearch() {
  const form = document.querySelector('.maison-hero__search');
  if (!(form instanceof HTMLFormElement) || form.dataset.maisonSearchWired === '1') return;
  form.dataset.maisonSearchWired = '1';

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const input = form.querySelector('input[type="search"], input[name="q"]');
    const raw = input instanceof HTMLInputElement ? input.value.trim() : '';
    if (!raw) {
      const modal = document.getElementById('search-modal');
      if (modal && typeof /** @type {any} */ (modal).showDialog === 'function') {
        /** @type {any} */ (modal).showDialog();
        return;
      }
    }
    openPredictiveWithQuery(raw);
  });
}

/**
 * Expand aliases on /search form submit (still Shopify search page).
 */
function wireSearchPageForm() {
  const forms = document.querySelectorAll('form.search-page-input__parent, form[action*="/search"]');
  for (const form of forms) {
    if (!(form instanceof HTMLFormElement) || form.dataset.maisonSearchWired === '1') continue;
    if (form.classList.contains('predictive-search-form') || form.classList.contains('maison-hero__search')) {
      continue;
    }
    form.dataset.maisonSearchWired = '1';

    form.addEventListener('submit', () => {
      const input = form.querySelector('input[name="q"]');
      if (!(input instanceof HTMLInputElement)) return;
      const { query, expanded } = expandQuery(input.value);
      if (expanded && query) input.value = query;
    });
  }
}

/**
 * Re-rank /search product grid using data-search-corpus on cards.
 */
function rerankSearchPage() {
  const params = new URLSearchParams(location.search);
  const q = params.get('q');
  if (!q) return;
  const { aliases, original } = expandQuery(q);
  const root = document.querySelector('results-list, .product-grid-container, .collection-wrapper');
  if (root) rerankResults(root, original || q, aliases);
}

/**
 * Called from predictive-search.js after Shopify morph.
 * @param {HTMLElement} resultsRoot
 * @param {string} fetchQuery
 * @param {string} [originalQuery]
 * @param {string[]} [aliases]
 */
function afterPredictiveMorph(resultsRoot, fetchQuery, originalQuery, aliases) {
  const intent = originalQuery || fetchQuery;
  const aliasList = aliases?.length ? aliases : expandQuery(intent).aliases;
  return rerankResults(resultsRoot, intent, aliasList);
}

/**
 * Expand for predictive fetch; keep original for ranking.
 * @param {string} raw
 */
function preparePredictiveQuery(raw) {
  const result = expandQuery(raw);
  return result;
}

const MaisonSearchAssist = {
  expandQuery,
  preparePredictiveQuery,
  scoreCorpus,
  rerankResults,
  afterPredictiveMorph,
  openPredictiveWithQuery,
  levenshtein,
  ALIAS_GROUPS,
};

const root =
  typeof globalThis !== 'undefined'
    ? globalThis
    : typeof window !== 'undefined'
      ? window
      : undefined;
if (root) {
  root.MaisonSearchAssist = MaisonSearchAssist;
  if (typeof window !== 'undefined') window.MaisonSearchAssist = MaisonSearchAssist;
}

export {
  expandQuery,
  preparePredictiveQuery,
  scoreCorpus,
  rerankResults,
  afterPredictiveMorph,
  ALIAS_GROUPS,
  MaisonSearchAssist,
};
export default MaisonSearchAssist;

function boot() {
  wireHeroSearch();
  wireSearchPageForm();
  rerankSearchPage();
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
  // Barba / theme section reloads
  document.addEventListener('shopify:section:load', boot);
}

/**
 * Local intent matcher + fixture answers (no live model).
 * Fuzzy scoring mirrors Fuse-style token overlap without a heavy dep.
 */

import { INTENT_ACTIVITY } from './fixtures.js';

const HEAT_ALL = ['induction', 'gas', 'electric', 'oven', 'open_flame'];

/** Levenshtein distance capped for short tokens (typo tolerance). */
function editDistance(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  if (Math.abs(a.length - b.length) > 2) return 99;
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 0; i < a.length; i++) {
    let prev = i;
    row[0] = i + 1;
    for (let j = 0; j < b.length; j++) {
      const tmp = row[j + 1];
      const cost = a[i] === b[j] ? 0 : 1;
      row[j + 1] = Math.min(row[j + 1] + 1, row[j] + 1, prev + cost);
      prev = tmp;
    }
  }
  return row[b.length];
}

function fuzzyTokenHit(queryTokens, phraseTok) {
  if (phraseTok.length < 4) return queryTokens.includes(phraseTok);
  return queryTokens.some((qt) => {
    if (qt === phraseTok) return true;
    if (qt.length < 4) return false;
    return editDistance(qt, phraseTok) <= 1;
  });
}

/** @type {{ id: string, phrases: string[], weight?: number }[]} */
export const INTENT_REGISTRY = [
  {
    id: 'care_season',
    phrases: [
      'how do i season',
      'season this pan',
      're-season',
      'black glass patina',
      'water cure',
      'cure clay',
      'oil the surface',
      'first seasoning',
    ],
  },
  {
    id: 'heat_check',
    phrases: [
      'heat sources',
      'induction',
      'can i use gas',
      'oven safe',
      'open flame',
      'what heat',
      'preheat',
      'searing',
      'diffuser',
      'compatible heat',
    ],
  },
  {
    id: 'acid',
    phrases: [
      'tomato',
      'wine',
      'lemon',
      'vinegar',
      'citrus',
      'acidic',
      'acid',
      'tamarind',
    ],
  },
  {
    id: 'wash',
    phrases: [
      'soap',
      'dishwasher',
      'how to clean',
      'wash',
      'rust',
      'soak',
      'sink',
      'hygiene',
    ],
  },
  {
    id: 'material',
    phrases: [
      'made of',
      'alloy',
      'material',
      'metallurgy',
      'clay body',
      'construction',
      'what is it made',
    ],
  },
  {
    id: 'triage',
    phrases: [
      'sticky',
      'gummy',
      'surface wrong',
      'something wrong',
      'stuck food',
      'crazing',
      'scorch',
      'restore',
      'triage',
      'diagnose',
    ],
  },
  {
    id: 'ritual',
    phrases: ['care ritual', 'rites', 'full protocol', 'care rites', 'covenant'],
  },
  {
    id: 'commerce',
    phrases: ['buy', 'add to cart', 'purchase', 'show product', 'where to buy', 'price'],
  },
  {
    id: 'ar_place',
    phrases: ['ar', 'augmented', 'see in my kitchen', 'place on table', '3d model', 'sight'],
  },
  {
    id: 'cv_triage',
    phrases: ['photo', 'picture', 'look at my pan', 'camera', 'scan surface', 'what do you see'],
  },
];

/**
 * @param {string} a
 * @param {string} b
 */
function tokenOverlap(a, b) {
  const ta = new Set(a.split(/\s+/).filter(Boolean));
  const tb = b.split(/\s+/).filter(Boolean);
  if (!ta.size || !tb.length) return 0;
  let hit = 0;
  for (const t of tb) if (ta.has(t)) hit += 1;
  return hit / Math.max(ta.size, tb.length);
}

/**
 * @param {string} query
 * @returns {{ intent: string | null, confidence: number, ranked: { id: string, score: number }[] }}
 */
export function matchIntent(query) {
  const q = String(query || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!q) return { intent: null, confidence: 0, ranked: [] };

  const qTokens = q.split(/\s+/).filter(Boolean);
  const ranked = INTENT_REGISTRY.map((entry) => {
    let best = 0;
    for (const phrase of entry.phrases) {
      // Whole-phrase / whole-token containment (avoid matching "ar" inside "are")
      if (phrase.length >= 2) {
        const re = new RegExp(`(?:^|\\s)${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:\\s|$)`);
        if (re.test(q) || q === phrase) {
          best = Math.max(best, phrase.length <= 3 ? 0.85 : 0.95);
          continue;
        }
      }
      if (phrase.length > 4 && phrase.includes(q) && q.length > 4) {
        best = Math.max(best, 0.9);
        continue;
      }
      best = Math.max(best, tokenOverlap(q, phrase) * 0.85);
      const stop = new Set(['this', 'that', 'with', 'from', 'have', 'into', 'your', 'about']);
      const pTokens = phrase.split(' ').filter((t) => t.length > 3 && !stop.has(t));
      let hits = 0;
      for (const tok of pTokens) {
        if (fuzzyTokenHit(qTokens, tok)) hits += 1;
      }
      if (pTokens.length) best = Math.max(best, (hits / pTokens.length) * 0.75);
    }
    return { id: entry.id, score: best };
  }).sort((a, b) => b.score - a.score);

  const top = ranked[0];
  if (!top || top.score < 0.35) return { intent: null, confidence: top?.score || 0, ranked };
  return { intent: top.id, confidence: top.score, ranked };
}

/**
 * @param {import('./catalog.js').KansaPiece | null} piece
 * @param {string} intentId
 */
export function buildFixtureAnswer(piece, intentId) {
  if (!piece) {
    return {
      tag: 'KANSA',
      text: 'Select a piece first, or open Kansa from a product with ?piece= in the URL.',
      tools: [],
      followUps: ['How do I season carbon steel?', 'Can I use induction?'],
    };
  }

  const title = piece.title;
  const isClay = piece.materialCategory === 'clay';
  const isBlade = piece.materialCategory === 'blade';
  const cookingSurface = String(piece.lining_material || piece.primary_material || '').toLowerCase();
  const seasonsWithOil = /carbon steel|cast iron|seasoned iron/.test(cookingSurface) && !/stainless/.test(cookingSurface);
  const conceptNote = piece.claim_status === 'CONCEPT_SPEC' ? ' This is a design target; check the finished piece’s verified instructions before cooking.' : '';
  const heatList = (piece.heat_sources || []).join(', ') || 'none listed';

  /** @type {{ tag: string, text: string, tools: string[], followUps: string[] }} */
  let out;

  switch (intentId) {
    case 'care_season':
      if (isClay) {
        out = {
          tag: 'CLAY FIRST USE',
          text: `${title}: check the finished vessel’s first-use guide. Some clay cookware calls for soaking or curing; a fifteen-minute full soak has not been verified for this piece.${conceptNote}`,
          tools: ['open_care_ritual'],
          followUps: ['Can I use this on gas or induction?', 'How to clean clay without cracking?'],
        };
      } else if (isBlade) {
        out = {
          tag: 'BLADE PRESERVATION',
          text: `${title} does not take pan seasoning. Hand wash, wipe bone dry, and apply a micro-film of camellia oil in humid climates. ${piece.care_hypothesis || ''}`,
          tools: ['link_product'],
          followUps: ['Can I cut lemons?', 'How should I sharpen this?'],
        };
      } else if (seasonsWithOil) {
        out = {
          tag: 'CARBON STEEL SEASONING',
          text: `${title} has a seasoning-capable surface in the catalogue. Use a thin film of suitable cooking oil and follow the maker’s verified heat and cleaning instructions for the finished model. Avoid fixed time or temperature recipes until those instructions are confirmed.${conceptNote}`,
          tools: ['open_care_ritual', 'link_product'],
          followUps: ['Can I use soap?', 'What about tomatoes and wine?'],
        };
      } else {
        out = {
          tag: 'METAL CARE',
          text: `${title}: the listed cooking surface does not call for carbon steel seasoning. Stainless steel does not need an oil patina. Check the exact model’s care guide for cleaning and heat limits.${conceptNote}`,
          tools: ['open_care_ritual', 'link_product'],
          followUps: ['How should I wash it?', 'What about tomatoes and wine?'],
        };
      }
      break;

    case 'heat_check':
      out = {
        tag: 'THERMAL SPEC',
        text: `${title} heat profile: ${piece.heat_compatibility || 'See compatibility matrix.'} Listed sources: ${heatList}. Induction compatible: ${piece.induction_compatible ? 'yes' : 'no'}.`,
        tools: ['check_heat'],
        followUps: ['Can I cook tomato or wine?', 'Show care rites'],
      };
      break;

    case 'acid':
      if (isClay) {
        out = {
          tag: 'ACID · CLAY',
          text: `${title}: acid resistance depends on the tested food-contact surface. Do not assume an unglazed terracotta concept is acid-safe. Check the finished vessel’s specification before cooking tomato, wine or citrus.${conceptNote}`,
          tools: ['lookup_piece'],
          followUps: ['First-use guidance?', 'Heat source guidance?'],
        };
      } else if (isBlade) {
        out = {
          tag: 'ACID · BLADE',
          text: `${title}: check the knife’s finished care guide and clean and dry it after cutting acidic foods.`,
          tools: ['link_product'],
          followUps: ['Sharpening guidance?', 'Dishwasher?'],
        };
      } else if (seasonsWithOil) {
        out = {
          tag: 'ACID · METAL',
          text: `${title}: long acidic reductions can affect a young carbon steel seasoning layer. Check the model’s verified guide for its cooking surface and suitable foods.${conceptNote}`,
          tools: ['open_care_ritual'],
          followUps: ['How do I season?', 'Rust appeared - what now?'],
        };
      } else {
        out = {
          tag: 'ACID · METAL',
          text: `${title}: stainless steel does not rely on a seasoning layer. Check the exact model’s food-contact and care specification before a long acidic cook.${conceptNote}`,
          tools: ['lookup_piece', 'link_product'],
          followUps: ['How should I wash it?', 'Heat sources?'],
        };
      }
      break;

    case 'wash':
      out = {
        tag: 'CARE HYGIENE',
        text: `${piece.care_instructions || piece.care_hypothesis || `Care for ${title}.`} Dishwasher: ${piece.dishwasher_suitability || 'see care notes'}. Microwave: ${piece.microwave_suitability || 'n/a'}.`,
        tools: ['open_care_ritual'],
        followUps: isClay
          ? ['Water cure ritual?', 'Scorched base fix?']
          : ['How to season?', 'Orange rust fix?'],
      };
      break;

    case 'material':
      out = {
        tag: 'MATERIAL',
        text: `${title}: ${piece.primary_material || ''}. ${piece.lining_material ? `Lining: ${piece.lining_material}.` : ''} Architecture: ${piece.material_architecture || piece.concept_thesis || ''}`,
        tools: ['lookup_piece', 'link_product'],
        followUps: ['Heat sources?', 'Care protocol?'],
      };
      break;

    case 'triage':
      out = {
        tag: 'SURFACE TRIAGE',
        text: `Open Surface Triage for ${title}, or use Look to photograph the cooking surface and map it to a restoration prescription.`,
        tools: ['open_triage', 'cv_triage'],
        followUps: ['Photo the pan', 'Show metal rites'],
      };
      break;

    case 'ritual':
      out = {
        tag: 'RITES',
        text: `The full ${piece.ritualTrack === 'clay' ? 'Terre Clay' : 'Forge metal'} care rites live on the Care page. I can take you there with the correct track selected.`,
        tools: ['open_care_ritual'],
        followUps: ['Seasoning steps?', 'Heat check?'],
      };
      break;

    case 'commerce':
      out = {
        tag: 'PRODUCT',
        text: `${title} is in the catalogue${piece.list_price_gbp ? ` with a proposed list price of £${piece.list_price_gbp}` : ''}. Check the storefront for current pricing and availability.`,
        tools: ['link_product'],
        followUps: ['Heat compatibility?', 'Care protocol?'],
      };
      break;

    case 'ar_place':
      out = {
        tag: 'SIGHT',
        text: `Open Sight to place a study of ${title} in your space. A poster holds the first frame until the model is ready.`,
        tools: ['open_ar'],
        followUps: ['Heat sources?', 'Care rites?'],
      };
      break;

    case 'cv_triage':
      out = {
        tag: 'LOOK',
        text: `Use Look to photograph ${title}'s surface. I will suggest a triage class — confirm it before applying a remedy.`,
        tools: ['cv_triage'],
        followUps: ['Sticky surface?', 'Rust spots?'],
      };
      break;

    default:
      out = {
        tag: 'KANSA GUIDE',
        text: `For ${title}: ${piece.care_hypothesis || piece.care_instructions || 'Ask about seasoning, heat, acid, or cleaning.'} Try a job card below, or ask in your own words.`,
        tools: ['lookup_piece'],
        followUps: [
          isClay ? 'Water cure?' : 'How do I season?',
          'Heat sources for this piece?',
          'Something wrong with the surface',
        ],
      };
  }

  return out;
}

/**
 * Thermal compatibility rows from catalog heat_sources only.
 * @param {import('./catalog.js').KansaPiece} piece
 */
export function thermalMatrix(piece) {
  const sources = piece.heat_sources || [];
  const set = new Set(sources.map((h) => String(h).toLowerCase()));
  const hasAny = sources.length > 0 || piece.induction_compatible;

  return HEAT_ALL.map((source) => {
    if (set.has(source)) return { source, status: 'compatible' };
    if (source === 'induction' && piece.induction_compatible) {
      return { source, status: 'compatible' };
    }
    if (piece.materialCategory === 'blade' || piece.materialCategory === 'accessory') {
      return { source, status: 'not' };
    }
    if (hasAny) return { source, status: 'not' };
    return { source, status: 'unknown' };
  });
}

export function activityFor(intentId) {
  return INTENT_ACTIVITY[intentId] || INTENT_ACTIVITY.default;
}

export { HEAT_ALL };

/**
 * Load kansa-catalog.json with fallback presets.
 */

/** @typedef {{
 *  handle: string,
 *  title: string,
 *  lineup: string,
 *  product_type?: string,
 *  sku?: string,
 *  claim_status?: string,
 *  primary_material?: string,
 *  lining_material?: string,
 *  material_architecture?: string,
 *  heat_sources: string[],
 *  heat_compatibility?: string,
 *  induction_compatible?: boolean,
 *  care_hypothesis?: string,
 *  care_instructions?: string,
 *  dishwasher_suitability?: string,
 *  microwave_suitability?: string,
 *  food_contact_suitability?: string,
 *  concept_thesis?: string,
 *  agent_intents?: string[],
 *  negative_constraints?: string[],
 *  list_price_gbp?: number,
 *  materialCategory: 'metal'|'clay'|'blade'|'accessory',
 *  ritualTrack: 'metal'|'clay',
 *  productUrl: string,
 * }} KansaPiece */

/** @type {Record<string, KansaPiece>} */
export const FALLBACK_PIECES = {
  'forge-tawa': {
    handle: 'forge-tawa',
    title: 'Forge Tawa',
    lineup: 'Forge',
    materialCategory: 'metal',
    ritualTrack: 'metal',
    heat_sources: [],
    induction_compatible: false,
    care_hypothesis: 'Check the current product record for verified care and hob guidance.',
    primary_material: 'Stainless steel cookware',
    productUrl: '/products/forge-tawa',
  },
  'chulha-tawa': {
    handle: 'chulha-tawa',
    title: 'Chulha Tawa',
    lineup: 'Chulha',
    materialCategory: 'clay',
    ritualTrack: 'clay',
    heat_sources: [],
    induction_compatible: false,
    care_hypothesis: 'Clay care and heat compatibility are still being tested.',
    primary_material: 'Terracotta design target',
    productUrl: '/products/chulha-tawa',
  },
};

const STORAGE_KEY = 'mt_kansa_session';

/**
 * Resolve catalog asset URL from the script tag or data attribute.
 * @param {HTMLElement | null} root
 */
function catalogUrl(root) {
  const fromData = root?.closest('[data-kansa-catalog]')?.getAttribute('data-kansa-catalog');
  if (fromData) return fromData;
  const script = document.querySelector('script[src*="microapp-kansa"]');
  if (script?.src) {
    return script.src.replace(/microapp-kansa\.js.*$/, 'kansa-catalog.json');
  }
  return '/cdn/shop/t/1/assets/kansa-catalog.json';
}

/**
 * @param {HTMLElement | null} root
 * @returns {Promise<{ byHandle: Record<string, KansaPiece>, list: KansaPiece[] }>}
 */
export async function loadCatalog(root) {
  /** @type {Record<string, KansaPiece>} */
  let byHandle = { ...FALLBACK_PIECES };
  try {
    const url = catalogUrl(root);
    const res = await fetch(url, { credentials: 'same-origin' });
    if (res.ok) {
      const data = await res.json();
      const pieces = Array.isArray(data.pieces) ? data.pieces : [];
      if (pieces.length) {
        byHandle = {};
        for (const p of pieces) {
          byHandle[p.handle] = {
            ...p,
            heat_sources: p.heat_sources || [],
            productUrl: p.productUrl || `/products/${p.handle}`,
            ritualTrack: p.ritualTrack || (p.materialCategory === 'clay' ? 'clay' : 'metal'),
            materialCategory: p.materialCategory || 'metal',
          };
        }
      }
    }
  } catch (err) {
    console.debug('Kansa catalog fetch fallback:', err);
  }
  return { byHandle, list: Object.values(byHandle) };
}

export function readSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * @param {{ handle?: string | null, messages?: unknown[], activeTab?: string }} state
 */
export function writeSession(state) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        handle: state.handle || null,
        messages: state.messages || [],
        activeTab: state.activeTab || 'chat',
        updatedAt: Date.now(),
      }),
    );
  } catch {
    /* quota */
  }
}

export { STORAGE_KEY };

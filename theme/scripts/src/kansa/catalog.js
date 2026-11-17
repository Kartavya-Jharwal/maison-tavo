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
 *  price_usd?: number,
 *  materialCategory: 'metal'|'clay'|'blade'|'accessory',
 *  ritualTrack: 'metal'|'clay',
 *  productUrl: string,
 * }} KansaPiece */

/** @type {Record<string, KansaPiece>} */
export const FALLBACK_PIECES = {
  'forge-relay-dual-mass-skillet': {
    handle: 'forge-relay-dual-mass-skillet',
    title: 'Forge Relay Dual-Mass Skillet',
    lineup: 'Forge Hybrid',
    materialCategory: 'metal',
    ritualTrack: 'metal',
    heat_sources: ['induction', 'gas'],
    induction_compatible: true,
    care_hypothesis: 'Hand wash warm without soaking; dry over low heat and wipe with seasoning oil.',
    care_instructions: 'Hand wash warm without soaking; dry over low heat and wipe with seasoning oil.',
    heat_compatibility: 'Induction and gas intended; dual-mass base.',
    primary_material: 'Carbon steel with dual-mass base',
    productUrl: '/products/forge-relay-dual-mass-skillet',
  },
  'forge-terre-tagine-28': {
    handle: 'forge-terre-tagine-28',
    title: 'Forge × Terre Tagine 28',
    lineup: 'Forge × Terre',
    materialCategory: 'metal',
    ritualTrack: 'metal',
    heat_sources: ['induction', 'gas', 'electric'],
    induction_compatible: true,
    care_hypothesis: 'Hand wash; dry thoroughly over heat and oil lightly.',
    primary_material: 'Clad cookware with ceramic cone',
    productUrl: '/products/forge-terre-tagine-28',
  },
  'kuro-strip-200-chefs-knife': {
    handle: 'kuro-strip-200-chefs-knife',
    title: "Kuro Strip 200 Chef's Knife",
    lineup: 'Kuro Strip',
    materialCategory: 'blade',
    ritualTrack: 'metal',
    heat_sources: [],
    induction_compatible: false,
    care_hypothesis: 'Hand wash; remove sleeve only for deep service per final design.',
    primary_material: 'Strip-frame chef knife',
    productUrl: '/products/kuro-strip-200-chefs-knife',
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

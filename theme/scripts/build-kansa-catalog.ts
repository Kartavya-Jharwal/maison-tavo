/**
 * Project packages/catalog seed → theme/assets/kansa-catalog.json
 * Run via theme/scripts/build.ts (or: bun theme/scripts/build-kansa-catalog.ts)
 */
import { seedCatalog } from '../../packages/catalog/src/seed.ts';
import type { ProductSpec } from '../../packages/catalog/src/schema.ts';

const themeRoot = `${import.meta.dir}/..`;
const outPath = `${themeRoot}/assets/kansa-catalog.json`;

function materialCategory(p: ProductSpec): 'metal' | 'clay' | 'blade' | 'accessory' {
  const type = (p.product_type || '').toLowerCase();
  const lineup = p.lineup || '';
  if (type.includes('knife') || lineup === 'Kuro Strip') return 'blade';
  if (
    type.includes('oil') ||
    type.includes('care') ||
    type.includes('lid') ||
    type.includes('tongs') ||
    type.includes('steamer')
  ) {
    return 'accessory';
  }
  if (lineup === 'Terre Clay' || type.includes('kulhad') || type.includes('bowl') || type.includes('platter') || type.includes('plate')) {
    return 'clay';
  }
  return 'metal';
}

function ritualTrack(cat: ReturnType<typeof materialCategory>): 'metal' | 'clay' {
  return cat === 'clay' ? 'clay' : 'metal';
}

const pieces = seedCatalog.map((p) => {
  const cat = materialCategory(p);
  return {
    handle: p.handle,
    title: p.title,
    lineup: p.lineup,
    product_type: p.product_type,
    sku: p.sku,
    claim_status: p.claim_status,
    primary_material: p.primary_material,
    lining_material: p.lining_material,
    material_architecture: p.material_architecture,
    heat_sources: p.heat_sources,
    heat_compatibility: p.heat_compatibility,
    induction_compatible: p.induction_compatible,
    care_hypothesis: p.care_hypothesis,
    care_instructions: p.care_instructions,
    dishwasher_suitability: p.dishwasher_suitability,
    microwave_suitability: p.microwave_suitability,
    food_contact_suitability: p.food_contact_suitability,
    concept_thesis: p.concept_thesis,
    agent_intents: p.agent_intents,
    negative_constraints: p.negative_constraints,
    price_usd: p.price_usd,
    materialCategory: cat,
    ritualTrack: ritualTrack(cat),
    productUrl: `/products/${p.handle}`,
  };
});

const payload = {
  generatedAt: new Date().toISOString(),
  count: pieces.length,
  pieces,
};

await Bun.write(outPath, JSON.stringify(payload, null, 2));
console.log(`Wrote ${pieces.length} Kansa pieces → ${outPath}`);

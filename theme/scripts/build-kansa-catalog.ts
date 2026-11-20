import { catalogueCategories } from '../../packages/catalog/src/categories.ts';
/**
 * Project packages/catalog seed → theme/assets/kansa-catalog.json
 * Run via theme/scripts/build.ts (or: bun theme/scripts/build-kansa-catalog.ts)
 */
import { readMockRelease, releasedSpecs } from '../../packages/catalog/src/mock-release.ts';
import type { ProductSpec } from '../../packages/catalog/src/schema.ts';
import { chulhaProductFamilies, forgeProductFamilies } from '../../packages/catalog/src/product-families.ts';

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

const groupedForgeSkus = new Set(forgeProductFamilies.flatMap(family => family.variants.map(variant => variant.sku)));
const release = readMockRelease();
const seen = new Set<string>();
const pieces = releasedSpecs().filter(p => {
  if (p.works_with_kansa === false || seen.has(p.handle) || (!release && groupedForgeSkus.has(p.sku))) return false;
  seen.add(p.handle);
  return true;
}).map((p) => {
  const cat = materialCategory(p);
  const family = release && forgeProductFamilies.find(row => row.handle === p.handle);
  return {
    handle: p.handle,
    title: family ? p.title.replace(/\s+[·–-]\s+\d+\s*cm$/i, '') : p.title,
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
    list_price_gbp: p.price_usd,
    size_family: p.size_family,
    dimensions: family ? undefined : p.dimensions,
    size_options: family ? family.variants.map(variant => `${variant.diameterCm} cm`) : undefined,
    quick_summary: p.quick_summary,
    lineup_copy: p.lineup_copy,
    suggested_use_case: p.suggested_use_case,
    works_with_kansa: p.works_with_kansa,
    pairs_with_care_kit: p.pairs_with_care_kit,
    lid_compatibility: p.lid_compatibility,
    bundle_components: p.bundle_components,
    included_lids: p.included_lids,
    materialCategory: cat,
    ritualTrack: ritualTrack(cat),
    productUrl: `/products/${p.handle}`,
  };
});

const liveChulha = chulhaProductFamilies.filter(product => release?.products.some(live => live.handle === product.handle))
  .map(product => ({
    handle: product.handle,
    title: product.title,
    lineup: 'Chulha',
    product_type: product.taxonomyLeaf,
    claim_status: 'CONCEPT_SPEC',
    primary_material: 'Unglazed terracotta vessel body (design target)',
    heat_sources: [],
    induction_compatible: false,
    concept_thesis: product.form,
    suggested_use_case: product.handle === 'chulha-pressure-cooker' ? undefined : product.suggestedDish,
    list_price_gbp: Math.min(...product.variants.map(variant => variant.priceGbp)),
    size_options: product.variants.map(variant => variant.size),
    materialCategory: 'clay',
    ritualTrack: 'clay',
    productUrl: `/products/${product.handle}`,
  }));

const payload = {
  generatedAt: new Date().toISOString(),
  count: pieces.length + liveChulha.length,
  categories: catalogueCategories.map(({handle, title, summary, products}) => ({
    handle,
    title,
    summary,
    productHandles: products.map(p => p.handle),
  })),
  pieces: [...pieces, ...liveChulha],
};

await Bun.write(outPath, JSON.stringify(payload, null, 2));
console.log(`Wrote ${payload.count} Kansa pieces → ${outPath}`);

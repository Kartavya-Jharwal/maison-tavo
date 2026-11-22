import {chulhaConcepts} from './chulha';
import {FORGE_SETS} from './forge-matrix';
import {seedCatalog} from './seed';

const forgeSizes = seedCatalog.filter(product =>
  product.lineup === 'Forge Hybrid' && product.size_family && product.vessel_shape !== 'lid',
);

export const forgeProductFamilies = [...new Set(forgeSizes.map(product => product.size_family!))]
  .map(family => ({
    family,
    handle: 'forge-' + family.replaceAll('_', '-'),
    option: 'Diameter',
    variants: forgeSizes
      .filter(product => product.size_family === family)
      .sort((a, b) => a.dimensions.diameter_cm! - b.dimensions.diameter_cm!)
      .map(product => ({
        sku: product.sku,
        currentHandle: product.handle,
        diameterCm: product.dimensions.diameter_cm!,
        priceGbp: product.price_usd,
      })),
  }));

export const forgeBundleProducts = FORGE_SETS.map(set => ({
  handle: `${set.handle}-grouped-preview`,
  title: set.title,
  sku: set.sku,
  priceGbp: set.list_price_gbp,
  componentSkus: set.bundle_components!,
  includedLids: set.included_lids ?? [],
}));

// Capacities are launch design targets. The Forge size anchors the GBP price ladder.
const chulhaLaunch: Record<string, {slug: string; option: 'Diameter' | 'Capacity'; sizes: [string, string, number][]}> = {
  TAW: {slug: 'tawa', option: 'Diameter', sizes: [['26 cm', 'MT-FOR-TAV-26', 10], ['30 cm', 'MT-FOR-TAV-30', 12]]},
  MAT: {slug: 'artisanal-matka', option: 'Capacity', sizes: [['2.5 L', 'MT-FOR-STK-20', 10], ['4 L', 'MT-FOR-STK-24', 13]]},
  PRS: {slug: 'pressure-cooker', option: 'Capacity', sizes: [['3 L', 'MT-FOR-STK-24', 15], ['5 L', 'MT-FOR-STK-28', 15]]},
  KAD: {slug: 'heavy-kadhai', option: 'Diameter', sizes: [['24 cm', 'MT-FOR-KAD-24', 10], ['28 cm', 'MT-FOR-KAD-28', 13], ['32 cm', 'MT-FOR-KAD-32', 15]]},
  SCR: {slug: 'chai-saucier', option: 'Capacity', sizes: [['1 L', 'MT-FOR-SPN-16', 7], ['1.75 L', 'MT-FOR-SAU-20', 10]]},
  HND: {slug: 'biryani-handi', option: 'Capacity', sizes: [['2.5 L', 'MT-FOR-STK-20', 12], ['4 L', 'MT-FOR-STK-24', 15]]},
  STK: {slug: 'stockpot', option: 'Capacity', sizes: [['4 L', 'MT-FOR-STK-24', 10], ['6 L', 'MT-FOR-STK-28', 12]]},
};

export const chulhaProductFamilies = chulhaConcepts.map(product => {
  const code = product.sku.split('-')[2]!;
  const plan = chulhaLaunch[code]!;
  return {
    ...product,
    handle: `chulha-${plan.slug}`,
    option: plan.option,
    variants: plan.sizes.map(([size, forgeSku, premiumGbp]) => {
      const forge = seedCatalog.find(row => row.sku === forgeSku);
      if (!forge) throw new Error(`Missing Forge price anchor: ${forgeSku}`);
      const sizeCode = size.replace(' cm', '').replace(' L', '').replace('.', 'P');
      return {sku: `MT-CHU-${code}-${sizeCode}`, size, forgeSku, premiumGbp, priceGbp: forge.price_usd + premiumGbp};
    }),
  };
});

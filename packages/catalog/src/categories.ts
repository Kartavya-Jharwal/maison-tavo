import {chulhaCategory} from './chulha';
import {maintenanceCategory, maintenanceGroups} from './maintenance';
import {releasedSpecs} from './mock-release';
import {chulhaProductFamilies, forgeBundleProducts, forgeProductFamilies} from './product-families';

const maintenanceSkus = new Set<string>(maintenanceGroups.flatMap((group): readonly string[] => group.existingSkus));

export const catalogueCategories = [
  {
    handle: 'forge',
    title: 'Forge',
    summary: 'Cookware and sets for searing, simmering and cooking at the table.',
    products: [...forgeProductFamilies, ...forgeBundleProducts],
  },
  {...chulhaCategory, products: chulhaProductFamilies},
  {...maintenanceCategory, products: releasedSpecs().filter(product => maintenanceSkus.has(product.sku))},
];


import {existsSync, readFileSync} from 'node:fs';
import {z} from 'zod';
import {seedCatalog} from './seed';

const MockRelease = z.object({
  mock: z.literal(true),
  verified_at: z.string(),
  products: z.array(z.object({
    handle: z.string(),
    id: z.string(),
    variants: z.array(z.object({
      sku: z.string(),
      id: z.string(),
      inventory_item_id: z.string(),
    })),
  })),
});

export function readMockRelease() {
  const url = new URL('../../../data/mock-release.json', import.meta.url);
  if (!existsSync(url)) return undefined;
  return MockRelease.parse(JSON.parse(readFileSync(url, 'utf8')));
}

/** Maps the verified grouped products back to the per-SKU technical records. */
export function releasedSpecs() {
  const release = readMockRelease();
  if (!release) return [];
  const liveProducts = new Map(release.products.flatMap(product =>
    product.variants.map(variant => [variant.sku, product.handle] as const),
  ));
  return seedCatalog.filter(product => liveProducts.has(product.sku))
    .map(product => ({
      ...product,
      handle: liveProducts.get(product.sku) ?? product.handle,
      status: 'active' as const,
    }));
}

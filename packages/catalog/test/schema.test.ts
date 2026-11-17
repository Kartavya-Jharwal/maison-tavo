import {describe, expect, test} from 'bun:test';
import {readFileSync} from 'node:fs';
import {Catalog, ShopifyIdMap, seedCatalog, sourceRegister, toShopifyRow} from '../src';

const catalog = Catalog.parse(seedCatalog);

/**
 * Numbers that read as performance or spec claims (temperatures, dimensions,
 * capacities, cycle counts). Under D5 these may only appear while a product
 * is still flagged CONCEPT_SPEC.
 */
const PERFORMANCE_NUMBER = /\d+(\.\d+)?\s*(°\s?C|degrees?|ml|mm|cm|cycles?|washes?)/i;

const CLAIM_BEARING_FIELDS = [
  'description_html',
  'concept_thesis',
  'primary_material',
  'lining_material',
  'dimensions_summary',
  'food_contact_suitability',
  'care_instructions',
  'heat_compatibility',
  'material_architecture',
  'interaction_performance_intent',
  'care_hypothesis',
  'fabrication_route',
] as const;

describe('Catalog seed data', () => {
  test('seed data validates against the Catalog schema', () => {
    expect(catalog.length).toBe(seedCatalog.length);
  });

  test('assortment is reconciled to the 25-SKU target', () => {
    expect(catalog.length).toBe(25);
    expect(new Set(catalog.map((product) => product.sku)).size).toBe(25);
    expect(catalog.some((product) => product.product_type === 'Cookware care kit')).toBe(true);
    expect(catalog.some((product) => product.product_type === 'Replacement lid')).toBe(true);
    expect(catalog.some((product) => product.product_type === 'Bamboo steamer')).toBe(true);
  });

  test('product_category uses standardized Shopify taxonomy rather than brand range names', () => {
    for (const product of catalog) {
      expect(product.product_category.startsWith('Home & Garden > Kitchen & Dining >')).toBe(true);
      expect(product.product_category).not.toContain('Terre Clay');
      expect(product.product_category).not.toContain('Forge Hybrid');
      expect(product.product_category).not.toContain('Kuro Strip');
      expect(product.product_category).not.toContain('Kitchen Caddies');
    }
  });

  test('repeatable specifications and suitability claims are populated for metafields', () => {
    for (const product of catalog) {
      expect(product.primary_material.length).toBeGreaterThan(3);
      expect(product.lining_material.length).toBeGreaterThan(3);
      expect(product.dimensions_summary.length).toBeGreaterThan(3);
      expect(product.food_contact_suitability).toContain(product.claim_status);
      expect(product.care_instructions).toContain(product.claim_status);
      expect(product.heat_compatibility.length).toBeGreaterThan(3);
      expect(product.compare_at_usd).toBeUndefined();
    }
  });

  test('unprototyped assortment extensions do not carry invented weights', () => {
    const extensionTagine = catalog.find((p) => p.sku === 'MT-HYB-TAG-28')!;
    expect(extensionTagine.weight_grams).toBeUndefined();
    const row = toShopifyRow(extensionTagine);
    expect(row['Weight value (grams)']).toBe('');
    expect(row['Weight unit for display']).toBe('');
  });

  test('retained Shopify ID map covers all 25 SKUs and 7 collections', () => {
    const raw = JSON.parse(
      readFileSync(new URL('../../../data/shopify-id-map.json', import.meta.url), 'utf8'),
    );
    const parsed = ShopifyIdMap.parse(raw);
    for (const product of catalog) {
      const entry = parsed.products_by_sku[product.sku];
      expect(entry).toBeDefined();
      expect(entry?.handle).toBe(product.handle);
      expect(entry?.product_id).toStartWith('gid://shopify/Product/');
    }
    expect(Object.keys(parsed.collections_by_handle).length).toBe(7);
  });

  test('SKU count matches the specs CSV row count', async () => {
    const text = await Bun.file(
      new URL('../../../data/maison-tavo-new-listings-specs.csv', import.meta.url),
    ).text();
    const csvRows = text.trim().split(/\r?\n/).length - 1;
    expect(catalog.length).toBe(csvRows);
  });

  test('every SKU carries an explicit claim status', () => {
    for (const product of catalog) {
      expect(product.claim_status).toBe('CONCEPT_SPEC');
    }
  });

  test('every SKU references at least one registered source', () => {
    const registered = new Set(sourceRegister.map((source) => source.id));
    for (const product of catalog) {
      expect(product.sources.length).toBeGreaterThanOrEqual(1);
      for (const id of product.sources) {
        expect(registered.has(id)).toBe(true);
      }
    }
  });

  test('performance numbers only appear under CONCEPT_SPEC status', () => {
    let checked = 0;
    for (const product of catalog) {
      for (const field of CLAIM_BEARING_FIELDS) {
        if (PERFORMANCE_NUMBER.test(product[field])) {
          expect(product.claim_status).toBe('CONCEPT_SPEC');
          checked++;
        }
      }
    }
    expect(checked).toBeGreaterThan(0);
  });

  test('every SKU projects to a Shopify import row', () => {
    for (const product of catalog) {
      const row = toShopifyRow(product);
      expect(row.SKU).toBe(product.sku);
      expect(row['URL handle']).toBe(product.handle);
      expect(Number(row.Price)).toBe(product.price_usd);
    }
  });
});

import {describe, expect, test} from 'bun:test';
import {Catalog, seedCatalog, sourceRegister, toShopifyRow} from '../src';

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
  'material_architecture',
  'interaction_performance_intent',
  'care_hypothesis',
  'fabrication_route',
] as const;

describe('Catalog seed data', () => {
  test('seed data validates against the Catalog schema', () => {
    expect(catalog.length).toBe(seedCatalog.length);
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
      // All current listings are concept-stage; promotion requires the
      // product's required_prototype_tests to be executed.
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
    // Guard against a vacuous pass: the concept catalogue is full of numbers.
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

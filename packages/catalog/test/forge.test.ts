import {describe, expect, test} from 'bun:test';
import {ALL_FORGE_LAUNCH_SKUS, FORGE_MATRIX, FORGE_SETS, seedCatalog} from '../src';

describe('Forge stainless assortment', () => {
  test('every product has a unique identity and two shots per mode', () => {
    expect(new Set(ALL_FORGE_LAUNCH_SKUS.map(item => item.handle)).size).toBe(ALL_FORGE_LAUNCH_SKUS.length);
    for (const item of ALL_FORGE_LAUNCH_SKUS) {
      for (const mode of ['Human', 'Engineer', 'Machine']) {
        expect(item.media_plan.filter(shot => shot.mode === mode)).toHaveLength(2);
      }
      expect(seedCatalog.find(row => row.sku === item.sku)?.price_usd).toBe(item.list_price_gbp);
    }
  });

  test('bundle prices sum the vessels and inventory components include the complimentary lids', () => {
    const bySku = new Map(FORGE_MATRIX.map(row => [row.sku, row]));
    for (const set of FORGE_SETS) {
      const components = set.bundle_components!.map(sku => bySku.get(sku)!);
      expect(components.filter(row => row.vessel_shape === 'lid').map(row => row.sku).sort())
        .toEqual([...set.included_lids!].sort());
      expect(components.reduce((total, row) => total + (row.vessel_shape === 'lid' ? 0 : row.list_price_gbp), 0))
        .toBe(set.list_price_gbp);
    }
    expect(bySku.get('MT-FOR-SCR-22')?.rim_diameter_cm).toBe(22);
    expect(FORGE_SETS.find(s => s.sku.endsWith('-SOLO'))?.bundle_components).toContain('MT-FOR-SCR-22');
    expect(FORGE_SETS.find(s => s.sku.endsWith('-ASN'))?.bundle_components?.map(s => bySku.get(s))
      .find(row => row?.vessel_shape === 'tawa')?.rim_diameter_cm).toBe(26);
  });
});

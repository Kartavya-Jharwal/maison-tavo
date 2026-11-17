import {describe, expect, test} from 'bun:test';
import {evaluateCatalog, scoreSkuForUseCases} from '../src/shopper';
import {seedCatalog} from '@maison-tavo/catalog/src/seed';

describe('evaluateCatalog — heat source filter', () => {
  test('induction filter returns only induction-compatible SKUs', () => {
    const results = evaluateCatalog({
      budget_usd: 10_000,
      piece_count: 20,
      heat_sources: ['induction'],
      use_cases: ['cooking'],
    });
    for (const sku of results) {
      expect(sku.induction_compatible).toBe(true);
      expect(sku.heat_sources).toContain('induction');
    }
  });

  test('gas filter returns only gas-compatible SKUs', () => {
    const results = evaluateCatalog({
      budget_usd: 10_000,
      piece_count: 20,
      heat_sources: ['gas'],
      use_cases: ['cooking'],
    });
    for (const sku of results) {
      expect(sku.heat_sources).toContain('gas');
    }
  });

  test('SKUs with no heat_sources are excluded when heat sources are requested', () => {
    const inductionSkus = seedCatalog.filter(
      (s) => s.heat_sources.length > 0 && s.induction_compatible,
    );
    const results = evaluateCatalog({
      budget_usd: 10_000,
      piece_count: 20,
      heat_sources: ['induction'],
      use_cases: ['cooking'],
    });
    expect(results.length).toBe(inductionSkus.length);
  });
});

describe('evaluateCatalog — budget filter', () => {
  test('total never exceeds budget', () => {
    const results = evaluateCatalog({
      budget_usd: 400,
      piece_count: 10,
      heat_sources: ['induction'],
      use_cases: ['sear'],
    });
    const total = results.reduce((sum, sku) => sum + sku.price_usd, 0);
    expect(total).toBeLessThanOrEqual(400);
  });

  test('returns empty array when budget is below cheapest compatible item', () => {
    const results = evaluateCatalog({
      budget_usd: 1,
      piece_count: 5,
      heat_sources: ['induction'],
      use_cases: ['sear'],
    });
    expect(results).toEqual([]);
  });

  test('respects piece_count cap', () => {
    const results = evaluateCatalog({
      budget_usd: 10_000,
      piece_count: 2,
      heat_sources: ['induction'],
      use_cases: ['sear'],
    });
    expect(results.length).toBeLessThanOrEqual(2);
  });
});

describe('evaluateCatalog — use-case ranking', () => {
  test('searing use-case includes Forge Hybrid or Forge × Terre SKUs when induction requested', () => {
    const results = evaluateCatalog({
      budget_usd: 10_000,
      piece_count: 10,
      heat_sources: ['induction'],
      use_cases: ['sear', 'induction', 'skillet'],
    });
    const hasForge = results.some(
      (sku) => sku.lineup === 'Forge Hybrid' || sku.lineup === 'Forge × Terre',
    );
    expect(hasForge).toBe(true);
  });
});

describe('scoreSkuForUseCases', () => {
  test('returns 0 for no matching use cases', () => {
    const sku = seedCatalog[0]!;
    expect(scoreSkuForUseCases(sku, ['welding', 'aerospace'])).toBe(0);
  });

  test('returns positive score when use cases match agent_intents', () => {
    const kulhad = seedCatalog.find((s) => s.handle === 'ardh-metal-lined-kulhad')!;
    expect(scoreSkuForUseCases(kulhad, ['chai service'])).toBeGreaterThan(0);
  });

  test('matching is case-insensitive', () => {
    const kulhad = seedCatalog.find((s) => s.handle === 'ardh-metal-lined-kulhad')!;
    expect(scoreSkuForUseCases(kulhad, ['CHAI SERVICE'])).toBeGreaterThan(0);
  });
});

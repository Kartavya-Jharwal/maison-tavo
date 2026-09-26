/**
 * One-off, reproducible seed generator: reads the three source CSVs in
 * `data/` and emits `src/seed.ts` as a typed, self-contained module.
 *
 * Run from anywhere: `bun run packages/catalog/scripts/build-seed.ts`
 * (or `bun run --cwd packages/catalog seed:build`).
 *
 * The generated module is committed; the catalog package never reads the
 * CSVs at import time.
 */
import type {Catalog, Dimensions, HeatSource, ProductSpec, SourceRegister} from '../src/schema';

const DATA_DIR = new URL('../../../data/', import.meta.url);
const OUT_FILE = new URL('../src/seed.ts', import.meta.url);

/** Minimal RFC-4180 CSV parser (quoted fields, escaped quotes, CRLF). */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  const body = text.replace(/^﻿/, '');
  for (let i = 0; i < body.length; i++) {
    const c = body[i]!;
    if (inQuotes) {
      if (c === '"') {
        if (body[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && body[i + 1] === '\n') i++;
      row.push(field);
      field = '';
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function toObjects(text: string): Record<string, string>[] {
  const [header, ...rows] = parseCsv(text);
  if (!header) throw new Error('CSV has no header row');
  return rows.map((row) =>
    Object.fromEntries(header.map((name, i) => [name, row[i] ?? ''])),
  );
}

/** '; '-separated engineering lists in the specs sheet. */
function splitList(value: string): string[] {
  return value
    .split(/;\s*/)
    .map((item) => item.trim())
    .filter(Boolean);
}

/** Parse the Shopify variant option (e.g. Capacity '140 ml') into dimensions. */
function parseDimensions(optionName: string, optionValue: string): Dimensions {
  const size = optionValue.match(/^(\d+(?:\.\d+)?)\s*[×x]\s*(\d+(?:\.\d+)?)\s*cm$/);
  if (size) return {length_cm: Number(size[1]), width_cm: Number(size[2])};
  const single = optionValue.match(/^(\d+(?:\.\d+)?)\s*(ml|mm|cm)$/);
  if (!single) return {};
  const value = Number(single[1]);
  const unit = single[2];
  if (unit === 'ml') return {capacity_ml: value};
  if (unit === 'mm') return {length_cm: value / 10};
  if (optionName === 'Diameter') return {diameter_cm: value};
  return {length_cm: value};
}

/**
 * Provenance per SKU. The sources register scopes sources by "Applied to"
 * text rather than SKU, so the mapping is stated explicitly here:
 * R01 (concept direction) applies to every listing; R02 (Made In line logic)
 * to every listing; R03 to catalogue-breadth cookware/knife/utensil entries;
 * R04 to laser-marked Terre; R05 to removable-insert kulhads; R06/R07 to the
 * serrated knife references. R08/R09 govern the import template itself, not
 * products, so they live in the register only.
 */
const SOURCES_BY_SKU: Record<string, string[]> = {
  'MT-TER-KUL-140': ['R01', 'R02', 'R05'],
  'MT-TER-KUL-C180': ['R01', 'R02', 'R05'],
  'MT-TER-PLT-34': ['R01', 'R02', 'R04'],
  'MT-TER-BWL-220': ['R01', 'R02', 'R04'],
  'MT-FOR-RLY-26': ['R01', 'R02', 'R03'],
  'MT-FOR-PLN-46': ['R01', 'R02', 'R03'],
  'MT-HYB-RST-34': ['R01', 'R02', 'R03'],
  'MT-KUR-STR-200': ['R01', 'R02', 'R03'],
  'MT-KUR-TRC-180': ['R01', 'R02', 'R06'],
  'MT-KUR-UTL-150': ['R01', 'R02', 'R07'],
  'MT-HYB-TNG-24': ['R01', 'R02', 'R03'],
};

/**
 * Intended heat sources, taken only where the specs sheet states them
 * ("Direct induction/gas pan", "deglaze insert on induction"). The plancha
 * lists induction coverage as an engineering risk, so it claims gas only.
 * Everything else defaults to no claimed heat sources at concept stage.
 */
const HEAT_BY_SKU: Record<string, {heat_sources: HeatSource[]; induction_compatible: boolean}> = {
  'MT-FOR-RLY-26': {heat_sources: ['induction', 'gas'], induction_compatible: true},
  'MT-FOR-PLN-46': {heat_sources: ['gas'], induction_compatible: false},
  'MT-HYB-RST-34': {heat_sources: ['oven', 'induction'], induction_compatible: true},
};

async function readCsv(name: string): Promise<Record<string, string>[]> {
  return toObjects(await Bun.file(new URL(name, DATA_DIR)).text());
}

const [shopifyRows, specRows, sourceRows] = await Promise.all([
  readCsv('maison-tavo-new-listings-shopify.csv'),
  readCsv('maison-tavo-new-listings-specs.csv'),
  readCsv('maison-tavo-new-listings-sources.csv'),
]);

const shopifyBySku = new Map(shopifyRows.map((row) => [row.SKU, row]));
const specsBySku = new Map(specRows.map((row) => [row.SKU, row]));

for (const sku of specsBySku.keys()) {
  if (!shopifyBySku.has(sku)) throw new Error(`Specs SKU ${sku} missing from Shopify CSV`);
}
for (const sku of shopifyBySku.keys()) {
  if (!specsBySku.has(sku)) throw new Error(`Shopify SKU ${sku} missing from specs CSV`);
}

const catalog: Catalog = specRows.map((spec): ProductSpec => {
  const shopify = shopifyBySku.get(spec.SKU!)!;
  const sources = SOURCES_BY_SKU[spec.SKU!];
  if (!sources) throw new Error(`No source mapping for ${spec.SKU}`);
  const heat = HEAT_BY_SKU[spec.SKU!] ?? {heat_sources: [], induction_compatible: false};
  const optionName = shopify['Option1 name'] ?? '';
  const optionValue = shopify['Option1 value'] ?? '';
  const compareAt = shopify['Compare-at price'] ?? '';
  return {
    handle: spec['URL handle']!,
    title: shopify.Title!,
    sku: spec.SKU!,
    vendor: shopify.Vendor!,
    product_category: shopify['Product category']!,
    product_type: shopify.Type!,
    tags: (shopify.Tags ?? '').split(/,\s*/).filter(Boolean),
    lineup: spec.Lineup as ProductSpec['lineup'],
    status: (shopify.Status ?? 'draft') as ProductSpec['status'],
    claim_status: spec['Claim status'] as ProductSpec['claim_status'],
    reference_class: spec['Reference class']!,
    concept_thesis: spec['Concept thesis']!,
    material_architecture: spec['Material architecture']!,
    food_contact_strategy: spec['Food-contact strategy']!,
    fabrication_route: spec['Proposed fabrication route']!,
    interaction_performance_intent: spec['Interaction / performance intent']!,
    care_hypothesis: spec['Care hypothesis']!,
    engineering_risks: splitList(spec['Engineering risks'] ?? ''),
    required_prototype_tests: splitList(spec['Required prototype tests'] ?? ''),
    agent_intents: splitList(spec['Agent intents'] ?? ''),
    negative_constraints: splitList(spec['Negative constraints'] ?? ''),
    benchmark_logic: spec['Benchmark logic']!,
    sources,
    description_html: shopify.Description!,
    seo_title: shopify['SEO title'] || undefined,
    seo_description: shopify['SEO description'] || undefined,
    price_usd: Number(shopify.Price),
    compare_at_usd: compareAt ? Number(compareAt) : undefined,
    barcode: shopify.Barcode || undefined,
    weight_grams: Number(shopify['Weight value (grams)']),
    variant_option: {name: optionName, value: optionValue},
    dimensions: parseDimensions(optionName, optionValue),
    heat_sources: heat.heat_sources,
    induction_compatible: heat.induction_compatible,
  };
});

const sourceRegister: SourceRegister = sourceRows.map((row) => ({
  id: row['Source ID']!,
  class: row.Class!,
  source: row.Source!,
  url: row.URL || undefined,
  applied_to: row['Applied to']!,
  boundary: row.Boundary!,
}));

const output = `// Generated by scripts/build-seed.ts from data/*.csv — do not edit by hand.
// Regenerate with: bun run packages/catalog/scripts/build-seed.ts
import type {Catalog, SourceRegister} from './schema';

export const sourceRegister: SourceRegister = ${JSON.stringify(sourceRegister, null, 2)};

export const seedCatalog: Catalog = ${JSON.stringify(catalog, null, 2)};
`;

await Bun.write(OUT_FILE, output);
console.log(`Wrote ${catalog.length} SKUs and ${sourceRegister.length} sources to src/seed.ts`);

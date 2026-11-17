/**
 * Reproducible seed generator: reads the three source CSVs in `data/` and
 * emits `src/seed.ts` as a typed, self-contained module with structured
 * metafield attributes for both Shopify Admin sync and the UCP agent surface.
 *
 * Run from anywhere: `bun run packages/catalog/scripts/build-seed.ts`
 * (or `bun run --cwd packages/catalog seed:build`).
 */
import {writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import type {
  Catalog,
  Dimensions,
  DishwasherSuitability,
  HeatSource,
  MicrowaveSuitability,
  ProductSpec,
  SourceRegister,
} from '../src/schema';

const DATA_DIR = new URL('../../../data/', import.meta.url);
const OUT_FILE = new URL('../src/seed.ts', import.meta.url);

/** Minimal RFC-4180 CSV parser (quoted fields, escaped quotes, CRLF). */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  const body = text.replace(/^\uFEFF/, '');
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

/** Parse the Shopify variant option (e.g. Capacity '140 ml', '24 cm (2 tiers)') into dimensions. */
function parseDimensions(optionName: string, optionValue: string): Dimensions {
  const size = optionValue.match(/^(\d+(?:\.\d+)?)\s*[×x]\s*(\d+(?:\.\d+)?)\s*cm/i);
  if (size) return {length_cm: Number(size[1]), width_cm: Number(size[2])};
  const bowlSet = optionValue.match(/\((\d+(?:\.\d+)?)\s*ml/i);
  if (bowlSet) return {capacity_ml: Number(bowlSet[1])};
  const single = optionValue.match(/(\d+(?:\.\d+)?)\s*(ml|mm|cm)\b/i);
  if (!single) return {};
  const value = Number(single[1]);
  const unit = single[2]!.toLowerCase();
  if (unit === 'ml') return {capacity_ml: value};
  if (unit === 'mm') return {length_cm: value / 10};
  if (optionName === 'Diameter' || optionName === 'Compatibility') return {diameter_cm: value};
  return {length_cm: value};
}

function formatDimensionsSummary(optionName: string, optionValue: string, dims: Dimensions): string {
  if (dims.length_cm && dims.width_cm) return `${dims.length_cm} × ${dims.width_cm} cm`;
  if (dims.diameter_cm) return `${dims.diameter_cm} cm diameter (${optionValue})`;
  if (dims.capacity_ml && optionName !== 'Set') return `${dims.capacity_ml} ml capacity`;
  if (dims.length_cm && optionName === 'Blade length') return `${dims.length_cm * 10} mm blade length`;
  if (dims.length_cm) return `${dims.length_cm} cm length`;
  return `${optionName}: ${optionValue}`;
}

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
  'MT-TER-PLT-28': ['R01', 'R02', 'R04'],
  'MT-TER-BWL-S03': ['R01', 'R02', 'R04'],
  'MT-TER-BWL-26': ['R01', 'R02', 'R04'],
};

/**
 * Intended heat sources at CONCEPT_SPEC stage for active cookware vessels.
 * Tableware, knives, utensils, lids, steamers and care items do not claim direct burner heating.
 */
const HEAT_BY_SKU: Record<string, {heat_sources: HeatSource[]; induction_compatible: boolean}> = {
  'MT-FOR-RLY-26': {heat_sources: ['induction', 'gas'], induction_compatible: true},
  'MT-FOR-PLN-46': {heat_sources: ['gas'], induction_compatible: false},
  'MT-HYB-RST-34': {heat_sources: ['oven', 'induction'], induction_compatible: true},
  'MT-HYB-TAG-28': {heat_sources: ['induction', 'gas', 'electric'], induction_compatible: true},
  'MT-HYB-TAG-32': {heat_sources: ['induction', 'gas', 'electric'], induction_compatible: true},
  'MT-FOR-TAV-26': {heat_sources: ['induction', 'gas'], induction_compatible: true},
  'MT-FOR-TAV-30': {heat_sources: ['induction', 'gas'], induction_compatible: true},
  'MT-FOR-KAD-24': {heat_sources: ['induction', 'gas'], induction_compatible: true},
  'MT-FOR-SAU-20': {heat_sources: ['induction', 'gas', 'electric', 'oven'], induction_compatible: true},
};

type StructuredSpecs = {
  primary_material: string;
  lining_material: string;
  dishwasher_suitability: DishwasherSuitability;
  microwave_suitability: MicrowaveSuitability;
};

const STRUCTURED_SPECS_BY_SKU: Record<string, StructuredSpecs> = {
  'MT-TER-KUL-140': {
    primary_material: 'High-fired earthenware shell',
    lining_material: 'Removable 18/8 stainless steel drink liner',
    dishwasher_suitability: 'pending_validation',
    microwave_suitability: 'not_microwave_safe',
  },
  'MT-TER-KUL-C180': {
    primary_material: 'Vitrified earthenware bowl with spun stainless chassis',
    lining_material: 'Food-safe vitrified ceramic glaze',
    dishwasher_suitability: 'pending_validation',
    microwave_suitability: 'not_microwave_safe',
  },
  'MT-TER-PLT-34': {
    primary_material: 'High-fired stoneware',
    lining_material: 'Vitrified food-contact ceramic glaze',
    dishwasher_suitability: 'pending_validation',
    microwave_suitability: 'pending_validation',
  },
  'MT-TER-BWL-220': {
    primary_material: 'High-fired stoneware',
    lining_material: 'Vitrified interior ceramic glaze',
    dishwasher_suitability: 'pending_validation',
    microwave_suitability: 'pending_validation',
  },
  'MT-FOR-RLY-26': {
    primary_material: 'Nitrided carbon steel with removable cast-bronze thermal ring',
    lining_material: 'Unlined seasoned carbon steel (external bronze ring non-food-contact)',
    dishwasher_suitability: 'hand_wash_only',
    microwave_suitability: 'not_microwave_safe',
  },
  'MT-FOR-PLN-46': {
    primary_material: 'Nitrided carbon steel with cast-bronze service block',
    lining_material: 'Unlined carbon steel sear zone + removable 18/8 stainless service tray',
    dishwasher_suitability: 'hand_wash_only',
    microwave_suitability: 'not_microwave_safe',
  },
  'MT-HYB-RST-34': {
    primary_material: 'Clad stainless steel insert with high-fired ceramic cradle',
    lining_material: '18/10 stainless steel cooking surface',
    dishwasher_suitability: 'insert_only_pending_validation',
    microwave_suitability: 'not_microwave_safe',
  },
  'MT-KUR-STR-200': {
    primary_material: 'Continuous nitrogen-treated stainless steel strip',
    lining_material: 'Unlined monolithic blade with replaceable grip sleeve',
    dishwasher_suitability: 'hand_wash_only',
    microwave_suitability: 'not_applicable',
  },
  'MT-KUR-TRC-180': {
    primary_material: 'High-carbon stainless steel strip',
    lining_material: 'Unlined hybrid micro-scalloped / plain steel blade',
    dishwasher_suitability: 'hand_wash_only',
    microwave_suitability: 'not_applicable',
  },
  'MT-KUR-UTL-150': {
    primary_material: 'High-carbon stainless steel strip',
    lining_material: 'Unlined micro-scalloped steel blade',
    dishwasher_suitability: 'hand_wash_only',
    microwave_suitability: 'not_applicable',
  },
  'MT-HYB-TNG-24': {
    primary_material: 'Spring steel strip with removable ceramic grip pads',
    lining_material: 'Unlined spring-steel food-contact tips',
    dishwasher_suitability: 'pending_validation',
    microwave_suitability: 'not_applicable',
  },
  'MT-HYB-TAG-28': {
    primary_material: 'Clad 18/10 stainless steel base with high-fired earthenware cone',
    lining_material: '18/10 stainless cooking face + vitrified interior cone glaze',
    dishwasher_suitability: 'insert_only_pending_validation',
    microwave_suitability: 'not_microwave_safe',
  },
  'MT-HYB-TAG-32': {
    primary_material: 'Clad 18/10 stainless steel base with high-fired earthenware cone',
    lining_material: '18/10 stainless cooking face + vitrified interior cone glaze',
    dishwasher_suitability: 'insert_only_pending_validation',
    microwave_suitability: 'not_microwave_safe',
  },
  'MT-FOR-TAV-26': {
    primary_material: 'Nitrided carbon steel with bronze-isolated handle',
    lining_material: 'Unlined seasoned carbon steel',
    dishwasher_suitability: 'hand_wash_only',
    microwave_suitability: 'not_microwave_safe',
  },
  'MT-FOR-TAV-30': {
    primary_material: 'Heavy-gauge nitrided carbon steel with bronze-isolated handle',
    lining_material: 'Unlined seasoned carbon steel',
    dishwasher_suitability: 'hand_wash_only',
    microwave_suitability: 'not_microwave_safe',
  },
  'MT-FOR-KAD-24': {
    primary_material: 'Spun nitrided carbon steel with bronze-isolated loop handles',
    lining_material: 'Unlined seasoned carbon steel',
    dishwasher_suitability: 'hand_wash_only',
    microwave_suitability: 'not_microwave_safe',
  },
  'MT-FOR-SAU-20': {
    primary_material: 'Fully-clad 18/10 stainless steel with removable bronze collar',
    lining_material: 'Non-reactive 18/10 stainless steel interior',
    dishwasher_suitability: 'insert_only_pending_validation',
    microwave_suitability: 'not_microwave_safe',
  },
  'MT-TER-PLT-28': {
    primary_material: 'High-fired stoneware',
    lining_material: 'Vitrified food-contact ceramic glaze',
    dishwasher_suitability: 'pending_validation',
    microwave_suitability: 'pending_validation',
  },
  'MT-TER-BWL-S03': {
    primary_material: 'High-fired stoneware',
    lining_material: 'Vitrified stain-resistant interior ceramic glaze',
    dishwasher_suitability: 'pending_validation',
    microwave_suitability: 'pending_validation',
  },
  'MT-TER-BWL-26': {
    primary_material: 'High-fired stoneware',
    lining_material: 'Vitrified interior ceramic glaze',
    dishwasher_suitability: 'pending_validation',
    microwave_suitability: 'pending_validation',
  },
  'MT-FOR-OIL-250': {
    primary_material: 'Refined high-smoke-point culinary plant oil blend in amber glass',
    lining_material: 'Not applicable (consumable care oil)',
    dishwasher_suitability: 'not_applicable',
    microwave_suitability: 'not_applicable',
  },
  'MT-FOR-KIT-C01': {
    primary_material: 'Refined plant oil, untreated beech/tampico brush, woven cotton cloth',
    lining_material: 'Not applicable (maintenance care kit)',
    dishwasher_suitability: 'hand_wash_only',
    microwave_suitability: 'not_applicable',
  },
  'MT-FOR-LID-26': {
    primary_material: 'Tempered glass with 18/8 stainless rim and bronze-isolated handle',
    lining_material: 'Uncoated tempered glass and 18/8 stainless steam interface',
    dishwasher_suitability: 'pending_validation',
    microwave_suitability: 'not_microwave_safe',
  },
  'MT-FOR-LID-30': {
    primary_material: 'Domed tempered glass with 18/8 stainless rim and bronze-isolated handle',
    lining_material: 'Uncoated tempered glass and 18/8 stainless steam interface',
    dishwasher_suitability: 'pending_validation',
    microwave_suitability: 'not_microwave_safe',
  },
  'MT-TER-STM-24': {
    primary_material: 'Untreated woven bamboo baskets with glazed stoneware docking ring',
    lining_material: 'Unlacquered natural bamboo slats + vitrified ceramic docking collar',
    dishwasher_suitability: 'hand_wash_only',
    microwave_suitability: 'not_applicable',
  },
};

function formatHeatCompatibility(heat: {heat_sources: HeatSource[]; induction_compatible: boolean}): string {
  if (heat.heat_sources.length === 0) {
    return 'Non-burner item (CONCEPT_SPEC: not rated for direct stovetop heating).';
  }
  const list = heat.heat_sources.join(', ');
  const ind = heat.induction_compatible ? 'induction target yes' : 'not induction-compatible';
  return `CONCEPT_SPEC target: ${list} (${ind}; requires prototype thermal validation).`;
}

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
  const sku = spec.SKU!;
  const shopify = shopifyBySku.get(sku)!;
  const sources = SOURCES_BY_SKU[sku] ?? ['R01', 'R02', 'R03'];
  const heat = HEAT_BY_SKU[sku] ?? {heat_sources: [], induction_compatible: false};
  const structured = STRUCTURED_SPECS_BY_SKU[sku];
  if (!structured) {
    throw new Error(`Missing STRUCTURED_SPECS_BY_SKU entry for ${sku}`);
  }
  const optionName = shopify['Option1 name'] ?? '';
  const optionValue = shopify['Option1 value'] ?? '';
  const compareAt = (shopify['Compare-at price'] ?? '').trim();
  const costPerItem = (shopify['Cost per item'] ?? '').trim();
  const rawWeight = (shopify['Weight value (grams)'] ?? '').trim();
  const dimensions = parseDimensions(optionName, optionValue);
  const claimStatus = spec['Claim status'] as ProductSpec['claim_status'];
  const foodContactStrategy = spec['Food-contact strategy']!;
  const careHypothesis = spec['Care hypothesis']!;

  return {
    handle: spec['URL handle']!,
    title: shopify.Title!,
    sku,
    vendor: shopify.Vendor!,
    product_category: shopify['Product category']!,
    product_type: shopify.Type!,
    tags: (shopify.Tags ?? '').split(/,\s*/).filter(Boolean),
    lineup: spec.Lineup as ProductSpec['lineup'],
    status: (shopify.Status ?? 'draft') as ProductSpec['status'],
    claim_status: claimStatus,
    reference_class: spec['Reference class']!,
    concept_thesis: spec['Concept thesis']!,
    primary_material: structured.primary_material,
    lining_material: structured.lining_material,
    dimensions_summary: formatDimensionsSummary(optionName, optionValue, dimensions),
    dishwasher_suitability: structured.dishwasher_suitability,
    microwave_suitability: structured.microwave_suitability,
    food_contact_suitability: `[${claimStatus}] ${foodContactStrategy}`,
    care_instructions: `[${claimStatus}] ${careHypothesis}`,
    heat_compatibility: formatHeatCompatibility(heat),
    material_architecture: spec['Material architecture']!,
    food_contact_strategy: foodContactStrategy,
    fabrication_route: spec['Proposed fabrication route']!,
    interaction_performance_intent: spec['Interaction / performance intent']!,
    care_hypothesis: careHypothesis,
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
    cost_per_item_usd: costPerItem ? Number(costPerItem) : undefined,
    compare_at_usd: compareAt ? Number(compareAt) : undefined,
    barcode: shopify.Barcode || undefined,
    weight_grams: rawWeight ? Number(rawWeight) : undefined,
    variant_option: {name: optionName, value: optionValue},
    dimensions,
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

writeFileSync(fileURLToPath(OUT_FILE), output, 'utf8');
console.log(`Wrote ${catalog.length} SKUs and ${sourceRegister.length} sources to src/seed.ts`);

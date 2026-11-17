/**
 * Merge the Forge launch matrix into data/*.csv seed sources.
 *
 * - Upserts Shopify + specs rows for every Forge matrix / set SKU
 * - Repositions adapted specialty Forge prices (GBP)
 * - Extends the image production brief with 6-mode shot plans
 *
 * Run: bun packages/catalog/scripts/sync-forge-csvs.ts
 * Then: bun packages/catalog/scripts/build-seed.ts
 */
import {writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {
  ALL_FORGE_LAUNCH_SKUS,
  FORGE_SPECIALTY_UPDATES,
  type ForgeSkuDef,
} from '../src/forge-matrix';

const DATA_DIR = new URL('../../../data/', import.meta.url);

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

function toObjects(text: string): {header: string[]; rows: Record<string, string>[]} {
  const [header, ...rows] = parseCsv(text);
  if (!header) throw new Error('CSV has no header');
  return {
    header,
    rows: rows.map((row) => Object.fromEntries(header.map((name, i) => [name, row[i] ?? '']))),
  };
}

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function writeCsv(path: URL, header: string[], rows: Record<string, string>[]): void {
  const lines = [
    header.map(csvEscape).join(','),
    ...rows.map((row) => header.map((h) => csvEscape(row[h] ?? '')).join(',')),
  ];
  writeFileSync(fileURLToPath(path), `${lines.join('\n')}\n`, 'utf8');
}

function shopifyRowFromForge(def: ForgeSkuDef): Record<string, string> {
  const alt = `${def.title} (${def.option_value}) — production photography pending`;
  return {
    Title: def.title,
    'URL handle': def.handle,
    Description: def.description_html,
    Vendor: 'Maison Tavo',
    'Product category': def.product_category,
    Type: def.product_type,
    Tags: def.tags.join(', '),
    'Published on online store': 'FALSE',
    Status: 'draft',
    SKU: def.sku,
    Barcode: '',
    'Option1 name': def.option_name,
    'Option1 value': def.option_value,
    'Option1 Linked To': '',
    'Option2 name': '',
    'Option2 value': '',
    'Option2 Linked To': '',
    'Option3 name': '',
    'Option3 value': '',
    'Option3 Linked To': '',
    Price: def.list_price_gbp.toFixed(2),
    'Compare-at price': '',
    'Cost per item': '',
    'Charge tax': 'TRUE',
    'Tax code': '',
    'Unit price total measure': '',
    'Unit price total measure unit': '',
    'Unit price base measure': '',
    'Unit price base measure unit': '',
    'Inventory tracker': 'shopify',
    'Inventory quantity': '0',
    'Continue selling when out of stock': 'DENY',
    'Weight value (grams)': '',
    'Weight unit for display': '',
    'Requires shipping': 'TRUE',
    'Fulfillment service': 'manual',
    'Product image URL': '',
    'Image position': '',
    'Image alt text': alt,
    'Variant image URL': '',
    'Gift card': 'FALSE',
    'SEO title': def.seo_title,
    'SEO description': def.seo_description,
    'Color (product.metafields.shopify.color-pattern)': '',
    'Google Shopping / Google product category': '',
    'Google Shopping / Gender': '',
    'Google Shopping / Age group': '',
    'Google Shopping / Manufacturer part number (MPN)': def.sku,
    'Google Shopping / Ad group name': 'Maison Tavo Concept Catalogue',
    'Google Shopping / Ads labels': def.tags.slice(0, 3).join('; ').toLowerCase(),
    'Google Shopping / Condition': 'New',
    'Google Shopping / Custom product': 'TRUE',
    'Google Shopping / Custom label 0': 'Forge Hybrid',
    'Google Shopping / Custom label 1': def.is_care_or_set ? 'Care & Sets' : 'Cookware',
    'Google Shopping / Custom label 2': def.primary_material.slice(0, 60),
    'Google Shopping / Custom label 3': 'Prototype Alpha',
    'Google Shopping / Custom label 4': 'Draft',
  };
}

function specsRowFromForge(def: ForgeSkuDef): Record<string, string> {
  return {
    SKU: def.sku,
    'URL handle': def.handle,
    Lineup: 'Forge Hybrid',
    'Reference class': def.reference_class,
    'Concept thesis': def.concept_thesis,
    'Material architecture': def.material_architecture,
    'Food-contact strategy': def.food_contact_strategy,
    'Proposed fabrication route': def.fabrication_route,
    'Interaction / performance intent': def.interaction_performance_intent,
    'Care hypothesis': def.care_hypothesis,
    'Engineering risks': def.engineering_risks.join('; '),
    'Required prototype tests': def.required_prototype_tests.join('; '),
    'Agent intents': def.agent_intents.join('; '),
    'Negative constraints': def.negative_constraints.join('; '),
    'Benchmark logic': def.benchmark_logic,
    'Claim status': 'CONCEPT_SPEC',
  };
}

function imageRowsFromForge(def: ForgeSkuDef): Record<string, string>[] {
  return def.media_plan.map((shot, index) => ({
    SKU: def.sku,
    'URL handle': def.handle,
    Title: def.title,
    Lineup: 'Forge Hybrid',
    Category: def.is_care_or_set ? 'Care & Sets' : 'Cookware',
    'Asset status': 'MISSING — PRODUCTION REQUIRED',
    Mode: shot.mode,
    'Shot index': String(index + 1),
    'Hero shot brief': shot.shot,
    'Required delivery':
      'Owned/licensed master; 4:5 portrait + 1:1 crop; 3200 px minimum long edge; Display-P3 or sRGB; AVIF/WebP derivatives; shadow and transparent-background cutout. Spec plates OK for Engineer/Machine until photography lands.',
    'Approved image URL': '',
    'Alt text': `${def.title} — ${shot.mode} mode shot ${index + 1} (production pending)`,
  }));
}

const [shopifyText, specsText, imageText] = await Promise.all([
  Bun.file(new URL('maison-tavo-new-listings-shopify.csv', DATA_DIR)).text(),
  Bun.file(new URL('maison-tavo-new-listings-specs.csv', DATA_DIR)).text(),
  Bun.file(new URL('maison-tavo-image-production-brief.csv', DATA_DIR)).text(),
]);

const shopify = toObjects(shopifyText);
const specs = toObjects(specsText);
const images = toObjects(imageText);

const shopifyBySku = new Map(shopify.rows.map((r) => [r.SKU, r]));
const specsBySku = new Map(specs.rows.map((r) => [r.SKU, r]));

let upserted = 0;
for (const def of ALL_FORGE_LAUNCH_SKUS) {
  shopifyBySku.set(def.sku, {...(shopifyBySku.get(def.sku) ?? {}), ...shopifyRowFromForge(def)});
  specsBySku.set(def.sku, {...(specsBySku.get(def.sku) ?? {}), ...specsRowFromForge(def)});
  upserted += 1;
}

for (const patch of FORGE_SPECIALTY_UPDATES) {
  const shop = shopifyBySku.get(patch.sku);
  if (shop) {
    shop.Price = patch.list_price_gbp.toFixed(2);
    shopifyBySku.set(patch.sku, shop);
  }
}

const shopifyRows = [...shopifyBySku.values()];
const specsRows = [...specsBySku.values()];

// Rebuild image brief: keep non-Forge rows as single-hero legacy; replace Forge matrix SKUs with 6-shot plans.
const imageHeader = [
  'SKU',
  'URL handle',
  'Title',
  'Lineup',
  'Category',
  'Asset status',
  'Mode',
  'Shot index',
  'Hero shot brief',
  'Required delivery',
  'Approved image URL',
  'Alt text',
];

const forgeSkuSet = new Set(ALL_FORGE_LAUNCH_SKUS.map((s) => s.sku));
const specialtySkuSet = new Set(FORGE_SPECIALTY_UPDATES.map((s) => s.sku));

const retainedImages: Record<string, string>[] = [];
for (const row of images.rows) {
  if (forgeSkuSet.has(row.SKU!)) continue;
  retainedImages.push({
    SKU: row.SKU ?? '',
    'URL handle': row['URL handle'] ?? '',
    Title: row.Title ?? '',
    Lineup: row.Lineup ?? '',
    Category: row.Category ?? '',
    'Asset status': row['Asset status'] ?? '',
    Mode: row.Mode ?? 'Human',
    'Shot index': row['Shot index'] ?? '1',
    'Hero shot brief': row['Hero shot brief'] ?? '',
    'Required delivery': row['Required delivery'] ?? '',
    'Approved image URL': row['Approved image URL'] ?? '',
    'Alt text': row['Alt text'] ?? '',
  });
}

const forgeImages = ALL_FORGE_LAUNCH_SKUS.flatMap(imageRowsFromForge);

// Specialty retained Forge lids / plancha / relay: ensure at least a 6-shot stub if missing from matrix.
for (const patch of FORGE_SPECIALTY_UPDATES) {
  if (forgeSkuSet.has(patch.sku)) continue;
  const shop = shopifyBySku.get(patch.sku);
  if (!shop) continue;
  const title = shop.Title || patch.sku;
  const handle = shop['URL handle'] || '';
  const modes = ['Human', 'Human', 'Engineer', 'Engineer', 'Machine', 'Machine'] as const;
  modes.forEach((mode, index) => {
    forgeImages.push({
      SKU: patch.sku,
      'URL handle': handle,
      Title: title,
      Lineup: 'Forge Hybrid',
      Category: specialtySkuSet.has(patch.sku) && patch.sku.includes('LID') ? 'Care & Sets' : 'Cookware',
      'Asset status': 'MISSING — PRODUCTION REQUIRED',
      Mode: mode,
      'Shot index': String(index + 1),
      'Hero shot brief': `${title} — ${mode} mode plate (${patch.quick_summary})`,
      'Required delivery':
        'Owned/licensed master; 4:5 portrait + 1:1 crop; 3200 px minimum long edge; spec plates OK for Engineer/Machine.',
      'Approved image URL': '',
      'Alt text': `${title} — ${mode} mode shot ${index + 1} (production pending)`,
    });
  });
}

writeCsv(new URL('maison-tavo-new-listings-shopify.csv', DATA_DIR), shopify.header, shopifyRows);
writeCsv(new URL('maison-tavo-new-listings-specs.csv', DATA_DIR), specs.header, specsRows);
writeCsv(new URL('maison-tavo-image-production-brief.csv', DATA_DIR), imageHeader, [
  ...retainedImages,
  ...forgeImages,
]);

console.log(
  `Forge CSV sync: upserted ${upserted} matrix/set SKUs; shopify=${shopifyRows.length} specs=${specsRows.length} image_shots=${retainedImages.length + forgeImages.length}`,
);

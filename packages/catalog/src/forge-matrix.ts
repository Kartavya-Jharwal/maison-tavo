/**
 * Category 1 — Forge series launch matrix.
 *
 * Diameter is measured inner rim-to-rim (cm). Induction base coil zones are
 * concept targets (14.5 / 18 / 21 cm), not certified ratings.
 *
 * Model: SKU-per-size (one Shopify product per diameter), matching the existing
 * seed pipeline. List prices are GBP (shop currency).
 *
 * Deferred sizes are documented in `docs/forge-series.md` — do not invent them
 * as live Admin products until explicitly promoted.
 */

export type HandleConfig =
  'none' | 'stick' | 'stick_helper' | 'short_riveted' | 'dual_loops' | 'lid_bridge' | 'set';

export type VesselShape =
  | 'frying_pan'
  | 'saucier'
  | 'saute'
  | 'tawa'
  | 'saucepan'
  | 'stockpot'
  | 'kadhai'
  | 'lid'
  | 'set'
  | 'care_kit'
  | 'specialty';

import type {MediaShot} from './schema';

export interface ForgeSkuDef {
  sku: string;
  /** When adapting an existing Admin product, keep its prior handle if set. */
  handle: string;
  title: string;
  product_type: string;
  product_category: string;
  /** GBP list price guidance for this launch. */
  list_price_gbp: number;
  rim_diameter_cm?: number;
  /** CONCEPT_SPEC target — outer induction contact foot. */
  base_diameter_cm?: number;
  /** CONCEPT_SPEC target wall / vessel height. */
  height_cm?: number;
  /** CONCEPT_SPEC target capacity where a honest estimate is useful. */
  capacity_ml?: number;
  induction_coil_zone_cm?: number;
  handle_configuration: HandleConfig;
  lid_compatibility: string;
  vessel_shape: VesselShape;
  quick_summary: string;
  lineup_copy: string;
  suggested_use_case: string;
  works_with_kansa: boolean;
  pairs_with_care_kit: string;
  /** Component SKUs for set/bundle products. */
  bundle_components?: string[];
  /** Lids included free inside curated sets (SKU list). */
  included_lids?: string[];
  heat_sources: Array<'induction' | 'gas' | 'electric' | 'oven' | 'open_flame'>;
  induction_compatible: boolean;
  primary_material: string;
  lining_material: string;
  material_architecture: string;
  food_contact_strategy: string;
  fabrication_route: string;
  interaction_performance_intent: string;
  care_hypothesis: string;
  engineering_risks: string[];
  required_prototype_tests: string[];
  agent_intents: string[];
  negative_constraints: string[];
  concept_thesis: string;
  reference_class: string;
  benchmark_logic: string;
  description_html: string;
  seo_title: string;
  seo_description: string;
  tags: string[];
  option_name: string;
  option_value: string;
  /** Existing Admin SKU being adapted (same id-map entry). */
  adapts?: string;
  is_care_or_set?: boolean;
  media_plan: MediaShot[];
}

/** Map rim diameter bands → induction coil zone targets. */
export function coilZoneForRim(rimCm: number): number {
  if (rimCm <= 20) return 14.5;
  if (rimCm <= 26) return 18;
  return 21;
}

/** Universal lid seating map (concept). */
export const LID_ECOSYSTEM = [16, 20, 24, 28, 32] as const;
export const DEFERRED_FORGE_SIZES = [
  {shape: 'frying_pan', size_cm: 32, reason: 'Outside the specified range'},
] as const;

const CARE_KIT = 'MT-FOR-KIT-SS1';
const NOTICE =
  '<p><strong>Concept-spec notice:</strong> Materials, dimensions, compatibility, food-contact migration and wash performance are unverified prototype targets. Physical unit weight and live stock remain unset until pilot fabrication. Diameters are inner rim-to-rim concept targets.</p>';

function mediaPlan(title: string, shape: string): MediaShot[] {
  return [
    {mode: 'Human', shot: `${title} — editorial three-quarter hero, surface finish, soft north light`},
    {mode: 'Human', shot: `${title} — in-use kitchen still (hands optional), atmosphere not prop clutter`},
    {
      mode: 'Engineer',
      shot: `${title} — SVG CAD stratigraphy / section with mm wall callouts and ${shape} geometry`,
    },
    {mode: 'Engineer', shot: `${title} — induction coil zone plate (rim / base / coil overlay)`},
    {mode: 'Machine', shot: `${title} — clean ASCII silhouette plate`},
    {mode: 'Machine', shot: `${title} — Schema.org JSON-LD / specs.* token block plate`},
  ];
}

export const bambooSteamerDetail = {
  sku: 'MT-TER-STM-24',
  quick_summary: 'A 24 cm woven bamboo steamer with a ceramic docking ring.',
  lineup_copy:
    'Stack the baskets over a compatible pot to cook dumplings and greens in rising steam. The docking ring supports the lower basket.',
  suggested_use_case: 'Line the basket, space dumplings apart and steam over gently simmering water.',
  lid_compatibility:
    'Uses its bamboo basket cover. Forge pot pairings await seating and steam-clearance checks.',
  media_plan: [
    {mode: 'Human', shot: 'Woven bamboo baskets, cover and ceramic docking ring in three-quarter view'},
    {mode: 'Human', shot: 'Dumplings arranged in the lined basket'},
    {mode: 'Engineer', shot: 'Exploded docking ring and basket section'},
    {mode: 'Engineer', shot: 'Pot rim seating and steam path, target dimensions marked'},
    {mode: 'Machine', shot: 'Stacked basket silhouette'},
    {mode: 'Machine', shot: 'Structured material, care and compatibility record'},
  ] satisfies MediaShot[],
};

const cookware = 'Home & Garden > Kitchen & Dining > Cookware & Bakeware > Cookware';
const accessories = cookware + ' Accessories';
const CAT_SET = cookware + ' > Cookware Sets';

interface Family {
  shape: VesselShape;
  name: string;
  slug: string;
  code: string;
  category: string;
  prices: [number, number][];
  keywords: string[];
  summary: string;
  recipe: string;
}

const families: Family[] = [
  {
    shape: 'frying_pan',
    name: 'Frying Pan',
    slug: 'frying-pan',
    code: 'FRY',
    category: 'Skillets & Frying Pans > Frying Pans',
    prices: [
      [20, 130],
      [24, 145],
      [28, 160],
    ],
    keywords: ['skillet', 'searing', 'eggs'],
    summary: 'Sloping sides give a spatula room to reach beneath an egg or a crisp fish fillet.',
    recipe: 'Sear a skin-on fillet, then loosen the browned juices with lemon.',
  },
  {
    shape: 'saucier',
    name: 'High-Wall Saucier',
    slug: 'saucier',
    code: 'SCR',
    category: 'Saucepans',
    prices: [
      [20, 140],
      [22, 148],
      [24, 155],
      [26, 165],
    ],
    keywords: ['high-wall skillet', 'risotto', 'reduction'],
    summary: 'A curved transition from base to wall lets a whisk follow the whole pan as a sauce thickens.',
    recipe: 'Stir mushroom risotto, folding in the last ladle of stock just before serving.',
  },
  {
    shape: 'saute',
    name: 'Sauté Pan',
    slug: 'saute',
    code: 'STE',
    category: 'Sauté Pans',
    prices: [
      [24, 155],
      [28, 170],
    ],
    keywords: ['saute pan', 'braising', 'shallow frying'],
    summary:
      'Straight sides contain cooking liquid while the wide floor leaves space to brown ingredients in one layer.',
    recipe: 'Brown chicken thighs, add stock and finish with a covered braise.',
  },
  {
    shape: 'tawa',
    name: 'Tawa',
    slug: 'relay-tava',
    code: 'TAV',
    category: 'Griddles & Grill Pans',
    prices: [
      [26, 130],
      [30, 145],
    ],
    keywords: ['tava', 'flat griddle', 'dosa', 'roti', 'crêpe'],
    summary: 'A low rim leaves the surface open for spreading batter and sliding a turner under flatbreads.',
    recipe: 'Spread dosa batter in a thin spiral and lift the edges as they crisp.',
  },
  {
    shape: 'saucepan',
    name: 'Saucepan',
    slug: 'saucepan',
    code: 'SPN',
    category: 'Saucepans',
    prices: [
      [16, 130],
      [20, 145],
    ],
    keywords: ['milk pan', 'grains', 'chai'],
    summary: 'The compact footprint leaves space on the hob while grains simmer or milk warms.',
    recipe: 'Simmer ginger and cardamom for chai, add milk and strain to serve.',
  },
  {
    shape: 'stockpot',
    name: 'Deep Stockpot',
    slug: 'stockpot',
    code: 'STK',
    category: 'Stock Pots',
    prices: [
      [20, 145],
      [24, 160],
      [28, 175],
    ],
    keywords: ['deep saucepan', 'broth', 'pasta pot'],
    summary:
      'Tall walls leave headroom for broth and pasta. Two side grips balance the pot when carrying it.',
    recipe: 'Simmer roasted vegetables with aromatics, then strain for stock.',
  },
  {
    shape: 'kadhai',
    name: 'Kadhai',
    slug: 'kadhai',
    code: 'KAD',
    category: 'Woks',
    prices: [
      [24, 145],
      [28, 160],
      [32, 175],
    ],
    keywords: ['kadai', 'flat-base wok', 'stir-fry', 'tadka'],
    summary:
      'A flat foot supports the curved bowl, which gathers spices in the centre and gives vegetables room to turn.',
    recipe: 'Bloom cumin in oil, then toss peppers and paneer through the spiced oil.',
  },
];

function vessel(f: Family, diameter: number, price: number): ForgeSkuDef {
  const saucepan20 = f.shape === 'saucepan' && diameter === 20;
  const code = saucepan20 ? 'SAU' : f.code;
  const slug = saucepan20
    ? 'relay-saucepot'
    : f.shape === 'kadhai' && diameter === 24
      ? 'relay-kadai'
      : f.slug;
  const title = `Forge ${f.name} · ${diameter} cm`;
  const handles: HandleConfig =
    f.shape === 'stockpot' ||
    (f.shape === 'kadhai' && diameter >= 28) ||
    (f.shape === 'tawa' && diameter === 30)
      ? 'dual_loops'
      : f.shape === 'saute' || f.shape === 'kadhai' || (f.shape === 'frying_pan' && diameter === 28)
        ? 'stick_helper'
        : f.shape === 'tawa'
          ? 'short_riveted'
          : 'stick';
  const lid =
    f.shape !== 'tawa' && LID_ECOSYSTEM.some((size) => size === diameter)
      ? `Target fit MT-FOR-LID-${diameter}, pending rim gauge test`
      : 'No matching universal lid specified';
  return {
    sku: `MT-FOR-${code}-${diameter}`,
    handle: `forge-${slug}-${diameter}`,
    title,
    product_type: f.name,
    product_category: cookware + ' > ' + f.category,
    list_price_gbp: price,
    rim_diameter_cm: diameter,
    induction_coil_zone_cm: coilZoneForRim(diameter),
    handle_configuration: handles,
    lid_compatibility: lid,
    vessel_shape: f.shape,
    quick_summary: `${diameter} cm stainless steel ${f.name.toLowerCase()} for ${f.keywords.at(-1)}.`,
    lineup_copy: f.summary,
    suggested_use_case: f.recipe,
    works_with_kansa: true,
    pairs_with_care_kit: CARE_KIT,
    heat_sources: ['induction', 'gas', 'electric'],
    induction_compatible: true,
    primary_material: 'Stainless steel (design brief)',
    lining_material: 'Stainless steel cooking surface, grade pending',
    material_architecture:
      'Stainless steel body. Layer count, gauge and base construction await supplier specification.',
    food_contact_strategy: 'Stainless steel interior pending material and migration verification.',
    fabrication_route: 'Supplier forming and handle attachment process pending.',
    interaction_performance_intent: f.summary,
    care_hypothesis: 'Allow to cool, hand wash with a soft brush and dry.',
    engineering_risks: ['Base flatness', 'Handle attachment under load'],
    required_prototype_tests: [
      'Rim and base measurement',
      'Handle load and temperature',
      'Hob compatibility',
    ],
    agent_intents: f.keywords,
    negative_constraints: ['Verified induction performance', 'Oven temperature rating'],
    concept_thesis: f.summary,
    reference_class: f.name,
    benchmark_logic: 'Diameter and proposed GBP price from the Forge assortment brief.',
    description_html: `<p>${f.summary}</p><p>${f.recipe}</p><p>${lid}.</p>${NOTICE}`,
    seo_title: title + ' | Maison Tavo',
    seo_description: f.summary,
    tags: ['Forge Hybrid', 'Stainless steel', f.name, ...f.keywords],
    option_name: 'Diameter',
    option_value: `${diameter} cm`,
    media_plan: mediaPlan(title, f.shape),
  };
}

const vessels = families.flatMap((f) => f.prices.map(([size, price]) => vessel(f, size, price)));
function lid(size: number): ForgeSkuDef {
  const title = `Forge Universal Lid · ${size} cm`;
  const summary = `Shared cover for matching ${size} cm Forge vessel rims. Fit remains a design target.`;
  return {
    ...vessels[0]!,
    sku: `MT-FOR-LID-${size}`,
    handle: `forge-universal-lid-${size}`,
    title,
    product_type: 'Replacement lid',
    product_category: accessories + ' > Pot & Pan Lids',
    list_price_gbp: size <= 20 ? 30 : size === 24 ? 35 : 40,
    rim_diameter_cm: size,
    induction_coil_zone_cm: undefined,
    vessel_shape: 'lid',
    handle_configuration: 'lid_bridge',
    lid_compatibility: summary,
    is_care_or_set: true,
    heat_sources: [],
    induction_compatible: false,
    primary_material: 'Glass and stainless steel (design target)',
    lining_material: 'Glass underside',
    material_architecture: 'Glass cover with stainless rim and bridge handle.',
    food_contact_strategy: 'Verify steam-contact materials.',
    fabrication_route: 'Gauge lid rim against each intended vessel.',
    interaction_performance_intent: 'Retain steam during covered cooking.',
    engineering_risks: ['Rim mismatch', 'Glass thermal shock'],
    required_prototype_tests: ['Rim gauge', 'Glass thermal shock', 'Handle temperature'],
    quick_summary: summary,
    lineup_copy: summary,
    concept_thesis: summary,
    suggested_use_case: 'Cover the matching vessel for a gentle simmer.',
    reference_class: 'Replacement lid',
    agent_intents: ['pan lid', 'shared lid', `${size} cm cover`],
    tags: ['Forge Hybrid', 'Universal lid'],
    description_html: `<p>${summary}</p>${NOTICE}`,
    seo_title: title,
    seo_description: summary,
    option_value: `${size} cm`,
    media_plan: mediaPlan(title, 'lid'),
  };
}

const kitTitle = 'Forge Stainless Steel Maintenance Kit';
const stainlessCare: ForgeSkuDef = {
  ...lid(20),
  sku: CARE_KIT,
  handle: 'forge-stainless-steel-maintenance-kit',
  title: kitTitle,
  product_type: 'Cookware care kit',
  product_category: accessories,
  list_price_gbp: 35,
  rim_diameter_cm: undefined,
  handle_configuration: 'none',
  lid_compatibility: 'Not applicable',
  vessel_shape: 'care_kit',
  pairs_with_care_kit: '',
  primary_material: 'Soft brush and drying cloth (proposed)',
  lining_material: 'Not applicable',
  material_architecture: 'Brush and cloth for routine washing and drying.',
  food_contact_strategy: 'Verify brush and cloth suitability for cookware care.',
  fabrication_route: 'Source and pack care tools.',
  engineering_risks: ['Surface scratching', 'Fibre shedding'],
  required_prototype_tests: ['Finish abrasion test', 'Brush shedding check'],
  interaction_performance_intent: 'Lift food residue while preserving the steel finish.',
  care_hypothesis: 'Rinse brush and air dry after use.',
  reference_class: 'Stainless cookware maintenance kit',
  negative_constraints: ['Restores damaged finishes'],
  concept_thesis: 'Everyday care for stainless steel cookware.',
  quick_summary: 'A soft brush and drying cloth for the stainless Forge range.',
  lineup_copy:
    'Use the brush to loosen residue after soaking a cooled pan. Dry the rim and handle joints with the cloth.',
  suggested_use_case: 'After a pan sauce, soak the cooled saucier, brush the curved wall and towel dry.',
  agent_intents: ['clean stainless steel', 'care kit', 'maintenance'],
  tags: ['Forge Hybrid', 'Stainless steel care'],
  option_name: 'Kit',
  option_value: 'Brush and cloth',
  seo_title: kitTitle,
  seo_description: 'Routine care for stainless Forge cookware.',
  description_html: '<p>A proposed brush and cloth kit for daily stainless steel care.</p>' + NOTICE,
  media_plan: [
    {mode: 'Human', shot: 'Brush and folded cloth arranged beside a cooled stainless pan'},
    {mode: 'Human', shot: 'Brush following the curved wall of a saucier'},
    {mode: 'Engineer', shot: 'Brush head and fibre detail'},
    {mode: 'Engineer', shot: 'Cloth weave and stitched edge detail'},
    {mode: 'Machine', shot: 'Kit contents as silhouette outlines'},
    {mode: 'Machine', shot: 'Structured contents and care pairing record'},
  ],
};
export const FORGE_MATRIX = [...vessels, ...LID_ECOSYSTEM.map(lid), stainlessCare];

function setPrice(components: string[], includedLids: string[]): number {
  const bySku = new Map(FORGE_MATRIX.map((s) => [s.sku, s]));
  if (includedLids.some((sku) => !components.includes(sku) || bySku.get(sku)?.vessel_shape !== 'lid')) {
    throw new Error('Every included lid must be a lid component of this set');
  }
  let total = 0;
  for (const sku of components) {
    if (includedLids.includes(sku)) continue; // lids free inside curated sets
    const row = bySku.get(sku);
    if (!row) throw new Error(`Unknown bundle component ${sku}`);
    total += row.list_price_gbp;
  }
  return total;
}

function buildSet(def: {
  sku: string;
  handle: string;
  title: string;
  components: string[];
  included_lids: string[];
  quick_summary: string;
  lineup_copy: string;
  suggested_use_case: string;
  agent_intents: string[];
}): ForgeSkuDef {
  const price = setPrice(def.components, def.included_lids);
  const all = [...def.components];
  return {
    sku: def.sku,
    handle: def.handle,
    title: def.title,
    product_type: 'Cookware set',
    product_category: CAT_SET,
    list_price_gbp: price,
    handle_configuration: 'set',
    lid_compatibility: def.included_lids.join(', ') || 'See component vessels',
    vessel_shape: 'set',
    is_care_or_set: true,
    works_with_kansa: true,
    pairs_with_care_kit: CARE_KIT,
    bundle_components: all,
    included_lids: def.included_lids,
    heat_sources: ['induction', 'gas'],
    induction_compatible: true,
    primary_material: 'Forge stainless steel vessels and shared lids',
    lining_material: 'See component SKUs',
    material_architecture: `Set composition (SKU): ${all.join(', ')}. Lids included free: ${def.included_lids.join(', ') || 'none'}.`,
    food_contact_strategy: 'Follow each component vessel food-contact strategy.',
    fabrication_route: 'Assembled from independently prototyped component SKUs; no bonded set fabrication.',
    interaction_performance_intent: def.suggested_use_case,
    care_hypothesis: 'Maintain each metal per Forge Care Ritual Kit; never dishwasher until validated.',
    engineering_risks: ['Component fit drift', 'Lid seat mismatch', 'Set weight for shipping'],
    required_prototype_tests: ['Component rim gauges', 'Set pack-out drop', 'Lid seating on each vessel'],
    agent_intents: def.agent_intents,
    negative_constraints: [
      'invented component performance',
      'guaranteed inventory of every component',
      'compare-at strikethrough without verified reference',
    ],
    concept_thesis: def.quick_summary,
    reference_class: 'cookware set',
    benchmark_logic: 'Bundle price = component GBP guidance minus free included lids.',
    quick_summary: def.quick_summary,
    lineup_copy: def.lineup_copy,
    suggested_use_case: def.suggested_use_case,
    tags: ['Forge Hybrid', 'Cookware Set', 'Bundle', 'Concept Spec'],
    option_name: 'Set',
    option_value: `${def.components.length}-piece curated set`,
    seo_title: `${def.title} | Maison Tavo`,
    seo_description: def.quick_summary,
    description_html: `<p>${def.lineup_copy}</p><h3>Included components</h3><p>${all.join(', ')}</p><h3>Lids</h3><p>Curated sets include lids at no add-on charge: ${def.included_lids.join(', ') || 'n/a'}.</p><p>List price £${price} reflects component guidance with lids free inside the set.</p>${NOTICE}`,
    media_plan: mediaPlan(def.title, 'set'),
  };
}

export const FORGE_SETS: ForgeSkuDef[] = [
  buildSet({
    sku: 'MT-FOR-SET-SOLO',
    handle: 'forge-set-solo-couple',
    title: 'Forge Set — Solo / Couple',
    components: ['MT-FOR-FRY-20', 'MT-FOR-SPN-16', 'MT-FOR-SCR-22', 'MT-FOR-LID-20'],
    included_lids: ['MT-FOR-LID-20'],
    quick_summary: 'Compact starter: 20 fry, 16 sauce, 22 saucier and a 20 cm lid for the fry pan.',
    lineup_copy: 'Size-based Solo/Couple kit covering sear, wet cook and sauce work with one shared lid.',
    suggested_use_case: 'Two-person weeknights: eggs, grains, small sauces.',
    agent_intents: ['starter set', 'solo cookware', 'couple set', 'forge bundle'],
  }),
  buildSet({
    sku: 'MT-FOR-SET-FAM',
    handle: 'forge-set-family-standard',
    title: 'Forge Set — Family Standard',
    components: [
      'MT-FOR-FRY-24',
      'MT-FOR-SAU-20',
      'MT-FOR-STK-24',
      'MT-FOR-KAD-24',
      'MT-FOR-LID-20',
      'MT-FOR-LID-24',
    ],
    included_lids: ['MT-FOR-LID-20', 'MT-FOR-LID-24'],
    quick_summary: 'Family kit: 24 fry, 20 sauce, 24 stock, 24 kadhai, lids 20+24.',
    lineup_copy: 'Core family diameters spanning sear, wet cook, stock and tadka.',
    suggested_use_case: 'Four-person household: weeknight sear through Sunday stock.',
    agent_intents: ['family set', 'forge bundle', '24 cm set'],
  }),
  buildSet({
    sku: 'MT-FOR-SET-ENT',
    handle: 'forge-set-entertainer',
    title: 'Forge Set — Entertainer',
    components: ['MT-FOR-FRY-28', 'MT-FOR-STE-28', 'MT-FOR-STK-28', 'MT-FOR-TAV-30', 'MT-FOR-LID-28'],
    included_lids: ['MT-FOR-LID-28'],
    quick_summary: 'Guest kit: 28 fry, 28 sauté, 28 stock, 30 tawa, 28 lid.',
    lineup_copy: 'Entertainer diameters for large sears, braises, stocks and wide flatbreads.',
    suggested_use_case: 'Dinner parties and feast cooking.',
    agent_intents: ['entertainer set', 'guest cookware', 'forge bundle'],
  }),
  buildSet({
    sku: 'MT-FOR-SET-EUR',
    handle: 'forge-set-european',
    title: 'Forge Cuisine Kit — European',
    components: [
      'MT-FOR-FRY-24',
      'MT-FOR-SCR-26',
      'MT-FOR-STE-28',
      'MT-FOR-SAU-20',
      'MT-FOR-LID-20',
      'MT-FOR-LID-28',
    ],
    included_lids: ['MT-FOR-LID-20', 'MT-FOR-LID-28'],
    quick_summary: 'Four vessels for searing, reduction and braising, plus two lids.',
    lineup_copy: 'Sauce-forward European weeknight kit emphasising sear, braise and emulsion.',
    suggested_use_case: 'Risotto, pan sauces, braised chicken, sautéed vegetables.',
    agent_intents: ['european cookware set', 'sauce kit', 'forge bundle'],
  }),
  buildSet({
    sku: 'MT-FOR-SET-ASN',
    handle: 'forge-set-asian',
    title: 'Forge Cuisine Kit — Asian',
    components: ['MT-FOR-KAD-28', 'MT-FOR-TAV-26', 'MT-FOR-SAU-20', 'MT-FOR-STK-24', 'MT-FOR-LID-28'],
    included_lids: ['MT-FOR-LID-28'],
    quick_summary: 'A 28 cm kadhai with lid, 26 cm tawa, 20 cm saucepan and 24 cm stockpot.',
    lineup_copy: 'Flatbread, tadka and wet-cook set for South and East Asian home kitchens.',
    suggested_use_case: 'Roti, dosa, tadka dal, stir-fry.',
    agent_intents: ['asian cookware set', 'tava kadai set', 'forge bundle'],
  }),
  buildSet({
    sku: 'MT-FOR-SET-DAY',
    handle: 'forge-set-everyday',
    title: 'Forge Cuisine Kit — All-in-One Everyday',
    components: [
      'MT-FOR-FRY-24',
      'MT-FOR-STE-28',
      'MT-FOR-SAU-20',
      'MT-FOR-KAD-28',
      'MT-FOR-LID-20',
      'MT-FOR-LID-28',
    ],
    included_lids: ['MT-FOR-LID-20', 'MT-FOR-LID-28'],
    quick_summary: 'Four everyday vessels with 20 and 28 cm lids.',
    lineup_copy: 'Minimal daily rotation covering sear, wet cook and sauce without specialty shapes.',
    suggested_use_case: 'Most weeknight meals with a saucepan and kadhai.',
    agent_intents: ['everyday set', 'minimal cookware', 'forge bundle'],
  }),
  buildSet({
    sku: 'MT-FOR-SET-FUL',
    handle: 'forge-set-full-house',
    title: 'Forge Set — Full House Master Collection',
    components: [
      'MT-FOR-FRY-24',
      'MT-FOR-FRY-28',
      'MT-FOR-SCR-24',
      'MT-FOR-SCR-26',
      'MT-FOR-STE-24',
      'MT-FOR-STE-28',
      'MT-FOR-TAV-26',
      'MT-FOR-TAV-30',
      'MT-FOR-SAU-20',
      'MT-FOR-STK-24',
      'MT-FOR-STK-28',
      'MT-FOR-KAD-28',
      'MT-FOR-KAD-32',
      'MT-FOR-LID-20',
      'MT-FOR-LID-24',
      'MT-FOR-LID-28',
    ],
    included_lids: ['MT-FOR-LID-20', 'MT-FOR-LID-24', 'MT-FOR-LID-28'],
    quick_summary: 'Seven vessel shapes across medium and large sizes, with three shared lids.',
    lineup_copy:
      'Master collection of the launch Forge diameter matrix — all core shapes and universal lids.',
    suggested_use_case: 'Complete house cookware programme for exhibition and hospitality pilots.',
    agent_intents: ['full set', 'master collection', 'forge bundle', 'complete cookware'],
  }),
];

/** Adapted specialty pieces retained (not orphaned) with GBP repositioning notes. */
export const FORGE_SPECIALTY_UPDATES: Array<{
  sku: string;
  list_price_gbp: number;
  quick_summary: string;
  works_with_kansa: boolean;
  pairs_with_care_kit: string;
  handle_configuration: HandleConfig;
  lid_compatibility: string;
  vessel_shape: VesselShape;
  induction_coil_zone_cm?: number;
  rim_diameter_cm?: number;
}> = [
  {
    sku: 'MT-FOR-RLY-26',
    list_price_gbp: 175,
    quick_summary: 'Signature modular dual-mass skillet — specialty above the standard fry ladder.',
    works_with_kansa: true,
    pairs_with_care_kit: 'MT-FOR-KIT-C01',
    handle_configuration: 'stick',
    lid_compatibility: 'Specialty Relay lid 26 (MT-FOR-LID-26) if held',
    vessel_shape: 'specialty',
    rim_diameter_cm: 26,
    induction_coil_zone_cm: 18,
  },
  {
    sku: 'MT-FOR-PLN-46',
    list_price_gbp: 220,
    quick_summary: 'Split-field plancha specialty — outside the round diameter matrix.',
    works_with_kansa: true,
    pairs_with_care_kit: 'MT-FOR-KIT-C01',
    handle_configuration: 'dual_loops',
    lid_compatibility: 'Not lid-ecosystem; open plancha',
    vessel_shape: 'specialty',
  },
  {
    sku: 'MT-FOR-LID-26',
    list_price_gbp: 35,
    quick_summary: 'Specialty Relay 26 cm lid retained for Dual-Mass Skillet / Compact Tawa era fit.',
    works_with_kansa: true,
    pairs_with_care_kit: 'MT-FOR-KIT-C01',
    handle_configuration: 'lid_bridge',
    lid_compatibility: '26 cm Relay specialty vessels',
    vessel_shape: 'lid',
    rim_diameter_cm: 26,
  },
  {
    sku: 'MT-FOR-LID-30',
    list_price_gbp: 40,
    quick_summary: 'Specialty Relay 30 cm wide lid retained for Wide Tawa era fit.',
    works_with_kansa: true,
    pairs_with_care_kit: 'MT-FOR-KIT-C01',
    handle_configuration: 'lid_bridge',
    lid_compatibility: '30 cm Relay specialty vessels',
    vessel_shape: 'lid',
    rim_diameter_cm: 30,
  },
];

export const ALL_FORGE_LAUNCH_SKUS: ForgeSkuDef[] = [...FORGE_MATRIX, ...FORGE_SETS];

export function forgeBySku(): Map<string, ForgeSkuDef> {
  return new Map(ALL_FORGE_LAUNCH_SKUS.map((s) => [s.sku, s]));
}

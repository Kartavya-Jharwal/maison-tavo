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
  | 'stick'
  | 'stick_helper'
  | 'short_riveted'
  | 'dual_loops'
  | 'lid_bridge'
  | 'set';

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
  | 'specialty';

export type MediaMode = 'Human' | 'Engineer' | 'Machine';

export interface MediaShot {
  mode: MediaMode;
  shot: string;
}

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
export const LID_ECOSYSTEM = {
  '16/20': {sku: 'MT-FOR-LID-20', seats: [16, 20], price_gbp: 30},
  '24': {sku: 'MT-FOR-LID-24', seats: [24], price_gbp: 35},
  '28/32': {sku: 'MT-FOR-LID-28', seats: [28, 32], price_gbp: 40},
} as const;

export const DEFERRED_FORGE_SIZES = [
  {shape: 'saucier', size_cm: 26, reason: 'Launch holds 20/24; 26 waits post-pricing validation'},
  {shape: 'stockpot', size_cm: 20, reason: 'Family/Entertainer cover 24/28 first'},
  {shape: 'kadhai', size_cm: 32, reason: 'XXL deferred; LID-28 designed to seat 28/32 later'},
  {shape: 'frying_pan', size_cm: 32, reason: 'Optional XXL not in launch'},
  {shape: 'diameter_standard', size_cm: 32, reason: 'Optional XXL rim standard documented only'},
] as const;

const CARE_KIT = 'MT-FOR-KIT-C01';
const NOTICE =
  '<p><strong>Concept-spec notice:</strong> Materials, dimensions, compatibility, food-contact migration and wash performance are unverified prototype targets. Physical unit weight and live stock remain unset until pilot fabrication. Diameters are inner rim-to-rim concept targets.</p>';

function mediaPlan(title: string, shape: string): MediaShot[] {
  return [
    {mode: 'Human', shot: `${title} — editorial three-quarter hero, living patina, soft north light`},
    {mode: 'Human', shot: `${title} — in-use kitchen still (hands optional), atmosphere not prop clutter`},
    {mode: 'Engineer', shot: `${title} — SVG CAD stratigraphy / section with mm wall callouts and ${shape} geometry`},
    {mode: 'Engineer', shot: `${title} — induction coil zone plate (rim / base / coil overlay)`},
    {mode: 'Machine', shot: `${title} — clean ASCII silhouette plate`},
    {mode: 'Machine', shot: `${title} — Schema.org JSON-LD / specs.* token block plate`},
  ];
}

function vesselHtml(opts: {
  lead: string;
  why: string;
  role: string;
  handles: string;
  lids: string;
  coil?: number;
}): string {
  const coil = opts.coil
    ? `<h3>Induction base</h3><p>Concept induction coil zone target ≈ ${opts.coil} cm (unverified). Inner rim-to-rim diameter is the size callout.</p>`
    : '';
  return `<p>${opts.lead}</p><h3>Why it exists</h3><p>${opts.why}</p><h3>Service &amp; kitchen role</h3><p>${opts.role}</p><h3>Handles &amp; lids</h3><p>${opts.handles} ${opts.lids}</p>${coil}${NOTICE}`;
}

const CAT_FRY =
  'Home & Garden > Kitchen & Dining > Cookware & Bakeware > Cookware > Skillets & Frying Pans > Frying Pans';
const CAT_SAUCE =
  'Home & Garden > Kitchen & Dining > Cookware & Bakeware > Cookware > Saucepans';
const CAT_SAUTE =
  'Home & Garden > Kitchen & Dining > Cookware & Bakeware > Cookware > Saute Pans';
const CAT_STOCK =
  'Home & Garden > Kitchen & Dining > Cookware & Bakeware > Cookware > Stock Pots';
const CAT_WOK = 'Home & Garden > Kitchen & Dining > Cookware & Bakeware > Cookware > Woks';
const CAT_GRIDDLE =
  'Home & Garden > Kitchen & Dining > Cookware & Bakeware > Cookware > Griddles & Grill Pans';
const CAT_LID =
  'Home & Garden > Kitchen & Dining > Cookware & Bakeware > Cookware Accessories > Pot & Pan Lids';
const CAT_SET =
  'Home & Garden > Kitchen & Dining > Cookware & Bakeware > Cookware Accessories';

type CarbonSteelInput = Omit<
  ForgeSkuDef,
  | 'works_with_kansa'
  | 'pairs_with_care_kit'
  | 'heat_sources'
  | 'induction_compatible'
  | 'primary_material'
  | 'lining_material'
  | 'material_architecture'
  | 'food_contact_strategy'
  | 'fabrication_route'
  | 'care_hypothesis'
  | 'engineering_risks'
  | 'required_prototype_tests'
  | 'negative_constraints'
  | 'benchmark_logic'
  | 'tags'
  | 'media_plan'
  | 'lineup_copy'
  | 'induction_coil_zone_cm'
  | 'base_diameter_cm'
> &
  Partial<
    Pick<
      ForgeSkuDef,
      | 'heat_sources'
      | 'primary_material'
      | 'lining_material'
      | 'material_architecture'
      | 'food_contact_strategy'
      | 'lineup_copy'
      | 'induction_coil_zone_cm'
      | 'base_diameter_cm'
    >
  >;

function carbonSteelVessel(partial: CarbonSteelInput): ForgeSkuDef {
  const rim = partial.rim_diameter_cm;
  const coil = rim ? coilZoneForRim(rim) : undefined;
  return {
    ...partial,
    works_with_kansa: true,
    pairs_with_care_kit: CARE_KIT,
    heat_sources: partial.heat_sources ?? ['induction', 'gas'],
    induction_compatible: true,
    primary_material:
      partial.primary_material ?? 'Nitrided carbon steel with bronze-isolated handle hardware',
    lining_material: partial.lining_material ?? 'Unlined seasoned carbon steel (CONCEPT_SPEC)',
    material_architecture:
      partial.material_architecture ??
      'Spun/deep-drawn nitrided carbon-steel vessel + bronze-isolated stainless handle fittings.',
    food_contact_strategy:
      partial.food_contact_strategy ??
      'Seasoned nitrided carbon steel contacts food; bronze collars remain non-food-contact.',
    fabrication_route:
      'Prototype spun or deep-drawn body; nitride or season; rivet/isolate handles; validate flatness on induction.',
    care_hypothesis:
      'Hand wash warm; dry over low heat; thin film of Forge Seasoning Oil. Never dishwasher until validated.',
    engineering_risks: [
      'High-heat warping on undersized coils',
      'Seasoning wear under acid',
      'Handle heat creep',
      'Lid rim-step mismatch',
    ],
    required_prototype_tests: [
      'Induction flatness cycling',
      'Surface thermal map',
      'Handle temperature rise',
      'Lid go/no-go gauge',
      'Acid-cycle seasoning',
    ],
    negative_constraints: [
      'dishwasher safe',
      'synthetic nonstick coating',
      'guaranteed heat retention numbers',
      'invented stock quantity',
    ],
    benchmark_logic:
      'Fills the Forge diameter matrix with honest CONCEPT_SPEC targets; no benchmark performance attributed.',
    tags: [
      'Forge Hybrid',
      'Cookware',
      'Carbon Steel',
      'Induction',
      'Concept Spec',
      partial.product_type,
    ],
    media_plan: mediaPlan(partial.title, partial.vessel_shape),
    induction_coil_zone_cm: partial.induction_coil_zone_cm ?? coil,
    base_diameter_cm: partial.base_diameter_cm ?? (rim ? Math.round(rim * 0.72) : undefined),
    lineup_copy: partial.lineup_copy ?? partial.quick_summary,
  };
}

/** Launch Forge vessels, lids, and curated sets (plus adapted existing SKUs). */
export const FORGE_MATRIX: ForgeSkuDef[] = [
  // —— Frying pans ——
  carbonSteelVessel({
    sku: 'MT-FOR-FRY-20',
    handle: 'forge-frying-pan-20',
    title: 'Forge Frying Pan 20',
    product_type: 'Frying pan',
    product_category: CAT_FRY,
    list_price_gbp: 130,
    rim_diameter_cm: 20,
    height_cm: 4.5,
    handle_configuration: 'stick',
    lid_compatibility: 'MT-FOR-LID-20 (16/20 universal seat)',
    vessel_shape: 'frying_pan',
    quick_summary: '20 cm stick-handle carbon-steel fry pan for eggs and solo sears.',
    lineup_copy:
      'The compact Forge fryer: responsive nitrided carbon steel with a single stick handle sized for everyday breakfast and two-portion sears.',
    suggested_use_case: 'Soft scrambled eggs, single steak sear, weeknight omelette.',
    concept_thesis: 'Fast-response searing in the smallest shared lid ecosystem size.',
    reference_class: 'carbon-steel frying pan',
    agent_intents: ['frying pan', 'eggs', 'solo sear', 'induction fry pan', '20 cm pan'],
    interaction_performance_intent: 'Eggs, pan-frying, quick sears for one–two portions.',
    option_name: 'Diameter',
    option_value: '20 cm',
    seo_title: 'Forge Frying Pan 20 | Maison Tavo',
    seo_description:
      '20 cm Forge Hybrid carbon-steel frying pan concept with stick handle and 16/20 universal lid seat.',
    description_html: vesselHtml({
      lead: 'A compact 20 cm carbon-steel frying pan for eggs, quick sears and solo weeknights.',
      why: 'Opens the Forge diameter ladder at the shared 16/20 lid seat without forcing a larger pan for small jobs.',
      role: 'Searing, eggs, pan-frying for one–two portions.',
      handles: 'Stick handle with bronze-isolated junction (CONCEPT_SPEC).',
      lids: 'Seats the Forge Universal Lid 16/20.',
      coil: 14.5,
    }),
  }),
  carbonSteelVessel({
    sku: 'MT-FOR-FRY-24',
    handle: 'forge-frying-pan-24',
    title: 'Forge Frying Pan 24',
    product_type: 'Frying pan',
    product_category: CAT_FRY,
    list_price_gbp: 145,
    rim_diameter_cm: 24,
    height_cm: 4.8,
    handle_configuration: 'stick',
    lid_compatibility: 'MT-FOR-LID-24',
    vessel_shape: 'frying_pan',
    quick_summary: '24 cm everyday stick-handle fry pan — the Forge workhorse sear.',
    lineup_copy:
      'Core Forge fry diameter: enough floor for a family sear without the helper-loop mass of the 28.',
    suggested_use_case: 'Two chicken thighs, smash burgers for two, blistered vegetables.',
    concept_thesis: 'Primary searing diameter for the Family and Everyday sets.',
    reference_class: 'carbon-steel frying pan',
    agent_intents: ['frying pan', 'searing', '24 cm pan', 'induction fry pan'],
    interaction_performance_intent: 'Everyday searing and pan-frying.',
    option_name: 'Diameter',
    option_value: '24 cm',
    seo_title: 'Forge Frying Pan 24 | Maison Tavo',
    seo_description: '24 cm Forge Hybrid carbon-steel frying pan concept with stick handle.',
    description_html: vesselHtml({
      lead: 'The 24 cm Forge frying pan — stick handle, flat induction foot, seasoning-capable floor.',
      why: 'Balances reach and control for the most common home sear jobs.',
      role: 'Searing, eggs, pan-frying.',
      handles: 'Stick handle (CONCEPT_SPEC).',
      lids: 'Seats the Forge Universal Lid 24.',
      coil: 18,
    }),
  }),
  carbonSteelVessel({
    sku: 'MT-FOR-FRY-28',
    handle: 'forge-frying-pan-28',
    title: 'Forge Frying Pan 28',
    product_type: 'Frying pan',
    product_category: CAT_FRY,
    list_price_gbp: 160,
    rim_diameter_cm: 28,
    height_cm: 5,
    handle_configuration: 'stick_helper',
    lid_compatibility: 'MT-FOR-LID-28',
    vessel_shape: 'frying_pan',
    quick_summary: '28 cm fry pan with stick + helper loop for larger sears.',
    lineup_copy:
      'Entertainer-scale fry floor with a helper loop for two-hand moves from hob to pass.',
    suggested_use_case: 'Family steak night, large vegetable sear, shallow fry finish.',
    concept_thesis: 'Large sear diameter with helper loop for safe loaded moves.',
    reference_class: 'carbon-steel frying pan',
    agent_intents: ['frying pan', 'large sear', '28 cm pan', 'helper handle'],
    interaction_performance_intent: 'Large-format searing and pan-frying.',
    option_name: 'Diameter',
    option_value: '28 cm',
    seo_title: 'Forge Frying Pan 28 | Maison Tavo',
    seo_description: '28 cm Forge frying pan concept with stick handle and helper loop.',
    description_html: vesselHtml({
      lead: 'A 28 cm carbon-steel frying pan with stick handle and opposite helper loop.',
      why: 'Large sear jobs need a second grip without converting the pan into a dual-loop skillet.',
      role: 'Searing, eggs, pan-frying for family portions.',
      handles: 'Stick + helper loop (CONCEPT_SPEC).',
      lids: 'Seats the Forge Universal Lid 28/32.',
      coil: 21,
    }),
  }),

  // —— Sauciers ——
  carbonSteelVessel({
    sku: 'MT-FOR-SCR-20',
    handle: 'forge-saucier-20',
    title: 'Forge Saucier 20',
    product_type: 'Saucier',
    product_category: CAT_SAUCE,
    list_price_gbp: 140,
    rim_diameter_cm: 20,
    height_cm: 8,
    capacity_ml: 1800,
    handle_configuration: 'stick',
    lid_compatibility: 'MT-FOR-LID-20',
    vessel_shape: 'saucier',
    quick_summary: '20 cm high-wall saucier for sauces and risotto.',
    lineup_copy:
      'Rounded high wall invites whisking and reduction without sharp corners trapping fond.',
    suggested_use_case: 'Beurre blanc, risotto for two, chocolate ganache.',
    concept_thesis: 'High-wall cookware for continuous stirring and emulsion work.',
    reference_class: 'saucier / high-wall skillet',
    agent_intents: ['saucier', 'risotto', 'sauce pan', 'high wall skillet'],
    interaction_performance_intent: 'Sauces, risotto, reductions.',
    option_name: 'Diameter',
    option_value: '20 cm',
    seo_title: 'Forge Saucier 20 | Maison Tavo',
    seo_description: '20 cm Forge high-wall saucier concept for sauces and risotto.',
    description_html: vesselHtml({
      lead: 'A 20 cm high-wall carbon-steel saucier shaped for sauces and risotto.',
      why: 'Corners kill emulsions; a continuous curve keeps whisks and spatulas honest.',
      role: 'Sauces, risotto, small reductions.',
      handles: 'Stick handle (CONCEPT_SPEC).',
      lids: 'Seats the Forge Universal Lid 16/20.',
      coil: 14.5,
    }),
  }),
  carbonSteelVessel({
    sku: 'MT-FOR-SCR-24',
    handle: 'forge-saucier-24',
    title: 'Forge Saucier 24',
    product_type: 'Saucier',
    product_category: CAT_SAUCE,
    list_price_gbp: 155,
    rim_diameter_cm: 24,
    height_cm: 8.5,
    capacity_ml: 2800,
    handle_configuration: 'stick',
    lid_compatibility: 'MT-FOR-LID-24',
    vessel_shape: 'saucier',
    quick_summary: '24 cm saucier for family sauces and grain finishes.',
    lineup_copy: 'Scaled high-wall geometry for four-person risotto and larger reductions.',
    suggested_use_case: 'Family risotto, curry base reductions, custard-scale sauces.',
    concept_thesis: 'Family saucier diameter aligned to the 24 cm lid seat.',
    reference_class: 'saucier / high-wall skillet',
    agent_intents: ['saucier', 'risotto', '24 cm saucier'],
    interaction_performance_intent: 'Sauces, risotto, reductions for four.',
    option_name: 'Diameter',
    option_value: '24 cm',
    seo_title: 'Forge Saucier 24 | Maison Tavo',
    seo_description: '24 cm Forge high-wall saucier concept.',
    description_html: vesselHtml({
      lead: 'A 24 cm high-wall carbon-steel saucier for sauces and risotto at family scale.',
      why: 'Keeps the curved wall thesis while matching the 24 cm lid ecosystem.',
      role: 'Sauces, risotto, reductions.',
      handles: 'Stick handle (CONCEPT_SPEC).',
      lids: 'Seats the Forge Universal Lid 24.',
      coil: 18,
    }),
  }),

  // —— Sauté ——
  carbonSteelVessel({
    sku: 'MT-FOR-STE-24',
    handle: 'forge-saute-24',
    title: 'Forge Sauté Pan 24',
    product_type: 'Saute pan',
    product_category: CAT_SAUTE,
    list_price_gbp: 155,
    rim_diameter_cm: 24,
    height_cm: 7,
    capacity_ml: 3200,
    handle_configuration: 'stick_helper',
    lid_compatibility: 'MT-FOR-LID-24',
    vessel_shape: 'saute',
    quick_summary: '24 cm sauté with stick + helper for one-pan braises.',
    lineup_copy: 'Straight walls and helper grip for covered braising and oven finishes.',
    suggested_use_case: 'Chicken thighs braise, one-pan pasta finish, shallow stew.',
    concept_thesis: 'One-pan braising diameter with covered-lid readiness.',
    reference_class: 'saute pan',
    agent_intents: ['saute pan', 'braising', 'one-pan', '24 cm saute'],
    interaction_performance_intent: 'Braising, one-pan meals.',
    option_name: 'Diameter',
    option_value: '24 cm',
    seo_title: 'Forge Sauté Pan 24 | Maison Tavo',
    seo_description: '24 cm Forge sauté pan concept with stick and helper handles.',
    description_html: vesselHtml({
      lead: 'A 24 cm carbon-steel sauté pan with stick handle and helper loop.',
      why: 'Straight walls hold liquids for covered braises without the curve of a saucier.',
      role: 'Braising, one-pan meals.',
      handles: 'Stick + helper (CONCEPT_SPEC).',
      lids: 'Seats the Forge Universal Lid 24.',
      coil: 18,
    }),
  }),
  carbonSteelVessel({
    sku: 'MT-FOR-STE-28',
    handle: 'forge-saute-28',
    title: 'Forge Sauté Pan 28',
    product_type: 'Saute pan',
    product_category: CAT_SAUTE,
    list_price_gbp: 170,
    rim_diameter_cm: 28,
    height_cm: 7.5,
    capacity_ml: 4500,
    handle_configuration: 'stick_helper',
    lid_compatibility: 'MT-FOR-LID-28',
    vessel_shape: 'saute',
    quick_summary: '28 cm sauté for entertainer braises and one-pan feasts.',
    lineup_copy: 'Wide straight-wall pan for guests; helper loop for oven-to-table moves.',
    suggested_use_case: 'Whole chicken pieces, large one-pan pasta, guest braise.',
    concept_thesis: 'Entertainer sauté diameter paired with the 28/32 lid.',
    reference_class: 'saute pan',
    agent_intents: ['saute pan', 'braising', 'entertaining', '28 cm saute'],
    interaction_performance_intent: 'Large braises and one-pan entertaining.',
    option_name: 'Diameter',
    option_value: '28 cm',
    seo_title: 'Forge Sauté Pan 28 | Maison Tavo',
    seo_description: '28 cm Forge sauté pan concept with stick and helper handles.',
    description_html: vesselHtml({
      lead: 'A 28 cm carbon-steel sauté pan with stick + helper for entertainer braises.',
      why: 'Guest portions need width and a second grip when the pan is covered and heavy.',
      role: 'Braising, one-pan entertaining.',
      handles: 'Stick + helper (CONCEPT_SPEC).',
      lids: 'Seats the Forge Universal Lid 28/32.',
      coil: 21,
    }),
  }),

  // —— Tawa (adapt existing) ——
  carbonSteelVessel({
    sku: 'MT-FOR-TAV-26',
    handle: 'forge-relay-tava-26',
    title: 'Forge Tawa 26',
    product_type: 'Tawa',
    product_category: CAT_GRIDDLE,
    list_price_gbp: 130,
    rim_diameter_cm: 26,
    height_cm: 2.2,
    handle_configuration: 'short_riveted',
    lid_compatibility: 'Open griddle; optional specialty Relay lid 26 if held',
    vessel_shape: 'tawa',
    adapts: 'MT-FOR-TAV-26',
    quick_summary: '26 cm flat tawa for roti, dosa batter starts and smash work.',
    lineup_copy: 'Low-wall flat carbon-steel griddle with short riveted handle for rapid turns.',
    suggested_use_case: 'Roti, chapati, uttapam, smash burger.',
    concept_thesis: 'Flatbread-first induction griddle at family diameter.',
    reference_class: 'tava / flat griddle',
    agent_intents: ['tava', 'roti', 'dosa', 'flatbread', 'smash burger'],
    interaction_performance_intent: 'Roti, dosa, smash burger.',
    option_name: 'Diameter',
    option_value: '26 cm',
    seo_title: 'Forge Tawa 26 | Maison Tavo',
    seo_description: '26 cm Forge carbon-steel tawa concept for flatbreads and smash searing.',
    description_html: vesselHtml({
      lead: 'A 26 cm low-wall carbon-steel tawa for flatbreads and quick dry-roasting.',
      why: 'Gives cooks fast, seasoning-capable heat response with a short riveted handle for rapid roti turnarounds.',
      role: 'Roti, dosa, smash burger.',
      handles: 'Short riveted handle (CONCEPT_SPEC).',
      lids: 'Open griddle format; not a primary universal-lid seat.',
      coil: 18,
    }),
  }),
  carbonSteelVessel({
    sku: 'MT-FOR-TAV-30',
    handle: 'forge-relay-tava-30',
    title: 'Forge Tawa 30',
    product_type: 'Tawa',
    product_category: CAT_GRIDDLE,
    list_price_gbp: 145,
    rim_diameter_cm: 30,
    height_cm: 2.4,
    handle_configuration: 'dual_loops',
    lid_compatibility: 'Open griddle; optional specialty Relay lid 30 if held',
    vessel_shape: 'tawa',
    adapts: 'MT-FOR-TAV-30',
    quick_summary: '30 cm dual-loop tawa for wide dosas and entertainer smash work.',
    lineup_copy: 'Wide flat plate with dual loops for two-hand control on large batter spreads.',
    suggested_use_case: 'Crisp dosa, rumali-style breads, smash burger for guests.',
    concept_thesis: 'Wide flatbread and smash diameter with dual-loop control.',
    reference_class: 'tava / flat griddle',
    agent_intents: ['wide tava', 'dosa', 'smash searing', '30 cm griddle'],
    interaction_performance_intent: 'Wide dosa, smash searing, flatbread service.',
    option_name: 'Diameter',
    option_value: '30 cm',
    seo_title: 'Forge Tawa 30 | Maison Tavo',
    seo_description: '30 cm Forge carbon-steel tawa concept with dual loop handles.',
    description_html: vesselHtml({
      lead: 'A 30 cm carbon-steel tawa with dual loops for wide dosas and smash work.',
      why: 'Wider batter spreads need two-hand control without a long stick cantilever.',
      role: 'Roti, dosa, smash burger.',
      handles: 'Dual loops (CONCEPT_SPEC).',
      lids: 'Open griddle format.',
      coil: 21,
    }),
  }),

  // —— Saucepans ——
  carbonSteelVessel({
    sku: 'MT-FOR-SPN-16',
    handle: 'forge-saucepan-16',
    title: 'Forge Saucepan 16',
    product_type: 'Saucepan',
    product_category: CAT_SAUCE,
    list_price_gbp: 130,
    rim_diameter_cm: 16,
    height_cm: 9,
    capacity_ml: 1400,
    handle_configuration: 'stick',
    lid_compatibility: 'MT-FOR-LID-20 (16/20 universal seat)',
    vessel_shape: 'saucepan',
    heat_sources: ['induction', 'gas', 'electric', 'oven'],
    primary_material: 'Fully-clad 18/10 stainless steel with bronze-isolated stick handle',
    lining_material: 'Non-reactive 18/10 stainless steel interior',
    material_architecture: 'Fully-clad 18/10 stainless saucepan + bronze-isolated stick handle.',
    food_contact_strategy: 'Non-reactive 18/10 stainless contacts liquids and acidic ingredients.',
    quick_summary: '16 cm clad stainless saucepan for grains and small liquids.',
    lineup_copy: 'Non-reactive wet-cooking vessel at the shared 16/20 lid seat.',
    suggested_use_case: 'Rice for two, chai reduction, small dal.',
    concept_thesis: 'Acid-safe saucepan at the smallest Forge wet-cook diameter.',
    reference_class: 'clad stainless saucepan',
    agent_intents: ['saucepan', 'grains', 'dal', '16 cm pot'],
    interaction_performance_intent: 'Grains, liquids, small acidic sauces.',
    option_name: 'Diameter',
    option_value: '16 cm',
    seo_title: 'Forge Saucepan 16 | Maison Tavo',
    seo_description: '16 cm Forge clad stainless saucepan concept.',
    description_html: vesselHtml({
      lead: 'A 16 cm clad stainless saucepan for grains and small liquid cooks.',
      why: 'Acidic dals punish bare carbon steel; stainless keeps wet cooks non-reactive.',
      role: 'Grains, liquids, small sauces.',
      handles: 'Stick handle (CONCEPT_SPEC).',
      lids: 'Seats the Forge Universal Lid 16/20.',
      coil: 14.5,
    }),
  }),
  carbonSteelVessel({
    sku: 'MT-FOR-SAU-20',
    handle: 'forge-relay-saucepot-20',
    title: 'Forge Saucepan 20',
    product_type: 'Saucepan',
    product_category: CAT_SAUCE,
    list_price_gbp: 145,
    rim_diameter_cm: 20,
    height_cm: 10,
    capacity_ml: 2800,
    handle_configuration: 'stick',
    lid_compatibility: 'MT-FOR-LID-20',
    vessel_shape: 'saucepan',
    adapts: 'MT-FOR-SAU-20',
    heat_sources: ['induction', 'gas', 'electric', 'oven'],
    primary_material: 'Fully-clad 18/10 stainless steel with bronze-isolated stick handle',
    lining_material: 'Non-reactive 18/10 stainless steel interior',
    material_architecture:
      'Fully-clad 18/10 stainless vessel + bronze-isolated handle (Relay collar logic optional on specialty builds).',
    food_contact_strategy: 'Non-reactive 18/10 stainless contacts all liquids and acidic ingredients.',
    quick_summary: '20 cm clad stainless saucepan for dals, stocks and grains.',
    lineup_copy: 'Everyday wet-cook diameter sharing the 16/20 lid with the compact fry and saucier.',
    suggested_use_case: 'Family dal, tomato sauce, grains for four.',
    concept_thesis: 'Primary non-reactive saucepan for Solo/Family wet cooks.',
    reference_class: 'clad stainless saucepan',
    agent_intents: ['saucepan', 'dal pot', 'acidic sauce', '20 cm pot'],
    interaction_performance_intent: 'Dals, acidic sauces, grains.',
    option_name: 'Diameter',
    option_value: '20 cm',
    seo_title: 'Forge Saucepan 20 | Maison Tavo',
    seo_description: '20 cm Forge clad stainless saucepan concept for dals and grains.',
    description_html: vesselHtml({
      lead: 'A 20 cm clad stainless saucepan for dals, stocks, reductions and grains.',
      why: 'Acidic cooks need a non-reactive interior while staying inside the Forge lid ecosystem.',
      role: 'Grains, liquids, dals.',
      handles: 'Stick handle (CONCEPT_SPEC).',
      lids: 'Seats the Forge Universal Lid 16/20.',
      coil: 14.5,
    }),
  }),

  // —— Stockpots ——
  carbonSteelVessel({
    sku: 'MT-FOR-STK-24',
    handle: 'forge-stockpot-24',
    title: 'Forge Stockpot 24',
    product_type: 'Stockpot',
    product_category: CAT_STOCK,
    list_price_gbp: 160,
    rim_diameter_cm: 24,
    height_cm: 14,
    capacity_ml: 6000,
    handle_configuration: 'dual_loops',
    lid_compatibility: 'MT-FOR-LID-24',
    vessel_shape: 'stockpot',
    heat_sources: ['induction', 'gas', 'electric', 'oven'],
    primary_material: 'Fully-clad 18/10 stainless steel with dual bronze-isolated loop handles',
    lining_material: 'Non-reactive 18/10 stainless steel interior',
    material_architecture: 'Deep clad stainless stockpot + dual loop handles.',
    food_contact_strategy: '18/10 stainless contacts stocks, pasta water and curries.',
    quick_summary: '24 cm dual-loop stockpot for stocks, pasta and curry.',
    lineup_copy: 'Family deep pot aligned to the 24 cm lid and Family Standard set.',
    suggested_use_case: 'Chicken stock, pasta boil, large curry.',
    concept_thesis: 'Deep dual-loop pot for family wet cooks and pasta.',
    reference_class: 'stockpot',
    agent_intents: ['stockpot', 'pasta pot', 'curry pot', '24 cm stock'],
    interaction_performance_intent: 'Stocks, pasta, curry.',
    option_name: 'Diameter',
    option_value: '24 cm',
    seo_title: 'Forge Stockpot 24 | Maison Tavo',
    seo_description: '24 cm Forge clad stainless stockpot concept with dual loops.',
    description_html: vesselHtml({
      lead: 'A 24 cm deep clad stainless stockpot with dual loop handles.',
      why: 'Deep wet cooks and pasta water need balanced two-hand lifts.',
      role: 'Stocks, pasta, curry.',
      handles: 'Dual loops (CONCEPT_SPEC).',
      lids: 'Seats the Forge Universal Lid 24.',
      coil: 18,
    }),
  }),
  carbonSteelVessel({
    sku: 'MT-FOR-STK-28',
    handle: 'forge-stockpot-28',
    title: 'Forge Stockpot 28',
    product_type: 'Stockpot',
    product_category: CAT_STOCK,
    list_price_gbp: 175,
    rim_diameter_cm: 28,
    height_cm: 16,
    capacity_ml: 9000,
    handle_configuration: 'dual_loops',
    lid_compatibility: 'MT-FOR-LID-28',
    vessel_shape: 'stockpot',
    heat_sources: ['induction', 'gas', 'electric', 'oven'],
    primary_material: 'Fully-clad 18/10 stainless steel with dual bronze-isolated loop handles',
    lining_material: 'Non-reactive 18/10 stainless steel interior',
    material_architecture: 'Deep clad stainless stockpot + dual loop handles.',
    food_contact_strategy: '18/10 stainless contacts stocks, pasta water and curries.',
    quick_summary: '28 cm entertainer stockpot for large stocks and pasta.',
    lineup_copy: 'Top of the Forge wet-cook ladder for guest batches.',
    suggested_use_case: 'Party pasta water, large bone stock, feast curry.',
    concept_thesis: 'Entertainer deep pot with 28/32 lid seat.',
    reference_class: 'stockpot',
    agent_intents: ['stockpot', 'large pasta pot', '28 cm stock'],
    interaction_performance_intent: 'Large stocks, pasta, curry.',
    option_name: 'Diameter',
    option_value: '28 cm',
    seo_title: 'Forge Stockpot 28 | Maison Tavo',
    seo_description: '28 cm Forge clad stainless stockpot concept.',
    description_html: vesselHtml({
      lead: 'A 28 cm deep clad stainless stockpot with dual loops for entertainer batches.',
      why: 'Guest cooking needs depth and a secure two-hand carry.',
      role: 'Stocks, pasta, curry.',
      handles: 'Dual loops (CONCEPT_SPEC).',
      lids: 'Seats the Forge Universal Lid 28/32.',
      coil: 21,
    }),
  }),

  // —— Kadhai ——
  carbonSteelVessel({
    sku: 'MT-FOR-KAD-24',
    handle: 'forge-relay-kadai-24',
    title: 'Forge Kadhai 24',
    product_type: 'Kadai',
    product_category: CAT_WOK,
    list_price_gbp: 145,
    rim_diameter_cm: 24,
    height_cm: 9,
    capacity_ml: 3500,
    handle_configuration: 'stick_helper',
    lid_compatibility: 'MT-FOR-LID-24',
    vessel_shape: 'kadhai',
    adapts: 'MT-FOR-KAD-24',
    quick_summary: '24 cm flat-base kadhai with stick + helper for tadka and stir-fry.',
    lineup_copy: 'Flat induction foot with deep belly; stick + helper for toss control.',
    suggested_use_case: 'Mustard-seed tadka, bhuna reduction, small-batch fry.',
    concept_thesis: 'Compact flat-base kadhai for induction tadka and stir work.',
    reference_class: 'kadai / flat-base wok',
    agent_intents: ['kadai', 'kadhai', 'tadka', 'stir fry', 'induction wok'],
    interaction_performance_intent: 'Fry, stir, tadka.',
    option_name: 'Diameter',
    option_value: '24 cm',
    seo_title: 'Forge Kadhai 24 | Maison Tavo',
    seo_description: '24 cm Forge flat-base kadhai concept with stick and helper.',
    description_html: vesselHtml({
      lead: 'A 24 cm flat-seated carbon-steel kadhai with stick + helper handles.',
      why: 'Bridges curved tossing geometry with a calibrated flat induction foot.',
      role: 'Fry, stir, tadka.',
      handles: 'Stick + helper (CONCEPT_SPEC).',
      lids: 'Seats the Forge Universal Lid 24.',
      coil: 18,
    }),
  }),
  carbonSteelVessel({
    sku: 'MT-FOR-KAD-28',
    handle: 'forge-kadhai-28',
    title: 'Forge Kadhai 28',
    product_type: 'Kadai',
    product_category: CAT_WOK,
    list_price_gbp: 160,
    rim_diameter_cm: 28,
    height_cm: 10,
    capacity_ml: 5000,
    handle_configuration: 'dual_loops',
    lid_compatibility: 'MT-FOR-LID-28',
    vessel_shape: 'kadhai',
    quick_summary: '28 cm dual-loop kadhai for family fry and stir work.',
    lineup_copy: 'Wider belly with dual loops for oven-to-table curry finishes.',
    suggested_use_case: 'Family tadka curry, larger stir-fry, shallow fry.',
    concept_thesis: 'Family kadhai diameter with dual-loop carry.',
    reference_class: 'kadai / flat-base wok',
    agent_intents: ['kadai', 'kadhai', '28 cm wok', 'tadka'],
    interaction_performance_intent: 'Fry, stir, tadka at family scale.',
    option_name: 'Diameter',
    option_value: '28 cm',
    seo_title: 'Forge Kadhai 28 | Maison Tavo',
    seo_description: '28 cm Forge flat-base kadhai concept with dual loops.',
    description_html: vesselHtml({
      lead: 'A 28 cm flat-base carbon-steel kadhai with dual loop handles.',
      why: 'Larger fry and curry batches need balanced two-hand movement.',
      role: 'Fry, stir, tadka.',
      handles: 'Dual loops (CONCEPT_SPEC).',
      lids: 'Seats the Forge Universal Lid 28/32.',
      coil: 21,
    }),
  }),

  // —— Universal lids ——
  {
    sku: 'MT-FOR-LID-20',
    handle: 'forge-universal-lid-20',
    title: 'Forge Universal Lid 16/20',
    product_type: 'Replacement lid',
    product_category: CAT_LID,
    list_price_gbp: 30,
    rim_diameter_cm: 20,
    handle_configuration: 'lid_bridge',
    lid_compatibility: 'Seats 16 cm and 20 cm Forge vessels',
    vessel_shape: 'lid',
    is_care_or_set: true,
    works_with_kansa: true,
    pairs_with_care_kit: CARE_KIT,
    heat_sources: [],
    induction_compatible: false,
    primary_material: 'Tempered glass with 18/8 stainless step rim and bronze-isolated bridge',
    lining_material: 'Uncoated tempered glass and 18/8 stainless steam interface',
    material_architecture: 'Stepped stainless rim + tempered viewing glass + isolated bridge handle.',
    food_contact_strategy: 'Glass underside and stainless rim contact steam/condensate.',
    fabrication_route: 'Prototype rim gauge against 16/20 vessel set; thermal-shock glass trials.',
    interaction_performance_intent: 'Covered finishing on 16/20 Forge vessels.',
    care_hypothesis: 'Cool before washing; hand wash until dishwasher validation.',
    engineering_risks: ['Glass thermal shock', 'Rim-step mismatch', 'Hot bridge handle'],
    required_prototype_tests: ['Thermal-shock quench', 'Go/no-go rim gauge', 'Handle temperature'],
    agent_intents: ['lid', '16 cm lid', '20 cm lid', 'universal lid'],
    negative_constraints: ['universal fit on non-Maison Tavo pans', 'broiler use before rating'],
    concept_thesis: 'Shared 16/20 lid seat across fry, saucier and saucepan.',
    reference_class: 'replacement lid',
    benchmark_logic: 'Lid ecosystem concept — fit unverified until prototype gauges pass.',
    quick_summary: 'Universal tempered lid seating 16 and 20 cm Forge vessels (~£30 add-on).',
    lineup_copy: 'One lid covers the compact Forge wet- and dry-cook diameters.',
    suggested_use_case: 'Covered simmer on saucepan 16/20 or fry 20.',
    tags: ['Forge Hybrid', 'Replacement Lid', 'Cookware Accessory', 'Concept Spec'],
    option_name: 'Compatibility',
    option_value: '16/20 cm vessels',
    seo_title: 'Forge Universal Lid 16/20 | Maison Tavo',
    seo_description: 'Stepped stainless-and-glass lid concept for 16 and 20 cm Forge vessels.',
    description_html: `<p>A stepped stainless-and-glass service lid sized to seat 16 cm and 20 cm Forge vessels.</p><h3>Why it exists</h3><p>Shared lid ecosystem reduces SKU sprawl: one cover for compact fry, saucier and saucepan.</p>${NOTICE}`,
    media_plan: mediaPlan('Forge Universal Lid 16/20', 'lid'),
  },
  {
    sku: 'MT-FOR-LID-24',
    handle: 'forge-universal-lid-24',
    title: 'Forge Universal Lid 24',
    product_type: 'Replacement lid',
    product_category: CAT_LID,
    list_price_gbp: 35,
    rim_diameter_cm: 24,
    handle_configuration: 'lid_bridge',
    lid_compatibility: 'Seats 24 cm Forge vessels',
    vessel_shape: 'lid',
    is_care_or_set: true,
    works_with_kansa: true,
    pairs_with_care_kit: CARE_KIT,
    heat_sources: [],
    induction_compatible: false,
    primary_material: 'Tempered glass with 18/8 stainless step rim and bronze-isolated bridge',
    lining_material: 'Uncoated tempered glass and 18/8 stainless steam interface',
    material_architecture: 'Stepped stainless rim + tempered viewing glass + isolated bridge handle.',
    food_contact_strategy: 'Glass underside and stainless rim contact steam/condensate.',
    fabrication_route: 'Prototype rim gauge against 24 cm vessel set.',
    interaction_performance_intent: 'Covered finishing on 24 cm Forge vessels.',
    care_hypothesis: 'Cool before washing; hand wash until dishwasher validation.',
    engineering_risks: ['Glass thermal shock', 'Rim-step mismatch'],
    required_prototype_tests: ['Thermal-shock quench', 'Go/no-go rim gauge'],
    agent_intents: ['lid', '24 cm lid', 'universal lid'],
    negative_constraints: ['universal fit on non-Maison Tavo pans'],
    concept_thesis: 'Primary family lid seat for 24 cm Forge vessels.',
    reference_class: 'replacement lid',
    benchmark_logic: 'Lid ecosystem concept — fit unverified until prototype gauges pass.',
    quick_summary: 'Universal tempered lid for 24 cm Forge vessels (~£35 add-on).',
    lineup_copy: 'Covers fry, sauté, stockpot and kadhai at the Family Standard diameter.',
    suggested_use_case: 'Covered braise on sauté 24 or stockpot 24.',
    tags: ['Forge Hybrid', 'Replacement Lid', 'Cookware Accessory', 'Concept Spec'],
    option_name: 'Compatibility',
    option_value: '24 cm vessels',
    seo_title: 'Forge Universal Lid 24 | Maison Tavo',
    seo_description: 'Stepped stainless-and-glass lid concept for 24 cm Forge vessels.',
    description_html: `<p>A stepped stainless-and-glass lid sized for 24 cm Forge vessels.</p>${NOTICE}`,
    media_plan: mediaPlan('Forge Universal Lid 24', 'lid'),
  },
  {
    sku: 'MT-FOR-LID-28',
    handle: 'forge-universal-lid-28',
    title: 'Forge Universal Lid 28/32',
    product_type: 'Replacement lid',
    product_category: CAT_LID,
    list_price_gbp: 40,
    rim_diameter_cm: 28,
    handle_configuration: 'lid_bridge',
    lid_compatibility: 'Seats 28 cm Forge vessels; designed to accept future 32 cm XXL',
    vessel_shape: 'lid',
    is_care_or_set: true,
    works_with_kansa: true,
    pairs_with_care_kit: CARE_KIT,
    heat_sources: [],
    induction_compatible: false,
    primary_material: 'Domed tempered glass with 18/8 stainless step rim',
    lining_material: 'Uncoated tempered glass and 18/8 stainless steam interface',
    material_architecture: 'Domed glass + stepped rim sized for 28 now, 32 later (CONCEPT_SPEC).',
    food_contact_strategy: 'Glass dome and stainless rim contact steam.',
    fabrication_route: 'Prototype 28 rim gauge; reserve step geometry for deferred 32.',
    interaction_performance_intent: 'Covered finishing on 28 cm vessels; future 32 XXL.',
    care_hypothesis: 'Cool before washing; hand wash until validated.',
    engineering_risks: ['Span impact breakage', '32 step tolerance drift'],
    required_prototype_tests: ['Span impact', 'Thermal shock', '28/32 rim gauges'],
    agent_intents: ['lid', '28 cm lid', '32 cm lid', 'universal lid'],
    negative_constraints: ['guaranteed 32 fit before XXL vessels ship'],
    concept_thesis: 'Entertainer lid seat with deferred XXL compatibility reserved.',
    reference_class: 'replacement lid',
    benchmark_logic: '28 confirmed launch seat; 32 is a reserved geometry hypothesis.',
    quick_summary: 'Universal lid for 28 cm vessels; 32 XXL seat reserved (~£40).',
    lineup_copy: 'Entertainer cover for fry, sauté, stockpot and kadhai at 28 cm.',
    suggested_use_case: 'Covered entertainer braise on sauté 28 or stockpot 28.',
    tags: ['Forge Hybrid', 'Replacement Lid', 'Cookware Accessory', 'Concept Spec'],
    option_name: 'Compatibility',
    option_value: '28/32 cm vessels',
    seo_title: 'Forge Universal Lid 28/32 | Maison Tavo',
    seo_description: 'Domed lid concept for 28 cm Forge vessels with reserved 32 cm seat.',
    description_html: `<p>A domed stainless-and-glass lid for 28 cm Forge vessels, with step geometry reserved for a deferred 32 cm XXL seat.</p>${NOTICE}`,
    media_plan: mediaPlan('Forge Universal Lid 28/32', 'lid'),
  },
];

function setPrice(components: string[], includedLids: string[]): number {
  const bySku = new Map(FORGE_MATRIX.map((s) => [s.sku, s]));
  // Specialty / care prices looked up later; for set math use matrix + known care.
  let total = 0;
  for (const sku of components) {
    if (includedLids.includes(sku)) continue; // lids free inside curated sets
    const row = bySku.get(sku);
    if (row) total += row.list_price_gbp;
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
    primary_material: 'Curated Forge Hybrid vessel + lid set (mixed carbon steel / clad stainless)',
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
    components: ['MT-FOR-FRY-20', 'MT-FOR-SPN-16', 'MT-FOR-SCR-20', 'MT-FOR-LID-20'],
    included_lids: ['MT-FOR-LID-20'],
    quick_summary: 'Compact starter: 20 fry, 16 sauce, 20 saucier, shared 16/20 lid.',
    lineup_copy:
      'Size-based Solo/Couple kit covering sear, wet cook and sauce work with one shared lid.',
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
    components: [
      'MT-FOR-FRY-28',
      'MT-FOR-STE-28',
      'MT-FOR-STK-28',
      'MT-FOR-TAV-30',
      'MT-FOR-LID-28',
    ],
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
      'MT-FOR-STE-24',
      'MT-FOR-SAU-20',
      'MT-FOR-SCR-20',
      'MT-FOR-LID-20',
      'MT-FOR-LID-24',
    ],
    included_lids: ['MT-FOR-LID-20', 'MT-FOR-LID-24'],
    quick_summary: 'European kit: fry, sauté, saucepan, saucier + lids.',
    lineup_copy: 'Sauce-forward European weeknight kit emphasising sear, braise and emulsion.',
    suggested_use_case: 'Risotto, pan sauces, braised chicken, sautéed vegetables.',
    agent_intents: ['european cookware set', 'sauce kit', 'forge bundle'],
  }),
  buildSet({
    sku: 'MT-FOR-SET-ASN',
    handle: 'forge-set-asian',
    title: 'Forge Cuisine Kit — Asian',
    components: [
      'MT-FOR-TAV-26',
      'MT-FOR-KAD-24',
      'MT-FOR-SAU-20',
      'MT-FOR-LID-20',
      'MT-FOR-LID-24',
    ],
    included_lids: ['MT-FOR-LID-20', 'MT-FOR-LID-24'],
    quick_summary: 'Asian kit: tawa, kadhai, saucepan + lids.',
    lineup_copy: 'Flatbread, tadka and wet-cook trio for South and East Asian home kitchens.',
    suggested_use_case: 'Roti, dosa, tadka dal, stir-fry.',
    agent_intents: ['asian cookware set', 'tava kadai set', 'forge bundle'],
  }),
  buildSet({
    sku: 'MT-FOR-SET-DAY',
    handle: 'forge-set-everyday',
    title: 'Forge Cuisine Kit — All-in-One Everyday',
    components: [
      'MT-FOR-FRY-24',
      'MT-FOR-SAU-20',
      'MT-FOR-SCR-20',
      'MT-FOR-LID-20',
      'MT-FOR-LID-24',
    ],
    included_lids: ['MT-FOR-LID-20', 'MT-FOR-LID-24'],
    quick_summary: 'Everyday kit: 24 fry, 20 sauce, 20 saucier + lids.',
    lineup_copy: 'Minimal daily rotation covering sear, wet cook and sauce without specialty shapes.',
    suggested_use_case: 'Most weeknight meals without a dedicated stockpot or kadhai.',
    agent_intents: ['everyday set', 'minimal cookware', 'forge bundle'],
  }),
  buildSet({
    sku: 'MT-FOR-SET-FUL',
    handle: 'forge-set-full-house',
    title: 'Forge Set — Full House Master Collection',
    components: [
      'MT-FOR-FRY-20',
      'MT-FOR-FRY-24',
      'MT-FOR-FRY-28',
      'MT-FOR-SCR-20',
      'MT-FOR-SCR-24',
      'MT-FOR-STE-24',
      'MT-FOR-STE-28',
      'MT-FOR-TAV-26',
      'MT-FOR-TAV-30',
      'MT-FOR-SPN-16',
      'MT-FOR-SAU-20',
      'MT-FOR-STK-24',
      'MT-FOR-STK-28',
      'MT-FOR-KAD-24',
      'MT-FOR-KAD-28',
      'MT-FOR-LID-20',
      'MT-FOR-LID-24',
      'MT-FOR-LID-28',
    ],
    included_lids: ['MT-FOR-LID-20', 'MT-FOR-LID-24', 'MT-FOR-LID-28'],
    quick_summary: 'Full Forge launch vessel matrix with universal lids included.',
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
    pairs_with_care_kit: CARE_KIT,
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
    pairs_with_care_kit: CARE_KIT,
    handle_configuration: 'dual_loops',
    lid_compatibility: 'Not lid-ecosystem; open plancha',
    vessel_shape: 'specialty',
  },
  {
    sku: 'MT-FOR-LID-26',
    list_price_gbp: 35,
    quick_summary: 'Specialty Relay 26 cm lid retained for Dual-Mass Skillet / Compact Tawa era fit.',
    works_with_kansa: true,
    pairs_with_care_kit: CARE_KIT,
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
    pairs_with_care_kit: CARE_KIT,
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

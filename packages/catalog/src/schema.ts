import {z} from 'zod';

/**
 * Heat sources a piece is intended for. At concept stage these are design
 * intents from the engineering sheet, not certified ratings.
 */
export const HeatSource = z.enum(['induction', 'gas', 'electric', 'oven', 'open_flame']);
export type HeatSource = z.infer<typeof HeatSource>;

/** Product lineups in the concept catalogue. */
export const Lineup = z.enum(['Terre Clay', 'Forge Hybrid', 'Forge × Terre', 'Kuro Strip']);
export type Lineup = z.infer<typeof Lineup>;

/**
 * Evidence tier guarding every claim a listing carries (decision D5).
 *
 * The per-layer `fabrication_status` from the original draft schema is folded
 * into this single product-level field: while a product is CONCEPT_SPEC, every
 * material, dimension and performance statement on it is an unverified target
 * and must stay out of customer-facing copy as a precise claim. Promotion to
 * PROTOTYPE_VALIDATED and then VERIFIED happens only against the product's
 * `required_prototype_tests`.
 */
export const ClaimStatus = z.enum(['CONCEPT_SPEC', 'PROTOTYPE_VALIDATED', 'VERIFIED']);
export type ClaimStatus = z.infer<typeof ClaimStatus>;

export const DishwasherSuitability = z.enum([
  'hand_wash_only',
  'insert_only_pending_validation',
  'pending_validation',
  'not_applicable',
]);
export type DishwasherSuitability = z.infer<typeof DishwasherSuitability>;

export const MicrowaveSuitability = z.enum([
  'not_microwave_safe',
  'pending_validation',
  'not_applicable',
]);
export type MicrowaveSuitability = z.infer<typeof MicrowaveSuitability>;

/** Provenance register entry ID, e.g. 'R04' (data/maison-tavo-new-listings-sources.csv). */
export const SourceId = z.string().regex(/^R\d{2}$/);
export type SourceId = z.infer<typeof SourceId>;

/** One row of the provenance register. */
export const Source = z.object({
  id: SourceId,
  class: z.string(),
  source: z.string(),
  url: z.string().optional(),
  applied_to: z.string(),
  boundary: z.string(),
});
export type Source = z.infer<typeof Source>;

export const SourceRegister = z.array(Source);
export type SourceRegister = z.infer<typeof SourceRegister>;

/**
 * Primary measurements, parsed from the Shopify variant option
 * (e.g. Capacity '140 ml', Diameter '34 cm', Size '46 × 28 cm').
 */
export const Dimensions = z.object({
  /** Inner rim-to-rim diameter when applicable (cm). */
  diameter_cm: z.number().positive().optional(),
  /** Outer induction foot / base diameter target (cm). */
  base_diameter_cm: z.number().positive().optional(),
  /** Vessel or wall height target (cm). */
  height_cm: z.number().positive().optional(),
  length_cm: z.number().positive().optional(),
  width_cm: z.number().positive().optional(),
  capacity_ml: z.number().positive().optional(),
  /** Induction coil zone target (14.5 / 18 / 21 cm). */
  induction_coil_zone_cm: z.number().positive().optional(),
});
export type Dimensions = z.infer<typeof Dimensions>;

export const MediaMode = z.enum(['Human', 'Engineer', 'Machine']);
export type MediaMode = z.infer<typeof MediaMode>;

export const MediaShot = z.object({
  mode: MediaMode,
  shot: z.string(),
});
export type MediaShot = z.infer<typeof MediaShot>;

export const ProductSpec = z.object({
  handle: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  title: z.string(),
  sku: z.string().regex(/^MT-[A-Z]{3}-[A-Z]{3}-[A-Z0-9]+$/),
  vendor: z.string(),
  /** Shopify standard product taxonomy breadcrumb. */
  product_category: z.string(),
  /** Shopify 'Type' column, e.g. 'Kulhad', 'Skillet', 'Chef's knife'. */
  product_type: z.string(),
  tags: z.array(z.string()),
  lineup: Lineup,
  status: z.enum(['draft', 'active']),

  /** Evidence tier for everything on this listing (D5). */
  claim_status: ClaimStatus,
  reference_class: z.string(),
  concept_thesis: z.string(),
  /** One-liner for cards / quick scan. */
  quick_summary: z.string().optional(),
  /** Deeper lineup copy beyond the thesis. */
  lineup_copy: z.string().optional(),
  /** Suggested use-case / recipe prompt (separate from thesis). */
  suggested_use_case: z.string().optional(),
  /** Repeatable structured material & compatibility specifications for metafields. */
  primary_material: z.string(),
  lining_material: z.string(),
  dimensions_summary: z.string(),
  dishwasher_suitability: DishwasherSuitability,
  microwave_suitability: MicrowaveSuitability,
  food_contact_suitability: z.string(),
  care_instructions: z.string(),
  heat_compatibility: z.string(),
  material_architecture: z.string(),
  food_contact_strategy: z.string(),
  fabrication_route: z.string(),
  interaction_performance_intent: z.string(),
  care_hypothesis: z.string(),
  engineering_risks: z.array(z.string()).min(1),
  required_prototype_tests: z.array(z.string()).min(1),
  /** Intents the Kansa voice/agent layer should answer for this product. */
  agent_intents: z.array(z.string()).min(1),
  /** Claims this product must never make. */
  negative_constraints: z.array(z.string()).min(1),
  benchmark_logic: z.string(),
  /** Provenance register references; every SKU carries at least one. */
  sources: z.array(SourceId).min(1),

  /** HTML description from the Shopify import, including the concept-spec notice. */
  description_html: z.string(),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),

  /**
   * List price in shop currency (GBP for maison-tavo).
   * Field name is historical (`price_usd`); do not treat as a USD claim.
   */
  price_usd: z.number().positive(),
  /** Optional operational unit cost; omitted unless verified. */
  cost_per_item_usd: z.number().positive().optional(),
  /** Genuine reference price only; never fabricated for fake strikethroughs. */
  compare_at_usd: z.number().positive().optional(),
  /** GTIN/barcode; concept listings do not have one yet. */
  barcode: z.string().optional(),
  /** Physical weight in grams; omitted when a concept SKU has not been weighed yet. */
  weight_grams: z.number().positive().optional(),
  /** Raw Shopify variant option, e.g. {name: 'Capacity', value: '140 ml'}. */
  variant_option: z.object({name: z.string(), value: z.string()}),
  dimensions: Dimensions,
  heat_sources: z.array(HeatSource),
  induction_compatible: z.boolean(),

  /** Handle layout vocabulary for Forge (and future lines). */
  handle_configuration: z.string().optional(),
  /** Compatible lid SKU(s) or seating note. */
  lid_compatibility: z.string().optional(),
  /** Whether Kansa should treat this SKU as voice-addressable. */
  works_with_kansa: z.boolean().optional(),
  /** Maintenance kit SKU this piece pairs with. */
  pairs_with_care_kit: z.string().optional(),
  /** Component SKUs when this listing is a curated set/bundle. */
  bundle_components: z.array(z.string()).optional(),
  /** Vessel shape key for Forge matrix filtering. */
  vessel_shape: z.string().optional(),
  size_family: z.string().optional(),
  included_lids: z.array(z.string()).optional(),
  search_keywords: z.array(z.string()).optional(),
  /** 5–6 shot media plan across Human / Engineer / Machine modes. */
  media_plan: z.array(MediaShot).optional(),
});
export type ProductSpec = z.infer<typeof ProductSpec>;

export const Catalog = z.array(ProductSpec);
export type Catalog = z.infer<typeof Catalog>;

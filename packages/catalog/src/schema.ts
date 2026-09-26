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
  diameter_cm: z.number().positive().optional(),
  length_cm: z.number().positive().optional(),
  width_cm: z.number().positive().optional(),
  capacity_ml: z.number().positive().optional(),
});
export type Dimensions = z.infer<typeof Dimensions>;

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

  /** Dollars as listed in the Shopify import. */
  price_usd: z.number().positive(),
  compare_at_usd: z.number().positive().optional(),
  /** GTIN/barcode; concept listings do not have one yet. */
  barcode: z.string().optional(),
  weight_grams: z.number().positive(),
  /** Raw Shopify variant option, e.g. {name: 'Capacity', value: '140 ml'}. */
  variant_option: z.object({name: z.string(), value: z.string()}),
  dimensions: Dimensions,
  heat_sources: z.array(HeatSource),
  induction_compatible: z.boolean(),
});
export type ProductSpec = z.infer<typeof ProductSpec>;

export const Catalog = z.array(ProductSpec);
export type Catalog = z.infer<typeof Catalog>;

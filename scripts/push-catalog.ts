/**
 * Push & audit the Maison Tavo concept catalog against Shopify Admin.
 *
 * Architecture & operational guarantees:
 *   1. Standardized Shopify Product Taxonomy (`category` GID) describes what each
 *      object fundamentally is; `productType` holds Maison Tavo operational vocabulary
 *      (e.g. "Kulhad", "Skillet"); Collections group products into brand ranges
 *      (`terre-clay`, `forge-hybrid`, `forge-terre`, `kuro-strip`) and shopping
 *      journeys (`cookware`, `tableware-pottery`, `care-sets`).
 *   2. Repeatable specifications & engineering claims (material, lining, capacity,
 *      dimensions, care instructions, dishwasher/microwave/food-contact suitability,
 *      heat compatibility, risks, prototype tests) live in structured `specs.*`
 *      metafields rather than stuffed into titles or buried only in prose.
 *   3. Retains returned Shopify `product_id`, `variant_id`, `inventory_item_id`,
 *      `category_id`, and `collection_id` alongside stable `sku` + `handle` in
 *      `data/shopify-id-map.json`.
 *   4. Never invents compare-at prices, physical weights, or live stock quantities.
 *   5. Runs a 5-stage readiness diagnostic distinguishing:
 *        - MISSING_FROM_ADMIN
 *        - MISSING_FROM_COLLECTION
 *        - MISSING_PRODUCT_MEDIA (verifies actual Shopify READY media records)
 *        - MISSING_FROM_CHANNEL (distinguishes DRAFT / ACTIVE_UNPUBLISHED / PUBLISHED)
 *        - UNAVAILABLE_TO_BUY (checks variant `availableForSale`, `tracked`,
 *          `inventoryPolicy`, `inventoryQuantity`, stocked locations, shipping & weight)
 *
 * Usage (from repo root):
 *   bun scripts/push-catalog.ts                    # dry-run seed sync + live 5-stage diagnostic
 *   bun scripts/push-catalog.ts --offline          # pure offline dry-run against retained ID map
 *   bun scripts/push-catalog.ts --apply            # create/refresh drafts, metafields, taxonomy & collections
 *   bun scripts/push-catalog.ts --apply --publish  # activate + publish to Online Store
 */

import {spawnSync} from 'node:child_process';
import {homedir, tmpdir} from 'node:os';
import {join} from 'node:path';
import {readFileSync, existsSync, writeFileSync, unlinkSync} from 'node:fs';
import {
  ShopifyIdMap,
  seedCatalog,
  type Lineup,
  type ProductSpec,
  type ShopifyIdMap as ShopifyIdMapType,
} from '../packages/catalog/src/index.ts';

const STORE =
  flagValue('--store') ??
  process.env.SHOPIFY_FLAG_STORE ??
  'maison-tavo.myshopify.com';
const APPLY = process.argv.includes('--apply');
const PUBLISH = process.argv.includes('--publish');
const OFFLINE = process.argv.includes('--offline');
const API_VERSION = '2026-04';
const ONLINE_STORE_APP_HANDLE = 'online_store';
const ID_MAP_PATH = join(import.meta.dir, '..', 'data', 'shopify-id-map.json');

/** Brand-range collections keyed by seed lineup. */
const LINEUP_COLLECTIONS: Array<{
  lineup: Lineup;
  handle: string;
  title: string;
  descriptionHtml: string;
}> = [
  {
    lineup: 'Terre Clay',
    handle: 'terre-clay',
    title: 'Terre Clay',
    descriptionHtml:
      '<p>Earthenware and ceramic hospitality concepts — kulhads, laser-marked tabletop, clay-forward service.</p>',
  },
  {
    lineup: 'Forge Hybrid',
    handle: 'forge-hybrid',
    title: 'Forge Hybrid',
    descriptionHtml:
      '<p>Mixed-metal cookware concepts — modular searing, plancha, and thermal-mass systems.</p>',
  },
  {
    lineup: 'Forge × Terre',
    handle: 'forge-terre',
    title: 'Forge × Terre',
    descriptionHtml:
      '<p>Hybrid metal–clay pieces that separate cooking performance from table presentation.</p>',
  },
  {
    lineup: 'Kuro Strip',
    handle: 'kuro-strip',
    title: 'Kuro Strip',
    descriptionHtml:
      '<p>Continuous-strip knife concepts — thin blades, exposed structure, hospitality prep.</p>',
  },
];

type Category = 'Cookware' | 'Tableware & Pottery' | 'Care & Sets';

const CARE_SKUS = new Set([
  'MT-FOR-OIL-250',
  'MT-FOR-KIT-C01',
  'MT-FOR-LID-26',
  'MT-FOR-LID-30',
  'MT-TER-STM-24',
]);
const TABLEWARE_SKUS = new Set([
  'MT-TER-KUL-140',
  'MT-TER-KUL-C180',
  'MT-TER-PLT-34',
  'MT-TER-BWL-220',
  'MT-TER-PLT-28',
  'MT-TER-BWL-S03',
  'MT-TER-BWL-26',
]);

function categoryFor(spec: ProductSpec): Category {
  if (CARE_SKUS.has(spec.sku)) return 'Care & Sets';
  if (TABLEWARE_SKUS.has(spec.sku)) return 'Tableware & Pottery';
  return 'Cookware';
}

const CATEGORY_COLLECTIONS: Array<{
  category: Category;
  handle: string;
  title: string;
  descriptionHtml: string;
}> = [
  {
    category: 'Cookware',
    handle: 'cookware',
    title: 'Cookware',
    descriptionHtml: '<p>Pans, vessels, knives and service tools organized by culinary task.</p>',
  },
  {
    category: 'Tableware & Pottery',
    handle: 'tableware-pottery',
    title: 'Tableware & Pottery',
    descriptionHtml: '<p>Clay-forward drinkware, dinnerware and shared-service pottery.</p>',
  },
  {
    category: 'Care & Sets',
    handle: 'care-sets',
    title: 'Care & Sets',
    descriptionHtml: '<p>Care rituals, replacement parts, steamers and composed sets.</p>',
  },
];

const ALL_COLLECTIONS = [
  ...LINEUP_COLLECTIONS.map((collection) => ({
    ...collection,
    products: () => seedCatalog.filter((product) => product.lineup === collection.lineup),
  })),
  ...CATEGORY_COLLECTIONS.map((collection) => ({
    ...collection,
    products: () => seedCatalog.filter((product) => categoryFor(product) === collection.category),
  })),
];

type GraphqlResult = {
  data?: Record<string, unknown>;
  errors?: Array<{message: string}>;
};

type MetafieldDefSpec = {
  key: string;
  name: string;
  type: string;
  description: string;
};

/** Repeatable structured PRODUCT metafields under namespace `specs`. */
export const SPECS_DEFINITIONS: MetafieldDefSpec[] = [
  {
    key: 'lineup',
    name: 'Lineup',
    type: 'single_line_text_field',
    description: 'Brand range (Terre Clay, Forge Hybrid, Forge × Terre, Kuro Strip).',
  },
  {
    key: 'claim_status',
    name: 'Claim status',
    type: 'single_line_text_field',
    description: 'Evidence tier: CONCEPT_SPEC | PROTOTYPE_VALIDATED | VERIFIED.',
  },
  {
    key: 'primary_material',
    name: 'Primary material',
    type: 'single_line_text_field',
    description: 'Primary structural material of the object.',
  },
  {
    key: 'lining_material',
    name: 'Lining / food-contact material',
    type: 'single_line_text_field',
    description: 'Interior lining or food-contact surface material.',
  },
  {
    key: 'capacity_ml',
    name: 'Capacity (ml)',
    type: 'number_integer',
    description: 'Nominal vessel or bottle volume in millilitres where applicable.',
  },
  {
    key: 'dimensions_summary',
    name: 'Dimensions',
    type: 'single_line_text_field',
    description: 'Repeatable primary dimension or format specification.',
  },
  {
    key: 'dishwasher_suitability',
    name: 'Dishwasher suitability',
    type: 'single_line_text_field',
    description: 'Dishwasher claim tier: hand_wash_only | insert_only_pending_validation | pending_validation | not_applicable.',
  },
  {
    key: 'microwave_suitability',
    name: 'Microwave suitability',
    type: 'single_line_text_field',
    description: 'Microwave claim tier: not_microwave_safe | pending_validation | not_applicable.',
  },
  {
    key: 'food_contact_suitability',
    name: 'Food-contact suitability',
    type: 'multi_line_text_field',
    description: 'Food-contact boundary and migration validation status.',
  },
  {
    key: 'care_instructions',
    name: 'Care instructions',
    type: 'multi_line_text_field',
    description: 'Structured cleaning, drying and conditioning instructions.',
  },
  {
    key: 'heat_compatibility',
    name: 'Heat compatibility',
    type: 'single_line_text_field',
    description: 'Summary of intended heat compatibility and validation status.',
  },
  {
    key: 'induction_compatible',
    name: 'Induction compatible (target)',
    type: 'boolean',
    description: 'Whether the concept design targets induction coupling.',
  },
  {
    key: 'heat_sources',
    name: 'Heat sources',
    type: 'list.single_line_text_field',
    description: 'Intended heat sources (induction, gas, electric, oven, open_flame).',
  },
  {
    key: 'engineering_risks',
    name: 'Engineering risks',
    type: 'list.single_line_text_field',
    description: 'Known failure modes tracked for prototype testing.',
  },
  {
    key: 'required_prototype_tests',
    name: 'Required prototype tests',
    type: 'list.single_line_text_field',
    description: 'Validation gates required before promoting claim_status.',
  },
  {
    key: 'material_architecture',
    name: 'Material architecture',
    type: 'multi_line_text_field',
    description: 'Material stack and construction intent.',
  },
  {
    key: 'food_contact_strategy',
    name: 'Food-contact strategy',
    type: 'multi_line_text_field',
    description: 'Which surfaces contact food and how junctions are handled.',
  },
  {
    key: 'fabrication_route',
    name: 'Fabrication route',
    type: 'multi_line_text_field',
    description: 'Proposed fabrication path (unverified at concept stage).',
  },
  {
    key: 'care_hypothesis',
    name: 'Care hypothesis',
    type: 'multi_line_text_field',
    description: 'Care / wash hypothesis pending prototype validation.',
  },
  {
    key: 'agent_intents',
    name: 'Agent intents',
    type: 'list.single_line_text_field',
    description: 'Intents the voice/agent layer should answer for this product.',
  },
  {
    key: 'negative_constraints',
    name: 'Negative constraints',
    type: 'list.single_line_text_field',
    description: 'Claims this product must never make.',
  },
  {
    key: 'concept_thesis',
    name: 'Concept thesis',
    type: 'multi_line_text_field',
    description: 'One-line design thesis for the concept listing.',
  },
];

function flagValue(name: string): string | undefined {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return undefined;
  return process.argv[idx + 1];
}

function loadIdMap(): ShopifyIdMapType {
  if (!existsSync(ID_MAP_PATH)) {
    return {
      store: STORE,
      updated_at: new Date().toISOString(),
      products_by_sku: {},
      collections_by_handle: {},
    };
  }
  return ShopifyIdMap.parse(JSON.parse(readFileSync(ID_MAP_PATH, 'utf8')));
}

function saveIdMap(map: ShopifyIdMapType): void {
  map.updated_at = new Date().toISOString();
  writeFileSync(ID_MAP_PATH, `${JSON.stringify(ShopifyIdMap.parse(map), null, 2)}\n`, 'utf8');
}

function shopifyEnv(): NodeJS.ProcessEnv {
  return {
    ...process.env,
    SHOPIFY_CLI_AGENT_INFO:
      process.env.SHOPIFY_CLI_AGENT_INFO ?? 'n:cursor|v:none|p:google|m:gemini-4-carbon',
    SHOPIFY_CLI_AGENT_IDS:
      process.env.SHOPIFY_CLI_AGENT_IDS ?? 'r:push-catalog',
  };
}

/** Load the Shopify CLI identity access token used by theme Admin GraphQL. */
function loadCliIdentityToken(): string | undefined {
  const confPath = join(
    homedir(),
    'AppData',
    'Roaming',
    'shopify-cli-kit-nodejs',
    'Config',
    'config.json',
  );
  if (!existsSync(confPath)) return undefined;
  try {
    const conf = JSON.parse(readFileSync(confPath, 'utf8')) as {
      sessionStore?: string;
      currentSessionId?: string;
    };
    if (!conf.sessionStore) return undefined;
    const root = JSON.parse(conf.sessionStore) as Record<
      string,
      Record<
        string,
        {
          identity?: {accessToken?: string; expiresAt?: string};
        }
      >
    >;
    const accounts = root['accounts.shopify.com'];
    if (!accounts) return undefined;
    const sessionId = conf.currentSessionId ?? Object.keys(accounts)[0];
    const token = accounts[sessionId]?.identity?.accessToken;
    if (!token) return undefined;
    const expiresAt = accounts[sessionId]?.identity?.expiresAt;
    if (expiresAt && Date.parse(expiresAt) <= Date.now() + 60_000) {
      console.warn(
        `CLI identity token expires at ${expiresAt}; run a theme command to refresh if auth fails.`,
      );
    }
    return token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  } catch {
    return undefined;
  }
}

function normalizeAdminToken(raw: string): string {
  const token = raw.trim();
  if (token.startsWith('Bearer ') || token.startsWith('shpat_') || token.startsWith('shpca_')) {
    return token;
  }
  if (token.startsWith('atkn_')) return `Bearer ${token}`;
  return token;
}

function resolveAdminToken(): string | undefined {
  const fromEnv = process.env.SHOPIFY_ADMIN_API_TOKEN?.trim();
  if (fromEnv) return normalizeAdminToken(fromEnv);
  return loadCliIdentityToken();
}

let cachedToken: string | undefined | null = null;

function adminToken(): string | undefined {
  if (cachedToken === null) {
    cachedToken = resolveAdminToken();
  }
  return cachedToken ?? undefined;
}

async function executeGraphqlDirect(
  query: string,
  variables?: Record<string, unknown>,
): Promise<GraphqlResult> {
  const token = adminToken();
  if (!token) {
    throw new Error('No Admin API token available');
  }
  const res = await fetch(
    `https://${STORE}/admin/api/${API_VERSION}/graphql.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': token,
        Authorization: token,
      },
      body: JSON.stringify({query, variables}),
    },
  );
  const json = (await res.json()) as GraphqlResult & {error?: string};
  if (!res.ok) {
    throw new Error(
      `Admin GraphQL HTTP ${res.status}: ${JSON.stringify(json)}`,
    );
  }
  if (json.error) {
    throw new Error(`Admin GraphQL error: ${json.error}`);
  }
  return json;
}

let cachedStoreExecuteDomain: string | undefined;

async function storeExecuteDomain(): Promise<string> {
  if (cachedStoreExecuteDomain) return cachedStoreExecuteDomain;
  if (adminToken()) {
    try {
      const result = await executeGraphqlDirect(
        `query ShopDomain { shop { myshopifyDomain } }`,
      );
      const domain = (
        result.data?.shop as {myshopifyDomain?: string} | undefined
      )?.myshopifyDomain;
      if (domain) {
        cachedStoreExecuteDomain = domain;
        return domain;
      }
    } catch {
      // fall through to STORE
    }
  }
  cachedStoreExecuteDomain = STORE;
  return cachedStoreExecuteDomain;
}

async function executeGraphqlCli(
  query: string,
  variables?: Record<string, unknown>,
  {mutate = false}: {mutate?: boolean} = {},
): Promise<GraphqlResult> {
  const storeDomain = await storeExecuteDomain();
  const stamp = `${process.pid}-${Date.now()}`;
  const queryFile = join(tmpdir(), `maison-push-catalog-${stamp}.graphql`);
  const variableFile = variables
    ? join(tmpdir(), `maison-push-catalog-${stamp}.vars.json`)
    : undefined;
  writeFileSync(queryFile, query, 'utf8');
  if (variableFile && variables) {
    writeFileSync(variableFile, JSON.stringify(variables), 'utf8');
  }
  const args = [
    'store',
    'execute',
    '--store',
    storeDomain,
    '--version',
    API_VERSION,
    '--json',
    '--query-file',
    queryFile,
  ];
  if (variableFile) {
    args.push('--variable-file', variableFile);
  }
  if (mutate) {
    args.push('--allow-mutations');
  }

  try {
    const result = spawnSync('shopify', args, {
      encoding: 'utf8',
      env: shopifyEnv(),
      maxBuffer: 16 * 1024 * 1024,
      shell: process.platform === 'win32',
    });

    if (result.status !== 0) {
      const err = (result.stderr || result.stdout || '').trim();
      throw new Error(`shopify store execute failed (exit ${result.status}): ${err}`);
    }

    const stdout = (result.stdout || '').trim();
    const jsonStart = stdout.indexOf('{');
    if (jsonStart === -1) {
      throw new Error(`No JSON in shopify store execute output:\n${stdout}`);
    }
    const parsed = JSON.parse(stdout.slice(jsonStart)) as GraphqlResult &
      Record<string, unknown>;
    if ('data' in parsed || 'errors' in parsed) {
      return parsed as GraphqlResult;
    }
    return {data: parsed};
  } finally {
    for (const file of [queryFile, variableFile]) {
      if (!file) continue;
      try {
        unlinkSync(file);
      } catch {
        // ignore cleanup failures
      }
    }
  }
}

async function executeGraphql(
  query: string,
  variables?: Record<string, unknown>,
  opts: {mutate?: boolean; forceCli?: boolean} = {},
): Promise<GraphqlResult> {
  if (!opts.forceCli && adminToken()) {
    return executeGraphqlDirect(query, variables);
  }
  return executeGraphqlCli(query, variables, opts);
}

function assertNoErrors(label: string, result: GraphqlResult): void {
  if (result.errors?.length) {
    throw new Error(
      `${label} GraphQL errors:\n${result.errors.map((e) => e.message).join('\n')}`,
    );
  }
}

function listValue(values: string[]): string {
  return JSON.stringify(values);
}

export function productMetafields(spec: ProductSpec): Array<{
  namespace: string;
  key: string;
  type: string;
  value: string;
}> {
  const fields: Array<{namespace: string; key: string; type: string; value: string}> = [
    {namespace: 'specs', key: 'lineup', type: 'single_line_text_field', value: spec.lineup},
    {namespace: 'specs', key: 'claim_status', type: 'single_line_text_field', value: spec.claim_status},
    {namespace: 'specs', key: 'primary_material', type: 'single_line_text_field', value: spec.primary_material},
    {namespace: 'specs', key: 'lining_material', type: 'single_line_text_field', value: spec.lining_material},
    {namespace: 'specs', key: 'dimensions_summary', type: 'single_line_text_field', value: spec.dimensions_summary},
    {namespace: 'specs', key: 'dishwasher_suitability', type: 'single_line_text_field', value: spec.dishwasher_suitability},
    {namespace: 'specs', key: 'microwave_suitability', type: 'single_line_text_field', value: spec.microwave_suitability},
    {namespace: 'specs', key: 'food_contact_suitability', type: 'multi_line_text_field', value: spec.food_contact_suitability},
    {namespace: 'specs', key: 'care_instructions', type: 'multi_line_text_field', value: spec.care_instructions},
    {namespace: 'specs', key: 'heat_compatibility', type: 'single_line_text_field', value: spec.heat_compatibility},
    {namespace: 'specs', key: 'induction_compatible', type: 'boolean', value: spec.induction_compatible ? 'true' : 'false'},
    {namespace: 'specs', key: 'heat_sources', type: 'list.single_line_text_field', value: listValue(spec.heat_sources)},
    {namespace: 'specs', key: 'engineering_risks', type: 'list.single_line_text_field', value: listValue(spec.engineering_risks)},
    {namespace: 'specs', key: 'required_prototype_tests', type: 'list.single_line_text_field', value: listValue(spec.required_prototype_tests)},
    {namespace: 'specs', key: 'material_architecture', type: 'multi_line_text_field', value: spec.material_architecture},
    {namespace: 'specs', key: 'food_contact_strategy', type: 'multi_line_text_field', value: spec.food_contact_strategy},
    {namespace: 'specs', key: 'fabrication_route', type: 'multi_line_text_field', value: spec.fabrication_route},
    {namespace: 'specs', key: 'care_hypothesis', type: 'multi_line_text_field', value: spec.care_hypothesis},
    {namespace: 'specs', key: 'agent_intents', type: 'list.single_line_text_field', value: listValue(spec.agent_intents)},
    {namespace: 'specs', key: 'negative_constraints', type: 'list.single_line_text_field', value: listValue(spec.negative_constraints)},
    {namespace: 'specs', key: 'concept_thesis', type: 'multi_line_text_field', value: spec.concept_thesis},
  ];
  if (spec.dimensions.capacity_ml !== undefined) {
    fields.push({
      namespace: 'specs',
      key: 'capacity_ml',
      type: 'number_integer',
      value: String(Math.round(spec.dimensions.capacity_ml)),
    });
  }
  return fields;
}

/** Resolve Shopify Standard Product Taxonomy category GIDs by breadcrumb fullName. */
async function resolveTaxonomyCategories(
  breadcrumbs: string[],
): Promise<Map<string, string>> {
  const unique = [...new Set(breadcrumbs.filter(Boolean))];
  const resolved = new Map<string, string>();
  const query = `query ResolveTaxonomy($search: String!) {
    taxonomy {
      categories(first: 10, search: $search) {
        nodes {
          id
          name
          fullName
        }
      }
    }
  }`;

  for (const breadcrumb of unique) {
    const leaf = breadcrumb.split('>').pop()!.trim();
    const result = await executeGraphql(query, {search: leaf});
    assertNoErrors(`taxonomy ${leaf}`, result);
    const nodes =
      (
        result.data?.taxonomy as
          | {categories: {nodes: Array<{id: string; name: string; fullName: string}>}}
          | undefined
      )?.categories.nodes ?? [];
    const exact =
      nodes.find((n) => n.fullName.toLowerCase() === breadcrumb.toLowerCase()) ??
      nodes.find((n) => n.name.toLowerCase() === leaf.toLowerCase());
    if (exact) {
      resolved.set(breadcrumb, exact.id);
    } else {
      console.warn(`  warn: no exact Shopify taxonomy match for "${breadcrumb}" (searched "${leaf}")`);
    }
  }
  return resolved;
}

async function existingDefinitionKeys(): Promise<Set<string>> {
  const query = `query SpecsDefs($namespace: String!) {
    metafieldDefinitions(first: 50, ownerType: PRODUCT, namespace: $namespace) {
      nodes { key namespace }
    }
  }`;
  const result = await executeGraphql(query, {namespace: 'specs'});
  assertNoErrors('metafieldDefinitions', result);
  const nodes =
    (
      result.data?.metafieldDefinitions as
        | {nodes: Array<{key: string}>}
        | undefined
    )?.nodes ?? [];
  return new Set(nodes.map((n) => n.key));
}

type ExistingProduct = {
  id: string;
  handle: string;
  status: string;
  categoryId?: string | null;
  variantId?: string;
  inventoryItemId?: string;
  sku?: string;
};

async function existingProductsIndex(): Promise<{
  byHandle: Map<string, ExistingProduct>;
  bySku: Map<string, ExistingProduct>;
}> {
  const query = `query CatalogProducts($query: String!) {
    products(first: 50, query: $query) {
      nodes {
        id
        handle
        status
        category { id fullName }
        variants(first: 1) {
          nodes {
            id
            sku
            inventoryItem { id }
          }
        }
      }
    }
  }`;
  const result = await executeGraphql(query, {query: 'vendor:"Maison Tavo"'});
  assertNoErrors('products', result);
  const nodes =
    (
      result.data?.products as
        | {
            nodes: Array<{
              id: string;
              handle: string;
              status: string;
              category?: {id: string; fullName: string} | null;
              variants: {
                nodes: Array<{
                  id: string;
                  sku?: string | null;
                  inventoryItem?: {id: string} | null;
                }>;
              };
            }>;
          }
        | undefined
    )?.nodes ?? [];

  const byHandle = new Map<string, ExistingProduct>();
  const bySku = new Map<string, ExistingProduct>();
  for (const n of nodes) {
    const v = n.variants.nodes[0];
    const item: ExistingProduct = {
      id: n.id,
      handle: n.handle,
      status: n.status,
      categoryId: n.category?.id ?? null,
      variantId: v?.id,
      inventoryItemId: v?.inventoryItem?.id,
      sku: v?.sku ?? undefined,
    };
    byHandle.set(n.handle, item);
    if (item.sku) bySku.set(item.sku, item);
  }
  return {byHandle, bySku};
}

async function existingCollectionsByHandle(): Promise<Map<string, string>> {
  const query = `query AllCollections($query: String!) {
    collections(first: 25, query: $query) {
      nodes { id handle title }
    }
  }`;
  const handles = ALL_COLLECTIONS.map((c) => c.handle);
  const result = await executeGraphql(query, {
    query: handles.map((h) => `handle:${h}`).join(' OR '),
  });
  assertNoErrors('collections', result);
  const nodes =
    (
      result.data?.collections as
        | {nodes: Array<{id: string; handle: string}>}
        | undefined
    )?.nodes ?? [];
  return new Map(nodes.map((n) => [n.handle, n.id]));
}

async function createDefinition(
  def: MetafieldDefSpec,
): Promise<'created' | 'skipped'> {
  if (!APPLY) {
    console.log(`  [dry-run] would create specs.${def.key} (${def.type})`);
    return 'created';
  }

  const mutation = `mutation CreateDef($definition: MetafieldDefinitionInput!) {
    metafieldDefinitionCreate(definition: $definition) {
      createdDefinition { id namespace key }
      userErrors { field message code }
    }
  }`;

  const result = await executeGraphql(
    mutation,
    {
      definition: {
        name: def.name,
        namespace: 'specs',
        key: def.key,
        type: def.type,
        description: def.description,
        ownerType: 'PRODUCT',
        pin: false,
      },
    },
    {mutate: true},
  );
  assertNoErrors(`metafieldDefinitionCreate ${def.key}`, result);

  const payload = result.data?.metafieldDefinitionCreate as {
    createdDefinition?: {id: string};
    userErrors: Array<{message: string; code?: string}>;
  };

  if (payload.userErrors?.length) {
    const taken = payload.userErrors.some(
      (e) =>
        /taken|already|exists|duplicate|in use/i.test(e.message) ||
        e.code === 'TAKEN' ||
        e.code === 'UNSTRUCTURED_ALREADY_EXISTS',
    );
    if (taken) {
      console.log(`  skip specs.${def.key} (already exists)`);
      return 'skipped';
    }
    throw new Error(
      `metafieldDefinitionCreate specs.${def.key}: ${payload.userErrors
        .map((e) => e.message)
        .join('; ')}`,
    );
  }

  console.log(`  created specs.${def.key} → ${payload.createdDefinition?.id}`);
  return 'created';
}

async function setVariantFields(
  productId: string,
  variantId: string,
  spec: ProductSpec,
): Promise<{variantId: string; inventoryItemId?: string}> {
  const variantMutation = `mutation SetVariant($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
    productVariantsBulkUpdate(productId: $productId, variants: $variants) {
      productVariants {
        id
        sku
        price
        inventoryItem { id }
      }
      userErrors { field message }
    }
  }`;

  const inventoryItem: Record<string, unknown> = {
    sku: spec.sku,
    tracked: true,
    requiresShipping: true,
  };
  if (spec.cost_per_item_usd !== undefined) {
    inventoryItem.cost = spec.cost_per_item_usd.toFixed(2);
  }
  if (spec.weight_grams !== undefined) {
    inventoryItem.measurement = {
      weight: {
        value: spec.weight_grams,
        unit: 'GRAMS',
      },
    };
  }

  const variantInput: Record<string, unknown> = {
    id: variantId,
    price: spec.price_usd.toFixed(2),
    compareAtPrice: spec.compare_at_usd !== undefined ? spec.compare_at_usd.toFixed(2) : null,
    inventoryPolicy: 'DENY',
    inventoryItem,
  };
  if (spec.barcode) {
    variantInput.barcode = spec.barcode;
  }

  const variantResult = await executeGraphql(
    variantMutation,
    {
      productId,
      variants: [variantInput],
    },
    {mutate: true},
  );
  assertNoErrors(`productVariantsBulkUpdate ${spec.handle}`, variantResult);

  const variantPayload = variantResult.data?.productVariantsBulkUpdate as {
    productVariants?: Array<{id: string; inventoryItem?: {id: string} | null}>;
    userErrors: Array<{message: string}>;
  };
  if (variantPayload.userErrors?.length) {
    throw new Error(
      `productVariantsBulkUpdate ${spec.handle}: ${variantPayload.userErrors
        .map((e) => e.message)
        .join('; ')}`,
    );
  }
  const updatedVar = variantPayload.productVariants?.[0];
  return {
    variantId: updatedVar?.id ?? variantId,
    inventoryItemId: updatedVar?.inventoryItem?.id ?? undefined,
  };
}

async function updateProduct(
  existing: ExistingProduct,
  spec: ProductSpec,
  categoryId?: string,
): Promise<{
  id: string;
  variantId?: string;
  inventoryItemId?: string;
  categoryId?: string | null;
  action: 'updated';
}> {
  const nextStatus = PUBLISH
    ? 'ACTIVE'
    : existing.status === 'ACTIVE'
      ? 'ACTIVE'
      : 'DRAFT';
  if (!APPLY) {
    const weightNote = spec.weight_grams !== undefined ? `${spec.weight_grams}g` : 'unweighed';
    console.log(
      `  [dry-run] would update ${spec.handle} (${spec.sku}) ${nextStatus} $${spec.price_usd} [${weightNote}]`,
    );
    return {
      id: existing.id,
      variantId: existing.variantId,
      inventoryItemId: existing.inventoryItemId,
      categoryId: categoryId ?? existing.categoryId ?? null,
      action: 'updated',
    };
  }

  const mutation = `mutation UpdateProduct($product: ProductUpdateInput!) {
    productUpdate(product: $product) {
      product {
        id
        handle
        status
        category { id }
      }
      userErrors { field message }
    }
  }`;

  const productInput: Record<string, unknown> = {
    id: existing.id,
    title: spec.title,
    descriptionHtml: spec.description_html,
    vendor: spec.vendor,
    productType: spec.product_type,
    tags: spec.tags,
    status: nextStatus,
    seo: {
      title: spec.seo_title ?? spec.title,
      description: spec.seo_description ?? '',
    },
    metafields: productMetafields(spec),
  };
  if (categoryId) {
    productInput.category = categoryId;
  }

  const updateResult = await executeGraphql(
    mutation,
    {product: productInput},
    {mutate: true},
  );
  assertNoErrors(`productUpdate ${spec.handle}`, updateResult);

  const updated = updateResult.data?.productUpdate as {
    product?: {id: string; handle: string; status: string; category?: {id: string} | null};
    userErrors: Array<{message: string; field?: string[]}>;
  };

  if (updated.userErrors?.length) {
    throw new Error(
      `productUpdate ${spec.handle}: ${updated.userErrors.map((e) => e.message).join('; ')}`,
    );
  }
  if (!updated.product) {
    throw new Error(`productUpdate ${spec.handle}: no product returned`);
  }

  const variantId = existing.variantId;
  if (!variantId) {
    throw new Error(`productUpdate ${spec.handle}: missing default variant`);
  }
  const varInfo = await setVariantFields(existing.id, variantId, spec);

  console.log(
    `  updated ${spec.handle} → ${updated.product.id} / ${varInfo.variantId} (${updated.product.status})`,
  );
  return {
    id: updated.product.id,
    variantId: varInfo.variantId,
    inventoryItemId: varInfo.inventoryItemId,
    categoryId: updated.product.category?.id ?? categoryId ?? null,
    action: 'updated',
  };
}

async function createProduct(
  spec: ProductSpec,
  categoryId?: string,
): Promise<{
  id: string;
  variantId?: string;
  inventoryItemId?: string;
  categoryId?: string | null;
  action: 'created';
}> {
  const createStatus = PUBLISH ? 'ACTIVE' : 'DRAFT';
  if (!APPLY) {
    const weightNote = spec.weight_grams !== undefined ? `${spec.weight_grams}g` : 'unweighed';
    console.log(
      `  [dry-run] would create ${spec.handle} (${spec.sku}) ${createStatus} $${spec.price_usd} [${weightNote}]`,
    );
    return {id: `dry-run://${spec.handle}`, categoryId: categoryId ?? null, action: 'created'};
  }

  const mutation = `mutation CreateProduct($product: ProductCreateInput!, $media: [CreateMediaInput!]) {
    productCreate(product: $product, media: $media) {
      product {
        id
        handle
        status
        category { id }
        variants(first: 1) {
          nodes { id }
        }
      }
      userErrors { field message }
    }
  }`;

  const productInput: Record<string, unknown> = {
    title: spec.title,
    handle: spec.handle,
    descriptionHtml: spec.description_html,
    vendor: spec.vendor,
    productType: spec.product_type,
    tags: spec.tags,
    status: createStatus,
    seo: {
      title: spec.seo_title ?? spec.title,
      description: spec.seo_description ?? '',
    },
    productOptions: [
      {
        name: spec.variant_option.name,
        values: [{name: spec.variant_option.value}],
      },
    ],
    metafields: productMetafields(spec),
  };
  if (categoryId) {
    productInput.category = categoryId;
  }

  const createResult = await executeGraphql(
    mutation,
    {product: productInput, media: []},
    {mutate: true},
  );
  assertNoErrors(`productCreate ${spec.handle}`, createResult);

  const created = createResult.data?.productCreate as {
    product?: {
      id: string;
      handle: string;
      status: string;
      category?: {id: string} | null;
      variants: {nodes: Array<{id: string}>};
    };
    userErrors: Array<{message: string; field?: string[]}>;
  };

  if (created.userErrors?.length) {
    throw new Error(
      `productCreate ${spec.handle}: ${created.userErrors.map((e) => e.message).join('; ')}`,
    );
  }
  if (!created.product) {
    throw new Error(`productCreate ${spec.handle}: no product returned`);
  }

  const variantId = created.product.variants.nodes[0]?.id;
  if (!variantId) {
    throw new Error(`productCreate ${spec.handle}: missing default variant`);
  }

  const varInfo = await setVariantFields(created.product.id, variantId, spec);

  console.log(
    `  created ${spec.handle} → ${created.product.id} / ${varInfo.variantId} (${created.product.status})`,
  );
  return {
    id: created.product.id,
    variantId: varInfo.variantId,
    inventoryItemId: varInfo.inventoryItemId,
    categoryId: created.product.category?.id ?? categoryId ?? null,
    action: 'created',
  };
}

async function ensureCollections(
  productIdsByHandle: Map<string, string>,
  idMap: ShopifyIdMapType,
): Promise<void> {
  console.log('\nLineup and category collections:');
  const existing = await existingCollectionsByHandle();
  let created = 0;
  let updated = 0;

  for (const col of ALL_COLLECTIONS) {
    const existingId = existing.get(col.handle);
    if (existingId) {
      idMap.collections_by_handle[col.handle] = {
        handle: col.handle,
        title: col.title,
        collection_id: existingId,
      };
    }

    const productIds = col
      .products()
      .map((p) => productIdsByHandle.get(p.handle))
      .filter((id): id is string => Boolean(id) && !id.startsWith('dry-run://'));

    if (!APPLY) {
      const verb = existing.has(col.handle) ? 'update' : 'create';
      console.log(
        `  [dry-run] would ${verb} ${col.handle} (${col.products().length} products)`,
      );
      continue;
    }

    let collectionId = existing.get(col.handle);
    if (!collectionId) {
      const mutation = `mutation CreateCollection($input: CollectionInput!) {
        collectionCreate(input: $input) {
          collection { id handle }
          userErrors { field message }
        }
      }`;
      const result = await executeGraphql(
        mutation,
        {
          input: {
            title: col.title,
            handle: col.handle,
            descriptionHtml: col.descriptionHtml,
            products: productIds,
          },
        },
        {mutate: true},
      );
      assertNoErrors(`collectionCreate ${col.handle}`, result);
      const payload = result.data?.collectionCreate as {
        collection?: {id: string; handle: string};
        userErrors: Array<{message: string}>;
      };
      if (payload.userErrors?.length) {
        throw new Error(
          `collectionCreate ${col.handle}: ${payload.userErrors.map((e) => e.message).join('; ')}`,
        );
      }
      if (!payload.collection) {
        throw new Error(`collectionCreate ${col.handle}: no collection returned`);
      }
      collectionId = payload.collection.id;
      idMap.collections_by_handle[col.handle] = {
        handle: col.handle,
        title: col.title,
        collection_id: collectionId,
      };
      created += 1;
      console.log(`  created ${col.handle} → ${collectionId}`);
    } else {
      const mutation = `mutation UpdateCollection($input: CollectionInput!) {
        collectionUpdate(input: $input) {
          collection { id handle }
          userErrors { field message }
        }
      }`;
      const result = await executeGraphql(
        mutation,
        {
          input: {
            id: collectionId,
            title: col.title,
            descriptionHtml: col.descriptionHtml,
          },
        },
        {mutate: true},
      );
      assertNoErrors(`collectionUpdate ${col.handle}`, result);
      const payload = result.data?.collectionUpdate as {
        userErrors: Array<{message: string}>;
      };
      if (payload.userErrors?.length) {
        throw new Error(
          `collectionUpdate ${col.handle}: ${payload.userErrors.map((e) => e.message).join('; ')}`,
        );
      }

      if (productIds.length) {
        const addMutation = `mutation AddProducts($id: ID!, $productIds: [ID!]!) {
          collectionAddProducts(id: $id, productIds: $productIds) {
            userErrors { field message }
          }
        }`;
        const addResult = await executeGraphql(
          addMutation,
          {id: collectionId, productIds},
          {mutate: true},
        );
        assertNoErrors(`collectionAddProducts ${col.handle}`, addResult);
        const addPayload = addResult.data?.collectionAddProducts as {
          userErrors: Array<{message: string}>;
        };
        if (addPayload.userErrors?.length) {
          const fatal = addPayload.userErrors.filter(
            (e) => !/already|exist/i.test(e.message),
          );
          if (fatal.length) {
            throw new Error(
              `collectionAddProducts ${col.handle}: ${fatal.map((e) => e.message).join('; ')}`,
            );
          }
        }
      }

      updated += 1;
      console.log(`  updated ${col.handle} → ${collectionId} (+${productIds.length} products)`);
    }
  }

  if (APPLY) {
    console.log(`Collections: created=${created} updated=${updated}`);
  }
}

async function resolveOnlineStorePublicationId(): Promise<string> {
  const query = `query OnlineStorePublication {
    publications(first: 25) {
      nodes {
        id
        name
        app { handle }
      }
    }
  }`;
  try {
    const result = await executeGraphql(query);
    assertNoErrors('publications', result);
    const nodes =
      (
        result.data?.publications as
          | {
              nodes: Array<{
                id: string;
                name?: string;
                app?: {handle?: string} | null;
              }>;
            }
          | undefined
      )?.nodes ?? [];
    const online = nodes.find(
      (n) =>
        n.app?.handle === ONLINE_STORE_APP_HANDLE ||
        n.name === 'Online Store',
    );
    if (online) return online.id;
    throw new Error(
      `Online Store publication not found. Got: ${nodes
        .map((n) => `${n.name ?? '?'} (${n.app?.handle ?? 'no-app'})`)
        .join(', ')}`,
    );
  } catch (err) {
    const fallback =
      process.env.SHOPIFY_ONLINE_STORE_PUBLICATION_ID ??
      'gid://shopify/Publication/369593221489';
    console.warn(
      `  warn: could not list publications (${err instanceof Error ? err.message.split('\n')[0] : err}); using ${fallback}`,
    );
    return fallback;
  }
}

async function publishToOnlineStore(
  resourceId: string,
  publicationId: string,
  label: string,
): Promise<void> {
  const mutation = `mutation PublishOnlineStore($id: ID!, $input: [PublicationInput!]!) {
    publishablePublish(id: $id, input: $input) {
      publishable {
        ... on Product { id handle }
        ... on Collection { id handle }
      }
      userErrors { field message }
    }
  }`;
  let result: GraphqlResult;
  try {
    result = await executeGraphql(mutation, {id: resourceId, input: [{publicationId}]}, {mutate: true});
    if (result.errors?.length) {
      result = await executeGraphql(mutation, {id: resourceId, input: [{publicationId}]}, {mutate: true, forceCli: true});
    }
  } catch {
    result = await executeGraphql(mutation, {id: resourceId, input: [{publicationId}]}, {mutate: true, forceCli: true});
  }
  assertNoErrors(`publishablePublish ${label}`, result);
  const payload = result.data?.publishablePublish as {
    userErrors: Array<{message: string}>;
  };
  if (payload.userErrors?.length) {
    throw new Error(
      `publishablePublish ${label}: ${payload.userErrors.map((e) => e.message).join('; ')}`,
    );
  }
}

async function activateProduct(productId: string, handle: string): Promise<void> {
  const mutation = `mutation ActivateProduct($product: ProductUpdateInput!) {
    productUpdate(product: $product) {
      product { id handle status }
      userErrors { field message }
    }
  }`;
  const result = await executeGraphql(
    mutation,
    {product: {id: productId, status: 'ACTIVE'}},
    {mutate: true},
  );
  assertNoErrors(`activate ${handle}`, result);
  const payload = result.data?.productUpdate as {
    product?: {status: string};
    userErrors: Array<{message: string}>;
  };
  if (payload.userErrors?.length) {
    throw new Error(
      `activate ${handle}: ${payload.userErrors.map((e) => e.message).join('; ')}`,
    );
  }
  if (payload.product?.status !== 'ACTIVE') {
    throw new Error(`activate ${handle}: expected ACTIVE, got ${payload.product?.status}`);
  }
}

async function publishSeedCatalog(
  productIdsByHandle: Map<string, string>,
  publicationId: string,
): Promise<void> {
  console.log('\nPublish to Online Store:');
  console.log(`  publication: ${publicationId}`);

  if (!APPLY) {
    for (const spec of seedCatalog) {
      const id = productIdsByHandle.get(spec.handle);
      console.log(
        `  [dry-run] would ACTIVE + publish product ${spec.handle} (${id ?? 'missing'})`,
      );
    }
    for (const col of ALL_COLLECTIONS) {
      console.log(`  [dry-run] would publish collection ${col.handle}`);
    }
    return;
  }

  let publishedProducts = 0;
  for (const spec of seedCatalog) {
    const id = productIdsByHandle.get(spec.handle);
    if (!id || id.startsWith('dry-run://')) {
      throw new Error(`Cannot publish missing product ${spec.handle}`);
    }
    await activateProduct(id, spec.handle);
    await publishToOnlineStore(id, publicationId, `product:${spec.handle}`);
    publishedProducts += 1;
    console.log(`  published product ${spec.handle}`);
  }

  const collections = await existingCollectionsByHandle();
  let publishedCollections = 0;
  for (const col of ALL_COLLECTIONS) {
    const id = collections.get(col.handle);
    if (!id) {
      throw new Error(`Cannot publish missing collection ${col.handle}`);
    }
    await publishToOnlineStore(id, publicationId, `collection:${col.handle}`);
    publishedCollections += 1;
    console.log(`  published collection ${col.handle}`);
  }

  console.log(
    `Publish: products=${publishedProducts} collections=${publishedCollections}`,
  );
}

function adminUrl(productGid: string): string {
  const numeric = productGid.split('/').pop();
  return `https://admin.shopify.com/store/maison-tavo/products/${numeric}`;
}

/**
 * 5-Stage Storefront & Purchasability Readiness Diagnostic.
 * Separates Admin existence, Collection membership, Shopify Media attachment,
 * Sales-channel publication, and Variant inventory/fulfillment purchasability.
 */
async function diagnoseCatalog(idMap: ShopifyIdMapType, publicationId?: string): Promise<void> {
  const channelId =
    publicationId ??
    process.env.SHOPIFY_ONLINE_STORE_PUBLICATION_ID ??
    'gid://shopify/Publication/369593221489';
  const query = `query DiagnoseCatalog($query: String!, $publicationId: ID!) {
    products(first: 50, query: $query) {
      nodes {
        id
        handle
        status
        vendor
        productType
        onlineStoreUrl
        publishedOnPublication(publicationId: $publicationId)
        category { id fullName }
        collections(first: 10) {
          nodes { handle }
        }
        media(first: 5) {
          nodes {
            id
            status
            mediaContentType
          }
        }
        variants(first: 5) {
          nodes {
            id
            sku
            price
            availableForSale
            inventoryPolicy
            inventoryQuantity
            inventoryItem {
              id
              tracked
              requiresShipping
              measurement {
                weight { value unit }
              }
            }
          }
        }
        lineup: metafield(namespace: "specs", key: "lineup") { value }
        claim_status: metafield(namespace: "specs", key: "claim_status") { value }
        primary_material: metafield(namespace: "specs", key: "primary_material") { value }
      }
    }
  }`;

  let result: GraphqlResult;
  try {
    result = await executeGraphql(query, {
      query: 'vendor:"Maison Tavo"',
      publicationId: channelId,
    });
    if (result.errors?.length) {
      result = await executeGraphql(
        query,
        {query: 'vendor:"Maison Tavo"', publicationId: channelId},
        {forceCli: true},
      );
    }
  } catch {
    result = await executeGraphql(
      query,
      {query: 'vendor:"Maison Tavo"', publicationId: channelId},
      {forceCli: true},
    );
  }
  assertNoErrors('diagnoseCatalog', result);

  type DiagNode = {
    id: string;
    handle: string;
    status: string;
    vendor: string;
    productType: string;
    onlineStoreUrl?: string | null;
    category?: {id: string; fullName: string} | null;
    publishedOnPublication?: boolean;
    collections: {nodes: Array<{handle: string}>};
    media: {nodes: Array<{id: string; status: string; mediaContentType: string}>};
    variants: {
      nodes: Array<{
        id: string;
        sku?: string | null;
        price: string;
        availableForSale: boolean;
        inventoryPolicy: string;
        inventoryQuantity?: number | null;
        inventoryItem?: {
          id: string;
          tracked: boolean;
          requiresShipping: boolean;
          measurement?: {weight?: {value: number; unit: string} | null} | null;
          inventoryLevels?: {nodes: Array<{location: {id: string; name: string}}>};
        } | null;
      }>;
    };
    lineup?: {value: string} | null;
    claim_status?: {value: string} | null;
    primary_material?: {value: string} | null;
  };

  const nodes = ((result.data?.products as {nodes: DiagNode[]} | undefined)?.nodes) ?? [];
  const byHandle = new Map(nodes.map((n) => [n.handle, n]));

  console.log('\n5-Stage Storefront & Purchasability Readiness Diagnostic:');
  let adminOk = 0;
  let collectionOk = 0;
  let mediaReady = 0;
  let channelLive = 0;
  let purchasableNow = 0;

  for (const spec of seedCatalog) {
    const node = byHandle.get(spec.handle);
    if (!node) {
      console.log(`  [1:MISSING_FROM_ADMIN] ${spec.sku} (${spec.handle})`);
      continue;
    }

    const variant = node.variants.nodes[0];
    if (variant) {
      idMap.products_by_sku[spec.sku] = {
        sku: spec.sku,
        handle: spec.handle,
        product_id: node.id,
        variant_id: variant.id,
        inventory_item_id: variant.inventoryItem?.id ?? null,
        category_id: node.category?.id ?? null,
      };
    }

    const skuMatch = variant?.sku === spec.sku;
    const priceMatch = Number(variant?.price ?? 0) === spec.price_usd;
    if (skuMatch && priceMatch) adminOk += 1;

    const expectedLineupHandle = LINEUP_COLLECTIONS.find((c) => c.lineup === spec.lineup)!.handle;
    const expectedCatHandle = CATEGORY_COLLECTIONS.find((c) => c.category === categoryFor(spec))!.handle;
    const memberHandles = new Set(node.collections.nodes.map((c) => c.handle));
    const inBothCollections =
      memberHandles.has(expectedLineupHandle) && memberHandles.has(expectedCatHandle);
    if (inBothCollections) collectionOk += 1;

    const readyImages = node.media.nodes.filter(
      (m) => m.mediaContentType === 'IMAGE' && m.status === 'READY',
    );
    const hasMedia = readyImages.length > 0;
    if (hasMedia) mediaReady += 1;

    const isPublished =
      node.status === 'ACTIVE' &&
      (node.publishedOnPublication === true || Boolean(node.onlineStoreUrl));
    if (isPublished) channelLive += 1;

    const invQty = variant?.inventoryQuantity ?? 0;
    const tracked = variant?.inventoryItem?.tracked ?? false;
    const weightVal = variant?.inventoryItem?.measurement?.weight?.value ?? 0;
    const canBuy = Boolean(variant?.availableForSale);
    if (canBuy) purchasableNow += 1;

    const stageFlags = [
      skuMatch && priceMatch ? 'ADMIN:OK' : 'ADMIN:MISMATCH',
      node.category ? 'TAXONOMY:SET' : 'TAXONOMY:UNSET',
      inBothCollections ? 'COLLECTIONS:OK' : 'COLLECTIONS:INCOMPLETE',
      hasMedia ? `MEDIA:${readyImages.length}_READY` : 'MEDIA:MISSING',
      isPublished
        ? 'CHANNEL:PUBLISHED'
        : node.status === 'ACTIVE'
          ? 'CHANNEL:ACTIVE_UNPUBLISHED'
          : 'CHANNEL:DRAFT',
      canBuy
        ? 'BUY:AVAILABLE'
        : `BUY:UNAVAILABLE(tracked=${tracked},qty=${invQty},policy=${variant?.inventoryPolicy ?? '?'})`,
      weightVal > 0 ? `WEIGHT:${weightVal}g` : 'WEIGHT:UNWEIGHED_CONCEPT',
    ];

    console.log(`  ${spec.sku} (${spec.handle}) → ${stageFlags.join(' | ')}`);
    console.log(`    ${adminUrl(node.id)}`);
  }

  console.log(
    `\nReadiness summary (of ${seedCatalog.length} SKUs): admin_ok=${adminOk}, collections_ok=${collectionOk}, media_ready=${mediaReady}, channel_published=${channelLive}, purchasable_now=${purchasableNow}`,
  );
}

async function main(): Promise<void> {
  const idMap = loadIdMap();
  const authMode = OFFLINE
    ? 'offline (no network calls)'
    : adminToken()
      ? 'CLI identity / Admin token'
      : 'shopify store execute';
  console.log(`Store: ${STORE}`);
  console.log(`Auth:  ${authMode}`);
  console.log(
    `Mode:  ${OFFLINE ? 'OFFLINE DRY-RUN' : APPLY ? 'APPLY (mutations enabled)' : 'DRY-RUN (no mutations)'}${PUBLISH ? ' + PUBLISH' : ''}`,
  );
  console.log(`SKUs:  ${seedCatalog.length}`);

  if (OFFLINE) {
    console.log(`\nLoaded retained ID map (${Object.keys(idMap.products_by_sku).length} products, ${Object.keys(idMap.collections_by_handle).length} collections).`);
    for (const spec of seedCatalog) {
      const retained = idMap.products_by_sku[spec.sku];
      const fields = productMetafields(spec);
      console.log(
        `  [offline] ${spec.sku} (${spec.handle}) → ${retained?.product_id ?? 'unmapped'} | category="${spec.product_category}" | type="${spec.product_type}" | metafields=${fields.length}`,
      );
    }
    return;
  }

  console.log('\nStandardized Shopify Product Taxonomy lookup:');
  const taxonomyByBreadcrumb = await resolveTaxonomyCategories(
    seedCatalog.map((s) => s.product_category),
  );
  console.log(`Taxonomy categories resolved: ${taxonomyByBreadcrumb.size}`);

  console.log('\nMetafield definitions (namespace specs):');
  const existing = await existingDefinitionKeys();
  let createdDefs = 0;
  let skippedDefs = 0;
  for (const def of SPECS_DEFINITIONS) {
    if (existing.has(def.key)) {
      console.log(`  skip specs.${def.key} (already exists)`);
      skippedDefs += 1;
      continue;
    }
    const action = await createDefinition(def);
    if (action === 'created') createdDefs += 1;
    else skippedDefs += 1;
  }
  console.log(`Defs: created=${createdDefs} skipped=${skippedDefs}`);

  console.log('\nProducts:');
  const {byHandle, bySku} = await existingProductsIndex();
  const productIds: Array<{handle: string; id: string; action: string}> = [];
  let createdProducts = 0;
  let updatedProducts = 0;

  for (const spec of seedCatalog) {
    const categoryId = taxonomyByBreadcrumb.get(spec.product_category);
    const existingProduct = bySku.get(spec.sku) ?? byHandle.get(spec.handle);
    if (existingProduct) {
      const updated = await updateProduct(existingProduct, spec, categoryId);
      productIds.push({handle: spec.handle, id: updated.id, action: updated.action});
      idMap.products_by_sku[spec.sku] = {
        sku: spec.sku,
        handle: spec.handle,
        product_id: updated.id,
        variant_id: updated.variantId ?? null,
        inventory_item_id: updated.inventoryItemId ?? null,
        category_id: updated.categoryId ?? null,
      };
      updatedProducts += 1;
      continue;
    }
    const created = await createProduct(spec, categoryId);
    productIds.push({handle: spec.handle, id: created.id, action: created.action});
    if (!created.id.startsWith('dry-run://')) {
      idMap.products_by_sku[spec.sku] = {
        sku: spec.sku,
        handle: spec.handle,
        product_id: created.id,
        variant_id: created.variantId ?? null,
        inventory_item_id: created.inventoryItemId ?? null,
        category_id: created.categoryId ?? null,
      };
    }
    if (created.action === 'created') createdProducts += 1;
  }
  console.log(`Products: created=${createdProducts} updated=${updatedProducts}`);

  const idMapByHandle = new Map(productIds.map((row) => [row.handle, row.id]));
  await ensureCollections(idMapByHandle, idMap);

  let publicationId: string | undefined;
  if (PUBLISH) {
    publicationId = await resolveOnlineStorePublicationId();
    await publishSeedCatalog(idMapByHandle, publicationId);
  }

  await diagnoseCatalog(idMap, publicationId);
  saveIdMap(idMap);
  console.log(`\nRetained Shopify ID ledger updated at data/shopify-id-map.json`);
}

if (import.meta.main) {
  await main();
}

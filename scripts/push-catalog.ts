/**
 * Push the Maison Tavo concept catalog to Shopify Admin.
 *
 * Creates PRODUCT metafield definitions in namespace `specs` and draft,
 * unpublished products from `@maison-tavo/catalog` seed data. Idempotent:
 * skips definitions / handles that already exist. Never publishes, never
 * deletes, never updates unrelated products.
 *
 * Usage (from repo root):
 *   bun scripts/push-catalog.ts              # dry-run (default)
 *   bun scripts/push-catalog.ts --apply      # mutate the store
 *   bun scripts/push-catalog.ts --apply --store maison-tavo.myshopify.com
 *
 * Auth (first match wins):
 *   1. SHOPIFY_ADMIN_API_TOKEN env (raw Admin token, optional Bearer prefix)
 *   2. Shopify CLI identity session (same token theme commands use)
 *   3. shopify store execute (requires prior `shopify store auth`)
 *
 * Prerequisites for CLI identity auth:
 *   shopify auth login
 *   (theme list against the store refreshes the session if needed)
 *
 * Env:
 *   SHOPIFY_FLAG_STORE          default store domain
 *   SHOPIFY_ADMIN_API_TOKEN     optional Admin API token override
 *   SHOPIFY_FLAG_STORE_PASSWORD storefront password (optional; never commit)
 */

import {spawnSync} from 'node:child_process';
import {homedir} from 'node:os';
import {join} from 'node:path';
import {readFileSync, existsSync} from 'node:fs';
import {seedCatalog, type ProductSpec} from '../packages/catalog/src/index.ts';

const STORE =
  flagValue('--store') ??
  process.env.SHOPIFY_FLAG_STORE ??
  'maison-tavo.myshopify.com';
const APPLY = process.argv.includes('--apply');
const API_VERSION = '2025-10';

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

/** Catalog-facing PRODUCT metafields under namespace `specs`. */
export const SPECS_DEFINITIONS: MetafieldDefSpec[] = [
  {
    key: 'lineup',
    name: 'Lineup',
    type: 'single_line_text_field',
    description: 'Product lineup (Terre Clay, Forge Hybrid, Forge × Terre, Kuro Strip).',
  },
  {
    key: 'claim_status',
    name: 'Claim status',
    type: 'single_line_text_field',
    description: 'Evidence tier: CONCEPT_SPEC | PROTOTYPE_VALIDATED | VERIFIED.',
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
    key: 'heat_sources',
    name: 'Heat sources',
    type: 'list.single_line_text_field',
    description: 'Intended heat sources (induction, gas, electric, oven, open_flame).',
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

function shopifyEnv(): NodeJS.ProcessEnv {
  return {
    ...process.env,
    SHOPIFY_CLI_AGENT_INFO:
      process.env.SHOPIFY_CLI_AGENT_INFO ?? 'n:cursor|v:none|p:none|m:composer',
    SHOPIFY_CLI_AGENT_IDS:
      process.env.SHOPIFY_CLI_AGENT_IDS ?? 's:none|r:push-catalog|i:none',
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
  // CLI identity tokens (atkn_…) must be sent as Bearer for Admin GraphQL.
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

function executeGraphqlCli(
  query: string,
  variables?: Record<string, unknown>,
  {mutate = false}: {mutate?: boolean} = {},
): GraphqlResult {
  const args = [
    'store',
    'execute',
    '--store',
    STORE,
    '--version',
    API_VERSION,
    '--json',
    '--query',
    query,
  ];
  if (variables) {
    args.push('--variables', JSON.stringify(variables));
  }
  if (mutate) {
    args.push('--allow-mutations');
  }

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
  return JSON.parse(stdout.slice(jsonStart)) as GraphqlResult;
}

async function executeGraphql(
  query: string,
  variables?: Record<string, unknown>,
  opts: {mutate?: boolean} = {},
): Promise<GraphqlResult> {
  if (adminToken()) {
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

function productMetafields(spec: ProductSpec): Array<{
  namespace: string;
  key: string;
  type: string;
  value: string;
}> {
  return [
    {namespace: 'specs', key: 'lineup', type: 'single_line_text_field', value: spec.lineup},
    {
      namespace: 'specs',
      key: 'claim_status',
      type: 'single_line_text_field',
      value: spec.claim_status,
    },
    {
      namespace: 'specs',
      key: 'material_architecture',
      type: 'multi_line_text_field',
      value: spec.material_architecture,
    },
    {
      namespace: 'specs',
      key: 'food_contact_strategy',
      type: 'multi_line_text_field',
      value: spec.food_contact_strategy,
    },
    {
      namespace: 'specs',
      key: 'fabrication_route',
      type: 'multi_line_text_field',
      value: spec.fabrication_route,
    },
    {
      namespace: 'specs',
      key: 'care_hypothesis',
      type: 'multi_line_text_field',
      value: spec.care_hypothesis,
    },
    {
      namespace: 'specs',
      key: 'heat_sources',
      type: 'list.single_line_text_field',
      value: listValue(spec.heat_sources),
    },
    {
      namespace: 'specs',
      key: 'agent_intents',
      type: 'list.single_line_text_field',
      value: listValue(spec.agent_intents),
    },
    {
      namespace: 'specs',
      key: 'negative_constraints',
      type: 'list.single_line_text_field',
      value: listValue(spec.negative_constraints),
    },
    {
      namespace: 'specs',
      key: 'concept_thesis',
      type: 'multi_line_text_field',
      value: spec.concept_thesis,
    },
  ];
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

async function existingProductsByHandle(): Promise<
  Map<string, {id: string; status: string}>
> {
  const query = `query CatalogProducts($query: String!) {
    products(first: 50, query: $query) {
      nodes { id handle status }
    }
  }`;
  const result = await executeGraphql(query, {query: 'vendor:"Maison Tavo"'});
  assertNoErrors('products', result);
  const nodes =
    (
      result.data?.products as
        | {nodes: Array<{id: string; handle: string; status: string}>}
        | undefined
    )?.nodes ?? [];
  return new Map(nodes.map((n) => [n.handle, {id: n.id, status: n.status}]));
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

async function createProduct(
  spec: ProductSpec,
): Promise<{id: string; action: 'created' | 'skipped'}> {
  if (!APPLY) {
    console.log(
      `  [dry-run] would create ${spec.handle} (${spec.sku}) DRAFT $${spec.price_usd}`,
    );
    return {id: `dry-run://${spec.handle}`, action: 'created'};
  }

  const mutation = `mutation CreateProduct($product: ProductCreateInput!, $media: [CreateMediaInput!]) {
    productCreate(product: $product, media: $media) {
      product {
        id
        handle
        status
        variants(first: 1) {
          nodes { id }
        }
      }
      userErrors { field message }
    }
  }`;

  const productInput = {
    title: spec.title,
    handle: spec.handle,
    descriptionHtml: spec.description_html,
    vendor: spec.vendor,
    productType: spec.product_type,
    tags: spec.tags,
    status: 'DRAFT',
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

  const variantMutation = `mutation SetVariant($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
    productVariantsBulkUpdate(productId: $productId, variants: $variants) {
      productVariants { id sku price }
      userErrors { field message }
    }
  }`;

  const variantResult = await executeGraphql(
    variantMutation,
    {
      productId: created.product.id,
      variants: [
        {
          id: variantId,
          price: spec.price_usd.toFixed(2),
          inventoryItem: {
            sku: spec.sku,
            requiresShipping: true,
            measurement: {
              weight: {
                value: spec.weight_grams,
                unit: 'GRAMS',
              },
            },
          },
        },
      ],
    },
    {mutate: true},
  );
  assertNoErrors(`productVariantsBulkUpdate ${spec.handle}`, variantResult);

  const variantPayload = variantResult.data?.productVariantsBulkUpdate as {
    userErrors: Array<{message: string}>;
  };
  if (variantPayload.userErrors?.length) {
    throw new Error(
      `productVariantsBulkUpdate ${spec.handle}: ${variantPayload.userErrors
        .map((e) => e.message)
        .join('; ')}`,
    );
  }

  console.log(
    `  created ${spec.handle} → ${created.product.id} (${created.product.status})`,
  );
  return {id: created.product.id, action: 'created'};
}

function adminUrl(productGid: string): string {
  const numeric = productGid.split('/').pop();
  return `https://admin.shopify.com/store/maison-tavo/products/${numeric}`;
}

async function verify(): Promise<void> {
  const handles = seedCatalog.map((p) => p.handle);
  const query = `query Verify($query: String!) {
    products(first: 25, query: $query) {
      nodes {
        id
        handle
        status
        vendor
        tags
        seo { title description }
        options { name values }
        variants(first: 1) {
          nodes { sku price }
        }
        lineup: metafield(namespace: "specs", key: "lineup") { value }
        claim_status: metafield(namespace: "specs", key: "claim_status") { value }
        heat_sources: metafield(namespace: "specs", key: "heat_sources") { value }
        concept_thesis: metafield(namespace: "specs", key: "concept_thesis") { value }
      }
    }
  }`;

  const result = await executeGraphql(query, {
    query: `handle:${handles.join(' OR handle:')}`,
  });
  assertNoErrors('verify', result);

  const nodes =
    (
      result.data?.products as
        | {
            nodes: Array<{
              id: string;
              handle: string;
              status: string;
              vendor: string;
              variants: {nodes: Array<{sku: string; price: string}>};
              lineup?: {value: string} | null;
              claim_status?: {value: string} | null;
            }>;
          }
        | undefined
    )?.nodes ?? [];

  console.log('\nVerification:');
  for (const handle of handles) {
    const node = nodes.find((n) => n.handle === handle);
    if (!node) {
      console.log(`  MISSING ${handle}`);
      continue;
    }
    const variant = node.variants.nodes[0];
    console.log(
      `  ${handle}: ${node.status} vendor=${node.vendor} sku=${variant?.sku} price=${variant?.price} lineup=${node.lineup?.value ?? '∅'} claim=${node.claim_status?.value ?? '∅'}`,
    );
    console.log(`    ${adminUrl(node.id)}`);
  }
}

async function main(): Promise<void> {
  const authMode = adminToken()
    ? 'CLI identity / Admin token'
    : 'shopify store execute';
  console.log(`Store: ${STORE}`);
  console.log(`Auth:  ${authMode}`);
  console.log(`Mode:  ${APPLY ? 'APPLY (mutations enabled)' : 'DRY-RUN (no mutations)'}`);
  console.log(`SKUs:  ${seedCatalog.length}`);

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
  const byHandle = await existingProductsByHandle();
  const productIds: Array<{handle: string; id: string; action: string}> = [];
  let createdProducts = 0;
  let skippedProducts = 0;

  for (const spec of seedCatalog) {
    const existingProduct = byHandle.get(spec.handle);
    if (existingProduct) {
      console.log(`  skip ${spec.handle} (exists ${existingProduct.id})`);
      productIds.push({
        handle: spec.handle,
        id: existingProduct.id,
        action: 'skipped',
      });
      skippedProducts += 1;
      continue;
    }
    const {id, action} = await createProduct(spec);
    productIds.push({handle: spec.handle, id, action});
    if (action === 'created') createdProducts += 1;
    else skippedProducts += 1;
  }
  console.log(`Products: created=${createdProducts} skipped=${skippedProducts}`);

  if (APPLY || byHandle.size > 0) {
    await verify();
  } else {
    console.log('\nVerification skipped in dry-run with no existing products.');
  }

  console.log('\nSummary IDs:');
  for (const row of productIds) {
    console.log(`  ${row.handle}\t${row.id}\t${row.action}`);
  }
}

await main();

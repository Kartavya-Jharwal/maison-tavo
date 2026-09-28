/**
 * Push the Maison Tavo concept catalog to Shopify Admin.
 *
 * Creates PRODUCT metafield definitions in namespace `specs` and draft,
 * unpublished products from `@maison-tavo/catalog` seed data. Idempotent:
 * skips definitions that already exist; creates missing products; on
 * `--apply`, refreshes existing drafts (title, description, tags, SEO,
 * metafields, variant SKU/price/weight) from seed. Optionally syncs
 * unpublished lineup collections and assigns products. Never publishes,
 * never deletes, never updates unrelated products.
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
import {seedCatalog, type Lineup, type ProductSpec} from '../packages/catalog/src/index.ts';

const STORE =
  flagValue('--store') ??
  process.env.SHOPIFY_FLAG_STORE ??
  'maison-tavo.myshopify.com';
const APPLY = process.argv.includes('--apply');
const API_VERSION = '2025-10';

/** Unpublished custom collections keyed by seed lineup. */
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

type ExistingProduct = {
  id: string;
  status: string;
  variantId?: string;
};

async function existingProductsByHandle(): Promise<Map<string, ExistingProduct>> {
  const query = `query CatalogProducts($query: String!) {
    products(first: 50, query: $query) {
      nodes {
        id
        handle
        status
        variants(first: 1) { nodes { id } }
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
              variants: {nodes: Array<{id: string}>};
            }>;
          }
        | undefined
    )?.nodes ?? [];
  return new Map(
    nodes.map((n) => [
      n.handle,
      {
        id: n.id,
        status: n.status,
        variantId: n.variants.nodes[0]?.id,
      },
    ]),
  );
}

async function existingCollectionsByHandle(): Promise<Map<string, string>> {
  const query = `query LineupCollections($query: String!) {
    collections(first: 25, query: $query) {
      nodes { id handle }
    }
  }`;
  const handles = LINEUP_COLLECTIONS.map((c) => c.handle);
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
): Promise<void> {
  const variantMutation = `mutation SetVariant($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
    productVariantsBulkUpdate(productId: $productId, variants: $variants) {
      productVariants { id sku price }
      userErrors { field message }
    }
  }`;

  const variantResult = await executeGraphql(
    variantMutation,
    {
      productId,
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
}

async function updateProduct(
  existing: ExistingProduct,
  spec: ProductSpec,
): Promise<{id: string; action: 'updated'}> {
  if (!APPLY) {
    console.log(
      `  [dry-run] would update ${spec.handle} (${spec.sku}) DRAFT $${spec.price_usd}`,
    );
    return {id: existing.id, action: 'updated'};
  }

  const mutation = `mutation UpdateProduct($product: ProductUpdateInput!) {
    productUpdate(product: $product) {
      product { id handle status }
      userErrors { field message }
    }
  }`;

  const updateResult = await executeGraphql(
    mutation,
    {
      product: {
        id: existing.id,
        title: spec.title,
        descriptionHtml: spec.description_html,
        vendor: spec.vendor,
        productType: spec.product_type,
        tags: spec.tags,
        status: 'DRAFT',
        seo: {
          title: spec.seo_title ?? spec.title,
          description: spec.seo_description ?? '',
        },
        metafields: productMetafields(spec),
      },
    },
    {mutate: true},
  );
  assertNoErrors(`productUpdate ${spec.handle}`, updateResult);

  const updated = updateResult.data?.productUpdate as {
    product?: {id: string; handle: string; status: string};
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
  await setVariantFields(existing.id, variantId, spec);

  console.log(
    `  updated ${spec.handle} → ${updated.product.id} (${updated.product.status})`,
  );
  return {id: updated.product.id, action: 'updated'};
}

async function createProduct(
  spec: ProductSpec,
): Promise<{id: string; action: 'created'}> {
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

  await setVariantFields(created.product.id, variantId, spec);

  console.log(
    `  created ${spec.handle} → ${created.product.id} (${created.product.status})`,
  );
  return {id: created.product.id, action: 'created'};
}

async function ensureLineupCollections(
  productIdsByHandle: Map<string, string>,
): Promise<void> {
  console.log('\nLineup collections:');
  const existing = await existingCollectionsByHandle();
  let created = 0;
  let updated = 0;

  for (const col of LINEUP_COLLECTIONS) {
    const productIds = seedCatalog
      .filter((p) => p.lineup === col.lineup)
      .map((p) => productIdsByHandle.get(p.handle))
      .filter((id): id is string => Boolean(id) && !id.startsWith('dry-run://'));

    if (!APPLY) {
      const verb = existing.has(col.handle) ? 'update' : 'create';
      console.log(
        `  [dry-run] would ${verb} ${col.handle} (${productIds.length || seedCatalog.filter((p) => p.lineup === col.lineup).length} products)`,
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
          // Already-in-collection is fine for idempotent re-runs.
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
        material_architecture: metafield(namespace: "specs", key: "material_architecture") { value }
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
              material_architecture?: {value: string} | null;
            }>;
          }
        | undefined
    )?.nodes ?? [];

  console.log('\nVerification:');
  let ok = 0;
  let missing = 0;
  for (const handle of handles) {
    const node = nodes.find((n) => n.handle === handle);
    if (!node) {
      console.log(`  MISSING ${handle}`);
      missing += 1;
      continue;
    }
    const variant = node.variants.nodes[0];
    const seed = seedCatalog.find((p) => p.handle === handle)!;
    const skuOk = variant?.sku === seed.sku;
    const metaOk = Boolean(node.lineup?.value && node.claim_status?.value);
    if (skuOk && metaOk && node.status === 'DRAFT') ok += 1;
    console.log(
      `  ${handle}: ${node.status} vendor=${node.vendor} sku=${variant?.sku} price=${variant?.price} lineup=${node.lineup?.value ?? '∅'} claim=${node.claim_status?.value ?? '∅'}`,
    );
    console.log(`    ${adminUrl(node.id)}`);
  }
  console.log(`Verify tally: ok=${ok} missing=${missing} expected=${handles.length}`);

  const colQuery = `query VerifyCols($query: String!) {
    collections(first: 10, query: $query) {
      nodes {
        id
        handle
        title
        productsCount { count }
      }
    }
  }`;
  const colResult = await executeGraphql(colQuery, {
    query: LINEUP_COLLECTIONS.map((c) => `handle:${c.handle}`).join(' OR '),
  });
  assertNoErrors('verify collections', colResult);
  const cols =
    (
      colResult.data?.collections as
        | {
            nodes: Array<{
              handle: string;
              title: string;
              productsCount: {count: number};
            }>;
          }
        | undefined
    )?.nodes ?? [];
  console.log('\nCollection verification:');
  for (const col of LINEUP_COLLECTIONS) {
    const node = cols.find((c) => c.handle === col.handle);
    const expected = seedCatalog.filter((p) => p.lineup === col.lineup).length;
    if (!node) {
      console.log(`  MISSING ${col.handle} (expected ${expected} products)`);
      continue;
    }
    console.log(
      `  ${col.handle}: "${node.title}" products=${node.productsCount.count} (expected ${expected})`,
    );
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
  let updatedProducts = 0;

  for (const spec of seedCatalog) {
    const existingProduct = byHandle.get(spec.handle);
    if (existingProduct) {
      const {id, action} = await updateProduct(existingProduct, spec);
      productIds.push({handle: spec.handle, id, action});
      updatedProducts += 1;
      continue;
    }
    const {id, action} = await createProduct(spec);
    productIds.push({handle: spec.handle, id, action});
    if (action === 'created') createdProducts += 1;
  }
  console.log(`Products: created=${createdProducts} updated=${updatedProducts}`);

  const idMap = new Map(productIds.map((row) => [row.handle, row.id]));
  await ensureLineupCollections(idMap);

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

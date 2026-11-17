import {existsSync, readFileSync} from 'node:fs';
import {
  STOREFRONT_LOOKUP_MAX_IDS,
  UcpClient,
  type CatalogGetProductInput,
  type CatalogLookupInput,
  type CatalogSearchInput,
  type Context,
  type LineItemInput,
  type Product,
} from '@maison-tavo/ucp';
import {ShopifyIdMap, type ShopifyIdMap as ShopifyIdMapType} from '@maison-tavo/catalog';
import {seedCatalog} from '@maison-tavo/catalog/src/seed';
import {type HeatSource, type ProductSpec} from '@maison-tavo/catalog/src/schema';

const ID_MAP_URL = new URL('../../../data/shopify-id-map.json', import.meta.url);

function loadRetainedIds(): ShopifyIdMapType | undefined {
  try {
    if (!existsSync(ID_MAP_URL)) return undefined;
    return ShopifyIdMap.parse(JSON.parse(readFileSync(ID_MAP_URL, 'utf8')));
  } catch {
    return undefined;
  }
}

/** Parameters for the constraint-based query-to-cart evaluator. */
export interface QueryParams {
  /** Maximum total spend in USD. */
  budget_usd: number;
  /** Maximum number of pieces to select. */
  piece_count: number;
  /** Heat sources that every selected piece must support. */
  heat_sources: HeatSource[];
  /** Use-case keywords to score SKUs against. */
  use_cases: string[];
}

export function scoreSkuForUseCases(
  sku: (typeof seedCatalog)[number],
  useCases: string[],
): number {
  const haystack = [
    ...sku.agent_intents,
    sku.concept_thesis,
    sku.primary_material,
    sku.lining_material,
    sku.material_architecture,
    sku.interaction_performance_intent,
  ]
    .join(' ')
    .toLowerCase();

  return useCases.reduce((score, useCase) => {
    return score + (haystack.includes(useCase.toLowerCase()) ? 1 : 0);
  }, 0);
}

export function evaluateCatalog(params: QueryParams): (typeof seedCatalog)[number][] {
  const compatible = seedCatalog.filter((sku) => {
    if (sku.heat_sources.length === 0 && params.heat_sources.length > 0) return false;
    const heatOk = params.heat_sources.every((hs) => sku.heat_sources.includes(hs));
    const inductionOk =
      !params.heat_sources.includes('induction') || sku.induction_compatible === true;
    return heatOk && inductionOk;
  });

  const scored = compatible
    .map((sku) => ({sku, score: scoreSkuForUseCases(sku, params.use_cases)}))
    .sort((a, b) => b.score - a.score || a.sku.price_usd - b.sku.price_usd);

  let selected = scored.slice(0, params.piece_count).map((s) => s.sku);

  while (selected.length > 0) {
    const total = selected.reduce((sum, sku) => sum + sku.price_usd, 0);
    if (total <= params.budget_usd) break;
    selected = selected.slice(0, selected.length - 1);
  }

  return selected;
}

function specProperties(match: ProductSpec) {
  const props: Array<{name: string; value: unknown}> = [
    {name: 'sku', value: match.sku},
    {name: 'lineup', value: match.lineup},
    {name: 'claim_status', value: match.claim_status},
    {name: 'primary_material', value: match.primary_material},
    {name: 'lining_material', value: match.lining_material},
    {name: 'dimensions', value: match.dimensions_summary},
    {name: 'dishwasher_suitability', value: match.dishwasher_suitability},
    {name: 'microwave_suitability', value: match.microwave_suitability},
    {name: 'food_contact_suitability', value: match.food_contact_suitability},
    {name: 'care_instructions', value: match.care_instructions},
    {name: 'heat_compatibility', value: match.heat_compatibility},
    {name: 'induction_compatible', value: match.induction_compatible},
    {name: 'heat_sources', value: match.heat_sources.join(', ')},
    {name: 'material_architecture', value: match.material_architecture},
    {name: 'concept_thesis', value: match.concept_thesis},
  ];
  if (match.dimensions.capacity_ml !== undefined) {
    props.push({name: 'capacity_ml', value: match.dimensions.capacity_ml});
  }
  return props;
}

function matchProductToSeed(product: Product, idMap?: ShopifyIdMapType): ProductSpec | undefined {
  if (idMap) {
    const byGid = Object.values(idMap.products_by_sku).find(
      (entry) => entry.product_id === product.id,
    );
    if (byGid) {
      const found = seedCatalog.find((s) => s.sku === byGid.sku);
      if (found) return found;
    }
  }
  if (product.url) {
    try {
      const handle = new URL(product.url).pathname.split('/products/')[1]?.split('/')[0];
      if (handle) {
        const byHandle = seedCatalog.find((s) => s.handle === handle);
        if (byHandle) return byHandle;
      }
    } catch {
      // ignore invalid URL
    }
  }
  return seedCatalog.find(
    (sku) => sku.title.toLowerCase() === (product.title ?? '').toLowerCase(),
  );
}

/** Shopping agent scoped to Maison Tavo's Storefront Catalog MCP (`/api/ucp/mcp`). */
export class ShopperAgent {
  private clientPromise: Promise<UcpClient> | undefined;

  constructor(
    private readonly businessUrl: string,
    private readonly agentProfileUrl: () => string,
  ) {}

  private client() {
    this.clientPromise ??= UcpClient.discover(this.businessUrl, this.agentProfileUrl()).then(
      ({client}) => client,
    );
    this.clientPromise.catch(() => (this.clientPromise = undefined));
    return this.clientPromise;
  }

  private enrichProduct(product: Product, idMap = loadRetainedIds()): Product {
    const match = matchProductToSeed(product, idMap);
    if (!match) return product;
    return {
      ...product,
      additionalProperty: specProperties(match),
    };
  }

  async search(input: CatalogSearchInput) {
    const idMap = loadRetainedIds();
    const results = await (await this.client()).searchCatalog(input);
    return {
      ...results,
      products: results.products.map((p) => this.enrichProduct(p, idMap)),
    };
  }

  /** Batch resolve up to 10 Storefront Catalog product/variant GIDs via `lookup_catalog`. */
  async lookup(input: CatalogLookupInput) {
    const idMap = loadRetainedIds();
    const results = await (await this.client()).lookupCatalog(input);
    return {
      ...results,
      products: results.products.map((p) => this.enrichProduct(p, idMap)),
    };
  }

  /** Fetch full single-product option availability & checkout URLs via `get_product`. */
  async getProduct(input: CatalogGetProductInput) {
    const idMap = loadRetainedIds();
    const result = await (await this.client()).getProduct(input);
    return {
      ...result,
      product: this.enrichProduct(result.product, idMap),
    };
  }

  async createCart(lineItems: LineItemInput[], context?: Context) {
    return (await this.client()).createCart(lineItems, context);
  }

  async createCheckout(cartId: string) {
    return (await this.client()).createCheckout({cart_id: cartId});
  }

  async getCheckout(id: string) {
    return (await this.client()).getCheckout(id);
  }

  async updateCheckout(id: string, updates: Record<string, unknown>) {
    return (await this.client()).updateCheckout(id, updates);
  }

  async completeCheckout(id: string, payment: Record<string, unknown>) {
    return (await this.client()).completeCheckout(id, payment);
  }

  /**
   * Constraint-based query-to-cart evaluator.
   * Resolves variant GIDs first from retained `data/shopify-id-map.json`, then via
   * UCP `lookup_catalog` against the retained `product_id`s (respecting the 10-ID
   * Storefront Catalog batch limit), falling back to Storefront GraphQL or local stub.
   */
  async query(params: QueryParams) {
    const selected = evaluateCatalog(params);

    if (selected.length === 0) {
      throw new Error(
        `No SKUs matched the constraints: heat_sources=${params.heat_sources.join(',')}, budget=$${params.budget_usd}`,
      );
    }

    const idMap = loadRetainedIds();
    const resolvedVariantBySku = new Map<string, string>();

    for (const sku of selected) {
      const retained = idMap?.products_by_sku[sku.sku];
      if (retained?.variant_id) {
        resolvedVariantBySku.set(sku.sku, retained.variant_id);
      }
    }

    const needLookup = selected.filter((s) => !resolvedVariantBySku.has(s.sku));
    const productIdsToLookup = needLookup
      .map((s) => ({sku: s.sku, productId: idMap?.products_by_sku[s.sku]?.product_id}))
      .filter((x): x is {sku: string; productId: string} => Boolean(x.productId));

    if (productIdsToLookup.length > 0 && Bun.env.UCP_AGENT_PROFILE_URL) {
      try {
        const client = await this.client();
        for (let i = 0; i < productIdsToLookup.length; i += STOREFRONT_LOOKUP_MAX_IDS) {
          const chunk = productIdsToLookup.slice(i, i + STOREFRONT_LOOKUP_MAX_IDS);
          const lookedUp = await client.lookupCatalog({
            ids: chunk.map((c) => c.productId),
            context: {address_country: 'US'},
          });
          for (const entry of chunk) {
            const prod = lookedUp.products.find((p) => p.id === entry.productId);
            const varId = prod?.variants[0]?.id;
            if (varId) resolvedVariantBySku.set(entry.sku, varId);
          }
        }
      } catch {
        // Fall through to Storefront GraphQL or local dev placeholder
      }
    }

    const storefrontToken = Bun.env.SHOPIFY_STOREFRONT_TOKEN;
    const shopDomain = Bun.env.SHOPIFY_STORE_DOMAIN ?? 'maison-tavo.myshopify.com';

    const lineItems: LineItemInput[] = await Promise.all(
      selected.map(async (sku) => {
        const already = resolvedVariantBySku.get(sku.sku);
        if (already) {
          return {item: {id: already}, quantity: 1};
        }

        if (!storefrontToken) {
          return {item: {id: `gid://shopify/ProductVariant/placeholder-${sku.sku}`}, quantity: 1};
        }

        const query = `
          query GetVariant($handle: String!) {
            product(handle: $handle) {
              variants(first: 1) {
                nodes { id title availableForSale }
              }
            }
          }
        `;

        const res = await fetch(`https://${shopDomain}/api/2026-04/graphql.json`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Storefront-Access-Token': storefrontToken,
          },
          body: JSON.stringify({query, variables: {handle: sku.handle}}),
        });

        const data = (await res.json()) as {
          data?: {product?: {variants?: {nodes?: {id: string}[]}}};
        };
        const variantId = data.data?.product?.variants?.nodes?.[0]?.id;

        if (!variantId) {
          throw new Error(`Could not resolve variant ID for SKU: ${sku.handle}`);
        }

        return {item: {id: variantId}, quantity: 1};
      }),
    );

    return this.createCart(lineItems);
  }
}

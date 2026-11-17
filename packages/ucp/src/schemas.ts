import {z} from 'zod';

export const UCP_VERSION = '2026-08-25';

export const GLOBAL_CATALOG_MCP_ENDPOINT = 'https://catalog.shopify.com/api/ucp/mcp';

export function storefrontCatalogMcpEndpoint(storeDomainOrOrigin: string): string {
  const origin = storeDomainOrOrigin.startsWith('http')
    ? storeDomainOrOrigin
    : `https://${storeDomainOrOrigin}`;
  return new URL('/api/ucp/mcp', origin).toString();
}

/**
 * Maximum caching windows mandated by Shopify's UCP Catalog API License & Usage Guidelines.
 * Commission values must never be cached (`0`).
 */
export const UCP_CACHE_LIMITS_MS = {
  PRODUCT_METADATA: 24 * 60 * 60 * 1000,
  SHOPIFY_CDN_IMAGES: 24 * 60 * 60 * 1000,
  PRICE_AND_AVAILABILITY: 10 * 60 * 1000,
  COMMISSION_VALUES: 0,
} as const;

export const STOREFRONT_LOOKUP_MAX_IDS = 10;
export const GLOBAL_LOOKUP_MAX_IDS = 50;

/** Capability and service names from the UCP registry, e.g. `dev.ucp.shopping.checkout`. */
export const CapabilityName = z.string().regex(/^[a-z0-9]+(\.[a-z0-9_]+)+$/);

export const CapabilityEntry = z.looseObject({
  version: z.string(),
  spec: z.url().optional(),
  schema: z.url().optional(),
  extends: z.union([z.string(), z.array(z.string())]).optional(),
  config: z.record(z.string(), z.unknown()).optional(),
});

export const ServiceEntry = z.looseObject({
  version: z.string(),
  spec: z.url().optional(),
  transport: z.enum(['rest', 'mcp', 'a2a', 'embedded']),
  endpoint: z.url().optional(),
  schema: z.url().optional(),
});

/** The document served at `/.well-known/ucp` by businesses and platforms. */
export const Profile = z.object({
  ucp: z.looseObject({
    version: z.string(),
    supported_versions: z.record(z.string(), z.url()).optional(),
    services: z.record(CapabilityName, z.array(ServiceEntry)).default({}),
    capabilities: z.record(CapabilityName, z.array(CapabilityEntry)).default({}),
    payment_handlers: z.record(z.string(), z.array(z.looseObject({}))).optional(),
  }),
});
export type Profile = z.infer<typeof Profile>;

/** Amounts are signed integers in the currency's minor unit. */
export const Total = z.looseObject({
  type: z.string(),
  amount: z.number().int(),
  display_text: z.string().optional(),
});

export const Message = z.looseObject({
  type: z.enum(['info', 'warning', 'error']),
  code: z.string().optional(),
  path: z.string().optional(),
  content: z.string(),
  severity: z
    .enum([
      'recoverable',
      'unrecoverable',
      'requires_buyer_input',
      'requires_buyer_review',
    ])
    .optional(),
  presentation: z.enum(['notice', 'disclosure']).optional(),
});
export type Message = z.infer<typeof Message>;

export const LineItemInput = z.object({
  id: z.string().optional(),
  item: z.object({id: z.string()}),
  quantity: z.number().int().positive(),
});
export type LineItemInput = z.infer<typeof LineItemInput>;

export const LineItem = z.looseObject({
  id: z.string(),
  item: z.looseObject({
    id: z.string(),
    title: z.string().optional(),
    price: z.number().int().optional(),
  }),
  quantity: z.number().int(),
  totals: z.array(Total).optional(),
});

export const Context = z.looseObject({
  address_country: z.string().length(2).optional(),
  address_region: z.string().optional(),
  postal_code: z.string().optional(),
  language: z.string().optional(),
  currency: z.string().length(3).optional(),
  intent: z.string().optional(),
});
export type Context = z.infer<typeof Context>;

export const Buyer = z.looseObject({
  email: z.email().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  phone_number: z.string().optional(),
});

export const CheckoutStatus = z.enum([
  'incomplete',
  'requires_escalation',
  'ready_for_complete',
  'complete_in_progress',
  'completed',
  'canceled',
]);

export const Checkout = z.looseObject({
  id: z.string(),
  status: CheckoutStatus,
  currency: z.string(),
  line_items: z.array(LineItem),
  totals: z.array(Total).default([]),
  messages: z.array(Message).default([]),
  buyer: Buyer.optional(),
  continue_url: z.url().optional(),
  expires_at: z.string().optional(),
});
export type Checkout = z.infer<typeof Checkout>;

export const Cart = z.looseObject({
  id: z.string(),
  currency: z.string(),
  line_items: z.array(LineItem),
  totals: z.array(Total).default([]),
  messages: z.array(Message).default([]),
  continue_url: z.url().optional(),
});
export type Cart = z.infer<typeof Cart>;

export const Money = z.looseObject({
  amount: z.number().int(),
  currency: z.string(),
});

export const SelectedOption = z.object({
  name: z.string().min(1),
  label: z.string().min(1),
});
export type SelectedOption = z.infer<typeof SelectedOption>;

export const ProductOptionValue = z.looseObject({
  label: z.string(),
  available: z.boolean().optional(),
  exists: z.boolean().optional(),
});

export const ProductOption = z.looseObject({
  name: z.string(),
  values: z.array(ProductOptionValue).default([]),
});

export const SellerRef = z.looseObject({
  domain: z.string().optional(),
  name: z.string().optional(),
  url: z.url().optional(),
});

/**
 * UCP Product representation across `search_catalog`, `lookup_catalog`, and `get_product`.
 * `looseObject` ensures merchant attribution and query params (`shcgid`, `shclid`) on
 * `url` and `checkout_url` survive parsing untouched.
 */
export const Product = z.looseObject({
  id: z.string(),
  title: z.string(),
  description: z.unknown().optional(),
  url: z.url().optional(),
  price_range: z.looseObject({min: Money, max: Money}).optional(),
  selected: z.array(SelectedOption).optional(),
  options: z.array(ProductOption).optional(),
  variants: z
    .array(
      z.looseObject({
        id: z.string(),
        title: z.string().optional(),
        available: z.boolean().optional(),
        price: Money.optional(),
        url: z.url().optional(),
        checkout_url: z.url().optional(),
        seller: SellerRef.optional(),
        inputs: z.array(z.string()).optional(),
      }),
    )
    .default([]),
  /**
   * Enriched spec fields from the Maison Tavo catalog (D4 — machine-readable spec layer).
   * Populated by ShopperAgent when a product matches a seed SKU by ID, handle, or title.
   * Follows schema.org PropertyValue convention: [{ name: string, value: unknown }].
   */
  additionalProperty: z
    .array(z.looseObject({name: z.string(), value: z.unknown()}))
    .optional(),
});
export type Product = z.infer<typeof Product>;

export const CatalogSearchInput = z.object({
  query: z.string(),
  context: Context.optional(),
  filters: z
    .looseObject({
      categories: z.array(z.string()).optional(),
      price: z
        .object({min: z.number().int().optional(), max: z.number().int().optional()})
        .optional(),
      available: z.boolean().optional(),
      ships_to: z.object({country: z.string().length(2)}).optional(),
    })
    .optional(),
  pagination: z
    .object({cursor: z.string().optional(), limit: z.number().int().min(1).max(250).optional()})
    .optional(),
});
export type CatalogSearchInput = z.infer<typeof CatalogSearchInput>;

export const CatalogSearchResult = z.looseObject({
  products: z.array(Product).default([]),
  messages: z.array(Message).default([]),
  pagination: z.looseObject({cursor: z.string().optional()}).optional(),
});
export type CatalogSearchResult = z.infer<typeof CatalogSearchResult>;

export const CatalogLookupInput = z.object({
  ids: z.array(z.string().min(1)).min(1).max(GLOBAL_LOOKUP_MAX_IDS),
  context: Context.optional(),
});
export type CatalogLookupInput = z.infer<typeof CatalogLookupInput>;

export const CatalogLookupResult = z.looseObject({
  products: z.array(Product).default([]),
  messages: z.array(Message).default([]),
});
export type CatalogLookupResult = z.infer<typeof CatalogLookupResult>;

export const CatalogGetProductInput = z.object({
  id: z.string().min(1),
  selected: z.array(SelectedOption).optional(),
  preferences: z.array(z.string().min(1)).optional(),
  context: Context.optional(),
});
export type CatalogGetProductInput = z.infer<typeof CatalogGetProductInput>;

export const CatalogGetProductResult = z.looseObject({
  product: Product,
  messages: z.array(Message).default([]),
});
export type CatalogGetProductResult = z.infer<typeof CatalogGetProductResult>;

export const McpToolDescriptor = z.looseObject({
  name: z.string(),
  description: z.string().optional(),
  inputSchema: z.record(z.string(), z.unknown()).optional(),
});

export const McpToolListResult = z.looseObject({
  tools: z.array(McpToolDescriptor).default([]),
});
export type McpToolListResult = z.infer<typeof McpToolListResult>;

/** Verify that required Shopify Catalog attribution parameters (`shcgid`, `shclid`) are preserved. */
export function hasIntactAttribution(originalUrl: string, candidateUrl: string): boolean {
  const orig = new URL(originalUrl);
  const cand = new URL(candidateUrl);
  for (const param of ['shcgid', 'shclid']) {
    const expected = orig.searchParams.get(param);
    if (expected !== null && cand.searchParams.get(param) !== expected) {
      return false;
    }
  }
  return orig.origin === cand.origin && orig.pathname === cand.pathname;
}

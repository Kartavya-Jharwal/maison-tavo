import {z} from 'zod';

export const UCP_VERSION = '2026-08-25';

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

export const Product = z.looseObject({
  id: z.string(),
  title: z.string(),
  description: z.unknown().optional(),
  url: z.url().optional(),
  price_range: z.looseObject({min: Money, max: Money}).optional(),
  variants: z
    .array(
      z.looseObject({
        id: z.string(),
        title: z.string().optional(),
        url: z.url().optional(),
        checkout_url: z.url().optional(),
      }),
    )
    .default([]),
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
    })
    .optional(),
  pagination: z
    .object({cursor: z.string().optional(), limit: z.number().int().min(1).optional()})
    .optional(),
});
export type CatalogSearchInput = z.infer<typeof CatalogSearchInput>;

export const CatalogSearchResult = z.looseObject({
  products: z.array(Product).default([]),
  messages: z.array(Message).default([]),
  pagination: z.looseObject({cursor: z.string().optional()}).optional(),
});
export type CatalogSearchResult = z.infer<typeof CatalogSearchResult>;

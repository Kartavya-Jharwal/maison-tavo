import {
  CatalogGetProductInput,
  CatalogLookupInput,
  CatalogSearchInput,
  Context,
  LineItemInput,
  UcpError,
  fetchProfile,
} from '@maison-tavo/ucp';
import {HeatSource} from '@maison-tavo/catalog/src/schema';
import {z} from 'zod';
import {config, loadTls} from './config';
import {platformProfile} from './profile';
import {ShopperAgent} from './shopper';

const shopper = new ShopperAgent(config.businessUrl, () => config.agentProfileUrl);

const CartRequest = z.object({line_items: z.array(LineItemInput).min(1), context: Context.optional()});

/** Constraint-based query-to-cart request schema. */
const QueryRequest = z.object({
  budget_usd: z.number().positive(),
  piece_count: z.number().int().min(1).max(12),
  heat_sources: z.array(HeatSource).min(1),
  use_cases: z.array(z.string().min(1)).min(1),
});

const CheckoutCreateRequest = z.object({
  cart_id: z.string(),
});

async function handle(run: () => Promise<unknown>) {
  try {
    return Response.json(await run());
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({error: 'invalid_request', issues: error.issues}, {status: 400});
    }
    if (error instanceof UcpError) {
      const status = error.code === 'invalid_arguments' ? 400 : 502;
      return Response.json(
        {error: error.code ?? 'ucp_error', message: error.message, continue_url: error.continueUrl},
        {status},
      );
    }
    if (error instanceof Error) {
      return Response.json({error: 'internal_error', message: error.message}, {status: 500});
    }
    throw error;
  }
}

const server = Bun.serve({
  port: config.port,
  tls: loadTls(),
  routes: {
    '/.well-known/ucp': () => Response.json(platformProfile),
    '/health': () => Response.json({ok: true}),
    '/business': () => handle(() => fetchProfile(config.businessUrl)),

    // --- Storefront Catalog MCP shopper tools (search, lookup, get_product) ---
    '/agents/shopper/search': {
      POST: async (req) =>
        handle(async () => shopper.search(CatalogSearchInput.parse(await req.json()))),
    },
    '/agents/shopper/lookup': {
      POST: async (req) =>
        handle(async () => shopper.lookup(CatalogLookupInput.parse(await req.json()))),
    },
    '/agents/shopper/product': {
      POST: async (req) =>
        handle(async () => shopper.getProduct(CatalogGetProductInput.parse(await req.json()))),
    },
    '/agents/shopper/cart': {
      POST: async (req) =>
        handle(async () => {
          const {line_items, context} = CartRequest.parse(await req.json());
          return shopper.createCart(line_items, context);
        }),
    },
    /** Constraint evaluator: budget + heat sources + use-cases → validated Shopify cart. */
    '/agents/shopper/query': {
      POST: async (req) =>
        handle(async () => shopper.query(QueryRequest.parse(await req.json()))),
    },

    // --- Checkout lifecycle (wires UcpClient checkout methods) ---
    '/agents/checkout': {
      POST: async (req) =>
        handle(async () => {
          const {cart_id} = CheckoutCreateRequest.parse(await req.json());
          return shopper.createCheckout(cart_id);
        }),
    },
    '/agents/checkout/:id': {
      GET: (req) => handle(() => shopper.getCheckout(req.params.id)),
      PUT: async (req) =>
        handle(async () =>
          shopper.updateCheckout(req.params.id, (await req.json()) as Record<string, unknown>)),
    },
    '/agents/checkout/:id/complete': {
      POST: async (req) =>
        handle(async () =>
          shopper.completeCheckout(req.params.id, (await req.json()) as Record<string, unknown>),
        ),
    },
  },
  fetch: () => Response.json({error: 'not_found'}, {status: 404}),
});

console.log(`Agents listening on ${server.url}`);

export default server;

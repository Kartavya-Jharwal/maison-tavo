import {
  CatalogSearchInput,
  Context,
  LineItemInput,
  UcpError,
  fetchProfile,
} from '@maison-tavo/ucp';
import {z} from 'zod';
import {config, loadTls} from './config';
import {platformProfile} from './profile';
import {ShopperAgent} from './shopper';

const shopper = new ShopperAgent(config.businessUrl, () => config.agentProfileUrl);

const CartRequest = z.object({line_items: z.array(LineItemInput).min(1), context: Context.optional()});

async function handle(run: () => Promise<unknown>) {
  try {
    return Response.json(await run());
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({error: 'invalid_request', issues: error.issues}, {status: 400});
    }
    if (error instanceof UcpError) {
      return Response.json(
        {error: error.code ?? 'ucp_error', message: error.message, continue_url: error.continueUrl},
        {status: 502},
      );
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
    '/agents/shopper/search': {
      POST: async (req) => handle(async () => shopper.search(CatalogSearchInput.parse(await req.json()))),
    },
    '/agents/shopper/cart': {
      POST: async (req) =>
        handle(async () => {
          const {line_items, context} = CartRequest.parse(await req.json());
          return shopper.createCart(line_items, context);
        }),
    },
  },
  fetch: () => Response.json({error: 'not_found'}, {status: 404}),
});

console.log(`Agents listening on ${server.url}`);

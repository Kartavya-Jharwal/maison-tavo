import {describe, expect, test} from 'bun:test';
import {
  GLOBAL_CATALOG_MCP_ENDPOINT,
  Profile,
  UCP_CACHE_LIMITS_MS,
  UcpClient,
  UcpError,
  hasIntactAttribution,
  mcpEndpoint,
} from '../src';
import storeProfile from './fixtures/maison-tavo-profile.json';

function fakeFetch(body: unknown, onRequest?: (req: {url: string; body: unknown}) => void): typeof fetch {
  return (async (input: string | URL | Request, init?: RequestInit) => {
    onRequest?.({
      url: String(input),
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
    });
    return Response.json(body);
  }) as unknown as typeof fetch;
}

const agentProfileUrl = 'https://agents.example.com/.well-known/ucp';

describe('Profile', () => {
  test('parses the live Maison Tavo profile including catalog search & lookup capabilities', () => {
    const profile = Profile.parse(storeProfile);
    expect(profile.ucp.capabilities['dev.ucp.shopping.checkout']).toBeDefined();
    expect(profile.ucp.capabilities['dev.ucp.shopping.catalog.search']).toBeDefined();
    expect(profile.ucp.capabilities['dev.ucp.shopping.catalog.lookup']).toBeDefined();
    expect(mcpEndpoint(profile)).toEndWith('/api/ucp/mcp');
  });
});

describe('UcpClient — Storefront & Global Catalog MCP', () => {
  test('reads structured content from search_catalog and preserves shcgid/shclid attribution', async () => {
    const checkoutUrl =
      'https://maison-tavo.myshopify.com/cart/123:1?shcgid=attr_1&shclid=click_9';
    const client = UcpClient.forStorefront(
      'maison-tavo.myshopify.com',
      agentProfileUrl,
      fakeFetch({
        jsonrpc: '2.0',
        id: 1,
        result: {
          structuredContent: {
            products: [
              {
                id: 'gid://shopify/Product/16027616018801',
                title: 'Forge Relay Dual-Mass Skillet',
                variants: [
                  {
                    id: 'gid://shopify/ProductVariant/1',
                    checkout_url: checkoutUrl,
                    seller: {domain: 'maison-tavo.myshopify.com'},
                  },
                ],
              },
            ],
          },
        },
      }),
    );

    const result = await client.searchCatalog({query: 'skillet'});
    const returnedUrl = result.products[0]?.variants[0]?.checkout_url ?? '';
    expect(result.products[0]?.title).toBe('Forge Relay Dual-Mass Skillet');
    expect(hasIntactAttribution(checkoutUrl, returnedUrl)).toBe(true);
    expect(hasIntactAttribution(checkoutUrl, 'https://maison-tavo.myshopify.com/cart/123:1')).toBe(false);
  });

  test('lookup_catalog enforces max 10 IDs on Storefront Catalog and allows up to 50 on Global Catalog', async () => {
    const storefrontClient = UcpClient.forStorefront(
      'maison-tavo.myshopify.com',
      agentProfileUrl,
      fakeFetch({jsonrpc: '2.0', id: 1, result: {structuredContent: {products: [], messages: []}}}),
    );

    const elevenIds = Array.from({length: 11}, (_, i) => `gid://shopify/Product/${i + 1}`);
    const err = await storefrontClient.lookupCatalog({ids: elevenIds}).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(UcpError);
    expect((err as UcpError).code).toBe('invalid_arguments');

    let calledEndpoint = '';
    const globalClient = UcpClient.forGlobalCatalog(
      agentProfileUrl,
      fakeFetch(
        {jsonrpc: '2.0', id: 1, result: {structuredContent: {products: [], messages: []}}},
        (req) => {
          calledEndpoint = req.url;
        },
      ),
    );
    const res = await globalClient.lookupCatalog({ids: elevenIds, context: {address_country: 'US'}});
    expect(calledEndpoint).toBe(GLOBAL_CATALOG_MCP_ENDPOINT);
    expect(res.products).toEqual([]);
  });

  test('get_product passes selected options and preferences with meta.ucp-agent.profile', async () => {
    let sentPayload: Record<string, unknown> | undefined;
    const client = UcpClient.forStorefront(
      'maison-tavo.myshopify.com',
      agentProfileUrl,
      fakeFetch(
        {
          jsonrpc: '2.0',
          id: 1,
          result: {
            structuredContent: {
              product: {
                id: 'gid://shopify/Product/16027616018801',
                title: 'Forge Relay Dual-Mass Skillet',
                selected: [{name: 'Diameter', label: '26 cm'}],
                options: [{name: 'Diameter', values: [{label: '26 cm', available: false, exists: true}]}],
                variants: [{id: 'gid://shopify/ProductVariant/99', available: false}],
              },
              messages: [],
            },
          },
        },
        (req) => {
          sentPayload = req.body as Record<string, unknown>;
        },
      ),
    );

    const out = await client.getProduct({
      id: 'gid://shopify/Product/16027616018801',
      selected: [{name: 'Diameter', label: '26 cm'}],
      preferences: ['Diameter'],
      context: {address_country: 'US'},
    });

    expect(out.product.selected?.[0]?.label).toBe('26 cm');
    expect(out.product.options?.[0]?.values[0]?.exists).toBe(true);
    const params = sentPayload?.params as {name: string; arguments: {meta: {'ucp-agent': {profile: string}}}};
    expect(params.name).toBe('get_product');
    expect(params.arguments.meta['ucp-agent'].profile).toBe(agentProfileUrl);
  });

  test('listTools sends tools/list with meta.ucp-agent.profile', async () => {
    const client = UcpClient.forStorefront(
      'maison-tavo.myshopify.com',
      agentProfileUrl,
      fakeFetch({
        jsonrpc: '2.0',
        id: 1,
        result: {
          tools: [{name: 'search_catalog'}, {name: 'lookup_catalog'}, {name: 'get_product'}],
        },
      }),
    );

    const list = await client.listTools();
    expect(list.tools.map((t) => t.name)).toEqual([
      'search_catalog',
      'lookup_catalog',
      'get_product',
    ]);
    expect(UCP_CACHE_LIMITS_MS.PRICE_AND_AVAILABILITY).toBe(600_000);
    expect(UCP_CACHE_LIMITS_MS.COMMISSION_VALUES).toBe(0);
  });

  test('surfaces the continue URL from a UCP error', async () => {
    const client = new UcpClient({
      endpoint: 'https://store.example.com/api/ucp/mcp',
      agentProfileUrl,
      fetch: fakeFetch({
        jsonrpc: '2.0',
        id: 1,
        error: {
          code: -32001,
          message: 'UCP discovery failed',
          data: {
            code: 'invalid_profile_url',
            content: 'Unable to fetch agent profile',
            continue_url: 'https://store.example.com/',
          },
        },
      }),
    });

    const error = await client.searchCatalog({query: 'coat'}).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(UcpError);
    expect((error as UcpError).code).toBe('invalid_profile_url');
    expect((error as UcpError).continueUrl).toBe('https://store.example.com/');
  });
});

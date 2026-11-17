import {describe, expect, test, mock} from 'bun:test';
import {Cart} from '@maison-tavo/ucp';

const mockQuery = mock(() =>
  Promise.resolve(
    Cart.parse({
      id: 'gid://shopify/Cart/test-cart-id',
      currency: 'USD',
      line_items: [
        {
          id: 'li_1',
          item: {id: 'gid://shopify/ProductVariant/1', title: 'Test SKU', price: 32000},
          quantity: 1,
        },
      ],
      totals: [{type: 'subtotal', amount: 32000, display_text: '$320.00'}],
      continue_url: 'https://maison-tavo.myshopify.com/cart/test',
    }),
  ),
);

const mockLookup = mock(() =>
  Promise.resolve({
    products: [{id: 'gid://shopify/Product/16027616018801', title: 'Forge Relay Dual-Mass Skillet', variants: []}],
    messages: [],
  }),
);

const mockGetProduct = mock(() =>
  Promise.resolve({
    product: {id: 'gid://shopify/Product/16027616018801', title: 'Forge Relay Dual-Mass Skillet', variants: []},
    messages: [],
  }),
);

mock.module('../src/shopper', () => ({
  ShopperAgent: class {
    query = mockQuery;
    search = mock(() => Promise.resolve({products: [], messages: [], pagination: {}}));
    lookup = mockLookup;
    getProduct = mockGetProduct;
    createCart = mock(() => Promise.resolve({id: 'cart_1', currency: 'USD', line_items: [], totals: [], messages: []}));
    createCheckout = mock(() => Promise.resolve({id: 'checkout_1', status: 'incomplete', currency: 'USD', line_items: [], totals: [], messages: []}));
    getCheckout = mock(() => Promise.resolve({id: 'checkout_1', status: 'incomplete', currency: 'USD', line_items: [], totals: [], messages: []}));
    updateCheckout = mock(() => Promise.resolve({id: 'checkout_1', status: 'incomplete', currency: 'USD', line_items: [], totals: [], messages: []}));
    completeCheckout = mock(() => Promise.resolve({id: 'checkout_1', status: 'complete_in_progress', currency: 'USD', line_items: [], totals: [], messages: []}));
  },
  evaluateCatalog: mock(() => []),
  scoreSkuForUseCases: mock(() => 0),
}));

describe('Agent shopper & UCP catalog routes', () => {
  test('POST /agents/shopper/query returns 200 with cart shape', async () => {
    const server = (await import('../src/server')).default;

    const res = await fetch(`${server.url}agents/shopper/query`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        budget_usd: 1800,
        piece_count: 5,
        heat_sources: ['induction'],
        use_cases: ['searing', 'clay slow-cooking'],
      }),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as {id?: string; currency?: string};
    expect(body).toHaveProperty('id');
    expect(body).toHaveProperty('currency');
    server.stop();
  });

  test('POST /agents/shopper/lookup resolves batch IDs', async () => {
    const server = (await import('../src/server')).default;

    const res = await fetch(`${server.url}agents/shopper/lookup`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        ids: ['gid://shopify/Product/16027616018801'],
        context: {address_country: 'US'},
      }),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as {products: Array<{id: string}>};
    expect(body.products[0]?.id).toBe('gid://shopify/Product/16027616018801');
    server.stop();
  });

  test('POST /agents/shopper/product resolves single product with selected option', async () => {
    const server = (await import('../src/server')).default;

    const res = await fetch(`${server.url}agents/shopper/product`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        id: 'gid://shopify/Product/16027616018801',
        selected: [{name: 'Diameter', label: '26 cm'}],
      }),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as {product: {id: string}};
    expect(body.product.id).toBe('gid://shopify/Product/16027616018801');
    server.stop();
  });

  test('missing required fields returns 400', async () => {
    const server = (await import('../src/server')).default;

    const res = await fetch(`${server.url}agents/shopper/query`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({budget_usd: 1000}),
    });

    expect(res.status).toBe(400);
    const body = (await res.json()) as {error: string};
    expect(body.error).toBe('invalid_request');
    server.stop();
  });

  test('empty heat_sources array returns 400', async () => {
    const server = (await import('../src/server')).default;

    const res = await fetch(`${server.url}agents/shopper/query`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        budget_usd: 1000,
        piece_count: 3,
        heat_sources: [],
        use_cases: ['searing'],
      }),
    });

    expect(res.status).toBe(400);
    server.stop();
  });
});

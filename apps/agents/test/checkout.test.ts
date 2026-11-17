import {afterAll, describe, expect, test, mock} from 'bun:test';

const mockCreateCheckout = mock(() =>
  Promise.resolve({
    id: 'gid://shopify/Checkout/test-checkout-id',
    status: 'incomplete',
    currency: 'USD',
    line_items: [],
    totals: [],
    messages: [],
    continue_url: 'https://maison-tavo.myshopify.com/checkout/test',
  }),
);
const mockGetCheckout = mock(() =>
  Promise.resolve({
    id: 'gid://shopify/Checkout/test-checkout-id',
    status: 'incomplete',
    currency: 'USD',
    line_items: [],
    totals: [],
    messages: [],
  }),
);
const mockUpdateCheckout = mock(() =>
  Promise.resolve({
    id: 'gid://shopify/Checkout/test-checkout-id',
    status: 'ready_for_complete',
    currency: 'USD',
    line_items: [],
    totals: [],
    messages: [],
  }),
);
const mockCompleteCheckout = mock(() =>
  Promise.resolve({
    id: 'gid://shopify/Checkout/test-checkout-id',
    status: 'complete_in_progress',
    currency: 'USD',
    line_items: [],
    totals: [],
    messages: [],
  }),
);

import {evaluateCatalog as realEvaluateCatalog, scoreSkuForUseCases as realScoreSku} from '../src/shopper';

mock.module('../src/shopper', () => ({
  ShopperAgent: class {
    query = mock(() => Promise.resolve({id: 'cart_1', currency: 'USD', line_items: [], totals: [], messages: []}));
    search = mock(() => Promise.resolve({products: [], messages: [], pagination: {}}));
    lookup = mock(() =>
      Promise.resolve({
        products: [{id: 'gid://shopify/Product/16027616018801', title: 'Forge Relay Dual-Mass Skillet', variants: []}],
        messages: [],
      }),
    );
    getProduct = mock(() =>
      Promise.resolve({
        product: {id: 'gid://shopify/Product/16027616018801', title: 'Forge Relay Dual-Mass Skillet', variants: []},
        messages: [],
      }),
    );
    createCart = mock(() => Promise.resolve({id: 'cart_1', currency: 'USD', line_items: [], totals: [], messages: []}));
    createCheckout = mockCreateCheckout;
    getCheckout = mockGetCheckout;
    updateCheckout = mockUpdateCheckout;
    completeCheckout = mockCompleteCheckout;
  },
  evaluateCatalog: realEvaluateCatalog,
  scoreSkuForUseCases: realScoreSku,
}));

describe('Checkout lifecycle routes', () => {
  test('POST /agents/checkout creates a checkout', async () => {
    const server = (await import('../src/server')).default;

    const res = await fetch(`${server.url}agents/checkout`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({cart_id: 'gid://shopify/Cart/test'}),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as {id: string; status: string};
    expect(body).toHaveProperty('id');
    expect(body).toHaveProperty('status');
    server.stop();
  });

  test('POST /agents/checkout with missing cart_id returns 400', async () => {
    const server = (await import('../src/server')).default;

    const res = await fetch(`${server.url}agents/checkout`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({}),
    });

    expect(res.status).toBe(400);
    server.stop();
  });

  test('GET /agents/checkout/:id returns checkout', async () => {
    const server = (await import('../src/server')).default;

    const res = await fetch(`${server.url}agents/checkout/test-id`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as {id: string};
    expect(body).toHaveProperty('id');
    server.stop();
  });

  test('PUT /agents/checkout/:id updates checkout', async () => {
    const server = (await import('../src/server')).default;

    const res = await fetch(`${server.url}agents/checkout/test-id`, {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({buyer: {email: 'test@example.com'}}),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as {status: string};
    expect(body).toHaveProperty('status');
    server.stop();
  });

  test('POST /agents/checkout/:id/complete completes checkout', async () => {
    const server = (await import('../src/server')).default;

    const res = await fetch(`${server.url}agents/checkout/test-id/complete`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({payment_token: 'tok_test'}),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as {status: string};
    expect(['complete_in_progress', 'completed', 'requires_escalation']).toContain(body.status);
    server.stop();
  });

  afterAll(() => {
    mock.restore();
  });
});

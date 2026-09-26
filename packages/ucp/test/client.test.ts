import {describe, expect, test} from 'bun:test';
import {Profile, UcpClient, UcpError, mcpEndpoint} from '../src';
import storeProfile from './fixtures/maison-tavo-profile.json';

function fakeFetch(body: unknown): typeof fetch {
  return (async () => Response.json(body)) as unknown as typeof fetch;
}

const agentProfileUrl = 'https://agents.example.com/.well-known/ucp';

describe('Profile', () => {
  test('parses the live Maison Tavo profile', () => {
    const profile = Profile.parse(storeProfile);
    expect(profile.ucp.capabilities['dev.ucp.shopping.checkout']).toBeDefined();
    expect(mcpEndpoint(profile)).toEndWith('/api/ucp/mcp');
  });
});

describe('UcpClient', () => {
  test('reads structured content from a tool result', async () => {
    const client = new UcpClient({
      endpoint: 'https://store.example.com/api/ucp/mcp',
      agentProfileUrl,
      fetch: fakeFetch({
        jsonrpc: '2.0',
        id: 1,
        result: {structuredContent: {products: [{id: 'gid://shopify/Product/1', title: 'Coat'}]}},
      }),
    });

    const result = await client.searchCatalog({query: 'coat'});
    expect(result.products[0]?.title).toBe('Coat');
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

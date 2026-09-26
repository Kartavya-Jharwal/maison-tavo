import type {z} from 'zod';
import {
  Cart,
  CatalogSearchInput,
  CatalogSearchResult,
  Checkout,
  type Context,
  type LineItemInput,
  Profile,
} from './schemas';

export class UcpError extends Error {
  constructor(
    message: string,
    readonly code?: string,
    readonly continueUrl?: string,
  ) {
    super(message);
    this.name = 'UcpError';
  }
}

export async function fetchProfile(
  origin: string,
  fetchImpl: typeof fetch = fetch,
): Promise<Profile> {
  const response = await fetchImpl(new URL('/.well-known/ucp', origin));
  if (!response.ok) {
    throw new UcpError(`Profile fetch failed with HTTP ${response.status}`, 'profile_fetch_failed');
  }
  return Profile.parse(await response.json());
}

export function mcpEndpoint(profile: Profile): string {
  const service = profile.ucp.services['dev.ucp.shopping']?.find(
    (entry) => entry.transport === 'mcp' && entry.endpoint,
  );
  if (!service?.endpoint) {
    throw new UcpError('Business does not advertise a UCP MCP endpoint', 'operation_not_offered');
  }
  return service.endpoint;
}

interface ClientOptions {
  /** MCP endpoint from the business profile. */
  endpoint: string;
  /**
   * Public URL of this platform's `/.well-known/ucp`. The business fetches it
   * on every call, so it must be reachable from the internet.
   */
  agentProfileUrl: string;
  fetch?: typeof fetch;
}

/** Calls a business's UCP tools over MCP JSON-RPC. */
export class UcpClient {
  private nextId = 1;

  constructor(private readonly options: ClientOptions) {}

  static async discover(
    businessOrigin: string,
    agentProfileUrl: string,
    fetchImpl: typeof fetch = fetch,
  ) {
    const profile = await fetchProfile(businessOrigin, fetchImpl);
    const client = new UcpClient({
      endpoint: mcpEndpoint(profile),
      agentProfileUrl,
      fetch: fetchImpl,
    });
    return {profile, client};
  }

  searchCatalog(input: CatalogSearchInput) {
    return this.call('search_catalog', {catalog: CatalogSearchInput.parse(input)}, CatalogSearchResult);
  }

  createCart(lineItems: LineItemInput[], context?: Context) {
    return this.call('create_cart', {cart: {line_items: lineItems, context}}, Cart);
  }

  getCart(id: string) {
    return this.call('get_cart', {id}, Cart);
  }

  /** Update is full-replace: pass every line item the cart should keep. */
  updateCart(id: string, lineItems: LineItemInput[], context?: Context) {
    return this.call('update_cart', {id, cart: {line_items: lineItems, context}}, Cart);
  }

  createCheckout(checkout: Record<string, unknown>) {
    return this.call('create_checkout', {checkout}, Checkout);
  }

  getCheckout(id: string) {
    return this.call('get_checkout', {id}, Checkout);
  }

  /** Update is full-replace: pass the whole checkout, not a patch. */
  updateCheckout(id: string, checkout: Record<string, unknown>) {
    return this.call('update_checkout', {id, checkout}, Checkout);
  }

  completeCheckout(id: string, checkout: Record<string, unknown>) {
    return this.call('complete_checkout', {id, checkout}, Checkout);
  }

  private async call<T extends z.ZodType>(
    tool: string,
    args: Record<string, unknown>,
    schema: T,
  ): Promise<z.infer<T>> {
    const fetchImpl = this.options.fetch ?? fetch;
    const response = await fetchImpl(this.options.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: this.nextId++,
        method: 'tools/call',
        params: {
          name: tool,
          arguments: {meta: {'ucp-agent': {profile: this.options.agentProfileUrl}}, ...args},
        },
      }),
    });

    const payload = (await response.json()) as {
      result?: {structuredContent?: unknown; content?: {type: string; text?: string}[]; isError?: boolean};
      error?: {message: string; data?: {code?: string; content?: string; continue_url?: string}};
    };

    if (payload.error) {
      const {message, data} = payload.error;
      throw new UcpError(data?.content ?? message, data?.code, data?.continue_url);
    }

    const result = payload.result;
    const text = result?.content?.find((part) => part.type === 'text')?.text;
    const body = result?.structuredContent ?? (text ? JSON.parse(text) : undefined);
    if (result?.isError || body === undefined) {
      throw new UcpError(text ?? `${tool} returned no content`, 'tool_error');
    }
    return schema.parse(body);
  }
}

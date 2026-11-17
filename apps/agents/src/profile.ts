import {Profile, UCP_VERSION} from '@maison-tavo/ucp';

const spec = (path: string) => `https://ucp.dev/${UCP_VERSION}/specification/shopping/${path}/`;
const schema = (name: string) => `https://ucp.dev/${UCP_VERSION}/schemas/shopping/${name}.json`;

/**
 * This platform's profile, served at `/.well-known/ucp` for businesses and
 * Shopify's Global / Storefront Catalog MCP servers to fetch on every call.
 *
 * Advertises both `dev.ucp.shopping.catalog.search` and `dev.ucp.shopping.catalog.lookup`
 * so Storefront Catalog MCP exposes `search_catalog`, `lookup_catalog`, and `get_product`.
 */
export const platformProfile = Profile.parse({
  ucp: {
    version: UCP_VERSION,
    capabilities: {
      'dev.ucp.shopping.catalog.search': [
        {version: UCP_VERSION, spec: spec('catalog'), schema: schema('catalog_search')},
      ],
      'dev.ucp.shopping.catalog.lookup': [
        {version: UCP_VERSION, spec: spec('catalog'), schema: schema('catalog_lookup')},
      ],
      'dev.ucp.shopping.cart': [{version: UCP_VERSION, spec: spec('cart'), schema: schema('cart')}],
      'dev.ucp.shopping.checkout': [
        {version: UCP_VERSION, spec: spec('checkout'), schema: schema('checkout')},
      ],
      'dev.ucp.shopping.order': [{version: UCP_VERSION, spec: spec('order'), schema: schema('order')}],
    },
    payment_handlers: {
      shopify_payments: [
        {
          version: UCP_VERSION,
          spec: spec('checkout'),
          schema: schema('checkout'),
        },
      ],
    },
  },
});

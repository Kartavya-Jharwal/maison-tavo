# UCP Discovery & Storefront Catalog MCP — Maison Tavo

This document describes both Shopify's native Storefront Catalog MCP surface on
`maison-tavo.myshopify.com` and Maison Tavo's spec-enriched agent server (`apps/agents/`).

## Catalog Interfaces

| Interface | Scope | Endpoint | Lookup Batch Cap |
| --- | --- | --- | --- |
| **Storefront Catalog MCP** | Single store (`Maison Tavo`) | `https://maison-tavo.myshopify.com/api/ucp/mcp` | Up to **10** IDs |
| **Global Catalog MCP** | Cross-merchant Shopify | `https://catalog.shopify.com/api/ucp/mcp` | Up to **50** IDs |

Every JSON-RPC call (`tools/list` or `tools/call`) must pass `arguments.meta["ucp-agent"].profile`
pointing to a publicly reachable UCP agent profile (`2026-08-25`).

## Local UCP CLI Setup & Storefront Commands

Install `@shopify/ucp-cli` globally and initialize a local agent profile before running
merchant-scoped (`--business`) operations:

```bash
npm install -g @shopify/ucp-cli
ucp doctor
ucp profile init --name agent
ucp doctor
```

Introspect and query Maison Tavo's Storefront Catalog MCP (write untrusted IDs or complex
payloads to a JSON file and pass `--input @payload.json`):

```bash
# 1. Discover merchant UCP capabilities & MCP endpoint
ucp discover --business https://maison-tavo.myshopify.com

# 2. Search storefront catalog
ucp catalog search --business https://maison-tavo.myshopify.com \
  --input '{"query":"skillet","context":{"address_country":"US","intent":"induction searing"}}' \
  --view :compact \
  --format md

# 3. Batch lookup retained Shopify Product or ProductVariant GIDs (max 10 per call)
# lookup.json: {"ids":["gid://shopify/Product/16027616018801"],"context":{"address_country":"US"}}
ucp catalog lookup --business https://maison-tavo.myshopify.com --input @lookup.json

# 4. Get full product details & option availability signals
ucp catalog get_product 'gid://shopify/Product/16027616018801' \
  --business https://maison-tavo.myshopify.com
```

## Maison Tavo Agent Server (`apps/agents/`)

```
GET https://<agent-server>/.well-known/ucp
```

Advertises UCP `2026-08-25` capabilities:
- `dev.ucp.shopping.catalog.search`
- `dev.ucp.shopping.catalog.lookup`
- `dev.ucp.shopping.cart`
- `dev.ucp.shopping.checkout`
- `dev.ucp.shopping.order`

### Spec-enriched Catalog Endpoints

- `POST /agents/shopper/search` — wraps Storefront `search_catalog`
- `POST /agents/shopper/lookup` — wraps Storefront `lookup_catalog` (enforces max 10 IDs)
- `POST /agents/shopper/product` — wraps Storefront `get_product` (`id`, `selected`, `preferences`)
- `POST /agents/shopper/query` — constraint-based query-to-cart evaluator resolving retained GIDs from `data/shopify-id-map.json` + `lookup_catalog`

Matched SKUs receive structured `additionalProperty` entries (`sku`, `lineup`, `claim_status`,
`primary_material`, `lining_material`, `capacity_ml`, `dimensions`, `dishwasher_suitability`,
`microwave_suitability`, `food_contact_suitability`, `care_instructions`, `heat_compatibility`,
`induction_compatible`, `heat_sources`, `material_architecture`, `concept_thesis`, plus Forge
enrichment when present: `quick_summary`, `suggested_use_case`, `handle_configuration`,
`lid_compatibility`, `works_with_kansa`, `pairs_with_care_kit`, `vessel_shape`,
`bundle_components`, `rim_diameter_cm`, `induction_coil_zone_cm`).

Forge Hybrid launch vessels, universal lids and curated sets are discoverable via Storefront
`search_catalog` once published (try queries like `forge frying pan`, `kadhai`, `forge set`).
See [`forge-series.md`](./forge-series.md).

## Shopify Catalog API Usage & Caching Compliance

`packages/ucp/src/schemas.ts` codifies Shopify's UCP Catalog API terms:
- **Shopper experiences only**: No bulk harvesting, ML training, or third-party redistribution.
- **Caching ceilings (`UCP_CACHE_LIMITS_MS`)**:
  - Product metadata & Shopify CDN images: max **24 hours**
  - Price & availability: max **10 minutes**
  - Commission values: **0 ms** (never cache)
- **Attribution integrity**: Preserve `shcgid`, `shclid`, `checkout_url`, and `seller` fields untouched (`hasIntactAttribution()`).

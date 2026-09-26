# Competitor machine-readability audit (M0)

**Date run:** 26 Sep 2026
**Purpose:** Substantiate or puncture the D4 first-mover position — the brief's hypothesis that no
cookware competitor has made its catalog machine-readable for AI agents, defined as *structured,
standardized product data (schema.org/JSON-LD fields for material, dimensions, heat-source
compatibility, and price) that a third-party agent can parse without a human intermediary.*
**Method:** Direct fetches of product detail pages (PDPs), Shopify `/products.json` endpoints,
`/.well-known/ucp` discovery profiles, `/llms.txt` and `/agents.md` agent-instruction files, and one
live UCP MCP `tools/list` + `search_catalog` call against a competitor endpoint. Every claim is
tagged **VERIFIED** (directly observed in a fetch on 26 Sep 2026), **OBSERVED** (pattern across
sites), or **HYPOTHESIS** (inference).

> **Headline:** the D4 claim as originally worded — "no competitor has made a legible shift into
> agentic commerce" — is **punctured at the transaction layer and upheld at the catalog-spec
> layer.** Three of seven competitors (HexClad, Our Place, Smithey) already expose full agentic
> *checkout* via Shopify's native UCP profile. None of the seven exposes cookware *specs*
> (material, dimensions, heat-source compatibility) as structured, agent-parseable fields. The
> claim must be rescoped: see [Verdict](#verdict).

---

## Mauviel — mauviel.com / mauviel-1830.com

- **Platform:** PrestaShop. `mauviel.com` redirects into `www.mauviel-1830.com` (French-first).
  `mauviel1830.com` (no hyphen) did not respond to connection attempts (HTTP 000). **VERIFIED**
- **PDP checked:** `https://www.mauviel-1830.com/fr/m-urban-3/25-2440-poele-en-inox-m-urban-3`
  (M'URBAN 3 stainless frying pan). **VERIFIED**
- **JSON-LD:** Two blocks — `BreadcrumbList` and `Product`. The Product block includes `sku`
  ("5013"), `mpn` ("5013"), **`gtin13` ("3574905013306")**, `brand`, `weight` as a
  `QuantitativeValue` (1.18 kg), and `offers` (price 134 EUR, availability, priceValidUntil).
  **VERIFIED**
- **Material / dimensions / heat source:** Not present as structured fields. "Inox" appears only in
  the product name and prose `description`. Diameter is a URL fragment variant selector
  (`#/diametre-20cm`), not a schema field. No induction/compatibility field anywhere. **VERIFIED**
- **`/.well-known/ucp`:** Returns the homepage HTML (200 catch-all) — no UCP profile. **VERIFIED**
- **Agent surface:** `/llms.txt` returns homepage HTML (catch-all). No agents.md, no MCP endpoint
  observed. **VERIFIED**
- **Note:** Category pages carry `FAQPage` JSON-LD (marketing FAQ), not product specs. **VERIFIED**

## Demeyere — demeyere.be / zwilling.com

- **Platform:** Salesforce Commerce Cloud (Demandware). `demeyere.be` is a brand site; products are
  sold on `zwilling.com` (same Demandware instance, `Sites-zwilling-be-Site`). **VERIFIED**
- **PDP checked:** `https://www.zwilling.com/be-nl/demeyere-silverline-7-bakpan-nanotouch-24-cm-60624/1032981.html`
  (Silverline 7 NanoTouch frying pan, €209). **VERIFIED**
- **JSON-LD:** Three blocks — `FAQPage` (detailed NanoTouch material Q&A, in Dutch), `BreadcrumbList`,
  and `Product`. The Product block includes `sku` ("60624"), **`gtin` ("5412191606247")**, `mpn`,
  `color`, `brand`, `offers` (price, availability), and `isSimilarTo` cross-references. **VERIFIED**
- **Material / dimensions / heat source:** Diameter ("24 cm") is in the product *name* only.
  NanoTouch surface detail exists as FAQ prose, not `additionalProperty` or `material`. No
  structured heat-source field. Demeyere's signature feature (induction-optimized multi-ply bases)
  is not machine-readable anywhere on the page. **VERIFIED**
- **`/.well-known/ucp`:** `demeyere.be` returns homepage HTML (catch-all); `zwilling.com` returns
  **HTTP 410 Gone**. No UCP profile. **VERIFIED**
- **Agent surface:** `/llms.txt` returns homepage HTML on demeyere.be; 410 on zwilling.com. No
  agent-facing surface observed. **VERIFIED**

## HexClad — hexclad.com

- **Platform:** Shopify (`hexclad-cookware.myshopify.com`). **VERIFIED**
- **PDP checked:** `https://hexclad.com/products/damascus-steel-knife-set-7-pc-blonde`. **VERIFIED**
- **JSON-LD:** Four blocks — two `WebSite`, one `Product`, one `BreadcrumbList`. The Product block
  is **stock Shopify**: `name`, `image`, `description`, `sku`, `brand`, `offers` (price,
  priceCurrency, availability, seller). **No GTIN, no MPN, no material, no dimensions, no
  `additionalProperty`** — despite the product being a 67-layer Damascus construction whose layer
  count appears only in prose. **VERIFIED**
- **`/products.json?limit=1`:** Open. Stock Shopify fields only: `title`, `handle`, `body_html`
  (prose), `vendor`, `product_type`, `tags` (marketing tags like "Daily Report -Martha"), variant
  `sku`/`price`/`grams`. No barcode/GTIN, no spec fields. **VERIFIED**
- **`/.well-known/ucp`:** **Full UCP profile, HTTP 200.** Version `2026-08-25` (plus 2026-04-08 and
  2026-01-23), `dev.ucp.shopping` service over MCP transport at
  `https://hexclad-cookware.myshopify.com/api/ucp/mcp`. Capabilities: `checkout`, `fulfillment`,
  `discount`, `cart`, `order`, `catalog.search`, `catalog.lookup`, `dev.shopify.catalog`,
  `identity_linking`. Payment handlers: Google Pay, Shopify card, Shop Pay. **VERIFIED**
- **Live MCP probe:** `tools/list` against `https://hexclad.com/api/ucp/mcp` returned 13 tools:
  `search_catalog`, `lookup_catalog`, `get_product`, `create/get/update/cancel_cart`,
  `create/get/update/complete/cancel_checkout`, `get_order`. A `search_catalog` call for
  *"induction compatible frying pan"* succeeded and returned products — but each product carries
  only generic fields (`title`, `description.html`, `price_range`, variants with `sku`/price/
  `checkout_url`, Shopify taxonomy category gid, marketing `tags`). **Induction compatibility
  appears only inside description prose** ("induction-safe thanks to its magnetic steel base").
  Zero occurrences of `material`, `induction`, `heat`, `dimension`, `gtin`, `mpn`, `weight`, or
  `metafield` fields in the response. **VERIFIED**
- **Agent surface:** `/agents.md` returns Shopify's agent-instructions template (Shop skill +
  UCP flow). `/llms.txt` is 404 (template not mirrored on this store). **VERIFIED**

## Our Place — fromourplace.com

- **Platform:** Shopify (`fromourplace-com.myshopify.com`). **VERIFIED**
- **PDP checked:** `https://fromourplace.com/products/walnut-knife-block`. **VERIFIED**
- **JSON-LD:** Two blocks, emitted by the **SchemaPlus app** (third-party SEO app). The Product
  block is the richest observed among Shopify competitors: **`gtin12` ("810142480345")**, `mpn`,
  `weight` (`QuantitativeValue`, 6.7 LBR), `category`, `itemCondition`, `inventoryLevel`,
  `priceSpecification`, plus an `additionalProperty` array — **but the `additionalProperty` entries
  are junk**: "Tags" (internal Shopify tags) and "Title" ("Default Title"). No material, no
  dimensions, no heat source. **VERIFIED**
- **`/products.json?limit=1`:** Open; stock Shopify fields only. **VERIFIED**
- **`/.well-known/ucp`:** **Full UCP profile, HTTP 200** — same Shopify-native capability set as
  HexClad (checkout, cart, order, catalog search/lookup, fulfillment, discount, identity linking;
  payment handlers). **VERIFIED**
- **Agent surface:** `/llms.txt` **and** `/agents.md` both serve Shopify's agent-instructions
  template ("# Agent Instructions - Our Place"), documenting the UCP discovery + MCP flow, the
  Shop skill, read-only JSON endpoints, and store policies. **VERIFIED**

## Smithey — smithey.com

- **Platform:** Shopify (`smithey-iron-ware.myshopify.com`). **VERIFIED**
- **PDP checked:** `https://smithey.com/products/factory-second-no-10-chef-skillet`. **VERIFIED**
- **JSON-LD:** One block — stock Shopify `Product`: `name`, `url`, `image`, `description`, `sku`,
  `brand`, `offers`. **No GTIN, no MPN, no material, no structured dimensions.** The pan's
  dimensions (diameter 10", depth 1.6", handle-to-handle 17.25", weight ±4.75 lbs) exist only as
  prose inside the `description` string. **VERIFIED**
- **`/products.json?limit=1`:** Open; stock fields. Dimensions again only inside `body_html` prose.
  **VERIFIED**
- **`/.well-known/ucp`:** **Full UCP profile, HTTP 200** — same Shopify-native capability set.
  **VERIFIED**
- **Agent surface:** `/llms.txt` and `/agents.md` serve the Shopify agent-instructions template.
  **VERIFIED**

## Made In — madeincookware.com

- **Platform:** Headless — Next.js on Vercel front end (`data-dpl-id`, `/_next/static`), Shopify
  backend (product images served from `cdn.shopify.com`). **VERIFIED**
- **PDP checked:** `https://madeincookware.com/products/stainless-clad-frying-pan` (resolves to
  `/products/stainless-steel-frying-pan/6-inch`). **VERIFIED**
- **JSON-LD:** One `@graph` block: `Organization`, `WebSite`, and `Product` with
  `aggregateRating` (4.8, 9,629 reviews), individual `review` entries, `brand`, `offers` (sku
  "COOK-6-FRY-ISS", price, currency, availability, eligibleRegion). **No GTIN, no MPN, no material,
  no dimensions, no `additionalProperty`** — for a product whose entire brand pitch is multi-ply
  clad construction. **VERIFIED**
- **`/products.json`:** HTTP 403 (edge bot protection). The custom domain does not expose the
  Shopify JSON endpoint. **VERIFIED**
- **`/.well-known/ucp`:** HTTP 200 but returns the Next.js catch-all HTML page — **no UCP profile**.
  Going headless cost them Shopify's native UCP surface. **VERIFIED**
- **Agent surface:** `/llms.txt` is a **custom, non-Shopify document** ("# Made In Cookware —
  Curated roadmap for AI assistants to highlight key pages") listing collections and key URLs —
  read-only navigation only, no transaction or spec data. `/agents.md` returns the Next.js
  catch-all HTML (not a real document). **VERIFIED**

## Borough Furnace — boroughfurnace.com

- **Platform:** Square Online (Weebly/`editmysite.com` assets, `generator: Square Online`).
  **VERIFIED**
- **PDP check:** Not possible via fetch — the storefront is fully JS-rendered; the served HTML
  (homepage and `/s/shop`, both HTTP 200) contains **no server-rendered product links and zero
  JSON-LD blocks**. Product data loads client-side from Square's APIs. A human with a browser could
  inspect further; from an agent's perspective the served document is a blank shell. **VERIFIED**
- **`/products.json`:** HTTP 404 (not Shopify). **VERIFIED**
- **`/.well-known/ucp`:** HTTP 404. **VERIFIED**
- **Agent surface:** `/llms.txt` HTTP 404. None observed. **VERIFIED**

---

## Summary table

All cells VERIFIED by direct fetch on 26 Sep 2026 unless noted.

| Competitor | JSON-LD Product on PDP | GTIN / MPN | Material + dims structured | Heat-source structured | `/.well-known/ucp` | Agent surface |
| --- | --- | --- | --- | --- | --- | --- |
| **Mauviel** | Yes (PrestaShop default) | **gtin13 + mpn** | No (weight only) | No | No (catch-all HTML) | None |
| **Demeyere** | Yes (+ FAQPage) | **gtin + mpn** | No (color only) | No | No (410 on zwilling.com) | None |
| **HexClad** | Yes (stock Shopify) | No | No | No (prose only) | **Yes — full profile, MCP, payments** | agents.md (Shopify template) |
| **Our Place** | Yes (SchemaPlus, enriched) | **gtin12 + mpn** | No (weight only; `additionalProperty` = junk) | No | **Yes — full profile** | llms.txt + agents.md (Shopify template) |
| **Smithey** | Yes (stock Shopify) | No | No (dims in prose) | No | **Yes — full profile** | llms.txt + agents.md (Shopify template) |
| **Made In** | Yes (custom, + reviews) | No | No | No | No (Next.js catch-all) | Custom llms.txt (read-only nav) |
| **Borough Furnace** | None in served HTML | No | No | No | No (404) | None |

**OBSERVED patterns:**

1. **Agentic *transaction* rails are commoditized.** Every Shopify store checked exposes an
   identical, platform-generated UCP profile (checkout, cart, order, catalog search/lookup,
   fulfillment, discount, identity linking, Google Pay / card / Shop Pay handlers) and the same
   agent-instructions template. This is Shopify infrastructure, not brand initiative — HexClad,
   Our Place, and Smithey have done **zero visible brand-level work** beyond keeping the platform
   defaults on. (Their marketing tags and "Default Title" placeholders leak straight into the
   agent-facing data.)
2. **Agentic *catalog depth* is absent everywhere.** Across all seven competitors, no
   machine-readable field for material/alloy, dimensions (beyond Mauviel/Our Place weight), or
   heat-source compatibility exists in any surface — not JSON-LD, not `/products.json`, not the
   UCP catalog (probed live against HexClad). Induction compatibility — the single most
   agent-relevant cookware attribute — appears only as unstructured prose.
3. **GTIN is partially closed.** Three of seven (Mauviel, Demeyere, Our Place) expose GTIN/MPN in
   JSON-LD via platform defaults or an SEO app. This is table stakes, not differentiation.
4. **Platform choice determines agent exposure.** Shopify-hosted → full UCP for free. Headless
   (Made In) → loses UCP, keeps a hand-written llms.txt. Salesforce/PrestaShop/Square → nothing.

## Verdict

**The D4 claim does not hold as worded, and must be rescoped before it appears in any copy.**

- **Punctured (VERIFIED):** "No competitor has made a legible shift into agentic commerce."
  HexClad, Our Place, and Smithey are *already transactable by agents* today — discovery, catalog
  search, cart, checkout, and payment handlers, live and probed. Any copy claiming Maison Tavo is
  "the first agent-native cookware brand" without qualification is falsifiable by anyone with
  `curl`.
- **Upheld (VERIFIED):** No competitor — including the three with UCP — exposes the *cookware spec
  layer* (material/alloy, layer stack, dimensions, heat-source compatibility, thermal properties)
  as structured, standardized, agent-parseable data. The UCP catalog schema itself carries no such
  fields, and no brand has extended it. An agent can *buy* a HexClad pan but cannot *reason* about
  it: the brief's proof query ("5-piece set under $1,800 suitable for induction searing and clay
  slow-cooking") is unanswerable against every competitor's machine-readable surface.
- **Scoped claim (recommended):** *"First in cookware to make the product spec layer
  machine-readable — agentic checkout is already table stakes on Shopify; agentic understanding is
  the open gap, and Maison Tavo is first to close it at this depth."* This is defensible per this
  audit; the unqualified "first in agentic commerce" is not.
- **HYPOTHESIS:** Because UCP is a Shopify platform default, competitors gain it passively and most
  likely do not know they have it. The first brand to *advertise* and *deepen* agent
  interoperability still captures the first-mover narrative — but the window is narrative, not
  technological, and it will close as Shopify's catalog schema absorbs more vertical attributes.

## Implications for the Maison Tavo catalog spec schema

Ranked by differentiation value against what this audit found:

1. **Heat-source compatibility as an enumerated, structured field** (`specs.heat_sources`:
   induction / gas / electric / oven, with max temperatures). The single most agent-relevant
   cookware attribute; absent from all seven competitors in machine-readable form. This is the
   field that makes the M2 proof query answerable.
2. **Alloy composition + layer stack** (`specs.alloy`, layer stack as flagged fabrication
   assumption per D5). HexClad's "67 layers" and Demeyere's "7-ply" exist only in marketing prose;
   a parseable layer stack is unclaimed territory and the core of the technologist persona (D3).
3. **Dimensions as typed values** (`specs.dimensions`: diameter, depth, capacity, weight as
   `QuantitativeValue` with unit codes) — emitted both as metafields and as JSON-LD
   `additionalProperty`. Smithey proves even basic dims live in prose; Mauviel/Our Place show
   weight alone is achievable via defaults.
4. **GTIN on every variant barcode.** Three competitors already have this — it is table stakes,
   not differentiation, and its absence would be a *disadvantage*.
5. **Thermal conductivity + care/seasoning rules + warranty tier** as metafields. No competitor
   surface touches these; they feed the Kansa thermal calculator (D6) and the QR onboarding flow,
   not just the agent layer.
6. **Expose the spec layer where Shopify's UCP cannot.** OBSERVED: Shopify's native UCP catalog
   response carries no metafields and no spec fields — so populating metafields alone does **not**
   close the gap on the agent surface. Differentiation requires (a) enriched JSON-LD
   `additionalProperty` on the PDP (M4 marker), and (b) the Maison Tavo agent layer
   (`apps/agents`) answering spec-constrained queries against `packages/catalog` directly. The
   catalog spec schema is therefore the *only* surface where Maison Tavo can be deeper than a
   stock Shopify store — it should be treated as the load-bearing artifact of the first-mover
   claim.
7. **`/llms.txt` and `/agents.md` beyond the template.** The Shopify template is commoditized;
   Maison Tavo's agent-instructions document should additionally document the spec schema itself
   (what an agent can learn per product: alloy, heat sources, thermal data, care), so the
   agent-facing copy plan (M2 discovery marker) advertises depth competitors' templates cannot.

*Audit limitation note:* Borough Furnace's JS-rendered Square Online storefront could not be
PDP-inspected without a browser; findings for it are limited to served-HTML inspection (no JSON-LD,
no UCP, no llms.txt). A manual browser pass is a valid follow-up but is unlikely to change the
verdict, given Square Online has no known UCP or structured-spec capability.

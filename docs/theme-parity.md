# Theme route & semantic parity

The live storefront is the customized Horizon theme in [`../theme`](../theme). Hydrogen remains a read-only semantic reference until mid-December 2026 — do not edit it while closing parity gaps.

This document tracks which Hydrogen route behaviours are now expressed as native Shopify Liquid surfaces, and where the two intentionally differ.

## Route matrix

| Hydrogen route | Liquid surface | Status |
| --- | --- | --- |
| `/` | `templates/index.json` | Native |
| `/collections` | `templates/list-collections.json` → `maison-lineups` | Native + breadcrumbs + `CollectionPage` |
| `/collections/:handle` | `templates/collection.json` + `main-collection` | Native filters/sort/pagination + breadcrumbs + `CollectionPage`/`ItemList` |
| `/products/:handle` | `templates/product.json` + `product-information` | Native variants/cart + breadcrumbs + enriched `Product` JSON-LD |
| `/search` | `templates/search.json` + `search-header`/`search-results` | Products + pages + articles, h1, breadcrumbs, `SearchResultsPage` |
| `/cart` | `templates/cart.json` + `main-cart` | Native cart forms + breadcrumbs |
| `/pages/:handle` | `templates/page*.json` + `main-page`/`maison-*` sections | Native + breadcrumbs + `WebPage` |
| `/policies/:handle` | `page` template + `main-page` | Policy body via `page`, `maison-policy-nav` from `shop.policies`, `WebPage` |
| `/blogs/:blog` | `templates/blog.json` + `main-blog` | Native + breadcrumbs + `Blog` |
| `/blogs/:blog/:article` | `templates/article.json` + `main-blog-post` | Native comments + breadcrumbs + Shopify `Article` JSON-LD |
| `*` | `templates/404.json` + `main-404` | Semantic 404: h1, native search, route links, room suggestions |
| `/account*` | `<shopify-account>` in `header-actions` | Modern customer accounts (see below) |
| `/agents.md`, `/llms.txt`, `/llms-full.txt` | `templates/agents.md.liquid`, `llms.txt.liquid`, `llms-full.txt.liquid` | Raw agent manifest via `maison-agent-manifest` |
| `/robots.txt` | `templates/robots.txt.liquid` | Native + explicit AI crawler declarations |

## Semantic contract

Emitted globally from `layout/theme.liquid`:

- `snippets/meta-tags.liquid` — canonical, robots (`noindex` on performed search, cart, 404, password), Open Graph, product and article OG fields, Twitter cards, image alt text.
- `snippets/maison-seo-graph.liquid` — `Organization` + `WebSite` + `SearchAction`, with social `sameAs` links when configured.
- `snippets/maison-route-jsonld.liquid` — `CollectionPage`, `CollectionPage`/`ItemList`, `Blog`, `WebPage`, `SearchResultsPage`, and home `WebPage`. Product and Article are skipped here because Shopify's `structured_data` already emits them.
- `snippets/maison-breadcrumbs.liquid` — one accessible visible trail plus a matching `BreadcrumbList`; used on product, collection, collection list, blog, article, page (including policies), search, cart, and 404.
- `snippets/maison-policy-nav.liquid` — `shop.policies` navigation, with `aria-current` on the active policy.
- `sections/maison-room.liquid` — `FAQPage` JSON-LD when rendered through the `faq` template suffix.

## Deliberate omissions

`templates/customers/*` is not implemented. Shopify deprecated legacy customer account templates; publishing a theme without them automatically upgrades the store to the theme-independent customer accounts experience. Customer sign-in and account navigation are handled by the `<shopify-account>` web component in `snippets/header-actions.liquid`. Adding those templates would downgrade the store back to legacy accounts.

Hydrogen's `/policies` index has no direct Shopify equivalent. Policy discoverability is covered by `maison-policy-nav` on policy pages and the footer, and policy bodies render through the `page` template.

## Verification

```bash
bun run theme:check
bun run theme:lint
bun run theme:build   # only needed after scripts/src changes
```

Known pre-existing `theme:check` errors: missing splash/globe media assets and the `actions.skip_to_content` translation key. They are unrelated to parity work.

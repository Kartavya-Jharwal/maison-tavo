# Maison Tavo — current-state audit

Audit date: 2 November 2026. Scope: local working tree, catalog inputs, theme implementation, documentation, and local package checks. This is not a live-store or rendered visual audit. Existing uncommitted work was included as evidence and preserved.

**Context added after the source audit:** the founder supplied the full engagement brief, original assortment direction (21–28 SKUs in three categories), approximately 25-product target, A2/A3 dates, October pitch history and a reported ~45% mocked integration. These are attributed project inputs, not new code or live-store verification. See the [brand explanation](maison-tavo.md) and [full register](programme-register.md). The brief is no longer a missing input; its claims and the original source artifacts still need reconciliation with current implementation.

## The governing thesis

Maison Tavo is a brand a machine can **find, understand and negotiate for**, built on kansa (bell metal), where the tool is sacred.

The primary product is a deeply designed kitchenware store on Shopify. Kansa is a separate companion microtool. The source of truth, imagery, schematics and commerce protocol prove the same thesis. The [integrated roadmap](experience-roadmap.md) replaces the previous agent-first sequencing without discarding its supporting engagement deliverables.

## Evidence rules

- **Implemented:** a relevant source artifact exists; this does not imply deployed or visually approved.
- **Partial:** a foundation exists but acceptance requires further work.
- **Unverified:** historical documentation makes a claim that this audit has not reproduced.
- **Missing in inspected scope:** no implementation found in the relevant workspace or template inventory.
- **Passed locally:** a command was run successfully during this audit.

No overall percentage is assigned: source presence, visual quality, catalog completeness and operational readiness are different measures.

## Populated audit register

| Area | Evidence | Finding | Next acceptance evidence |
| --- | --- | --- | --- |
| Live architecture | `theme/AGENTS.md`, root README | Customized Horizon/Liquid is the production surface. Hydrogen is an Oxygen preview. | Continue custom work in theme; preserve Shopify product forms, cart and checkout. |
| Brand tokens | `theme/STYLEGUIDE.md`, settings schema, token-emitting snippets | Partial: palette and semantic mapping documented; current typography is Libre Baskerville / Inter / Anonymous Pro. | Verify token file coverage and generated consumption across theme, MkDocs and deck; spacing/motion/component audit. |
| Splash | `theme/snippets/splash-intro.liquid` | Implemented foundation: dialog, entry button, duration, storage choice, reduced-motion detection, cart exclusion. | Keyboard/focus, failure recovery, repeat visit, mobile and art-direction review. Presence is not an award-level approval. |
| Animation runtime | `theme/scripts/src/maison-runtime.js`, `theme/package.json` | Motion and vanilla Zustand are bundled. Three.js is not a declared theme dependency. | One material-led 3D proof with measured loading and static fallback. |
| Homepage | `theme/templates/index.json` | Branded heading and kitchenware copy exist. Full media population and composition remain unverified. | Page-by-page content and image manifest; desktop/mobile review. |
| Store templates | `theme/templates/` | Home, collection, product, search, cart, password, About, story, contact and legal templates exist. Dedicated FAQ and Kansa templates absent from inspected inventory. | Route/template assignment inventory, completed FAQ and companion entry path. |
| Product specifications | `theme/blocks/maison-spec-table.liquid` | Spec presentation foundation exists. | Render all fields and missing-data states against actual products. |
| Structured product data | `theme/snippets/maison-product-jsonld.liquid` | Custom JSON-LD includes claim status and material/care fields. | Validate rendered output, duplicate Product entities, currencies, variants and availability parity. |
| Catalog inputs | Three `data/maison-tavo-new-listings-*.csv` files | 11 concept SKUs across Terre Clay, Forge Hybrid, Forge × Terre and Kuro Strip. This is not the requested 25-record assortment. | Reconcile with original assortment; retain, revise or archive each concept; source missing records without invented products. |
| Catalog schema | `packages/catalog/src/schema.ts` | Zod schema carries identity, concepts, materials, risks, tests, intents, constraints and references. | Add surface tags, field-level evidence, pronunciation, negotiation rules and JSON Schema contract. |
| Catalog projections | `packages/catalog/scripts/build-seed.ts`, `src/shopify.ts`, `scripts/push-catalog.ts` | Seed and Shopify tooling exist. Complete one-command multi-surface generation is not established. | Single deterministic build with manifest and cross-surface parity tests. |
| Publication state | Existing roadmap versus source CSV | Old roadmap claims all 11 published; CSV rows are draft. These can coexist but do not prove current admin state. | Read-only live reconciliation by SKU, variant ID, publication, inventory and media. |
| Imagery | CSV includes `Product image URL`, alt text and variant media columns | Source sample has blank image URLs; product renders are described in alt text. Complete asset coverage not established. | T13 asset/license manifest and per-SKU image-bar pass. |
| Existing microapp | `theme/scripts/src/lookbook.js`, `maison-microapp` section | Reusable island scaffolding exists, but the inspected content is fashion/cloth/silhouettes, not kitchenware Kansa. | Reuse infrastructure only after replacing unrelated content and defining product-specific behavior. |
| Voice | `theme/sections/maison-voice-spike.liquid` | Spike exists; no completed Kansa application demonstrated. | Text-first companion flows and evidence-backed answers; optional voice parity. |
| UCP library | `packages/ucp/src/client.ts`, `schemas.ts` | Discovery, catalog/cart and checkout client scaffolding exists. | Current profile/version compatibility and lifecycle integration tests. |
| Agent app | `apps/agents/src/shopper.ts`, `server.ts` | Search and create-cart routes exist. Shopper is a thin UCP wrapper; no constraint-solving negotiation engine in inspected code. | Deterministic constraint/rules evaluation with refusal and handoff cases. |
| Schematics | Catalog risks, material architecture and prototype tests | Written engineering intent exists; no complete per-SKU drawing system established. | Versioned schematic manifest and reviewed geometry for every launch SKU. |
| Documentation | `docs/roadmap.md`, `decisions.md`, MkDocs config | Substantial history exists; some completion language and technology notes are stale. | Integrated roadmap and explicit evidence ledger; correct headless description and obsolete sequencing. |
| Package health | `bun run typecheck`; `bun test packages apps` | Passed: catalog/UCP/agents typechecks; 9 tests, 0 failures, 111 assertions. | Add semantic parity, negotiation and live integration coverage as those features are built. |

## Important corrections to inherited planning

1. The old roadmap says no theme build step and vendored libraries; the current theme has a Bun build and Motion/Zustand source modules.
2. Its font milestone describes multiple variable fonts; the current style guide describes static Libre Baskerville 400/700/italic loading. Verify actual font properties before claiming variable-font engineering.
3. “M2 Phase 0 complete” is not evidence of complete query-to-cart reasoning or payments: its key acceptance items are unchecked and the server exposes only search/cart routes.
4. The product schema does not yet implement the full material-layer/performance/warranty structure implied by some roadmap prose. Much of this remains free text.
5. A fixture test named “parses the live Maison Tavo profile” is a local test, not a fresh live availability check.
6. A historical competitor sample cannot substantiate an enduring category-wide “first” claim. Use the demonstrable thesis and publish dated evidence instead.
7. The 25-SKU, kansa-led brief and the 11 mixed-material concept additions must be reconciled. Neither should silently overwrite the other.

## Remaining audit passes

- Read-only Shopify inventory: products, variants, collections, menus, pages, template assignments, media, market currency, stock, publication and policy configuration.
- Visual inventory: password, first visit, returning visit, Home, Collections, all product families, About, FAQ, search, cart and Kansa entry; desktop and mid-range mobile.
- Reference inventory: collect the user's actual visual references and annotate composition, typography, motion, material rendering and transferable principles.
- Asset audit: source files, licences, render status, crop/grade, geometry, texture budgets and missing views.
- Runtime audit: theme check/build, console/network, accessibility, keyboard, reduced motion, slow connection and WebGL failure. No Lighthouse score is claimed by this source audit.
- Delivery audit: locate the complete engagement brief and original 25-SKU list; keep unresolved inputs visible in the register.

## Immediate order

Reconcile assortment and references → lock the visual system → populate one complete representative product journey → propagate to every family and SKU → prove Kansa and machine-readable parity → finish the award-level interaction and operational acceptance gates together.

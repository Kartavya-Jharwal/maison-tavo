# Maison Tavo — integrated experience roadmap

Updated 2 November 2026. Governing direction: **a bespoke, award-level kitchenware store built on Shopify, with a separate Kansa companion microtool**. This is one product programme; the launch checkpoints and deeper experience work share the same design system, catalog and acceptance gates.

Expanded programme: [brand explanation](maison-tavo.md), [complete thread register](programme-register.md), [dated delivery plan](delivery-plan.md), [design specification](design.md), [architecture/readiness](architecture.md), and [research/proof](research-and-proof.md). All source documents live in `docs/`; generated build output is disposable.

The supplied engagement brief and November planning context now form the scope baseline. A2 is due 15 November 2026 and A3 16 December 2026. Public MkDocs is the landing/case-study front door; the custom Shopify development store remains behind a designed password gate. Kansa is a separately named companion and negotiating-agent concept with a simulated current implementation and future API wiring.

> Maison Tavo is a brand a machine can find, understand and negotiate for, built on kansa (bell metal), where the tool is sacred.

The [current-state audit](project-audit-2026-11-02.md) is the baseline. Historical checkboxes in [the engagement roadmap](roadmap.md) remain supporting records, not proof of live completion. Awwwards Site of the Year is the creative ambition, not a promised outcome.

## 1. Programme rules

- Lead with the kitchenware, its material presence and the custom theme. Make technical depth discoverable through the object.
- Every memo/video thread must explain in one sentence how it proves the thesis. Keep useful supporting work in the register even when it does not belong in the presentation.
- Keep Horizon's Liquid/Shopify commerce scaffolding; build bespoke sections, product narratives, typography, motion and selective 3D on top. Hydrogen remains secondary.
- Build Kansa as a separate application surface from the beginning, sharing data and tokens. A theme entry page may link or embed it; its backend and lifecycle do not belong inside theme scripts.
- Keep concept intent distinct from measured specifications. Kansa, product pages, drawings and agent output must preserve the same uncertainty.
- Track states as planned, implemented, verified in preview, live-verified. A task only changes state with a linked artifact or recorded check.
- No production publication is performed as part of this planning work.

## 2. Thread register and thesis map

T01, T02, T03 and T13 retain the earlier shorthand. The complete supplied B/C/S/M/R/D/L/Q/F/O/X register is now maintained in [programme-register.md](programme-register.md), including cross-mapping and acceptance evidence.

| Thread | Thesis proof | Deliverable | Current state |
| --- | --- | --- | --- |
| T01 Brand identity | The material, language and ritual make the sacred-tool idea recognizable. | Shared tokens, voice guide, 150-word kansa story, bell ritual. | Partial |
| T02 Source of truth | One product fact remains consistent when read by a person, assistant or commerce system. | 25 validated records and deterministic multi-surface generation. | Partial; 11 concept additions found |
| T13 Imagery | Consistent, truthful depictions make material and construction legible. | Licensed asset pipeline and per-SKU image bar. | Coverage unverified |
| T03 Shopify store | The complete kitchenware experience makes the thesis tangible and shoppable. | Custom password/Home/Collections/Product/About/FAQ plus search/cart. | Scaffold and custom foundations exist |
| Kansa companion | A product can explain itself and guide an appropriate next action. | Separate text-first AI mockup microtool with optional voice. | Spike/island infrastructure only |
| Product schematics | Construction, interfaces and limits are understandable beyond advertising. | Every-SKU schematic pack linked to canonical evidence. | Textual concept foundation |
| UCP and negotiation | A machine can discover an appropriate object and propose terms within explicit limits. | Versioned protocol integration, policy evaluation, human checkout handoff. | Client/search/cart scaffold |
| Proof and handoff | The thesis can be independently checked and maintained. | Diagnosis, reproducible demo, memo/video evidence and runbooks. | Existing docs; refresh required |

## 3. T01 — art direction and a shared design system

### Reference-led direction

Create a reference register before approving new visual treatments. For each supplied reference record URL, captured date, specific scene, why it works, intended Maison Tavo adaptation, mobile behavior and production cost. Group references by editorial composition, product presentation, typography, transition, 3D material, navigation and sound. Reference possession is currently an input gap; do not substitute arbitrary luxury-site conventions for the user's references.

Develop three coherent direction boards, then choose one through a complete Home-to-PDP prototype. Each includes a static mobile view, a splash storyboard, material study, type hierarchy and interaction rationale. The chosen direction must feel like kitchenware rather than fashion or a generic technology demo.

### Token contract

Extend the existing `theme/brand/tokens.json` foundation after inventorying it. Define primitive → semantic → component tokens for color, type, spacing, grid, content width, borders, elevation, motion, focus and sound preference. Generate theme-compatible values and docs/deck exports from one versioned contract.

- Spacing: define a small base scale, fluid section spacing, mobile gutters, card gaps and editorial exceptions with named purpose.
- Typography: display, editorial heading, body, caption, specification and interface roles; fluid sizes with explicit line-height, measure and tracking.
- Color: distinguish brand palette from accessible foreground/background pairings and evidence/status colors.
- Motion: durations, easings, stagger limits, reduced-motion substitutions and section entrance rules.
- Components: header, buttons, form fields, product card, spec row, evidence badge, media controls, dialogs and companion messages.

Acceptance: a token change propagates to the theme, MkDocs and deck export; no duplicated palette or unexplained spacing values in new components. Verify contrast and font loading in real rendered states.

### Voice and ritual

Deliver a one-page voice guide and precisely 150-word kansa story. Distinguish material heritage from claims about a particular SKU: mixed-material concepts are not automatically bell-metal products. The bell ritual should communicate attention to the tool: short visual resonance, optional recorded sound, silent default, clear entry control and a reduced-motion equivalent. Document recording rights and playback behavior. Sound never gates entry or shopping.

## 4. T02 — the product source of truth

### Reconcile before expanding

Inventory the original 25-product assortment against the 11 concept additions using stable SKU and handle mappings. For each record decide retain, merge, revise, supporting concept, or archive. Identify the care kit and category heroes explicitly. Missing records remain missing; do not invent fourteen products or assume the eleven are a subset of twenty-five.

### Superset contract

Each field needs a type, unit where applicable, surface tags (`human`, `agent`, `voice`, `commerce`), evidence status, source, review date and null/unknown behavior. Group fields as follows:

- Identity: SKU, canonical ID, handle, title, family, category, options, variant mappings, identifiers.
- Material/layers: component IDs, alloy/composition where verified, layer order, food-contact role, finish, joinery and replaceable parts.
- Performance: measured quantities, conditions, method, uncertainty and limitations; concept targets separately represented.
- Compatibility: heat sources, excluded uses, component-specific constraints and supporting evidence.
- Care/safety: cleaning, storage, seasoning where appropriate, warnings, inspection and repair.
- Provenance: manufacturer/source, process, location claims, licences and evidence references.
- Narrative: short/long copy, material story, intended use and accessible image descriptions.
- Voice: pronunciation, language, spoken descriptions and escaped SSML.
- Commerce: price currency, availability, shipping classes, returns, warranty and sellable status.
- Negotiation: allowed bundles, minimum quantity, discount bounds, eligibility, expiry, escalation and reasons for refusal. Internal price floors must not leak into public projections.
- Schematics/media: revision, view IDs, dimensions, geometry source, image status and publication eligibility.

Use explicit unknowns rather than false defaults, especially for induction compatibility and safety. Extend the current Zod schema with a versioned JSON Schema export and migration policy.

### One-command generation

Implement a future `catalog:build` command that validates inputs, resolves references, generates Shopify CSV/metafield payloads, JSON-LD data, `llms.txt`, SSML and public/private agent projections, then emits a checksum manifest. Generation and live publication remain separate operations. JSON-LD prices and stock must resolve against current Shopify data at render time; build artifacts must not freeze changing commerce facts.

Acceptance: all 25 approved records validate; duplicate SKU/handle and invalid units fail; changing one representative fact updates every permitted projection; private rules remain private; repeated builds are deterministic. `llms.txt` is a supplementary document, not proof of discoverability or UCP support.

## 5. T13 — imagery and product asset production

Create one asset manifest keyed by SKU, variant and view. Record source, licence, attribution, creator, source file, generated/photographed/rendered status, crop, grade, background, revision, alt text, dimensions and approval.

Define a common image treatment: controlled neutral background, consistent shadow/contact, repeatable camera families, believable material scale and a restrained grade. Editorial environments can vary deliberately while product identification stays consistent.

Per-SKU image bar:

1. Primary object view with correct shape and materials.
2. Secondary/profile view and detail of the defining interface.
3. Scale/use context that does not imply unsupported performance.
4. Construction/schematic view with visible concept status when relevant.
5. Mobile crop and responsive exports; no embedded essential text.
6. Rights, alt text, variants and visual-to-spec parity approved.

A SKU becomes live only after passing this bar and its product-data gate. AI concept imagery may explore appearance; it is not evidence of manufacture or dimensionally reliable engineering.

## 6. T03 — the custom kitchenware store

### Page and interaction specification

| Surface | Intended experience | Completion gate |
| --- | --- | --- |
| Password | Finished invitation into the world, material detail and brand voice. | Keyboard/mobile/slow-network states complete; clear legitimate entry path. |
| Splash | Brief bell/material ritual flowing into the hero. | Immediate skip, session behavior, focus recovery, no blocked cart/deep links, resilient failure fallback. |
| Home | Monumental object → material thesis → category journeys → construction proof → Kansa → assurance. | Every section populated with approved assets and a useful next action. |
| Collections | Editorial family identity and fast product comparison. | Product type, use, material and availability legible; filters match real catalog data. |
| Product | Hero object, price/status, purchase action, construction, specs, care and provenance. | All variants and missing-data states work; claims match canonical source; clear concept status. |
| About | Diagnosis of current assistant representation, material story and proof of the response. | Dated prompts/results and boundaries; no unsupported industry-first claims. |
| FAQ | Direct answers to material, care, shipping, returns and companion questions. | Sourced answers, accessible controls and discoverable links. |
| Search/cart | Fast, reliable commerce with the same visual language. | Empty/loading/error/stock-change states and accessible checkout handoff. |
| Kansa entry | Product-aware transition into the companion. | Stable SKU/handle deep link and clear return to product/store. |

Build one complete vertical slice: splash → Home → collection → representative PDP → cart → Kansa. Approve that quality bar before replicating sections across the catalog. Use family-specific composition where it clarifies material or use; do not create 25 unrelated page designs.

### Three.js and library loading

Use Three.js for an object/material experience: rotation, component separation or a controlled transition from exterior to construction. Select a hero object whose geometry is sufficiently specified. Start with a static, art-directed poster and enhance after the core page is usable.

Keep Motion as the existing default animation runtime. Additional libraries need a demonstrated capability, license review, pinned version, size measurement and ownership decision. Evaluate alternatives in a short spike; avoid running overlapping animation/scroll engines without a measured reason.

Build optional bundles from `theme/scripts/src/` into uploadable theme assets. Load 3D only on relevant sections/routes or user intent; prevent duplicate initialization in the theme editor. Dispose textures, geometries, listeners and render loops on teardown; pause offscreen/hidden rendering. Cap device pixel ratio and provide touch/keyboard controls, context-loss fallback and reduced-motion behavior. Use compressed model/texture exports only where total decoder plus payload cost helps.

External hosting is an asset-delivery decision, not a reason to load arbitrary remote scripts globally. Prefer versioned Shopify-delivered assets for theme code; document cache, CORS, integrity and outage behavior for any required external dependency.

### Experience acceptance

User targets: mobile Lighthouse performance ≥80 and accessibility ≥90, checked alongside real interaction on a mid-range phone and throttled connection. Record route, build, tool version, device/network conditions and repeated runs; do not substitute a desktop score for mobile evidence. Include Home, collection, representative PDP, cart and companion entry.

Also require keyboard navigation, visible focus, dialog focus handling, reduced motion, readable content without WebGL, no critical layout shifts, usable text zoom, clear errors and working browser history. The award ambition lives in composition, art direction and coherence as much as animation complexity.

## 7. Separate Kansa AI mockup microtool

Proposed workspace: `apps/kansa/`, sharing catalog projections and tokens. Keep deployment and provider choice open until the prototype contract is approved. This roadmap does not provision a paid AI backend.

Version one is a clearly identified, functional mockup with deterministic grounded responses. Primary journey: choose/scan a product → inspect its material/construction → ask care or compatibility questions → compare suitable objects → preview an allowed proposal → hand off to Shopify. Provide text input first; voice is an additional interface, not the only route.

Required states: no selected product, unknown SKU, loading, known answer with evidence, unverified concept claim, unsupported request, incompatible use, unavailable item, expired proposal and service failure. Link answers to the relevant specification or diagram. Do not simulate a successful purchase or present scripted responses as live model reasoning.

Keep an adapter boundary for future model/voice providers. Secrets, private rules and privileged commerce calls stay server-side. Store only necessary session data, define retention, and show a deletion/reset control. QR deep links should resolve through stable product identities rather than transient preview domains.

Acceptance: the same fact appears in the PDP, schematic and Kansa; negative constraints produce a useful refusal; unknown performance yields an explicit unknown; a proposed bundle is validated against current price/stock before handoff. Thermal calculation remains a separate validated model task, never an invented numeric answer from prose.

## 8. Product schematics for the complete assortment

### Drawing pack and generation process

Every approved SKU gets a drawing brief, even when it does not merit a 3D model. Cover front/top/side orthographic views, a dimensioned envelope, section at the critical interface, exploded construction where applicable, component/material legend, assembly/care sequence and risk/test annotations. Add food-contact surfaces and replaceable parts explicitly.

Pipeline: canonical record → drawing brief with missing inputs → parametric CAD/vector geometry → checked dimensions and component IDs → reviewed schematic master → SVG/PDF exports and optional GLB → responsive PDP/Kansa views. Use deterministic labels and dimension generation. Raster image generation can explore visual direction but must not author authoritative dimensions, tolerances or engineering truth.

Each pack carries SKU, revision, units, scale or “not to scale”, source, evidence status, reviewer and outstanding tests. Concept dimensions must be marked as targets. Manufacturer-ready tolerances and production release require engineering review; a polished concept drawing is not manufacturing approval.

### Existing 11 concept briefs

| SKU | Drawing focus | Unresolved evidence gate |
| --- | --- | --- |
| MT-TER-KUL-140 | Steel liner/clay shell section, rim and removable joint, drainage. | Expansion, retention, hot rim and cleanability. |
| MT-TER-KUL-C180 | Clay insert/metal chassis section, retaining ring and extraction. | Glaze migration, pull-out, chip and drainage tests. |
| MT-TER-PLT-34 | Platter profile, rim, marked versus food-contact zones. | Mark depth/process, cracking, migration and wash validation. |
| MT-TER-BWL-220 | Bowl section, exterior marking band and QR placement. | Lip/grip integrity and post-wash scanability. |
| MT-FOR-RLY-26 | Steel pan, bronze ring, locking interface and cold removal sequence. | Retention, thermal expansion, induction response and burn risk. |
| MT-FOR-PLN-46 | Steel griddle/bronze mass/tray assembly and expansion joint. | Flatness, two-zone behavior, load and contamination boundaries. |
| MT-HYB-RST-34 | Clad insert/ceramic cradle docking section and clearances. | Thermal shock, drainage and non-hob cradle distinction. |
| MT-KUR-STR-200 | Blade/continuous frame/sleeve, grip and balance references. | Metallurgy, bend fatigue, cleanability and edge retention. |
| MT-KUR-TRC-180 | Scalloped field/plain heel transition and strip handle. | Cut steering, sharpening, handedness and cleaning. |
| MT-KUR-UTL-150 | Scallop geometry, compact frame and removable grip web. | Tooth durability, hygiene and regrind feasibility. |
| MT-HYB-TNG-24 | Spring body, ceramic pads, carrier and opening range. | Pad retention, fatigue, soil traps and safe service loads. |

Extend this matrix to the reconciled 25-SKU assortment, including the care kit. Future product families enter through the same intake contract; “all possible products” means an extensible system, not fabricated geometry for an undefined infinite catalog.

Acceptance: every approved SKU has its mandatory views or an explicit justified not-applicable entry; every label traces to data; no dimension is inferred from an attractive render; changes invalidate dependent exports and prompt review.

## 9. UCP readiness and bounded negotiation

Keep the storefront and companion working while this layer develops. Shopify's agentic surfaces and the project's custom agent are distinct responsibilities. Verify the merchant's actual advertised capabilities, eligibility and protocol version before implementation; do not treat a local profile as proof of native-store configuration.

1. Capture dated discovery/profile fixtures and negotiated capabilities from the intended environment. Record supported operations and compatibility with the repository's pinned protocol.
2. Reconcile public product identifiers, currency, stock, policy and evidence with Shopify. Expose enriched specs through the appropriate separate source when native catalog responses do not carry them; verify that limitation rather than assuming it forever.
3. Extend the shopper from search/cart forwarding into a deterministic evaluator for budget, quantity, use, compatibility, stock and negative constraints.
4. Model negotiation as proposals within merchant rules: bundle composition, eligible discounts, shipping thresholds, expiry and escalation. Public agent output explains terms; internal floors and privileged rules stay private.
5. Validate a proposal again before cart/checkout handoff. Handle changed stock/price, unsupported capabilities, invalid quantities and expired terms.
6. Add checkout lifecycle integration only for supported capabilities. Preserve user review and the protocol's continuation/handoff mechanism; no invented payment completion.
7. Add authentication, rate limits, request limits, safe error responses, endpoint trust/SSRF protections, logging redaction and retry/idempotency behavior before public deployment.

Proof cases: valid request; no feasible product; unverified compatibility; out-of-stock substitution; prohibited discount; stale quote; duplicate request; handoff required. A failed negotiation must leave a clear human next step.

Readiness gates: find = stable discovery and IDs; understand = consistent specs/evidence; negotiate = bounded proposals and refusal; transact = supported validated handoff. The memo may claim only gates demonstrated with dated evidence.

## 10. Delivery sequence and checkpoints

These are stages of one award-level store, not separate basic/premium roadmaps. The 5 and 9 November targets are retained as requested checkpoints; feasibility depends on assortment and asset availability.

| Stage | Work and dependency | Exit gate |
| --- | --- | --- |
| A — baseline, now | Reconcile 25 SKUs, reference register, current Shopify state, imagery gaps and design tokens. | Approved assortment map and populated evidence register. |
| B — complete vertical slice | Art direction, splash/hero, one family/PDP, schematic, cart and Kansa prototype. Depends on representative data/assets. | One coherent end-to-end journey meeting the design and usability bar. |
| C — hero tranche, target 5 Nov | One hero per confirmed category plus care kit; all required store pages; consistent imagery and specs. | Each live candidate passes T02/T13/T03 gates; production verification recorded. |
| D — full assortment, target 9 Nov | Apply approved system to all 25 records/pages and drawing briefs; complete companion product coverage. | No missing mandatory product fields/media; all publication states reconciled. |
| E — full experience proof | Refine Three.js, motion, bell ritual, complete schematic packs, UCP negotiation and operational acceptance. Starts during B, continues across C/D. | Measured visual, accessibility, performance and thesis evidence. |
| F — presentation and handoff | Memo/video, deck, diagnosis, operations and rights documentation. Capture proof throughout. | Every showcased claim links to a reproducible artifact. |

At each checkpoint expose incomplete gates instead of silently lowering quality or marking concept products commercially ready. If dates become infeasible, record the exact SKU/asset dependency and revised checkpoint in the register.

## 11. First execution backlog

1. Finish the read-only inventory of real Shopify products/pages/media and map it to local sources.
2. Locate the original 25-SKU source and reconcile all 11 concept additions, including the care-kit identity.
3. Capture the supplied visual references; choose the complete vertical-slice art direction.
4. Inventory token coverage and specify generation into theme/docs/deck.
5. Define the source-of-truth schema migration and surface/privacy projection rules.
6. Create the asset manifest and all-SKU missing-media checklist.
7. Select one representative hero and produce its full reviewed schematic/imagery brief.
8. Implement the custom Home/PDP/collection/splash vertical slice in the unpublished theme.
9. Build the separate Kansa mockup using the same hero record and schematic.
10. Validate the vertical slice on mobile, keyboard, reduced motion and failed WebGL/network.
11. Populate remaining approved products and category navigation through the shared pipeline.
12. Prove discovery → grounded recommendation → bounded proposal → Shopify handoff.

Owners are roles until assigned: creative lead (references/identity), catalog editor (records/claims), design engineer (theme/Kansa), product engineer (schematics), commerce engineer (publishing/UCP), QA/editor (evidence and presentation). Do not equate parallel workstreams with available staffing.

## 12. Supporting register and decision queue

Retain identity-tool comparisons, marketing-tool comparisons, content calendar, strategy memo/report, recordings and client handoff from the prior roadmap. Include them in the memo/video only when they prove the thesis. Keep Hydrogen preview maintenance, local TLS and experimentation as enabling work.

Open decisions: definitive 25-SKU list and care kit; concept versus sellable classification; user's reference set; material evidence for kansa claims; final 3D hero and geometry source; companion hosting/provider; negotiation policy owner and permitted terms; live stock/shipping/returns readiness; exact assignment submission constraints.

## 13. Current primary-source references

- [Shopify AI Toolkit](https://shopify.dev/docs/apps/build/ai-toolkit): installed and used for theme guidance during this audit.
- [Shopify: render essential content server-side](https://shopify.dev/docs/storefronts/themes/best-practices/performance/render-essential-content-server-side): supports preserving usable Liquid/HTML beneath interactive enhancement.
- [UCP overview](https://ucp.dev/): protocol foundation; actual merchant capabilities still require discovery.
- [Shopify agent profiles and negotiation](https://shopify.dev/docs/agents/profiles): compatibility/profile reference for the next integration pass.
- [Shopify agentic storefronts](https://help.shopify.com/en/manual/online-sales-channels/agentic-storefronts): merchant channel context, not evidence that this store is configured.
- [Three.js model loading](https://threejs.org/manual/pages/loading-3d-models.html): implementation reference for the proposed object viewer.

Sources checked 2 November 2026. Recheck version-dependent behavior at implementation. Technical plans above are proposed project decisions, not claims that the current code already implements them.

# Decisions register

Every strategic and architectural decision for the Maison Tavo engagement, recorded with its
rationale. The brief forbids inheriting its open questions by default — each one gets a defended
answer here, or an explicit "unresolved, owned by" line. Cuts are recorded the same way: on the
record, never quietly under-built (brief Section 9).

Format per entry: **Decision** — what was decided. **Rationale** — why, with evidence tier where
relevant. **Alternatives rejected** — what was argued down and why. **Reversible?** — what would
change the answer.

## Strategic (brief-mandated open questions)

### D1 — Category question: cookware / intelligent cookware / agent-native commerce

- **Status:** **Decided** (26 Sep 2026), brief Section 10.
- **Decision:** All three, structured MECE. The brand does not pick a category — it fulfills
  every segment in a mutually exclusive, collectively exhaustive stack: the **object** (cookware
  — craft, metallurgy, heirloom), the **software layer** (intelligent cookware — Kansa, thermal
  intelligence, lifecycle), and the **protocol** (agent-native commerce — UCP, machine-readable
  catalog, agentic settlement). Each layer maps to its own competitor set and beats it on that
  layer's own terms, rather than conceding any segment to anyone.
- **Rationale:** The brief notes each answer implies a different primary competitor set — the
  strategic task taken here is to be inclusive across all of them in MECE form rather than
  choose. This is the more ambitious answer and the one the engineering scope (three pillars)
  already backs: storefront, software surface, and agent layer each exist as real work, not
  slideware.
- **Alternatives rejected:** declaring a single category (concedes two competitor sets by
  definition); treating the layers as features of the cookware category (under-signals the
  protocol work, which is the first-mover claim — see D4).
- **Reversible?** Only if the M0 audit or Deliverable I feedback shows the multi-segment story
  confuses rather than compounds.

### D2 — Provenance: credible synthesis vs. borrowed prestige

- **Status:** **Decided** (26 Sep 2026), brief Section 8.
- **Decision:** Deliberate synthesis, carried as the core design story. The three craft
  traditions — Indian casting, Japanese forging, European design language — are a connected
  three-place texture that builds depth, not a collage. The synthesis is the ambition: a highly
  ambitious design story is itself the design-thinking proof of work.
- **Rationale:** The brief warns the combination can read as borrowing prestige without earning
  it. The answer chosen here is to make the combination the *point* — documented, argued, and
  visible in the design system — rather than to soften it toward one tradition.
- **Reversible?** The memo (M5) must still write the provenance argument properly; if it cannot
  be written convincingly, that is the signal the answer was collage, and the positioning
  narrows.

### D3 — Primary ICP and what gets deprioritized

- **Status:** **Decided** (26 Sep 2026), brief Section 3.
- **Decision:** A blend of ICP 1 (Culinary Technologist) and ICP 2 (Aesthetic Curator),
  polished for the kitchen hospitality chef persona. **Nothing gets deprioritized.** The
  storefront serves the technologist through the engineering itself — UI/UX technological
  feats, spec depth, the agent layer — and serves the curator through design, story, and the
  three-place provenance texture (D2). The blend is what makes it a stronger design-thinking
  proof of work: one surface, two reading depths.
- **Rationale:** The brief deliberately leaves ICP ranking open and warns against treating all
  segments as equally weighted *without argument*. The argument here is that the engineering
  showcase and the design story are not competing for the same surface — they are the same
  surface read at different depths, which is exactly the persona a hospitality chef embodies
  (professional-grade specs, front-of-house aesthetics).
- **Alternatives rejected:** single-primary ICP (unnecessarily narrows a surface that can carry
  both); unweighted "all three ICPs" (ICP 3 trade stays served but on-site, not in brand voice).
- **Reversible?** If Deliverable I feedback shows the dual-depth read confuses buyers, the
  storefront voice rebalances toward the curator and the technologist depth moves to spec
  surfaces (PDP tables, docs, agent layer).

### D4 — Is the "machine-readable" gap real across competitors?

- **Status:** Position taken (26 Sep 2026); audit substantiation due M0, brief Section 1.
- **Decision:** Working position — **no competitor has made a legible shift into agentic
  commerce; this is a first-mover advantage.** Maison Tavo builds as the category's first
  agent-native cookware brand.
- **Rationale:** Consistent with the OBSERVED split in the brief (heirloom brands on thin
  digital, D2C brands on templated Shopify). The M0 audit (`docs/audit-machine-readability.md`)
  still runs — not to decide the position, but to *substantiate* it with per-competitor
  evidence (JSON-LD, GTIN, induction fields, UCP exposure) before the claim appears in
  customer-facing copy. Per evidence-tier discipline, the claim is HYPOTHESIS until the audit
  promotes it to OBSERVED.
- **Reversible?** Yes — if the audit finds a competitor already exposing agent-consumable
  structured commerce data, the claim narrows to "first in cookware at this depth" and the
  copy adjusts.

### D5 — Exact layer stack in customer-facing copy

- **Status:** Open — Phase 3, brief Section 4 / Section 12.
- **Decision:** Catalog data carries the layer stack as a **flagged fabrication assumption**,
  never a precise number in marketing copy, until a real fabricator specifies it.
- **Rationale:** The Gearhead ICP will check a claim this specific. An unverified precise claim
  is worse than an honest approximate one.

### D6 — Kansa thermal calculator timing

- **Status:** **Decided** (26 Sep 2026), brief Section 12 open thread.
- **Decision:** A v0 thermal calculator ships in Phase 1 (M4) as part of the in-theme Kansa
  page, reading catalog spec data.
- **Rationale:** The capstone is a design-engineering signaling project; the calculator is the
  clearest object-to-software demonstration and is cheap against the versioned catalog data.
- **Reversible?** Yes — P1 scope, first to slip from M4 if the milestone runs long.

## Architectural

### D7 — Kansa lives in the storefront first, standalone later

- **Status:** **Decided** (26 Sep 2026).
- **Decision:** Kansa v0 is a page in the live theme (`/pages/kansa`) with a URL constructor
  scheme (`?piece=<handle>`) for QR onboarding. After Phase 2, it branches off into a
  standalone PWA hosted on GitHub Pages.
- **Rationale:** Integrated development keeps one deploy target and direct access to theme
  assets and catalog context during the capstone window; the branch-off delivers the brief's
  standalone-PWA vision without paying for two surfaces up front. The v0 is architected so
  extraction is cheap (Zustand state, scripted-intent voice interface, catalog data from
  `packages/catalog`).
- **Alternatives rejected:** building the standalone PWA from day one (two surfaces to keep
  coherent during the densest window); hosting it in the Hydrogen preview app (ties the
  showcase to a secondary surface).

### D8 — Experience engineering is vendored ESM in the theme, no build step

- **Status:** **Decided** (26 Sep 2026).
- **Decision:** anime.js, Motion (vanilla), Howler.js, and Zustand (`vanilla` + `persist`) are
  vendored into `theme/assets/` as ES modules. No bundler is introduced into `theme/`.
- **Rationale:** Horizon serves theme assets only and its JS is already module-based
  (`assets/package.json` is `{ "type": "module" }`). A build step would fight the theme's
  deployment model (direct `shopify theme push`) for no capability the vendored modules lack.
- **Reversible?** Yes — if the Kansa branch-off or Surface A work outgrows vanilla modules, the
  build tooling lands in the standalone app, not the theme.

### D9 — Voice is simulated in Phase 1 behind a replaceable interface

- **Status:** **Decided** (26 Sep 2026).
- **Decision:** Kansa's voice layer uses the Web Speech API with scripted intents (seasoning
  walkthrough, sear-temperature answer, voice-to-cart stub) behind an interface designed so an
  OpenAI Realtime API backend can replace it without a rewrite.
- **Rationale:** The brief allows a faux pass; the signaling value is the interaction design and
  the architecture, not the model. A real backend is Phase 3 pitch scope.
- **Constraint:** SpeechRecognition requires a secure context — local development uses
  `bun run dev:theme:https`.

### D10 — Sound and motion are opt-in and degradable

- **Status:** **Decided** (26 Sep 2026).
- **Decision:** Sound is silent by default behind a persisted opt-in toggle; all motion
  respects `prefers-reduced-motion`; every P1 experience feature leaves the store fully
  functional if removed.
- **Rationale:** The curator side of the blended persona (D3) is highly sensitive to bad UI; an
  unsolicited soundscape on a luxury storefront is a luxury-illusion break, not a feature.
  Scope guardrails in the roadmap make P1 the first thing to slip, never P0 rubric items.

## Cuts and deferrals (on the record)

Phasing decisions, not deprioritizations — per D1/D3, no segment or scope is dropped; each item
here is sequenced, with its landing point named.

| Item | Status | Lands |
| --- | --- | --- |
| Surface A (WebGL configurator) | Deferred to Phase 3 pitch scope | Full-scope proposal; the Kansa page + agent layer answer the same machine-readability question first, at lower risk |
| Real voice backend (OpenAI Realtime) | Deferred to Phase 3 | D9 — simulated pass carries the signaling value now |
| Standalone Kansa PWA | Deferred to post-Phase 2 | D7 — integrated first, branched off after |
| Hydrogen app customization | Deferred indefinitely | Repo rule: Hydrogen is a secondary Oxygen preview, not the live shop; no showcase engineering lands there |

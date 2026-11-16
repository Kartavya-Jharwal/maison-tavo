# Demo script — Maison Tavo showcase

Two versions: 60-second for a quick walk-through, 10-minute for a full evaluation.

---

## 60-second version

**Beat 1 — Splash (0–5s)**
Open the store URL. The splash intro dialog appears — Libre Baskerville headline on
Cast Clay canvas, sound toggle visible in the corner. Dismiss it.

**Beat 2 — Homepage (5–20s)**
The hero: "Modern heirlooms for the working kitchen." Scroll down past the hero.
The lineup grid reveals — four cards (Forge Hybrid, Terre Clay, Kuro Strip,
Forge × Terre) stagger in as they enter the viewport.

**Beat 3 — PDP + JSON-LD (20–35s)**
Click into a Forge Hybrid product. The spec table renders below the description in
Anonymous Pro mono — lineup, material architecture, heat sources, CONCEPT SPEC badge.
Right-click → View Page Source → Cmd/Ctrl+F `application/ld+json` — the
`additionalProperty` array is visible with `heat_sources`, `material_architecture`,
`concept_thesis`. This is the machine-readable spec layer no competitor has.

**Beat 4 — Agent proof (35–50s)**
Switch to a terminal. Run:
```
bun run apps/agents/src/demo.ts
```
Output: matched SKU titles with prices, a live Shopify cart ID, checkout URL. One
command, real Shopify cart, assembled entirely from spec constraints with zero manual
product selection.

**Beat 5 — Kansa (50–60s)**
Navigate to `/pages/kansa`. Click the microphone and ask: "What are the heat sources
for this piece?" The scripted intent fires. Try adding `?piece=forge-relay-dual-mass-skillet`
to the URL — Kansa pre-loads with that piece's thermal data.

---

## 10-minute version

### Pillar 1 — The storefront (0–3 min)

**Splash:** The animated entry is a brand statement, not a loading screen — sessionized
so it appears once per browser session, skippable, silent by default with an opt-in
sound toggle. Designed to be replaced with a material/bell ritual as imagery arrives.

**Homepage:** Branded hero copy leads into the `maison-lineups` section — four lineup
rooms with IntersectionObserver stagger reveals (80ms delay per card). This section was
the missing piece; it's now wired into `templates/index.json`.

**About page:** Evidence-tier pillar cards (VERIFIED / OBSERVED / HYPOTHESIS) demonstrate
the discipline behind the D4 claim. No unaudited number appears as marketing fact. This
is the diagnostic answer the brief asked for.

**PDP:** The spec table reads from Shopify `specs.*` metafields pushed via the catalog
pipeline (`scripts/push-catalog.ts`). Anonymous Pro monospace gives it an industrial
data-sheet aesthetic. CONCEPT SPEC badge is honest about product stage.

**JSON-LD:** View Page Source on any PDP. The `<script type="application/ld+json">` block
contains a `Product` schema with `additionalProperty` entries for every spec field —
the same data the agent layer reads, exposed at the HTML layer for AI crawlers and agents.

**Colour story microapp** (`/pages/lookbook`): The brand colour explorer — five palette
swatches as material surfaces with their semantic roles, paired with the four lineup rooms.
Zustand state + Motion opacity pulse on selection.

### Pillar 2 — The agent layer (3–7 min)

**Why it matters:** Every competitor's UCP catalog response carries no structured spec
data. Maison Tavo's does. That is the D4 first-mover position — not "first in agentic
commerce" (Shopify gives everyone that by default), but first in cookware to make the
product spec layer machine-readable.

**Discovery:** `curl https://<tunnel-url>/.well-known/ucp` — profile lists four
capabilities and a `shopify_payments` handler scaffold.

**Enriched search:**
```bash
curl -X POST https://<tunnel-url>/agents/shopper/search \
  -H "Content-Type: application/json" \
  -d '{"query": "induction skillet"}'
```
Response carries `additionalProperty` with `heat_sources`, `material_architecture`,
`claim_status`, `concept_thesis`. No other cookware brand's UCP response does this.

**Constraint evaluator:**
```bash
bun run apps/agents/src/demo.ts
```
Walks through: filter by heat source → score by use-case keywords → select within budget
→ resolve Shopify variant IDs → return validated cart. The proof query ("5-piece set under
$1,800 for induction searing and clay slow-cooking") returns real Shopify variant IDs.

**Checkout lifecycle:** Create → Get → Update → Complete. Full lifecycle scaffolded.
`requires_escalation` status + `continue_url` is the UCP-spec payment handoff pattern.

### Pillar 3 — Kansa voice companion (7–10 min)

**QR onboarding:** The URL scheme `/pages/kansa?piece=<handle>` is designed to be
stamped into a QR code on the physical pan. Scan → land on Kansa pre-loaded with that
piece's care and thermal data. Object → scan → software (D7).

**Voice interaction:** Web Speech API on HTTPS. Scripted intents matched by regex:
- "care / wash / season" → `care_hypothesis`
- "heat / sear / induction" → `heat_sources` + `interaction_performance_intent`
- "concept / what is / about" → `concept_thesis`
- "material / made of" → `material_architecture`
- "add / buy / cart" → CTA link stub

**Architecture (D9):** The `SpeechRecognitionInterface` class is the seam — scripted
intents sit behind an interface that OpenAI Realtime API can replace without a rewrite.
V0 proves the interaction design and data architecture. Real AI model is Phase 3 pitch scope.

**Thermal calculator:** Reads `heat_sources` from the product AJAX API response and
renders a compatibility table. The calculator is the clearest object-to-software
demonstration in the store.

---

## Shopify Admin setup checklist (before demo)

- [ ] 4 lineup collections exist with handles: `terre-clay`, `forge-hybrid`, `forge-terre`, `kuro-strip`
- [ ] `main-menu` navigation includes: Shop (departments and new arrivals); Kansa as its own page; About; Contact
- [ ] Page with handle `kansa` exists, template set to `page.kansa`
- [ ] Page with handle `lookbook` exists, template set to `page.microapp`, Microapp id set to `lookbook`
- [ ] All 11 products are ACTIVE and published to Online Store
- [ ] `SHOPIFY_STOREFRONT_TOKEN` set in `apps/agents/.env` for the demo proof script
- [ ] Cloudflare tunnel running: `bun run tunnel:agents` (for UCP demo)
- [ ] Kansa requires HTTPS — use the live development theme URL, not localhost

## Local development workflow

```bash
# Theme development
bun run dev:theme              # Shopify CLI dev server → unpublished theme
bun run dev:theme:https        # HTTPS proxy (needed for SpeechRecognition / Kansa)

# Push theme changes
shopify theme push -e development --nodelete   # development theme only
shopify theme push -e production               # LIVE — only when explicitly approved

# Agent server
bun run dev:agents             # Bun watch mode on agents server (port 4443)
bun run tunnel:agents          # Cloudflare tunnel → exposes agent server publicly

# Catalog push
bun run --cwd packages/catalog seed:build   # Regenerate seed from data/*.csv
bun scripts/push-catalog.ts --apply         # Push to Shopify (dry-run without --apply)
bun scripts/push-catalog.ts --apply --publish  # Push + publish to Online Store

# Build theme JS
bun run theme:build            # Bundles scripts/src/ → assets/ (3 outputs)
```

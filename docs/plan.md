# PLAN.md: Maison Tavo master source plan

Owner: KJ · Draft v2 · 2 Nov 2026
Purpose: one register that names every thread running under Maison Tavo. Nothing here is killed or merged. Threads are sequenced, not ranked out.

## 0. How to read this
- **Spine, not boundary.** Thesis: *Maison Tavo is a brand a machine can find, understand and negotiate for, rooted in kansa (bell metal), where the tool is sacred.* It orients the work. It does not exclude threads.
- **IDs** are stable. Kanban cards, commits and the MkDocs nav all cite them.
- **Tiers** (use these exact words everywhere): Specified (designed, documented) · Simulated (convincing, rule-based or human-in-the-loop) · Wired (calls real services) · Live (publicly usable now). Map to business readiness levels in M7.
- **Audience tags:** G grader · H hiring manager · C customer/ICP · M machine/agent · P peers (live pitch).
- **Rubric tags:** A2 = Shopify milestone, A3 = creative marketing milestone. Beyond = surplus for the 91-99 band.

## 1. Pillars and threads

### P1. Brand and craft
**B1 Concept, segment, positioning** · Live · G H C · A2-Brand, A3-Strategy
- Target segment and value proposition from the customer research; adoption steepness framed as the diagnosis.
- Name rationale: "Maison" reads premium to Western search and logistics heuristics, "Tavo" carries tava for Indian recognition. Test how voice assistants hear and pronounce it.
**B2 Kansa story and bell ritual** · Live · all · Beyond
- Kansa = bell metal. Tools are craft instruments you revere; bell at the start and at last call in the kitchen.
- Bell chants and ritual copy: source them properly and keep them respectful and accurate. Record your own bell sample (no licence issue).
- Bell recurs as the care-kit card, the voice page opener, the A3 sonic logo, the pitch opener. Sound is opt-in on the site.
**B3 Identity system** · Live · G H · A2-Execution, A3-Identity
- Tokens (colour, type, spacing, motion) shared by the theme, MkDocs, the deck and the A3 kit. Logo, palette, voice guide.
**B4 Craft and provenance narrative** · Live · G H C
- Western SOTA metallurgy paired with traditional Eastern alloy techniques; hand-machined, not heavy-machinery scale; bimetals. Artisan and foundry story.
**B5 Business model and ladder** · Specified→Live · G H · A2-Catalogue
- SKU ladder: entry, hero, mid, gift, heirloom. Consumables and services: care oil, cleaning and maintenance kits, re-tinning/refurbishment as a lifetime service.
- Gifting and referral as the growth loop (low repeat purchase by design). Pricing logic. Post-investment roadmap (the Wired tier).

### P2. Catalogue and source of truth
**C1 Catalogue (21-28 SKUs, three categories)** · Live in tranches
- Cat 1: stainless clad on a blend alloy, hand-machined, bimetal, tempered glass or ceramic lids.
- Cat 2: clay-copper layer blend (Eastern clay pots with brass or similar, metal reinforcement), borosilicate glass lids.
- Cat 3: bundles and sets, refresh and maintenance kits, bamboo steamers, extra lids.
- Tranches: hero set (one per category plus care kit) → remaining SKUs as each clears the image gate.
**C2 Superset schema and build script** · Live · M G
- One YAML/JSON source; every field tagged by surface (human, agent, voice, commerce). Groups: identity, material and layers, performance, compatibility, care, safety, provenance, narrative, pronunciation/SSML, negotiation rules.
- JSON Schema validation. One command emits Shopify CSV and metafields, JSON-LD, llms.txt, agent JSON, SSML. "Cherry-pick later" = a config change.
**C3 Materials research and claims ledger** · Live · G C
- Clay-copper design, lining and food-contact, tempered vs borosilicate lids, alloy details (confirm kansa facts before copy). Every claim gets a source or "pending research".
**C4 Imagery pipeline** · Live · G C · A2-Execution
- Open-source and gen-AI variants, free better-gen-AI hunt for category variants, licence and credit log, one crop/grade/background treatment, image bar per SKU.
**C5 Product copy and "ask before you buy" blocks** · Live · G C M
- Induction, seasoning, cleaning, safety, as direct Q&A (the structure assistants lift).

### P3. Store and experience
**S1 Dev environment** · mostly done
- Partner account, git repo, theme scaffold, tokens, lo-fi structure, wireframe, preview workflow.
**S2 Custom theme** · Live · G H · A2-Storefront, Awwwards-grade
- Design / usability / creativity / content (Awwwards weights, roughly 40/30/20/10). Pages: Home, collections, product, About, FAQ, cart, 404, password page.
**S3 Finder** · Live · C M G
- Benchmarked on Made In's five-question flow, mapped to three categories plus Tavo questions (dosa, roti, tadka). Reasoning chips on results, JSON output, rule-based "Ask Kansa" fallback.
**S4 Signature interactions** · Live · G P · Beyond
- Scroll-linked layer cross-section with heat-spread toggle; View-as Human/Agent/Voice toggle on every product page; bell micro-interaction.
**S5 Gate design** · Live · G H
- Designed password page, request-access form, forwarded-link path. Prof/graders get zero friction (password in submission note and on screen in the video).
**S6 QA** · Live
- Mobile Lighthouse and accessibility targets, throttled connection, reduced motion, static fallback for the video.
**S7 Living About page** · Live · G · A2-Diagnostic (25 pts)
- Diagnosis argument (what assistants say today, why Maison Tavo is missing or misrepresented, what the store does), with live figures from R2.
**S8 Checkout and demand capture** · Simulated→Live
- Test-mode checkout, waitlist or pre-order, linked to D2.

### P4. Machine interfaces
**M1 Three front doors** · Live · M G · Beyond: human page, agent page (JSON-LD, endpoint), voice page (SSML), all from C2.
**M2 UCP** · Live · M G: setup, dashboard walkthrough, catalogue sync check, three synthetic buyer IDs.
**M3 Public agent endpoints** · Live · M: JSON-LD, llms.txt, MCP-style endpoint on a public URL (the gated store can't be reached by outside bots).
**M4 Kansa assistant app** · Simulated (architecture Specified; Wired spec documented) · G H
- Custom app at ~45%; implemented as HTML/CSS/Preact patched through the theme, documented as a full app architecture. Label this honestly in the report. Optional Wired spec: Claude API behind a small serverless proxy, browser speech APIs for voice.
**M5 Kansa negotiator (A2A)** · Simulated · G H P · Beyond
- Rule engine: floor, bundle, gifting, first-sale-of-day logic, mol-bhav tone in Hindi and English. Three buyer personas. Demo order: UCP dashboard → flash the JSON endpoint → Grok (or similar) haggling. If the bot gets the JSON by paste, label it "agent relay, human-in-the-loop".
**M6 Voice page** · Simulated→Live: Hindi/English answers, SSML, pronunciation page, bell opener.
**M7 Architecture and readiness ladder** · Live · G H: architecture.md, tier definitions, business-readiness mapping, post-investment wiring plan.
**M8 Agent-vs-human checkout** · Simulated→Live · Beyond: a shopper and an agent complete the same task side by side (test mode), filmed for the A2 video and the A3 opener.

### P5. Discoverability and research
**R1 AEO/GEO literature on MkDocs** · Live · M G · Beyond
- Question-form pages with a 40-60 word direct answer then sources; Organization, Product and FAQPage schema; entity consistency; dated updates; the citable source of truth.
**R2 Discoverability tracker** · Live · M G H · Beyond
- Baseline before anything is public; time series after; "time to be known" and hallucination log; public page; feeds S7.
**R3 Netnography and query set** · Live · G: sourced from forums and "how to choose a pan" listicles; provenance logged; Hinglish and spoken variants.
**R4 Competitor benchmark** · Live · G: Made In as best benchmark plus the comp list; compare finder, schema, AEO, price, story.
**R5 Customer research synthesis** · Live · G: existing ICP research, personas, language.
**R6 Theory library** · Live · G: class frameworks and APA7 references, mapped to claims in memo and report.
**R7 Self-red-team** · Live · Beyond: rubric pasted into a model as a hostile marker; log what it caught, what you fixed.

### P6. Demand and validation
**D1 ICP outreach** · Live: family and friends, chefs, home cooks, forums, kitchenware enthusiasts; same three questions; UTM or QR per community; forum rules respected; anonymised, consent noted.
**D2 Waitlist and pre-order signals** · Live · Beyond: real demand figures for the measurement plan.
**D3 Outside validation** · Live · Beyond: foundries and craft producers in Rajasthan, chef communities; design-gallery submission only where a public page exists (the gated store can't be judged).
**D4 Physical artifact and live room study** · Live for the pitch · P: printed care card with QR and bell; peers ask their own assistants about Maison Tavo and tally answers live.

### P7. A3 marketing layer
**L1 Brand identity kit** · A3-Identity (25): Pomelli (primary) + Canva or Adobe Express; first outputs saved untouched; documented comparison; final logo, palette, voice guide.
**L2 Webpage** · A3-Webpage (15): Stitch (primary) + Framer or Canva; prompts, patterns, logic, screenshots; 60-90 second screen recording.
**L3 Instagram + TikTok calendar** · A3-Plan (25): concepts, hooks, formats; native conventions (Reels, Stories, TikTok trends and sounds); platforms differ in role, not just format; bell as sonic logo.
**L4 Report (1500 words, six sections)** · A3-Reasoning (25): context, audience, brand assets, webpage, platform strategy, measurement. Suggested split 150/200/300/300/300/250; confirm the official allocation in Canvas.
**L5 Measurement plan** · KPIs and proxies: questions answered, time from first question to purchase, care-kit attach, referral and gift share, discoverability metrics, waitlist conversion. Include kill criteria ("if assisted visitors don't convert meaningfully better, the guidance thesis is wrong").
**L6 Presentation** · A3-Presentation (10): deck, 10-minute recorded version, 3-minute live pitch with embedded proof-of-work video.
**L7 Lead-tool decision** · reasoned final pick of lead tool per step (assessed explicitly).
**L8 Iteration log** · prompts, before/after, what changed and why (assessed explicitly).

### P8. Academic deliverables
**Q1 A2 memo (1500 words)** · decision-log format, APA7, theory tie-in, Word optimised for PDF export; beyond-the-brief items signposted.
**Q2 A2 video walkthrough** · shopper-vs-agent split screen option, auto-zoom screen recorder, captions, password shown on screen.
**Q3 A2 submission pack** · store URL, password, memo, video, access note; three attempts planned, first by 14 Nov.
**Q4 A3 submission pack** · report, calendar, kit, screenshots, deck, video.
**Q5 Reference and licence management** · APA7 library, image credits, source log.

### P9. Portfolio and career
**F1 MkDocs as front door** · landing, case study, design.md, architecture.md, AI prompts, GitHub navigation hub.
**F2 Access design** · public landing; gated store with an access note and request-access form.
**F3 Hiring-manager package** · v1 by ~18 Nov, then updates; waitlist tool link; walkthrough video.
**F4 Reference-letter alignment** · what the professor's condition requires (open item).
**F5 Case-study narrative** · problem, method, system, results, what's Specified vs Live.
**F6 Post-course roadmap** · Wired phase, investor-readiness notes.

### P10. Open contributions
**O1 TavaBench** · public query set and scoring method, monthly runs.
**O2 Ontology RFC** · vocabulary for cookware material and care claims, proposed to UCP and schema.org communities.
**O3 Repo hygiene** · licences, README, release tags, changelog.

### P11. Ops
**X1 Decision log** (feeds Q1) · **X2 Kanban mapping** (IDs ↔ cards) · **X3 Backups and releases** · **X4 Video tooling** · **X5 Gen-AI prompt library**

## 2. Rubric traceability
| Rubric line | Threads |
|---|---|
| A2 Brand concept (20) | B1, B3, B4, R5 |
| A2 Catalogue (15) | C1, C2, C4, C5, B5 |
| A2 Storefront (20) | S1-S6 |
| A2 Brand story and diagnostic (25) | S7, B2, R1, R2, M1 |
| A2 Execution (20) | S6, B3, C4, Q1-Q3 |
| A3 Identity (25) | B3, L1 |
| A3 Webpage (15) | L2, S2 |
| A3 Creative plan (25) | L3, B2 |
| A3 Reasoning (25) | L4, L5, L7, L8, R6 |
| A3 Presentation (10) | L6, D4, M5, M8 |
| Beyond (91-99) | M1, M5, M8, R1, R2, R7, S4, D2-D4, O1, O2 |

## 3. Dependencies
C2 → S2, S3, M1-M3, R1, R2. C4 → S2. R3 → R1, R2, O1. C3 → C5, R1. S1 → S2 → S6. M2 + M3 + M5 → M8. All of these → Q1-Q3 → F3. B3 → L1-L3. S2 + L1 → L2.

## 4. Sequencing (waves, not cuts)
- **Wave 0 · 2 Nov:** R2 baseline before anything is public; B3 tokens locked; C4 treatment locked; D1 outreach sent; R3 query log started.
- **Wave 1 · 3-5 Nov:** C2 script, hero tranche live (tripwire: live by 5 Nov), S5 gate.
- **Wave 2 · 5-9 Nov:** C1 full catalogue through the image gate, S3, S2 pages, R1 skeleton, C3 ledger, M3 public endpoints, M2.
- **Wave 3 · 9-12 Nov:** S4, M1 toggle, M4, M5 demo and bell, R2 re-run, R7, S6. **Freeze 12 Nov.**
- **Wave 4 · 12-14 Nov:** Q1, Q2, Q3; submit 14 Nov (deadline 15 Nov 23:59).
- **Wave 5 · 15-18 Nov:** F1-F3 v1 out.
- **Wave 6 · 17 Nov-16 Dec:** L1-L8 in step order; O1, O2, D3, D4, M8 in parallel; A3 submitted before 16 Dec 23:59.
- **Dec:** F5, F6, hiring-manager updates before 31 Dec.

## 5. Rules
1. Tier before layer: record the date a thread moves up a tier.
2. Every material or safety claim has a source or "pending research".
3. Tier names identical in store, memo, video and site.
4. Beyond-the-brief work is labelled as such, in video and memo.
5. Password and public URLs appear in the submission note and the video.
6. Nothing is deleted. Work that isn't finished stays in the register at its true tier.

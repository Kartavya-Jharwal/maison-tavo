# One source supports the human store, public machine data and Kansa

This is a target architecture, read alongside the [source audit](project-audit-2026-11-02.md). It distinguishes source artifacts, simulations and connected services.

## Public documentation and the gated store serve different audiences

MkDocs hosts the public brand explanation, literature, claims, dated research, case study and navigation hub. Shopify hosts the custom password-gated development experience. A public source surface is necessary for outside agents that cannot enter the gated store.

Static public JSON, SSML artifacts and `llms.txt` may be published with documentation. A callable MCP/agent endpoint requires an actual service deployment; static hosting does not supply one. Verify reachability and content types before demonstrating external access.

## Product meaning and live commerce have distinct authorities

Versioned YAML/JSON records feed validation and surface-specific generation: Shopify import/metafields, JSON-LD data, public agent JSON, SSML and literature. Each field carries visibility, surface tags, units, evidence and revision. A build manifest tracks checksums. Private negotiation rules never enter public exports.

Shopify remains authoritative for live stock, price and checkout state. Generated product meaning must be reconciled with commerce facts at transaction time. Changing one source fact should update every permitted surface through the same build; publishing remains separate from generation.

## Kansa has a mock implementation and a future backend boundary

The founder reports roughly 45% mocked integration as of 1 November, implemented through theme HTML/CSS. This is a dated self-report, not a measured completion percentage. Local inspection found voice/island scaffolding, not a completed standalone app.

Proposed `apps/kansa/` shares catalog and tokens while owning conversation, session and deployment. Mock mode uses fixtures and deterministic rules. Future wired mode adds a server-side provider adapter, grounded retrieval, policy evaluation and controlled commerce tools. Claude or other providers are candidates, not configured dependencies. Browser speech and SSML require capability-specific fallback behavior.

## A2A, UCP and MCP must not be conflated

A2A describes the intended agent-to-agent negotiation relationship. UCP concerns commerce interoperability and supported lifecycle capabilities. MCP can provide a tool interface/transport. Pasting JSON into an outside bot proves a human-mediated relay, not an end-to-end protocol integration.

Existing UCP client and agent code provide discovery/search/cart foundations. Finish actual capability negotiation, current stock/price checks, failure paths and hosted service verification before claiming operational readiness.

| Readiness | Meaning | Evidence |
| --- | --- | --- |
| Specified | Contract or architecture documented. | Versioned interfaces, examples and failure states. |
| Simulated | Fixtures/rules demonstrate behavior. | Repeatable demo, visible label, no implied real transaction. |
| Connected | Controlled real-service interaction. | Redacted request/response and failure evidence. |
| Live | Intended audience can use a deployed surface. | Public/restricted reachability and acceptance checks. |
| Wired/operational | Real providers and commerce lifecycle supported. | Security, cost limits, recovery, monitoring and ownership. |

Always name what is live: publishing a simulated app does not promote its model capability to wired.

## The demonstration uses bounded rules and synthetic buyers

Define three synthetic buyer IDs with use, quantity and budget profiles. Evaluate bundle, gifting, floor, first-sale-of-day and expiry rules deterministically. Hindi/English mol-bhav changes the voice, never the policy or compatibility facts.

Demo order: the actual available UCP/admin diagnostic surface → public JSON → outside bot negotiating with Kansa → reviewable proposal/test-mode handoff. Confirm a dashboard actually exists before making it a required shot. If a person pastes JSON or relays messages, label it “agent relay, human-in-the-loop.”

Future wiring needs authentication, endpoint trust, request/rate/cost limits, retention, redacted logs, quote revalidation, retry/idempotency behavior and safe checkout continuation. Thermal and maintenance predictions additionally need validated models and real inputs; an image alone cannot reliably establish burner BTU or alloy composition.

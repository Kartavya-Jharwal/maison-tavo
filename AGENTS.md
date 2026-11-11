# Maison Tavo

Live storefront: customized Horizon (Liquid) in `theme/`. Read [`theme/AGENTS.md`](theme/AGENTS.md) before CSS or theme edits.

`hydrogen/` is a secondary Oxygen preview, not the live shop. React Router imports come from `react-router` (never `react-router-dom` or `@remix-run/*`).

Use the [Shopify AI Toolkit](https://shopify.dev/docs/apps/build/ai-toolkit) for all Shopify API and platform work. If missing, install it in the agent host per that page (or `npx skills add Shopify/shopify-ai-toolkit --list` for skill-compatible hosts).

## Awwwards SOTY 2026 Grand Plan & Core Directives

The project's definitive design-engineering blueprint is maintained in [`docs/awwwards-grand-plan.md`](docs/awwwards-grand-plan.md). All agents must adhere to the following core tenets:

1. **Jakob's Law & Usability**: Never sacrifice core commerce usability for visual gimmicks. Standard navigation, carousels, variant selectors, and cart drawer must remain fast, intuitive, and accessible.
2. **100/100 Lighthouse & W3C Standards**: Target 100 on Performance, Accessibility (AA/AAA), Best Practices, and SEO. Kinetic text splitting (via `SplitType`) must preserve screen-reader semantics (`aria-label` on parent, `aria-hidden="true"` on split spans). Font metrics must prevent layout shift (CLS = 0).
3. **Sourced Assets & Simulations**: Avoid hand-rolling shaders or complex simulations from scratch. Source battle-tested open-source/CodePen implementations for 2D heat diffusion and sound design. Fonts must be verifiable and self-hosted (Instrument Serif / Cormorant Garamond, Libre Baskerville, Geist Mono / JetBrains Mono).
4. **The 3-Mode Panopticon Card**: Implement a clean 3-way toggle button directly on product cards:
   - **Human**: High-editorial 4K studio still & living patina.
   - **Engineer**: SVG CAD blueprint / stratigraphy placeholder with mm layer thickness callouts.
   - **Machine**: ASCII art silhouette with Schema.org JSON-LD data block.
5. **Zero-Backend Client Storage Profiling**: A 45% page exploration modal collects cooking style preferences + optional email strictly in `localStorage` to tag matching catalog items. A discreet `[ Reset Session & Storage ]` footer link allows immediate state clearing for judges and developers.
6. **Scene 0 Static Meta-Landing**: Do not theme the Shopify password template for exhibition entry (dev-store gate is unthemeable). Use deployable `gate/index.html` — copy passcode, then send visitors into the system store gate.

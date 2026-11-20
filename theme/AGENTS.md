# Maison Tavo theme (Horizon)

This directory is the **live Shopify Liquid storefront**. It is a customized [Horizon](https://themes.shopify.com/) theme pulled from `maison-tavo-9pyrkr0c.myshopify.com` (theme id `210460377457`, role live).

There is **no separate Liquid vs Horizon fork**. Do not restyle the Hydrogen app for production look-and-feel; `hydrogen/` is a secondary Oxygen preview only.

> **Hydrogen freeze:** do not edit `hydrogen/` until mid-December 2026. Until then treat it as a read-only semantic and route reference for Liquid parity work (route behaviour, data contracts, expected states), never as a runtime dependency or a component source to port.

Route and semantic parity ledger: [`../docs/theme-parity.md`](../docs/theme-parity.md).

`config/settings_schema.json` keeps Shopify theme identity (`theme_name`: Horizon, `theme_version`: 4.2.0, `theme_author`: Shopify) so the admin still recognizes Horizon. Branding for this repo is `@maison-tavo/theme` and `shopify.theme.toml`.

## Commands

From the repo root:

```bash
bun run theme:check
bun run theme:lint             # design semantics audit (px type, selectors, contrast, fonts, footers)
bun run theme:verify           # JS chain: package → bundle → Liquid → init → packaged
bun run theme:lint:all         # design lint + JS chain + shopify theme check
bun run theme:build            # bundle scripts/src → assets (GSAP, Embla, motion, zustand)
bun run dev:theme              # http://127.0.0.1:9292 — unpublished development theme
bun run dev:theme:https        # https://localhost:9443 → 9292 (second terminal; run `bun run certs` first)
```

From `theme/`:

```bash
bun run build
bun run design:lint            # same as theme:lint
bun run lint                   # design:lint && shopify theme check
shopify theme dev -e development
shopify theme check
shopify theme pull -e production     # sync from live (skips settings_data.json)
shopify theme push -e production     # LIVE publish — allow-live, does not overwrite editor settings_data
shopify theme push -e development --development --nodelete   # unpublished only
```

### Design lint (Gap 7)

`scripts/design-lint.mjs` is the durable free gate (no SaaS). It fails on brand regressions: hard-coded `px` font-size, overbroad `[class*="menu|nav|…"]` selectors, `outline:none` without `:focus-visible`, remote Google Fonts links, duplicate footer section types, missing `[ Reset Session & Storage ]`, plus contrast/spacing warnings. Prefer `--font-size--fluid-*` / `--font-size--brand-*` and explicit BEM / `maison-*` selectors. Details: [`../docs/design-lint.md`](../docs/design-lint.md).

`development` never targets the live theme. Live updates are an explicit production push.

Store: `maison-tavo-9pyrkr0c.myshopify.com`
Live editor: `https://maison-tavo-9pyrkr0c.myshopify.com/admin/themes/210460377457/editor`
`shopify theme dev` prints the preview URL and a development-theme editor URL.

## Where to edit (CSS / custom theme)

Work in this order. Prefer theme settings and CSS custom properties over one-off hardcoded colors.

| What | Where |
| --- | --- |
| Global settings schema (colors, typography, layout, logo) | `config/settings_schema.json` |
| Current setting values (editor state) | `config/settings_data.json` — **do not push to live**; production env ignores it |
| Design tokens / CSS variables from settings | `snippets/theme-styles-variables.liquid` |
| Color palette custom properties | `snippets/color-palette.liquid` |
| **Color tokens (canonical)** | `--mt-color-*` (+ `-rgb`) in the two snippets above — see [`../docs/color-tokens.md`](../docs/color-tokens.md) |
| Font loading | `snippets/fonts.liquid` |
| Font Awesome kit (icons) | `snippets/font-awesome.liquid` via `snippets/scripts.liquid`; kit ID in Theme settings → Icons |
| Global CSS | `assets/base.css` (loaded from `snippets/stylesheets.liquid`) |
| Other CSS assets | `assets/*.css` |
| Component CSS | `{% stylesheet %}` in `snippets/`, `sections/`, `blocks/` |
| Component JS | `assets/*.js` plus `{% javascript %}` in snippets/sections/blocks |
| Layout chrome (`<head>`, CSS/JS includes) | `layout/theme.liquid`, `layout/password.liquid` |
| Sections | `sections/` |
| Nested theme blocks | `blocks/` |
| Snippets | `snippets/` |
| Templates (JSON section composition) | `templates/` |
| Translations | `locales/en.default.json` and `locales/en.default.schema.json` |

Horizon emits most visual tokens as CSS variables (`--color-foreground`, `--color-background`, type sizes, spacing). Add or change tokens in `settings_schema.json`, then wire them in `theme-styles-variables.liquid` / `color-palette.liquid`. Use those variables in `assets/base.css` and `{% stylesheet %}` blocks.

Keep `assets/package.json` (`{ "type": "module" }`). It is part of Horizon’s JS modules and must be uploaded.

## Font Awesome kit (separate ownership)

Icons use a Font Awesome 6/7 **kit** owned outside this repo. Do not vendor FA webfonts unless you intentionally switch to self-host.

1. Create a kit at [fontawesome.com/kits](https://fontawesome.com/kits) (Web Fonts + CSS or SVG + JS; FA 6 or 7).
2. Copy the kit ID from the embed URL: `https://kit.fontawesome.com/<KIT_ID>.js`.
3. In the theme editor: **Theme settings → Icons → Font Awesome kit ID**, paste `<KIT_ID>` only (placeholder text: `REPLACE_WITH_FA_KIT_ID`).
4. Leave blank to skip the remote kit script. Markup uses classes like `fa-solid fa-bell`; without a kit ID those icons stay empty.
5. Loader: `snippets/font-awesome.liquid`, included from `snippets/scripts.liquid` (and thus `layout/theme.liquid` / `layout/password.liquid`).

Example usage already wired: splash Enter arrow (`splash-intro.liquid`), header search when kit ID is set (`search.liquid`).

## Do not

- Push to live with `shopify theme push -e production` unless the change is meant for the published store.
- Ignore `assets/**` in `.shopifyignore`.
- Restyle live pages in `hydrogen/`.
- Hardcode Cloudflare tunnel URLs in committed files.

## Storefront JS bundle (Bun)

Liquid cannot import npm. Source lives in `scripts/src/`; `bun run build` (from `theme/`, or `bun run theme:build` from the repo root) emits Shopify-uploadable files in `assets/`. Edit the source, then rebuild — do not hand-edit the generated assets.

Verify the whole chain — imported by usecase → in the generated bundle → loaded by Liquid → initialized on the page → shipped with the theme — with `bun run verify` (or `bun run theme:verify` from the root). It runs before `bun run lint` and before `bun run ship`, and fails the build when a package, bundle, loader, initializer, microapp registry entry, or `.shopifyignore` rule breaks the chain. How each link is checked, and how to add a package: [`../docs/js-chain.md`](../docs/js-chain.md).

| Package | Role |
| --- | --- |
| `gsap` | Primary animation engine. `window.gsap` is published by the runtime; ScrollTrigger, SplitText, and Lenis wiring live in `scripts/src/horizon-scroll.js`. |
| `embla-carousel` | Carousel engine for `[data-mt-carousel]` rails (`scripts/src/carousel.js`). |
| `motion` | Vanilla animation (`animate`, `stagger`, `inView`, `scroll`). No React. |
| `zustand` | Vanilla stores (`createStore` from `zustand/vanilla`) for JS islands / microapps. |
| `lenis` | Smooth wheel scrolling inside `.page-wrapper`. |
| `@barba/core` | Room-to-room page transitions. |
| `@use-gesture/vanilla` | Drawer, lookbook, and vessel gestures. |
| `three`, `@react-three/fiber`, `react`, `react-dom` | Material study (`scripts/src/vessel.js`). |
| `vgpu`, `@vgpu/wgsl` | WebGPU heat and blaze effects. |

```bash
bun run --cwd theme build
bun run --cwd theme verify
# or from repo root:
bun run theme:build
bun run theme:verify
```

| Output | Loader | Initialized by |
| --- | --- | --- |
| `assets/maison-runtime.js` | `layout/theme.liquid` (defer, every page). Sets `window.MaisonRuntime` and `window.gsap`. | self (`boot()` on DOMContentLoaded) |
| `assets/maison-carousel.js` | `snippets/maison-flagship.liquid` → `MaisonAssets.carousel` | `maison-runtime.js` → `ensureCarousel()` on intersection |
| `assets/maison-vessel.js` | `snippets/maison-flagship.liquid` → `MaisonAssets.vessel` | `maison-runtime.js` → `ensureVessel()` on intersection |
| `assets/maison-idle-blaze.js` | `snippets/maison-flagship.liquid` → `MaisonAssets.idleBlaze` | `effects/idle-blaze-loader.js` after idle |
| `assets/maison-search-assist.js` | `snippets/search-modal.liquid` (once per page) | self (`boot()` on DOMContentLoaded) |
| `assets/maison-heat.js` | `sections/maison-thermal.liquid` (defer) | self, re-boots on `maison:page-enter` |
| `assets/microapp-lookbook.js` | `sections/maison-microapp.liquid` (`embed: iframe` in `microapps/apps.json`) | inside the sandboxed iframe |
| `assets/microapp-kansa.js` | `sections/kansa-app.liquid` (`embed: section`) | self |

Hand-written assets (not built): `assets/maison-motion.js` and `assets/maison-sound.js`, both loaded from `snippets/scripts.liquid`. `maison-motion.js` runs on `window.gsap`; the former `anime.esm.js` and `motion.esm.js` vendored copies are gone, so the storefront ships one animation engine.

The Panopticon lens (`Human` / `Engineer` / `Machine`) is behaviour in `scripts/src/lens.js`, bundled into the runtime — not a `{% javascript %}` tag on `blocks/_product-card-lens.liquid`, which repeated per card and left `sections/maison-view-as.liquid` dead on pages without a card lens.

Keep `assets/package.json` as `{ "type": "module" }` (Horizon ESM). `scripts/` is in `.shopifyignore`; the bundled files in `assets/` are what Shopify uploads. Do not replace Horizon with a SPA; preserve server-rendered Liquid HTML and native Shopify commerce forms.

## Awwwards SOTY 2026 Theme Implementation Rules

Read [`../docs/awwwards-grand-plan.md`](../docs/awwwards-grand-plan.md) for the complete specification.

1. **Accessibility & Screen Readers**:
   - Every kinetic text reveal (`SplitType`) MUST maintain an `aria-label` on the parent container while split child words/characters carry `aria-hidden="true"`.
   - Never remove visible focus indicators.
2. **The 3-Mode Panopticon Card**:
   - Product cards in collection grids and carousels implement a 3-way toggle button: `Human` (4K photography), `Engineer` (SVG CAD stratigraphy blueprint), and `Machine` (ASCII art + JSON-LD token view).
3. **Multi-Modal Scroll Coordination**:
   - Multi-input awareness: touch passthrough on mobile, 1:1 on trackpad, smoothed interpolation on mouse wheel, instant focus-jump on keyboard navigation.
4. **Zero-Backend Profiler & Dev Purge**:
   - The 45% exploration slide-up drawer saves preferences strictly in `localStorage`.
   - Ensure the footer includes the `[ Reset Session & Storage ]` link that clears `localStorage` and `sessionStorage` for instant evaluator reset.
5. **Streak scaffold (pre-checkout only)**:
   - Client model in `scripts/src/streak.js` (`localStorage` key `mt_streak`); optional cart-summary chip; skin via `html[data-mt-streak-tier]`.
   - Never fake Shopify checkout. Post-purchase streak UI → Checkout / Customer Account UI extensions — see [`../docs/streak-system.md`](../docs/streak-system.md).
6. **Password Template**:
   - Keep Horizon password templates minimal. Scene 0 exhibition entry is the static wrapper at `../gate/index.html`, not a themed Shopify password page.

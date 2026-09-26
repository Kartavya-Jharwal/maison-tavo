# Maison Tavo theme (Horizon)

This directory is the **live Shopify Liquid storefront**. It is a customized [Horizon](https://themes.shopify.com/) theme pulled from `maison-tavo.myshopify.com` (theme id `198667665777`, role live).

There is **no separate Liquid vs Horizon fork**. Do not restyle the Hydrogen app for production look-and-feel; `hydrogen/` is a secondary Oxygen preview only.

`config/settings_schema.json` keeps Shopify theme identity (`theme_name`: Horizon, `theme_version`: 4.2.0, `theme_author`: Shopify) so the admin still recognizes Horizon. Branding for this repo is `@maison-tavo/theme` and `shopify.theme.toml`.

## Commands

From the repo root:

```bash
bun run theme:check
bun run theme:build            # bundle scripts/src → assets (motion, zustand)
bun run dev:theme              # http://127.0.0.1:9292 — unpublished development theme
bun run dev:theme:https        # https://localhost:9443 → 9292 (second terminal; run `bun run certs` first)
```

From `theme/`:

```bash
bun run build
shopify theme dev -e development
shopify theme check
shopify theme pull -e production     # sync from live (skips settings_data.json)
shopify theme push -e production     # LIVE publish — allow-live, does not overwrite editor settings_data
shopify theme push -e development --development --nodelete   # unpublished only
```

`development` never targets the live theme. Live updates are an explicit production push.

Store: `maison-tavo.myshopify.com`  
Live editor: `https://maison-tavo.myshopify.com/admin/themes/198667665777/editor`  
`shopify theme dev` prints the preview URL and a development-theme editor URL.

## Where to edit (CSS / custom theme)

Work in this order. Prefer theme settings and CSS custom properties over one-off hardcoded colors.

| What | Where |
| --- | --- |
| Global settings schema (colors, typography, layout, logo) | `config/settings_schema.json` |
| Current setting values (editor state) | `config/settings_data.json` — **do not push to live**; production env ignores it |
| Design tokens / CSS variables from settings | `snippets/theme-styles-variables.liquid` |
| Color palette custom properties | `snippets/color-palette.liquid` |
| Font loading | `snippets/fonts.liquid` |
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

## Do not

- Push to live with `shopify theme push -e production` unless the change is meant for the published store.
- Ignore `assets/**` in `.shopifyignore`.
- Restyle live pages in `hydrogen/`.
- Hardcode Cloudflare tunnel URLs in committed files.

## Storefront JS bundle (Bun)

Liquid cannot import npm. Source lives in `scripts/src/`; `bun run build` (from `theme/`, or `bun run theme:build` from the repo root) emits Shopify-uploadable files in `assets/`. Edit the source, then rebuild — do not hand-edit the generated assets.

| Package | Role |
| --- | --- |
| `motion` | Vanilla animation (`animate`, `stagger`, `inView`, `scroll`). No React. |
| `zustand` | Vanilla stores (`createStore` from `zustand/vanilla`) for JS islands / microapps. |

```bash
bun run --cwd theme build
# or from repo root:
bun run theme:build
```

| Output | Loader |
| --- | --- |
| `assets/maison-runtime.js` | IIFE, sets `window.MaisonRuntime`. Loaded from `snippets/splash-intro.liquid` (`defer`). |
| `assets/microapp-lookbook.js` | Lookbook island (Zustand + Motion). Loaded by `sections/maison-microapp.liquid` inside the sandboxed iframe. |

Keep `assets/package.json` as `{ "type": "module" }` (Horizon ESM). `scripts/` is in `.shopifyignore`; the bundled files in `assets/` are what Shopify uploads. GSAP, Lenis, and React are not in this bundle — do not replace Horizon with a SPA.

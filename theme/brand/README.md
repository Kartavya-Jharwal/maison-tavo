# Brand tokens (plug-and-play bible)

`tokens.json` is the **canonical brand bible** for this Horizon theme. Shopify cannot read this file at runtime. Theme settings + CSS custom properties are the runtime layer.

This folder is repo-only (not a Shopify theme directory). Do not rewrite sections when retargeting a client.

## Layers

1. **Primitive** — raw values (`#ffffff`, `0.5rem`, `0.125s`).
2. **Semantic** — purpose (`canvas`, `ink`, `border`). Horizon already maps these to `--color-background`, `--color-foreground`.
3. **Component** — one UI surface (`--splash-background`). Components only reference semantic/primitive CSS variables.

CSS agents consume **`--*` variables**, never hex in section CSS.

## Swap a client bible

1. Replace `theme/brand/tokens.json` with the client file (keep the same keys / `css` / `setting` ids). Validate against `brand.schema.json` if you have a JSON Schema tool.
2. Copy values into Theme settings:
   - **brand_tokens** — primitives for spacing, radius, shadow, motion, z-index, breakpoints, borders, extra colors.
   - **Colors / Typography / Page layout** — semantic canvas, ink, and font pickers (this snapshot: white/black, Inter, narrow page width).
3. Leave `config/settings_data.json` alone unless you are working in the theme editor. Production push already ignores it.
4. Do not restyle sections. Existing Horizon CSS already uses `--color-*`, `--padding-*`, `--layer-*`, `--animation-*`. Brand settings override those ids on `:root`.

## Runtime wiring

| Source | Role |
| --- | --- |
| `theme/brand/tokens.json` | Human/agent bible |
| `config/settings_schema.json` groups `brand_tokens` and `splash_experience` | Merchant-editable defaults |
| `snippets/theme-styles-variables.liquid` | Emits and remaps `--*` on `:root` |
| `snippets/color-palette.liquid` | Semantic color aliases (`--brand-color-canvas` → `--color-background`) |
| `theme/STYLEGUIDE.md` | Index of layers, consumption rules, Horizon id map |

New UI (splash, future sections) should use `var(--brand-*)` with a Horizon fallback, for example `var(--brand-color-canvas, var(--color-background))`.

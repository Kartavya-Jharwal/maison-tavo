# Brand bible index

This is the **index** for Maison Tavo’s Horizon storefront tokens. It is not an invented identity: values match the current snapshot (white/black, Inter, narrow page width) unless a Theme setting already differs.

Canonical client file: [`brand/tokens.json`](brand/tokens.json). How to retarget: [`brand/README.md`](brand/README.md).

## Layers

```
primitive  →  semantic  →  component
#ffffff       canvas        splash background
0.5rem        space.xs      button padding
0.125s        motion.base   splash fade
```

| Layer | Owns | Example CSS |
| --- | --- | --- |
| Primitive | Raw brand values in `brand_tokens` settings | `--brand-color-white`, `--brand-space-md`, `--brand-motion-base` |
| Semantic | Purpose aliases, including existing Horizon ids | `--color-background`, `--brand-color-ink`, `--padding-md` |
| Component | One surface; never a second palette | `--splash-background` → `var(--brand-color-canvas)` |

Sections must use semantic or component variables. Do not hardcode hex, rem, or z-index in new CSS.

## How CSS agents consume tokens

1. Read `theme/brand/tokens.json` for the client value and the `css` / `setting` ids.
2. Prefer an existing Horizon `--*` id from the map below so current sections restyle without rewrites.
3. If the token is new, add it to `brand_tokens` in `config/settings_schema.json` (append-only group), emit it from `snippets/theme-styles-variables.liquid` or `snippets/color-palette.liquid`, and add it to `tokens.json`.
4. Do not fork a second palette in `assets/base.css`. Do not restyle `hydrogen/`.
5. Merchant `settings_data.json` is editor state; production push ignores it.

### Swap checklist

1. Drop the client bible on `theme/brand/tokens.json`.
2. Update Theme settings: **brand_tokens** plus Colors, Typography, and Page layout when semantic fonts/colors change.
3. Leave Liquid sections as-is.

## Current snapshot

From this repo’s Horizon pull (merchant-editable; not a locked spec):

| Token | Current |
| --- | --- |
| Canvas / ink | `#ffffff` / `#000000` |
| Palette color1 / color2 | `#333333` / `#DFDFDF` |
| Body / heading fonts | Inter (`inter_n4` / `inter_n7`) — schema defaults remain Work Sans / Anonymous Pro |
| Page width | `narrow` (`--narrow-page-width: 90rem`) |
| Sold-out badge background | `#eef1ea` (existing Horizon setting) |

## Runtime files

| File | Role |
| --- | --- |
| `brand/tokens.json` | Canonical bible |
| `brand/brand.schema.json` | Optional JSON Schema for the bible |
| `config/settings_schema.json` → `brand_tokens` | Primitive settings → CSS variables |
| `config/settings_schema.json` → `splash_experience` | Splash enable / duration / show-once |
| `snippets/theme-styles-variables.liquid` | `:root` primitives + remaps onto Horizon ids |
| `snippets/color-palette.liquid` | Semantic color + `--brand-color-canvas` / `--brand-color-ink` |
| `snippets/contrast-override.liquid` | Scoped section contrast |
| `assets/base.css` | Layout utilities; consumes `--*` only |

---

## Horizon CSS id map

Existing variables stay stable. Brand settings **remap** these ids so a bible swap restyles the theme.

### Color

Hardcoded Horizon roles, now driven by `brand_tokens` unless noted:

- `--color-error`, `--color-success`, `--color-white`, `--color-white-rgb`
- `--color-instock`, `--color-lowstock`, `--color-outofstock`

From Page layout / Colors (semantic, not duplicated in `brand_tokens`):

- `--color-background`, `--color-background-rgb` ← `page_background_color`
- `--color-foreground`, `--color-foreground-rgb` ← `page_text_color`
- `--color-border`, `--color-border-rgb`
- `--brand-color-canvas` / `--brand-color-ink` (aliases of the two above)
- `--palette-lightest`, `--palette-darkest` (+ `-rgb`)
- `--color-foreground-muted`, `--color-foreground-subdued`
- Button / input / variant roles from existing palette settings (see previous inventory)

### Typography

Font pickers (Typography group): `--font-body--*`, `--font-heading--*`, `--font-subheading--*`, `--font-accent--*`  
Aliases: `--brand-font-body`, `--brand-font-heading`, `--brand-font-subheading`, `--brand-font-accent`

Fluid sizes still come from `type_size_*`. Tracking/leading primitives: `--letter-spacing-sm`, `--line-height--body-normal`, `--line-height--heading-normal`.

### Spacing / radius / shadow / motion / z-index / breakpoints / borders

Primitives in `brand_tokens` remap:

- `--padding-*`, `--margin-*`, `--gap-*` ← `--brand-space-*` (Horizon snapshot exceptions kept literal: `--margin-2xs`/`--gap-2xs` `0.3rem`, `--gap-md` `0.9rem`, `--margin-6xl` `5rem`)
- `--style-border-radius-*` ← `--brand-radius-*`
- `--shadow-button` ← `--brand-shadow-sm`
- `--animation-speed*` / `--animation-easing` ← `--brand-motion-*`
- `--layer-*` / `--brand-z-splash`
- `--brand-breakpoint-sm|md|lg|xl` (for JS/new CSS; Horizon `@media` queries remain literal)
- `--style-border-width`, `--border-width-sm`

### Component: splash

- `--splash-background` → canvas
- `--splash-foreground` → ink
- `--splash-duration` ← `splash_duration`

Settings: group `splash_experience` (enable, duration, show-once storage, logo, skip label). Snippet: `snippets/splash-intro.liquid`, included from `layout/theme.liquid`. Not rendered on cart/checkout.

---

## Setting ids

Use `settings.<id>` when wiring tokens. Existing Horizon groups are unchanged. New groups (append-only):

### `brand_tokens`

Colors: `brand_color_white`, `brand_color_black`, `brand_color_accent`, `brand_color_muted`, `brand_color_error`, `brand_color_success`, `brand_color_instock`, `brand_color_lowstock`, `brand_color_outofstock`

Type: `brand_letter_spacing_sm`, `brand_line_height_body`, `brand_line_height_heading`

Space: `brand_space_3xs` … `brand_space_6xl`

Radius: `brand_radius_xs|sm|md|lg|pill`

Shadow: `brand_shadow_sm|md|lg`

Motion: `brand_motion_fast|base|medium|slow|easing`

Z-index: `brand_z_section_background`, `brand_z_lowest`, `brand_z_base`, `brand_z_flat`, `brand_z_raised`, `brand_z_heightened`, `brand_z_sticky`, `brand_z_window_overlay`, `brand_z_header_menu`, `brand_z_overlay`, `brand_z_menu_drawer`, `brand_z_temporary`, `brand_z_splash`

Breakpoints: `brand_breakpoint_sm|md|lg|xl`

Borders: `brand_border_width`, `brand_border_radius_utility`

### `splash_experience`

`splash_enable`, `splash_duration`, `splash_show_once`, `splash_storage`, `splash_show_logo`, `splash_heading`, `splash_skip_label`

### Existing Horizon groups (do not duplicate)

Logo: `logo`, `logo_inverse`, `logo_height`, `logo_height_mobile`, `favicon`  
Colors: `color_palette`  
Typography: `page_text_color`, `type_*`  
Page layout: `page_background_color`, `page_width`  
Plus badges, buttons, cart, drawers, inputs, popovers, product cards, swatches, variant pickers — same ids as before.

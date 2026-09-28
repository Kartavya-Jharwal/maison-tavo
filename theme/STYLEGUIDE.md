# Brand bible — Maison Tavo

Approved brand mapping for the Horizon storefront (M3). Values below are the locked identity for development theme work; merchant `settings_data.json` may diverge in the editor but should be retargeted to match.

Canonical client file: [`brand/tokens.json`](brand/tokens.json). How to retarget: [`brand/README.md`](brand/README.md).

## Layers

```
primitive  →  semantic  →  component
Raw Copper    accent         CTA / evidence OBSERVED
Cast Clay     canvas         page background / splash
Obsidian      ink            body text / headings
```

| Layer | Owns | Example CSS |
| --- | --- | --- |
| Primitive | Named brand colors in `brand_tokens` | `--brand-color-raw-copper`, `--brand-color-cast-clay` |
| Semantic | Horizon roles remapped to brand | `--color-background` ← Cast Clay, `--color-foreground` ← Obsidian |
| Component | One surface | `--splash-background` → `var(--brand-color-canvas)` |

Sections must use semantic or component variables. Do not hardcode hex in new CSS.

## Palette (approved)

| Name | Hex | Setting | CSS |
| --- | --- | --- | --- |
| Raw Copper | `#C4784A` | `brand_color_raw_copper` | `--brand-color-raw-copper` |
| Aged Bronze | `#6E5A3D` | `brand_color_aged_bronze` | `--brand-color-aged-bronze` |
| Obsidian Charcoal | `#1A1714` | `brand_color_obsidian_charcoal` | `--brand-color-obsidian-charcoal` |
| Cast Clay | `#E8DFD4` | `brand_color_cast_clay` | `--brand-color-cast-clay` |
| Damascus Silver | `#9A9B9E` | `brand_color_damascus_silver` | `--brand-color-damascus-silver` |

Horizon `color_palette` mapping (do not change the dynamic-default *structure*):

| Role | Brand color |
| --- | --- |
| `background` | Cast Clay |
| `foreground` | Obsidian Charcoal |
| `color1` | Raw Copper |
| `color2` | Damascus Silver |

## Typography (approved)

| Role | Face | How |
| --- | --- | --- |
| Headings / display | **Fraunces Variable** (self-hosted WOFF2) | `fonts.liquid` → `--font-fraunces--family`; remapped onto `--font-heading--family` in `theme-styles-variables.liquid` |
| Body / UI | Inter (Shopify font picker) | `type_body_font` / `type_subheading_font` |
| Specs / mono | **Anonymous Pro** | `type_accent_font` → `--font-mono--family` / `--brand-font-mono` |

Font engineering: latin preload + latin-ext on demand, `font-display: swap`, Georgia metric override (`size-adjust` / `ascent-override`) for near-zero CLS.

## Voice

- Dual depth (D3): technologist reads specs and machine-readable fields; curator reads craft and three-place provenance (D2).
- Evidence tiers on About: **VERIFIED** / **OBSERVED** / **HYPOTHESIS** — never present unaudited claims as fact.
- D4 claim (rescoped): *first in cookware to make the product spec layer machine-readable* — not unqualified “first in agentic commerce.”
- CONCEPT_SPEC products: no invented performance numbers in storefront copy.

## How CSS agents consume tokens

1. Read `theme/brand/tokens.json` for the client value and the `css` / `setting` ids.
2. Prefer an existing Horizon `--*` id so current sections restyle without rewrites.
3. New tokens: append to `brand_tokens` in `config/settings_schema.json`, emit from `snippets/theme-styles-variables.liquid` or `snippets/color-palette.liquid`, add to `tokens.json`.
4. Do not fork a second palette in `assets/base.css`. Do not restyle `hydrogen/`.
5. Merchant `settings_data.json` is editor state; production push ignores it.

## Runtime files

| File | Role |
| --- | --- |
| `brand/tokens.json` | Canonical bible |
| `config/settings_schema.json` → `brand_tokens` | Named palette + primitive aliases |
| `snippets/color-palette.liquid` | Semantic Horizon colors + brand palette CSS vars |
| `snippets/theme-styles-variables.liquid` | Type ramp, Fraunces heading remap, mono alias |
| `snippets/fonts.liquid` | Self-hosted Fraunces WOFF2 |
| `assets/base.css` | Layout utilities; consumes `--*` only |

## Experience constraints (D10)

- Sound: opt-in, silent by default.
- Motion: respects `prefers-reduced-motion`; opacity/transform only on hero and spec-table stagger.

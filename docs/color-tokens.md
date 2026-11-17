# Maison Tavo color tokens

**Owner:** color token system (`--mt-color-*`).  
**Sources of truth in theme:** `theme/snippets/theme-styles-variables.liquid` (early `:root`) and `theme/snippets/color-palette.liquid` (last in `<head>`, wins over settings drift).  
**Do not** redefine these hex values in component CSS — consume tokens. Typography and spacing are owned elsewhere.

## Canonical palette

| Token | Hex | RGB companion | Role |
| --- | --- | --- | --- |
| `--mt-color-soot` | `#14110f` | `--mt-color-soot-rgb: 20, 17, 15` | Ink; night section grounds |
| `--mt-color-limewash` | `#efe8dc` | `--mt-color-limewash-rgb: 239, 232, 220` | Default page canvas |
| `--mt-color-bone` | `#f7f2e9` | `--mt-color-bone-rgb: 247, 242, 233` | Raised surfaces; light text on soot |
| `--mt-color-bell` | `#b8893a` | `--mt-color-bell-rgb: 184, 137, 58` | Kansa bronze accent |
| `--mt-color-copper` | `#c2703d` | `--mt-color-copper-rgb: 194, 112, 61` | Category / metal accent |
| `--mt-color-clay` | `#8e4b35` | `--mt-color-clay-rgb: 142, 75, 53` | Fired-clay secondary |
| `--mt-color-steel` | `#8c9094` | `--mt-color-steel-rgb: 140, 144, 148` | Cool counterpoint; muted UI |
| `--mt-color-verdigris` | `#4f7f72` | `--mt-color-verdigris-rgb: 79, 127, 114` | Patina / success |
| `--mt-color-ember` | `#e2552b` | `--mt-color-ember-rgb: 226, 85, 43` | Heat only (hover CTA, heat map, error) |

Legacy short aliases (`--soot`, `--limewash`, …) resolve to the matching `--mt-color-*`. Prefer the `--mt-color-*` names in new CSS.

Alpha compositing:

```css
color: rgb(var(--mt-color-soot-rgb) / 0.7);
border-color: rgb(var(--mt-color-bell-rgb) / 0.3);
```

## Semantic surfaces (`--mt-surface-*`)

| Surface | Maps to |
| --- | --- |
| `--mt-surface-canvas` | limewash |
| `--mt-surface-raised` | bone |
| `--mt-surface-ink` | soot |
| `--mt-surface-accent` | bell |
| `--mt-surface-heat` | ember |
| `--mt-surface-metal` | copper |
| `--mt-surface-clay` | clay |
| `--mt-surface-steel` | steel |
| `--mt-surface-patina` | verdigris |
| `--mt-surface-border` | bell @ 30% |
| `--mt-surface-border-subtle` | soot @ 10% |

## Horizon `--color-*` bridge (safe map)

| Horizon token | Maison |
| --- | --- |
| `--color-background` / `-rgb` | limewash |
| `--color-foreground` / `-rgb` | soot |
| `--color-border` / `-rgb` | soot |
| `--color-shadow-rgb` | soot RGB |
| `--color-success` / `-rgb` | verdigris |
| `--color-error` / `-rgb` | ember |
| `--color-white` / `-rgb` | bone |
| `--color-instock` | verdigris |
| `--color-lowstock` | bell |
| `--color-outofstock` | steel |
| Primary button bg / text / border | soot / bone / bell |
| Primary button hover | ember / `#ffffff` / ember |
| Secondary button | soot text, bell border, transparent fill |
| Input bg / text / border | bone / soot / soot @ 20% |

## WCAG contrast pairs (AA text)

Ratios vs WCAG 2.1: **AA body ≥ 4.5:1**, **AA large (≥18px / 14px bold) ≥ 3:1**.

### Approved for body text (≥ 4.5:1)

| Foreground | Background | Ratio | Notes |
| --- | --- | --- | --- |
| soot | limewash | 15.44 | Default body |
| soot | bone | 16.86 | Raised cards |
| bone | soot | 16.86 | Night sections |
| limewash | soot | 15.44 | Soft night body |
| clay | limewash | 5.38 | Secondary body |
| clay | bone | 5.87 | Secondary on raised |
| bone | clay | 5.87 | Light on clay band |
| copper | soot | 5.08 | Metal on night |
| steel | soot | 5.85 | Cool label on night |
| bell | soot | 5.98 | Accent label on night |
| ember | soot | 4.99 | Heat label on night |
| `#ffffff` | soot | 18.80 | Pure white on night |

### Large text / UI chrome only (≥ 3:1, &lt; 4.5:1)

| Foreground | Background | Ratio |
| --- | --- | --- |
| copper | limewash | 3.04 |
| copper | bone | 3.32 |
| verdigris | limewash | 3.74 |
| verdigris | bone | 4.08 |
| verdigris | soot | 4.13 |
| ember | limewash | 3.10 |
| ember | bone | 3.38 |
| `#ffffff` | ember | 3.77 |
| bone | verdigris | 4.08 |

### Do not use for text (fail AA)

| Foreground | Background | Ratio | Use instead |
| --- | --- | --- | --- |
| bell | limewash | 2.58 | Decorative borders/icons; text → soot or clay |
| bell | bone | 2.82 | Same |
| steel | limewash | 2.64 | Icons only; text → soot |
| steel | bone | 2.88 | Same |
| clay | soot | 2.87 | Use bone or limewash on soot |

## Category theming (visual register)

- Category 1: soot + steel + bell  
- Category 2: clay + copper + limewash  
- Category 3: verdigris + bone + bell  

Swap via CSS variables on a route/section wrapper; keep `--mt-color-*` primitives fixed.

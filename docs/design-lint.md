# Design lint (theme)

Local, free design gate for Maison Tavo Liquid — pairs with `shopify theme check`. No paid SaaS.

## Run

```bash
bun run theme:lint          # design audit only (exit 1 on errors)
bun run theme:lint:all      # design audit + shopify theme check
# or from theme/:
bun run design:lint
bun run lint
```

Script: `theme/scripts/design-lint.mjs`.

## What it catches

| Rule | Severity | Intent |
| --- | --- | --- |
| `no-px-font-size` | error | Brand CSS must use `--font-size--fluid-*` / `--font-size--brand-*` |
| `no-overbroad-class-substring` | error | Ban `[class*="menu\|nav\|footer\|heading\|price\|pill\|button"]` |
| `focus-visible-required` | error | `outline: none` needs a nearby `:focus-visible` ring |
| `no-remote-google-fonts` | error | Self-host WOFF2 via `snippets/fonts.liquid` |
| `no-duplicate-footer` | error | One footer in section groups (`maison-footer` only) |
| `reset-session-link` | error | Footer purge control for jury/dev resets |
| `contrast-aa` | warn/error | Hard-coded hex text vs soot/limewash (or same-rule background) |
| `prefer-fluid-spacing` | warn | Large hard-coded `padding: NNNNpx` |

Re-download brand faces (including JetBrains Mono + Devanagari): `bun theme/scripts/download-brand-fonts.mjs`.

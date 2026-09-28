# M0 theme spikes (WS5)

Engineering spikes that prove vendored libs, self-hosted type, and Web Speech on the Horizon theme **without a build step**. All four are fully removable (D10): delete the listed assets/scripts/section and the storefront falls back to stock Horizon.

Dev preview after `shopify theme push --development --nodelete`:

```text
https://maison-tavo.myshopify.com/?preview_theme_id=<id>
```

Storefront password is required. Voice needs a secure context — use the Shopify HTTPS preview URL (or `bun run dev:theme:https` once the local proxy works).

---

## Motion

| | |
| --- | --- |
| **Vendored** | anime.js **v4.1.4** → `theme/assets/anime.esm.js`; Motion (motion.dev vanilla) **v12.43.0** → `theme/assets/motion.esm.js` (flat under `assets/` — Shopify rejects asset subfolders) |
| **Module** | `theme/assets/maison-motion.js` (ESM: imports both vendors) + `theme/assets/maison-motion.css` |
| **Wired in** | `theme/snippets/scripts.liquid` — all storefront templates (hero + cards + specs + cart) |
| **Demo** | Homepage hero stagger; product/resource card scroll reveals; `.maison-spec-table` row stagger on intersect; cart-icon / bubble scale pulse on add |

### Verify on preview

1. Open the homepage on the development-theme preview URL.
2. Hard-refresh: hero content blocks should stagger in; hero media should ease from slight zoom to 1.
3. Scroll a collection or product grid: cards below the fold fade/rise in once (no layout shift).
4. On a PDP with the Maison spec table: rows stagger when the table enters view.
5. Add to cart: header cart icon (and bubble, if present) gives a short scale pulse.
6. Enable OS/browser **prefers-reduced-motion**: animations must not run; content stays visible.
7. DevTools Network: `maison-motion.js`, `maison-motion.css`, `anime.esm.js`, `motion.esm.js` return 200 (not 404).

### Learned

- Horizon can load relative ESM imports under `assets/` with no Bun/Vite pass for these spikes.
- anime.js v4 API (`animate` + `stagger`) and Motion’s vanilla `animate` coexist when imported under different names.
- Opacity/transform-only keeps CLS near zero; reduced-motion must gate the whole module.
- Prep opacity only for below-fold targets (inline from JS) so a failed/missing module never leaves above-fold content invisible.

### Still needed (M3 / M4)

- Decide whether later motion stays hand-vendored or moves into `theme/scripts` → `maison-runtime.js` bundle.
- Productize selectors further if Horizon card markup changes; optional view-transition hooks.

### M3/M4 expansion

Eye-candy pass (this milestone): scroll-triggered card + spec reveals, cart feedback pulse, motion CSS to suppress competing load-time spec keyframes when JS is active, motion loaded on all templates (not index-only). Splash entrance/exit timing tightened in `splash-intro` CSS only (no heading-copy changes). Still D10: reduced-motion off-ramp, silent-by-default sound, fully removable assets.

---

## Sound

| | |
| --- | --- |
| **Vendored** | Howler.js **v2.2.4** (`howler.core.min.js`) → `theme/assets/howler.core.min.js` (UMD; attaches `window.Howl`) |
| **Asset** | `theme/assets/maison-add-to-cart.wav` |
| **Module** | `theme/assets/maison-sound.js` + `theme/assets/maison-sound.css` |
| **Wired in** | `theme/snippets/scripts.liquid` — classic Howler script + `window.maisonSound.src` + ESM module (all templates) |
| **Demo** | Fixed bottom-left **Sound off/on** toggle (status dot, aria-label, 44px min hit area); on opt-in, plays the WAV on `shopify:cart:lines-update` when action is `add` |

### Verify on preview

1. Any page: toggle appears bottom-left; default is **Sound off** (silent); label/title state the off-by-default policy.
2. Click toggle → short click plays (unlocks AudioContext); label flips to **Sound on**; preference in `localStorage` key `maison:sound-enabled`.
3. With sound on, add a product to cart → click should play once. Remove/update should stay quiet.
4. Network: `howler.core.min.js`, `maison-sound.js`, `maison-sound.css`, `maison-add-to-cart.wav` all 200.

### Learned

- Howler has no usable ESM browser build for this path — classic script + `window.Howl` is the workable pattern.
- Lazy `Howl` construction avoids loading audio until the shopper opts in at least once.
- Cart event payload must filter on `action === 'add'` or updates/removes spam the cue.

### Still needed (M3 / M4)

- Broader soundscape (checkout affordances, Kansa cues) still silent-by-default (D10).
- Replace placeholder WAV with designed Maison cue; volume/mix polish.
- Optional: theme-settings slot for the control instead of the fixed corner toggle.

### M3/M4 expansion

Toggle UX clarified (aria-label / title / on-state dot via `maison-sound.css`). Soft feedback remains limited to opt-in confirmation + add-to-cart — no ambient bed.

---

## Fonts

| | |
| --- | --- |
| **Vendored** | Fraunces Variable (OFL-1.1) via `@fontsource-variable/fraunces` **5.3.0** — `fraunces-latin-full-normal.woff2`, `fraunces-latin-ext-full-normal.woff2` |
| **Wired in** | `theme/snippets/fonts.liquid` — preload latin; `@font-face` for latin + latin-ext; `--font-fraunces--family`; Georgia `size-adjust: 104%` fallback |
| **Demo** | Homepage `.hero__content-wrapper .text-block` uses Fraunces at `font-weight: 550`, `font-variation-settings: 'opsz' 144` |

### Verify on preview

1. Homepage hero headline renders in Fraunces (not the theme’s default heading stack).
2. Network: latin WOFF2 preloaded and 200; latin-ext only if extended glyphs appear.
3. DevTools → Computed / Rendering: `font-display: swap`; with slow 3G, fallback Georgia should not jump wildly (metric override).
4. Axes present: `opsz` 9–144, `wght` 100–900 (SOFT/WONK available in the face; spike only sets opsz).

### Learned

- Self-hosting two subset WOFF2s is enough for a CLS-conscious display face without Google Fonts runtime.
- CSS variable `--font-fraunces--family` is the handoff point for M3 brand type settings.
- Spike scopes Fraunces to the hero text block only — easy to widen later without a full theme font rewrite.

### Still needed (M3 / M4)

- Wire Fraunces into theme settings / `theme-styles-variables.liquid` as a first-class heading or accent option.
- Full type ramp (weights, optical sizes per component), not only hero opsz 144.
- Confirm latin-ext coverage against real product copy (diacritics in SKUs/names).

---

## Voice

| | |
| --- | --- |
| **Vendored** | None (browser Web Speech API) |
| **Section** | `theme/sections/maison-voice-spike.liquid` |
| **Wired in** | `theme/templates/password.json` → section `maison_voice_spike` |
| **Demo** | Password page: Listen button → SpeechRecognition → scripted reply → SpeechSynthesis. Try “how do I season a pan” or “sear / temperature”. |

### Verify on preview

1. Open the **password** template on the development theme (HTTPS preview URL).
2. Support line should show `secure context: true` and SpeechRecognition availability (Chrome/Edge best; Safari/Firefox often recognition-missing).
3. Allow mic → Listen → speak a cue → status shows transcript + spoken reply.
4. Deny mic → `not-allowed` error path.

### Learned

- Password page is a convenient secure-context sandbox while the store is password-gated.
- Scripted intents (season / sear) prove D9’s replaceable interface shape before a real backend.
- Recognition is browser-gated; synthesis-only fallback is required for incomplete support.

### Still needed (M3 / M4)

- Move from password spike to `/pages/kansa` with real UX (not dashed engineering chrome).
- Expand intents + voice-to-cart stub; keep interface swappable for OpenAI Realtime (Phase 3 / D9).
- Remove `maison-voice-spike` from `password.json` before any production-facing polish.

---

## Removability checklist

| Spike | Delete |
| --- | --- |
| Motion | `maison-motion.js`, `maison-motion.css`, `anime.esm.js`, `motion.esm.js`, motion tags in `scripts.liquid` |
| Sound | `maison-sound.js`, `maison-sound.css`, `howler.core.min.js`, `maison-add-to-cart.wav`, Howler/`maisonSound`/module block in `scripts.liquid` |
| Fonts | Fraunces block in `fonts.liquid` + both `fraunces-*.woff2` |
| Voice | `sections/maison-voice-spike.liquid` + `maison_voice_spike` entry in `password.json` |

## Related

- Roadmap: [roadmap.md](roadmap.md) (M0 spikes, M4 build)
- Decisions: [decisions.md](decisions.md) (D9 voice, D10 sound/motion)
- Dev loop: [development.md](development.md)

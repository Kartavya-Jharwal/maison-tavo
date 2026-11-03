# VISUAL-REGISTER.md: Maison Tavo storefront

Scope: the visual language, motion, and build of the storefront. Undated on purpose. Nothing here is ranked out; the order is dependency order. Companion to PLAN.md (threads S2, S3, S4, S7, M1, M6, B2, B3).

## 0. Stack reality check (verify before building further)
- Native Shopify theme hosting: The live storefront is customized Horizon on `maison-tavo.myshopify.com` (Theme #198667665777), bundled locally with Bun.
- Products, metafields and checkout all live in the dev store.
- Host is native Shopify CDN with local one-command deploy (`bun run ship`).
- Keep a thin fallback path so a failed 3D or audio load never blocks browsing or checkout.

## 1. Art direction in one paragraph
**"The forge, the kitchen, the temple bell."** A quiet, tactile, warm-metal world: lime-washed walls, soot, bell bronze, raw copper, fired clay, a single ember accent for heat. Surfaces feel *struck, hammered and fired*, never glossy-SaaS. Large type, generous negative space, slow confident motion, and one recurring gesture: **the strike**, a bell-tone ripple that radiates outward from wherever you act. The brand reads Western-premium on first glance and Indian-rooted on second, through craft and material rather than ornament.

**Never:** mandala or paisley overlays, saffron-orange gradients, "ethnic" fonts, stock steam, neon-on-black, purple AI gradients, glassmorphism everywhere, generic 3D blobs.

## 2. Tokens (single source, consumed by Theme, MkDocs, deck, A3 kit)
```css
:root{
  --soot:#14110F;      /* ink, backgrounds for night sections */
  --limewash:#EFE8DC;  /* default page ground */
  --bone:#F7F2E9;      /* raised surfaces */
  --bell:#B8893A;      /* kansa bronze, primary accent */
  --copper:#C2703D;    /* category 2 accent */
  --clay:#8E4B35;      /* fired-clay secondary */
  --steel:#8C9094;     /* category 1 counterpoint */
  --verdigris:#4F7F72; /* patina, success, care kit */
  --ember:#E2552B;     /* heat only: CTAs on hover, heat map, last call */
  --ease-strike:cubic-bezier(.2,.8,.2,1);
  --dur-slow:900ms; --dur-mid:420ms; --dur-fast:160ms;
}
```
Category theming: Category 1 pairs soot, steel and bell; Category 2 pairs clay, copper and limewash; Category 3 pairs verdigris, bone and bell. A category colour swaps in through CSS variables on the route wrapper, so every component restyles for free.

## 3. Typography
- **Display:** a high-contrast serif with optical sizing (Fraunces or Instrument Serif). Huge, tight, sometimes italic for emphasis words ("*struck*", "*fired*").
- **Text/UI:** a clean grotesque (Hanken Grotesk, Geist or similar), moderate weight.
- **Devanagari companion:** Tiro Devanagari Hindi or Noto Serif Devanagari, used for the kansa wordmark lockup, bell-chant lines and voice-page captions. Pair sizes optically, not numerically.
- **Mono:** JetBrains Mono or IBM Plex Mono, only in Agent and Voice views and spec tables, so machine surfaces look machine.
- Scale: fluid `clamp()` steps, display up to ~14vw on hero, body 17-19px, long measure never beyond 68ch. Variable fonts, subset, `font-display: swap`, preload the display face.

## 4. Material language (what surfaces look like)
- **Metal (Cat 1):** brushed anisotropic sheen via layered `conic-gradient` plus noise; hammered texture as a tiled normal-map overlay at low opacity; edges catch light with a 1px highlight.
- **Clay (Cat 2):** grain texture, soft inner shadow, slightly uneven radii on image masks (organic, hand-formed).
- **Limewash ground:** subtle large-scale mottling (SVG turbulence filter or pre-baked texture), never flat white.
- **Soot sections:** deep warm black with faint ember glow bleeding from the bottom edge of hero and the last-call section.
- **Paper grain** over everything at ~3-4% for cohesion. Respect reduced-motion and performance by baking textures, not running filters live.

## 5. Signature moves (the eye candy, specified)
**V1 The Strike (global).** On any primary action, concentric rings expand from the pointer in bell-bronze, fading with slow easing; an optional soft bell tone plays if sound is on. Implement as one reusable `<Strike/>` effect on `pointerdown` for key buttons only (not every click) so it stays special.

**V2 Hero: "Heat takes shape."** Full-bleed hero. A hero pan/tava is rendered (3D or pre-rendered sequence) on limewash. On scroll, the metal warms from steel-grey through bronze to a faint ember glow at the rim, while the headline words resolve from blurred to sharp. One line of Devanagari kansa lockup sits as a quiet signature.

**V3 Layer cross-section (S4).** Pinned scroll scene per product family: the pan peels apart into its layers (clad: bonded base, core, interior; clay-copper: clay body, copper layer, metal reinforcement) with leader lines and short labels, then a **heat-spread toggle** switches a gradient map across the cutaway to show distribution. Built in SVG/CSS scroll-driven animation first; upgrade to react-three-fiber only if it earns its weight.

**V4 View-as Human / Agent / Voice (M1).** A segmented control on every product page. Human = the editorial layout. Agent = the page re-renders as a mono-typed JSON-LD document with syntax colouring and a "copy endpoint" button. Voice = a waveform view with the SSML text highlighting word-by-word as it speaks, bell tone first. Transition between views uses the View Transitions API so the same product morphs between forms. This is the thesis, visible.

**V5 Care ritual scroller.** On PDP and care kit: a horizontal, pinned sequence (season, cook, clean, dry, oil) with large numerals, hand-drawn line illustrations, and a bell tone marking each step in sound mode.

**V6 Finder as ceremony (S3).** One question per screen, huge type, tactile option tiles that "strike" on selection; progress as a ring of five bell marks; results arrive as cards that settle in with a slight weighted drop. Reasoning chips animate in under each result ("induction-ready: bonded base").

**V7 Last-call section.** A soot-black closing band on Home: ember glow, a single line of copy, a bell icon that rings (with sound enabled) and a waitlist or pre-order field. Ties the bell ritual to conversion.

**V8 Living About page (S7).** Diagnostic argument as an editorial scroll. Alongside it, a live panel showing the discoverability tracker (what each assistant said, whether Maison Tavo appeared) as a quiet data strip. The page proves itself.

**V9 Kansa panel.** A bottom-right bell icon opens a drawer: chat/voice, three persona toggles for synthetic buyers, and a visible "readiness tier" badge (Simulated) so the claim is honest in the UI. Haggle messages show offer/counter chips with a small bronze price tag animation.

**V10 Micro-details.** Custom cursor that becomes a soft bronze ring over products; image hover reveals a second angle with a clip-path wipe; price digits count with tabular numerals; 404 as a burnt pan with a witty line; password page as a sealed brass-plate "enter" interaction.

## 6. Layout system
- 12-col grid, generous gutters, asymmetric compositions; product images frequently break the grid and overlap type.
- Rhythm: alternate limewash and soot bands; one full-bleed moment per page; never more than three consecutive sections with the same layout.
- Spacing scale on a 4/8 base with large "air" steps (96-160px) between narrative beats.
- Product cards: image-led, name in display serif, one-line spec in mono, price in text face, quick-add appears on hover/focus.

## 7. Page-by-page
- **Home:** V2 hero → category triptych (three portals themed by category) → "ask before you buy" teaser into the finder → craft/provenance band → V3 teaser → press-style proof strip (research, tracker) → V7 last call.
- **Collection:** large category intro with material swatches, filters that speak in cooking terms (heat source, size, set vs single), grid with occasional editorial interstitials.
- **PDP:** gallery with zoom and 3D toggle, V4 View-as, specs table (from schema), Q&A block ("ask before you buy"), V5 care ritual, bundle suggestions, compatible lids.
- **Finder:** V6.
- **About:** V8.
- **Kansa / Voice:** V9 plus a dedicated voice page with pronunciation of "Tavo" and kansa story with the bell.
- **Cart/Checkout:** calm, high-contrast, minimal motion, trust cues, test-mode banner.
- **Gate:** brass-plate page with request-access form.

## 8. Theme / Preact build prescriptions
- **Structure:** templates for index, collections, products, pages (about, faq, voice, ucp, kansa), finder, cart, 404, password.
- **Component system:** tokens → CSS variables; a small primitives layer before any page-specific component.
- **Animation:** CSS scroll-driven animations with IntersectionObserver fallback; motion library for orchestrated sequences; View Transitions for route and view changes.
- **Sound:** Web Audio, small bell sample, off by default, an unobtrusive toggle persisted in storage, autoplay rules respected.
- **Agent surface:** JSON-LD injected per product, public llms.txt and agent JSON route, View-as reads from the same objects.
- **Voice:** browser speech synthesis driven by SSML-derived text, language switch for Hindi and English.
- **Gate:** styled brass-plate access page; password in the submission note and the video.

# Maison Tavo — Awwwards SOTY 2026 Grand Plan

**Target**: Awwwards Site of the Day (SOTD) → Site of the Month (SOTM) → Site of the Year (SOTY) 2026  
**Guiding Philosophy**: *Restrained Monumentality & Sacred Utility.* Grounded in **Jakob’s Law of Internet User Experience**—innovate where it creates emotion, depth, and reverence; keep commerce intuitive, fast, and familiar.  
**Platform**: Shopify CLI 3.x Custom Horizon Liquid Theme + Bun Asset Pipeline (`theme/scripts/src/`). Pure theme runtime, zero external server dependencies.  
**Criteria Matrix**: Design: 40% | Usability: 30% | Creativity: 20% | Content: 10%

---

## 1. The Core Creative Thesis: Restriction & Reverence

The greatest luxury e-commerce sites (Cubitts, P448, Aesop, Lando Norris) never confuse their visitors. A buyer is looking for a skillet, a griddle, or a knife. If an interface makes buying a pan feel like operating a particle accelerator, it fails both usability and commerce.

Maison Tavo wins **Site of the Year** not through overwhelming gimmicks, but through **impeccable restraint**:

1. **The Object is Sacred**: Rooted in ancestral Indian metallurgy—the 78/22 high-tin bronze alloy (*kansa*) passed down from grandmothers' kitchens, merged with contemporary precision craftsmanship.
2. **Jakob’s Law Respected**: Navigation, carousels, variant pickers, cart drawers, and checkout work *exactly* as users expect—instant, reliable, and frictionless.
3. **The Innovation Lives in the Layers**: Creativity is discovered when invited—through the 3-mode Panopticon button, an educational 2D thermal conduction canvas, an opt-in sonic atmosphere, and the presence of autonomous machine discoverability.

---

## 2. Design (40%) — Editorial Monumentality & Sourced Typography

### Sourced, High-Performance Type System
No un-sourceable mock fonts. Fully self-hosted, lightweight WOFF2 assets with explicit OpenType feature controls:

| Role | Family | Sourcing & Licensing | OpenType & Kerning Configuration |
|---|---|---|---|
| **Editorial Display** | **Instrument Serif** / **Cormorant Garamond** | Google Fonts / OFL (Self-hosted WOFF2) | `font-kerning: normal; font-feature-settings: "liga" 1, "dlig" 1;` |
| **Reading & Body** | **Libre Baskerville** / **Instrument Sans** | OFL (Self-hosted WOFF2) | `font-kerning: normal; line-height: 1.65;` |
| **Specifications & Specs** | **Geist Mono** / **JetBrains Mono** | Vercel / JetBrains (OFL) | `font-feature-settings: "zero" 1, "tnum" 1;` Tabular figures |

*   **Zero-CLS Font Loading**: `size-adjust`, `ascent-override`, and `descent-override` are calibrated to system fallbacks (`Georgia` and `monospace`) in `snippets/fonts.liquid` to guarantee **0ms layout shift**.
*   **Accessible Kinetic Text Reveals**:
    - Character and word animations use lightweight **`SplitType`** in `theme/scripts/src/`.
    - Splitting maintains full **W3C accessibility**: original copy remains in an `aria-label` on the parent, while the animated visual spans are marked `aria-hidden="true"`.

### Visual Palette & Tactile Atmosphere
*   **Palette**: Obsidian Charcoal (`#121212`), Raw Kansa Bronze (`#C58B43`), Aged Patina (`#5A6B5C`), Cast Terracotta Clay (`#A45A3D`), and Warm Alabaster (`#F7F5F0`).
*   **Grain & Texture**: A subtle, hardware-accelerated SVG noise overlay (pauses when idle to conserve battery).
*   **Fluid Typography**: Replaces brittle breakpoints with **Utopia.fyi** fluid clamp curves (`clamp()`), effortlessly scaling from compact mobile screens up to 4K desktop displays.

---

## 3. Usability (30%) — Frictionless Commerce & Multi-Input Precision

### Multi-Modal Input-Aware Smooth Scrolling
A single 120fps ticker loop in `theme/scripts/src/maison-runtime.js` coordinating **Lenis** and **GSAP**:
*   **Touch & Mobile/Tablet**: Native touch passthrough with dampening scaled back to eliminate inertia lag.
*   **Trackpad (Mac/Laptop)**: 1:1 direct scroll handling to avoid rubber-banding conflicts.
*   **Mouse Wheel**: Subtly smoothed interpolation (`damp: 0.08`).
*   **Keyboard (`Tab`, Arrows)**: Instant native focus scrolling with high-contrast, accessible focus indicators.

### Zero-Backend Client Storage Profile Engine
*   **The 45% Exploration Slide-Up**:
    - Once a visitor has explored **45% of the page** (or browsed multiple products over 45 seconds), an elegant, low-profile bottom drawer appears.
    - Asks 2 quick lifestyle questions (e.g., *Induction or Open Flame? Slow-simmer or High-heat searing?*) + optional email.
    - Features a crystal-clear **"Cancel / Later"** button and keyboard `Escape` dismiss.
*   **Local Storage Memory**:
    - Stored strictly on the client (`localStorage.getItem('mt_user_profile')`).
    - Dynamically highlights suitable items in the collection grid with a quiet tag: *"Ideal for your induction stove"*.
*   **Developer / Evaluator Reset Link**:
    - Placed discreetly in the footer micro-links:  
      `[ Reset Session & Storage ]`
    - Instantly purges all `localStorage`, `sessionStorage`, resets cookie flags, and reloads for fresh judging or testing.

---

## 4. Creativity (20%) — The Three-Lens Panopticon & Sourced Simulations

### 1. The Three-Lens Panopticon Card
An intuitive 3-way toggle button directly on product cards in the collection carousel:
1.  **Human (Default)**: SOTA editorial product photography, natural kitchen lighting, living patina.
2.  **Engineer**: Technical stratigraphy drawing (SVG CAD schematic placeholder ready for final assets), showing the steel liner, clay core, and kansa bronze alloy thickness (in mm), with heat ratings.
3.  **Machine (Agent)**: Clean ASCII art silhouette of the piece framed in an amber/green monospaced terminal card displaying live Schema.org JSON-LD data.

### 2. Sourced 2D Thermal Diffusion Canvas
*   Instead of an overwhelming 3D shader, an intuitive **2D heat-diffusion simulation** sourced from proven open-source canvas implementations.
*   **Interaction**: The user toggles between *Induction Coil (2.4kW)*, *High Gas Flame (15k BTU)*, and *Charcoal*.
*   The canvas displays an educational thermal gradient diffusing across the pan's base, visibly demonstrating why the kansa/clay composite eliminates hotspot scorching compared to thin commercial steel.

### 3. Sonic Atmosphere & Sourced Bell Resonance
*   **Curated Acoustic Experience**: High-fidelity sourced recordings of traditional bell metal resonance and quiet foundry chants.
*   **Opt-In & Discreet**: Off by default, with an elegant floating sound toggle in the corner. Persists user preference cleanly.

### 4. The Agent Mol-Bhav (Bazaar Negotiation) Proof
*   Rather than attempting a fragile live model in the browser, the groundbreaking autonomous agent negotiation (*Mol-Bhav*—conducted externally with GrokBot and autonomous agent scripts) is integrated as an **editorial video artifact / case-study viewport**.
*   Visitors and judges can watch the real protocol exchange: how autonomous agents discover the catalog, negotiate within margin limits, and construct an order payload.

---

## 5. Content (10%) — Ancestral Roots & Metallurgical Truth

### The Human Narrative: The Sacred Tool & The Grandmother’s Kitchen
*   Cookware is not disposable hardware; in ancestral Indian traditions, *kansa* (bell metal) is an **Ayurvedic heirloom**. It is gifted at weddings, cooked in daily, and handed down across generations.
*   The copywriting bridges this sacred domestic tradition with modern engineering:
    > *"Your grandmother didn't measure thermal conductivity in Watts per meter-Kelvin. She listened to the ring of the metal when struck with a wooden ladle. She knew when the alloy had heated through by the scent of mustard seeds blooming on its surface. We have not replaced her intuition—we have simply verified it."*

### The Evidence Ledger
Every technical claim on product pages and the About page carries an explicit truth badge:
*   `[VERIFIED]`: Backed by metallurgical testing or lab reports.
*   `[OBSERVED]`: Proven in culinary test kitchens.
*   `[HYPOTHESIS]`: Flagged prototype design target.

---

## 6. Gated Storefront: Static Scene 0 Meta-Landing

Shopify development stores force an unthemeable system password gate. Do **not** theme `layout/password.liquid` as the exhibition entrance — that second screen is redundant and never reaches anonymous visitors.

*   **Scene 0** lives as a deployable static wrapper at [`gate/index.html`](../gate/index.html).
*   It shows the exhibition invitation, copies the storefront passcode to the clipboard, and sends visitors into `maison-tavo.myshopify.com` to complete Shopify’s system gate.
*   The live Horizon password template stays stock / minimal.

---

## 7. 100/100 Audit Enforcement & W3C AAA/AA

| Metric | Target | Technical Mechanism |
|---|---|---|
| **Lighthouse Performance** | **100** | Liquid server rendering, zero unneeded JS, critical CSS inlined, responsive WebP/AVIF images. |
| **Lighthouse Accessibility** | **100** | W3C WCAG 2.1 AA/AAA compliant contrast (7:1+), proper ARIA tags on SplitType elements, visible focus states. |
| **Lighthouse Best Practices** | **100** | Zero console errors, modern image formats, secure HTTPS headers. |
| **Lighthouse SEO & Agent Score** | **100** | Complete OpenGraph, automated sitemaps, valid `llms.txt`, enriched JSON-LD `Product` schema, and crawler-friendly `robots.txt`. |

---

## 8. Implementation Roadmap

1. **Phase 1: Foundation & Gate**: Scene 0 static meta-landing (`gate/index.html`), fluid Utopia clamp tokens, footer storage wiper.
2. **Phase 2: The 3-Mode Panopticon**: Segmented Human/Engineer/Machine button in product cards with SVG stratigraphy and ASCII preview.
3. **Phase 3: Thermal Simulation & Sound**: Embedded 2D heat-diffusion canvas, opt-in bell audio controller, and Agent Mol-Bhav case-study video showcase.
4. **Phase 4: Client Profiler & Exploration Modal**: 45% scroll observer, `localStorage` preference tagging, contextual product chips.
5. **Phase 5: Audits & Submission**: 100/100 Lighthouse sweeps, `robots.txt` + `llms.txt` verification, 4K video recording, and Awwwards submission.

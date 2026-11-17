# Streak system (scaffold)

Minimal client-side streak scaffolding for later checkout-stage chrome and visual skins. **Not** a gamification product and **not** a fake checkout SPA.

Jakob’s Law: Shopify hosts checkout. The Liquid theme may only add light chrome around the cart → checkout handoff.

## Theme surface (this repo)

| Piece | Location |
| --- | --- |
| Model + signals | `theme/scripts/src/streak.js` |
| Boot + API | `theme/scripts/src/maison-runtime.js` → `window.MaisonRuntime.streak` |
| Bundled asset | `theme/assets/maison-runtime.js` (rebuild with `bun run theme:build`) |
| Pre-checkout chip | `theme/snippets/cart-summary.liquid` (`[data-mt-streak-chip]`) |
| Reset | Footer `[ Reset Session & Storage ]` clears all `localStorage` (includes streak) |

### Storage schema (`localStorage` key `mt_streak`)

```json
{
  "version": 1,
  "visitDays": ["2026-11-16", "2026-11-17"],
  "visitStreak": 2,
  "cartReturns": 1,
  "lastCartOpenAt": "2026-11-17T10:00:00.000Z",
  "releases": {
    "heat-04": { "joinedAt": "2026-11-17T09:00:00.000Z", "status": "joined" }
  },
  "checkoutHandoffs": 1,
  "lastCheckoutHandoffAt": "2026-11-17T10:05:00.000Z",
  "tier": "ember",
  "updatedAt": "2026-11-17T10:05:00.000Z"
}
```

| Field | Meaning |
| --- | --- |
| `visitDays` | Unique calendar days the storefront booted (capped) |
| `visitStreak` | Consecutive days ending today or yesterday |
| `cartReturns` | Days the cart drawer opened while the bag had items (one credit / day) |
| `releases` | Extension map for drop / waitlist participation |
| `checkoutHandoffs` | Clicks on the theme `name=checkout` button (handoff only) |
| `tier` | Derived skin key: `none` \| `ember` \| `flame` \| `forge` |

### Extension points

```js
// Custom tier math
MaisonRuntime.streak.hooks.computeTier = (state) => /* StreakTier */;

// React to writes
MaisonRuntime.streak.hooks.onChange = (state) => { /* … */ };

// Intercept / augment signals before default handlers
MaisonRuntime.streak.hooks.onSignal = (type, payload, state) => state;

// Record a release / drop
MaisonRuntime.streak.recordRelease('heat-04', 'waitlisted');

// Generic signal
MaisonRuntime.streak.record('visit' | 'cart_return' | 'checkout_handoff' | 'release', payload?);
```

### UI (pre-checkout only)

- Chip sits in cart summary CTAs (drawer + cart page), **below** the checkout button and accelerated wallets, **above** the trust line.
- Hidden until a meaningful streak exists; `pointer-events: none`; Font Awesome `fa-fire` (no emoji).
- Does not wrap, replace, or disable Shopify checkout / Shop Pay / Apple Pay.

### Skinning hooks

Set on `<html>` whenever streak state is written:

- Attribute: `data-mt-streak-tier="none|ember|flame|forge"`
- CSS variables: `--mt-streak-tier`, `--mt-streak-accent`, `--mt-streak-intensity`

Future skins can target `html[data-mt-streak-tier='forge'] …` without touching checkout.

---

## Deferred: Shopify Checkout Extensibility

Do **not** invent Liquid/checkout.liquid customizations or theme JS inside checkout. Post-handoff UI requires a Shopify app with extensions.

| Stage | Legal surface | Example targets |
| --- | --- | --- |
| Information → payment (checkout) | Checkout UI extension | `purchase.checkout.block.render`, `purchase.checkout.header.render-after`, `purchase.checkout.footer.render-after` |
| Thank you | Checkout UI extension | `purchase.thank-you.block.render`, `purchase.thank-you.announcement.render`, `purchase.thank-you.header.render-after` |
| Order status | Customer Account UI extension | `customer-account.order-status.block.render`, `customer-account.order-status.announcement.render` |

Scaffold later with CLI (not in the theme):

```bash
shopify app generate extension --template checkout_ui --name mt-streak-checkout
shopify app generate extension --template customer_account_ui --name mt-streak-order-status
```

Checkout / Customer Account extensions get their own sandboxed `storage` APIs. They **cannot** read the theme’s `localStorage` (`mt_streak`). Bridging options for a later phase:

1. Cart attribute / note written at handoff (theme) → read via extension Attributes / Note APIs
2. Customer metafield updated by an app backend after order create
3. Extension-local storage for post-purchase-only streaks

Until then, theme streak = pre-checkout chrome + skin hooks only.

## Explicitly out of scope (scaffold)

- Points, rewards, discounts, or checkout gating based on streak
- Replacing Shopify checkout with a custom SPA
- Theme edits to checkout, thank-you, or order-status HTML
- Backend sync (zero-backend, same pattern as the profiler)

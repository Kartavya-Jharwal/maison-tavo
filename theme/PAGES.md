# Storefront pages (Liquid / Horizon)

Create these resources in **Shopify Admin**. The theme only supplies templates and sections; it cannot create pages or blogs by itself.

Live editor: [https://maison-tavo.myshopify.com/admin/themes/198667665777/editor](https://maison-tavo.myshopify.com/admin/themes/198667665777/editor)

One-shot create / assign: `bun scripts/ensure-pages.ts` (dry-run) or `bun scripts/ensure-pages.ts --apply`.

Theme setting group **Navigation & pages** (`maison_pages`) at the end of `config/settings_schema.json` stores the developer credit fallbacks. Journal is a **page**, not a required Shopify blog.

## Information architecture (homepage)

Homepage (`templates/index.json`) keeps only:

1. Splash (layout overlay — not a section)
2. Full-bleed hero + tagline (`maison-hero`)
3. Short story / highlights (`maison-story-brief`)
4. Three featured products (`maison-featured-trio` — merchant product pickers)
5. Slim Releases teaser (`maison-releases-teaser` → `/pages/releases`)
6. Pathway link-outs (`maison-pathways` → Heat, Finder, Department, Kitchen, Releases, Mail)
7. Header / cart / footer chrome as usual

Deeper rooms live on dedicated pages below. Do not re-stack Department, Kitchen, Heat, Finder, Journal, or Mail on the homepage.

### Merchant picks the three featured products

In the theme editor → Homepage → **Featured trio**:

| Setting | Role |
| --- | --- |
| Product 1 | Flagship pan |
| Product 2 | Service / maintenance kit |
| Product 3 | Secondary flagship (secondary pod) |

No hard-coded SKUs. Leave blank until catalogue pieces exist.

## Header and footer menus

The storefront is a multi-page shop. Header links come from the `main-menu`
navigation. The footer prints Shop, House, Support, and Legal from the theme
when those menu settings are empty, so the map is visible before a menu sync.

`bun scripts/sync-navigation.ts --apply` writes header/footer items including:

- Category collections (Cookware, Tableware & Pottery, Care & Sets)
- **Department** (`/pages/department`), **Kitchen** (`/pages/kitchen`)
- **Heat** (`/pages/heat`), **Finder** (`/pages/finder`)
- **Releases** (`/pages/releases`), **Journal** (`/pages/journal`), **Mail** (`/pages/mail`)
- About, Contact

Checkout and the customer account are Shopify-hosted. The bag links to checkout.
Do not rebuild either flow in the theme.

Do not remove the footer **Policy links** block. It lists Shopify-hosted policies from **Settings → Policies**.

## Pages to create

| Admin title | Handle (URL) | Theme template | Primary section(s) |
| --- | --- | --- | --- |
| About us | `about` | `page.about` | `maison-about` (+ story/stats as configured) |
| Our story | `our-story` | `page.story` | `maison-story` |
| Building of | `building` | `page.building` | `maison-building` |
| Department | `department` | `page.department` | `maison-room` + `maison-lineups` |
| Kitchen | `kitchen` | `page.kitchen` | `product-list` (Working Kitchen) |
| Heat | `heat` | `page.heat` | `maison-room` + `maison-thermal` |
| Finder | `finder` | `page.finder` | `maison-finder` |
| Journal | `journal` | `page.journal` | `maison-journal-intro` + `maison-building` entries |
| Mail | `mail` | `page.mail` | `maison-room` + Horizon `email-signup` block |
| Releases | `releases` | `page.releases` | `maison-releases` (timed cycles; sibling to arrivals) |
| Contact | `contact` | `page.contact` | `maison-room` + contact form |
| New arrivals | `new-arrivals` | `page.arrivals` | Legacy alias of Releases; prefer `releases` |
| Delivery and returns | `delivery-returns` | `page.shipping` | `maison-room` |
| Frequently asked questions | `faq` | `page.faq` | `maison-room` |
| Reviews | `reviews` | `page.reviews` | `maison-room` |
| Cookie Policy | `cookie-policy` | `page.cookies` | `maison-room` |
| Care | `care` | `page.care` | care ritual |
| Kansa | `kansa` | `page.kansa` | `kansa-app` |
| Privacy Policy | `privacy-policy` | `page.privacy` | `maison-legal` |
| Terms of Service | `terms-of-service` | `page.terms` | `maison-legal` |
| Intellectual property | `intellectual-property` | `page.ipr` | `maison-legal` |
| Colour story explorer | `lookbook` | `page.microapp` | `maison-microapp` |
| UCP Protocol | `ucp` | `page.ucp` | `maison-ucp-viewer` |

Steps per page: **Online Store → Pages → Add page** → set title → handle → **Theme template** dropdown → save. Or run `ensure-pages.ts --apply` when Admin API access is available (ACCESS_DENIED still leaves templates shippable).

## Mail (native signup only)

`page.mail` uses Horizon’s **email-signup** theme block inside a generic `section`:

- Liquid: `{% form 'customer' %}` with `contact[email]`
- Creates a Shopify customer profile with marketing consent
- Same native pattern as `sections/maison-footer.liquid` newsletter field
- No fake waitlist backend; do not wire `maison-last-call` fake JS forms here

Optional later: Shopify Forms app block if the merchant installs it — theme already supports OS 2.0 app blocks in `section`.

## Journal (page, not blog)

`page.journal` replaces the blog requirement. Horizon still ships `blog.json` / `article.json` if a blog is ever added, but the house map links to `/pages/journal`.

## Legal markdown (source of truth)

Long-form drafts live in `theme/legal/` and match the Liquid defaults in `snippets/maison-legal-copy.liquid`:

- `privacy.md`
- `terms.md`
- `ipr.md`

Also publish the native Shopify policies (Privacy, Terms, Refund, Shipping) so the footer popover is not empty.

## Frontend microapps

Not Shopify apps. Registry: `theme/microapps/apps.json`. Loader: `templates/page.microapp.json` + `sections/maison-microapp.liquid`.

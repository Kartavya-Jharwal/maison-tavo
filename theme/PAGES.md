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

The storefront is a multi-page shop. The flat desktop header uses `main-menu`;
the hamburger uses the grouped `drawer-menu` (falling back to `main-menu` until
the drawer menu exists). The footer prints Support and Legal links, with
configurable columns and built-in fallbacks.

`bun scripts/sync-navigation.ts` previews the menu plan. Its `--apply` mode writes
the desktop, drawer and footer menus from the verified three-collection release:

- Desktop: Shop, Forge, Chulha, Maintenance, About.
- Drawer: Shop, Explore, The house and Help, each with relevant child links.
- Footer: the three ranges plus editorial and support links.

Checkout and the customer account are Shopify-hosted. The bag links to checkout.
Do not rebuild either flow in the theme.

Do not remove the footer **Policy links** block. It lists Shopify-hosted policies from **Settings → Policies**.

## Pages to create

| Admin title | Handle (URL) | Theme template | Primary section(s) |
| --- | --- | --- | --- |
| About us | `about` | `page.about` | `maison-story` + `maison-about` |
| Agents | `agents` | `page.agents` | Editorial concepts for bell resonance and Mol-Bhav; explicitly labeled as proposed |
| Our story | `our-story` | `page.story` | Legacy landing page linking to About |
| Building of | `building` | `page.building` | `maison-building` |
| Department | `department` | `page.department` | `maison-room` + `maison-lineups` |
| Kitchen | `kitchen` | `page.kitchen` | `product-list` (Working Kitchen) |
| Heat | `heat` | `page.heat` | `maison-room` + `maison-thermal` |
| Finder | `finder` | `page.finder` | `maison-finder` |
| Journal | `journal` | `page.journal` | `maison-journal-intro` + `maison-building` entries |
| Mail | `mail` | `page.mail` | `maison-room` + Horizon `email-signup` block |
| Releases | `releases` | `page.releases` | `maison-releases` (timed cycles; sibling to arrivals) |
| Contact Us | `contact` | `page.contact` | `maison-room` + contact form |
| New arrivals | `new-arrivals` | `page.arrivals` | Legacy alias of Releases; prefer `releases` |
| Delivery and returns | `delivery-returns` | `page.shipping` | `maison-room` |
| Refund and Returns Policy | `refund-returns-policy` | `page.refund-returns-policy` | `maison-room` with short summary |
| Track Order | `track-order` | `page.track-order` | `maison-room` |
| Start a Return | `start-a-return` | `page.start-a-return` | `maison-room` |
| FAQs | `faq` | `page.faq` | `maison-good-questions` with merged questions and interactive answers |
| Good questions (legacy URL) | `good-questions` | `page.good-questions` | Same merged FAQ content |
| Reviews | `reviews` | `page.reviews` | `maison-room` |
| Cookie Policy | `cookie-policy` | `page.cookies` | `maison-room` |
| Care | `care` | `page.care` | care ritual |
| Kansa | `kansa` | `page.kansa` | `kansa-app` |
| Privacy Policy | `privacy-policy` | `page.privacy` | `maison-legal` |
| Terms & Conditions | `terms-of-service` | `page.terms` | `maison-legal` |
| Intellectual property | `intellectual-property` | `page.ipr` | `maison-legal` |
| Colour story explorer | `lookbook` | `page.microapp` | `maison-microapp` |
| UCP Protocol | `ucp` | `page.ucp` | `maison-ucp-tui` |
| Ask AI | `ask-ai` | `page.ask-ai` | `maison-ask-ai` |
| Agent manifest | `llms-txt` | `page.llms-txt` | Legacy alias. Use Shopify’s root `/llms.txt` for new links. |

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

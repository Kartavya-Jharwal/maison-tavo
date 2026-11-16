# Storefront pages (Liquid / Horizon)

Create these resources in **Shopify Admin**. The theme only supplies templates and sections; it cannot create pages or blogs by itself.

Live editor: [https://maison-tavo.myshopify.com/admin/themes/198667665777/editor](https://maison-tavo.myshopify.com/admin/themes/198667665777/editor)

Theme setting group **Navigation & pages** (`maison_pages`) at the end of `config/settings_schema.json` stores the developer credit fallbacks and the Journal blog handle.

## Header and footer menus

The storefront is a multi-page shop. Header links come from the `main-menu`
navigation. The footer prints Shop, House, Support, and Legal from the theme
when those menu settings are empty, so the map is visible before a menu sync.

`bun scripts/sync-navigation.ts --apply` writes this header:

- **Shop** (`/collections`) — the catalogue
  - **Cookware**, with type links (skillets, tavas, kadais) and Forge Hybrid, Kuro Strip, Forge × Terre
  - **Tableware & Pottery**, with kulhads, platters, Terre Clay, and Forge × Terre
  - **Care & Sets**, with seasoning, care kits, Forge Hybrid, and Terre Clay
  - **New arrivals** (`/pages/new-arrivals`)
- **Kansa** (`/pages/kansa`) — its own page, not a collection
- **About** (`/pages/about`) — Our story, Journal, Reviews
- **Contact** (`/pages/contact`) — FAQ, Delivery and returns

Collection pages add the finer paths (a tagged URL such as
`/collections/cookware/skillet`) and repeat the material lineups.
Forge × Terre is filed under both Cookware and Tableware.

Checkout and the customer account are Shopify-hosted. The bag links to checkout.
The header account icon and the footer Account link open the login portal.
Do not rebuild either flow in the theme.

`scripts/push-catalog.ts --apply` creates and synchronizes all three category
collections plus the four lineup collections. Do not publish filler stock.

Do not remove the footer **Policy links** block. It lists Shopify-hosted policies from **Settings → Policies** (`shop.policies`, including `shop.privacy_policy` and `shop.terms_of_service` once published). House legal pages are additional rooms, not replacements.

## Footer developer credit

Location: footer group → **Policies and links** (`sections/footer-utilities.liquid`) → **Copyright** block (`blocks/footer-copyright.liquid`).

The line reads “Site designed and developed by **Kartavya Jharwal**” and links to [https://kartavya.tech](https://kartavya.tech) (`target="_blank"`, `rel="noopener"`). Full name matches the published contact card; the URL is unchanged. Toggle and labels live on that block; name/URL also fall back to **Theme settings → Navigation & pages**. Existing copyright, powered-by Shopify, and policy/menu blocks stay in place.

Founder and developer copy for About / Our story / Building of is sourced in `FOUNDER.md`. Do not paste resume text into lawyer-review legal pages.

## Pages to create

| Admin title | Handle (URL) | Theme template | Section |
| --- | --- | --- | --- |
| About us | `about` | `page.about` | `maison-about` |
| Our story | `our-story` | `page.story` | `maison-story` |
| Building of | `building` | `page.building` | `maison-building` |
| Contact | `contact` | `page.contact` | `maison-room` plus the contact form |
| New arrivals | `new-arrivals` | `page.arrivals` | `maison-arrivals` |
| Delivery and returns | `delivery-returns` | `page.shipping` | `maison-room` |
| Frequently asked questions | `faq` | `page.faq` | `maison-room` |
| Reviews | `reviews` | `page.reviews` | `maison-room` |
| Cookie Policy | `cookie-policy` | `page.cookies` | `maison-room` |
| Care | `care` | `page.care` | care ritual |
| Kansa | `kansa` | `page.kansa` | `kansa-app` |
| Privacy Policy | `privacy-policy` | `page.privacy` | `maison-legal` (document: privacy) |
| Terms of Service | `terms-of-service` | `page.terms` | `maison-legal` (document: terms) |
| Intellectual property | `intellectual-property` | `page.ipr` | `maison-legal` (document: ipr) |
| Colour story explorer | `lookbook` | `page.microapp` | `maison-microapp` (id: `lookbook`) |

Steps per page: **Online Store → Pages → Add page** → set title → **Search engine listing** handle → **Theme template** dropdown → save. Edit copy in **Customize** on that template (OS 2.0 blocks). Page body in Admin can stay empty; the sections hold the house copy.

## Blog (Journal)

Horizon already ships `templates/blog.json` and `templates/article.json`. This theme adds a **Journal intro** section at the top of the blog template.

1. **Online Store → Blog posts → Blogs → Add blog**
2. Title: `Journal`. Handle: `journal` (must match **Theme settings → Navigation & pages → Journal blog handle**)
3. Add the blog to header/footer menus (`/blogs/journal`)
4. Write articles (fittings, cloth, making-of). They use `article.json`

Until articles exist, the intro still renders; the article grid follows Horizon’s empty/placeholder cards.

## Legal markdown (source of truth)

Long-form drafts live in `theme/legal/` and match the Liquid defaults in `snippets/maison-legal-copy.liquid`:

- `privacy.md`
- `terms.md`
- `ipr.md`

All three are marked **template copy requiring lawyer review**, with Maison Tavo / Kartavya as placeholder operator. A later docs branch may publish these to GitHub Pages; do not duplicate them into repo-root `docs/`.

Also publish the native Shopify policies (Privacy, Terms, Refund, Shipping) so the footer popover is not empty.

## Frontend microapps

Not Shopify apps. Registry: `theme/microapps/apps.json`. Loader: `templates/page.microapp.json` + `sections/maison-microapp.liquid`. Scripts: `assets/microapp-<id>.js` (Shopify assets are **flat**; there is no `assets/microapps/` folder).

How to add another microapp: see `theme/microapps/README.md`. Create a page with template **microapp**, set section **Microapp id** or metafield `maison.microapp_id` (single-line text) to the registry `id`.

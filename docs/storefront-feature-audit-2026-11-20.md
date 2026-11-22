# Storefront feature audit — 20 November 2026

Scope: repository inspection of the live Liquid theme in `theme/`. **Theme support** means code exists; it does not prove the published theme, product data, app settings, or Shopify Admin configuration are ready. The Hydrogen preview is outside this audit. Preserve ordinary commerce behaviour before adding visual effects.

| Status | Meaning |
| --- | --- |
| Wired | Present in the current theme template or shared chrome. Still needs browser QA. |
| Available | Code exists, but a setting, content, product data or placement is missing. |
| Gap | No complete storefront implementation found. |
| Admin | Shopify configuration or an app/service is required beyond theme code. |

## Cart and checkout

| Requested feature | Status | Evidence / next step |
| --- | --- | --- |
| Cart notes | Available | `snippets/cart-summary.liquid` has a working note field; `config/settings_data.json` sets `show_cart_note` false. Enable in the theme editor. |
| In-store pickup | Available + Admin | `blocks/buy-buttons.liquid` supports pickup; `templates/product.json` sets `show_pickup_availability` false. Configure a pickup location and turn on the block. |
| Pre-order | Admin | `maison-last-call.liquid` is a waitlist, not a purchasable pre-order. Configure preorder inventory and fulfilment terms, then add truthful PDP messaging. |
| Quick buy | Wired | `blocks/buy-buttons.liquid` includes accelerated checkout; product cards use `snippets/quick-add.liquid` when enabled. Verify payment eligibility. |
| Sign in with Shop | Available + Admin | Header uses Shopify's account component in `snippets/header-actions.liquid`; availability depends on customer account and Shop settings. |
| Slide-out cart | Wired | `snippets/cart-drawer.liquid` is rendered from `layout/theme.liquid`. |
| Sticky cart | Wired | `sections/product-information.liquid` has a sticky add-to-cart bar; enabled in `templates/product.json`. |

## Customer accounts

| Requested feature | Status | Evidence / next step |
| --- | --- | --- |
| Account menu | Available + Admin | `sections/header.liquid` exposes `customer_account_menu` to `snippets/header-actions.liquid`; assign the menu and verify account mode. |

## Marketing and conversion

| Requested feature | Status | Evidence / next step |
| --- | --- | --- |
| Cross-selling | Available | `sections/product-recommendations.liquid` is on the PDP; merchant-directed complementary products need Search & Discovery configuration. |
| Customizable contact form | Wired | `templates/page.contact.json` and `blocks/contact-form.liquid`. |
| EU translations (EN, FR, IT, DE, ES, HI) | Available / gap | EN, FR, IT, DE and ES locale files exist; HI does not. Translate custom Maison copy and publish languages in Markets before calling any locale complete. |
| FAQ page | Wired | `templates/page.faq.json` composes `maison-good-questions`. |
| In-menu promos | Available | Horizon's mega menu supports imagery and menu blocks; merchant placement/content must be checked. |
| Press coverage | Gap | No dedicated press section or verified press entries. Add only sourced coverage. |
| Product badges | Available | Horizon badge styles exist; meaningful badges depend on product state/tags and card configuration. |
| Promo banners | Wired | `sections/header-announcements.liquid` supports announcement banners. |
| Promo popups | Available | `maison-releases-teaser.liquid` has a release dialog; no general promotion popup found. Keep consent and frequency respectful if added. |
| Promo tiles | Available | `maison-pathways.liquid` supplies editorial tiles; promo-specific merchandising remains to configure. |
| Quick view | Available | `snippets/quick-add-modal.liquid` supplies a quick product modal when quick add is enabled. Verify card setting. |
| Recently viewed | Available | `assets/recently-viewed-products.js` is loaded via `snippets/scripts.liquid`; results appear in predictive search. No dedicated PDP rail found. |
| Recommended products | Wired | `sections/product-recommendations.liquid` is in `templates/product.json`. |
| RTL support | Available | RTL-aware CSS and JS exist, including `assets/base.css` and `assets/scrolling.js`; Arabic/Hebrew locale rendering still needs browser QA. |
| Stock counter | Wired | `blocks/product-inventory.liquid` is on the PDP with quantity display enabled. Actual counts depend on inventory tracking. |
| Trust badges | Wired | `snippets/cart-summary.liquid` renders checkout reassurance lines. Verify claims against policy. |
| Quick order list | Available | `sections/quick-order-list.liquid` exists; not placed in a current page template. |
| Quantity pricing | Wired + Admin | `blocks/buy-buttons.liquid` and `sections/quick-order-list.liquid` render quantity breaks; products need configured price breaks. |

## Merchandising

| Requested feature | Status | Evidence / next step |
| --- | --- | --- |
| Animation | Wired | Maison runtime and motion assets are included by the theme. Confirm reduced-motion behaviour in preview. |
| Before/after image slider | Available | `blocks/comparison-slider.liquid` exists; place in an appropriate section with real images. |
| Color swatches | Wired | `blocks/swatches.liquid` is on collection cards; variant picker supports swatches. |
| Combined listings | Admin | Requires combined listing product configuration and actual product relationships; theme rendering must be verified on such a product. |
| High-resolution images | Available | Responsive image and gallery rendering exist; quality depends on supplied assets. |
| Image galleries | Wired | `_product-media-gallery` is on the PDP. |
| Image hotspot | Available | `sections/product-hotspots.liquid` and `_hotspot-product` exist; not placed in a page template. |
| Image rollover | Available | `snippets/card-gallery.liquid` supports second image on hover; enable setting and supply second image. |
| Image zoom | Wired | PDP gallery has `zoom: true`. |
| Ingredients / nutritional information | Gap | No product-specific nutrition component found; only add where relevant to an actual sellable item. |
| Lookbooks | Wired | `templates/page.microapp.json` presents the lookbook microapp. |
| Product options | Wired | `variant-picker` is on the PDP. |
| Product tabs | Available | `blocks/disclosures.liquid` supplies accessible disclosures; dedicated tabs need placement if required. |
| Product videos | Available | PDP media gallery and `blocks/video.liquid` support video; supply media. |
| Shipping / delivery information | Available | Shipping page exists; product-level delivery copy and live fulfilment claims need merchant data. |
| Size chart | Gap | No dedicated size chart found; add a product-family chart only after dimensions are verified. |
| Slideshow | Available | `sections/slideshow.liquid` and `layered-slideshow.liquid` exist; current homepage intentionally uses an editorial hero. |
| Usage information | Available | Care and product story pages exist; product-specific instructions need verified content. |

## Product discovery and navigation

| Requested feature | Status | Evidence / next step |
| --- | --- | --- |
| Back-to-top button | Wired | A native anchor in `layout/theme.liquid` returns to the document top without JavaScript. |
| Breadcrumbs | Wired | `snippets/maison-breadcrumbs.liquid` is rendered on collection, search, cart and page routes. |
| Collection page navigation | Wired | `sections/maison-collection-tree.liquid` is in `templates/collection.json`. |
| Enhanced search | Wired | Predictive search and search results templates are present. |
| Infinite scroll | Available | `main-collection.liquid` and `search-results.liquid` expose the setting; verify activation and pagination fallback. |
| Mega menu | Available | `snippets/mega-menu-list.liquid` and header menu settings exist; menu assignment and imagery need QA. |
| Product filtering and sorting | Wired | Both are enabled in `templates/collection.json`; filters require Shopify Search & Discovery configuration. |
| Recently viewed | Available | Predictive search implementation as above. |
| Recommended products | Wired | PDP recommendation section as above. |
| Sticky header | Available | `sections/header.liquid` supports sticky behaviour; check active setting. |
| Swatch filters | Available + Admin | `blocks/filters.liquid` supports swatch labels; configure color filter data in Search & Discovery. |

## Priority follow-up

1. Enable and test cart notes, pickup and account menu in an unpublished theme after Admin prerequisites are known.
2. Add HI translation and translate Maison-specific copy across all six requested languages.
3. Build missing press, size chart, and nutrition/ingredients (only where relevant) components with real merchant data.
4. Run desktop/mobile and keyboard QA on every wired or available item. A code-level audit cannot certify the published shop.

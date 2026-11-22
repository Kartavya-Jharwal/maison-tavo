# Maison Tavo development-store commerce audit

**November 19 catalog decision.** Grouped Forge and Chulha are the canonical ranges. The November 18 CSV and channel snapshot are historical evidence. The [catalogue categories](catalogue-categories.md) record the verified Admin variants and native bundles, the canonical collections and the metafields added after the audit.
18 November 2026 • Scope: customized Horizon, catalog records, operational setup and development-store acceptance. No publishing step.

## What the evidence establishes

| Evidence inspected | Result | Commercial consequence |
|---|---|---|
| data/maison-tavo-new-listings-shopify.csv vs data/online-store-publication.json | 53 unique listing handles in the CSV. All 25 active SKUs match the November 18 channel snapshot. None of the 28 draft rows appears in it. | A useful starting assortment. Channel membership alone does not establish stock, eligibility at checkout or current Admin state. |
| data/maison-tavo-new-listings-specs.csv | All 53 records have claim status CONCEPT_SPEC. | Review every sellable claim, including those on the 25 channel-listed items. |
| Imports and artwork brief | Of 25 active rows, 11 have an image URL and 11 have a weight. The 28 draft rows have neither. Across 238 shot briefs, 229 are marked missing, 9 external placeholder and zero have an approved URL. | Prioritize the intended opening assortment. These counts describe files. A merchant upload may already fill a gap in Admin. |
| Inventory and economics | Across all 53 import rows, zero populated inventory quantities, costs or barcodes. All have a price and SEO title. | Retrieve location-level stock and actual costs. A blank barcode is a channel-dependent decision. |
| data/shopify-id-map.json vs publication record | Map contains 53 SKU keys and 8 collection handles. It names maison-tavo.myshopify.com. The publication file and theme name maison-tavo-9pyrkr0c.myshopify.com. scripts/attach-images.ts defaults to the former. | Verify whether both domains resolve to the same shop ID before using a mutating script. |
| theme/templates/product.json and native route templates | Gallery, price, inventory, variant picker, quantity, buy buttons, accelerated checkout, spec/evidence blocks and recommendations are composed. Search, collection, cart, contact and account entry have implementations. | Spend QA effort on rendered behavior, variant fidelity and customer journeys. |
| Local checks | Design lint passed. JS chain intact across 13 packages, 8 bundles and 132 referenced assets. Shopify Theme Check inspected 449 files and reported 5 errors and 25 warnings across 10 files. | Static wiring is stronger than runtime proof. The JS verifier specifically flagged four missing media assets. |
| theme/templates/page.shipping.json and page.reviews.json | Shipping copy labels itself a house draft and defers a delivery window until after ordering. Reviews copy describes app behavior. | Replace implementation commentary and give customers purchase-relevant answers before payment. |

## P0 — establish what can actually be sold

Owner: merchandising and operations. Complete one representative SKU through checkout, then expand SKU by SKU.

- [ ] Verify canonical shop ID, currency, weight unit and timezone in Admin. Record which domain each catalog, media, page and menu script actually targets.
- [ ] Export current product, variant, inventory-item and location IDs, channel membership, prices and available quantities. Join against the 53 SKU keys and retain a dated discrepancy list.
- [ ] Reconcile grouped Forge drafts, Chulha variants and maintenance parts in packages/catalog/src with the flat CSV. Record each as opening assortment, staged replacement, future concept or retired. Count variants separately from products.
- [ ] Give each opening SKU an accountable supplier, approved sample, retail price, replenishment lead time and an explicit stock or preorder rule.
- [ ] Resolve material composition, food-contact suitability, cooktop support, measurements, capacity, care and use limits per relevant SKU. Link each customer-facing assertion to its evidence. Keep unresolved claims out of sales promises.
- [ ] Review pressure-rated and temperature claims separately with the supplier before making the affected variants orderable. The Chulha price table explicitly uses other vessel types as references.
- [ ] Review maintenance fit per vessel model, rim diameter, handle revision and fasteners. Show exact compatible models on both the part and vessel pages.
- [ ] Weigh each physical variant and its packed shipment. Fill missing values, verify grams versus display units and test rates with a heavy order.
- [ ] Record landed unit cost, packaging, pick/pack, shipping subsidy and return allowance. Approve margins at regular, bundle and discounted prices.
- [ ] Decide which sales channels require identifiers. Populate assigned barcodes where applicable and check for duplicate SKUs or identifiers across legacy and staged records.
- [ ] Count on-hand stock by location, reserve unavailable units, reconcile available-to-sell counts and verify whether overselling is intentional per variant.
- [ ] Match each original Forge variant to the intended grouped replacement. Preserve the old handle, variant ID, location quantities, weight and collection memberships before cutover.
- [ ] Map all seven set recipes to exact component variants and quantities. Test one unavailable component, component depletion and refund/restock before offering the set.
- [ ] Test old product links, size-specific links, saved lists and redirects against the new model. Each must select the intended size or offer a clear recovery.
- [ ] For each opening SKU supply an approved primary image, scale/detail view and accurate alternative text. Check rights and crop on both cards and PDPs. Replace external concept photography.
- [ ] Reconcile the remaining artwork briefs by product and mode. Verify CAD dimensions, machine silhouettes and variant-specific differences. Assign owner and approval date to each retained shot.

## P0 — test the order lifecycle in Shopify

Owner: store operator. These are verification tasks. Private payment, tax, delivery, policy and notification settings were not established from the repository.

- [ ] Set the intended selling markets, currencies, languages and fulfillment origins. Verify that a supported and an unsupported destination produce the expected purchase options.
- [ ] Assign each opening product to the correct shipping profile and location. Test a single item, mixed profile, heavy bundle, remote postcode and any free-shipping boundary.
- [ ] Compare the actual rate, delivery estimate and dispatch promise across PDP, shipping page, checkout and confirmation. Expose preorders and extended lead times before adding to cart.
- [ ] Review tax treatment and inclusive/exclusive price display for intended markets with the merchant's tax adviser. Check a test invoice against the expected result.
- [ ] Configure the development-store test payment method. Exercise success, decline and retry. Check that a retry produces one paid test order.
- [ ] Place a guest test order from a mobile product page. Record variant ID, quantity, market, shipping, tax, total and final order status.
- [ ] Repeat signed in. Verify account entry, order history, status link and account return path on small screens.
- [ ] Test any offered discount for eligibility, expiry, threshold, excluded items and combination rules. Compare displayed savings with the final order.
- [ ] Confirm stock decreases at the intended location. Fulfill a test order, add tracking and confirm the status page and shipping email show the same shipment.
- [ ] Cancel an unfulfilled test order and verify refund and restock choices. Separately test a partial refund and a damaged-item return against the support procedure.
- [ ] Confirm sender identity, reply-to mailbox and delivery of order, dispatch, cancellation and refund messages to a controlled inbox. Follow every customer-facing link.
- [ ] Establish who handles fulfillment failures, wrong addresses and returns. Run one support request using only the information the buyer receives.
- [ ] Approve shipping, returns/refunds, privacy and terms in Admin. Click them from footer and checkout. Resolve conflicting wording on custom policy rooms and remove draft notices.

## P1 — verify the Liquid shopping journey

Owner: theme developer with merchandising. Run on the password-gated development storefront, on a phone and desktop, using a stocked, multi-size, sold-out and missing-media item.

- [ ] Walk from home to each primary category and material lineup. Check all eight mapped collection handles against Admin, menu assignments and actual membership.
- [ ] Audit header, drawer and footer links against existing published pages and template suffixes. Include Care, Contact, Shipping, Finder, Journal and Releases. Check all home features after a promoted product sells out.
- [ ] Search by title, SKU, material and common cooking term. Test no results, typo, keyboard selection and return from a result.
- [ ] Apply filters, combine them, clear them and sort. Verify result counts, pagination, back navigation and mobile drawer focus.
- [ ] Load a PDP directly at a non-default variant URL. Confirm price, units, stock, image, selected option, SKU and cart line agree. Repeat via quick add and accelerated checkout where offered.
- [ ] Read the spec table for a concept, a fully documented item and a sparse record. Verify missing fields, claim labels and size-specific measurements in the rendered page.
- [ ] Test cart drawer and full cart for add, repeated add, quantity change, remove, last-item removal, sold-out change and refresh. Confirm checkout totals match the cart.
- [ ] Test delayed or failed cart requests. Controls should recover, announce the outcome and prevent accidental duplicate additions.
- [ ] Check product recommendations, wishlist and finder against the eligible catalog. Verify empty states and recovery after a variant is archived.
- [ ] Test the three product-card modes independently of the product link, quick add and swipe. Verify touch targets, keyboard operation, selected state and real product identity in every mode.
- [ ] Test the 45% exploration prompt on a fresh session. Check dismissal, optional email, reload, local tagging and footer reset. Inspect network activity to confirm profile data stays local.
- [ ] Test the separate Shopify newsletter form for valid, invalid and repeat signup. Verify consent and newsletter tag only for an intentional signup.
- [ ] Submit the native contact form to a controlled mailbox. Check errors, success feedback, reply path and advertised response time.
- [ ] Rewrite technical reviews-page copy for buyers. If reviews are offered, verify actual review source, count and empty state. Remove unsupported review or photo promises.
- [ ] Check the standalone exhibition gate for copy-passcode, fallback, focus and return path. Verify direct product links through the system password gate as well as entry via home.

## P1 — reliability, accessibility and discoverability

Owner: theme developer. Keep a dated test result for each representative route.

- [ ] Resolve missing maison-globe-poster.jpg, maison-splash.mp4, maison-splash-audio.mp3 and maison-splash-poster.jpg. Supply approved assets or remove unused references at source.
- [ ] Recheck the documented actions.skip_to_content translation issue and triage each of the 25 warnings. Re-run Shopify Theme Check and record file, rule and disposition.
- [ ] Run keyboard-only purchase and contact journeys. Verify skip link, visible focus, modal focus containment, Escape, restored focus, error summaries and cart announcements.
- [ ] Test screen-reader names for split text, variant choices and card lenses. Check on-page heading order, contrast and zoom with sticky controls visible.
- [ ] Exercise reduced motion, muted sound, unavailable WebGPU and denied storage. Verify browsing and purchase controls work in each case.
- [ ] Measure mobile home, collection, PDP, search and cart after gate entry. Record Lighthouse scores and layout shifts against the project targets; attach route and run conditions.
- [ ] Trace the two 4,816,078-byte craft images and the 1,195,126-byte vessel JS asset in a cold network waterfall. Check whether either loads before interaction, resize or defer as warranted, then remeasure.
- [ ] Check hero dimensions, responsive image sizes, font fallback metrics and font licenses. Verify the first product image and price stay stable during load.
- [ ] Validate rendered Product/Offer, breadcrumbs and collection JSON-LD. Compare SKU, variant, currency, stock and image with the selected product. Verify duplicate graph nodes and unsupported claims are absent.
- [ ] Verify canonical URLs, meaningful titles, social preview images, sitemap membership and cart/search indexing directives. Test the actual HTTP responses for the documented machine manifests.
- [ ] Audit tracking and consent settings. Test product view, add to cart, checkout and purchase using development test traffic. Ensure a reload does not double-count the order.
- [ ] Compare preview Theme Editor settings, app embeds, menus and page assignments with repository assumptions. Production configuration deliberately excludes settings_data.json from pushes.

## P2 — finish the experience after commerce acceptance

- [ ] Verify provenance and licensing for the thermal implementation, optional audio, font files and editorial photography. Keep attribution and buyer-facing performance claims accurate.
- [ ] Review exhibition copy, AI/finder answers, downloadable data and machine manifests against the same approved catalog revision.
- [ ] Record a repeatable smoke test for a stocked vessel, size variant, care item, set and unavailable item. Include buyer-visible screenshots and test order references without customer details.
- [ ] Record the development theme ID, catalog snapshot date, test order outcomes and remaining exceptions. Give every exception an owner and retest date.

**Development-store acceptance:** A buyer can find a documented item, choose the right variant, see delivery terms, pay in test mode and receive a correct confirmation. An operator can fulfill, track, refund and reconcile the same order. Repeat with a set and a stock exception. Close the relevant checks with evidence before describing the store as commerce-ready.
## November 19 update — authenticated Shopify catalog read

Shopify returned all 74 products in one page. All 53 CSV handles matched their Admin product statuses. The additional 21 products are drafts: seven grouped Forge vessel products, seven grouped Forge set previews and seven Chulha products.

| Admin product status | Products | Zero total inventory | No attached product media |
|---|---:|---:|---:|
| Active | 25 | 25 | 15 |
| Draft | 49 | 49 | 49 |

**Inventory priority.** For each opening variant verify inventory tracking, available quantity at its fulfillment location and the continue-selling policy. Every product returned zero aggregate inventory. That field alone cannot establish whether checkout accepts an order. Verify the intended behavior with a controlled test order.

**Media priority.** The following active handles have zero attached product media. Inspect their rendered galleries and Human artwork metafield fallbacks before commissioning missing shots. For the other ten active products, check that the attached media is ready, licensed and depicts the actual item.

- forge-terre-service-tongs
- forge-terre-tagine-28
- forge-terre-tagine-32
- forge-relay-tava-26
- forge-relay-tava-30
- forge-relay-kadai-24
- forge-relay-saucepot-20
- rekha-dinner-plate-28
- rekha-condiment-bowl-set
- rekha-serving-bowl-26
- forge-seasoning-oil
- forge-care-ritual-kit
- forge-relay-lid-26
- forge-relay-lid-30
- terre-bamboo-steamer-24

The read covered product handles, statuses, aggregate inventory and media counts. The November 18 snapshot remains the evidence for Online Store publication. Variant policies, location quantities, metafield artwork and checkout still require verification.


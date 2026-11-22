# Catalogue categories

## Canonical catalog in Shopify Admin

The grouped Forge and Chulha families in `packages/catalog/src/product-families.ts` define the assortment. The flat CSV and the November 18 publication snapshot retain the previous listing model for reconciliation.

On November 19, Shopify Admin held seven Forge vessel drafts with 19 diameter variants, seven Forge fixed-set drafts with native components, and seven Chulha drafts with 15 diameter or capacity variants. The Forge collection contains its 14 drafts and the Chulha collection contains its seven drafts. All seven set recipes were checked against Shopify component SKUs and quantities. The existing `specs` definitions now carry a lineup on all 21 drafts and the sets also carry claim status, component SKUs and included lids.

The grouped Forge drafts retain their staged SKUs. The development checklist covers the final SKU and inventory cutover, product media, validated claims and rendered product structured data.

## Forge

Forge covers stainless steel cookware and matched sets. Choose a vessel by cooking task, then compare inner rim diameter and handle layout. Frying pans have sloped sides for turning food, sauté pans hold braising liquid behind straight walls, and tawas leave space for spreading and lifting flatbreads. The [Forge lineup](forge-series.md) lists the planned sizes, prices and bundle components.

## Chulha

Chulha explores unglazed terracotta forms for familiar cooking tasks. The tawa is shaped for turning flatbreads, the saucier for pouring chai and the broad handi for layering biryani. Capacities and finishes below are design targets.

| Development concept | Intended cooking task | Capacity and finish targets |
| --- | --- | --- |
| Chulha Tawa | Turn parathas or crêpes on a shallow flatbread plate | Pending |
| Artisanal Matka | Slowly simmer dal in a round-bellied, narrow-necked pot | 4 L, raw matte terracotta |
| Chulha Pressure Cooker | Pressure-vessel research for beans and grains | Engineering and conformity assessment pending |
| Heavy Kadhai | Cook vegetables with toasted spices in a deep bowl with twin handles | 3.5 L, smoked charcoal terracotta |
| Chai & Sauce Saucier | Pour cardamom chai or a reduction from a straight-walled vessel | Pending |
| Daily Biryani Handi | Layer biryani in a wide, shallow vessel for dum cooking | 2.5 L, burnished earth |
| Chulha Multi-Use Stockpot | Simmer broth in a deep, straight-walled vessel | Pending |

The material study explores an unglazed terracotta body, a Kansa exterior base, magnetic steel and embedded reinforcement. Retain the existing concept reference IDs for historical traceability. Supplier specifications, prototype measurements, thermal cycling, food-contact evidence and pressure-vessel assessment inform any commercial ratings. Prices, stock and supported cooktops remain pending.

## Maintenance

Choose care supplies by cooking-surface material. For a replacement lid, check the vessel model and inner rim diameter against the fit record. For a replacement handle, record the vessel model and revision, handle position, attachment style and required fasteners before assigning a part SKU.

| Group | Catalogue scope |
| --- | --- |
| Care kits | The existing seasoning oil and care kit, plus the planned stainless steel brush and cloth kit |
| Replacement lids | Existing Forge lids and planned shared-rim sizes, with fit tracked per tested vessel |
| Replacement handles | Planned stick, helper and side-loop parts, with fit and fasteners to be verified by model |

## Product artwork in Shopify

On a product in Shopify Admin, upload the main gallery through **Media**, or add shared images to **Human artwork** when the standard gallery is empty. Add diagrams to **Engineer artwork** and silhouette or specification plates to **Machine artwork**. These are product metafields, so all diameter variants share the same artwork. Supply alt text on the files and keep exact dimensions in the specs or variant options. Use the two planned shots in each view as the starting set.

The grouped Forge drafts use `STAGE-` SKUs while their original inventory variants still exist. Checkout continues through the live listings until the final SKU, inventory, redirects and fixed bundle components have been reconciled. The staged products can be reviewed in Shopify Admin before cutover.

### Forge cutover checks

1. Reconcile each original SKU with exactly one staged variant and record both Shopify variant and inventory item IDs. Capture stock by location, publication, weight, barcode and the original collection memberships before switching.
2. Keep the final SKU attached to the sellable variant and retain a lookup from the archived product and variant to the new product and size. Use it for redirects, saved product links and catalogue IDs.
3. Verify bundle component variant IDs, quantities and fixed prices against the seven recipes after the switch. Publish a bundle only when its intended component products are ready.
4. Open each product at a variant URL. Confirm the selected size, availability, price, artwork, wishlist and the item Shopify receives in Add to Cart. Test checkout with a test inventory item.

### Chulha launch prices

The diameter and capacity options below are design targets. Prices use the nearest Forge size or vessel shape as the reference. The pressure cooker uses Forge stockpots as price references because Forge has no pressure cooker.

| Product | Planned size and GBP price |
| --- | --- |
| Tawa | 26 cm £140 · 30 cm £157 |
| Artisanal Matka | 2.5 L £155 · 4 L £173 |
| Pressure Cooker | 3 L £175 · 5 L £190 |
| Heavy Kadhai | 24 cm £155 · 28 cm £173 · 32 cm £190 |
| Chai & Sauce Saucier | 1 L £137 · 1.75 L £155 |
| Daily Biryani Handi | 2.5 L £157 · 4 L £175 |
| Multi-Use Stockpot | 4 L £170 · 6 L £187 |

Each size has a distinct `MT-CHU-*` SKU and uses the parent product’s Human, Engineer and Machine artwork.

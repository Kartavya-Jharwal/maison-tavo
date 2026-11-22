# Forge stainless steel catalogue

All prices below are proposed UK list prices in GBP. The size refers to the design diameter at the inner rim. Capacity, base contact diameter, mass and hob performance need measurement on production samples.

| Vessel | Diameter in cm and proposed price | How to choose |
| --- | --- | --- |
| Frying pan | 20 £130 · 24 £145 · 28 £160 | Sloped sides for turning eggs and fillets. The 28 cm adds a helper grip. |
| High-wall saucier | 20 £140 · 22 £148 · 24 £155 · 26 £165 | Curved walls let a whisk follow a reduction around the pan. The Solo set uses 22 cm. |
| Sauté pan | 24 £155 · 28 £170 | Straight sides hold braising liquid. Both sizes have a helper grip. |
| Tawa | 26 £130 · 30 £145 | Low edge for roti and dosa. Choose the 30 cm for more spreading room and dual grips. |
| Saucepan | 16 £130 · 20 £145 | Long-handled pot for chai, grains and small reductions. |
| Deep stockpot | 20 £145 · 24 £160 · 28 £175 | Tall sides and two grips for broth and batch cooking. |
| Kadhai | 24 £145 · 28 £160 · 32 £175 | The compact wok has a stick and helper grip. The larger bowls have dual grips. |

## Lids and accessories

Each lid has one nominal rim diameter. The proposed prices are £30 for either 16 or 20 cm, £35 for 24 cm, and £40 for either 28 or 32 cm. The 20, 24 and 28 cm lids are the core shared sizes. Verify fit for each vessel and lid pair with physical rim gauges. The tawa is an open griddle. The 22 and 26 cm sauciers have no specified shared lid.

The stainless maintenance kit has a proposed £35 price and includes a soft brush and drying cloth. The original oil-based care kit belongs to the earlier range. The existing 24 cm Terre bamboo steamer has an £88 draft price and a docking ring. A nominal 24 cm diameter alone does not establish a Forge pairing. Check seating, steam clearance and stability before listing compatible vessels.

## Curated sets

Each component contributes one unit. Lids contribute to component stock demand and carry no additional charge in the proposed set price.

| Set | Vessels (cm) | Included lids (cm) | GBP |
| --- | --- | --- | ---: |
| Solo / Couple | Fry 20, saucepan 16, saucier 22 | 20 (fry pan) | 408 |
| Family Standard | Fry 24, saucepan 20, stockpot 24, kadhai 24 | 20, 24 | 595 |
| Entertainer | Fry 28, sauté 28, stockpot 28, tawa 30 | 28 | 650 |
| European | Fry 24, saucier 26, sauté 28, saucepan 20 | 20, 28 | 625 |
| Asian | Kadhai 28, tawa 26, saucepan 20, stockpot 24 | 28 | 595 |
| All-in-One Everyday | Fry 24, sauté 28, saucepan 20, kadhai 28 | 20, 28 | 620 |
| Full House Master | Fry 24/28, saucier 24/26, sauté 24/28, tawa 26/30, saucepan 20, stockpot 24/28, kadhai 28/32 | 20, 24, 28 | 2,040 |

The Full House composition is a proposed interpretation of the medium/large brief. Its 13 vessels cover all seven shapes.

## Product data and discovery

The matrix supplies SKU, Shopify category, product type, diameter, handle layout, proposed lid and care links, Kansa flag, search terms, one-line summary, shape explainer, recipe and six media briefs per listing. Human requests a studio and kitchen view. Engineer requests a sectional and dimension view. Machine requests a silhouette and structured specification view. Artwork is pending production. Inventory quantities belong to Shopify inventory items at their fulfilment locations.

Run `bun packages/catalog/scripts/sync-forge-csvs.ts` and then `bun packages/catalog/scripts/build-seed.ts` to regenerate the CSVs and typed catalogue. Existing Shopify identities use one product per size. Each vessel and lid carries a size-family map. The Liquid picker links to sibling sizes published on the Online Store. Kansa uses the publication snapshot in `data/online-store-publication.json` to select its storefront records. Refresh the snapshot when publishing or withdrawing products. Shopify's Storefront Catalog MCP supplies current published products, variants and availability. Merchant enrichment adds narrative and design intent.

## Related categories

Chulha covers terracotta vessel concepts. Maintenance covers surface-specific care kits and compatible parts. The [category guide](catalogue-categories.md) records their scope and the evidence needed for new listings.

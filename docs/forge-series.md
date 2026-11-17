# Forge series — Category 1 launch matrix

Shop currency: **GBP**. Diameters are **inner rim-to-rim** concept targets. Induction coil zones (14.5 / 18 / 21 cm) are design intents, not certified ratings. All claims remain `CONCEPT_SPEC` until prototype gates pass.

## Product model

**SKU-per-size** (one Shopify product per diameter), matching the existing seed / `push-catalog` pipeline. Variants are not used for diameter families at launch.

Source of truth: `packages/catalog/src/forge-matrix.ts` → sync CSVs → `build-seed.ts` → Admin apply.

## Launch vessels (15) + specialty retained

| Shape | SKU | Size | Handles | GBP |
| --- | --- | --- | --- | --- |
| Frying pan | MT-FOR-FRY-20/24/28 | 20 / 24 / 28 | stick; 28 stick+helper | 130 / 145 / 160 |
| Saucier | MT-FOR-SCR-20/24 | 20 / 24 | stick | 140 / 155 |
| Sauté | MT-FOR-STE-24/28 | 24 / 28 | stick+helper | 155 / 170 |
| Tawa | MT-FOR-TAV-26/30 | 26 / 30 | short riveted / dual loops | 130 / 145 |
| Saucepan | MT-FOR-SPN-16, MT-FOR-SAU-20 | 16 / 20 | stick | 130 / 145 |
| Stockpot | MT-FOR-STK-24/28 | 24 / 28 | dual loops | 160 / 175 |
| Kadhai | MT-FOR-KAD-24/28 | 24 / 28 | stick+helper / dual loops | 145 / 160 |
| Specialty | MT-FOR-RLY-26 Dual-Mass | 26 | stick + ring | 175 |
| Specialty | MT-FOR-PLN-46 Plancha | 46×28 | dual | 220 |

## Universal lids

| SKU | Seat | GBP |
| --- | --- | --- |
| MT-FOR-LID-20 | 16/20 | 30 |
| MT-FOR-LID-24 | 24 | 35 |
| MT-FOR-LID-28 | 28 (32 reserved) | 40 |

Specialty Relay lids `MT-FOR-LID-26` / `MT-FOR-LID-30` retained for Dual-Mass / Wide Tawa era fit.

## Bundles (catalog set products, not native Shopify Bundle app)

Membership collection: `forge-sets`. Also in `forge-hybrid` + `care-sets`.

Lids are **free inside curated set list prices** (component sum minus included lids).

| SKU | Handle | Composition |
| --- | --- | --- |
| MT-FOR-SET-SOLO | forge-set-solo-couple | FRY-20 + SPN-16 + SCR-20 + LID-20 |
| MT-FOR-SET-FAM | forge-set-family-standard | FRY-24 + SAU-20 + STK-24 + KAD-24 + LID-20/24 |
| MT-FOR-SET-ENT | forge-set-entertainer | FRY-28 + STE-28 + STK-28 + TAV-30 + LID-28 |
| MT-FOR-SET-EUR | forge-set-european | FRY-24 + STE-24 + SAU-20 + SCR-20 + lids |
| MT-FOR-SET-ASN | forge-set-asian | TAV-26 + KAD-24 + SAU-20 + lids |
| MT-FOR-SET-DAY | forge-set-everyday | FRY-24 + SAU-20 + SCR-20 + lids |
| MT-FOR-SET-FUL | forge-set-full-house | Full launch vessel matrix + universal lids |

Component SKUs live in `specs.bundle_components`.

## Deferred

- Saucier 26; stockpot 20; kadhai 32 XXL; optional 32 rim standard for vessels
- Terre / Kuro expansion (unchanged)
- Production photography (Human/Engineer/Machine plates in image brief)
- Live warehouse inventory (separate inventory subagent — see `docs/inventory-handoff-forge.md`)

## Commands

```bash
bun packages/catalog/scripts/sync-forge-csvs.ts
bun packages/catalog/scripts/build-seed.ts
bun test packages/catalog
bun scripts/push-catalog.ts --apply --publish --store maison-tavo.myshopify.com
bun theme/scripts/build-kansa-catalog.ts
```

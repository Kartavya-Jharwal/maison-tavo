# Artwork audit and download brief — 22 November 2026

The live storefront is `theme/`. `raw input/` is a source folder and is not uploaded with the Shopify theme. Product media in Shopify Admin is separate again: copying a file into `theme/assets/` does not attach it to a product.

## What is already present

- All 17 files in `raw input/initial images/` have byte-identical copies in `theme/assets/`, alongside readable `maison-*` aliases. This is ingestion into the theme, not proof of attachment to Shopify products.
- The homepage hero and fallback are currently `maison-hero.webp`, an 823 × 823 studio kadai photo. The file is too small for a full-width desktop hero and is square, so the 2400 × 1600 attributes were corrected to the actual dimensions. A new high-resolution landscape master is still needed.
- `maison-pan-stacked-showcase.webp` (1080 × 1350) now illustrates the Story page and one Building entry. Existing clay craft and handle detail photos illustrate two other Building entries.
- Three references to nonexistent `maison-handles-grip-study.avif` were replaced by existing images. Fallback image dimensions in Story, Lineups, and Carousel now match their files.
- The local 3D demo's ten 1600 × 1600 PNGs have been transcoded to `theme/assets/maison-concept-*.webp` (16.3 MB of source PNGs to 0.89 MB of theme assets). A Liquid mapping displays the closest vessel shape on cards, product galleries, the set builder and the 3D fallback **when Shopify has no product media**. It labels each as an illustrative concept image. The original PNGs remain in `raw input/`. The images remain separate from Shopify Admin product media and do not override a product's actual featured image.
- Several initial cookware photos are very small (493 or 823 pixels square), and the flagship image visibly bears another maker's mark. They remain temporary visual approximations under the user's explicit direction.
- `raw input/seasoning-maintenance..jpg` is now copied to `theme/assets/maison-concept-care-kit.jpg` and used for the Maintenance tile, care guide and matching no-media product fallbacks. The source visibly shows an Ironclad-branded care kit; its alt text describes an illustrative kit rather than claiming it is Maison Tavo's.
- Five readable theme aliases have no direct Liquid/JSON reference at present: `maison-about-bronze-clay.webp`, `maison-about-mud-pots.webp`, `maison-highpot-closeup.webp`, `maison-pan-lid.webp`, and `maison-pan-topdown.jpg`. The first two duplicate images used under other names; the other three remain available for future, product-specific use after ownership and item match are checked.

## Download these editorial photographs

Download the original/highest resolution file from the linked photo page. Keep its original filename or rename to the target below, and place it in `raw input/editorial downloads/` so it can be reviewed and optimized before it enters `theme/assets/`. Save the photo page URL and photographer name with the download. These photographs illustrate a topic; they do not depict Maison Tavo products or makers.

| Priority | Target filename | Intended placement and crop | Exact licensed photo page |
| --- | --- | --- | --- |
| 1 | `editorial-roti-tava.jpg` | About/Dhanteras story, hands placing chapati on a tava; portrait 4:5 | [Vivaan Rupani on Pexels](https://www.pexels.com/photo/a-person-cooking-chapati-on-tava-7351727/) |
| 2 | `editorial-potter-mumbai.jpg` | About story, potter at work in Mumbai; portrait 4:5 | [Ritesh Singh on Unsplash](https://unsplash.com/photos/a-potters-hand-is-spinning-a-pot-on-a-potters-wheel-JW7J__Nfors) |
| 3 | `editorial-indian-kitchen.jpg` | Building or Kitchen intro, real working kitchen; portrait 4:5 | [Abhishek Sriram on Pexels](https://www.pexels.com/photo/traditional-indian-kitchen-with-cooking-utensils-37142573/) |
| 4 | `editorial-spices-pan.jpg` | Heat study intro, overhead aromatics in a steel pan; portrait 4:5 | [Sagar Konduri on Pexels](https://www.pexels.com/photo/aromatics-and-herbs-on-a-stainless-steel-pan-13413393/) |
| 5 | `editorial-cooking-hands.jpg` | Finder or catalogue editorial tile, cooking with spices; landscape 3:2 | [Gagan Kaur on Pexels](https://www.pexels.com/photo/a-woman-cooking-indian-food-3531700/) |
| 6 | `editorial-potter-workshop.jpg` | Optional second Chulha chapter, wider workshop view; landscape 3:2 | [Anil Sharma on Pexels](https://www.pexels.com/photo/artisan-potter-shaping-clay-pot-outdoors-in-india-30969805/) |

The [Unsplash license](https://unsplash.com/license) and [Pexels license](https://www.pexels.com/license/) permit free commercial website use. Their licenses do not make the depicted people, workshops, brands or objects Maison Tavo's, and Pexels prohibits implying endorsement. Caption documentary images as illustrative editorial photography, never as our factory, maker, or actual product.

## Artwork that stock photography cannot solve

- **Homepage desktop hero:** a licensed or owned Maison Tavo vessel in a kitchen, landscape 3:2 or 16:9, at least 2400 px wide, with negative space for the headline. A stock photo of a different branded pan would misrepresent the product. The current square fallback stays until this exists.
- **Product cards and PDPs:** `data/maison-tavo-image-production-brief.csv` is the exhaustive shot list: 238 entries for 53 product handles (90 Human, 74 Engineer, 74 Machine). All 53 primary Human entries are marked missing or external placeholder: 44 missing, 9 placeholders. For each sellable product, obtain its *actual* object in a clean three-quarter view plus an in-use/finish detail, following the CSV dimensions and alt text brief. Do not substitute Unsplash/Pexels cookware as product imagery.
- **Engineer and Machine lenses:** the 74 + 74 entries are design plates/code outputs, not stock photos. Existing SVG/ASCII placeholders can remain until verified CAD dimensions and product records are ready.
- **Provenance/metalwork:** source an identified workshop or maker only with permission and accurate attribution. Generic metalworker stock should not be called the Maison Tavo foundry.

Once downloaded, the editorial files can replace the designated fallback images through Shopify Files/image-picker settings or a theme asset mapping. Keep the originals in `raw input/` and publish optimized derivatives with real width/height attributes and descriptive alt text.

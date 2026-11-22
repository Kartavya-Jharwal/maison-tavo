# Theme JS chain

Shopify uploads whatever sits in `theme/assets/`. It has no idea whether a bundle is referenced, whether the Liquid tag that loads it still exists, or whether the module that loads it ever calls the initializer. A package can therefore be installed, bundled, uploaded — and completely unused.

`theme/scripts/verify-js-chain.mjs` closes that gap. Run it with:

```bash
bun run theme:verify      # from the repo root
bun run --cwd theme verify
```

It runs automatically in `bun run theme:lint:all` and in `bun run ship` (before the production push), and exits non-zero on any broken link.

## The five links

| Link | What the verifier checks |
| --- | --- |
| 1. Imported by a usecase | Every bare import in `theme/scripts/src/**` maps to a package declared in `theme/package.json` and installed in `node_modules`. Declared-but-unused packages are reported. |
| 2. Included in the generated bundle | Every job in `theme/scripts/build.ts` has an existing entry file, an existing output in `assets/`, and a non-trivial file size. Relative imports inside `scripts/src` resolve. |
| 3. Loaded by Liquid | Every `'x.js' \| asset_url` reference points at a real file, and every generated bundle is reachable from a Liquid loader — either directly (`<script src=…>`) or through a `MaisonAssets.<key>` URL that a Liquid snippet assigns. |
| 4. Initialized on the page | Lazy bundles are checked for a matching handshake: `MaisonVessel.mountAll`, `MaisonCarousel.mountAll`, `MaisonIdleBlaze.init`, or a self-boot (`DOMContentLoaded` → `boot`). `MaisonAssets.<key>` readers must have a writer and vice versa. |
| 5. Packaged with the theme | `.shopifyignore` must not exclude `assets/`, `*.js`, or a bare `package.json` (which would hide `assets/package.json`). `assets/package.json` must stay `{ "type": "module" }`. |

It also validates the microapp registry: every entry in `theme/microapps/apps.json` has a built asset, and its `embed` mode (`iframe` / `section`) agrees with the allowlist in `sections/maison-microapp.liquid`. A section-only bundle such as `kansa` cannot be framed, and an iframe bundle cannot silently 404.

## Report shape

```
Packages
  imported  embla-carousel           scripts/src/carousel.js
  unused    some-package             —

Bundles
  built     assets/maison-carousel.js   snippets/maison-flagship.liquid

Hand-written / vendored
  loaded    maison-motion.js            snippets/scripts.liquid
```

Warnings do not fail the build. The current warnings are the uncommitted splash/globe media files, which `shopify theme check` already reports as `MissingAsset`.

## Adding a package

1. `bun add <package>` inside `theme/`.
2. Import it from a file under `scripts/src/`.
3. Add or extend a `jobs` entry in `scripts/build.ts`.
4. Load the output from Liquid — directly, or via `window.MaisonAssets` in `snippets/maison-flagship.liquid`.
5. If it is lazy, add the initializer call and a `HANDSHAKES` entry in the verifier.
6. `bun run theme:verify && bun run theme:build`.

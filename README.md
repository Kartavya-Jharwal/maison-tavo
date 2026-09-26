# Maison Tavo

Headless storefront for Maison Tavo. Shopify Hydrogen renders the shop; React Router owns the routes.

## Stack

- [Shopify Hydrogen](https://shopify.dev/custom-storefronts/hydrogen) on Oxygen
- React Router 7
- Vite, Tailwind CSS 4, and TypeScript

## Requirements

Node.js 22 or 24.

## Local development

```bash
npm install
npm run dev
```

Store credentials belong in `.env`. That file is ignored by git.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Develop locally, with codegen |
| `npm run build` | Production build |
| `npm run preview` | Preview the production build |
| `npm run lint` | Lint |
| `npm run typecheck` | Typecheck |

## Documentation

Guides are written for [Material for MkDocs](https://squidfunk.github.io/mkdocs-material/).

```bash
python -m pip install -r requirements-docs.txt
python -m mkdocs serve
```

Source pages are in `docs/`. The generated site (`site/`) is not committed.

## License

Proprietary. All rights reserved. See [LICENSE](LICENSE).

# Getting started

## Requirements

- Node.js 22 or 24
- A Shopify store connected through the [Shopify CLI](https://shopify.dev/docs/api/shopify-cli)
- Python 3.11 or newer, only if you want to preview these docs

## Install and run

```bash
npm install
npm run dev
```

The dev server codegen-refreshes Storefront API types and serves the storefront locally. Shopify CLI prints the local URL when the server is ready.

## Environment

Copy the Hydrogen environment template your CLI link step creates, and keep secrets in `.env`. That file is gitignored.

The storefront expects the usual Hydrogen variables, including:

- `SESSION_SECRET`
- `PUBLIC_STORE_DOMAIN`
- `PUBLIC_STOREFRONT_API_TOKEN`
- `PRIVATE_STOREFRONT_API_TOKEN`

Customer account routes also need the Customer Account API client settings from the Hydrogen setup guide.

!!! warning "Do not commit secrets"
    `.env` stays on your machine. Tokens in that file belong in Shopify and in your local environment, not in git.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Local storefront with codegen |
| `npm run build` | Production build |
| `npm run preview` | Build, then preview the production bundle |
| `npm run lint` | ESLint |
| `npm run typecheck` | Route typegen and TypeScript |
| `npm run codegen` | Regenerate GraphQL and route types |

## Documentation site

These pages use [Material for MkDocs](https://squidfunk.github.io/mkdocs-material/).

```bash
python -m pip install -r requirements-docs.txt
python -m mkdocs serve
```

Open the URL MkDocs prints (usually `http://127.0.0.1:8000`). `python -m mkdocs build` writes the static site to `site/`, which is gitignored.

# Development

## Layout

```text
app/
  components/    Shared UI
  graphql/       Customer Account API documents
  lib/           Session, cart fragments, search, context
  routes/        File-based routes
docs/            This documentation
public/          Static assets
server.ts        Hydrogen fetch handler
```

Generated files such as `storefrontapi.generated.d.ts` and `.react-router/` come from codegen. Do not edit them by hand. Run `npm run codegen` after GraphQL or route changes when the dev server is not already doing that for you.

## Checks

```bash
npm run lint
npm run typecheck
```

## Docs

Edit Markdown under `docs/` and the nav in `mkdocs.yml`. Preview with:

```bash
python -m mkdocs serve
```

Keep storefront behavior described here in step with `app/`. When a route or command changes, update the matching page in the same change.

## Shopify

Use the Shopify CLI for store linking, environment pulls, and deploys. Platform API work should follow current Shopify documentation rather than copied examples from older Remix-based Hydrogen guides.

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

## Theme dev loop (known issue + workaround)

!!! warning "`shopify theme dev` is currently blocked by a CLI validation bug"
    `shopify theme dev` (CLI 4.8.2, latest) runs its own upload validation that rejects
    Horizon's `color_palette` dynamic color defaults (`{{ settings.color_palette.* }}`) and
    several stock block presets, then serves a "Failed to Upload Theme Files" page. The same
    files pass `shopify theme push` and render fine — the platform accepts them; only the dev
    server's validator rejects them. Push upload order was fixed in CLI 4.0.0; the dev-server
    path lags behind.

**Working dev loop (push-based preview):**

```bash
# from theme/ — storefront password is required (store is password-protected)
$env:SHOPIFY_FLAG_STORE_PASSWORD = "<storefront password>"
shopify theme push --development --nodelete   # re-run after edits
```

Preview at `https://maison-tavo.myshopify.com/?preview_theme_id=<id>` (printed after each
push). No hot reload until the CLI bug is fixed upstream — re-push on change. Do not "fix" the
`color_palette` defaults to satisfy the dev server; they are valid per the platform docs and
match the live theme.

The HTTPS proxy (`bun run dev:theme:https`, port 9443) fronts the `theme dev` server on 9292,
so it is blocked by the same bug. Voice/mic work needing a secure context can use the preview
URL over HTTPS instead.

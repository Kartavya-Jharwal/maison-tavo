# Maison Tavo

Bun workspace for the Maison Tavo Shopify store. The **live storefront is the Liquid theme** in `theme/` (customized Horizon). Hydrogen in `hydrogen/` is a secondary Oxygen preview, not the published shop.

Store: [maison-tavo.myshopify.com](https://maison-tavo.myshopify.com)

## Layout

| Path | Role |
| --- | --- |
| `theme/` | Live Liquid / Horizon theme |
| `hydrogen/` | Hydrogen + React Router app on Oxygen (preview) |
| `packages/ucp` | UCP client library |
| `apps/agents` | Local UCP agent HTTPS server |
| `docs/` | MkDocs sources (published from another branch / GitHub Pages) |

## Setup

Requires [Bun](https://bun.sh/) and [mkcert](https://github.com/FiloSottile/mkcert) for local HTTPS.

This machine already has an mkcert CA (typically `%LOCALAPPDATA%\mkcert`). `bun run certs` reuses it and only writes leaf certs for `localhost` into `.certs/`. It does not install a second CA. To point at existing leaf files instead:

```bash
set MAISON_TLS_CERT=C:\path\to\localhost.pem
set MAISON_TLS_KEY=C:\path\to\localhost-key.pem
```

```bash
bun install
bun run certs
```

Copy `apps/agents/.env.example` to `apps/agents/.env` and fill placeholders. Do not commit `.env` files. Cloudflare tunnel hostnames from `bun run tunnel:agents` are ephemeral — put them only in the local `.env`.

Hydrogen storefront credentials live in `hydrogen/.env` (gitignored).

## Local development

Theme CLI (`shopify theme dev`) serves HTTP on port **9292** and creates an **unpublished** development theme. It does not overwrite live. Live publish is an explicit production push.

| Command | Purpose |
| --- | --- |
| `bun run dev:theme` | Theme preview at http://127.0.0.1:9292 |
| `bun run dev:theme:https` | HTTPS proxy https://localhost:9443 → 9292 |
| `bun run dev:hydrogen` | Hydrogen at http://localhost:3000 |
| `bun run dev:hydrogen:https` | HTTPS proxy https://localhost:3443 → 3000 |
| `bun run dev:agents` | Agent server at https://localhost:4443 |
| `bun run tunnel:agents` | Cloudflare tunnel in front of 4443 |
| `bun run theme:build` | Bundle theme JS (`motion`, `zustand`) into `theme/assets/` |
| `bun run theme:check` | Shopify Theme Check |
| `bun run typecheck` | Typecheck `packages/ucp` and `apps/agents` |
| `bun test packages apps` | Unit tests |

Run `dev:theme` and `dev:theme:https` in two terminals if you need HTTPS in front of the theme.

Equivalent theme CLI (from `theme/`):

```bash
shopify theme dev -e development
shopify theme pull -e production
bun run push
```

`bun run push` rebuilds and verifies the bundles before uploading to live theme `210460377457`. The production environment preserves `config/settings_data.json` on the store. See [`theme/AGENTS.md`](theme/AGENTS.md) for theme development notes.

## License

Proprietary. All rights reserved. See [LICENSE](LICENSE).

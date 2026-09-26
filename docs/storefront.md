# Storefront

The storefront is a React Router app hosted the Hydrogen way. `server.ts` builds a Hydrogen request context and hands the request to React Router.

Routes are file-based. `app/routes.ts` loads them with `@react-router/fs-routes` and wraps the list in `hydrogenRoutes()`.

## Surfaces

| Path | Role |
| --- | --- |
| `/` | Home |
| `/products/:handle` | Product detail |
| `/collections` and `/collections/:handle` | Collection browsing |
| `/search` | Search |
| `/cart` | Cart |
| `/account` | Customer account, orders, addresses, and profile |
| `/blogs` | Blog index and articles |
| `/pages/:handle` | Shopify pages |
| `/policies` | Store policies |
| `/discount/:code` | Discount deep link |

Shared chrome lives in `app/components/` (`PageLayout`, `Header`, `Footer`, cart, and search). Data helpers and session setup live in `app/lib/`. GraphQL documents live in `app/graphql/`.

Imports inside the app use the `~/` alias, for example `~/components/Header`.

## Stack

- Shopify Hydrogen and Oxygen
- React Router 7
- React 18
- Vite
- Tailwind CSS 4
- TypeScript

Routing imports come from `react-router` and `@react-router/*`. This project does not use Remix packages.

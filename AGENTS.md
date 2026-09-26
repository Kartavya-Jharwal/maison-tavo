# Maison Tavo

Live storefront: customized Horizon (Liquid) in `theme/`. Read [`theme/AGENTS.md`](theme/AGENTS.md) before CSS or theme edits.

`hydrogen/` is a secondary Oxygen preview, not the live shop. React Router imports come from `react-router` (never `react-router-dom` or `@remix-run/*`).

Use the [Shopify AI Toolkit](https://shopify.dev/docs/apps/build/ai-toolkit) for all Shopify API and platform work. If missing, install it in the agent host per that page (or `npx skills add Shopify/shopify-ai-toolkit --list` for skill-compatible hosts).

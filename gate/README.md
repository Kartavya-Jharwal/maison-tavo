# Scene 0 — static exhibition entrance

Deployable HTML wrapper for Maison Tavo. Shopify’s development-store password page cannot be themed; this page is the public invitation instead.

## What it does

1. Shows the exhibition passcode in monospace.
2. **Copy Passcode** writes it to the clipboard.
3. **Enter Store Gate** copies again, then opens `https://maison-tavo.myshopify.com/` so visitors paste into Shopify’s system gate.

## Deploy

Serve the `gate/` folder as a static site (GitHub Pages project path, Netlify, Cloudflare Pages, or any static host).

Examples:

```bash
# local preview
npx --yes serve gate

# GitHub Pages: publish /gate as the site root, or host at /maison-tavo/gate/
```

Single file: `index.html` (inline CSS + JS). No build step.

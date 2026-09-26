# Frontend microapps

These are **not** Shopify apps. They are vanilla JS widgets loaded by `sections/maison-microapp.liquid` inside a sandboxed iframe (`allow-scripts` only).

Shopify cannot store files in `assets/` subfolders. Convention:

| Registry | Theme file |
| --- | --- |
| `theme/microapps/apps.json` | `assets/microapp-<id>.js` |

The section setting **Microapp id** (or page metafield `maison.microapp_id`) must match `id` in `apps.json`. Liquid loads `microapp-<id>.js` via `asset_url`.

## Add a new microapp

1. Add an object to `apps.json` (`id`, `title`, `description`, `entry`, `route_handle`).
2. Create `theme/assets/microapp-<id>.js`. Mount on `#maison-microapp-root`. Stay frontend-only.
3. In Admin, **Online Store → Pages → Add page**. Title as you like. Handle = `route_handle`. Theme template: **microapp** (`page.microapp`).
4. In the theme editor, set **Microapp id** to your `id`, or create metafield **Namespace** `maison`, **Key** `microapp_id`, type single-line text.

Example page: handle `lookbook`, id `lookbook`.

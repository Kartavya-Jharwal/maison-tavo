/**
 * Verify & attach product media on Shopify Admin, confirming that media records
 * reach `READY` status on the product (and optional variant) in Shopify rather
 * than relying on local asset paths or theme placeholders.
 *
 * Usage:
 *   bun scripts/attach-images.ts          # read-only media audit against Shopify Admin
 *   bun scripts/attach-images.ts --apply --legacy-catalog  # explicit older-catalog media upload
 */

import {homedir} from 'node:os';
import {join} from 'node:path';
import {existsSync, readFileSync} from 'node:fs';
import {seedCatalog} from '../packages/catalog/src/index.ts';

const STORE = process.env.SHOPIFY_FLAG_STORE ?? 'maison-tavo.myshopify.com';
const API_VERSION = '2026-04';
const APPLY = process.argv.includes('--apply');
if (APPLY && !process.argv.includes('--legacy-catalog')) {
  throw new Error('This image map targets the older catalogue. Pass --legacy-catalog explicitly before --apply.');
}

/**
 * Approved or concept-stage remote image sources keyed by product handle.
 * The 14 assortment extensions intentionally stay omitted here until owned
 * photography or CAD renders are approved — we do not attach unrelated stock photos.
 */
const PRODUCT_IMAGES: Record<string, {url: string; alt: string; bindToDefaultVariant?: boolean}> = {
  'ardh-metal-lined-kulhad': {
    url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1200&q=80',
    alt: 'Ardh Metal-Lined Kulhad — 140 ml earthenware shell with removable stainless drink liner (concept placeholder)',
    bindToDefaultVariant: true,
  },
  'ardh-clay-lined-kulhad': {
    url: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=1200&q=80',
    alt: 'Ardh Clay-Lined Kulhad — 180 ml vitrified clay bowl in spun stainless base (concept placeholder)',
    bindToDefaultVariant: true,
  },
  'rekha-laser-marked-serving-platter': {
    url: 'https://images.unsplash.com/photo-1612058060757-aa8f7f66e687?auto=format&fit=crop&w=1200&q=80',
    alt: 'Rekhā Laser-Marked Serving Platter — 34 cm high-fired stoneware platter (concept placeholder)',
    bindToDefaultVariant: true,
  },
  'rekha-laser-marked-chai-bowl': {
    url: 'https://images.unsplash.com/photo-1772453609632-2f4aa857f56e?auto=format&fit=crop&w=1200&q=80',
    alt: 'Rekhā Laser-Marked Chai Bowl — 220 ml stoneware bowl with exterior laser register (concept placeholder)',
    bindToDefaultVariant: true,
  },
  'forge-relay-dual-mass-skillet': {
    url: 'https://images.unsplash.com/photo-1601763969974-52eba0369424?auto=format&fit=crop&w=1200&q=80',
    alt: 'Forge Relay Dual-Mass Skillet — 26 cm nitrided carbon-steel pan with removable bronze thermal ring (concept placeholder)',
    bindToDefaultVariant: true,
  },
  'forge-split-field-plancha': {
    url: 'https://images.unsplash.com/photo-1637739699971-7d4d5194e75c?auto=format&fit=crop&w=1200&q=80',
    alt: 'Forge Split-Field Plancha — 46 × 28 cm carbon-steel sear zone and stainless-lined bronze deck (concept placeholder)',
    bindToDefaultVariant: true,
  },
  'forge-terre-nested-roaster': {
    url: 'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?auto=format&fit=crop&w=1200&q=80',
    alt: 'Forge–Terre Nested Roaster — 34 × 24 cm clad stainless insert nested in ceramic presentation cradle (concept placeholder)',
    bindToDefaultVariant: true,
  },
  'kuro-strip-200-chefs-knife': {
    url: 'https://images.unsplash.com/photo-1778050438966-027fb9e43941?auto=format&fit=crop&w=1200&q=80',
    alt: "Kuro Strip 200 Chef's Knife — 200 mm continuous steel-strip frame with replaceable grip sleeve (concept placeholder)",
    bindToDefaultVariant: true,
  },
  'kuro-trace-180-hybrid-edge-knife': {
    url: 'https://images.unsplash.com/photo-1780761423774-1a5f5ea2f668?auto=format&fit=crop&w=1200&q=80',
    alt: 'Kuro Trace 180 Hybrid-Edge Knife — 180 mm forward micro-scalloped slicer with plain heel (concept placeholder)',
    bindToDefaultVariant: true,
  },
  'kuro-trace-150-micro-scalloped-utility-knife': {
    url: 'https://images.unsplash.com/photo-1780761424870-9801ba23f90b?auto=format&fit=crop&w=1200&q=80',
    alt: 'Kuro Trace 150 Micro-Scalloped Utility Knife — 150 mm continuous-strip utility blade (concept placeholder)',
    bindToDefaultVariant: true,
  },
  'forge-terre-service-tongs': {
    url: 'https://images.unsplash.com/photo-1584990347449-399a9b70b3b4?auto=format&fit=crop&w=1200&q=80',
    alt: 'Forge–Terre Service Tongs — 24 cm spring-steel tongs with removable ceramic grip pads (concept placeholder)',
    bindToDefaultVariant: true,
  },
};

function loadCliIdentityToken(): string | undefined {
  const fromEnv = process.env.SHOPIFY_ADMIN_API_TOKEN?.trim();
  if (fromEnv) return fromEnv.startsWith('Bearer ') ? fromEnv : `Bearer ${fromEnv}`;
  const confPath = join(
    homedir(),
    'AppData',
    'Roaming',
    'shopify-cli-kit-nodejs',
    'Config',
    'config.json',
  );
  if (!existsSync(confPath)) return undefined;
  try {
    const conf = JSON.parse(readFileSync(confPath, 'utf8'));
    if (!conf.sessionStore) return undefined;
    const root = JSON.parse(conf.sessionStore);
    const accounts = root['accounts.shopify.com'];
    if (!accounts) return undefined;
    const sessionId = conf.currentSessionId ?? Object.keys(accounts)[0];
    const token = accounts[sessionId]?.identity?.accessToken;
    if (!token) return undefined;
    return token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  } catch {
    return undefined;
  }
}

async function graphql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const token = loadCliIdentityToken();
  if (!token) throw new Error('No CLI auth token available. Run shopify auth login.');

  const res = await fetch(`https://${STORE}/admin/api/${API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': token.replace(/^Bearer\s+/i, ''),
      Authorization: token,
    },
    body: JSON.stringify({query, variables}),
  });

  const json = (await res.json()) as {data?: T; errors?: Array<{message: string}>};
  if (!res.ok || json.errors?.length) {
    throw new Error(`GraphQL failed: ${JSON.stringify(json.errors ?? json)}`);
  }
  return json.data as T;
}

type ProductMediaNode = {
  id: string;
  handle: string;
  title: string;
  media: {
    nodes: Array<{
      id: string;
      status: string;
      alt?: string | null;
      mediaContentType: string;
    }>;
  };
  variants: {
    nodes: Array<{
      id: string;
      sku?: string | null;
      media: {nodes: Array<{id: string}>};
    }>;
  };
};

async function main() {
  console.log(`Store: ${STORE}`);
  console.log(`Mode:  ${APPLY ? 'APPLY (mutating & verifying Shopify media)' : 'AUDIT DRY-RUN'}`);

  const query = `
    query AuditProductMedia($query: String!) {
      products(first: 50, query: $query) {
        nodes {
          id
          handle
          title
          media(first: 10) {
            nodes {
              id
              status
              alt
              mediaContentType
            }
          }
          variants(first: 5) {
            nodes {
              id
              sku
              media(first: 1) {
                nodes { id }
              }
            }
          }
        }
      }
    }
  `;

  const data = await graphql<{products: {nodes: ProductMediaNode[]}}>(query, {
    query: 'vendor:"Maison Tavo"',
  });
  const byHandle = new Map(data.products.nodes.map((p) => [p.handle, p]));

  console.log(`Auditing ${seedCatalog.length} seed SKUs against ${data.products.nodes.length} Shopify Admin records:\n`);

  for (const spec of seedCatalog) {
    const p = byHandle.get(spec.handle);
    if (!p) {
      console.log(`  [MISSING_IN_ADMIN] ${spec.sku} (${spec.handle})`);
      continue;
    }

    const readyMedia = p.media.nodes.filter((m) => m.status === 'READY');
    const failedMedia = p.media.nodes.filter((m) => m.status === 'FAILED');
    const variantHasMedia = Boolean(p.variants.nodes[0]?.media.nodes.length);
    const entry = PRODUCT_IMAGES[spec.handle];

    if (readyMedia.length > 0) {
      console.log(
        `  [READY_ON_SHOPIFY] ${spec.sku} (${spec.handle}) → ${readyMedia.length} READY media (variant_linked=${variantHasMedia})`,
      );
      continue;
    }

    if (failedMedia.length > 0) {
      console.log(`  [MEDIA_FAILED] ${spec.sku} (${spec.handle}) → ${failedMedia.length} FAILED media record(s)`);
    }

    if (!entry) {
      console.log(`  [PENDING_PRODUCTION_ASSET] ${spec.sku} (${spec.handle}) → 0 Shopify media records (awaiting approved photography/render)`);
      continue;
    }

    console.log(`  [NEEDS_UPLOAD] ${spec.sku} (${spec.handle}) → ${entry.url}`);
    if (APPLY) {
      const createMediaMutation = `
        mutation AttachProductMedia($productId: ID!, $media: [CreateMediaInput!]!) {
          productCreateMedia(productId: $productId, media: $media) {
            media {
              id
              status
            }
            mediaUserErrors {
              field
              message
            }
          }
        }
      `;
      const result = await graphql<{
        productCreateMedia: {
          media: Array<{id: string; status: string}>;
          mediaUserErrors: Array<{field: string[]; message: string}>;
        };
      }>(createMediaMutation, {
        productId: p.id,
        media: [
          {
            originalSource: entry.url,
            alt: entry.alt,
            mediaContentType: 'IMAGE',
          },
        ],
      });

      if (result.productCreateMedia.mediaUserErrors.length) {
        console.error(`    ✗ media error on ${spec.handle}:`, result.productCreateMedia.mediaUserErrors);
        continue;
      }

      const createdMedia = result.productCreateMedia.media[0];
      console.log(`    ✓ created Shopify media ${createdMedia?.id} (initial status=${createdMedia?.status})`);

      const defaultVariantId = p.variants.nodes[0]?.id;
      if (entry.bindToDefaultVariant && defaultVariantId && createdMedia?.id) {
        const bindVariantMutation = `
          mutation BindVariantMedia($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
            productVariantsBulkUpdate(productId: $productId, variants: $variants) {
              productVariants { id }
              userErrors { field message }
            }
          }
        `;
        await graphql(bindVariantMutation, {
          productId: p.id,
          variants: [{id: defaultVariantId, mediaId: createdMedia.id}],
        });
      }
    }
  }

  console.log('\nMedia audit finished.');
}

if (import.meta.main) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

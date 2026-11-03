/**
 * Attach curated editorial photography to Maison Tavo products in Shopify Admin.
 *
 * Usage:
 *   bun scripts/attach-images.ts          # dry-run check
 *   bun scripts/attach-images.ts --apply  # upload & attach media
 */

import { homedir } from 'node:os';
import { join } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

const STORE = 'maison-tavo.myshopify.com';
const API_VERSION = '2025-10';
const APPLY = process.argv.includes('--apply');

const PRODUCT_IMAGES: Record<string, { url: string; alt: string }> = {
  'ardh-metal-lined-kulhad': {
    url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1200&q=80',
    alt: 'Ardh Metal-Lined Kulhad - 140ml earthenware and stainless steel chai vessel',
  },
  'ardh-clay-lined-kulhad': {
    url: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=1200&q=80',
    alt: 'Ardh Clay-Lined Kulhad - 180ml modular tea vessel in stainless chassis',
  },
  'rekha-laser-marked-serving-platter': {
    url: 'https://images.unsplash.com/photo-1612058060757-aa8f7f66e687?auto=format&fit=crop&w=1200&q=80',
    alt: 'Rekha Laser-Marked Serving Platter - 34cm high-fired ceramic platter',
  },
  'rekha-laser-marked-chai-bowl': {
    url: 'https://images.unsplash.com/photo-1772453609632-2f4aa857f56e?auto=format&fit=crop&w=1200&q=80',
    alt: 'Rekha Laser-Marked Chai Bowl - 220ml ceramic bowl with laser etched notation',
  },
  'forge-relay-dual-mass-skillet': {
    url: 'https://images.unsplash.com/photo-1601763969974-52eba0369424?auto=format&fit=crop&w=1200&q=80',
    alt: 'Forge Relay Dual-Mass Skillet - 26cm drop-forged carbon steel pan',
  },
  'forge-split-field-plancha': {
    url: 'https://images.unsplash.com/photo-1637739699971-7d4d5194e75c?auto=format&fit=crop&w=1200&q=80',
    alt: 'Forge Split-Field Plancha - 46cm griddle cooking surface',
  },
  'forge-terre-nested-roaster': {
    url: 'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?auto=format&fit=crop&w=1200&q=80',
    alt: 'Forge × Terre Nested Roaster - 34cm dual material roaster',
  },
  'kuro-strip-200-chefs-knife': {
    url: 'https://images.unsplash.com/photo-1778050438966-027fb9e43941?auto=format&fit=crop&w=1200&q=80',
    alt: "Kuro Strip 200 Chef's Knife - 67-layer Damascus steel blade",
  },
  'kuro-trace-180-hybrid-edge-knife': {
    url: 'https://images.unsplash.com/photo-1780761423774-1a5f5ea2f668?auto=format&fit=crop&w=1200&q=80',
    alt: 'Kuro Trace 180 Hybrid-Edge Knife - Japanese style kitchen knife',
  },
  'kuro-trace-150-micro-scalloped-utility-knife': {
    url: 'https://images.unsplash.com/photo-1780761424870-9801ba23f90b?auto=format&fit=crop&w=1200&q=80',
    alt: 'Kuro Trace 150 Micro-Scalloped Utility Knife',
  },
  'forge-terre-service-tongs': {
    url: 'https://images.unsplash.com/photo-1584990347449-399a9b70b3b4?auto=format&fit=crop&w=1200&q=80',
    alt: 'Forge × Terre Service Tongs - 24cm hospitality service tongs',
  },
};

function loadCliIdentityToken(): string | undefined {
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
    body: JSON.stringify({ query, variables }),
  });

  const json = (await res.json()) as { data?: T; errors?: Array<{ message: string }> };
  if (!res.ok || json.errors?.length) {
    throw new Error(`GraphQL failed: ${JSON.stringify(json.errors ?? json)}`);
  }
  return json.data as T;
}

type ProductNode = {
  id: string;
  handle: string;
  title: string;
  media: {
    nodes: Array<{ id: string; status: string }>;
  };
};

async function main() {
  console.log(`Store: ${STORE}`);
  console.log(`Mode:  ${APPLY ? 'APPLY (mutating media)' : 'DRY-RUN'}`);

  const query = `
    query {
      products(first: 30) {
        nodes {
          id
          handle
          title
          media(first: 5) {
            nodes {
              id
              status
            }
          }
        }
      }
    }
  `;

  const data = await graphql<{ products: { nodes: ProductNode[] } }>(query);
  const products = data.products.nodes;

  console.log(`Found ${products.length} products on store.\n`);

  for (const p of products) {
    const entry = PRODUCT_IMAGES[p.handle];
    if (!entry) {
      console.log(`  [skip] ${p.handle} (no mapping entry)`);
      continue;
    }

    const hasMedia = p.media.nodes.length > 0;
    if (hasMedia) {
      console.log(`  [ok] ${p.handle} already has ${p.media.nodes.length} media`);
      continue;
    }

    console.log(`  [needs image] ${p.handle} -> ${entry.url}`);
    if (APPLY) {
      const mutation = `
        mutation productCreateMedia($productId: ID!, $media: [CreateMediaInput!]!) {
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

      try {
        const result = await graphql<{
          productCreateMedia: {
            media: Array<{ id: string; status: string }>;
            mediaUserErrors: Array<{ field: string; message: string }>;
          };
        }>(mutation, {
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
          console.error(`    error attaching media to ${p.handle}:`, result.productCreateMedia.mediaUserErrors);
        } else {
          console.log(`    ✓ attached media ${result.productCreateMedia.media[0]?.id}`);
        }
      } catch (err) {
        console.error(`    failed to attach image for ${p.handle}:`, err instanceof Error ? err.message : err);
      }
    }
  }

  console.log('\nFinished media check.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

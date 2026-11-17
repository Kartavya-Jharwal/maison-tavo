/**
 * Synchronize Maison Tavo's Online Store Navigation (`main-menu` & `footer`)
 * with the 3-category primary hierarchy + nested 4 material lineups + house pages.
 *
 * Usage:
 *   bun scripts/sync-navigation.ts          # dry-run menu inspection
 *   bun scripts/sync-navigation.ts --apply  # apply menu hierarchy via shopify store execute
 *
 * Requires scopes:
 *   shopify store auth --store maison-tavo-9pyrkr0c.myshopify.com \
 *     --scopes read_products,write_products,read_publications,write_publications,read_online_store_navigation,write_online_store_navigation
 */
import {spawnSync} from 'node:child_process';
import {readFileSync, unlinkSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {ShopifyIdMap} from '../packages/catalog/src/index.ts';

const STORE_DOMAIN = process.env.SHOPIFY_STORE_EXECUTE_DOMAIN ?? 'maison-tavo-9pyrkr0c.myshopify.com';
const API_VERSION = '2026-04';
const APPLY = process.argv.includes('--apply');
const ID_MAP_PATH = join(import.meta.dir, '..', 'data', 'shopify-id-map.json');

function cliGraphql<T>(query: string, variables?: Record<string, unknown>, mutate = false): T {
  const stamp = `${process.pid}-${Date.now()}`;
  const queryFile = join(tmpdir(), `mt-nav-${stamp}.graphql`);
  const varFile = variables ? join(tmpdir(), `mt-nav-${stamp}.vars.json`) : undefined;
  writeFileSync(queryFile, query, 'utf8');
  if (varFile && variables) writeFileSync(varFile, JSON.stringify(variables), 'utf8');

  const args = [
    'store',
    'execute',
    '--store',
    STORE_DOMAIN,
    '--version',
    API_VERSION,
    '--json',
    '--query-file',
    queryFile,
  ];
  if (varFile) args.push('--variable-file', varFile);
  if (mutate) args.push('--allow-mutations');

  try {
    const res = spawnSync('shopify', args, {
      encoding: 'utf8',
      shell: process.platform === 'win32',
      env: {
        ...process.env,
        SHOPIFY_CLI_AGENT_INFO: 'n:cursor|v:none|p:google|m:gemini-4-carbon',
        SHOPIFY_CLI_AGENT_IDS: 'r:sync-navigation',
      },
    });
    if (res.status !== 0) {
      throw new Error(`shopify store execute failed: ${(res.stderr || res.stdout || '').trim()}`);
    }
    const out = res.stdout.trim();
    const parsed = JSON.parse(out.slice(out.indexOf('{'))) as {data?: T; errors?: Array<{message: string}>};
    if (parsed.errors?.length) {
      throw new Error(parsed.errors.map((e) => e.message).join('; '));
    }
    return (parsed.data ?? (parsed as unknown as T));
  } finally {
    for (const f of [queryFile, varFile]) {
      if (f) {
        try {
          unlinkSync(f);
        } catch {
          // ignore
        }
      }
    }
  }
}

const idMap = ShopifyIdMap.parse(JSON.parse(readFileSync(ID_MAP_PATH, 'utf8')));
const colId = (handle: string) => idMap.collections_by_handle[handle]?.collection_id;

const item = (
  title: string,
  type: string,
  url: string,
  resourceId?: string,
  items: Array<Record<string, unknown>> = [],
) => ({title, type, url, resourceId, items});

const MAIN_MENU_ITEMS = [
  item('Cookware', 'COLLECTION', '/collections/cookware', colId('cookware'), [
    item('Forge Hybrid', 'COLLECTION', '/collections/forge-hybrid', colId('forge-hybrid')),
    item('Kuro Strip', 'COLLECTION', '/collections/kuro-strip', colId('kuro-strip')),
    item('Forge × Terre', 'COLLECTION', '/collections/forge-terre', colId('forge-terre')),
  ]),
  item('Tableware & Pottery', 'COLLECTION', '/collections/tableware-pottery', colId('tableware-pottery'), [
    item('Terre Clay', 'COLLECTION', '/collections/terre-clay', colId('terre-clay')),
    item('Forge × Terre', 'COLLECTION', '/collections/forge-terre', colId('forge-terre')),
  ]),
  item('Care & Sets', 'COLLECTION', '/collections/care-sets', colId('care-sets')),
  item('Catalog', 'COLLECTIONS', '/collections'),
  item('Department', 'HTTP', '/pages/department'),
  item('Kitchen', 'HTTP', '/pages/kitchen'),
  item('Heat', 'HTTP', '/pages/heat'),
  item('Finder', 'HTTP', '/pages/finder'),
  item('Releases', 'HTTP', '/pages/releases'),
  item('Journal', 'HTTP', '/pages/journal'),
  item('Mail', 'HTTP', '/pages/mail'),
  item('About', 'HTTP', '/pages/about'),
  item('Contact', 'HTTP', '/pages/contact'),
];

const FOOTER_MENU_ITEMS = [
  item('Catalog', 'COLLECTIONS', '/collections'),
  item('Cookware', 'COLLECTION', '/collections/cookware', colId('cookware')),
  item('Tableware & Pottery', 'COLLECTION', '/collections/tableware-pottery', colId('tableware-pottery')),
  item('Care & Sets', 'COLLECTION', '/collections/care-sets', colId('care-sets')),
  item('Department', 'HTTP', '/pages/department'),
  item('Kitchen', 'HTTP', '/pages/kitchen'),
  item('Heat', 'HTTP', '/pages/heat'),
  item('Finder', 'HTTP', '/pages/finder'),
  item('Releases', 'HTTP', '/pages/releases'),
  item('Journal', 'HTTP', '/pages/journal'),
  item('Mail', 'HTTP', '/pages/mail'),
  item('About', 'HTTP', '/pages/about'),
  item('Contact', 'HTTP', '/pages/contact'),
  item('Privacy Policy', 'HTTP', '/pages/privacy-policy'),
  item('Terms of Service', 'HTTP', '/pages/terms-of-service'),
];

console.log(`Store: ${STORE_DOMAIN}`);
console.log(`Mode:  ${APPLY ? 'APPLY' : 'DRY-RUN'}`);
console.log('Target main-menu structure:');
for (const top of MAIN_MENU_ITEMS) {
  console.log(`  - ${top.title} (${top.url})`);
  for (const sub of top.items) {
    console.log(`      • ${sub.title} (${sub.url})`);
  }
}

if (APPLY) {
  const menusData = cliGraphql<{menus: {nodes: Array<{id: string; handle: string; title: string}>}}>(
    `query GetMenus { menus(first: 20) { nodes { id handle title } } }`,
  );
  const mainMenu = menusData.menus.nodes.find((m) => m.handle === 'main-menu');
  if (!mainMenu) {
    throw new Error('Could not find Online Store menu with handle "main-menu"');
  }

  const updateRes = cliGraphql<{
    menuUpdate: {menu?: {id: string; handle: string}; userErrors: Array<{field?: string[]; message: string}>};
  }>(
    `mutation SyncMainMenu($id: ID!, $title: String!, $handle: String!, $items: [MenuItemUpdateInput!]!) {
      menuUpdate(id: $id, title: $title, handle: $handle, items: $items) {
        menu { id handle }
        userErrors { field message }
      }
    }`,
    {
      id: mainMenu.id,
      title: mainMenu.title,
      handle: mainMenu.handle,
      items: MAIN_MENU_ITEMS,
    },
    true,
  );

  if (updateRes.menuUpdate.userErrors.length) {
    throw new Error(updateRes.menuUpdate.userErrors.map((e) => e.message).join('; '));
  }
  console.log(`\n✓ Updated ${mainMenu.handle} (${mainMenu.id}).`);

  const footerMenu = menusData.menus.nodes.find((m) => m.handle === 'footer');
  const footerRes = footerMenu
    ? cliGraphql<{
        menuUpdate: {userErrors: Array<{message: string}>};
      }>(
        `mutation SyncFooterMenu($id: ID!, $title: String!, $handle: String!, $items: [MenuItemUpdateInput!]!) {
          menuUpdate(id: $id, title: $title, handle: $handle, items: $items) {
            userErrors { message }
          }
        }`,
        {
          id: footerMenu.id,
          title: footerMenu.title,
          handle: footerMenu.handle,
          items: FOOTER_MENU_ITEMS,
        },
        true,
      )
    : cliGraphql<{
        menuCreate: {userErrors: Array<{message: string}>};
      }>(
        `mutation CreateFooterMenu($title: String!, $handle: String!, $items: [MenuItemCreateInput!]!) {
          menuCreate(title: $title, handle: $handle, items: $items) {
            userErrors { message }
          }
        }`,
        {title: 'Footer', handle: 'footer', items: FOOTER_MENU_ITEMS},
        true,
      );
  const footerErrors = footerMenu
    ? (footerRes as {menuUpdate: {userErrors: Array<{message: string}>}}).menuUpdate.userErrors
    : (footerRes as {menuCreate: {userErrors: Array<{message: string}>}}).menuCreate.userErrors;
  if (footerErrors.length) {
    throw new Error(footerErrors.map((e) => e.message).join('; '));
  }
  console.log('✓ Updated footer menu.');
}

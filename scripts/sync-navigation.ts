/**
 * Synchronize Maison Tavo's Online Store Navigation (`main-menu`, `drawer-menu`, `footer`)
 * with a short desktop menu, a grouped drawer menu, and footer links.
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

const STORE_DOMAIN = process.env.SHOPIFY_STORE_EXECUTE_DOMAIN ?? 'maison-tavo-9pyrkr0c.myshopify.com';
const API_VERSION = '2026-04';
const APPLY = process.argv.includes('--apply');
const RELEASE_PATH = join(import.meta.dir, '..', 'data', 'mock-release.json');

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

const release = JSON.parse(readFileSync(RELEASE_PATH, 'utf8')) as {
  store: string;
  collections: {handle: string; id: string}[];
};
if (release.store !== STORE_DOMAIN) {
  throw new Error(`Collection snapshot belongs to ${release.store}, not ${STORE_DOMAIN}`);
}
const collectionId = (handle: string) => {
  const id = release.collections.find(row => row.handle === handle)?.id;
  if (!id) throw new Error(`Missing canonical collection ${handle} in ${RELEASE_PATH}`);
  return id;
};

const item = (
  title: string,
  type: string,
  url: string,
  resourceId?: string,
  items: Array<Record<string, unknown>> = [],
) => ({title, type, url, resourceId, items});

const MAIN_MENU_ITEMS = [
  item('Shop', 'COLLECTIONS', '/collections'),
  item('Forge', 'COLLECTION', '/collections/forge', collectionId('forge')),
  item('Chulha', 'COLLECTION', '/collections/chulha', collectionId('chulha')),
  item('Maintenance', 'COLLECTION', '/collections/maintenance', collectionId('maintenance')),
  item('About', 'HTTP', '/pages/about'),
];

const DRAWER_MENU_ITEMS = [
  item('Shop', 'COLLECTIONS', '/collections', undefined, [
    item('Forge', 'COLLECTION', '/collections/forge', collectionId('forge')),
    item('Chulha', 'COLLECTION', '/collections/chulha', collectionId('chulha')),
    item('Maintenance', 'COLLECTION', '/collections/maintenance', collectionId('maintenance')),
    item('All collections', 'COLLECTIONS', '/collections'),
  ]),
  item('Explore', 'HTTP', '/pages/department', undefined, [
    item('Department', 'HTTP', '/pages/department'),
    item('Kitchen', 'HTTP', '/pages/kitchen'),
    item('Heat', 'HTTP', '/pages/heat'),
    item('Finder', 'HTTP', '/pages/finder'),
    item('Releases', 'HTTP', '/pages/releases'),
  ]),
  item('The house', 'HTTP', '/pages/about', undefined, [
    item('About', 'HTTP', '/pages/about'),
    item('Journal', 'HTTP', '/pages/journal'),
    item('Agents', 'HTTP', '/pages/agents'),
    item('Kansa', 'HTTP', '/pages/kansa'),
  ]),
  item('Help', 'HTTP', '/pages/faq', undefined, [
    item('FAQ', 'HTTP', '/pages/faq'),
    item('Contact', 'HTTP', '/pages/contact'),
    item('Delivery & returns', 'HTTP', '/pages/delivery-returns'),
    item('Care', 'HTTP', '/pages/care'),
  ]),
];

const FOOTER_MENU_ITEMS = [
  item('Shop all', 'COLLECTIONS', '/collections'),
  item('Forge', 'COLLECTION', '/collections/forge', collectionId('forge')),
  item('Chulha', 'COLLECTION', '/collections/chulha', collectionId('chulha')),
  item('Maintenance', 'COLLECTION', '/collections/maintenance', collectionId('maintenance')),
  item('Department', 'HTTP', '/pages/department'),
  item('Kitchen', 'HTTP', '/pages/kitchen'),
  item('Heat', 'HTTP', '/pages/heat'),
  item('Finder', 'HTTP', '/pages/finder'),
  item('Releases', 'HTTP', '/pages/releases'),
  item('Journal', 'HTTP', '/pages/journal'),
  item('Mail', 'HTTP', '/pages/mail'),
  item('About', 'HTTP', '/pages/about'),
  item('Agents', 'HTTP', '/pages/agents'),
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

console.log('Target drawer-menu structure:');
for (const top of DRAWER_MENU_ITEMS) {
  console.log(`  - ${top.title} (${top.url})`);
  for (const sub of top.items) console.log(`    - ${sub.title} (${sub.url})`);
}

if (APPLY) {
  const expectedCollections = release.collections.filter(row =>
    ['forge', 'chulha', 'maintenance'].includes(row.handle),
  );
  const currentCollections = cliGraphql<{nodes: Array<{id: string; handle: string} | null>}>(
    `query VerifyNavigationCollections($ids: [ID!]!) {
      nodes(ids: $ids) { ... on Collection { id handle } }
    }`,
    {ids: expectedCollections.map(row => row.id)},
  );
  for (const expected of expectedCollections) {
    if (!currentCollections.nodes.some(row => row?.id === expected.id && row.handle === expected.handle)) {
      throw new Error(`Collection ${expected.handle} no longer matches the release snapshot; refresh it before applying menus.`);
    }
  }

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

  const drawerMenu = menusData.menus.nodes.find((m) => m.handle === 'drawer-menu');
  const drawerRes = drawerMenu
    ? cliGraphql<{menuUpdate: {userErrors: Array<{message: string}>}}>(
        `mutation SyncDrawerMenu($id: ID!, $title: String!, $handle: String!, $items: [MenuItemUpdateInput!]!) {
          menuUpdate(id: $id, title: $title, handle: $handle, items: $items) {
            userErrors { message }
          }
        }`,
        {id: drawerMenu.id, title: drawerMenu.title, handle: drawerMenu.handle, items: DRAWER_MENU_ITEMS},
        true,
      )
    : cliGraphql<{menuCreate: {userErrors: Array<{message: string}>}}>(
        `mutation CreateDrawerMenu($title: String!, $handle: String!, $items: [MenuItemCreateInput!]!) {
          menuCreate(title: $title, handle: $handle, items: $items) {
            userErrors { message }
          }
        }`,
        {title: 'Drawer', handle: 'drawer-menu', items: DRAWER_MENU_ITEMS},
        true,
      );
  const drawerErrors = drawerMenu
    ? (drawerRes as {menuUpdate: {userErrors: Array<{message: string}>}}).menuUpdate.userErrors
    : (drawerRes as {menuCreate: {userErrors: Array<{message: string}>}}).menuCreate.userErrors;
  if (drawerErrors.length) {
    throw new Error(drawerErrors.map((e) => e.message).join('; '));
  }
  console.log('Updated drawer menu.');

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

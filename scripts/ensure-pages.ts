/**
 * Ensure Maison Tavo storefront pages exist in Admin and use the right templates.
 *
 * Usage (repo root):
 *   bun scripts/ensure-pages.ts           # dry-run
 *   bun scripts/ensure-pages.ts --apply   # create / assign templates
 *
 * Auth: same as scripts/push-catalog.ts (SHOPIFY_ADMIN_API_TOKEN or CLI identity).
 * One-shot — no OAuth retry loops.
 */

import {homedir} from 'node:os';
import {join} from 'node:path';
import {existsSync, readFileSync} from 'node:fs';

/** Permanent domain required for `shopify store auth` / content scopes. */
const STORE =
  process.env.SHOPIFY_FLAG_STORE ?? 'maison-tavo-9pyrkr0c.myshopify.com';
const APPLY = process.argv.includes('--apply');
const API_VERSION = '2025-10';

const PAGES = [
  {title: 'About us', handle: 'about', templateSuffix: 'about'},
  {title: 'Our story', handle: 'our-story', templateSuffix: 'story'},
  {title: 'Building of', handle: 'building', templateSuffix: 'building'},
  {title: 'Privacy Policy', handle: 'privacy-policy', templateSuffix: 'privacy'},
  {title: 'Terms of Service', handle: 'terms-of-service', templateSuffix: 'terms'},
  {title: 'Intellectual property', handle: 'intellectual-property', templateSuffix: 'ipr'},
  {title: 'Colour story explorer', handle: 'lookbook', templateSuffix: 'microapp'},
  {title: 'Kansa Companion', handle: 'kansa', templateSuffix: 'kansa'},
  {title: 'UCP Protocol', handle: 'ucp', templateSuffix: 'ucp'},
] as const;

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
    const conf = JSON.parse(readFileSync(confPath, 'utf8')) as {
      sessionStore?: string;
      currentSessionId?: string;
    };
    if (!conf.sessionStore) return undefined;
    const root = JSON.parse(conf.sessionStore) as Record<
      string,
      Record<string, {identity?: {accessToken?: string; expiresAt?: string}}>
    >;
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

function resolveAdminToken(): string | undefined {
  const fromEnv = process.env.SHOPIFY_ADMIN_API_TOKEN?.trim();
  if (fromEnv) {
    if (
      fromEnv.startsWith('Bearer ') ||
      fromEnv.startsWith('shpat_') ||
      fromEnv.startsWith('shpca_')
    ) {
      return fromEnv;
    }
    if (fromEnv.startsWith('atkn_')) return `Bearer ${fromEnv}`;
    return fromEnv;
  }
  return loadCliIdentityToken();
}

async function adminGraphql<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const token = resolveAdminToken();
  if (!token) {
    throw new Error(
      'No Admin API token. Set SHOPIFY_ADMIN_API_TOKEN or run shopify auth login / theme list once.',
    );
  }
  const raw = token.replace(/^Bearer\s+/i, '');
  const res = await fetch(
    `https://${STORE}/admin/api/${API_VERSION}/graphql.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': raw,
        Authorization: `Bearer ${raw}`,
      },
      body: JSON.stringify({query, variables}),
    },
  );
  const json = (await res.json()) as {
    data?: T;
    errors?: Array<{message: string}>;
  };
  if (!res.ok || json.errors?.length) {
    throw new Error(
      `Admin GraphQL failed (${res.status}): ${JSON.stringify(json.errors ?? json)}`,
    );
  }
  return json.data as T;
}

type PageNode = {
  id: string;
  handle: string;
  title: string;
  templateSuffix: string | null;
};

async function findPageByHandle(handle: string): Promise<PageNode | null> {
  const data = await adminGraphql<{
    pages: {nodes: PageNode[]};
  }>(
    `query ($q: String!) {
      pages(first: 5, query: $q) {
        nodes { id handle title templateSuffix }
      }
    }`,
    {q: `handle:${handle}`},
  );
  return data.pages.nodes.find((p) => p.handle === handle) ?? null;
}

async function createPage(page: (typeof PAGES)[number]): Promise<PageNode> {
  const data = await adminGraphql<{
    pageCreate: {
      page: PageNode | null;
      userErrors: Array<{message: string}>;
    };
  }>(
    `mutation ($page: PageCreateInput!) {
      pageCreate(page: $page) {
        page { id handle title templateSuffix }
        userErrors { message }
      }
    }`,
    {
      page: {
        title: page.title,
        handle: page.handle,
        templateSuffix: page.templateSuffix,
        isPublished: true,
        body: '',
      },
    },
  );
  if (data.pageCreate.userErrors.length || !data.pageCreate.page) {
    throw new Error(
      `pageCreate ${page.handle}: ${JSON.stringify(data.pageCreate.userErrors)}`,
    );
  }
  return data.pageCreate.page;
}

async function updateTemplate(
  id: string,
  templateSuffix: string,
): Promise<void> {
  const data = await adminGraphql<{
    pageUpdate: {userErrors: Array<{message: string}>};
  }>(
    `mutation ($id: ID!, $page: PageUpdateInput!) {
      pageUpdate(id: $id, page: $page) {
        userErrors { message }
      }
    }`,
    {id, page: {templateSuffix}},
  );
  if (data.pageUpdate.userErrors.length) {
    throw new Error(`pageUpdate: ${JSON.stringify(data.pageUpdate.userErrors)}`);
  }
}

async function main() {
  console.log(`Store: ${STORE}`);
  console.log(`Mode:  ${APPLY ? 'APPLY' : 'DRY-RUN'}`);
  for (const page of PAGES) {
    const existing = await findPageByHandle(page.handle);
    if (existing) {
      const needsTemplate =
        (existing.templateSuffix ?? '') !== page.templateSuffix;
      console.log(
        `  ${page.handle}: exists (${existing.id})${
          needsTemplate
            ? ` — template ${existing.templateSuffix ?? '(default)'} → ${page.templateSuffix}`
            : ' — template ok'
        }`,
      );
      if (APPLY && needsTemplate) {
        await updateTemplate(existing.id, page.templateSuffix);
        console.log(`    updated templateSuffix → ${page.templateSuffix}`);
      }
      continue;
    }
    console.log(`  ${page.handle}: missing — would create with template ${page.templateSuffix}`);
    if (APPLY) {
      const created = await createPage(page);
      console.log(`    created ${created.id}`);
    }
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});

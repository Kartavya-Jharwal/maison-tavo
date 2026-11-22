#!/usr/bin/env bun
/**
 * JS chain verifier.
 *
 * Proves, per package, that every link in the chain is intact:
 *
 *   imported by usecase -> included in the generated bundle -> loaded by Liquid
 *   -> initialized on the page -> shipped with the theme
 *
 * Run from theme/: `bun run verify`. Also runs before `bun run lint` and
 * `bun run ship`, so a broken link cannot reach the live storefront.
 *
 * Exit code 1 on any error; warnings do not fail the build.
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

const THEME = resolve(import.meta.dir, '..');
const ASSETS = join(THEME, 'assets');
const SOURCE = join(THEME, 'scripts', 'src');

const errors = [];
const warnings = [];
const rows = [];

const rel = (p) => relative(THEME, p).replaceAll('\\', '/');
const read = (p) => readFileSync(p, 'utf8');
const exists = (p) => existsSync(p);

function error(message) {
  errors.push(message);
}
function warn(message) {
  warnings.push(message);
}

function walk(dir, accept) {
  const out = [];
  if (!exists(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full, accept));
    else if (accept(entry)) out.push(full);
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * 1. Declared packages, and what the source actually imports
 * ------------------------------------------------------------------ */

const pkg = JSON.parse(read(join(THEME, 'package.json')));
const declared = new Set([
  ...Object.keys(pkg.dependencies ?? {}),
  ...Object.keys(pkg.devDependencies ?? {}),
]);

const sourceFiles = walk(SOURCE, (name) => /\.(js|ts|tsx|jsx|mjs)$/.test(name));

/** `gsap/ScrollTrigger` -> `gsap`, `@vgpu/wgsl/prepare` -> `@vgpu/wgsl` */
function packageName(specifier) {
  const parts = specifier.split('/');
  return specifier.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
}

/** @type {Map<string, Set<string>>} package -> importing files */
const importedPackages = new Map();
/** @type {Map<string, string[]>} source file -> bare specifiers */
const bareImportsByFile = new Map();

const IMPORT_FROM_RE = /(?:^|[\n;])\s*import\s+(?:type\s+)?[^'"]*?from\s*['"]([^'"]+)['"]/g;
const IMPORT_SIDE_EFFECT_RE = /(?:^|[\n;])\s*import\s+['"]([^'"]+)['"]/g;
const EXPORT_FROM_RE = /(?:^|[\n;])\s*export\s+(?:type\s+)?(?:\*|\{[^}]*\})\s*from\s*['"]([^'"]+)['"]/g;
const REQUIRE_RE = /require\(\s*['"]([^'"]+)['"]\s*\)/g;

for (const file of sourceFiles) {
  const text = read(file);
  const bare = [];
  const specifiers = [
    ...[...text.matchAll(IMPORT_FROM_RE)].map((m) => m[1]),
    ...[...text.matchAll(IMPORT_SIDE_EFFECT_RE)].map((m) => m[1]),
    ...[...text.matchAll(EXPORT_FROM_RE)].map((m) => m[1]),
    ...[...text.matchAll(REQUIRE_RE)].map((m) => m[1]),
  ];

  for (const specifier of specifiers) {
    if (!specifier) continue;
    if (specifier.startsWith('.') || specifier.startsWith('/') || specifier.startsWith('node:')) continue;
    bare.push(specifier);
    const name = packageName(specifier);
    if (!importedPackages.has(name)) importedPackages.set(name, new Set());
    importedPackages.get(name).add(rel(file));
    if (!declared.has(name)) {
      error(`${rel(file)} imports "${specifier}" but "${name}" is not a dependency in theme/package.json`);
    }
    if (!exists(join(THEME, 'node_modules', name))) {
      error(`${rel(file)} imports "${specifier}" but node_modules/${name} is missing — run \`bun install\``);
    }
  }
  bareImportsByFile.set(file, bare);
}

for (const name of declared) {
  if (!importedPackages.has(name) && name !== '@shopify/cli' && name !== '@webgpu/types') {
    warn(`package "${name}" is declared but nothing in scripts/src imports it`);
  }
}

/* ------------------------------------------------------------------ *
 * 2. Relative imports resolve
 * ------------------------------------------------------------------ */

const RELATIVE_RE = /from\s*['"](\.[^'"]+)['"]/g;

function resolveRelative(fromFile, specifier) {
  const base = resolve(dirname(fromFile), specifier);
  const candidates = [base, `${base}.js`, `${base}.ts`, `${base}.tsx`, `${base}.jsx`, `${base}.mjs`, join(base, 'index.js'), join(base, 'index.ts'), join(base, 'index.tsx')];
  return candidates.find(exists) ?? null;
}

for (const file of sourceFiles) {
  for (const match of read(file).matchAll(RELATIVE_RE)) {
    const specifier = match[1];
    if (!resolveRelative(file, specifier)) {
      error(`${rel(file)} imports "${specifier}" but no matching file exists`);
    }
  }
}

/* ------------------------------------------------------------------ *
 * 3. Build jobs produce the shipped bundles
 * ------------------------------------------------------------------ */

const buildScript = read(join(THEME, 'scripts', 'build.ts'));
const jobRe = /entry:\s*`\$\{themeRoot\}\/([^`]+)`,\s*\n\s*outfile:\s*`\$\{themeRoot\}\/([^`]+)`/g;
const jobs = [];
for (const match of buildScript.matchAll(jobRe)) {
  jobs.push({ entry: join(THEME, match[1]), outfile: join(THEME, match[2]) });
}

if (!jobs.length) error('scripts/build.ts exposes no build jobs');

const builtAssets = new Set();
for (const job of jobs) {
  if (!exists(job.entry)) {
    error(`build job entry missing: ${rel(job.entry)}`);
    continue;
  }
  if (!exists(job.outfile)) {
    error(`build output missing: ${rel(job.outfile)} — run \`bun run build\``);
    continue;
  }
  const size = statSync(job.outfile).size;
  if (size < 512) error(`build output looks empty: ${rel(job.outfile)} (${size} bytes)`);
  builtAssets.add(rel(job.outfile));
}

/* ------------------------------------------------------------------ *
 * 4. Hand-written assets loaded as ESM, and their dependencies
 * ------------------------------------------------------------------ */

const HAND_WRITTEN = ['maison-motion.js', 'maison-sound.js'];
const VENDORED = ['howler.core.min.js'];

async function fsExists(p) {
  return exists(p);
}

for (const name of HAND_WRITTEN) {
  const file = join(ASSETS, name);
  if (!exists(file)) {
    error(`hand-written asset missing: assets/${name}`);
    continue;
  }
  for (const match of read(file).matchAll(RELATIVE_RE)) {
    const specifier = match[1];
    const resolved = await fsExists(join(ASSETS, specifier.replace('./', '')));
    if (!resolved) error(`assets/${name} imports "${specifier}" but assets/${specifier.replace('./', '')} is missing`);
  }
}

for (const name of VENDORED) {
  if (!exists(join(ASSETS, name))) error(`vendored library missing: assets/${name}`);
}

/* ------------------------------------------------------------------ *
 * 5. Liquid references an asset that exists
 * ------------------------------------------------------------------ */

const liquidFiles = walk(THEME, (name) => name.endsWith('.liquid'));
const ASSET_MENTION_RE = /['"]([\w.\-/]+\.(js|css|mp4|webm|jpg|jpeg|png|webp|avif|svg|mp3|wav|woff2?))['"]\s*\|\s*asset_url/g;

/** @type {Map<string, Set<string>>} asset -> liquid files */
const assetLoaders = new Map();
const missingMedia = new Set();

for (const file of liquidFiles) {
  for (const match of read(file).matchAll(ASSET_MENTION_RE)) {
    const asset = match[1];
    if (!assetLoaders.has(asset)) assetLoaders.set(asset, new Set());
    assetLoaders.get(asset).add(rel(file));
    if (!exists(join(ASSETS, asset))) {
      if (/\.(js|css)$/.test(asset)) error(`Liquid loads "${asset}" from ${rel(file)} but assets/${asset} does not exist`);
      else missingMedia.add(asset);
    }
  }
}

for (const asset of missingMedia) {
  warn(`media asset referenced but not committed: assets/${asset} (theme-check reports this as MissingAsset)`);
}

/* ------------------------------------------------------------------ *
 * 6. Microapp registry matches what ships and what loads it
 * ------------------------------------------------------------------ */

/** @type {Map<string, string[]>} asset -> loader files resolved via a registry */
const registryLoaders = new Map();

const appsPath = join(THEME, 'microapps', 'apps.json');
if (exists(appsPath)) {
  const { apps = [] } = JSON.parse(read(appsPath));
  const microappSectionPath = join(THEME, 'sections', 'maison-microapp.liquid');
  const microappSection = exists(microappSectionPath) ? read(microappSectionPath) : '';
  const allowlistMatch = microappSection.match(/assign\s+iframe_apps\s*=\s*'([^']*)'\s*\|\s*split/);
  const iframeAllowlist = new Set(
    (allowlistMatch?.[1] ?? '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
  );

  for (const app of apps) {
    if (!app.id || !app.entry) {
      error(`microapps/apps.json entry is missing id or entry: ${JSON.stringify(app)}`);
      continue;
    }
    if (!exists(join(ASSETS, app.entry))) {
      error(`microapps/apps.json lists "${app.entry}" for "${app.id}" but assets/${app.entry} does not exist`);
      continue;
    }
    if (app.embed === 'iframe') {
      if (!iframeAllowlist.has(app.id)) {
        error(`microapps/apps.json marks "${app.id}" as an iframe app but the maison-microapp allowlist (${[...iframeAllowlist].join(', ') || 'empty'}) excludes it`);
      }
      registryLoaders.set(app.entry, ['sections/maison-microapp.liquid']);
    } else if (app.embed === 'section') {
      if (iframeAllowlist.has(app.id)) {
        error(`microapps/apps.json marks "${app.id}" as a section app but the maison-microapp allowlist still frames it`);
      }
    } else {
      error(`microapps/apps.json app "${app.id}" needs "embed": "iframe" | "section"`);
    }
  }

  for (const id of iframeAllowlist) {
    if (!apps.some((app) => app.id === id)) {
      error(`maison-microapp allowlist frames "${id}" but microapps/apps.json has no such app`);
    }
  }
}

/* ------------------------------------------------------------------ *
 * 7. Every generated bundle is actually loaded by Liquid
 * ------------------------------------------------------------------ */

/** @type {Map<string, Set<string>>} MaisonAssets key -> assigning files */
const assetMapKeys = new Map();
for (const file of liquidFiles) {
  for (const match of read(file).matchAll(/MaisonAssets\.(\w+)\s*=/g)) {
    if (!assetMapKeys.has(match[1])) assetMapKeys.set(match[1], new Set());
    assetMapKeys.get(match[1]).add(rel(file));
  }
}

/** @type {Map<string, Set<string>>} MaisonAssets key -> scripts/src readers */
const assetMapReaders = new Map();
for (const file of sourceFiles) {
  for (const match of read(file).matchAll(/MaisonAssets\??\.(\w+)/g)) {
    if (!assetMapReaders.has(match[1])) assetMapReaders.set(match[1], new Set());
    assetMapReaders.get(match[1]).add(rel(file));
  }
}

for (const [key, readers] of assetMapReaders) {
  if (!assetMapKeys.has(key)) {
    error(`scripts/src reads MaisonAssets.${key} (${[...readers].join(', ')}) but no Liquid file assigns it`);
  }
}
for (const [key, assigners] of assetMapKeys) {
  if (!assetMapReaders.has(key)) {
    warn(`Liquid assigns MaisonAssets.${key} (${[...assigners].join(', ')}) but nothing in scripts/src reads it`);
  }
}

/** Lazy assets are loaded through window.MaisonAssets, so allow that too. */
function loadedByLiquid(assetPath) {
  const asset = assetPath.replace(/^assets\//, '');
  const direct = assetLoaders.get(asset);
  if (direct && direct.size) return [...direct];
  const registry = registryLoaders.get(asset);
  if (registry) return registry;
  for (const [key, assigners] of assetMapKeys) {
    const referenced = liquidFiles.some((file) => {
      const text = read(file);
      return text.includes(`MaisonAssets.${key}`) && text.includes(asset);
    });
    if (referenced) return [...assigners];
  }
  return [];
}

const ownedAssets = new Set([...builtAssets].map((asset) => asset.replace(/^assets\//, '')));

for (const asset of builtAssets) {
  const loaders = loadedByLiquid(asset);
  const name = asset.replace(/^assets\//, '');
  if (!loaders.length) {
    error(`assets/${name} is built but no Liquid file loads it (dead bundle)`);
    continue;
  }
  rows.push({ asset: name, loaders: loaders.join(', ') });
}

/* ------------------------------------------------------------------ *
 * 8. Initialization handshake
 * ------------------------------------------------------------------ */

const HANDSHAKES = [
  {
    asset: 'maison-vessel.js',
    global: 'MaisonVessel',
    init: /MaisonVessel\??\.mountAll\(/,
    initFile: join(SOURCE, 'maison-runtime.js'),
  },
  {
    asset: 'maison-carousel.js',
    global: 'MaisonCarousel',
    init: /MaisonCarousel\??\.mountAll\(/,
    initFile: join(SOURCE, 'maison-runtime.js'),
  },
  {
    asset: 'maison-idle-blaze.js',
    global: 'MaisonIdleBlaze',
    init: /MaisonIdleBlaze\.init\(/,
    initFile: join(SOURCE, 'effects', 'idle-blaze-loader.js'),
  },
  {
    asset: 'maison-search-assist.js',
    global: 'MaisonSearchAssist',
    init: /addEventListener\('DOMContentLoaded', boot/,
    initFile: join(SOURCE, 'search-assist.js'),
  },
  {
    asset: 'maison-heat.js',
    global: 'MaisonHeat',
    init: /addEventListener\('DOMContentLoaded', boot/,
    initFile: join(SOURCE, 'maison-heat.ts'),
  },
];

for (const check of HANDSHAKES) {
  const bundle = join(ASSETS, check.asset);
  if (!exists(bundle)) {
    error(`initialization check: assets/${check.asset} is missing`);
    continue;
  }
  if (!read(bundle).includes(`MaisonAssets`) && !check.global) {
    // no-op, kept for clarity
  }
  if (!exists(check.initFile)) {
    error(`initialization check: ${rel(check.initFile)} is missing`);
    continue;
  }
  if (!check.init.test(read(check.initFile))) {
    error(`assets/${check.asset} exports window.${check.global} but ${rel(check.initFile)} never calls it`);
  }
}

/* ------------------------------------------------------------------ *
 * 9. One loader per asset per page (duplicate bundle execution)
 * ------------------------------------------------------------------ */

for (const [asset, files] of assetLoaders) {
  if (!/\.js$/.test(asset)) continue;
  if (!ownedAssets.has(asset)) continue;
  if (files.size < 2) continue;
  const blockLoaders = [...files].filter((file) => file.startsWith('blocks/'));
  const snippetLoaders = [...files].filter((file) => file.startsWith('snippets/'));
  if (blockLoaders.length && snippetLoaders.length) {
    warn(`${asset} is loaded from both blocks (${blockLoaders.join(', ')}) and snippets (${snippetLoaders.join(', ')}); confirm they cannot co-render`);
  }
}

/* ------------------------------------------------------------------ *
 * 10. Packaging: assets ship, sources do not
 * ------------------------------------------------------------------ */

const ignorePath = join(THEME, '.shopifyignore');
if (!exists(ignorePath)) {
  error('.shopifyignore is missing');
} else {
  const patterns = read(ignorePath)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));
  const blocksAssets = patterns.some(
    (pattern) => pattern.replace(/^\//, '').replace(/\/$/, '') === 'assets' || pattern === '*.js' || pattern === 'assets/**',
  );
  if (blocksAssets) error('.shopifyignore excludes assets/ or *.js — bundles would never reach Shopify');
  if (patterns.includes('package.json')) {
    error('.shopifyignore has a bare "package.json" pattern, which hides assets/package.json');
  }
}

const assetPackage = join(ASSETS, 'package.json');
if (!exists(assetPackage)) error('assets/package.json is missing — Horizon ESM modules need it');
else if (JSON.parse(read(assetPackage)).type !== 'module') error('assets/package.json must declare "type": "module"');

/* ------------------------------------------------------------------ *
 * Report
 * ------------------------------------------------------------------ */

const bold = (s) => `\u001b[1m${s}\u001b[0m`;
const green = (s) => `\u001b[32m${s}\u001b[0m`;
const red = (s) => `\u001b[31m${s}\u001b[0m`;
const yellow = (s) => `\u001b[33m${s}\u001b[0m`;

console.log(bold('\nMaison Tavo · JS chain verifier\n'));

console.log(bold('Packages'));
const packageNames = [...new Set([...declared, ...importedPackages.keys()])].sort();
for (const name of packageNames) {
  if (name === '@shopify/cli' || name === '@webgpu/types' || name === '@types/bun') continue;
  const importers = importedPackages.get(name);
  const status = importers ? green('imported') : yellow('unused');
  const where = importers ? [...importers].join(', ') : '—';
  console.log(`  ${status.padEnd(18)} ${name.padEnd(24)} ${where}`);
}

console.log(bold('\nBundles'));
for (const job of jobs) {
  const out = rel(job.outfile);
  const ok = exists(job.outfile);
  const loaders = ok ? loadedByLiquid(out) : [];
  const loaderText = loaders.length ? loaders.join(', ') : red('no Liquid loader');
  console.log(`  ${(ok ? green('built') : red('missing')).padEnd(18)} ${out.padEnd(28)} ${loaderText}`);
}

console.log(bold('\nHand-written / vendored'));
for (const name of [...HAND_WRITTEN, ...VENDORED]) {
  const loaders = assetLoaders.get(name);
  const referencedByModule = HAND_WRITTEN.some(
    (owner) => owner !== name && read(join(ASSETS, owner)).includes(`./${name}`),
  );
  const status = !exists(join(ASSETS, name))
    ? red('missing')
    : loaders?.size
      ? green('loaded')
      : referencedByModule
        ? green('imported')
        : yellow('orphan');
  console.log(`  ${status.padEnd(18)} ${name.padEnd(28)} ${loaders ? [...loaders].join(', ') : ''}`);
}

if (warnings.length) {
  console.log(bold(yellow(`\nWarnings (${warnings.length})`)));
  for (const message of warnings) console.log(`  ${yellow('!')} ${message}`);
}

if (errors.length) {
  console.log(bold(red(`\nErrors (${errors.length})`)));
  for (const message of errors) console.log(`  ${red('x')} ${message}`);
  console.log(red('\nJS chain broken. Fix the errors above before shipping.\n'));
  process.exit(1);
}

console.log(green(`\nJS chain intact · ${importedPackages.size} packages · ${jobs.length} bundles · ${assetLoaders.size} assets referenced\n`));

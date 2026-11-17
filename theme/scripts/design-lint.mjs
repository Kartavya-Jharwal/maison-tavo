/**
 * Maison Tavo design lint — free local gate (no SaaS).
 *
 * Checks brand/theme surfaces for regressions agents keep reintroducing:
 *   - hard-coded px font-size (prefer fluid rem tokens)
 *   - overbroad [class*="menu|nav|footer|heading|price|pill"] selectors
 *   - outline:none / outline:0 without a :focus-visible companion nearby
 *   - remote Google Fonts stylesheet links
 *   - duplicate footer section types in section groups / templates
 *   - low-contrast hard-coded text colors on soot / limewash brand grounds
 *   - missing [ Reset Session & Storage ] purge control
 *
 * Pair with: shopify theme check (bun run theme:check)
 *
 * Usage:
 *   bun theme/scripts/design-lint.mjs
 *   bun run --cwd theme design:lint
 *   bun run theme:lint   (repo root)
 *
 * Exit 1 when any error-severity finding exists. Warnings do not fail CI.
 */

import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const THEME_ROOT = join(dirnameFromMeta(import.meta.url), '..');
const REPO_REL = (abs) => relative(THEME_ROOT, abs).replaceAll('\\', '/');

function dirnameFromMeta(metaUrl) {
  return join(fileURLToPath(metaUrl), '..');
}

/** @typedef {{ severity: 'error' | 'warn'; rule: string; file: string; line?: number; message: string }} Finding */

/** @type {Finding[]} */
const findings = [];

function add(severity, rule, file, message, line) {
  findings.push({ severity, rule, file: REPO_REL(file), line, message });
}

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git') continue;
    const abs = join(dir, name);
    const st = statSync(abs);
    if (st.isDirectory()) walk(abs, out);
    else out.push(abs);
  }
  return out;
}

function lineOf(source, index) {
  return source.slice(0, index).split(/\r?\n/).length;
}

function isBrandPath(rel) {
  const base = rel.split('/').pop() || rel;
  return (
    base.startsWith('maison-') ||
    base.startsWith('mt-') ||
    base === 'fonts.liquid' ||
    base === 'theme-styles-variables.liquid' ||
    base === 'maison-motion.css' ||
    base === 'maison-sound.css' ||
    /\/scripts\/src\//.test(rel)
  );
}

/** Brand overrides live in the trailing “Maison” block of base.css */
function brandCssSlices(rel, source) {
  if (rel === 'assets/base.css') {
    // Trailing Maison brand block (comment title varies slightly across edits)
    const markerMatch = /\/\*\s*=+\s*\n\s*MAISON TAVO|\/\*\s*Maison Tavo/i.exec(source);
    if (!markerMatch) {
      // Fall back to last ~40% of file rather than linting all Horizon stock CSS
      const offset = Math.floor(source.length * 0.55);
      return [{ text: source.slice(offset), offset }];
    }
    return [{ text: source.slice(markerMatch.index), offset: markerMatch.index }];
  }
  if (rel.endsWith('.css') && isBrandPath(rel)) {
    return [{ text: source, offset: 0 }];
  }
  if (rel.endsWith('.liquid') && isBrandPath(rel)) {
    const slices = [];
    const re =
      /\{%-?\s*stylesheet\s*-?%\}([\s\S]*?)\{%-?\s*endstylesheet\s*-?%\}|<style\b[^>]*>([\s\S]*?)<\/style>/gi;
    let m;
    while ((m = re.exec(source))) {
      const body = m[1] ?? m[2] ?? '';
      const cssStart = m.index + m[0].indexOf(body);
      slices.push({ text: body, offset: cssStart });
    }
    return slices;
  }
  return [];
}

// ─── relative luminance / contrast ───────────────────────────────────────────

function parseHex(hex) {
  let h = hex.replace('#', '').trim();
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (h.length !== 6) return null;
  const n = Number.parseInt(h, 16);
  if (Number.isNaN(n)) return null;
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function channel(c) {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function luminance(rgb) {
  return 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b);
}

function contrastRatio(a, b) {
  const L1 = luminance(a);
  const L2 = luminance(b);
  const hi = Math.max(L1, L2);
  const lo = Math.min(L1, L2);
  return (hi + 0.05) / (lo + 0.05);
}

const GROUNDS = {
  soot: parseHex('#14110F'),
  limewash: parseHex('#EFE8DC'),
  bone: parseHex('#F7F2E9'),
};

// ─── rules ───────────────────────────────────────────────────────────────────

const OVERBROAD_RE =
  /\[class\*=['"][^'"]*(?:menu|nav|footer|heading|price|pill|button)[^'"]*['"]\]/gi;

const PX_FONT_RE = /font-size\s*:\s*(\d+(?:\.\d+)?)px\b/gi;

const OUTLINE_NONE_RE = /outline\s*:\s*(?:none|0)\s*;/gi;

const GOOGLE_FONTS_LINK_RE =
  /<link[^>]+href=["']https?:\/\/fonts\.googleapis\.com\/[^"']+["'][^>]*>/gi;

const FOOTER_TYPES = new Set(['footer', 'maison-footer', 'footer-utilities']);

function lintPxFonts(file, source) {
  const rel = REPO_REL(file);
  for (const slice of brandCssSlices(rel, source)) {
    let m;
    const re = new RegExp(PX_FONT_RE.source, 'gi');
    while ((m = re.exec(slice.text))) {
      const absIndex = slice.offset + m.index;
      add(
        'error',
        'no-px-font-size',
        file,
        `Hard-coded font-size: ${m[1]}px — use --font-size--fluid-* / --font-size--brand-* tokens`,
        lineOf(source, absIndex),
      );
    }
  }
}

function lintOverbroad(file, source) {
  const rel = REPO_REL(file);
  // Comments documenting the ban are fine; only flag live selectors in CSS slices / plain CSS
  const brand = brandCssSlices(rel, source);
  const targets = brand.length > 0 ? brand : rel.endsWith('.css') ? [{ text: source, offset: 0 }] : [];

  for (const slice of targets) {
    // Strip comments so documentary mentions do not fire
    const stripped = slice.text.replace(/\/\*[\s\S]*?\*\//g, (block) => ' '.repeat(block.length));
    let m;
    const re = new RegExp(OVERBROAD_RE.source, 'gi');
    while ((m = re.exec(stripped))) {
      // Horizon accordion color-scheme exclusion is intentional and scoped
      if (/color-/.test(m[0]) && /accordion/.test(stripped.slice(Math.max(0, m.index - 80), m.index + 80))) {
        continue;
      }
      add(
        'error',
        'no-overbroad-class-substring',
        file,
        `Overbroad attribute selector ${m[0]} — scope to explicit BEM / maison-* classes`,
        lineOf(source, slice.offset + m.index),
      );
    }
  }
}

function lintFocusVisible(file, source) {
  const rel = REPO_REL(file);
  for (const slice of brandCssSlices(rel, source)) {
    let m;
    const re = new RegExp(OUTLINE_NONE_RE.source, 'gi');
    while ((m = re.exec(slice.text))) {
      const windowStart = Math.max(0, m.index - 280);
      const windowEnd = Math.min(slice.text.length, m.index + 320);
      const vicinity = slice.text.slice(windowStart, windowEnd);
      // Accept companion :focus-visible rings, or :focus:not(:focus-visible) mouse-only suppressors
      if (/focus-visible/.test(vicinity)) continue;
      add(
        'error',
        'focus-visible-required',
        file,
        `outline:none without a nearby :focus-visible ring — keyboard focus must stay visible`,
        lineOf(source, slice.offset + m.index),
      );
    }
  }
}

function lintGoogleFonts(file, source) {
  let m;
  const re = new RegExp(GOOGLE_FONTS_LINK_RE.source, 'gi');
  while ((m = re.exec(source))) {
    add(
      'error',
      'no-remote-google-fonts',
      file,
      'Remote Google Fonts stylesheet — self-host WOFF2 via snippets/fonts.liquid + scripts/download-brand-fonts.mjs',
      lineOf(source, m.index),
    );
  }
}

function lintContrastHeuristics(file, source) {
  const rel = REPO_REL(file);
  for (const slice of brandCssSlices(rel, source)) {
    // color: #hex in brand CSS — compare against soot (dark bands) and limewash (light chrome)
    const colorRe = /(?:^|[;{\s])color\s*:\s*(#[0-9a-fA-F]{3,8})\b/g;
    let m;
    while ((m = colorRe.exec(slice.text))) {
      const fg = parseHex(m[1]);
      if (!fg) continue;
      // Peek backward for an explicit background in the same rule block
      const ruleStart = slice.text.lastIndexOf('{', m.index);
      const ruleEnd = slice.text.indexOf('}', m.index);
      const rule = ruleStart >= 0 && ruleEnd > ruleStart ? slice.text.slice(ruleStart, ruleEnd + 1) : '';
      const bgMatch = /background(?:-color)?\s*:\s*(#[0-9a-fA-F]{3,8})\b/i.exec(rule);
      const grounds = bgMatch?.length
        ? [{ name: bgMatch[1], rgb: parseHex(bgMatch[1]) }]
        : [
            { name: 'soot #14110F', rgb: GROUNDS.soot },
            { name: 'limewash #EFE8DC', rgb: GROUNDS.limewash },
          ];

      for (const g of grounds) {
        if (!g.rgb) continue;
        const ratio = contrastRatio(fg, g.rgb);
        // Only fail when we have an explicit same-rule background, or when BOTH brand grounds fail AA (4.5)
        if (bgMatch) {
          if (ratio < 4.5) {
            add(
              'error',
              'contrast-aa',
              file,
              `color ${m[1]} on ${g.name} ≈ ${ratio.toFixed(2)}:1 (need ≥ 4.5:1)`,
              lineOf(source, slice.offset + m.index),
            );
          }
        } else if (grounds.every((x) => x.rgb && contrastRatio(fg, x.rgb) < 4.5)) {
          add(
            'warn',
            'contrast-aa',
            file,
            `color ${m[1]} fails AA against both soot and limewash — verify against actual section ground`,
            lineOf(source, slice.offset + m.index),
          );
          break;
        }
      }
    }
  }
}

function lintDuplicateFooters() {
  const groups = [
    ...walk(join(THEME_ROOT, 'sections')).filter((f) => f.endsWith('-group.json')),
    ...walk(join(THEME_ROOT, 'templates')).filter((f) => f.endsWith('.json')),
  ];

  for (const file of groups) {
    let json;
    try {
      const raw = readFileSync(file, 'utf8').replace(/^\s*\/\*[\s\S]*?\*\/\s*/, '');
      json = JSON.parse(raw);
    } catch {
      continue;
    }

    const sections = json.sections && typeof json.sections === 'object' ? json.sections : null;
    if (!sections) continue;

    const footerHits = [];
    for (const [id, section] of Object.entries(sections)) {
      const type = section?.type;
      if (typeof type === 'string' && FOOTER_TYPES.has(type)) {
        footerHits.push({ id, type });
      }
    }

    if (footerHits.length > 1) {
      add(
        'error',
        'no-duplicate-footer',
        file,
        `Multiple footer sections: ${footerHits.map((h) => `${h.id}(${h.type})`).join(', ')} — keep a single maison-footer`,
      );
    }
  }
}

function lintResetSession() {
  const footer = join(THEME_ROOT, 'sections', 'maison-footer.liquid');
  if (!existsSync(footer)) {
    add('error', 'reset-session-link', footer, 'maison-footer.liquid missing');
    return;
  }
  const source = readFileSync(footer, 'utf8');
  if (!/Reset Session\s*(?:&amp;|&)\s*Storage/i.test(source) || !/data-mt-reset/.test(source)) {
    add(
      'error',
      'reset-session-link',
      footer,
      'Footer must expose [ Reset Session & Storage ] with data-mt-reset for jury/dev purge',
    );
  }
}

function lintSpacingTokens(file, source) {
  const rel = REPO_REL(file);
  // Soft check: brand CSS with large hard-coded padding in px (layout smell)
  for (const slice of brandCssSlices(rel, source)) {
    const re = /padding(?:-(?:block|inline|top|right|bottom|left))?\s*:\s*(\d{3,})px\b/gi;
    let m;
    while ((m = re.exec(slice.text))) {
      add(
        'warn',
        'prefer-fluid-spacing',
        file,
        `Large hard-coded padding ${m[1]}px — prefer clamp() / spacing tokens`,
        lineOf(source, slice.offset + m.index),
      );
    }
  }
}

// ─── run ─────────────────────────────────────────────────────────────────────

const scanFiles = [
  ...walk(join(THEME_ROOT, 'assets')).filter((f) => /\.(css)$/.test(f)),
  ...walk(join(THEME_ROOT, 'snippets')).filter((f) => /\.(liquid)$/.test(f)),
  ...walk(join(THEME_ROOT, 'sections')).filter((f) => /\.(liquid)$/.test(f)),
  ...walk(join(THEME_ROOT, 'blocks')).filter((f) => /\.(liquid)$/.test(f)),
  ...walk(join(THEME_ROOT, 'layout')).filter((f) => /\.(liquid)$/.test(f)),
];

for (const file of scanFiles) {
  const source = readFileSync(file, 'utf8');
  const rel = REPO_REL(file);

  lintGoogleFonts(file, source);

  if (isBrandPath(rel) || rel === 'assets/base.css' || rel.endsWith('.css')) {
    lintPxFonts(file, source);
    lintOverbroad(file, source);
    lintFocusVisible(file, source);
    lintContrastHeuristics(file, source);
    lintSpacingTokens(file, source);
  }
}

lintDuplicateFooters();
lintResetSession();

// ─── report ──────────────────────────────────────────────────────────────────

const errors = findings.filter((f) => f.severity === 'error');
const warns = findings.filter((f) => f.severity === 'warn');

function printGroup(title, list) {
  if (!list.length) return;
  console.log(`\n${title} (${list.length})`);
  for (const f of list.sort((a, b) => a.file.localeCompare(b.file) || (a.line || 0) - (b.line || 0))) {
    const loc = f.line ? `${f.file}:${f.line}` : f.file;
    console.log(`  [${f.rule}] ${loc}`);
    console.log(`    ${f.message}`);
  }
}

console.log('Maison Tavo design lint');
console.log(`Scanned ${scanFiles.length} theme files under ${REPO_REL(THEME_ROOT) || '.'}`);

printGroup('ERRORS', errors);
printGroup('WARNINGS', warns);

if (!errors.length && !warns.length) {
  console.log('\nAll clear.');
} else {
  console.log(`\n${errors.length} error(s), ${warns.length} warning(s).`);
}

process.exit(errors.length ? 1 : 0);

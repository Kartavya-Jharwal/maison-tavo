/**
 * Download Latin WOFF2 faces for Maison Tavo brand typography into theme/assets.
 * Sources: Google Fonts (Bai Jamjuree, Instrument Serif, Noto Serif) + Fontshare (Satoshi).
 */
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets');
const ua =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'User-Agent': ua } });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return res.text();
}

async function fetchBin(url) {
  const res = await fetch(url, { headers: { 'User-Agent': ua } });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

function parseFaces(css) {
  const faces = [];
  const re = /@font-face\s*\{([\s\S]*?)\}/g;
  let m;
  while ((m = re.exec(css))) {
    const block = m[1];
    const family = /font-family:\s*'([^']+)'/.exec(block)?.[1];
    const weight = /font-weight:\s*(\d+)/.exec(block)?.[1];
    const style = /font-style:\s*(\w+)/.exec(block)?.[1] || 'normal';
    let src = /src:\s*url\(([^)]+)\)/.exec(block)?.[1]?.replace(/["']/g, '');
    if (src?.startsWith('//')) src = `https:${src}`;
    const range = /unicode-range:\s*([^;]+)/.exec(block)?.[1] || '';
    if (family && weight && src) faces.push({ family, weight, style, src, range });
  }
  return faces;
}

async function downloadMapped(css, map, { latinOnly = true } = {}) {
  const seen = new Set();
  for (const face of parseFaces(css)) {
    const key = `${face.family}|${face.weight}|${face.style}`;
    const name = map[key];
    if (!name || seen.has(name)) continue;
    if (!face.src.includes('woff2')) continue;
    if (latinOnly && face.range && !face.range.includes('U+0000-00FF')) continue;
    seen.add(name);
    const bin = await fetchBin(face.src);
    writeFileSync(join(out, name), bin);
    console.log(`wrote ${name} (${bin.length} bytes)`);
  }
  for (const [key, name] of Object.entries(map)) {
    if (!seen.has(name)) console.warn(`missing ${key} → ${name}`);
  }
}

const jobs = [
  [
    'https://fonts.googleapis.com/css2?family=Bai+Jamjuree:wght@300;400;500;600&display=swap',
    {
      'Bai Jamjuree|300|normal': 'bai-jamjuree-latin-300-normal.woff2',
      'Bai Jamjuree|400|normal': 'bai-jamjuree-latin-400-normal.woff2',
      'Bai Jamjuree|500|normal': 'bai-jamjuree-latin-500-normal.woff2',
      'Bai Jamjuree|600|normal': 'bai-jamjuree-latin-600-normal.woff2',
    },
  ],
  [
    'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap',
    {
      'Instrument Serif|400|normal': 'instrument-serif-latin-400-normal.woff2',
      'Instrument Serif|400|italic': 'instrument-serif-latin-400-italic.woff2',
    },
  ],
  [
    'https://fonts.googleapis.com/css2?family=Noto+Serif:wght@100;200&display=swap',
    {
      'Noto Serif|100|normal': 'noto-serif-latin-100-normal.woff2',
      'Noto Serif|200|normal': 'noto-serif-latin-200-normal.woff2',
    },
  ],
  [
    'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap',
    {
      'JetBrains Mono|400|normal': 'jetbrains-mono-latin-400-normal.woff2',
      'JetBrains Mono|500|normal': 'jetbrains-mono-latin-500-normal.woff2',
      'JetBrains Mono|600|normal': 'jetbrains-mono-latin-600-normal.woff2',
    },
  ],
];

for (const [url, map] of jobs) {
  await downloadMapped(await fetchText(url), map);
}

await downloadMapped(
  await fetchText('https://api.fontshare.com/v2/css?f[]=satoshi@300,400,500,700&display=swap'),
  {
    'Satoshi|300|normal': 'satoshi-latin-300-normal.woff2',
    'Satoshi|400|normal': 'satoshi-latin-400-normal.woff2',
    'Satoshi|500|normal': 'satoshi-latin-500-normal.woff2',
    'Satoshi|700|normal': 'satoshi-latin-700-normal.woff2',
  },
  { latinOnly: false },
);

// Devanagari companion — not Latin-only; Regular + Bold for hero/signature copy.
await downloadMapped(
  await fetchText(
    'https://fonts.googleapis.com/css2?family=Noto+Serif+Devanagari:wght@400;700&display=swap',
  ),
  {
    'Noto Serif Devanagari|400|normal': 'noto-serif-devanagari-400-normal.woff2',
    'Noto Serif Devanagari|700|normal': 'noto-serif-devanagari-700-normal.woff2',
  },
  { latinOnly: false },
);

console.log('done');

import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const palette = readFileSync(new URL('../snippets/color-palette.liquid', import.meta.url), 'utf8');
const tokens = new Map([...palette.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((match) => [match[1], match[2].trim()]));
function resolve(name) {
  const value = tokens.get(name);
  assert.ok(value, `Missing ${name}`);
  const alias = /^var\((--[\w-]+)\)$/.exec(value);
  return alias ? resolve(alias[1]) : value;
}
function luminance(hex) {
  assert.match(hex, /^#[\da-f]{6}$/i);
  const channels = hex.slice(1).match(/../g).map((v) => parseInt(v, 16) / 255)
    .map((v) => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}
const pairs = [
  ['--color-foreground', '--color-background', 7],
  ['--color-primary-button-text', '--color-primary-button-background', 7],
  ['--color-primary-button-hover-text', '--color-primary-button-hover-background', 7],
  ['--color-secondary-button-hover-text', '--color-background', 7],
  ['--color-error', '--color-background', 7],
  ['--color-success', '--color-background', 7],
  ['--color-input-text', '--color-input-background', 7],
  ['--color-input-border', '--color-input-background', 3],
];
for (const [foreground, background, minimum] of pairs) {
  test(`${foreground} on ${background} >= ${minimum}:1`, () => {
    const values = [resolve(foreground), resolve(background)].map(luminance).sort((a, b) => b - a);
    const ratio = (values[0] + 0.05) / (values[1] + 0.05);
    assert.ok(ratio >= minimum, `${ratio.toFixed(2)}:1 falls below ${minimum}:1`);
  });
}

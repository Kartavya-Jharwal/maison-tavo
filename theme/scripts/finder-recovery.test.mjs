import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import vm from 'node:vm';

const liquid = await readFile(new URL('../sections/maison-finder.liquid', import.meta.url), 'utf8');
const script = liquid.match(/{% javascript %}([\s\S]*?){% endjavascript %}/)[1];

function element() {
  return { dataset: {}, style: {}, hidden: false, textContent: '', attributes: {}, children: [],
    classList: { toggle() {} }, setAttribute(k, v) { this.attributes[k] = v; },
    appendChild(child) { this.children.push(child); }, replaceChildren(...children) { this.children = children; },
    addEventListener(type, callback) { this[type] = callback; }, focus() { this.focused = true; },
    querySelector(selector) { return selector === '[data-finder-selected]' ? this.children[0] : null; } };
}

test('finder retains answers when revising a recommendation and clears them on restart', () => {
  const ids = Object.fromEntries(['finder-progress-text', 'finder-results-box', 'finder-questions-box', 'result-title',
    'result-desc', 'result-chips', 'result-link', 'finder-restart-btn', 'finder-back-btn', 'finder-result-back-btn'].map(id => [id, element()]));
  const choices = ['gas', 'dosa', 'steel', 'family', 'simple'].map(answer => Object.assign(element(), { dataset: { answer } }));
  const headings = choices.map(() => element());
  const cards = choices.map((button, i) => ({ classList: { toggle() {} }, querySelector: () => headings[i], querySelectorAll: () => [button] }));
  const fallback = element();
  const root = { dataset: { forgeUrl: '/collections/forge' }, querySelector: () => fallback,
    querySelectorAll(selector) { return selector === '.finder-q-card' ? cards : selector === '.finder-opt-btn' ? choices : []; } };
  const document = { readyState: 'complete', querySelector: () => root, getElementById: id => ids[id], createElement: element };
  vm.runInNewContext(script, { document });
  assert.equal(fallback.hidden, true);
  assert.equal(ids['finder-questions-box'].hidden, false);
  for (const button of choices) button.click();
  assert.equal(ids['result-title'].textContent, 'Forge tawa');
  assert.equal(choices[4].attributes['aria-pressed'], 'true');
  ids['finder-result-back-btn'].click();
  assert.equal(headings[4].focused, true);
  assert.equal(choices[4].children[0].hidden, false);
  choices[4].click();
  ids['finder-restart-btn'].click();
  assert.equal(choices[0].attributes['aria-pressed'], 'false');
  assert.equal(choices[0].children[0].hidden, true);
});

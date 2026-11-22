import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import vm from 'node:vm';

const liquid = await readFile(new URL('../sections/maison-ucp-tui.liquid', import.meta.url), 'utf8');
const script = liquid.match(/{% javascript %}([\s\S]*?){% endjavascript %}/)[1];

function node(id, active = false) {
  return { id, dataset: {}, hidden: false, attributes: {}, textContent: '', tabIndex: 0,
    classList: { active, contains() { return this.active; }, toggle(name, value) { this.active = value; } },
    setAttribute(name, value) { this.attributes[name] = value; }, getAttribute(name) { return this.attributes[name]; },
    addEventListener(name, callback) { this[name] = callback; }, focus() { this.focused = true; } };
}

test('protocol tabs enhance initially visible panels and preserve keyboard navigation', () => {
  const first = node('tab-first', true), second = node('tab-second');
  first.dataset.tuiTab = 'wellknown'; second.dataset.tuiTab = 'catalog';
  first.attributes['aria-controls'] = 'panel-first'; second.attributes['aria-controls'] = 'panel-second';
  const panels = [node('panel-first', true), node('panel-second')];
  const root = { dataset: { shopOrigin: 'https://example.test' },
    querySelectorAll: selector => selector === '[data-tui-tab]' ? [first, second] : panels };
  const elements = { 'mt-tui-root': root };
  vm.runInNewContext(script, { document: { getElementById: id => elements[id] || null }, navigator: {} });
  assert.equal(root.dataset.tuiReady, 'true');
  assert.equal(panels[0].hidden, false);
  assert.equal(panels[1].hidden, true);
  assert.equal(panels[0].attributes.role, 'tabpanel');
  assert.equal(panels[1].attributes.role, 'tabpanel');
  first.keydown({ key: 'ArrowRight', preventDefault() {} });
  assert.equal(second.focused, true);
  assert.equal(second.attributes['aria-selected'], 'true');
  assert.equal(panels[0].hidden, true);
  assert.equal(panels[1].hidden, false);
});

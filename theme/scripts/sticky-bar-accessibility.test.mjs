import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

let source = await readFile(new URL('../assets/sticky-add-to-cart.js', import.meta.url), 'utf8');
source = source.replace(/^import .*;\r?\n/gm, '')
  .replace('class StickyAddToCartComponent extends Component', 'export class StickyAddToCartComponent extends Component')
  .replaceAll('#showStickyBar', 'showStickyBarForTest')
  .replaceAll('#hideStickyBar', 'hideStickyBarForTest')
  .replace('    this.#setupIntersectionObserver();', '')
  .replace('    this.#getInitialQuantity();', '');
const dependencies = `
class Component { connectedCallback() {} disconnectedCallback() {} closest() { return null; } }
const customElements = { get: () => true, define() {}, whenDefined: () => new Promise(() => {}) };
const StandardEvents = { productSelect: 'select', cartLinesUpdate: 'cart-update', cartError: 'cart-error' };
const ThemeEvents = { quantitySelectorUpdate: 'quantity' };
`;
const { StickyAddToCartComponent } = await import(`data:text/javascript;base64,${Buffer.from(dependencies + source).toString('base64')}`);
globalThis.document = new EventTarget();
document.activeElement = null;

test('hidden sticky controls are inert, but a focused bar remains visible until focus leaves', async () => {
  const bar = new EventTarget();
  const button = {};
  bar.inert = true;
  bar.dataset = { stuck: 'false' };
  bar.contains = (element) => element === button;
  const component = new StickyAddToCartComponent();
  component.refs = { stickyBar: bar };
  component.connectedCallback();
  component.showStickyBarForTest();
  assert.equal(bar.inert, false);
  assert.equal(bar.dataset.stuck, 'true');
  document.activeElement = button;
  component.hideStickyBarForTest();
  assert.equal(bar.inert, false);
  assert.equal(bar.dataset.stuck, 'true');
  document.activeElement = null;
  bar.dispatchEvent(new Event('focusout'));
  await Promise.resolve();
  assert.equal(bar.inert, true);
  assert.equal(bar.dataset.stuck, 'false');
  component.disconnectedCallback();
});

test('showing the bar again cancels a deferred hide', async () => {
  const bar = new EventTarget();
  const button = {};
  bar.inert = true;
  bar.dataset = { stuck: 'false' };
  bar.contains = (element) => element === button;
  const component = new StickyAddToCartComponent();
  component.refs = { stickyBar: bar };
  component.connectedCallback();
  component.showStickyBarForTest();
  document.activeElement = button;
  component.hideStickyBarForTest();
  component.showStickyBarForTest();
  document.activeElement = null;
  bar.dispatchEvent(new Event('focusout'));
  await Promise.resolve();
  assert.equal(bar.inert, false);
  assert.equal(bar.dataset.stuck, 'true');
  component.disconnectedCallback();
});

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

// Load the actual component classes with minimal module dependencies. These tests
// cover state transitions without requiring Shopify inventory or a browser session.
const source = await readFile(new URL('../assets/component-quantity-selector.js', import.meta.url), 'utf8');
const componentSource = source
  .replace(/^import .*;\r?\n/gm, '')
  .replace(/if \(!customElements\.get\('quantity-selector-component'\)\) \{[\s\S]*?\}\s*$/, '');
const dependencies = `
  class Component { connectedCallback() {} disconnectedCallback() {} }
  class QuantitySelectorUpdateEvent { constructor(quantity, cartLine) { this.detail = { quantity, cartLine }; } }
  function parseIntOrDefault(value, fallback) { const result = parseInt(value, 10); return Number.isNaN(result) ? fallback : result; }
`;
const componentUrl = `data:text/javascript;base64,${Buffer.from(dependencies + componentSource).toString('base64')}`;
const { QuantitySelectorComponent } = await import(componentUrl);
const cartSource = (await readFile(new URL('../assets/component-cart-quantity-selector.js', import.meta.url), 'utf8'))
  .replace(/^import .*;\r?\n/m, `import { QuantitySelectorComponent } from '${componentUrl}';\n`)
  .replace(/if \(!customElements\.get\('cart-quantity-selector-component'\)\) \{[\s\S]*?\}\s*$/, '');
const { CartQuantitySelectorComponent } = await import(`data:text/javascript;base64,${Buffer.from(cartSource).toString('base64')}`);

function makeSelector(Selector, disabled = true, value = '1') {
  const selector = new Selector();
  const input = {
    disabled, value, min: '1', max: '', step: '1', dataset: {},
    getAttribute(name) { return name === 'data-cart-quantity' ? '0' : null; },
    removeAttribute(name) { if (name === 'max') this.max = ''; },
  };
  selector.refs = { quantityInput: input, minusButton: {}, plusButton: {} };
  selector.dispatchEvent = () => {};
  selector.connectedCallback();
  return selector;
}

test('product quantity follows availability in both directions', () => {
  const selector = makeSelector(QuantitySelectorComponent);
  assert.equal(selector.refs.minusButton.disabled, true);
  assert.equal(selector.refs.plusButton.disabled, true);
  selector.updateQuantity(1);
  assert.equal(selector.getValue(), '1');
  selector.updateConstraints('1', null, '1', false);
  assert.equal(selector.refs.quantityInput.disabled, false);
  assert.equal(selector.refs.minusButton.disabled, true);
  assert.equal(selector.refs.plusButton.disabled, false);
  selector.updateQuantity(1);
  assert.equal(selector.getValue(), '2');
  assert.equal(selector.refs.minusButton.disabled, false);
  selector.updateConstraints('1', null, '1', true);
  assert.equal(selector.refs.minusButton.disabled, true);
  assert.equal(selector.refs.plusButton.disabled, true);
});

test('cart quantity buttons respect a disabled field and its maximum', () => {
  const selector = makeSelector(CartQuantitySelectorComponent, true, '2');
  assert.equal(selector.refs.minusButton.disabled, true);
  assert.equal(selector.refs.plusButton.disabled, true);
  selector.updateConstraints('1', '3', '1', false);
  assert.equal(selector.refs.minusButton.disabled, false);
  assert.equal(selector.refs.plusButton.disabled, false);
  selector.updateQuantity(1);
  assert.equal(selector.getValue(), '3');
  assert.equal(selector.refs.plusButton.disabled, true);
});

test('a capped cart line can be reduced without being increased above its cap', () => {
  const selector = makeSelector(CartQuantitySelectorComponent, false, '3');
  selector.updateConstraints('1', '3', '1', false);
  assert.equal(selector.refs.minusButton.disabled, false);
  assert.equal(selector.refs.plusButton.disabled, true);
  selector.updateQuantity(-1);
  assert.equal(selector.getValue(), '2');
  assert.equal(selector.refs.plusButton.disabled, false);
  selector.updateQuantity(1);
  assert.equal(selector.getValue(), '3');
  assert.equal(selector.refs.plusButton.disabled, true);
});

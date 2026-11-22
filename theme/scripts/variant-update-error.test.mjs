import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

let source = await readFile(new URL('../assets/variant-picker.js', import.meta.url), 'utf8');
source = source.replace(/^import .*;\r?\n/gm, '').replace('export default class VariantPicker', 'export class VariantPicker');
source = source.slice(0, source.indexOf("if (!customElements.get('variant-picker'))"));
const dependencies = `
class Component { dispatchEvent(event) { event.promise.catch(() => {}); } }
class ResizeNotifier { observe() {} disconnect() {} }
class ProductSelectEvent {
  constructor(data) { Object.assign(this, data); }
  static createPromise() { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; }
}
`;
const { VariantPicker } = await import(`data:text/javascript;base64,${Buffer.from(dependencies + source).toString('base64')}`);
globalThis.HTMLElement = class { constructor() { this.dataset = {}; this.textContent = ''; } };
const tick = () => new Promise((resolve) => setImmediate(resolve));

function picker() {
  const element = new VariantPicker();
  const error = new HTMLElement();
  error.dataset.message = 'Choose an option again or reload.';
  element.querySelector = () => error;
  element.getAllSelectedOptions = () => [];
  element.dataset = { productId: '1' };
  return { element, error };
}

test('HTTP errors are announced and a later attempt clears the message', async () => {
  const { element, error } = picker();
  globalThis.fetch = async () => ({ ok: false, status: 503 });
  const originalError = console.error;
  console.error = () => {};
  try {
    element.fetchUpdatedSection('/product');
    await tick();
    assert.equal(error.textContent, error.dataset.message);
    globalThis.fetch = () => new Promise(() => {});
    element.fetchUpdatedSection('/product');
    assert.equal(error.textContent, '');
  } finally { console.error = originalError; }
});

test('a superseded failure does not overwrite the latest selection status', async () => {
  const { element, error } = picker();
  let rejectFirst;
  globalThis.fetch = () => new Promise((resolve, reject) => { if (!rejectFirst) rejectFirst = reject; });
  const originalError = console.error;
  console.error = () => {};
  try {
    element.fetchUpdatedSection('/first');
    element.fetchUpdatedSection('/second');
    rejectFirst(new Error('late network failure'));
    await tick();
    assert.equal(error.textContent, '');
  } finally { console.error = originalError; }
});

let formSource = await readFile(new URL('../assets/product-form.js', import.meta.url), 'utf8');
formSource = formSource.replace(/^import .*;\r?\n/gm, '')
  .replaceAll('#onProductSelect', 'onProductSelectForTest')
  .replace('class ProductFormComponent extends Component', 'export class ProductFormComponent extends Component');
const formDependencies = `class Component {}\nconst customElements = { get: () => true, define() {} };`;
const { ProductFormComponent } = await import(`data:text/javascript;base64,${Buffer.from(formDependencies + formSource).toString('base64')}`);

test('a failed selection disables purchase and clears the old variant', async () => {
  const form = new ProductFormComponent();
  let disabled = false;
  let hidden = false;
  form.dataset = { productId: '1' };
  form.refs = {
    variantId: { value: 'old-variant' },
    addToCartButtonContainer: { disable() { disabled = true; } },
    acceleratedCheckoutButtonContainer: { setAttribute() { hidden = true; } },
  };
  const target = new HTMLElement();
  target.closest = () => null;
  target.dataset.productId = '1';
  let reject;
  const promise = new Promise((resolve, fail) => { reject = fail; });
  const update = form.onProductSelectForTest({ target, promise });
  assert.equal(disabled, true);
  assert.equal(hidden, true);
  reject(new Error('network failure'));
  await update;
  assert.equal(form.refs.variantId.value, '');
});

test('an older resolved selection cannot replace a newer pending selection', async () => {
  const form = new ProductFormComponent();
  form.dataset = { productId: '1' };
  form.refs = {
    variantId: { value: 'original' },
    addToCartButtonContainer: { disable() {} },
    acceleratedCheckoutButtonContainer: { setAttribute() {} },
  };
  const target = new HTMLElement();
  target.closest = () => null;
  target.dataset.productId = '1';
  let resolveFirst;
  const first = new Promise((resolve) => { resolveFirst = resolve; });
  const firstUpdate = form.onProductSelectForTest({ target, promise: first });
  form.onProductSelectForTest({ target, promise: new Promise(() => {}) });
  resolveFirst({ detail: { html: {}, resource: { id: 'outdated' } } });
  await firstUpdate;
  assert.equal(form.refs.variantId.value, 'original');
});

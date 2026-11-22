import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

let source = await readFile(new URL('../assets/gift-card-recipient-form.js', import.meta.url), 'utf8');
source = source.replace(/^import .*;\r?\n/gm, '').replace('class GiftCardRecipientForm extends Component', 'export class GiftCardRecipientForm extends Component');
source = source.slice(0, source.indexOf('// Register the custom element'));
const dependency = `class Component { constructor() { this.children = []; } connectedCallback() {} disconnectedCallback() {} querySelector() { return this.children[0] || null; } appendChild(child) { this.children.push(child); child.remove = () => { this.children = []; }; } dispatchEvent() {} }
const StandardEvents = { cartError: 'cart-error', cartLinesUpdate: 'cart-lines-update' };`;
const { GiftCardRecipientForm } = await import(`data:text/javascript;base64,${Buffer.from(dependency + source).toString('base64')}`);
const exposedSource = source.replaceAll('#displayCartError', 'displayCartErrorForTest');
const { GiftCardRecipientForm: ErrorForm } = await import(`data:text/javascript;base64,${Buffer.from(dependency + exposedSource).toString('base64')}`);
globalThis.CustomEvent = class { constructor(type, options) { this.type = type; this.detail = options.detail; } };
globalThis.Theme = { translations: {} };
globalThis.document = new EventTarget();
document.createElement = () => ({});

globalThis.HTMLElement = class {
  constructor() { this.value = ''; this.maxLength = 200; this.dataset = {}; this.attributes = {}; }
  addEventListener() {} removeEventListener() {}
  setAttribute(k, v) { this.attributes[k] = v; }
  removeAttribute(k) { delete this.attributes[k]; }
};
function field() { return new HTMLElement(); }

test('switching delivery modes preserves the draft and does not steal focus', () => {
  const component = new GiftCardRecipientForm();
  const email = field();
  email.focus = () => { throw new Error('radio selection must not move focus'); };
  const message = field();
  message.dataset.descriptionId = 'count';
  component.refs = {
    myEmailButton: {}, recipientEmailButton: {}, recipientFields: {}, recipientEmail: email,
    recipientName: field(), recipientMessage: message, recipientSendOn: field(),
    characterCount: { getAttribute: () => '[current]/[max]', closest: () => ({ id: 'count' }) },
  };
  component.toggleRecipientForm('recipient_form');
  assert.equal(component.refs.recipientFields.hidden, false);
  assert.equal(email.attributes.required, 'required');
  email.value = 'person@example.test';
  message.value = 'A gift';
  component.toggleRecipientForm('self');
  assert.equal(email.disabled, true);
  assert.equal(email.value, 'person@example.test');
  component.toggleRecipientForm('recipient_form');
  assert.equal(email.value, 'person@example.test');
  assert.equal(message.value, 'A gift');
  assert.equal(message.attributes['aria-describedby'], 'count');
});

test('recipient validation links the actual error and retains date guidance', () => {
  const component = new ErrorForm();
  const productForm = {};
  component.closest = () => productForm;
  const date = field();
  date.dataset.descriptionId = 'date-hint';
  const error = new HTMLElement();
  error.id = 'date-error';
  const errorText = {};
  error.querySelector = () => errorText;
  error.classList = { add() {}, remove() {} };
  component.refs = {
    myEmailButton: {}, recipientEmailButton: {}, recipientFields: {}, recipientEmail: field(),
    recipientName: field(), recipientMessage: field(), recipientSendOn: date,
    sendOnError: error, liveRegion: {},
  };
  component.toggleRecipientForm('recipient_form');
  component.displayCartErrorForTest({ target: productForm, code: 'INVALID', error: 'Check details', detail: { errors: { send_on: ['Choose another date'] } } });
  assert.equal(date.attributes['aria-invalid'], 'true');
  assert.equal(date.attributes['aria-describedby'], 'date-hint date-error');
  assert.equal(errorText.textContent, 'Choose another date.');
  assert.equal(component.refs.liveRegion.textContent, 'Check details');
});

test('initialization retains recipient values and errors after a server response', () => {
  const component = new GiftCardRecipientForm();
  const email = field();
  email.value = 'person@example.test';
  email.attributes['aria-invalid'] = 'true';
  email.attributes['aria-describedby'] = 'recipient-error';
  const message = field();
  message.value = 'A gift';
  component.refs = {
    myEmailButton: {}, recipientEmailButton: { checked: true }, recipientFields: { hidden: true },
    recipientEmail: email, recipientName: field(), recipientMessage: message, recipientSendOn: field(),
    characterCount: { getAttribute: () => '[current]/[max]', closest: () => ({ id: 'count' }) },
  };
  component.connectedCallback();
  assert.equal(component.refs.recipientFields.hidden, false);
  assert.equal(email.disabled, false);
  assert.equal(email.value, 'person@example.test');
  assert.equal(message.value, 'A gift');
  assert.equal(email.attributes['aria-invalid'], 'true');
  assert.equal(email.attributes['aria-describedby'], 'recipient-error');
  component.disconnectedCallback();
});

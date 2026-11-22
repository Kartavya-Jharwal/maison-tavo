import test from 'node:test';
import assert from 'node:assert/strict';
import { showToast } from './src/maison-toasts.js';

// A small DOM stand-in checks the notification lifecycle; browser layout and
// accessibility-tree behavior still require separate integration testing.
class Element {
  constructor() { this.dataset = {}; this.children = []; this.isConnected = false; this.listeners = {}; }
  setAttribute() {}
  set innerHTML(value) { this.markup = value; this.button = new Element(); this.button.parent = this; }
  appendChild(child) { child.parent = this; child.isConnected = true; if (child.button) child.button.isConnected = true; this.children.push(child); }
  querySelector(selector) { return selector.includes('dismiss') ? this.button : null; }
  querySelectorAll() { return this.children.filter((child) => child.dataset.leaving !== 'true').map((child) => child.button); }
  contains(node) { return node === this || this.children.some((child) => child.contains(node)) || node?.parent === this; }
  addEventListener(type, callback) { this.listeners[type] = callback; }
  focus() { document.activeElement = this; }
  remove() { this.isConnected = false; this.button.isConnected = false; this.parent.children = this.parent.children.filter((child) => child !== this); }
}

globalThis.HTMLElement = Element;
const host = new Element();
host.isConnected = true;
const origin = new Element();
origin.isConnected = true;
globalThis.document = {
  activeElement: origin,
  documentElement: { dataset: { reducedMotion: 'true' } },
  querySelector: () => host,
  createElement: () => new Element(),
};
let timers = 0;
globalThis.window = { setTimeout() { timers++; }, matchMedia: () => ({ matches: true }) };

test('notifications remain until dismissed and return focus', () => {
  const notification = showToast({ message: 'Cart update failed', type: 'error' });
  assert.equal(timers, 0);
  assert.equal(notification.el.isConnected, true);
  assert.match(notification.el.markup, /<svg/);
  notification.el.button.focus();
  notification.el.button.listeners.click();
  assert.equal(notification.el.isConnected, false);
  assert.equal(document.activeElement, origin);
});

test('dismissing a focused notification moves focus to another notification', () => {
  origin.focus();
  const first = showToast({ message: 'First' });
  first.el.button.focus();
  const second = showToast({ message: 'Second' });
  first.el.button.listeners.click();
  assert.equal(document.activeElement, second.el.button);
  second.el.button.listeners.click();
  assert.equal(document.activeElement, origin);
});

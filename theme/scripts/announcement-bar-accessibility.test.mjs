import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

let source = await readFile(new URL('../assets/announcement-bar.js', import.meta.url), 'utf8');
source = source.replace(/^import .*;\r?\n/gm, '');
const dependencies = `class Component { connectedCallback() {} setAttribute() {} }\nconst customElements = { get: () => true, define() {} };`;
const { AnnouncementBar } = await import(`data:text/javascript;base64,${Buffer.from(dependencies + source).toString('base64')}`);

function slide(text) {
  return { inert: false, attributes: {}, setAttribute(name, value) { this.attributes[name] = value; },
    querySelector() { return { textContent: text }; } };
}

test('announcements change only on request, hide inactive links, and announce the selected message', () => {
  const bar = new AnnouncementBar();
  const first = slide(' First message ');
  const second = slide('Second message');
  const status = { textContent: '' };
  bar.refs = { slides: [first, second], announcementStatus: status };
  bar.connectedCallback();
  assert.equal(first.inert, false);
  assert.equal(second.inert, true);
  assert.equal(status.textContent, '');
  bar.next();
  assert.equal(first.attributes['aria-hidden'], 'true');
  assert.equal(first.inert, true);
  assert.equal(second.inert, false);
  assert.equal(status.textContent, 'Second message');
  bar.previous();
  assert.equal(status.textContent, 'First message');
  bar.previous();
  assert.equal(status.textContent, 'Second message');
});

test('an empty announcement bar does not fail when navigated', () => {
  const bar = new AnnouncementBar();
  bar.refs = {};
  bar.connectedCallback();
  assert.doesNotThrow(() => bar.next());
});

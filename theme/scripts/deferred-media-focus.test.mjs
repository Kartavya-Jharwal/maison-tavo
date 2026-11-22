import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

let source = await readFile(new URL('../assets/media.js', import.meta.url), 'utf8');
source = source.replace(/^import .*;\r?\n/gm, '').replace('class DeferredMedia extends Component', 'export class DeferredMedia extends Component');
source = source.slice(0, source.indexOf("if (!customElements.get('deferred-media'))"));
const dependencies = `
class Component { constructor() { this.attributes = {}; } getAttribute(name) { return this.attributes[name]; } setAttribute(name, value) { this.attributes[name] = value; } dispatchEvent() {} appendChild() {} contains(element) { return element === document.activeElement; } focus() { document.activeElement = this; } }
class MediaStartedPlayingEvent { constructor() {} }
`;
const { DeferredMedia } = await import(`data:text/javascript;base64,${Buffer.from(dependencies + source).toString('base64')}`);

test('opening a video moves focus away from its inert poster', () => {
  globalThis.HTMLElement = class { focus() { document.activeElement = this; } hasAttribute() { return false; } };
  globalThis.HTMLVideoElement = class extends HTMLElement { play() { return Promise.resolve(); } };
  const video = new HTMLVideoElement();
  const poster = { inert: false, classList: { add() {} }, contains: (node) => node === poster };
  globalThis.document = { activeElement: poster };
  const component = new DeferredMedia();
  component.refs = { deferredMediaPlayButton: poster };
  component.querySelector = () => ({ content: { firstElementChild: { cloneNode: () => video } } });
  component.loadContent();
  assert.equal(document.activeElement, video);
  assert.equal(video.tabIndex, -1);
  assert.equal(poster.inert, true);
});

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

let source = await readFile(new URL('../assets/slideshow.js', import.meta.url), 'utf8');
source = source.replace(/import\s+[\s\S]*?from\s+['"][^'"]+['"];\s*/g, '');
source = source.slice(0, source.indexOf("if (!customElements.get('slideshow-component'))"));
const dependency = `class Component {
  constructor() { this.attributes = new Map(); this.button = { dataset: { playLabel: 'Play', pauseLabel: 'Pause' }, setAttribute(name, value) { this[name] = value; } }; }
  connectedCallback() {} disconnectedCallback() {}
  addEventListener() {} removeEventListener() {}
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  setAttribute(name, value) { this.attributes.set(name, value); }
  removeAttribute(name) { this.attributes.delete(name); }
  hasAttribute(name) { return this.attributes.has(name); }
  querySelectorAll() { return [this.button]; }
}
const viewTransition = { current: null };`;
const { Slideshow } = await import(`data:text/javascript;base64,${Buffer.from(dependency + source).toString('base64')}`);
// Expose only the visibility internals in this test module so the real update
// logic can be exercised without a layout engine or IntersectionObserver.
const visibleSource = source.replaceAll('#updateVisibleSlides', 'updateVisibleSlidesForTest').replaceAll('#visibleSlides', '_visibleSlides');
const visibilityDependency = `${dependency}\nconst scheduler = { schedule: (callback) => callback() };`;
const { Slideshow: VisibilitySlideshow } = await import(`data:text/javascript;base64,${Buffer.from(visibilityDependency + visibleSource).toString('base64')}`);
const motionQuery = new EventTarget();
globalThis.window = { matchMedia: () => motionQuery };
globalThis.document = new EventTarget();
globalThis.IntersectionObserver = class { observe() {} unobserve() {} };

test('click-driven play uses the configured interval and one control changes its label', () => {
  const oldSetInterval = globalThis.setInterval;
  const oldClearInterval = globalThis.clearInterval;
  let delay;
  globalThis.setInterval = (_callback, milliseconds) => { delay = milliseconds; return 1; };
  globalThis.clearInterval = () => {};
  try {
    const slideshow = new Slideshow();
    slideshow.setAttribute('autoplay', '5');
    slideshow.pause();
    assert.equal(slideshow.button['aria-label'], 'Play');
    slideshow.play(new Event('click'));
    assert.equal(delay, 5000);
    assert.equal(slideshow.button['aria-label'], 'Pause');
    slideshow.toggleAutoplay();
    assert.equal(slideshow.paused, true);
    assert.equal(slideshow.button['aria-label'], 'Play');
  } finally {
    globalThis.setInterval = oldSetInterval;
    globalThis.clearInterval = oldClearInterval;
  }
});

test('enabling reduced motion pauses a running slideshow without restarting it', async () => {
  const oldSetInterval = globalThis.setInterval;
  const oldClearInterval = globalThis.clearInterval;
  let stops = 0;
  globalThis.setInterval = () => 1;
  globalThis.clearInterval = () => { stops++; };
  try {
    const slideshow = new Slideshow();
    slideshow.refs = { slides: [] };
    slideshow.setAttribute('autoplay', '5');
    await slideshow.connectedCallback();
    slideshow.play();
    const enable = new Event('maison:reduced-motion');
    enable.detail = { reduced: true };
    document.dispatchEvent(enable);
    assert.equal(slideshow.paused, true);
    assert.equal(slideshow.button['aria-label'], 'Play');
    assert.equal(stops, 1);
    const disable = new Event('maison:reduced-motion');
    disable.detail = { reduced: false };
    document.dispatchEvent(disable);
    assert.equal(slideshow.paused, true);
    slideshow.play();
    const systemChange = new Event('change');
    systemChange.matches = true;
    motionQuery.dispatchEvent(systemChange);
    assert.equal(slideshow.paused, true);
    assert.equal(stops, 2);
    slideshow.disconnectedCallback();
  } finally {
    globalThis.setInterval = oldSetInterval;
    globalThis.clearInterval = oldClearInterval;
  }
});

test('off-screen slides stay available while focused and become inert after focus leaves', () => {
  const focusedControl = {};
  const makeSlide = (focused = false) => ({
    inert: false,
    attributes: {},
    hasAttribute: () => false,
    contains: (element) => focused && element === focusedControl,
    setAttribute(name, value) { this.attributes[name] = value; },
  });
  const first = makeSlide(true);
  const second = makeSlide();
  const slideshow = new VisibilitySlideshow();
  slideshow.refs = { slides: [first, second] };
  slideshow._visibleSlides = [second];
  document.activeElement = focusedControl;
  slideshow.updateVisibleSlidesForTest();
  assert.equal(first.inert, false);
  assert.equal(first.attributes['aria-hidden'], 'false');
  document.activeElement = null;
  slideshow.updateVisibleSlidesForTest();
  assert.equal(first.inert, true);
  assert.equal(first.attributes['aria-hidden'], 'true');
  assert.equal(second.inert, false);
  assert.equal(second.attributes['aria-hidden'], 'false');
  slideshow._visibleSlides = [first, second];
  slideshow.updateVisibleSlidesForTest();
  assert.equal(first.inert, false);
  assert.equal(first.attributes['aria-hidden'], 'false');
  assert.equal(second.inert, false);
});

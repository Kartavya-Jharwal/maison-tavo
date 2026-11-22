import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const source = (await readFile(new URL('../assets/video-background.js', import.meta.url), 'utf8'))
  .replace(/^import .*;\r?\n/m, '')
  .replace(/if \(!customElements\.get\('video-background-component'\)\) \{[\s\S]*?\}\s*$/, '');
const dependency = 'class Component { constructor() { this.dataset = {}; } connectedCallback() {} disconnectedCallback() {} }\n';
const { VideoBackgroundComponent } = await import(`data:text/javascript;base64,${Buffer.from(dependency + source).toString('base64')}`);

test('background motion starts on request and can be paused', async () => {
  const button = new EventTarget();
  button.hidden = true;
  const video = new EventTarget();
  video.paused = true;
  let loads = 0;
  video.load = () => { loads++; };
  video.play = async () => { video.paused = false; video.dispatchEvent(new Event('play')); };
  video.pause = () => { video.paused = true; video.dispatchEvent(new Event('pause')); };
  const sourceElement = { dataset: { videoSource: '/clip.mp4' }, setAttribute(name, value) { this[name] = value; } };
  const component = new VideoBackgroundComponent();
  component.refs = { videoToggle: button, videoElement: video, videoSources: [sourceElement], videoStatus: {} };
  component.connectedCallback();
  assert.equal(button.hidden, false);
  assert.equal(loads, 0);
  button.dispatchEvent(new Event('click'));
  await Promise.resolve();
  assert.equal(sourceElement.src, '/clip.mp4');
  assert.equal(component.dataset.playing, 'true');
  assert.equal(button.textContent, 'Pause background video');
  button.dispatchEvent(new Event('click'));
  assert.equal(component.dataset.playing, 'false');
  assert.equal(button.textContent, 'Play background video');
  component.disconnectedCallback();
});

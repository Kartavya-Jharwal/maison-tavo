import { Component } from '@theme/component';

/**
 * A custom element that renders a video background.
 *
 * @typedef {object} Refs
 * @property {HTMLElement[]} videoSources - The video sources.
 * @property {HTMLVideoElement} videoElement - The video element.
 * @property {HTMLButtonElement} videoToggle - The playback control.
 * @property {HTMLElement} videoStatus - The playback status.
 *
 * @extends Component<Refs>
 */
export class VideoBackgroundComponent extends Component {
  requiredRefs = ['videoSources', 'videoElement', 'videoToggle', 'videoStatus'];

  connectedCallback() {
    super.connectedCallback();

    this.refs.videoToggle.addEventListener('click', this.#toggle);
    this.refs.videoElement.addEventListener('pause', this.#sync);
    this.refs.videoElement.addEventListener('play', this.#sync);
    this.refs.videoToggle.hidden = false;
  }

  disconnectedCallback() {
    this.refs.videoToggle.removeEventListener('click', this.#toggle);
    this.refs.videoElement.removeEventListener('pause', this.#sync);
    this.refs.videoElement.removeEventListener('play', this.#sync);
    super.disconnectedCallback();
  }

  #loaded = false;
  #sync = () => {
    const playing = !this.refs.videoElement.paused;
    this.dataset.playing = String(playing);
    this.refs.videoToggle.textContent = playing ? 'Pause background video' : 'Play background video';
  };

  #toggle = async () => {
    const { videoSources, videoElement, videoStatus } = this.refs;
    if (!videoElement.paused) {
      videoElement.pause();
      return;
    }

    if (!this.#loaded) {
      for (const source of videoSources) {
        const { videoSource } = source.dataset;
        if (videoSource) source.setAttribute('src', videoSource);
      }
      videoElement.load();
      this.#loaded = true;
    }
    try {
      await videoElement.play();
      videoStatus.textContent = '';
    } catch {
      videoStatus.textContent = 'Background video could not be played.';
      this.#sync();
    }
  };
}

if (!customElements.get('video-background-component')) {
  customElements.define('video-background-component', VideoBackgroundComponent);
}

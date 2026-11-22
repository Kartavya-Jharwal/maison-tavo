import { Component } from '@theme/component';

/**
 * A manually controlled announcement bar. Messages remain in place until the
 * shopper chooses another one, and hidden messages cannot receive focus.
 * @extends {Component<{slides?: HTMLElement[], announcementStatus?: HTMLElement}>}
 */
export class AnnouncementBar extends Component {
  #current = 0;

  connectedCallback() {
    super.connectedCallback();
    this.#showCurrent(false);
    this.setAttribute('data-enhanced', '');
  }

  next() {
    this.#current += 1;
    this.#showCurrent(true);
  }

  previous() {
    this.#current -= 1;
    this.#showCurrent(true);
  }

  /** @param {boolean} announce */
  #showCurrent(announce) {
    const slides = this.refs.slides ?? [];
    if (!slides.length) return;
    this.#current = ((this.#current % slides.length) + slides.length) % slides.length;
    slides.forEach((slide, index) => {
      const hidden = index !== this.#current;
      slide.setAttribute('aria-hidden', String(hidden));
      slide.inert = hidden;
    });
    if (announce && this.refs.announcementStatus) {
      this.refs.announcementStatus.textContent = slides[this.#current].querySelector('.announcement-bar__text')?.textContent?.trim() ?? '';
    }
  }
}

if (!customElements.get('announcement-bar-component')) {
  customElements.define('announcement-bar-component', AnnouncementBar);
}

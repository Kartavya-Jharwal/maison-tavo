class MaisonFoundry extends HTMLElement {
  #listeners;
  #submitting = false;

  connectedCallback() {
    this.#listeners?.abort();
    this.#listeners = new AbortController();
    const options = { signal: this.#listeners.signal };
    this.addEventListener('change', this.#updateTotal, options);
    this.addEventListener('submit', this.#addSet, options);
    this.querySelector('.maison-foundry__actions').hidden = false;
    this.#updateTotal();
  }

  disconnectedCallback() {
    this.#listeners?.abort();
  }

  #selectedVariants() {
    return [...this.querySelectorAll('[data-foundry-variant]')]
      .map((select) => select.selectedOptions[0])
      .filter((option) => option?.value);
  }

  #updateTotal = () => {
    const variants = this.#selectedVariants();
    const price = variants.reduce((sum, option) => sum + Number(option.dataset.price), 0) / 100;
    const formattedPrice = new Intl.NumberFormat(document.documentElement.lang || undefined, {
      style: 'currency',
      currency: this.dataset.currency,
    }).format(price);

    this.querySelector('[data-foundry-total]').textContent = variants.length
      ? `Set subtotal · ${formattedPrice}`
      : 'Choose at least one piece';
    this.querySelector('button[type="submit"]').disabled = !variants.length || this.#submitting;
  };

  #addSet = async (event) => {
    event.preventDefault();
    if (this.#submitting) return;

    const items = this.#selectedVariants().map((option) => ({ id: option.value, quantity: 1 }));
    if (!items.length) return;

    const gift = this.querySelector('[data-foundry-gift]');
    const message = gift.closest('details').open ? gift.value.trim() : '';
    if (message) items[0].properties = { 'Set gift message': message };

    const status = this.querySelector('[data-foundry-status]');
    const cartLink = this.querySelector('[data-foundry-cart]');
    this.#submitting = true;
    this.#updateTotal();
    status.textContent = 'Adding your set…';
    cartLink.hidden = true;

    try {
      const response = await fetch(this.dataset.addUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ items }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !Array.isArray(result?.items)) {
        status.textContent = typeof result?.description === 'string'
          ? result.description
          : 'We couldn’t confirm the set was added.';
      } else {
        window.location.assign(this.dataset.cartUrl);
        return;
      }
    } catch {
      status.textContent = 'We couldn’t reach the shop.';
    }

    status.textContent += ' Check your bag before trying again.';
    cartLink.hidden = false;
    this.#submitting = false;
    this.#updateTotal();
  };
}

if (!customElements.get('maison-foundry')) customElements.define('maison-foundry', MaisonFoundry);

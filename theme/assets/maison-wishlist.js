const storageKey = 'maison-tavo:wishlist';

function readWishlist() {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey) || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(item =>
      item && /^\d+$/.test(item.id) &&
      /^\/(?:[\w-]+\/)?products\/[\w-]+$/.test(item.url) &&
      typeof item.title === 'string'
    );
  } catch {
    return [];
  }
}

let items = readWishlist();

function selectedVariant(button) {
  return button.closest('product-form-component')?.querySelector('input[name="id"]')?.value;
}

function render() {
  for (const button of document.querySelectorAll('[data-wishlist-save]')) {
    const id = selectedVariant(button);
    const saved = items.some(item => item.id === id);
    button.hidden = !id;
    button.setAttribute('aria-pressed', String(saved));
    button.querySelector('[data-wishlist-label]').textContent = saved ? 'Remove from wishlist' : 'Save to wishlist';
  }

  for (const drawer of document.querySelectorAll('[data-wishlist]')) {
    drawer.querySelector('[data-wishlist-empty]').hidden = items.length > 0;
    const list = drawer.querySelector('[data-wishlist-items]');
    list.replaceChildren(...items.map(item => {
      const row = document.createElement('li');
      const link = document.createElement('a');
      link.href = `${item.url}?variant=${item.id}`;
      link.textContent = item.title;
      const remove = document.createElement('button');
      remove.className = 'button button-secondary';
      remove.type = 'button';
      remove.textContent = 'Remove';
      remove.setAttribute('aria-label', `Remove ${item.title} from wishlist`);
      remove.dataset.wishlistRemove = item.id;
      row.append(link, remove);
      return row;
    }));
  }
  for (const button of document.querySelectorAll('[data-wishlist-open]')) button.hidden = false;
}

function update(next) {
  items = next;
  let status = '';
  try {
    localStorage.setItem(storageKey, JSON.stringify(items));
  } catch {
    status = 'The wishlist is available until you leave this page.';
  }
  render();
  for (const element of document.querySelectorAll('[data-wishlist-status]')) element.textContent = status;
}

document.addEventListener('click', event => {
  const opener = event.target.closest('[data-wishlist-open]');
  if (opener) {
    render();
    opener.parentElement.querySelector('[data-wishlist]').showModal();
    return;
  }

  const remove = event.target.closest('[data-wishlist-remove]');
  if (remove) {
    const drawer = remove.closest('dialog');
    update(items.filter(item => item.id !== remove.dataset.wishlistRemove));
    (drawer.querySelector('[data-wishlist-remove]') || drawer.querySelector('button')).focus();
    return;
  }

  const save = event.target.closest('[data-wishlist-save]');
  const id = save && selectedVariant(save);
  if (!id) return;
  const template = save.closest('product-form-component').querySelector('[data-wishlist-variants]');
  const options = [...(template?.content.querySelectorAll('[data-wishlist-variant]') ?? [])];
  const size = options.find(option => option.dataset.wishlistVariant === id)?.textContent.trim();
  const title = size ? `${save.dataset.title} · ${size}` : save.dataset.title;
  update(items.some(item => item.id === id)
    ? items.filter(item => item.id !== id)
    : [...items, {id, title, url: save.dataset.productUrl}]);
});

const productUpdates = new MutationObserver(records => {
  const changed = records.some(record =>
    record.target.matches?.('input[name="id"]') ||
    [...record.addedNodes].some(node => node.matches?.('input[name="id"], [data-wishlist-save]') ||
      node.querySelector?.('[data-wishlist-save]'))
  );
  if (changed) render();
});
productUpdates.observe(document.body, {subtree: true, childList: true, attributes: true, attributeFilter: ['value']});
document.addEventListener('shopify:section:load', render);
window.addEventListener('storage', event => {
  if (event.key !== storageKey && event.key !== null) return;
  items = readWishlist();
  render();
});
render();

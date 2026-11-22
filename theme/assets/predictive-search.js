import { Component } from '@theme/component';
import { debounce, onAnimationEnd } from '@theme/utilities';
import { sectionRenderer } from '@theme/section-renderer';
import { morph } from '@theme/morph';
import { RecentlyViewed } from '@theme/recently-viewed-products';
import { DialogCloseEvent, DialogOpenEvent, DialogComponent } from '@theme/dialog';
import { SearchUpdateEvent } from '@shopify/events';

/**
 * A custom element that allows the user to search for resources available on the store.
 *
 * @typedef {object} Refs
 * @property {HTMLInputElement} searchInput - The search input element.
 * @property {HTMLElement} predictiveSearchResults - The predictive search results container.
 * @property {HTMLElement} resetButton - The reset button element.
 * @property {HTMLElement} searchStatus - The persistent search status region.
 * @property {HTMLElement[]} [resultsItems] - The search results items elements.
 * @property {HTMLElement} [recentlyViewedWrapper] - The recently viewed products wrapper.
 * @property {HTMLElement[]} [recentlyViewedTitle] - The recently viewed title elements.
 * @property {HTMLElement[]} [recentlyViewedItems] - The recently viewed product items.
 * @extends {Component<Refs>}
 */
class PredictiveSearchComponent extends Component {
  requiredRefs = ['searchInput', 'predictiveSearchResults', 'resetButton'];

  #controller = new AbortController();

  /**
   * @type {AbortController | null}
   */
  #activeFetch = null;

  #emptyStateLoaded = false;
  /** @type {(() => void) | null} */
  #pendingResults = null;

  /**
   * Get the dialog component.
   * @returns {DialogComponent | null} The dialog component.
   */
  get dialog() {
    return this.closest('dialog-component');
  }

  connectedCallback() {
    super.connectedCallback();

    if (this.#controller.signal.aborted) this.#controller = new AbortController();

    const { dialog } = this;
    const { signal } = this.#controller;

    if (this.refs.searchInput.value.length > 0) {
      this.#showResetButton();
    }

    if (dialog) {
      document.addEventListener('keydown', this.#handleKeyboardShortcut, { signal });
      dialog.addEventListener(DialogCloseEvent.eventName, this.#handleDialogClose, { signal });
      dialog.addEventListener(DialogOpenEvent.eventName, this.#handleDialogOpen, { signal, once: true });
      this.addEventListener('focusout', this.#handleResultsFocusOut, { signal });
    }

    if (RecentlyViewed.getProducts().length > 0) {
      requestIdleCallback(() => {
        this.#loadEmptyState();
      });
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#pendingResults = null;
    this.#activeFetch?.abort();
    this.#controller.abort();
  }

  #handleResultsFocusOut = () => {
    queueMicrotask(() => {
      if (!this.isConnected) return;
      if (!this.refs.predictiveSearchResults.contains(document.activeElement) && this.#pendingResults) {
        const render = this.#pendingResults;
        this.#pendingResults = null;
        render();
      }
    });
  };

  /**
   * Handles the CMD+K key combination.
   * @param {KeyboardEvent} event - The keyboard event.
   */
  #handleKeyboardShortcut = (event) => {
    if (event.metaKey && event.key === 'k') {
      this.dialog?.toggleDialog();
    }
  };

  /**
   * Handles the dialog close event.
   */
  #handleDialogClose = () => {
    this.#pendingResults = null;
    this.#debouncedSearch.cancel();
    this.resetSearch.cancel();
    this.#resetSearch();
  };

  #handleDialogOpen = () => {
    if (!this.#emptyStateLoaded && RecentlyViewed.getProducts().length > 0) {
      this.#loadEmptyState();
    }
  };

  #loadEmptyState() {
    if (this.#emptyStateLoaded || this.refs.searchInput.value.trim()) return;
    this.#emptyStateLoaded = true;
    this.resetSearch(false);
  }

  /**
   * Clears the recently viewed products.
   * @param {Event} event - The event.
   */
  clearRecentlyViewedProducts(event) {
    event.stopPropagation();

    RecentlyViewed.clearProducts();

    const { recentlyViewedItems, recentlyViewedTitle, recentlyViewedWrapper } = this.refs;

    const allRecentlyViewedElements = [...(recentlyViewedItems || []), ...(recentlyViewedTitle || [])];

    if (allRecentlyViewedElements.length === 0) {
      return;
    }

    if (recentlyViewedWrapper) {
      if (recentlyViewedWrapper.contains(document.activeElement)) this.refs.searchInput.focus();
      this.#setStatus(this.dataset.recentlyViewedCleared || 'Recently viewed products cleared.');
      recentlyViewedWrapper.classList.add('removing');

      onAnimationEnd(recentlyViewedWrapper, () => {
        recentlyViewedWrapper.remove();
      });
    }
  }

  /**
   * Reset the search state.
   * @param {boolean} [keepFocus=true] - Whether to keep focus on input after reset
   */
  resetSearch = debounce((keepFocus = true) => {
    if (keepFocus === false && this.refs.searchInput.value.trim()) return;
    if (keepFocus) {
      this.refs.searchInput.focus();
    }
    this.#resetSearch();
  }, 100);

  /**
   * Debounce the search handler to fetch and display search results based on the input value.
   * Reset the current selection index and close results if the search term is empty.
   */
  search = () => {
    // Invalidate the previous response immediately, before the next debounce expires.
    this.#activeFetch?.abort();
    this.#pendingResults = null;
    this.#setStatus('');
    this.#debouncedSearch();
  };

  #debouncedSearch = debounce(() => {
    const searchTerm = this.refs.searchInput.value.trim();

    if (!searchTerm.length) {
      this.#resetSearch();
      return;
    }

    this.#showResetButton();
    this.#getSearchResults(searchTerm);
  }, 200);

  /**
   * Resets scroll positions for search results containers
   */
  #resetScrollPositions() {
    requestAnimationFrame(() => {
      this.refs.predictiveSearchResults.querySelector('.predictive-search-results__inner')?.scrollTo(0, 0);
      this.querySelector('.predictive-search-form__content')?.scrollTo(0, 0);
    });
  }

  /**
   * Fetch search results using the section renderer and update the results container.
   * MaisonSearchAssist (optional) expands synonyms/typos for the Shopify query,
   * then re-ranks the morphed product cards client-side — no alternate search screen.
   * @param {string} searchTerm - The term to search for
   */
  async #getSearchResults(searchTerm) {
    if (!this.dataset.sectionId) return;

    const assist = globalThis.MaisonSearchAssist;
    const prepared =
      assist && typeof assist.preparePredictiveQuery === 'function'
        ? assist.preparePredictiveQuery(searchTerm)
        : { query: searchTerm, original: searchTerm, aliases: [] };

    const fetchTerm = prepared.query || searchTerm;
    this.dataset.maisonOriginalQuery = prepared.original || searchTerm;
    this.dataset.maisonAliases = (prepared.aliases || []).join(',');

    const url = new URL(Theme.routes.predictive_search_url, location.origin);
    url.searchParams.set('q', fetchTerm);
    url.searchParams.set('resources[limit_scope]', 'each');

    const { predictiveSearchResults } = this.refs;

    const abortController = this.#createAbortController();

    const deferredPromise = SearchUpdateEvent.createPromise();

    this.dispatchEvent(
      new SearchUpdateEvent({
        search: {
          query: searchTerm,
        },
        promise: deferredPromise.promise,
      })
    );

    sectionRenderer
      .getSectionHTML(this.dataset.sectionId, false, url)
      .then((resultsMarkup) => {
        if (!resultsMarkup) {
          deferredPromise.resolve({ totalCount: 0 });
          return;
        }

        if (abortController.signal.aborted) {
          deferredPromise.reject(new Error('Fetch aborted by user'));
          return;
        }

        if (this.refs.searchInput.value.trim() !== searchTerm) {
          deferredPromise.resolve({ totalCount: 0 });
          return;
        }

        const render = () => {
          if (abortController.signal.aborted || this.refs.searchInput.value.trim() !== searchTerm) return;
          morph(predictiveSearchResults, resultsMarkup);

          if (assist && typeof assist.afterPredictiveMorph === 'function') {
            assist.afterPredictiveMorph(
              predictiveSearchResults,
              fetchTerm,
              prepared.original || searchTerm,
              prepared.aliases || []
            );
          }

          this.#resetScrollPositions();
          const resultMessage = predictiveSearchResults.querySelector('[data-search-status]')?.textContent?.trim() || '';
          this.#setStatus(resultMessage);
        };

        // Keep a focused result stable until the shopper leaves the results region.
        if (predictiveSearchResults.contains(document.activeElement)) this.#pendingResults = render;
        else render();

        const resultCount = new DOMParser().parseFromString(resultsMarkup, 'text/html')
          .querySelectorAll('[ref="resultsItems[]"]').length;
        deferredPromise.resolve({ totalCount: resultCount });
      })
      .catch((error) => {
        deferredPromise.reject(error);
        if (abortController.signal.aborted) return;
        this.#setStatus(this.dataset.searchError || 'Search suggestions are unavailable. Press Enter to see search results.', true);
      });
  }

  /** @param {string} message @param {boolean} [visible] */
  #setStatus(message, visible = false) {
    const status = this.refs.searchStatus;
    if (!status) return;
    status.textContent = message;
    status.classList.toggle('visually-hidden', !visible);
  }

  /**
   * Fetch the markup for the recently viewed products.
   * @returns {Promise<string | null>} The markup for the recently viewed products.
   */
  async #getRecentlyViewedProductsMarkup() {
    if (!this.dataset.sectionId) return null;

    const viewedProducts = RecentlyViewed.getProducts();
    if (viewedProducts.length === 0) return null;

    const url = new URL(Theme.routes.search_url, location.origin);
    url.searchParams.set('q', viewedProducts.map(/** @param {string} id */ (id) => `id:${id}`).join(' OR '));
    url.searchParams.set('resources[type]', 'product');

    return sectionRenderer.getSectionHTML(this.dataset.sectionId, false, url);
  }

  #hideResetButton() {
    const { resetButton } = this.refs;

    resetButton.hidden = true;
  }

  #showResetButton() {
    const { resetButton } = this.refs;

    resetButton.hidden = false;
  }

  #createAbortController() {
    const abortController = new AbortController();
    if (this.#activeFetch) {
      this.#activeFetch.abort();
    }
    this.#activeFetch = abortController;
    return abortController;
  }

  #resetSearch = async () => {
    const { predictiveSearchResults, searchInput } = this.refs;
    const emptySectionId = 'predictive-search-empty';

    searchInput.value = '';
    this.#hideResetButton();
    this.#setStatus('');

    const abortController = this.#createAbortController();
    const url = new URL(window.location.href);
    url.searchParams.delete('page');

    const emptySectionMarkup = await sectionRenderer.getSectionHTML(emptySectionId, false, url);
    const parsedEmptySectionMarkup = new DOMParser()
      .parseFromString(emptySectionMarkup, 'text/html')
      .querySelector('.predictive-search-empty-section');

    if (!parsedEmptySectionMarkup) throw new Error('No empty section markup found');

    /** This needs to be awaited and not .then so the DOM is already morphed
     * when #closeResults is called and therefore the height is animated */
    const viewedProducts = RecentlyViewed.getProducts();

    if (viewedProducts.length > 0) {
      const recentlyViewedMarkup = await this.#getRecentlyViewedProductsMarkup();
      if (!recentlyViewedMarkup) return;

      const parsedRecentlyViewedMarkup = new DOMParser().parseFromString(recentlyViewedMarkup, 'text/html');
      const recentlyViewedProductsHtml = parsedRecentlyViewedMarkup.getElementById('predictive-search-products');
      if (!recentlyViewedProductsHtml) return;

      for (const child of recentlyViewedProductsHtml.children) {
        if (child instanceof HTMLElement) {
          child.setAttribute('ref', 'recentlyViewedWrapper');
        }
      }

      const collectionElement = parsedEmptySectionMarkup.querySelector('#predictive-search-products');
      if (!collectionElement) return;
      collectionElement.prepend(...recentlyViewedProductsHtml.children);
    }

    if (abortController.signal.aborted) return;

    morph(predictiveSearchResults, parsedEmptySectionMarkup);
    this.#resetScrollPositions();
  };
}

if (!customElements.get('predictive-search-component')) {
  customElements.define('predictive-search-component', PredictiveSearchComponent);
}

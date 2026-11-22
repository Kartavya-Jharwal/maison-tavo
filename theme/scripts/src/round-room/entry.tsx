import React, { Component, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { RoundRoom } from './components/Gallery3D';
import { products } from './data/catalog';
import type { Product, SeriesId } from './data/products';

type ShopProduct = {handle: string; title: string; url: string; series?: string; model?: string};
const mounted = new Map<HTMLElement, {root: Root; observer: IntersectionObserver; cleanup: () => void}>();

function shopMatch(piece: Product, catalog: ShopProduct[]) {
  const key = piece.id.replace(/^matka-/, 'chulha-');
  return catalog.find(p => p.handle === key)
    || catalog.find(p => p.handle.startsWith(`${key}-`))
    || catalog.find(p => p.model === piece.model && p.series === piece.seriesId)
    || catalog.find(p => p.handle.includes(piece.id.split('-').slice(-1)[0]) && p.handle.startsWith(piece.seriesId === 'matka' ? 'chulha' : 'forge'));
}

class StudyBoundary extends Component<{children: ReactNode; onError: () => void}, {failed: boolean}> {
  state = {failed: false};
  static getDerivedStateFromError() { return {failed: true}; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.failed ? null : this.props.children; }
}

function mount(host: HTMLElement) {
  if (mounted.has(host)) return;
  const container = host.querySelector<HTMLElement>('[data-round-room-mount]') || host;
  const fallback = host.querySelector<HTMLElement>('[data-mt-fallback]');
  let catalog: ShopProduct[] = [];
  try { catalog = JSON.parse(host.querySelector('[data-round-room-products]')?.textContent || '[]'); } catch { /* retain shop collection navigation */ }
  const series: SeriesId = host.dataset.initialSeries === 'matka' ? 'matka' : 'forge';
  const handle = host.dataset.productHandle || host.dataset.initialProduct || '';
  const shopProduct = catalog.find(p => p.handle === handle);
  const selected = products.find(p => p.id.replace(/^matka-/, 'chulha-') === handle)
    || products.find(p => p.seriesId === series && p.model === shopProduct?.model)
    || products.find(p => p.seriesId === series && shopMatch(p, catalog)?.handle === handle);
  const root = createRoot(container);
  let visible = true;
  const fail = () => { container.hidden = true; if (fallback) fallback.hidden = false; };
  const navigate = (piece: Product) => {
    const match = shopMatch(piece, catalog);
    const url = match?.url || `/collections/${piece.seriesId === 'matka' ? 'chulha' : 'forge'}`;
    window.location.assign(url);
  };
  const render = () => root.render(<StudyBoundary onError={fail}><RoundRoom initialSeries={series} initialProductId={selected?.id} onProduct={navigate} visible={visible && !document.hidden} /></StudyBoundary>);
  const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; render(); }, {rootMargin: '160px'});
  observer.observe(host);
  const visibility = () => render();
  document.addEventListener('visibilitychange', visibility);
  mounted.set(host, {root, observer, cleanup: () => document.removeEventListener('visibilitychange', visibility)});
  host.dataset.mtMounted = 'true';
  if (fallback) fallback.hidden = true;
  render();
}

function mountAll() { document.querySelectorAll<HTMLElement>('[data-maison-round-room]').forEach(mount); }
function unmountAll() { mounted.forEach(({root, observer, cleanup}, host) => { observer.disconnect(); cleanup(); root.unmount(); delete host.dataset.mtMounted; }); mounted.clear(); }
(window as any).MaisonVessel = {mountAll, unmountAll};
document.addEventListener('maison:page-leave', unmountAll);
document.addEventListener('maison:page-enter', mountAll);
document.addEventListener('shopify:section:load', mountAll);
document.addEventListener('shopify:section:unload', (event) => {
  mounted.forEach(({root, observer, cleanup}, host) => {
    if ((event.target as Element)?.contains(host)) { observer.disconnect(); cleanup(); root.unmount(); mounted.delete(host); }
  });
});
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountAll, {once: true});
else mountAll();

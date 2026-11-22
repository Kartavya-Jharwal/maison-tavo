import type { Product, Series, SeriesId } from './products';
import { forgeProducts, forgeSeries, forgeBundles, type Bundle } from './forge';
import { matkaProducts, matkaSeries } from './matka';
import { getStock } from './inventory';

/* Unified catalog facade — the storefront's single read path. */

export const series: Series[] = [forgeSeries, matkaSeries];

export const products: Product[] = [...forgeProducts, ...matkaProducts];

export const bundles: Bundle[] = forgeBundles;

/** Material lines inside a series, in display order. */
export const LINE_ORDER = ['Five-ply steel', 'Copper', 'Cast iron', 'Terracotta & Kansa', 'Accessories'] as const;
export type ProductLine = (typeof LINE_ORDER)[number];

export const lineFor = (product: Product): ProductLine =>
  product.category === 'Accessories' ? 'Accessories'
    : product.seriesId === 'matka' ? 'Terracotta & Kansa'
      : product.material === 'Copper' ? 'Copper'
        : product.material === 'Cast iron' ? 'Cast iron'
          : 'Five-ply steel';

export const getProduct = (id: string) => products.find((product) => product.id === id);

export const getSeries = (id: SeriesId) => series.find((s) => s.id === id);

export const productsInSeries = (id: SeriesId) => products.filter((product) => product.seriesId === id);

export const bundlesContaining = (productId: string) => bundles.filter((bundle) => bundle.contents.some((item) => item.productId === productId));

export const formatPrice = (value: number) =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(value);

/** Live availability: the inventory ledger is authoritative; product.stock is a display fallback. */
export const availabilityFor = (product: Product, sizeName?: string) => {
  const size = sizeName ? product.sizes.find((s) => s.name === sizeName) : product.sizes[0];
  if (!size) return product.stock;
  return product.seriesId === 'matka' ? 0 : getStock(size.sku);
};

export const totalAvailability = (product: Product) =>
  product.seriesId === 'matka' ? 0 : product.sizes.reduce((sum, size) => sum + getStock(size.sku), 0);

export const isLow = (product: Product, sizeName?: string) => {
  const available = availabilityFor(product, sizeName);
  return available > 0 && available <= 6;
};

export type { Product, Series, SeriesId, Bundle };

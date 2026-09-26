import type {ProductSpec} from './schema';

/**
 * Projection of a ProductSpec onto the Shopify product-import CSV columns.
 * Header names match `data/maison-tavo-new-listings-shopify.csv` exactly; M1
 * uses this mapping to create the real products in admin. Columns the catalog
 * does not own (inventory, images, Google Shopping, metafields) are left to
 * the import template.
 */
export interface ShopifyRow {
  Title: string;
  'URL handle': string;
  Description: string;
  Vendor: string;
  'Product category': string;
  Type: string;
  Tags: string;
  'Published on online store': 'TRUE' | 'FALSE';
  Status: 'draft' | 'active';
  SKU: string;
  Barcode: string;
  'Option1 name': string;
  'Option1 value': string;
  Price: string;
  'Compare-at price': string;
  'Charge tax': 'TRUE';
  'Inventory tracker': 'shopify';
  'Continue selling when out of stock': 'DENY';
  'Weight value (grams)': string;
  'Weight unit for display': 'g';
  'Requires shipping': 'TRUE';
  'Fulfillment service': 'manual';
  'Gift card': 'FALSE';
  'SEO title': string;
  'SEO description': string;
}

/** Project a catalog product onto one Shopify import row. */
export function toShopifyRow(spec: ProductSpec): ShopifyRow {
  return {
    Title: spec.title,
    'URL handle': spec.handle,
    Description: spec.description_html,
    Vendor: spec.vendor,
    'Product category': spec.product_category,
    Type: spec.product_type,
    Tags: spec.tags.join(', '),
    'Published on online store': spec.status === 'active' ? 'TRUE' : 'FALSE',
    Status: spec.status,
    SKU: spec.sku,
    Barcode: spec.barcode ?? '',
    'Option1 name': spec.variant_option.name,
    'Option1 value': spec.variant_option.value,
    Price: spec.price_usd.toFixed(2),
    'Compare-at price': spec.compare_at_usd?.toFixed(2) ?? '',
    'Charge tax': 'TRUE',
    'Inventory tracker': 'shopify',
    'Continue selling when out of stock': 'DENY',
    'Weight value (grams)': String(spec.weight_grams),
    'Weight unit for display': 'g',
    'Requires shipping': 'TRUE',
    'Fulfillment service': 'manual',
    'Gift card': 'FALSE',
    'SEO title': spec.seo_title ?? '',
    'SEO description': spec.seo_description ?? '',
  };
}

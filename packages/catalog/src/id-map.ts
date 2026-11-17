import {z} from 'zod';

export const ShopifyProductIdEntry = z.object({
  sku: z.string(),
  handle: z.string(),
  product_id: z.string().regex(/^gid:\/\/shopify\/Product\/\d+$/),
  variant_id: z.string().regex(/^gid:\/\/shopify\/ProductVariant\/\d+$/).nullable().default(null),
  inventory_item_id: z.string().regex(/^gid:\/\/shopify\/InventoryItem\/\d+$/).nullable().default(null),
  category_id: z.string().nullable().default(null),
});
export type ShopifyProductIdEntry = z.infer<typeof ShopifyProductIdEntry>;

export const ShopifyCollectionIdEntry = z.object({
  handle: z.string(),
  title: z.string(),
  collection_id: z.string().regex(/^gid:\/\/shopify\/Collection\/\d+$/),
});
export type ShopifyCollectionIdEntry = z.infer<typeof ShopifyCollectionIdEntry>;

export const ShopifyIdMap = z.object({
  store: z.string(),
  updated_at: z.string(),
  products_by_sku: z.record(z.string(), ShopifyProductIdEntry),
  collections_by_handle: z.record(z.string(), ShopifyCollectionIdEntry).default({}),
});
export type ShopifyIdMap = z.infer<typeof ShopifyIdMap>;

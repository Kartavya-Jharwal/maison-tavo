import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getProduct, type Product } from '../data/catalog';
import { getStock } from '../data/inventory';

export interface CartItem {
  key: string;
  productId: string;
  size: string;
  color: string;
  quantity: number;
  engraving?: string;
}

interface StoreState {
  cart: CartItem[];
  wishlist: string[];
  waitlist: string[];
  promoCode: string;
  setPromoCode: (code: string) => void;
  addItem: (product: Product, size: string, color: string, quantity?: number, engraving?: string) => void;
  removeItem: (key: string) => void;
  updateQuantity: (key: string, quantity: number) => void;
  toggleWishlist: (productId: string) => void;
  toggleWaitlist: (productId: string) => void;
  clearCart: () => void;
}

const stockFor = (product: Product, sizeName: string) => {
  const size = product.sizes.find((s) => s.name === sizeName);
  if (!size) return product.stock;
  return product.seriesId === 'matka' ? 0 : getStock(size.sku);
};

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      cart: [],
      wishlist: [],
      waitlist: [],
      promoCode: '',
      setPromoCode: (code) => set({ promoCode: code }),
      addItem: (product, size, color, quantity = 1, engraving = '') => {
        const cap = stockFor(product, size);
        if (cap <= 0) return;
        const key = [product.id, size, color, engraving].join('|');
        set((state) => {
          const existing = state.cart.find((item) => item.key === key);
          if (existing) {
            return { cart: state.cart.map((item) => item.key === key ? { ...item, quantity: Math.min(item.quantity + quantity, cap) } : item) };
          }
          return { cart: [...state.cart, { key, productId: product.id, size, color, quantity: Math.min(quantity, cap), engraving }] };
        });
      },
      removeItem: (key) => set((state) => ({ cart: state.cart.filter((item) => item.key !== key) })),
      updateQuantity: (key, quantity) => set((state) => ({
        cart: quantity <= 0
          ? state.cart.filter((item) => item.key !== key)
          : state.cart.map((item) => {
              if (item.key !== key) return item;
              const product = getProduct(item.productId);
              const cap = product ? stockFor(product, item.size) : 99;
              return { ...item, quantity: Math.min(quantity, cap) };
            }),
      })),
      toggleWishlist: (productId) => set((state) => ({
        wishlist: state.wishlist.includes(productId)
          ? state.wishlist.filter((id) => id !== productId)
          : [...state.wishlist, productId],
      })),
      toggleWaitlist: (productId) => set((state) => ({
        waitlist: state.waitlist.includes(productId)
          ? state.waitlist.filter((id) => id !== productId)
          : [...state.waitlist, productId],
      })),
      clearCart: () => set({ cart: [] }),
    }),
    {
      name: 'maison-tavo-store',
      // Drop saved lines whose product has left the catalogue (e.g. retired Atelier IDs after the Forge merge).
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<StoreState>;
        const exists = (id: string) => Boolean(getProduct(id));
        return {
          ...current,
          ...saved,
          cart: (saved.cart ?? []).filter((item) => exists(item.productId)),
          wishlist: (saved.wishlist ?? []).filter(exists),
          waitlist: (saved.waitlist ?? []).filter(exists),
        };
      },
    },
  ),
);

export const getLinePrice = (item: CartItem) => {
  const product = getProduct(item.productId);
  if (!product) return 0;
  const base = product.sizes.find((size) => size.name === item.size)?.price ?? product.price;
  return base + (item.engraving ? 35 : 0);
};

export const getCartSubtotal = (cart: CartItem[]) =>
  cart.reduce((total, item) => total + getLinePrice(item) * item.quantity, 0);

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Product, CartItem } from '../../../types';

interface CartState {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  clearCartByStore: (storeId: string) => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getTotalItemsByStore: (storeId?: string) => number;
  getTotalPriceByStore: (storeId?: string) => number;
  getTotalWeightByStore: (storeId?: string) => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product: Product) => {
        const prodWithStore = {
          ...product,
          storeId: product.storeId || 'store-1',
        };
        set((state) => {
          const existingItemIndex = state.items.findIndex(
            (item) => item.product.id === prodWithStore.id
          );
          if (existingItemIndex > -1) {
            const updatedItems = [...state.items];
            updatedItems[existingItemIndex].quantity += 1;
            return { items: updatedItems };
          }
          return { items: [...state.items, { product: prodWithStore, quantity: 1 }] };
        });
      },
      removeItem: (productId: string) => {
        set((state) => ({
          items: state.items.filter((item) => item.product.id !== productId),
        }));
      },
      updateQuantity: (productId: string, quantity: number) => {
        set((state) => {
          if (quantity <= 0) {
            return {
              items: state.items.filter((item) => item.product.id !== productId),
            };
          }
          return {
            items: state.items.map((item) =>
              item.product.id === productId ? { ...item, quantity } : item
            ),
          };
        });
      },
      clearCart: () => set({ items: [] }),
      clearCartByStore: (storeId: string) => {
        set((state) => ({
          items: state.items.filter((item) => (item.product.storeId || 'store-1') !== storeId),
        }));
      },
      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },
      getTotalPrice: () => {
        return get().items.reduce(
          (total, item) => total + item.product.price * item.quantity,
          0
        );
      },
      getTotalItemsByStore: (storeId?: string) => {
        if (!storeId || storeId === 'all') return get().getTotalItems();
        return get()
          .items.filter((item) => (item.product.storeId || 'store-1') === storeId)
          .reduce((total, item) => total + item.quantity, 0);
      },
      getTotalPriceByStore: (storeId?: string) => {
        if (!storeId || storeId === 'all') return get().getTotalPrice();
        return get()
          .items.filter((item) => (item.product.storeId || 'store-1') === storeId)
          .reduce((total, item) => total + item.product.price * item.quantity, 0);
      },
      getTotalWeightByStore: (storeId?: string) => {
        const targetId = (!storeId || storeId === 'all') ? 'store-1' : storeId;
        return get()
          .items.filter((item) => (item.product.storeId || 'store-1') === targetId)
          .reduce(
            (total, item) =>
              total + (item.product.weightInGrams || 500) * item.quantity,
            0
          );
      },
    }),
    {
      name: 'organic-ecommerce-cart',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

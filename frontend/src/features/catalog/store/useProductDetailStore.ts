import { create } from 'zustand';
import type { Product } from '../../../types';

interface ProductDetailState {
  productHistory: Product[];
  openProductDetail: (product: Product) => void;
  pushProductDetail: (product: Product) => void;
  popProductDetail: () => void;
  closeAllProductDetails: () => void;
}

export const useProductDetailStore = create<ProductDetailState>((set) => ({
  productHistory: [],
  openProductDetail: (product) => set({ productHistory: [product] }),
  pushProductDetail: (product) =>
    set((state) => ({ productHistory: [...state.productHistory, product] })),
  popProductDetail: () =>
    set((state) => ({ productHistory: state.productHistory.slice(0, -1) })),
  closeAllProductDetails: () => set({ productHistory: [] }),
}));

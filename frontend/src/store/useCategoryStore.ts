import { create } from 'zustand';
import type { Category } from '../types';
import { INITIAL_CATEGORIES } from '../data/mockData';
import { API_BASE_URL } from '../config/api';

interface CategoryState {
  selectedCategory: string;
  searchQuery: string;
  categories: Category[];
  isCategoryModalOpen: boolean;
  isCartDrawerOpen: boolean;
  isCheckoutOpen: boolean;
  skipCartAnimation: boolean;
  setSelectedCategory: (category: string) => void;
  setSearchQuery: (query: string) => void;
  openCategoryModal: () => void;
  closeCategoryModal: () => void;
  openCartDrawer: () => void;
  closeCartDrawer: () => void;
  openCheckout: () => void;
  closeCheckout: () => void;
  setSkipCartAnimation: (skip: boolean) => void;
  fetchCategories: () => Promise<void>;
}

export const useCategoryStore = create<CategoryState>((set) => ({
  selectedCategory: 'all',
  searchQuery: '',
  categories: INITIAL_CATEGORIES,
  isCategoryModalOpen: false,
  isCartDrawerOpen: false,
  isCheckoutOpen: false,
  skipCartAnimation: false,
  setSelectedCategory: (category: string) => set({ selectedCategory: category }),
  setSearchQuery: (query: string) => set({ searchQuery: query }),
  openCategoryModal: () => set({ isCategoryModalOpen: true }),
  closeCategoryModal: () => set({ isCategoryModalOpen: false }),
  openCartDrawer: () => set({ isCartDrawerOpen: true }),
  closeCartDrawer: () => set({ isCartDrawerOpen: false, skipCartAnimation: false }),
  openCheckout: () => set({ isCheckoutOpen: true, isCartDrawerOpen: false }),
  closeCheckout: () => set({ isCheckoutOpen: false }),
  setSkipCartAnimation: (skip: boolean) => set({ skipCartAnimation: skip }),

  fetchCategories: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/categories`);
      if (!res.ok) throw new Error(`HTTP status ${res.status}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        const mappedCats: Category[] = json.data.map((c: any) => ({
          id: c.slug || c.id,
          name: c.name,
          icon: c.icon,
          count: c._count?.products || 0,
        }));
        // Include "Semua" / "All"
        set({
          categories: [{ id: 'all', name: 'Semua Produk', icon: 'Sparkles' }, ...mappedCats],
        });
      }
    } catch (err) {
      console.warn('Failed to fetch categories from DB, keeping default categories:', err);
    }
  },
}));

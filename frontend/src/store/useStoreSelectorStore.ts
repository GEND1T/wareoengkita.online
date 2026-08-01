import { create } from 'zustand';

export interface RegisteredStore {
  id: string;
  name: string;
  city: string;
  address: string;
  description: string;
  phone: string;
  image: string;
  latitude: number;
  longitude: number;
  openingHours: string;
  rating: number;
}

interface StoreSelectorState {
  isStoreDrawerOpen: boolean;
  selectedStoreId: string;
  searchQuery: string;
  stores: RegisteredStore[];

  openStoreDrawer: () => void;
  closeStoreDrawer: () => void;
  setSelectedStoreId: (id: string) => void;
  setSearchQuery: (query: string) => void;
  getSelectedStore: () => RegisteredStore;
  fetchStores: (lat?: number, lon?: number) => Promise<void>;
}

export const INITIAL_REGISTERED_STORES: RegisteredStore[] = [];

export const useStoreSelectorStore = create<StoreSelectorState>((set, get) => ({
  isStoreDrawerOpen: false,
  selectedStoreId: 'store-1',
  searchQuery: '',
  stores: [],

  openStoreDrawer: () => set({ isStoreDrawerOpen: true }),
  closeStoreDrawer: () => set({ isStoreDrawerOpen: false }),
  setSelectedStoreId: (id) => set({ selectedStoreId: id, isStoreDrawerOpen: false }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  getSelectedStore: () => {
    const { stores, selectedStoreId } = get();
    return stores.find((s) => s.id === selectedStoreId) || stores[0];
  },
  fetchStores: async (lat?: number, lon?: number) => {
    try {
      let url = 'http://localhost:5050/api/stores';
      if (lat && lon) {
        url += `?lat=${lat}&lon=${lon}`;
      }
      const res = await fetch(url);
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        const mappedStores: RegisteredStore[] = json.data.map((s: any) => ({
          id: s.id,
          name: s.name,
          city: s.city,
          address: s.address,
          description: s.description || '',
          phone: s.phone || '',
          image: s.coverImage || '',
          latitude: s.latitude,
          longitude: s.longitude,
          openingHours: s.operatingHours || '',
          rating: s.rating || 0,
        }));
        set({ stores: mappedStores });
      }
    } catch (err) {
      console.error('Failed to fetch stores from DB:', err);
    }
  },
}));

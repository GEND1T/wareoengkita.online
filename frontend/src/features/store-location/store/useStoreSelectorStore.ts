import { create } from 'zustand';
import { API_BASE_URL } from '../../../config/api';
import { useServerStatusStore } from '../../../store/useServerStatusStore';

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

const getInitialStoreId = (): string => {
  try {
    const saved = localStorage.getItem('selected_store_id');
    if (saved) return saved;
  } catch (e) { }
  return 'store-1';
};

export const INITIAL_REGISTERED_STORES: RegisteredStore[] = [];

export const useStoreSelectorStore = create<StoreSelectorState>((set, get) => ({
  isStoreDrawerOpen: false,
  selectedStoreId: getInitialStoreId(),
  searchQuery: '',
  stores: [],

  openStoreDrawer: () => set({ isStoreDrawerOpen: true }),
  closeStoreDrawer: () => set({ isStoreDrawerOpen: false }),
  setSelectedStoreId: (id) => {
    try {
      localStorage.setItem('selected_store_id', id);
    } catch (e) { }
    set({ selectedStoreId: id, isStoreDrawerOpen: false });
  },
  setSearchQuery: (query) => set({ searchQuery: query }),
  getSelectedStore: () => {
    const { stores, selectedStoreId } = get();
    return stores.find((s) => s.id === selectedStoreId) || stores[0];
  },
  fetchStores: async (lat?: number, lon?: number) => {
    try {
      let url = `${API_BASE_URL}/stores`;
      if (lat && lon) {
        url += `?lat=${lat}&lon=${lon}`;
      }
      const res = await fetch(url);
      if (!res.ok) {
        useServerStatusStore.getState().setDisconnected(true, `Gagal memuat cabang toko (HTTP Status ${res.status}).`);
        return;
      }
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

        set((state) => {
          let savedId: string | null = null;
          try {
            savedId = localStorage.getItem('selected_store_id');
          } catch (e) { }

          const validStore =
            mappedStores.find((s) => s.id === savedId) ||
            mappedStores.find((s) => s.id === state.selectedStoreId) ||
            mappedStores[0];

          const activeId = validStore ? validStore.id : state.selectedStoreId;

          try {
            localStorage.setItem('selected_store_id', activeId);
          } catch (e) { }

          return {
            stores: mappedStores,
            selectedStoreId: activeId,
          };
        });
      } else {
        useServerStatusStore.getState().setDisconnected(true, 'Data toko tidak dapat dimuat dari server.');
      }
    } catch (err) {
      console.error('Failed to fetch stores from DB:', err);
      useServerStatusStore.getState().setDisconnected(true, 'Koneksi ke database server toko terputus.');
    }
  },
}));

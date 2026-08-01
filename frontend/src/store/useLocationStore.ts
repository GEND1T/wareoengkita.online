import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Address } from '../types';
import { API_BASE_URL } from '../config/api';

interface LocationState {
  addresses: Address[];
  selectedAddressId: string;
  isLocationDrawerOpen: boolean;
  viewMode: 'list' | 'add' | 'edit';
  editingAddressId: string | null;
  toastMessage: string | null;
  
  openLocationDrawer: () => void;
  closeLocationDrawer: () => void;
  setViewMode: (mode: 'list' | 'add' | 'edit') => void;
  setEditingAddress: (id: string | null) => void;
  selectAddress: (id: string) => void;
  addAddress: (newAddr: Omit<Address, 'id'>) => Promise<Address | undefined>;
  updateAddress: (id: string, updatedData: Omit<Address, 'id'>) => Promise<void>;
  deleteAddress: (id: string) => Promise<void>;
  showToast: (msg: string) => void;
  hideToast: () => void;
  getSelectedAddress: () => Address | undefined;
  fetchAddresses: (userId?: string) => Promise<void>;
}

const DEFAULT_ADDRESSES: Address[] = [];

export const useLocationStore = create<LocationState>()(
  persist(
    (set, get) => ({
      addresses: DEFAULT_ADDRESSES,
      selectedAddressId: '',
      isLocationDrawerOpen: false,
      viewMode: 'list',
      editingAddressId: null,
      toastMessage: null,

      openLocationDrawer: () =>
        set({ isLocationDrawerOpen: true, viewMode: 'list', editingAddressId: null }),
      closeLocationDrawer: () =>
        set({ isLocationDrawerOpen: false, viewMode: 'list', editingAddressId: null }),
      setViewMode: (mode) => set({ viewMode: mode }),
      setEditingAddress: (id) => set({ editingAddressId: id, viewMode: id ? 'edit' : 'list' }),

      selectAddress: (id: string) => {
        const addr = get().addresses.find((a) => a.id === id);
        if (addr) {
          set({
            selectedAddressId: id,
            isLocationDrawerOpen: false,
            toastMessage: `Alamat digunakan: ${addr.label} (${addr.city})`,
          });
        }
      },

      fetchAddresses: async (userId?: string) => {
        try {
          let url = `${API_BASE_URL}/addresses`;
          if (userId) {
            url += `?userId=${encodeURIComponent(userId)}`;
          }
          const res = await fetch(url);
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            set((state) => ({
              addresses: json.data,
              selectedAddressId:
                state.selectedAddressId && json.data.some((a: Address) => a.id === state.selectedAddressId)
                  ? state.selectedAddressId
                  : json.data.find((a: Address) => a.isDefault)?.id || json.data[0]?.id || '',
            }));
          }
        } catch (err) {
          console.error('Failed to fetch addresses from DB:', err);
        }
      },

      addAddress: async (newAddrData) => {
        try {
          const res = await fetch(`${API_BASE_URL}/addresses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newAddrData),
          });
          const json = await res.json();

          if (json.success && json.data) {
            const savedAddress: Address = json.data;
            set((state) => ({
              addresses: [savedAddress, ...state.addresses.filter((a) => a.id !== savedAddress.id)],
              selectedAddressId: savedAddress.id,
              viewMode: 'list',
              editingAddressId: null,
              toastMessage: 'Alamat baru berhasil disimpan & digunakan!',
            }));
            return savedAddress;
          }
        } catch (err) {
          console.error('Failed to save address to DB:', err);
        }
        return undefined;
      },

      updateAddress: async (id: string, updatedData) => {
        try {
          const res = await fetch(`${API_BASE_URL}/addresses/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData),
          });
          const json = await res.json();

          const updatedAddress: Address = (json.success && json.data) ? json.data : { ...updatedData, id };

          set((state) => ({
            addresses: state.addresses.map((addr) => (addr.id === id ? updatedAddress : addr)),
            viewMode: 'list',
            editingAddressId: null,
            toastMessage: 'Alamat berhasil diperbarui!',
          }));
        } catch (err) {
          console.error('Failed to update address in DB:', err);
        }
      },

      deleteAddress: async (id: string) => {
        try {
          await fetch(`${API_BASE_URL}/addresses/${id}`, {
            method: 'DELETE',
          });

          set((state) => {
            const updatedAddresses = state.addresses.filter((a) => a.id !== id);
            let newSelectedId = state.selectedAddressId;
            if (state.selectedAddressId === id) {
              newSelectedId = updatedAddresses[0]?.id || '';
            }
            return {
              addresses: updatedAddresses,
              selectedAddressId: newSelectedId,
              toastMessage: 'Alamat berhasil dihapus',
            };
          });
        } catch (err) {
          console.error('Failed to delete address in DB:', err);
        }
      },

      showToast: (msg: string) => set({ toastMessage: msg }),
      hideToast: () => set({ toastMessage: null }),

      getSelectedAddress: () => {
        const { addresses, selectedAddressId } = get();
        return addresses.find((a) => a.id === selectedAddressId) || addresses[0];
      },
    }),
    {
      name: 'organic-ecommerce-location',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { API_BASE_URL } from '../config/api';

export interface UserProfile {
  id?: string;
  fullName: string;
  username: string;
  phone: string;
  email?: string;
  role: 'customer' | 'admin_store' | 'superadmin';
  assignedStoreId?: string;
  assignedStoreName?: string;
  gender: 'Laki-laki' | 'Perempuan';
  birthDate: string;
}

export type OrderStatus =
  | 'belum_bayar'
  | 'dikemas'
  | 'dikirim'
  | 'selesai'
  | 'pengembalian'
  | 'dibatalkan';

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  unit: string;
}

export interface Order {
  id: string;
  orderNo: string;
  date: string;
  status: OrderStatus;
  items: OrderItem[];
  totalAmount: number;
  shippingCourier: string;
  paymentMethod: string;
  storeName?: string;
  createdAt?: string;
  payments?: any[];
}

interface UserState {
  profile: UserProfile;
  orders: Order[];
  isProfileDrawerOpen: boolean;
  isAuthModalOpen: boolean;
  isLoggedIn: boolean;
  activeProfileTab: 'profile' | 'orders';
  selectedOrderStatusFilter: OrderStatus | 'semua';
  skipProfileAnimation: boolean;
  
  openProfileDrawer: (initialTab?: 'profile' | 'orders') => void;
  closeProfileDrawer: () => void;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  logout: () => void;
  setActiveProfileTab: (tab: 'profile' | 'orders') => void;
  setSelectedOrderStatusFilter: (status: OrderStatus | 'semua') => void;
  setSkipProfileAnimation: (skip: boolean) => void;
  updateProfile: (updated: Partial<UserProfile>) => void;
  fetchUserOrders: (userIdentifier?: string) => Promise<void>;
}

const DEFAULT_PROFILE: UserProfile = {
  fullName: 'Pengguna',
  username: '',
  phone: '',
  role: 'customer',
  gender: 'Laki-laki',
  birthDate: '',
};

const DEFAULT_ORDERS: Order[] = [];

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      profile: DEFAULT_PROFILE,
      orders: DEFAULT_ORDERS,
      isProfileDrawerOpen: false,
      isAuthModalOpen: false,
      isLoggedIn: !!sessionStorage.getItem('user-profile-storage'),
      activeProfileTab: 'profile',
      selectedOrderStatusFilter: 'semua',
      skipProfileAnimation: false,

      openProfileDrawer: (initialTab = 'profile') =>
        set({ isProfileDrawerOpen: true, activeProfileTab: initialTab }),
      closeProfileDrawer: () => set({ isProfileDrawerOpen: false, skipProfileAnimation: false }),
      openAuthModal: () => set({ isAuthModalOpen: true }),
      closeAuthModal: () => set({ isAuthModalOpen: false }),
      logout: () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        set({ isLoggedIn: false });
      },
      setActiveProfileTab: (tab) => set({ activeProfileTab: tab }),
      setSelectedOrderStatusFilter: (status) => set({ selectedOrderStatusFilter: status }),
      setSkipProfileAnimation: (skip) => set({ skipProfileAnimation: skip }),

      updateProfile: (updated) =>
        set((state) => ({
          profile: { ...state.profile, ...updated },
          isLoggedIn: true,
        })),

      fetchUserOrders: async (userIdentifier?: string) => {
        try {
          const param = userIdentifier
            ? `?phone=${encodeURIComponent(userIdentifier)}&userId=${encodeURIComponent(userIdentifier)}`
            : '';
          const res = await fetch(`${API_BASE_URL}/orders/my-orders${param}`);
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            const mappedOrders: Order[] = json.data.map((o: any) => {
              let itemsParsed: any[] = [];
              try {
                itemsParsed = JSON.parse(o.itemsJson || '[]');
              } catch (e) {
                itemsParsed = [];
              }

              let statusMapped: OrderStatus = 'selesai';
              const st = (o.orderStatus || '').toLowerCase();
              if (st === 'new' || st === 'belum_bayar' || st === 'pending') statusMapped = 'belum_bayar';
              else if (st === 'processing' || st === 'dikemas') statusMapped = 'dikemas';
              else if (st === 'ready' || st === 'delivering' || st === 'dikirim') statusMapped = 'dikirim';
              else if (st === 'completed' || st === 'selesai') statusMapped = 'selesai';
              else if (st === 'cancelled' || st === 'dibatalkan') statusMapped = 'dibatalkan';

              return {
                id: o.id,
                orderNo: o.orderNo || `ORD-${o.id.slice(0, 5)}`,
                date: `${o.orderDate || ''}, ${o.orderTime || ''}`,
                status: statusMapped,
                shippingCourier: 'OrganikStore Instant Delivery',
                paymentMethod: o.paymentMethod || 'QRIS',
                totalAmount: o.totalPrice,
                storeName: o.store?.name,
                createdAt: o.createdAt,
                payments: o.payments || [],
                items: itemsParsed.map((item: any, idx: number) => ({
                  id: `item-${idx}`,
                  name: item.productName || item.name || 'Produk Organik',
                  price: item.price || 0,
                  quantity: item.quantity || 1,
                  unit: item.unit || '/pak',
                  image: item.image || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=400',
                })),
              };
            });

            set({ orders: mappedOrders });
          }
        } catch (err) {
          console.error('Failed to fetch user orders from DB:', err);
        }
      },
    }),
    {
      name: 'user-profile-storage',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { API_BASE_URL } from '../../../config/api';

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
  orderDate?: string;
  orderTime?: string;
  status: OrderStatus;
  rawStatus?: string;
  items: OrderItem[];
  totalAmount: number;
  shippingCourier: string;
  paymentMethod: string;
  storeName?: string;
  storeAddress?: string;
  createdAt?: string;
  payments?: any[];
  shippingAddress?: string;
  shippingType?: string;
  pickupCode?: string;
  driverName?: string;
  driverPhone?: string;
  driverPlate?: string;
  trackingNumber?: string;
  biteshipWaybillId?: string;
  biteshipTrackingUrl?: string;
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
  updateProfile: (updatedData: Partial<UserProfile>) => void;
  fetchUserOrders: (userPhoneOrId?: string) => Promise<void>;
}

const EMPTY_PROFILE: UserProfile = {
  id: '',
  fullName: '',
  username: '',
  phone: '',
  email: '',
  role: 'customer',
  gender: 'Laki-laki',
  birthDate: '',
};

const getInitialUserSession = () => {
  try {
    const token = localStorage.getItem('authToken');
    const rawUserData = localStorage.getItem('userData');
    if (token && rawUserData) {
      const user = JSON.parse(rawUserData);
      return {
        isLoggedIn: true,
        profile: {
          id: user.id || '',
          fullName: user.name || user.fullName || '',
          username: user.email ? user.email.split('@')[0] : (user.name || user.fullName || ''),
          phone: user.phone || '',
          email: user.email || '',
          role: user.role || 'customer',
          assignedStoreId: user.assignedStoreId,
          assignedStoreName: user.assignedStoreName,
          gender: user.gender || 'Laki-laki',
          birthDate: user.birthDate || '',
        },
      };
    }
  } catch (err) {
    console.error('Failed to parse user session:', err);
  }

  return {
    isLoggedIn: false,
    profile: EMPTY_PROFILE,
  };
};

const initialSession = getInitialUserSession();
const DEFAULT_ORDERS: Order[] = [];

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      profile: initialSession.profile,
      orders: DEFAULT_ORDERS,
      isProfileDrawerOpen: false,
      isAuthModalOpen: false,
      isLoggedIn: initialSession.isLoggedIn,
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
        sessionStorage.removeItem('user-profile-storage');
        set({
          isLoggedIn: false,
          profile: EMPTY_PROFILE,
          orders: [],
        });
      },
      setActiveProfileTab: (tab) => set({ activeProfileTab: tab }),
      setSelectedOrderStatusFilter: (status) => set({ selectedOrderStatusFilter: status }),
      setSkipProfileAnimation: (skip) => set({ skipProfileAnimation: skip }),

      updateProfile: (updatedData) =>
        set((state) => {
          const newProfile = { ...state.profile, ...updatedData };
          if (newProfile.phone || newProfile.fullName) {
            localStorage.setItem(
              'userData',
              JSON.stringify({
                id: newProfile.id,
                name: newProfile.fullName,
                phone: newProfile.phone,
                email: newProfile.email,
                role: newProfile.role,
                assignedStoreId: newProfile.assignedStoreId,
                assignedStoreName: newProfile.assignedStoreName,
                gender: newProfile.gender,
                birthDate: newProfile.birthDate,
              })
            );
          }
          return {
            profile: newProfile,
            isLoggedIn: true,
          };
        }),

      fetchUserOrders: async (userPhoneOrId) => {
        try {
          const profileState = (useUserStore.getState ? useUserStore.getState() : ({} as any)).profile;
          const userIdent = (userPhoneOrId || (profileState ? (profileState.id || profileState.phone) : '') || '').trim();
          if (!userIdent) {
            set({ orders: [] });
            return;
          }

          const token = localStorage.getItem('authToken');
          const headers: Record<string, string> = {};
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }

          const query = `?user=${encodeURIComponent(userIdent)}`;
          const res = await fetch(`${API_BASE_URL}/orders/my-orders${query}`, { headers });
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
                date: o.orderDate && o.orderTime ? `${o.orderDate}, ${o.orderTime}` : (o.orderDate || 'Hari ini'),
                orderDate: o.orderDate,
                orderTime: o.orderTime,
                status: statusMapped,
                rawStatus: o.orderStatus,
                shippingCourier: o.courierCompany ? o.courierCompany.toUpperCase() : (o.driverName ? 'Kurir Instant Toko' : 'OrganikStore Instant Delivery'),
                paymentMethod: o.paymentMethod || 'QRIS',
                totalAmount: o.totalPrice,
                storeName: o.store?.name,
                storeAddress: o.store?.address,
                createdAt: o.createdAt,
                payments: o.payments || [],
                shippingAddress: o.shippingAddress,
                shippingType: o.shippingType || 'instant',
                pickupCode: o.pickupCode,
                pickupLocationId: o.pickupLocationId,
                pickupLocation: o.pickupLocation,
                customerLat: o.customerLat,
                customerLon: o.customerLon,
                store: o.store,
                driverName: o.driverName,
                driverPhone: o.driverPhone,
                driverPlate: o.driverPlate,
                trackingNumber: o.biteshipWaybillId || o.trackingNumber || `TRK-${o.orderNo || o.id.slice(0, 8)}`,
                biteshipWaybillId: o.biteshipWaybillId,
                biteshipTrackingUrl: o.biteshipTrackingUrl,
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

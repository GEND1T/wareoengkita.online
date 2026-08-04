import { create } from 'zustand';
import { API_BASE_URL } from '../../../config/api';
import type {
  AdminProduct,
  AdminOrder,
  Category,
  PromoBanner,
  OrderStatus,
  StoreProfile,
  ShippingOptionAdmin,
  PaymentOptionAdmin,
  ManagedUser,
} from '../../../types';

export type AdminTab =
  | 'overview'
  | 'orders'
  | 'products'
  | 'categories'
  | 'promos'
  | 'store_profile'
  | 'shipping_options'
  | 'payment_methods'
  | 'wallet_pencairan'
  | 'users_management'
  | 'stores_management'
  | 'analytics_reports'
  | 'system_settings';

interface AdminState {
  isAdminOpen: boolean;
  activeTab: AdminTab;
  isLoadingData: boolean;
  products: AdminProduct[];
  orders: AdminOrder[];
  categories: Category[];
  promos: PromoBanner[];
  storeProfile: StoreProfile;
  shippingOptions: ShippingOptionAdmin[];
  paymentMethods: PaymentOptionAdmin[];
  users: ManagedUser[];
  toastMessage: string | null;
  unreadNewOrdersCount: number;

  openAdmin: () => void;
  closeAdmin: () => void;
  setActiveTab: (tab: AdminTab) => void;
  showToast: (msg: string) => void;
  hideToast: () => void;
  fetchInitialData: (storeId?: string) => Promise<void>;

  // Product Management
  toggleProductStatus: (id: string, storeId?: string) => void;
  updateProductStock: (id: string, newStock: number) => void;
  addProduct: (product: Omit<AdminProduct, 'id'>, storeId?: string) => void;
  updateProduct: (id: string, product: Partial<AdminProduct>) => void;
  deleteProduct: (id: string) => void;

  // Order Management
  updateOrderStatus: (orderId: string, newStatus: OrderStatus) => void;
  addNewMockOrder: () => void;

  // Category & Promo Management
  addCategory: (category: Omit<Category, 'id'>) => void;
  togglePromoStatus: (id: string) => void;
  addPromo: (promo: Omit<PromoBanner, 'id'>, storeId?: string) => void;
  updatePromo: (id: string, promo: Partial<PromoBanner>) => void;
  deletePromo: (id: string) => void;

  // Superadmin: User Management
  addUser: (user: Omit<ManagedUser, 'id'>) => void;
  updateUser: (id: string, user: Partial<ManagedUser>) => void;
  toggleUserStatus: (id: string) => void;
  deleteUser: (id: string) => void;

  // Store Profile Management
  updateStoreProfile: (data: Partial<StoreProfile>, targetStoreId?: string) => Promise<void>;

  // Shipping Options Management
  toggleShippingStatus: (id: string) => void;
  addShippingOption: (data: Omit<ShippingOptionAdmin, 'id'>, storeId?: string) => void;
  updateShippingOption: (id: string, data: Partial<ShippingOptionAdmin>) => void;
  deleteShippingOption: (id: string) => void;

  // Payment Options Management
  togglePaymentStatus: (id: string) => void;
  addPaymentOption: (data: Omit<PaymentOptionAdmin, 'id'>, storeId?: string) => void;
  updatePaymentOption: (id: string, data: Partial<PaymentOptionAdmin>) => void;
  deletePaymentOption: (id: string) => void;
}



const DEFAULT_STORE_PROFILE: StoreProfile = {
  name: 'OrganikStore Market Utama',
  description: 'Pusat belanja produk sayuran, buah, daging, dan bahan pangan organik segar berkualitas tinggi.',
  phone: '0812-3456-7890',
  address: 'Jl. Senopati No. 45, Kebayoran Baru, Jakarta Selatan',
  latitude: -6.2250,
  longitude: 106.8000,
  image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80',
  openingHours: 'Senin - Minggu (08.00 - 21.00 WIB)',
};

import { persist, createJSONStorage } from 'zustand/middleware';

export const useAdminStore = create<AdminState>()(
  persist(
    (set, _get) => ({
      isAdminOpen: false,
      activeTab: 'overview',
      isLoadingData: false,
      products: [],
      orders: [],
      categories: [],
      promos: [],
      storeProfile: DEFAULT_STORE_PROFILE,
      shippingOptions: [],
      paymentMethods: [],
      users: [],
      toastMessage: null,
      unreadNewOrdersCount: 0,

      openAdmin: () => set({ isAdminOpen: true }),
      closeAdmin: () => set({ isAdminOpen: false }),
      setActiveTab: (tab) => set({ activeTab: tab }),
      showToast: (msg) => set({ toastMessage: msg }),
      hideToast: () => set({ toastMessage: null }),

      fetchInitialData: async (storeId?: string) => {
        const currentProducts = _get().products;
        const currentOrders = _get().orders;
        const isCacheEmpty = currentProducts.length === 0 && currentOrders.length === 0;

        if (isCacheEmpty) {
          set({ isLoadingData: true });
        }

        try {
          const API_HOST = API_BASE_URL;

          // 1. Fetch Orders
          const orderQuery = storeId ? `?storeId=${storeId}` : '';
          const orderRes = await fetch(`${API_HOST}/orders/admin${orderQuery}`);
          const orderData = await orderRes.json();
          if (orderData.success && Array.isArray(orderData.data)) {
            const mappedOrders: AdminOrder[] = orderData.data.map((o: any) => {
              let itemsParsed: any[] = [];
              try {
                itemsParsed = JSON.parse(o.itemsJson || '[]');
              } catch (e) {
                itemsParsed = [];
              }
              return {
                id: o.orderNo || `#ORD-${o.id.slice(0, 5)}`,
                dbId: o.id,
                customerName: o.customerName,
                phone: o.customerPhone,
                orderTime: o.orderTime || '10:00 WIB',
                orderDate: o.orderDate || '2026-07-31',
                itemsSummary: itemsParsed.map((i: any) => i.productName || i.name).join(', ') || 'Item Organik',
                items: itemsParsed,
                totalPrice: o.totalPrice,
                status: o.orderStatus,
                shippingAddress: o.shippingAddress,
                paymentMethod: o.paymentMethod,
              };
            });
            const newCount = mappedOrders.filter((o) => o.status === 'new').length;
            set({ orders: mappedOrders, unreadNewOrdersCount: newCount });
          }

          // 2. Fetch Users
          const userRes = await fetch(`${API_HOST}/users`);
          const userData = await userRes.json();
          if (userData.success && Array.isArray(userData.data)) {
            set({ users: userData.data });
          }

          // 3. Fetch Products (includeInactive=true for Admin)
          const prodQuery = storeId ? `?includeInactive=true&storeId=${storeId}` : '?includeInactive=true';
          const prodRes = await fetch(`${API_HOST}/products${prodQuery}`);
          const prodData = await prodRes.json();
          if (prodData.success && Array.isArray(prodData.data)) {
            const mappedProds: AdminProduct[] = prodData.data.map((p: any) => ({
              ...p,
              category: typeof p.category === 'object' && p.category !== null
                ? p.category.name || p.category.slug || 'Sayur Segar'
                : (p.category || p.categorySlug || 'Sayur Segar'),
              categorySlug: p.categorySlug || (typeof p.category === 'object' ? p.category.slug : p.category),
              categoryId: p.categoryId || (typeof p.category === 'object' ? p.category.id : undefined),
              subtitle: p.subtitle || p.description || p.name,
              isActive: p.isActive !== undefined ? p.isActive : true,
              longDescription: p.description,
            }));
            set({ products: mappedProds });
          }

          // 4. Fetch Categories
          const catRes = await fetch(`${API_HOST}/categories`);
          const catData = await catRes.json();
          if (catData.success && Array.isArray(catData.data)) {
            set({ categories: catData.data });
          }

          // 5. Fetch Promos
          const promoRes = await fetch(`${API_HOST}/promos`);
          const promoData = await promoRes.json();
          if (promoData.success && Array.isArray(promoData.data)) {
            set({ promos: promoData.data });
          }

          // 6. Fetch Shipping Options
          const shipQuery = storeId ? `?storeId=${storeId}` : '';
          const shipRes = await fetch(`${API_HOST}/options/shipping${shipQuery}`);
          const shipData = await shipRes.json();
          if (shipData.success && Array.isArray(shipData.data)) {
            set({ shippingOptions: shipData.data });
          }

          // 7. Fetch Payment Options
          const payQuery = storeId ? `?storeId=${storeId}` : '';
          const payRes = await fetch(`${API_HOST}/options/payment${payQuery}`);
          const payData = await payRes.json();
          if (payData.success && Array.isArray(payData.data)) {
            set({ paymentMethods: payData.data });
          }

          // 8. Fetch Store Profile
          if (storeId) {
            const storeRes = await fetch(`${API_HOST}/stores/${storeId}`);
            const storeJson = await storeRes.json();
            if (storeJson.success && storeJson.data) {
              const s = storeJson.data;
              set({
                storeProfile: {
                  id: s.id,
                  name: s.name,
                  description: s.description || 'Pusat belanja produk sayuran, buah, dan bahan pangan organik.',
                  phone: s.phone,
                  address: s.address,
                  latitude: s.latitude,
                  longitude: s.longitude,
                  image: s.coverImage || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80',
                  openingHours: s.operatingHours,
                },
              });
            }
          }
        } catch (err) {
          console.error('Failed to fetch live admin data:', err);
        } finally {
          set({ isLoadingData: false });
        }
      },

      // Product Management
      toggleProductStatus: async (id, storeId?: string) => {
        const product = _get().products.find((p) => p.id === id);
        if (!product) return;

        const newIsActive = !product.isActive;

        // Optimistic UI update
        set((state) => ({
          products: state.products.map((p) =>
            p.id === id ? { ...p, isActive: newIsActive } : p
          ),
          toastMessage: newIsActive ? 'Status produk diaktifkan' : 'Status produk disembunyikan',
        }));

        try {
          await fetch(`${API_BASE_URL}/products/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isActive: newIsActive }),
          });

          // Refetch latest products list from backend
          const targetStoreId = storeId || product.storeId;
          if (targetStoreId) {
            _get().fetchInitialData(targetStoreId);
          }
        } catch (err) {
          console.error('Failed to toggle product status in DB:', err);
        }
      },

      updateProductStock: async (id, newStock) => {
        const validStock = Math.max(0, newStock);
        try {
          await fetch(`${API_BASE_URL}/products/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stock: validStock }),
          });
        } catch (err) {
          console.error('Failed to update stock in DB:', err);
        }

        set((state) => ({
          products: state.products.map((p) =>
            p.id === id ? { ...p, stock: validStock } : p
          ),
          toastMessage: 'Stok produk berhasil diperbarui',
        }));
      },

      addProduct: async (newProdData, storeId?: string) => {
        try {
          const targetStoreId = newProdData.storeId || storeId || 'store-1';
          const payload = {
            name: newProdData.name,
            subtitle: newProdData.subtitle || newProdData.name,
            category: newProdData.category,
            categorySlug: newProdData.categorySlug || newProdData.category,
            categoryId: newProdData.categoryId || null,
            storeId: targetStoreId,
            price: newProdData.price,
            originalPrice: newProdData.originalPrice ?? null,
            discountTag: newProdData.discountTag ?? null,
            badge: newProdData.badge ?? null,
            stock: newProdData.stock,
            unit: newProdData.unit,
            image: newProdData.image,
            imagesJson: newProdData.imagesJson ?? null,
            description: newProdData.description || newProdData.longDescription || newProdData.subtitle || newProdData.name,
            isActive: newProdData.isActive !== undefined ? newProdData.isActive : true,
            isFreshDaily: newProdData.isFreshDaily ?? false,
            isOrganicCertified: newProdData.isOrganicCertified ?? false,
            rating: newProdData.rating ?? 0,
            reviewCount: newProdData.reviewCount ?? 0,
          };

          const res = await fetch(`${API_BASE_URL}/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          const data = await res.json();
          if (data.success && data.data) {
            const addedProduct: AdminProduct = {
              ...data.data,
              subtitle: data.data.subtitle || data.data.description,
              category: data.data.categorySlug || (typeof data.data.category === 'object' ? data.data.category?.name : data.data.category) || 'Sayur Segar',
              storeId: data.data.storeId,
              isActive: data.data.isActive !== undefined ? data.data.isActive : true,
              longDescription: data.data.description,
            };
            set((state) => ({
              products: [addedProduct, ...state.products],
              toastMessage: `Produk "${data.data.name}" berhasil ditambahkan ke Supabase DB!`,
            }));
            return;
          }
        } catch (err) {
          console.error('Failed to add product to DB:', err);
        }

        const fallbackProd: AdminProduct = {
          ...newProdData,
          id: `prod-${Date.now()}`,
          subtitle: newProdData.subtitle || newProdData.name,
          rating: 0,
          reviewCount: 0,
          isFreshDaily: false,
          isOrganicCertified: false,
          isActive: true,
        };
        set((state) => ({
          products: [fallbackProd, ...state.products],
          toastMessage: 'Produk baru berhasil ditambahkan!',
        }));
      },

      updateProduct: async (id, updatedData) => {
        try {
          const payload: any = { ...updatedData };
          if (updatedData.subtitle !== undefined) payload.subtitle = updatedData.subtitle;
          if (updatedData.categorySlug !== undefined) payload.categorySlug = updatedData.categorySlug;
          if (updatedData.categoryId !== undefined) payload.categoryId = updatedData.categoryId;
          if (updatedData.longDescription !== undefined) payload.description = updatedData.longDescription;
          if (updatedData.storeId !== undefined) payload.storeId = updatedData.storeId;
          if (updatedData.originalPrice !== undefined) payload.originalPrice = updatedData.originalPrice;
          if (updatedData.discountTag !== undefined) payload.discountTag = updatedData.discountTag;
          if (updatedData.badge !== undefined) payload.badge = updatedData.badge;
          if (updatedData.imagesJson !== undefined) payload.imagesJson = updatedData.imagesJson;
          if (updatedData.isActive !== undefined) payload.isActive = updatedData.isActive;

          await fetch(`${API_BASE_URL}/products/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
        } catch (err) {
          console.error('Failed to update product in DB:', err);
        }

        set((state) => ({
          products: state.products.map((p) =>
            p.id === id ? { ...p, ...updatedData } : p
          ),
          toastMessage: 'Data produk berhasil diperbarui!',
        }));
      },

      deleteProduct: async (id) => {
        try {
          await fetch(`${API_BASE_URL}/products/${id}`, {
            method: 'DELETE',
          });
        } catch (err) {
          console.error('Failed to delete product in DB:', err);
        }

        set((state) => ({
          products: state.products.filter((p) => p.id !== id),
          toastMessage: 'Produk berhasil dihapus',
        }));
      },

      // Order Management
      updateOrderStatus: async (orderId, newStatus) => {
        try {
          const order = _get().orders.find((o) => o.id === orderId || o.dbId === orderId);
          const targetId = order?.dbId || orderId;

          await fetch(`${API_BASE_URL}/orders/admin/${targetId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus }),
          });
        } catch (err) {
          console.error('Failed to update order status in DB:', err);
        }

        set((state) => {
          const updatedOrders = state.orders.map((ord) =>
            ord.id === orderId || ord.dbId === orderId ? { ...ord, status: newStatus } : ord
          );
          const newCount = updatedOrders.filter((o) => o.status === 'new').length;
          return {
            orders: updatedOrders,
            unreadNewOrdersCount: newCount,
            toastMessage: `Status pesanan ${orderId} diubah!`,
          };
        });
      },

      addNewMockOrder: () => {
        const idNum = Math.floor(105 + Math.random() * 100);
        const newOrder: AdminOrder = {
          id: `#ORD-${idNum}`,
          customerName: 'Pelanggan Baru',
          phone: '081299998888',
          orderTime: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
          orderDate: new Date().toISOString().split('T')[0],
          itemsSummary: 'Produk Organik Segar',
          items: [],
          totalPrice: 35000,
          status: 'new',
          shippingAddress: 'Jl. Senopati No. 10, Jakarta Selatan',
          paymentMethod: 'QRIS',
        };

        set((state) => ({
          orders: [newOrder, ...state.orders],
          unreadNewOrdersCount: state.unreadNewOrdersCount + 1,
          toastMessage: `🔔 Pesanan Baru Masuk! ${newOrder.id} - ${newOrder.customerName}`,
        }));
      },

      // Categories & Promos
      addCategory: (catData) =>
        set((state) => ({
          categories: [...state.categories, { ...catData, id: `cat-${Date.now()}` }],
          toastMessage: 'Kategori baru berhasil ditambahkan!',
        })),

      togglePromoStatus: async (id) => {
        const item = _get().promos.find((p) => p.id === id);
        if (item) {
          try {
            await fetch(`${API_BASE_URL}/promos/${id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ isActive: !item.isActive }),
            });
          } catch (err) {
            console.error('Failed to toggle promo status:', err);
          }
        }
        set((state) => ({
          promos: state.promos.map((p) => (p.id === id ? { ...p, isActive: !p.isActive } : p)),
          toastMessage: 'Status promo diperbarui',
        }));
      },

      addPromo: async (promoData, storeId?: string) => {
        try {
          const res = await fetch(`${API_BASE_URL}/promos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: promoData.title,
              subtitle: promoData.subtitle,
              imageUrl: promoData.image,
              badgeText: promoData.discountTag,
              storeId: storeId || promoData.targetStoreId,
            }),
          });
          const json = await res.json();
          if (json.success && json.data) {
            set((state) => ({
              promos: [json.data, ...state.promos],
              toastMessage: 'Banner promo baru berhasil ditambahkan ke Supabase!',
            }));
            return;
          }
        } catch (err) {
          console.error('Failed to add promo to DB:', err);
        }
        set((state) => ({
          promos: [{ ...promoData, id: `promo-${Date.now()}` }, ...state.promos],
          toastMessage: 'Banner promo baru berhasil ditambahkan!',
        }));
      },

      updatePromo: async (id, updatedData) => {
        try {
          await fetch(`${API_BASE_URL}/promos/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: updatedData.title,
              subtitle: updatedData.subtitle,
              imageUrl: updatedData.image,
              badgeText: updatedData.discountTag,
            }),
          });
        } catch (err) {
          console.error('Failed to update promo in DB:', err);
        }
        set((state) => ({
          promos: state.promos.map((p) => (p.id === id ? { ...p, ...updatedData } : p)),
          toastMessage: 'Banner promo berhasil diperbarui!',
        }));
      },

      deletePromo: async (id) => {
        try {
          await fetch(`${API_BASE_URL}/promos/${id}`, {
            method: 'DELETE',
          });
        } catch (err) {
          console.error('Failed to delete promo in DB:', err);
        }
        set((state) => ({
          promos: state.promos.filter((p) => p.id !== id),
          toastMessage: 'Banner promo berhasil dihapus',
        }));
      },

      // Store Profile Management
      updateStoreProfile: async (data, targetStoreId?: string) => {
        const currentProfile = _get().storeProfile;
        const storeIdToUpdate = targetStoreId || currentProfile.id || 'store-1';

        try {
          const payload = {
            name: data.name,
            address: data.address,
            latitude: data.latitude,
            longitude: data.longitude,
            phone: data.phone,
            operatingHours: data.openingHours,
            coverImage: data.image,
          };

          const token = localStorage.getItem('authToken');
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
          };
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }

          await fetch(`${API_BASE_URL}/stores/${storeIdToUpdate}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(payload),
          });
        } catch (err) {
          console.error('Failed to update store profile in DB:', err);
        }

        set((state) => ({
          storeProfile: { ...state.storeProfile, ...data, id: storeIdToUpdate },
          toastMessage: 'Profil Toko & Lokasi berhasil diperbarui!',
        }));
      },

      // Shipping Options Management
      toggleShippingStatus: async (id) => {
        const item = _get().shippingOptions.find((s) => s.id === id);
        if (item) {
          try {
            await fetch(`${API_BASE_URL}/options/shipping/${id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ isActive: !item.isActive }),
            });
          } catch (err) {
            console.error('Failed to toggle shipping status:', err);
          }
        }
        set((state) => ({
          shippingOptions: state.shippingOptions.map((s) =>
            s.id === id ? { ...s, isActive: !s.isActive } : s
          ),
          toastMessage: 'Status opsi pengiriman diperbarui',
        }));
      },

      addShippingOption: async (data, storeId?: string) => {
        try {
          const res = await fetch(`${API_BASE_URL}/options/shipping`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...data, storeId }),
          });
          const json = await res.json();
          if (json.success && json.data) {
            set((state) => ({
              shippingOptions: [...state.shippingOptions, json.data],
              toastMessage: 'Opsi pengiriman baru ditambahkan ke Supabase!',
            }));
            return;
          }
        } catch (err) {
          console.error('Failed to add shipping option:', err);
        }
        set((state) => ({
          shippingOptions: [...state.shippingOptions, { ...data, id: `ship-${Date.now()}` }],
          toastMessage: 'Opsi pengiriman baru ditambahkan!',
        }));
      },

      updateShippingOption: async (id, data) => {
        try {
          await fetch(`${API_BASE_URL}/options/shipping/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
        } catch (err) {
          console.error('Failed to update shipping option:', err);
        }
        set((state) => ({
          shippingOptions: state.shippingOptions.map((s) =>
            s.id === id ? { ...s, ...data } : s
          ),
          toastMessage: 'Opsi pengiriman berhasil diperbarui!',
        }));
      },

      deleteShippingOption: async (id) => {
        try {
          await fetch(`${API_BASE_URL}/options/shipping/${id}`, {
            method: 'DELETE',
          });
        } catch (err) {
          console.error('Failed to delete shipping option:', err);
        }
        set((state) => ({
          shippingOptions: state.shippingOptions.filter((s) => s.id !== id),
          toastMessage: 'Opsi pengiriman dihapus',
        }));
      },

      // Payment Options Management
      togglePaymentStatus: async (id) => {
        const item = _get().paymentMethods.find((p) => p.id === id);
        if (item) {
          try {
            await fetch(`${API_BASE_URL}/options/payment/${id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ isActive: !item.isActive }),
            });
          } catch (err) {
            console.error('Failed to toggle payment status:', err);
          }
        }
        set((state) => ({
          paymentMethods: state.paymentMethods.map((p) =>
            p.id === id ? { ...p, isActive: !p.isActive } : p
          ),
          toastMessage: 'Status metode pembayaran diperbarui',
        }));
      },

      addPaymentOption: async (data, storeId?: string) => {
        try {
          const res = await fetch(`${API_BASE_URL}/options/payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...data, storeId }),
          });
          const json = await res.json();
          if (json.success && json.data) {
            set((state) => ({
              paymentMethods: [...state.paymentMethods, json.data],
              toastMessage: 'Metode pembayaran baru ditambahkan ke Supabase!',
            }));
            return;
          }
        } catch (err) {
          console.error('Failed to add payment option:', err);
        }
        set((state) => ({
          paymentMethods: [...state.paymentMethods, { ...data, id: `pay-${Date.now()}` }],
          toastMessage: 'Metode pembayaran baru ditambahkan!',
        }));
      },

      updatePaymentOption: async (id, data) => {
        try {
          await fetch(`${API_BASE_URL}/options/payment/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
        } catch (err) {
          console.error('Failed to update payment option:', err);
        }
        set((state) => ({
          paymentMethods: state.paymentMethods.map((p) =>
            p.id === id ? { ...p, ...data } : p
          ),
          toastMessage: 'Metode pembayaran berhasil diperbarui!',
        }));
      },

      deletePaymentOption: async (id) => {
        try {
          await fetch(`${API_BASE_URL}/options/payment/${id}`, {
            method: 'DELETE',
          });
        } catch (err) {
          console.error('Failed to delete payment option:', err);
        }
        set((state) => ({
          paymentMethods: state.paymentMethods.filter((p) => p.id !== id),
          toastMessage: 'Metode pembayaran dihapus',
        }));
      },

      // Superadmin: User Management
      addUser: async (userData) => {
        try {
          const res = await fetch(`${API_BASE_URL}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
          });
          const data = await res.json();
          if (data.success && data.data) {
            set((state) => ({
              users: [data.data, ...state.users],
              toastMessage: `User baru "${data.data.name}" berhasil ditambahkan ke Supabase!`,
            }));
            return;
          }
        } catch (err) {
          console.error('Failed to add user to DB:', err);
        }

        const newUser: ManagedUser = {
          ...userData,
          id: `user-${Date.now()}`,
          joinedDate: new Date().toISOString().split('T')[0],
          totalOrdersOrSales: userData.totalOrdersOrSales || 0,
          avatarUrl:
            userData.avatarUrl ||
            'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
        };
        set((state) => ({
          users: [newUser, ...state.users],
          toastMessage: `User baru "${newUser.name}" berhasil ditambahkan!`,
        }));
      },

      updateUser: async (id, userData) => {
        try {
          await fetch(`${API_BASE_URL}/users/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
          });
        } catch (err) {
          console.error('Failed to update user in DB:', err);
        }

        set((state) => ({
          users: state.users.map((u) => (u.id === id ? { ...u, ...userData } : u)),
          toastMessage: 'Data akun user berhasil diperbarui!',
        }));
      },

      toggleUserStatus: (id) =>
        set((state) => ({
          users: state.users.map((u) => {
            if (u.id !== id) return u;
            const newStatus = u.status === 'active' ? 'inactive' : 'active';
            return { ...u, status: newStatus };
          }),
          toastMessage: 'Status akun user diperbarui',
        })),

      deleteUser: async (id) => {
        try {
          await fetch(`${API_BASE_URL}/users/${id}`, {
            method: 'DELETE',
          });
        } catch (err) {
          console.error('Failed to delete user in DB:', err);
        }

        set((state) => ({
          users: state.users.filter((u) => u.id !== id),
          toastMessage: 'Akun user berhasil dihapus',
        }));
      },
    }),
    {
      name: 'admin-store-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ isAdminOpen: state.isAdminOpen, activeTab: state.activeTab }),
    }
  )
);

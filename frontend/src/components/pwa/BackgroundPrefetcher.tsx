import React, { useEffect } from 'react';
import { useUserStore } from '../../features/auth/store/useUserStore';
import { useLocationStore } from '../../features/store-location/store/useLocationStore';
import { usePembayaranStore } from '../../features/payment/store/usePembayaranStore';
import { useAdminStore } from '../../features/admin/store/useAdminStore';
import { useStoreSelectorStore } from '../../features/store-location/store/useStoreSelectorStore';

/**
 * BackgroundPrefetcher Component
 * Silently prefetches & caches public and private user data in memory/Zustand store
 * so that when users navigate to Checkout, Addresses, or Order History,
 * everything loads instantly with 0ms delay.
 */
export const BackgroundPrefetcher: React.FC = () => {
  const { isLoggedIn, profile, fetchUserOrders } = useUserStore();
  const { fetchAddresses } = useLocationStore();
  const { fetchPaymentMethods } = usePembayaranStore();
  const { fetchInitialData } = useAdminStore();
  const { selectedStoreId, fetchStores } = useStoreSelectorStore();

  // 1. PUBLIC DATA BACKGROUND PREFETCH & CACHE
  useEffect(() => {
    const prefetchPublicData = async () => {
      try {
        if (typeof fetchStores === 'function') {
          await fetchStores();
        }
        await fetchInitialData(selectedStoreId);
        await fetchPaymentMethods(10000);
      } catch (err) {
        console.debug('[Public Cache] Silent prefetch:', err);
      }
    };

    // Execute silently in background 300ms after initial render
    const timer = setTimeout(prefetchPublicData, 300);
    return () => clearTimeout(timer);
  }, [selectedStoreId, fetchInitialData, fetchPaymentMethods, fetchStores]);

  // 2. PRIVATE USER DATA BACKGROUND PREFETCH & CACHE
  useEffect(() => {
    if (!isLoggedIn) return;

    const prefetchUserData = async () => {
      try {
        const userIdent = profile.id || profile.phone;
        await fetchAddresses(userIdent);
        await fetchUserOrders(userIdent);
      } catch (err) {
        console.debug('[Private User Cache] Silent prefetch:', err);
      }
    };

    // Execute silently in background 500ms after login / page mount
    const timer = setTimeout(prefetchUserData, 500);
    return () => clearTimeout(timer);
  }, [isLoggedIn, profile.id, profile.phone, fetchAddresses, fetchUserOrders]);

  return null;
};

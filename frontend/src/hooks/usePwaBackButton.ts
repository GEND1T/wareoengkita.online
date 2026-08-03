import { useEffect, useRef } from 'react';
import { useCategoryStore } from '../features/catalog/store/useCategoryStore';
import { useUserStore } from '../features/auth/store/useUserStore';
import { useLocationStore } from '../features/store-location/store/useLocationStore';
import { useStoreSelectorStore } from '../features/store-location/store/useStoreSelectorStore';
import { useAdminStore } from '../features/admin/store/useAdminStore';
import { usePembayaranStore } from '../features/payment/store/usePembayaranStore';
import { useProductDetailStore } from '../features/catalog/store/useProductDetailStore';

/**
 * usePwaBackButton Hook
 * Handles PWA & Mobile Web Physical Back Button / Gesture Navigation.
 * When a user presses the physical Back button on mobile (Android/iOS):
 * - If any modal, drawer, or product sheet is currently open, it closes the modal instead of exiting the PWA.
 * - If no modal is open, standard browser navigation happens.
 */
export const usePwaBackButton = () => {
  const {
    isCartDrawerOpen,
    closeCartDrawer,
    isCheckoutOpen,
    closeCheckout,
    isCategoryModalOpen,
    closeCategoryModal,
  } = useCategoryStore();

  const { isProfileDrawerOpen, closeProfileDrawer, isAuthModalOpen, closeAuthModal } =
    useUserStore();
  const { isLocationDrawerOpen, closeLocationDrawer } = useLocationStore();
  const { isStoreDrawerOpen, closeStoreDrawer } = useStoreSelectorStore();
  const { isAdminOpen, closeAdmin } = useAdminStore();
  const { isPaymentModalOpen, closePaymentModal } = usePembayaranStore();
  const { productHistory, popProductDetail } = useProductDetailStore();

  const isAnyModalOpen =
    isCartDrawerOpen ||
    isCheckoutOpen ||
    isCategoryModalOpen ||
    isProfileDrawerOpen ||
    isAuthModalOpen ||
    isLocationDrawerOpen ||
    isStoreDrawerOpen ||
    isAdminOpen ||
    isPaymentModalOpen ||
    productHistory.length > 0;

  const pushedStateRef = useRef(false);

  // Push state to browser history when a modal opens
  useEffect(() => {
    if (isAnyModalOpen && !pushedStateRef.current) {
      window.history.pushState({ modalOpen: true }, '');
      pushedStateRef.current = true;
    } else if (!isAnyModalOpen && pushedStateRef.current) {
      pushedStateRef.current = false;
    }
  }, [isAnyModalOpen]);

  // Listen to physical Back Button / Back Gesture (popstate event)
  useEffect(() => {
    const handlePopState = () => {
      if (productHistory.length > 0) {
        popProductDetail();
      } else if (isPaymentModalOpen) {
        closePaymentModal();
      } else if (isCheckoutOpen) {
        closeCheckout();
      } else if (isCartDrawerOpen) {
        closeCartDrawer();
      } else if (isCategoryModalOpen) {
        closeCategoryModal();
      } else if (isProfileDrawerOpen) {
        closeProfileDrawer();
      } else if (isAuthModalOpen) {
        closeAuthModal();
      } else if (isLocationDrawerOpen) {
        closeLocationDrawer();
      } else if (isStoreDrawerOpen) {
        closeStoreDrawer();
      } else if (isAdminOpen) {
        closeAdmin();
      }
      pushedStateRef.current = false;
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [
    isCartDrawerOpen,
    closeCartDrawer,
    isCheckoutOpen,
    closeCheckout,
    isCategoryModalOpen,
    closeCategoryModal,
    isProfileDrawerOpen,
    closeProfileDrawer,
    isAuthModalOpen,
    closeAuthModal,
    isLocationDrawerOpen,
    closeLocationDrawer,
    isStoreDrawerOpen,
    closeStoreDrawer,
    isAdminOpen,
    closeAdmin,
    isPaymentModalOpen,
    closePaymentModal,
    productHistory.length,
    popProductDetail,
  ]);
};

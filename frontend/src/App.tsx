import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Snackbar, Alert } from '@mui/material';
import { usePwaBackButton } from './hooks/usePwaBackButton';
import { ShoppingBag, ArrowRight } from 'lucide-react';

import {
  BackgroundPrefetcher,
  PwaInstallPrompt,
} from './components/pwa';

import {
  Header,
  HeroBanner,
  ServerStatusBanner
} from './components/layouts';

import { 
  CategoryFilter, 
  CategoryModal, 
  ProductGrid, 
  ProductDetailModal, 
  useCategoryStore
} from './features/catalog';

import { CartDrawer, useCartStore } from './features/cart';

import { 
  LocationDrawer, 
  StoreSelectorDrawer, 
  useLocationStore, 
  useStoreSelectorStore 
} from './features/store-location';

import { SupportDrawer } from './features/support';
import { CheckoutPage } from './features/checkout';
import { ProfileDrawer, AuthModal, VerifyAccessPage, useUserStore } from './features/auth';
import { PaymentInvoicePage } from './features/payment';

const AdminDashboard = React.lazy(() =>
  import('./features/admin').then((m) => ({ default: m.AdminDashboard }))
);


const queryClient = new QueryClient();

// Material UI custom theme to match app colors
const muiTheme = createTheme({
  palette: {
    primary: {
      main: '#063104',
    },
    secondary: {
      main: '#77a160',
    },
  },
  typography: {
    fontFamily: [
      'system-ui',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      'sans-serif',
    ].join(','),
  },
});

export const App: React.FC = () => {
  usePwaBackButton();
  const { selectedStoreId, getSelectedStore } = useStoreSelectorStore();
  const totalItems = useCartStore((state) => state.getTotalItems());
  const storeItems = useCartStore((state) => state.getTotalItemsByStore(selectedStoreId));
  const storePrice = useCartStore((state) => state.getTotalPriceByStore(selectedStoreId));
  const openCartDrawer = useCategoryStore((state) => state.openCartDrawer);
  const { toastMessage, hideToast } = useLocationStore();
  const { isAuthModalOpen, closeAuthModal } = useUserStore();
  const [isSupportOpen, setIsSupportOpen] = useState(false);

  const selectedStore = getSelectedStore();

  const formattedTotalPrice = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(storePrice).replace(/\s/g, ' ');

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={muiTheme}>
        <Routes>
          {/* Route for WhatsApp Magic Link Token Verification */}
          <Route path="/verify-access" element={<VerifyAccessPage />} />

          {/* Route for Public Shareable Invoicing Link */}
          <Route path="/pay/:token" element={<PaymentInvoicePage />} />

          {/* Main E-Commerce Application Page */}
          <Route
            path="*"
            element={
              <div className="min-h-screen bg-[#F9F8F6] text-[#1F2937] flex flex-col font-sans selection:bg-[#77a160] selection:text-white">
                {/* Silent Background Data Prefetcher & Memory Cache */}
                <BackgroundPrefetcher />

                {/* Global Server Disconnected Alert Banner */}
                <ServerStatusBanner />

                {/* Header Bar */}
                <Header />

                {/* Main Layout Container */}
                <main className="flex-1 w-full max-w-6xl mx-auto pb-12">
                  {/* Hero Promotion Banner */}
                  <HeroBanner />

                  {/* Category Filter Chips */}
                  <CategoryFilter />

                  {/* Asymmetric Zigzag Product Grid */}
                  <ProductGrid />
                </main>

                {/* Floating Cart Sticky Bar for Mobile & Desktop when items in current store */}
                {storeItems > 0 ? (
                  <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 w-full max-w-6xl px-4 pointer-events-none">
                    <button
                      type="button"
                      onClick={openCartDrawer}
                      className="pointer-events-auto w-full max-w-xl mx-auto bg-[#063104] hover:bg-[#084205] text-white p-3.5 sm:p-4 rounded-2xl shadow-2xl flex items-center justify-between transition-all duration-300 active:scale-[0.98] focus:outline-none border border-emerald-900/40"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative bg-white/15 p-2.5 rounded-xl flex items-center justify-center">
                          <ShoppingBag className="w-5 h-5 text-white" />
                          <span className="absolute -top-1 -right-1 bg-[#FACC15] text-[#063104] text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                            {storeItems}
                          </span>
                        </div>
                        <div className="text-left">
                          <p className="text-[10px] text-emerald-200 uppercase font-extrabold tracking-wider leading-none">
                            {selectedStore?.name || 'Toko Terpilih'} • {storeItems} Produk
                          </p>
                          <p className="text-base font-extrabold text-white mt-1 leading-none">
                            {formattedTotalPrice}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 bg-white/15 hover:bg-white/25 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold text-white transition-colors">
                        <span>Lihat Keranjang</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </button>
                  </div>
                ) : totalItems > 0 && (
                  <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 w-full max-w-6xl px-4 pointer-events-none">
                    <button
                      type="button"
                      onClick={openCartDrawer}
                      className="pointer-events-auto w-full max-w-md mx-auto bg-slate-800/95 hover:bg-slate-900 text-white p-3 rounded-2xl shadow-xl flex items-center justify-between transition-all duration-300 active:scale-[0.98] focus:outline-none border border-slate-700/60 backdrop-blur-md"
                    >
                      <div className="flex items-center gap-2.5">
                        <ShoppingBag className="w-4.5 h-4.5 text-[#FACC15]" />
                        <span className="text-xs font-bold text-slate-200">
                          {totalItems} produk tersimpan di toko lain
                        </span>
                      </div>
                      <span className="text-xs font-extrabold text-[#FACC15] flex items-center gap-1">
                        Buka Keranjang ➔
                      </span>
                    </button>
                  </div>
                )}

                {/* Category Selection Modal */}
                <CategoryModal />

                {/* Interactive Product Detail Sheet Modal */}
                <ProductDetailModal />

                {/* Cart Drawer */}
                <CartDrawer />

                {/* Checkout Page */}
                <CheckoutPage />

                {/* Profile & Order History Drawer */}
                <ProfileDrawer onOpenSupport={() => setIsSupportOpen(true)} />

                {/* WhatsApp Authentication Modal */}
                <AuthModal isOpen={isAuthModalOpen} onClose={closeAuthModal} />

                {/* PWA Install Prompt Banner */}
                <PwaInstallPrompt />

                {/* Location Drawer */}
                <LocationDrawer />

                {/* Store Selector Drawer */}
                <StoreSelectorDrawer />

                {/* Support CS & FAQ Drawer */}
                <SupportDrawer open={isSupportOpen} onClose={() => setIsSupportOpen(false)} />

                {/* Admin Dashboard (Lazy Loaded) */}
                <React.Suspense fallback={null}>
                  <AdminDashboard />
                </React.Suspense>

                {/* Toast Notification */}
                <Snackbar
                  open={!!toastMessage}
                  autoHideDuration={3500}
                  onClose={hideToast}
                  anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                  sx={{ mt: 7, zIndex: 9999 }}
                >
                  <Alert
                    onClose={hideToast}
                    severity="success"
                    variant="filled"
                    sx={{
                      width: '100%',
                      backgroundColor: '#063104',
                      color: '#FFFFFF',
                      borderRadius: '16px',
                      fontWeight: 600,
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
                    }}
                  >
                    {toastMessage}
                  </Alert>
                </Snackbar>
              </div>
            }
          />
        </Routes>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;

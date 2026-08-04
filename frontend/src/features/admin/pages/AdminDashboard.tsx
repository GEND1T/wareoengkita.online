import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  PackageCheck,
  Tag,
  Sparkles,
  Bell,
  LogOut,
  ShieldCheck,
  PanelLeftClose,
  Store,
  Truck,
  CreditCard,
  Users,
  Building2,
  BarChart3,
  Settings,
  ExternalLink,
} from 'lucide-react';
import { Wallet } from 'lucide-react';
import { useAdminStore, type AdminTab } from '../store/useAdminStore';
import { useStoreSelectorStore } from '../../store-location/store/useStoreSelectorStore';
import { OverviewView } from '../components/OverviewView';
import { OrdersView } from '../components/OrdersView';
import { ProductsView } from '../components/ProductsView';
import { CategoriesView } from '../components/CategoriesView';
import { PromosView } from '../components/PromosView';
import { StoreProfileView } from '../components/StoreProfileView';
import { ShippingView } from '../components/ShippingView';
import { PaymentView } from '../components/PaymentView';
import { UsersManagementView } from '../components/UsersManagementView';
import { StoresManagementView } from '../components/StoresManagementView';
import { AnalyticsReportsView } from '../components/AnalyticsReportsView';
import { SystemSettingsView } from '../components/SystemSettingsView';
import { WalletWithdrawalView } from '../components/WalletWithdrawalView';
import { Snackbar, Alert } from '@mui/material';

import { useUserStore } from '../../auth/store/useUserStore';

export const AdminDashboard: React.FC = () => {
  const { profile, openProfileDrawer } = useUserStore();
  const { setSelectedStoreId } = useStoreSelectorStore();
  const {
    isAdminOpen,
    closeAdmin,
    activeTab,
    setActiveTab,
    unreadNewOrdersCount,
    toastMessage,
    hideToast,
    fetchInitialData,
  } = useAdminStore();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (isAdminOpen) {
      const storeIdFilter = profile.role === 'admin_store' ? (profile.assignedStoreId || undefined) : undefined;
      fetchInitialData(storeIdFilter);
    }
  }, [isAdminOpen, profile.role, profile.assignedStoreId, fetchInitialData]);

  if (!isAdminOpen) return null;

  const handleExitAdmin = () => {
    closeAdmin();
    openProfileDrawer('profile');
  };

  const storeMenuItems: { id: AdminTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'overview', label: 'Ringkasan (Overview)', icon: <LayoutDashboard className="w-5 h-5" /> },
    {
      id: 'orders',
      label: 'Pesanan (Orders)',
      icon: <ShoppingBag className="w-5 h-5" />,
      badge: unreadNewOrdersCount,
    },
    { id: 'products', label: 'Produk (Catalog)', icon: <PackageCheck className="w-5 h-5" /> },
    { id: 'categories', label: 'Kategori', icon: <Tag className="w-5 h-5" /> },
    { id: 'promos', label: 'Promo & Banner', icon: <Sparkles className="w-5 h-5" /> },
    { id: 'store_profile', label: 'Profil Toko', icon: <Store className="w-5 h-5" /> },
    { id: 'shipping_options', label: 'Opsi Pengiriman', icon: <Truck className="w-5 h-5" /> },
    { id: 'payment_methods', label: 'Pembayaran', icon: <CreditCard className="w-5 h-5" /> },
    { id: 'wallet_pencairan', label: 'Dompet & Pencairan', icon: <Wallet className="w-5 h-5" /> },
    { id: 'analytics_reports', label: 'Laporan Analytics', icon: <BarChart3 className="w-5 h-5" /> },
  ];

  const superadminMenuItems: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: 'users_management', label: 'Kelola User', icon: <Users className="w-5 h-5" /> },
    { id: 'stores_management', label: 'Kelola Multi-Store', icon: <Building2 className="w-5 h-5" /> },
    { id: 'system_settings', label: 'Pengaturan System', icon: <Settings className="w-5 h-5" /> },
  ];

  const isSuperAdmin = profile.role === 'superadmin';

  return (
    <div className="fixed inset-0 z-[2500] bg-[#F9F8F6] flex overflow-hidden font-sans selection:bg-[#77a160] selection:text-white animate-fade-in">
      {/* ---------------------------------------------------- */}
      {/* 1. SIDEBAR KIRI (FIXED LAYOUT WITH MINIMIZE FITUR)    */}
      {/* ---------------------------------------------------- */}
      <aside
        className={`bg-[#F9F8F6] border-r border-gray-200/80 flex flex-col justify-between shrink-0 shadow-sm z-20 transition-all duration-300 ${isSidebarCollapsed ? 'w-20 p-3 items-center' : 'w-64 p-4'
          }`}
      >
        <div className="space-y-5 w-full overflow-y-auto pr-0.5">
          {/* Top Logo & App Title */}
          <div
            className={`flex items-center gap-3 pt-2 ${isSidebarCollapsed ? 'justify-center px-0' : 'px-2'
              }`}
          >
            <div className="w-10 h-10 rounded-2xl bg-[#063104] text-white flex items-center justify-center font-black shadow-md shrink-0">
              <ShieldCheck className="w-6 h-6 text-[#FACC15]" />
            </div>

            {!isSidebarCollapsed && (
              <div className="animate-fade-in min-w-0">
                <h2 className="font-black text-gray-900 text-base leading-none truncate">
                  Organik<span className="text-[#77a160]">Store</span>
                </h2>
                <span className="text-[10px] font-extrabold text-purple-900 bg-purple-100 px-2 py-0.5 rounded-full block mt-1 w-fit truncate">
                  {isSuperAdmin ? 'Superadmin Suite' : `Admin: ${profile.assignedStoreName || 'Cabang'}`}
                </span>
              </div>
            )}
          </div>

          {/* SECTION A: SUPERADMIN PLATFORM MANAGEMENT (Only visible to Superadmin) */}
          {isSuperAdmin && (
            <nav className="space-y-1 w-full">
              {!isSidebarCollapsed && (
                <span className="text-[10px] font-extrabold text-purple-900 uppercase tracking-widest px-3 block mb-1 animate-fade-in">
                  Superadmin Platform
                </span>
              )}

              {superadminMenuItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    title={item.label}
                    className={`relative w-full flex items-center rounded-2xl text-xs font-extrabold transition-all duration-200 ${isSidebarCollapsed
                      ? 'justify-center p-3'
                      : 'justify-between px-3.5 py-2.5'
                      } ${isActive
                        ? 'bg-purple-800 text-white shadow-lg shadow-purple-900/20 translate-x-0.5'
                        : 'text-gray-700 hover:bg-purple-100/70 hover:text-purple-900'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={isActive ? 'text-white' : 'text-purple-800'}>
                        {item.icon}
                      </span>
                      {!isSidebarCollapsed && <span>{item.label}</span>}
                    </div>
                  </button>
                );
              })}
            </nav>
          )}

          {/* SECTION B: STORE OPERATIONS NAVIGATION MENU LIST */}
          <nav className="space-y-1 pt-2 border-t border-gray-200/80 w-full">
            {!isSidebarCollapsed && (
              <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest px-3 block mb-1 animate-fade-in">
                Manajemen Toko
              </span>
            )}

            {storeMenuItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  title={item.label}
                  className={`relative w-full flex items-center rounded-2xl text-xs font-extrabold transition-all duration-200 ${isSidebarCollapsed
                    ? 'justify-center p-3'
                    : 'justify-between px-3.5 py-2.5'
                    } ${isActive
                      ? 'bg-[#77a160] text-white shadow-lg shadow-[#77a160]/20 translate-x-0.5'
                      : 'text-gray-700 hover:bg-gray-200/70 hover:text-gray-900'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={isActive ? 'text-white' : 'text-gray-500'}>
                      {item.icon}
                    </span>
                    {!isSidebarCollapsed && <span>{item.label}</span>}
                  </div>

                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`font-black ${isSidebarCollapsed
                        ? 'absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white rounded-full text-[9px] flex items-center justify-center animate-bounce shadow-xs'
                        : `px-2 py-0.5 rounded-full text-[10px] ${isActive ? 'bg-white text-[#063104]' : 'bg-red-500 text-white animate-pulse'
                        }`
                        }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Sidebar Action: Back to Customer Store */}
        <div className="pt-3 border-t border-gray-200/80 w-full shrink-0">
          <button
            type="button"
            onClick={handleExitAdmin}
            title="Kembali ke Profil Saya"
            className={`w-full bg-white hover:bg-emerald-50 text-[#063104] hover:text-[#063104] border border-emerald-200/80 font-extrabold rounded-2xl text-xs transition-all flex items-center justify-center gap-2 shadow-xs ${isSidebarCollapsed ? 'p-3' : 'py-2.5 px-3.5'
              }`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!isSidebarCollapsed && <span>Kembali ke Profil Saya</span>}
          </button>
        </div>
      </aside>

      {/* ---------------------------------------------------- */}
      {/* 2. AREA KONTEN UTAMA (KANAN)                          */}
      {/* ---------------------------------------------------- */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#F9F8F6] overflow-hidden">
        {/* Top Header Bar */}
        <header className="bg-white border-b border-gray-200/80 px-6 py-3.5 flex items-center justify-between gap-4 shrink-0 shadow-xs z-10">
          <div className="flex items-center gap-3">
            {/* Sidebar Minimize / Expand Toggle Button */}
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-2 rounded-xl bg-gray-100 hover:bg-[#063104] hover:text-white text-gray-700 transition-colors"
              title={isSidebarCollapsed ? 'Perluas Sidebar' : 'Kecilkan Sidebar'}
            >
              <PanelLeftClose
                className={`w-5 h-5 transition-transform duration-300 ${isSidebarCollapsed ? 'rotate-180 text-[#063104] hover:text-white' : ''
                  }`}
              />
            </button>

            <h2 className="font-extrabold text-gray-900 text-base capitalize">
              {activeTab === 'overview' && 'Ringkasan Dashboard'}
              {activeTab === 'orders' && 'Manajemen Pesanan'}
              {activeTab === 'products' && 'Katalog Produk Organik'}
              {activeTab === 'categories' && 'Pengaturan Kategori'}
              {activeTab === 'promos' && 'Manajemen Promo & Banner'}
              {activeTab === 'store_profile' && 'Profil Toko & Lokasi Map'}
              {activeTab === 'shipping_options' && 'Opsi Pengiriman Pesanan'}
              {activeTab === 'payment_methods' && 'Metode Pembayaran'}
              {activeTab === 'wallet_pencairan' && 'Dompet & Pencairan Dana Penjual'}
              {activeTab === 'users_management' && 'Manajemen User (Pengguna)'}
              {activeTab === 'stores_management' && 'Manajemen Cabang Toko (Multi-Store)'}
              {activeTab === 'analytics_reports' && 'Laporan Analytics & Penjualan'}
              {activeTab === 'system_settings' && 'Pengaturan Global Platform'}
            </h2>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Quick Store Branch Access Button */}
            <button
              type="button"
              onClick={() => {
                if (profile.assignedStoreId) {
                  setSelectedStoreId(profile.assignedStoreId);
                }
                closeAdmin();
              }}
              className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-[#063104] text-[#063104] hover:text-white border border-emerald-200/80 transition-all font-extrabold text-xs flex items-center gap-1.5 shadow-2xs group cursor-pointer"
              title="Buka & Lihat Tampilan Toko"
            >
              <Store className="w-4 h-4 text-emerald-700 group-hover:text-white shrink-0" />
              <span className="hidden md:inline">
                {profile.assignedStoreName ? `Toko: ${profile.assignedStoreName}` : 'Lihat Tampilan Toko'}
              </span>
              <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-75" />
            </button>

            {/* Notification Bell */}
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className="relative p-2.5 rounded-xl bg-emerald-50 text-[#063104] hover:bg-emerald-100 transition-colors"
              title="Notifikasi Pesanan"
            >
              <Bell className="w-4 h-4" />
              {unreadNewOrdersCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-600 rounded-full ring-2 ring-white animate-ping"></span>
              )}
            </button>

            {/* Dynamic Admin Avatar & Profile Info */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-gray-200">
              <div
                className={`w-8.5 h-8.5 rounded-full font-black text-xs flex items-center justify-center text-white shadow-xs ${profile.role === 'superadmin' ? 'bg-purple-900' : 'bg-[#063104]'
                  }`}
              >
                {profile.fullName ? profile.fullName.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="hidden sm:block text-left min-w-0">
                <span className="text-xs font-extrabold text-gray-900 block leading-tight truncate max-w-[140px]">
                  {profile.fullName || 'Admin User'}
                </span>
                <span
                  className={`text-[10px] font-extrabold block leading-tight truncate max-w-[140px] ${profile.role === 'superadmin' ? 'text-purple-700' : 'text-emerald-700'
                    }`}
                >
                  {profile.role === 'superadmin'
                    ? 'Superadmin Access'
                    : profile.assignedStoreName || 'Admin Toko'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Content View Area */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'overview' && <OverviewView />}
            {activeTab === 'orders' && <OrdersView />}
            {activeTab === 'products' && <ProductsView />}
            {activeTab === 'categories' && <CategoriesView />}
            {activeTab === 'promos' && <PromosView />}
            {activeTab === 'store_profile' && <StoreProfileView />}
            {activeTab === 'shipping_options' && <ShippingView />}
            {activeTab === 'payment_methods' && <PaymentView />}
            {activeTab === 'wallet_pencairan' && <WalletWithdrawalView />}
            {activeTab === 'users_management' && <UsersManagementView />}
            {activeTab === 'stores_management' && <StoresManagementView />}
            {activeTab === 'analytics_reports' && <AnalyticsReportsView />}
            {activeTab === 'system_settings' && <SystemSettingsView />}
          </div>
        </main>
      </div>

      {/* Admin Toast Alerts */}
      <Snackbar
        open={!!toastMessage}
        autoHideDuration={3500}
        onClose={hideToast}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{ mt: 2, zIndex: 9999 }}
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
  );
};

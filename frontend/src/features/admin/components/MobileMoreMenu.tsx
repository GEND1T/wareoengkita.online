import React from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  PackageCheck,
  Tag,
  Sparkles,
  Store,
  Truck,
  CreditCard,
  Wallet,
  BarChart3,
  Users,
  Building2,
  Settings,
  X,
  ShieldCheck,
} from 'lucide-react';
import type { AdminTab } from '../store/useAdminStore';

interface MobileMoreMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onTabChange: (tab: AdminTab) => void;
  activeTab: AdminTab;
  isSuperAdmin: boolean;
}

interface MenuItem {
  id: AdminTab;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

export const MobileMoreMenu: React.FC<MobileMoreMenuProps> = ({
  isOpen,
  onClose,
  onTabChange,
  activeTab,
  isSuperAdmin,
}) => {
  if (!isOpen) return null;

  const storeMenuItems: MenuItem[] = [
    { id: 'overview', label: 'Beranda', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'orders', label: 'Pesanan', icon: <ShoppingBag className="w-5 h-5" /> },
    { id: 'products', label: 'Produk', icon: <PackageCheck className="w-5 h-5" /> },
    { id: 'categories', label: 'Kategori', icon: <Tag className="w-5 h-5" /> },
    { id: 'promos', label: 'Promo & Banner', icon: <Sparkles className="w-5 h-5" /> },
    { id: 'store_profile', label: 'Profil Toko', icon: <Store className="w-5 h-5" /> },
    { id: 'shipping_options', label: 'Pengiriman', icon: <Truck className="w-5 h-5" /> },
    { id: 'payment_methods', label: 'Pembayaran', icon: <CreditCard className="w-5 h-5" /> },
    { id: 'wallet_pencairan', label: 'Keuangan', icon: <Wallet className="w-5 h-5" /> },
    { id: 'analytics_reports', label: 'Analytics', icon: <BarChart3 className="w-5 h-5" /> },
  ];

  const superadminMenuItems: MenuItem[] = [
    { id: 'promos', label: 'Promo Global', icon: <Sparkles className="w-5 h-5" /> },
    { id: 'users_management', label: 'Kelola User', icon: <Users className="w-5 h-5" /> },
    { id: 'stores_management', label: 'Multi-Store', icon: <Building2 className="w-5 h-5" /> },
    { id: 'system_settings', label: 'Pengaturan', icon: <Settings className="w-5 h-5" /> },
  ];

  const handleSelect = (tab: AdminTab) => {
    onTabChange(tab);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[2700] animate-overlay-in"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

      {/* Menu Sheet */}
      <div
        className="absolute bottom-0 inset-x-0 bg-white rounded-t-[28px] shadow-2xl animate-slide-up safe-area-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3">
          <h3 className="text-sm font-extrabold text-gray-900">Semua Menu</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Superadmin Section */}
        {isSuperAdmin && (
          <div className="px-5 pb-4">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-700" />
              <span className="text-[10px] font-extrabold text-purple-700 uppercase tracking-wider">
                Superadmin Platform
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {superadminMenuItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item.id)}
                    className={`
                      flex flex-col items-center gap-1.5 py-3 px-1 rounded-2xl
                      transition-all duration-150 active:scale-95 min-h-[72px]
                      ${isActive
                        ? 'bg-purple-100 text-purple-800 shadow-sm'
                        : 'bg-gray-50 text-gray-600 hover:bg-purple-50'
                      }
                    `}
                  >
                    <span className={`p-2 rounded-xl ${isActive ? 'bg-purple-800 text-white' : 'bg-white text-purple-700 shadow-xs'}`}>
                      {item.icon}
                    </span>
                    <span className={`text-[10px] leading-tight text-center ${isActive ? 'font-extrabold' : 'font-semibold'}`}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Store Management Section */}
        <div className="px-5 pb-6">
          <div className="flex items-center gap-2 mb-3">
            <Store className="w-3.5 h-3.5 text-[#063104]" />
            <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">
              Manajemen Toko
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {storeMenuItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item.id)}
                  className={`
                    flex flex-col items-center gap-1.5 py-3 px-1 rounded-2xl
                    transition-all duration-150 active:scale-95 min-h-[72px]
                    ${isActive
                      ? 'bg-emerald-100 text-[#063104] shadow-sm'
                      : 'bg-gray-50 text-gray-600 hover:bg-emerald-50'
                    }
                  `}
                >
                  <span className={`p-2 rounded-xl ${isActive ? 'bg-[#063104] text-white' : 'bg-white text-[#77a160] shadow-xs'}`}>
                    {item.icon}
                  </span>
                  <span className={`text-[10px] leading-tight text-center ${isActive ? 'font-extrabold' : 'font-semibold'}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

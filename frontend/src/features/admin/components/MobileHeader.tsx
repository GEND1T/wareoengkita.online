import React from 'react';
import {
  Bell,
  ShieldCheck,
  LogOut,
} from 'lucide-react';
import type { AdminTab } from '../store/useAdminStore';

interface MobileHeaderProps {
  activeTab: AdminTab;
  profileName: string;
  profileRole: string;
  profileStoreName?: string;
  unreadOrdersCount: number;
  onNotificationPress: () => void;
  onExitAdmin: () => void;
}

const TAB_TITLES: Record<AdminTab, string> = {
  overview: 'Beranda',
  orders: 'Pesanan',
  products: 'Katalog Produk',
  categories: 'Kategori',
  promos: 'Promo & Banner',
  store_profile: 'Profil Toko',
  shipping_options: 'Pengiriman',
  payment_methods: 'Pembayaran',
  wallet_pencairan: 'Keuangan',
  users_management: 'Kelola User',
  stores_management: 'Multi-Store',
  analytics_reports: 'Analytics',
  system_settings: 'Pengaturan',
};

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  activeTab,
  profileName,
  profileRole,
  unreadOrdersCount,
  onNotificationPress,
  onExitAdmin,
}) => {
  const isSuperAdmin = profileRole === 'superadmin';
  const initials = profileName ? profileName.charAt(0).toUpperCase() : 'A';

  return (
    <header className="sticky top-0 z-[2550] bg-white/95 backdrop-blur-xl border-b border-gray-200/60 safe-area-top">
      <div className="flex items-center justify-between h-[52px] px-4">
        {/* Left: Logo + Page Title */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Mini Logo */}
          <div className="w-8 h-8 rounded-xl bg-[#063104] text-white flex items-center justify-center shrink-0 shadow-sm">
            <ShieldCheck className="w-4.5 h-4.5 text-[#C8956A]" />
          </div>

          {/* Page Title */}
          <div className="min-w-0 flex-1">
            <h1 className="text-sm font-extrabold text-gray-900 truncate leading-tight">
              {TAB_TITLES[activeTab]}
            </h1>
            <span className={`text-[9px] font-bold leading-none ${isSuperAdmin ? 'text-purple-600' : 'text-[#77a160]'}`}>
              {isSuperAdmin ? 'Superadmin' : 'Admin Store'}
            </span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Notification Bell */}
          <button
            type="button"
            onClick={onNotificationPress}
            className="relative w-9 h-9 rounded-xl bg-gray-100/80 flex items-center justify-center text-gray-600 hover:bg-emerald-50 hover:text-[#063104] transition-colors active:scale-95"
            aria-label="Notifikasi pesanan"
          >
            <Bell className="w-[18px] h-[18px] stroke-[1.8]" />
            {unreadOrdersCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] flex items-center justify-center bg-red-500 text-white text-[9px] font-extrabold rounded-full px-0.5 ring-[1.5px] ring-white">
                {unreadOrdersCount > 9 ? '9+' : unreadOrdersCount}
              </span>
            )}
          </button>

          {/* Exit / Profile Avatar */}
          <button
            type="button"
            onClick={onExitAdmin}
            className="relative w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors active:scale-95"
            aria-label="Kembali ke profil"
            title="Kembali ke Profil Saya"
          >
            <div className={`w-8 h-8 rounded-xl font-extrabold text-[11px] flex items-center justify-center text-white shadow-sm ${isSuperAdmin ? 'bg-purple-800' : 'bg-[#063104]'}`}>
              {initials}
            </div>
            <LogOut className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 text-gray-400 bg-white rounded-full p-[1px]" />
          </button>
        </div>
      </div>
    </header>
  );
};

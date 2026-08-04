import React, { useEffect } from 'react';
import { Search, Store, User } from 'lucide-react';
import { useCategoryStore } from '../../features/catalog/store/useCategoryStore';
import { useUserStore } from '../../features/auth/store/useUserStore';
import { useStoreSelectorStore } from '../../features/store-location/store/useStoreSelectorStore';

export const Header: React.FC = () => {
  const { searchQuery, setSearchQuery } = useCategoryStore();
  const { openProfileDrawer, openAuthModal, isLoggedIn, profile } = useUserStore();
  const { openStoreDrawer, getSelectedStore, fetchStores } = useStoreSelectorStore();
  const activeStore = getSelectedStore();

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  const handleProfileClick = () => {
    if (isLoggedIn) {
      openProfileDrawer('profile');
    } else {
      openAuthModal();
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-[#F9F8F6]/95 backdrop-blur-md pt-3 pb-2 transition-all">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between gap-3">
        {/* Left Side: Expanded Search Bar */}
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari produk organik..."
            className="w-full bg-white text-gray-800 text-sm md:text-base rounded-full py-2.5 pl-5 pr-11 shadow-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#063104]/30 focus:border-[#063104] transition-all placeholder:text-gray-400"
          />
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-700 hover:text-[#063104] transition-colors pointer-events-none">
            <Search className="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>

        {/* Right Side: Action Icons (Store Selector & User Profile / Login) */}
        <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
          {/* Store Selector Button */}
          <button
            type="button"
            onClick={openStoreDrawer}
            aria-label="Cari Toko"
            title={`Toko Terpilih: ${activeStore?.name || 'Cabang Toko'}`}
            className="p-2.5 rounded-full hover:bg-white/80 text-gray-800 hover:text-[#063104] active:scale-95 transition-all shadow-none border-0 focus:outline-none flex items-center gap-1.5 group"
          >
            <Store className="w-6 h-6 stroke-[1.8] text-gray-800 group-hover:text-forest-green" />
            <span className="hidden md:inline-block text-xs font-bold text-[#063104] max-w-[110px] truncate">
              {(activeStore?.name || 'Cabang Toko').replace('OrganikStore ', '')}
            </span>
          </button>

          {/* User Profile / Login Button */}
          <button
            type="button"
            onClick={handleProfileClick}
            aria-label={isLoggedIn ? 'Profil Saya' : 'Login / Masuk'}
            title={isLoggedIn ? `Logged in as ${profile.fullName}` : 'Login / Registrasi via WhatsApp'}
            className="relative p-2.5 rounded-full bg-white hover:bg-emerald-50 text-gray-800 hover:text-[#063104] active:scale-95 transition-all border border-slate-200 focus:outline-none flex items-center gap-1.5 shadow-sm"
          >
            <User className="w-6 h-6 stroke-[1.8]" />
            {isLoggedIn ? (
              <span className="hidden sm:inline text-xs font-bold text-[#063104] max-w-[100px] truncate">
                {profile.fullName.split(' ')[0]}
              </span>
            ) : (
              <span className="hidden sm:inline text-xs font-bold text-emerald-700">
                Masuk
              </span>
            )}
            {isLoggedIn && (
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white absolute top-1 right-1" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

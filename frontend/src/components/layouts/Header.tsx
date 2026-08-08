import React, { useEffect } from 'react';
import { Search, User, Store, ChevronDown } from 'lucide-react';
import { useCategoryStore } from '../../features/catalog/store/useCategoryStore';
import { useUserStore } from '../../features/auth/store/useUserStore';
import { useStoreSelectorStore } from '../../features/store-location/store/useStoreSelectorStore';

export const Header: React.FC = () => {
  const { searchQuery, setSearchQuery } = useCategoryStore();
  const { openProfileDrawer, openAuthModal, isLoggedIn } = useUserStore();
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

  const storeDisplayName = (activeStore?.name || 'Cabang Senopati')
    .replace('WaroengKita ', '')
    .replace('OrganikStore ', '');

  return (
    <header className="sticky top-0 z-30 bg-[#F9F8F6]/95 backdrop-blur-md pt-2.5 pb-2 border-b border-gray-200/50 shadow-2xs transition-all">
      <div className="max-w-6xl mx-auto px-4 space-y-2">
        {/* Mobile & Desktop Top Bar: Brand on Left, Store & Profile grouped on Right */}
        <div className="flex items-center justify-between gap-2">
          {/* Brand Logo */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-lg sm:text-xl font-black tracking-tight text-[#063104]">
              Waroeng<span className="text-[#77a160]">Kita</span>
            </span>
          </div>

          {/* Right Action Items: Store Selector & Profile Button */}
          <div className="flex items-center gap-2 shrink-0 ml-auto">
            {/* Store Selector Pill (Slightly to the right, sized like Profile) */}
            <button
              type="button"
              onClick={openStoreDrawer}
              className="flex items-center gap-1.5 bg-white hover:bg-emerald-50 text-[#063104] px-3 py-1.5 rounded-full border border-gray-200 shadow-2xs text-xs sm:text-sm font-extrabold active:scale-95 transition-all cursor-pointer"
              title={`Toko Terpilih: ${activeStore?.name || 'Cabang Toko'}`}
            >
              <Store className="w-4.5 h-4.5 text-[#063104] shrink-0 stroke-[2]" />
              <span className="truncate max-w-[150px] sm:max-w-xs">
                {storeDisplayName}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            </button>

            {/* User Profile / Login */}
            <button
              type="button"
              onClick={handleProfileClick}
              aria-label={isLoggedIn ? 'Profil Saya' : 'Login / Masuk'}
              className="relative p-2 rounded-full bg-white hover:bg-emerald-50 text-gray-800 active:scale-95 transition-all border border-gray-200 shadow-2xs flex items-center justify-center shrink-0 cursor-pointer"
            >
              <User className="w-4.5 h-4.5 stroke-[1.8] text-[#063104]" />
              {isLoggedIn && (
                <span className="w-2 h-2 bg-emerald-500 rounded-full border border-white absolute top-0.5 right-0.5" />
              )}
            </button>
          </div>
        </div>

        {/* Search Bar Row */}
        <div className="relative w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari produk di WaroengKita..."
            className="w-full bg-white text-gray-800 text-xs sm:text-sm rounded-xl py-2 pl-4 pr-10 shadow-2xs border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#063104]/30 focus:border-[#063104] transition-all placeholder:text-gray-400 font-medium"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <Search className="w-4 h-4 stroke-[2.2]" />
          </div>
        </div>
      </div>
    </header>
  );
};

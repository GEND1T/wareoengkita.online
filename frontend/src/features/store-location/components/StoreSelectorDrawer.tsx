import React, { useEffect } from 'react';
import { Drawer, IconButton } from '@mui/material';
import {
  Store,
  X,
  Search,
  MapPin,
  Phone,
  Clock,
  Star,
  CheckCircle2,
  Navigation,
  Check,
} from 'lucide-react';
import {
  useStoreSelectorStore,
} from '../store/useStoreSelectorStore';
import { useLocationStore } from '../store/useLocationStore';

export const StoreSelectorDrawer: React.FC = () => {
  const {
    isStoreDrawerOpen,
    closeStoreDrawer,
    selectedStoreId,
    setSelectedStoreId,
    searchQuery,
    setSearchQuery,
    stores,
    fetchStores,
  } = useStoreSelectorStore();

  const { getSelectedAddress } = useLocationStore();
  const userAddress = getSelectedAddress();

  useEffect(() => {
    fetchStores(userAddress?.latitude, userAddress?.longitude);
  }, [isStoreDrawerOpen, userAddress?.latitude, userAddress?.longitude, fetchStores]);

  // Calculate Haversine Distance from user address coordinates to store coordinates
  const calculateStoreDistance = (storeLat: number, storeLon: number): string => {
    if (!userAddress?.latitude || !userAddress?.longitude) {
      // Fallback distance estimation if user address coordinates not available
      return '2.4 km';
    }

    const uLat = userAddress.latitude;
    const uLon = userAddress.longitude;
    const R = 6371; // Earth radius in km

    const dLat = ((storeLat - uLat) * Math.PI) / 180;
    const dLon = ((storeLon - uLon) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((uLat * Math.PI) / 180) *
      Math.cos((storeLat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const dist = R * c;

    return dist < 1 ? `${Math.round(dist * 1000)} m` : `${dist.toFixed(1)} km`;
  };

  // Filter stores by search query
  const filteredStores = stores.filter((st) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      st.name.toLowerCase().includes(q) ||
      st.city.toLowerCase().includes(q) ||
      st.address.toLowerCase().includes(q) ||
      st.description.toLowerCase().includes(q)
    );
  });

  if (!isStoreDrawerOpen) return null;

  return (
    <Drawer
      anchor="right"
      open={isStoreDrawerOpen}
      onClose={closeStoreDrawer}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100%', sm: '520px' },
            backgroundColor: '#F9F8F6',
            p: 0,
            display: 'flex',
            flexDirection: 'column',
          },
        },
      }}
    >
      {/* Sticky Header */}
      <div className="sticky top-0 bg-[#F9F8F6]/95 backdrop-blur-md z-30 px-5 py-4 border-b border-gray-200/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#063104] text-white flex items-center justify-center font-bold shadow-sm">
            <Store className="w-5 h-5 text-[#FACC15]" />
          </div>
          <div>
            <h2 className="font-black text-gray-900 text-base leading-none">
              Pilih Toko Terdekat
            </h2>
            <span className="text-[10px] text-gray-500 font-medium block mt-0.5">
              Daftar toko resmi terdaftar dengan stok segar
            </span>
          </div>
        </div>

        <IconButton onClick={closeStoreDrawer} size="small">
          <X className="w-5 h-5 text-gray-700" />
        </IconButton>
      </div>

      {/* Main Scroll Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari toko, kota, atau nama jalan..."
            className="w-full bg-white text-xs md:text-sm rounded-2xl py-3 pl-10 pr-4 shadow-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#063104]/20 focus:border-[#063104] transition-all"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        </div>

        {/* User Location Context Banner */}
        <div className="bg-emerald-50/80 rounded-2xl p-3 border border-emerald-200/80 flex items-center justify-between text-xs text-[#063104]">
          <div className="flex items-center gap-2 min-w-0">
            <Navigation className="w-4 h-4 text-[#063104] shrink-0" />
            <span className="truncate">
              Jarak dihitung dari alamat Anda ({userAddress ? userAddress.label : 'Lokasi Anda'})
            </span>
          </div>
        </div>

        {/* Store Cards List */}
        <div className="space-y-4 pt-1">
          {filteredStores.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-gray-100 text-xs text-gray-400">
              Tidak ada toko yang ditemukan untuk "{searchQuery}".
            </div>
          ) : (
            filteredStores.map((st) => {
              const isSelected = st.id === selectedStoreId;
              const distanceText = calculateStoreDistance(st.latitude, st.longitude);

              return (
                <div
                  key={st.id}
                  className={`bg-white rounded-3xl overflow-hidden border transition-all duration-200 flex flex-col justify-between shadow-xs ${isSelected
                    ? 'border-[#063104] ring-2 ring-[#063104]/20 shadow-md'
                    : 'border-gray-200/80 hover:border-[#77a160]'
                    }`}
                >
                  {/* Store Cover Image */}
                  <div className="relative h-44 w-full bg-gray-100 overflow-hidden">
                    <img
                      src={st.image}
                      alt={st.name}
                      className="w-full h-full object-cover"
                    />

                    {/* Rating Badge */}
                    <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm text-white font-extrabold text-[11px] px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md">
                      <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                      <span>{st.rating}</span>
                    </div>

                    {/* Distance Pill Badge */}
                    <div className="absolute top-3 right-3 bg-[#063104] text-white font-extrabold text-[11px] px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
                      <MapPin className="w-3.5 h-3.5 text-[#FACC15]" />
                      <span>{distanceText}</span>
                    </div>
                  </div>

                  {/* Store Details Body */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-extrabold text-gray-900 text-base leading-snug">
                          {st.name}
                        </h3>
                        <p className="text-[11px] text-gray-500 font-bold flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-emerald-700" />
                          <span>{st.openingHours}</span>
                        </p>
                      </div>

                      {isSelected && (
                        <span className="bg-emerald-100 text-[#063104] text-[10px] font-black px-2.5 py-1 rounded-full shrink-0 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 stroke-[3]" />
                          <span>Toko Terpilih</span>
                        </span>
                      )}
                    </div>

                    {/* Store Description */}
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {st.description}
                    </p>

                    {/* Store Address */}
                    <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-700 flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                      <span className="leading-snug">{st.address}</span>
                    </div>

                    {/* Store Phone & Select Button Footer */}
                    <div className="pt-2 flex items-center gap-2">
                      <a
                        href={`https://wa.me/${st.phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2.5 rounded-2xl bg-gray-100 hover:bg-emerald-50 text-gray-700 hover:text-[#063104] transition-colors border border-gray-200/80 flex items-center justify-center shrink-0"
                        title="Hubungi Toko"
                      >
                        <Phone className="w-4 h-4" />
                      </a>

                      <button
                        type="button"
                        onClick={() => setSelectedStoreId(st.id)}
                        className={`flex-1 font-extrabold py-3 px-4 rounded-2xl text-xs transition-all flex items-center justify-center gap-2 active:scale-98 ${isSelected
                          ? 'bg-emerald-100 text-[#063104] border border-emerald-300 cursor-default'
                          : 'bg-[#063104] hover:bg-[#084205] text-white shadow-md'
                          }`}
                      >
                        {isSelected ? (
                          <>
                            <Check className="w-4 h-4 stroke-[3]" />
                            <span>Toko Sedang Dipilih</span>
                          </>
                        ) : (
                          <>
                            <Store className="w-4 h-4" />
                            <span>Pilih Toko Ini</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Drawer>
  );
};

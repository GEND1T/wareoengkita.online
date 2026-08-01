import React, { useState } from 'react';
import {
  Store,
  MapPin,
  Phone,
  Check,
  Save,
  Clock,
  Upload,
  Image as ImageIcon,
} from 'lucide-react';
import { useAdminStore } from '../../store/useAdminStore';
import MapLocationPicker, { type MapLocationResult } from '../MapLocationPicker';
import { FormSkeleton } from '../common/AdminSkeletons';



import { Loader2 } from 'lucide-react';

export const StoreProfileView: React.FC = () => {
  const { storeProfile, updateStoreProfile, isLoadingData } = useAdminStore();

  const [name, setName] = useState(storeProfile.name);
  const [description, setDescription] = useState(storeProfile.description);
  const [phone, setPhone] = useState(storeProfile.phone);
  const [address, setAddress] = useState(storeProfile.address);
  const [latitude, setLatitude] = useState(storeProfile.latitude);
  const [longitude, setLongitude] = useState(storeProfile.longitude);
  const [image, setImage] = useState(
    storeProfile.image ||
    'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80'
  );
  const [openingHours, setOpeningHours] = useState(
    storeProfile.openingHours || 'Senin - Minggu (08.00 - 21.00 WIB)'
  );
  const [isUploading, setIsUploading] = useState(false);

  React.useEffect(() => {
    if (storeProfile) {
      setName(storeProfile.name || '');
      setDescription(storeProfile.description || '');
      setPhone(storeProfile.phone || '');
      setAddress(storeProfile.address || '');
      setLatitude(storeProfile.latitude || -6.2250);
      setLongitude(storeProfile.longitude || 106.8000);
      if (storeProfile.image) setImage(storeProfile.image);
      if (storeProfile.openingHours) setOpeningHours(storeProfile.openingHours);
    }
  }, [storeProfile]);

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch('http://localhost:5050/api/upload', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      if (json.success && json.url) {
        setImage(json.url);
      }
    } catch (err) {
      console.error('Failed to upload image to Cloudinary:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleMapSelect = (result: MapLocationResult) => {
    setLatitude(result.lat);
    setLongitude(result.lon);
    if (result.displayName) {
      setAddress(result.displayName);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateStoreProfile({
      id: storeProfile.id,
      name: name.trim(),
      description: description.trim(),
      phone: phone.trim(),
      address: address.trim(),
      latitude,
      longitude,
      image,
      openingHours: openingHours.trim(),
    }, storeProfile.id);
  };

  if (isLoadingData) {
    return <FormSkeleton />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Profil Toko & Lokasi Map</h1>
        <p className="text-xs text-gray-500">
          Kelola foto toko fisik, identitas, jadwal operasional buka toko, serta titik koordinat lokasi di peta.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Side: Store Identity, Photo Upload & Schedule */}
          <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100 font-extrabold text-sm text-[#063104]">
              <Store className="w-5 h-5 text-[#063104]" />
              <span>Identitas & Foto Fisik Toko</span>
            </div>

            {/* 1. FOTO TOKO FISIK UPLOAD & PREVIEW */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center justify-between">
                <span>Foto Fisik Tampak Toko (16:9)</span>
                <span className="text-[10px] text-gray-400 font-normal">Preview Live</span>
              </label>

              {/* Preview Box */}
              <div className="relative w-full h-44 rounded-2xl bg-gray-100 border border-gray-200 overflow-hidden group mb-2.5">
                {image ? (
                  <img
                    src={image}
                    alt="Preview Toko Fisik"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                    <ImageIcon className="w-8 h-8 mb-1 opacity-50" />
                    <span className="text-xs font-semibold">Belum Ada Foto Toko</span>
                  </div>
                )}

                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                  <span className="text-white text-xs font-extrabold bg-black/60 px-3 py-1.5 rounded-full backdrop-blur-sm">
                    Ganti Foto Toko
                  </span>
                </div>
              </div>

              {/* Upload Input & URL Field */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label className={`bg-emerald-50 hover:bg-emerald-100/80 text-[#063104] font-extrabold text-xs py-2.5 px-3 rounded-xl border border-emerald-200 cursor-pointer transition-all flex items-center justify-center gap-2 text-center ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Uploading ke Cloudinary...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Upload Foto Toko (Cloudinary)</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    disabled={isUploading}
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                </label>

                <input
                  type="text"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="Atau Paste URL Gambar Foto..."
                  className="w-full bg-gray-50 text-xs rounded-xl px-3 py-2 border border-gray-200 focus:outline-none focus:border-[#063104] focus:bg-white"
                />
              </div>
            </div>

            {/* 2. JADWAL BUKA TOKO (OPERATIONAL HOURS) */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-700" />
                <span>Jadwal Operasional Buka Toko <span className="text-red-500">*</span></span>
              </label>
              <input
                type="text"
                required
                value={openingHours}
                onChange={(e) => setOpeningHours(e.target.value)}
                placeholder="e.g. Senin - Minggu (08.00 - 21.00 WIB)"
                className="w-full bg-gray-50 text-sm rounded-xl px-3.5 py-2.5 border border-gray-200 focus:outline-none focus:border-[#063104] focus:bg-white font-semibold text-gray-900"
              />
              <span className="text-[10px] text-gray-400 block mt-1">
                Contoh: Senin - Minggu (08.00 - 21.00 WIB) atau Setiap Hari (07.30 - 22.00 WIB)
              </span>
            </div>

            {/* Nama Toko */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Nama Toko <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Toko Organik Market Utama"
                className="w-full bg-gray-50 text-sm rounded-xl px-3.5 py-2.5 border border-gray-200 focus:outline-none focus:border-[#063104] focus:bg-white font-bold text-gray-900"
              />
            </div>

            {/* Nomor Telepon / WA */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Nomor Telepon / WhatsApp CS <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0812-xxxx-xxxx"
                  className="w-full bg-gray-50 text-sm rounded-xl pl-9 pr-3.5 py-2.5 border border-gray-200 focus:outline-none focus:border-[#063104] focus:bg-white font-semibold"
                />
                <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Deskripsi Toko */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Deskripsi Profil Toko
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Penjelasan singkat mengenai keunggulan toko organik Anda..."
                className="w-full bg-gray-50 text-sm rounded-xl px-3.5 py-2 border border-gray-200 focus:outline-none focus:border-[#063104] focus:bg-white leading-relaxed"
              />
            </div>

            {/* Alamat Lengkap Toko */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Alamat Fisik Toko Lengkap <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={2}
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Jl. Senopati No. 45, Kebayoran Baru, Jakarta Selatan..."
                className="w-full bg-gray-50 text-sm rounded-xl px-3.5 py-2 border border-gray-200 focus:outline-none focus:border-[#063104] focus:bg-white leading-relaxed"
              />
            </div>
          </div>

          {/* Right Side: Map Location Picker */}
          <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 pb-3 border-b border-gray-100 font-extrabold text-sm text-[#063104]">
                <MapPin className="w-5 h-5 text-emerald-700" />
                <span>Titik Koordinat Toko di Peta (Map)</span>
              </div>

              <div className="pt-3">
                <MapLocationPicker
                  initialLat={latitude}
                  initialLon={longitude}
                  initialAddress={address}
                  onLocationSelect={handleMapSelect}
                />
              </div>
            </div>

            {/* Active Store Coordinates Summary Badge */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 text-xs space-y-1 mt-4">
              <div className="flex items-center gap-1.5 text-[#063104] font-extrabold text-[11px]">
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Koordinat Toko Aktif:</span>
              </div>
              <p className="font-mono text-gray-800 text-[11px]">
                Lat: {latitude.toFixed(6)}, Lon: {longitude.toFixed(6)}
              </p>
              <p className="text-[10px] text-gray-500 pt-0.5">
                * Koordinat ini digunakan secara otomatis untuk menghitung estimasi jarak pengiriman ke pembeli pada checkout.
              </p>
            </div>
          </div>
        </div>

        {/* Save Actions Footer Bar */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center justify-between">
          <span className="text-xs text-gray-500 font-medium">
            Pastikan foto toko, jadwal operasional, dan lokasi peta sudah tepat sebelum menyimpan.
          </span>

          <button
            type="submit"
            className="bg-[#063104] hover:bg-[#084205] text-white font-black px-6 py-3 rounded-xl text-xs shadow-md transition-all active:scale-95 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Perubahan Profil Toko</span>
          </button>
        </div>
      </form>
    </div>
  );
};

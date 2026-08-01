import React, { useState, useEffect } from 'react';
import { Drawer, IconButton, Divider } from '@mui/material';
import {
  X,
  MapPin,
  Plus,
  ArrowLeft,
  Check,
  Building,
  Home,
  Briefcase,
  Pencil,
  Trash2,
  Loader2,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLocationStore } from '../store/useLocationStore';
import { useUserStore } from '../store/useUserStore';
import MapLocationPicker, { type MapLocationResult } from './MapLocationPicker';
import { fetchLivePostalCodes, type LivePostalCodeResult } from '../services/wilayahService';

// Zod Validation Schema for Address
const addressSchema = z.object({
  label: z.string().min(2, 'Label alamat wajib diisi (misal: Rumah/Kantor)'),
  fullName: z.string().min(3, 'Nama lengkap minimal 3 karakter'),
  phone: z
    .string()
    .min(9, 'Nomor telepon minimal 9 digit')
    .regex(/^[0-9+-\s]+$/, 'Format nomor telepon tidak valid'),
  province: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  village: z.string().optional(),
  postalCode: z.string().optional(),
  streetAddress: z.string().min(5, 'Nama jalan, gedung, & no. rumah wajib diisi'),
  landmark: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

type AddressFormData = z.infer<typeof addressSchema>;

export const LocationDrawer: React.FC = () => {
  const { profile, isLoggedIn } = useUserStore();
  const {
    addresses,
    selectedAddressId,
    isLocationDrawerOpen,
    closeLocationDrawer,
    viewMode,
    setViewMode,
    editingAddressId,
    setEditingAddress,
    selectAddress,
    addAddress,
    updateAddress,
    deleteAddress,
    fetchAddresses,
  } = useLocationStore();

  const userIdentifier = profile.id || profile.phone || (isLoggedIn ? profile.fullName : undefined);

  useEffect(() => {
    if (isLocationDrawerOpen) {
      fetchAddresses(userIdentifier);
    }
  }, [isLocationDrawerOpen, userIdentifier, fetchAddresses]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      label: 'Rumah',
      fullName: '',
      phone: '',
      province: '',
      city: '',
      district: '',
      village: '',
      postalCode: '',
      streetAddress: '',
      landmark: '',
      latitude: undefined,
      longitude: undefined,
    },
  });

  const watchedLat = watch('latitude');
  const watchedLon = watch('longitude');
  const watchedPostalCode = watch('postalCode');
  const watchedVillage = watch('village');

  // Dynamic Village Dropdown options loaded from kodepos.vercel.app API
  const [villageOptions, setVillageOptions] = useState<LivePostalCodeResult[]>([]);
  const [isLoadingVillages, setIsLoadingVillages] = useState<boolean>(false);

  // Fetch village options whenever postal code changes
  useEffect(() => {
    if (watchedPostalCode && watchedPostalCode.trim().length >= 3) {
      setIsLoadingVillages(true);
      fetchLivePostalCodes(watchedPostalCode)
        .then((res) => {
          setVillageOptions(res);
          setIsLoadingVillages(false);
        })
        .catch(() => {
          setVillageOptions([]);
          setIsLoadingVillages(false);
        });
    } else {
      setVillageOptions([]);
    }
  }, [watchedPostalCode]);

  // Populate form when editing an address
  useEffect(() => {
    if (viewMode === 'edit' && editingAddressId) {
      const target = addresses.find((a) => a.id === editingAddressId);
      if (target) {
        setValue('label', target.label);
        setValue('fullName', target.fullName);
        setValue('phone', target.phone);
        setValue('province', target.province);
        setValue('city', target.city);
        setValue('district', target.district);
        setValue('village', target.village || '');
        setValue('postalCode', target.postalCode);
        setValue('streetAddress', target.streetAddress);
        setValue('landmark', target.landmark || '');
        setValue('latitude', target.latitude);
        setValue('longitude', target.longitude);
      }
    }
  }, [viewMode, editingAddressId, addresses, setValue]);

  const handleEditClick = (e: React.MouseEvent, addressId: string) => {
    e.stopPropagation();
    setEditingAddress(addressId);
  };

  const handleDeleteClick = (e: React.MouseEvent, addressId: string) => {
    e.stopPropagation();
    if (window.confirm('Apakah Anda yakin ingin menghapus alamat ini?')) {
      deleteAddress(addressId);
    }
  };

  // Callback from MapLocationPicker
  const handleMapLocationSelect = (result: MapLocationResult) => {
    setValue('latitude', result.lat);
    setValue('longitude', result.lon);
    setValue('province', result.province);
    setValue('city', result.city);
    setValue('district', result.district);
    setValue('village', result.village);
    setValue('postalCode', result.postalCode);

    // Trigger village options fetch if postal code exists
    if (result.postalCode) {
      fetchLivePostalCodes(result.postalCode).then((res) => {
        setVillageOptions(res);
      });
    }
  };

  const onFormSubmit = async (data: AddressFormData) => {
    const finalData = {
      userId: userIdentifier || profile.phone || profile.id,
      label: data.label,
      fullName: data.fullName,
      phone: data.phone,
      province: data.province || '',
      city: data.city || '',
      district: data.district || '',
      village: data.village || '',
      postalCode: data.postalCode || '',
      streetAddress: data.streetAddress,
      landmark: data.landmark,
      latitude: data.latitude,
      longitude: data.longitude,
    };

    if (viewMode === 'edit' && editingAddressId) {
      await updateAddress(editingAddressId, finalData);
    } else {
      await addAddress(finalData);
    }
    reset();
    setEditingAddress(null);
    setViewMode('list');
  };

  const getLabelIcon = (label: string) => {
    const l = label.toLowerCase();
    if (l.includes('rumah')) return <Home className="w-4 h-4" />;
    if (l.includes('kantor')) return <Briefcase className="w-4 h-4" />;
    return <Building className="w-4 h-4" />;
  };

  return (
    <Drawer
      anchor="right"
      open={isLocationDrawerOpen}
      onClose={closeLocationDrawer}
      sx={{ zIndex: 1400 }}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100%', sm: '460px' },
            backgroundColor: '#F9F8F6',
            p: 2.5,
            display: 'flex',
            flexDirection: 'column',
          },
        },
      }}
    >
      {/* Drawer Header */}
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          {viewMode !== 'list' ? (
            <IconButton
              onClick={() => {
                setEditingAddress(null);
                setViewMode('list');
              }}
              size="small"
              className="mr-1 text-gray-700"
            >
              <ArrowLeft className="w-5 h-5" />
            </IconButton>
          ) : (
            <MapPin className="w-5 h-5 text-[#063104]" />
          )}
          <h2 className="font-bold text-gray-900 text-lg">
            {viewMode === 'list'
              ? 'Pilih Alamat Pengiriman'
              : viewMode === 'edit'
                ? 'Ubah Alamat'
                : 'Tambah Alamat Baru'}
          </h2>
        </div>
        <IconButton onClick={closeLocationDrawer} size="small">
          <X className="w-5 h-5" />
        </IconButton>
      </div>

      <Divider className="my-1" />

      {/* VIEW MODE 1: LIST OF SAVED ADDRESSES */}
      {viewMode === 'list' && (
        <div className="flex-1 flex flex-col justify-between overflow-hidden pt-2">
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {addresses.length === 0 ? (
              <div className="text-center py-10 space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-50 text-[#77a160] flex items-center justify-center mx-auto">
                  <MapPin className="w-7 h-7" />
                </div>
                <p className="text-sm font-semibold text-gray-700">
                  Belum ada alamat tersimpan
                </p>
                <p className="text-xs text-gray-400 max-w-xs mx-auto">
                  Tambahkan alamat pengiriman untuk mempermudah pengantaran belanjaan Anda.
                </p>
              </div>
            ) : (
              addresses.map((addr) => {
                const isSelected = addr.id === selectedAddressId;
                return (
                  <div
                    key={addr.id}
                    onClick={() => selectAddress(addr.id)}
                    className={`relative p-4 rounded-2xl border transition-all duration-200 cursor-pointer group ${isSelected
                      ? 'bg-white border-[#063104] shadow-md ring-1 ring-[#063104]'
                      : 'bg-white border-gray-200 hover:border-[#77a160] shadow-xs'
                      }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5 bg-emerald-50 text-[#063104] px-2.5 py-1 rounded-lg text-xs font-bold">
                        {getLabelIcon(addr.label)}
                        <span>{addr.label}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {isSelected && (
                          <span className="bg-[#063104] text-white text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Check className="w-3 h-3 stroke-[3]" /> Terpilih
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={(e) => handleEditClick(e, addr.id)}
                          className="p-1 rounded-lg bg-gray-100 hover:bg-[#063104] hover:text-white text-gray-700 transition-colors"
                          title="Ubah Alamat"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        {addresses.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => handleDeleteClick(e, addr.id)}
                            className="p-1 rounded-lg bg-gray-100 hover:bg-red-600 hover:text-white text-gray-700 transition-colors"
                            title="Hapus Alamat"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <h3 className="font-bold text-gray-900 text-sm">
                      {addr.fullName}{' '}
                      <span className="font-normal text-gray-500 text-xs">
                        ({addr.phone})
                      </span>
                    </h3>

                    <p className="text-xs text-gray-700 mt-1 leading-relaxed">
                      {addr.streetAddress}, {addr.village ? ` ${addr.village}, ` : ''}{addr.district ? `Kec. ${addr.district}, ` : ''}{addr.city},{' '}
                      {addr.province} {addr.postalCode}
                    </p>

                    {addr.landmark && (
                      <p className="text-[11px] text-gray-400 mt-1 italic">
                        Patokan: {addr.landmark}
                      </p>
                    )}

                    {addr.latitude && addr.longitude && (
                      <p className="text-[10px] text-gray-400 mt-1 font-mono">
                        {addr.latitude.toFixed(6)}, {addr.longitude.toFixed(6)}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-3 mt-auto">
            <button
              type="button"
              onClick={() => {
                reset({
                  label: 'Rumah',
                  fullName: '',
                  phone: '',
                  province: '',
                  city: '',
                  district: '',
                  village: '',
                  postalCode: '',
                  streetAddress: '',
                  landmark: '',
                  latitude: undefined,
                  longitude: undefined,
                });
                setVillageOptions([]);
                setEditingAddress(null);
                setViewMode('add');
              }}
              className="w-full bg-[#063104] hover:bg-[#084205] text-white font-bold py-3.5 rounded-2xl shadow-md active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-sm focus:outline-none"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Tambah Alamat Baru</span>
            </button>
          </div>
        </div>
      )}

      {/* VIEW MODE 2 & 3: ADD OR EDIT ADDRESS FORM */}
      {(viewMode === 'add' || viewMode === 'edit') && (
        <form
          onSubmit={handleSubmit(onFormSubmit)}
          className="flex-1 flex flex-col justify-between overflow-hidden pt-2"
        >
          <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 pb-4">
            {/* Label Alamat */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Label Alamat
              </label>
              <div className="flex gap-2 mb-2">
                {['Rumah', 'Kantor', 'Apartemen'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setValue('label', preset)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all ${watch('label') === preset
                      ? 'bg-[#063104] text-white border-[#063104] shadow-xs'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    {preset === 'Rumah' && '🏡 '}
                    {preset === 'Kantor' && '🏢 '}
                    {preset === 'Apartemen' && '🏢 '}
                    {preset}
                  </button>
                ))}
              </div>
              <input
                type="text"
                {...register('label')}
                placeholder="misal: Rumah, Kantor, Apartemen"
                className="w-full bg-white text-sm rounded-xl px-3.5 py-2.5 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#063104]/20 focus:border-[#063104]"
              />
              {errors.label && (
                <p className="text-red-500 text-[11px] mt-0.5">{errors.label.message}</p>
              )}
            </div>

            {/* Nama Lengkap & Phone Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Nama Lengkap Penerima
                </label>
                <input
                  type="text"
                  {...register('fullName')}
                  placeholder="Nama Lengkap"
                  className="w-full bg-white text-sm rounded-xl px-3.5 py-2.5 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#063104]/20 focus:border-[#063104]"
                />
                {errors.fullName && (
                  <p className="text-red-500 text-[11px] mt-0.5">
                    {errors.fullName.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Nomor Telepon
                </label>
                <input
                  type="text"
                  {...register('phone')}
                  placeholder="08xxxxxxxxxx"
                  className="w-full bg-white text-sm rounded-xl px-3.5 py-2.5 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#063104]/20 focus:border-[#063104]"
                />
                {errors.phone && (
                  <p className="text-red-500 text-[11px] mt-0.5">
                    {errors.phone.message}
                  </p>
                )}
              </div>
            </div>

            {/* MAP-BASED LOCATION PICKER */}
            <div className="pt-2 border-t border-gray-200/60">
              <label className="block text-xs font-extrabold text-[#063104] uppercase tracking-wider mb-2">
                Pilih Lokasi di Peta
              </label>

              <MapLocationPicker
                initialLat={watchedLat}
                initialLon={watchedLon}
                initialAddress={
                  viewMode === 'edit' && editingAddressId
                    ? addresses.find((a) => a.id === editingAddressId)?.streetAddress
                    : undefined
                }
                onLocationSelect={handleMapLocationSelect}
              />
            </div>

            {/* Detail Lokasi Wilayah (Full Spaced Grid & Dynamic Village Dropdown from API Kode Pos) */}
            <div className="space-y-3.5 pt-2 border-t border-gray-200/60">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-[#063104] uppercase tracking-wider block">
                  Wilayah Alamat
                </span>
              </div>

              {/* Row 1: Provinsi & Kota/Kabupaten */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Provinsi
                  </label>
                  <input
                    type="text"
                    {...register('province')}
                    placeholder="DKI Jakarta"
                    className="w-full bg-white text-xs rounded-xl px-3 py-2.5 border border-gray-200 focus:outline-none focus:border-[#063104] focus:ring-1 focus:ring-[#063104]/20"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Kota / Kabupaten
                  </label>
                  <input
                    type="text"
                    {...register('city')}
                    placeholder="Jakarta Selatan"
                    className="w-full bg-white text-xs rounded-xl px-3 py-2.5 border border-gray-200 focus:outline-none focus:border-[#063104] focus:ring-1 focus:ring-[#063104]/20"
                  />
                </div>
              </div>

              {/* Row 2: Kecamatan & Kode Pos */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Kecamatan
                  </label>
                  <input
                    type="text"
                    {...register('district')}
                    placeholder="Kebayoran Baru"
                    className="w-full bg-white text-xs rounded-xl px-3 py-2.5 border border-gray-200 focus:outline-none focus:border-[#063104] focus:ring-1 focus:ring-[#063104]/20"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Kode Pos
                  </label>
                  <input
                    type="text"
                    {...register('postalCode')}
                    placeholder="12190"
                    className="w-full bg-white text-xs rounded-xl px-3 py-2.5 border border-gray-200 focus:outline-none focus:border-[#063104] focus:ring-1 focus:ring-[#063104]/20"
                  />
                </div>
              </div>

              {/* Row 3: Desa / Kelurahan (Full Width Dropdown / Input) */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1 flex items-center justify-between">
                  <span>Desa / Kelurahan</span>
                  {isLoadingVillages && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#063104]" />}
                </label>

                {villageOptions.length > 0 ? (
                  <div className="relative">
                    <select
                      value={watchedVillage || ''}
                      onChange={(e) => {
                        const selectedVal = e.target.value;
                        setValue('village', selectedVal);
                        const match = villageOptions.find((v) => v.village.toLowerCase() === selectedVal.toLowerCase());
                        if (match) {
                          if (match.district) setValue('district', match.district);
                          if (match.regency) setValue('city', match.regency);
                          if (match.province) setValue('province', match.province);
                        }
                      }}
                      className="w-full bg-white text-xs rounded-xl px-3 py-2.5 border border-gray-200 focus:outline-none focus:border-[#063104] focus:ring-1 focus:ring-[#063104]/20"
                    >
                      {watchedVillage && !villageOptions.some((opt) => opt.village.toLowerCase() === watchedVillage.toLowerCase()) && (
                        <option value={watchedVillage}> {watchedVillage}</option>
                      )}
                      {villageOptions.map((opt, idx) => (
                        <option key={`${opt.village}-${idx}`} value={opt.village}>
                          {opt.village}
                        </option>
                      ))}
                    </select>

                  </div>
                ) : (
                  <input
                    type="text"
                    {...register('village')}
                    placeholder="Senopati"
                    className="w-full bg-white text-xs rounded-xl px-3 py-2.5 border border-gray-200 focus:outline-none focus:border-[#063104] focus:ring-1 focus:ring-[#063104]/20"
                  />
                )}
              </div>
            </div>

            {/* Deskripsi Alamat & Detail Lainnya */}
            <div className="space-y-3 pt-1 border-t border-gray-200/60">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Deskripsi Alamat (Nama Jalan, Gedung, No. Rumah)
                </label>
                <textarea
                  rows={2}
                  {...register('streetAddress')}
                  placeholder="Jl. Sudirman No. 123, Blok A, RT 01/RW 02..."
                  className="w-full bg-white text-sm rounded-xl px-3.5 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#063104]/20 focus:border-[#063104]"
                />
                {errors.streetAddress && (
                  <p className="text-red-500 text-[11px] mt-0.5">
                    {errors.streetAddress.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Detail Lainnya (Patokan - Opsional)
                </label>
                <input
                  type="text"
                  {...register('landmark')}
                  placeholder="misal: Depan toko warung kelontong cat hijau"
                  className="w-full bg-white text-sm rounded-xl px-3.5 py-2.5 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#063104]/20 focus:border-[#063104]"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-3 border-t border-gray-200/80">
            <button
              type="submit"
              className="w-full bg-[#063104] hover:bg-[#084205] text-white font-bold py-3.5 rounded-2xl shadow-md active:scale-[0.99] transition-all flex items-center justify-center text-sm focus:outline-none"
            >
              {viewMode === 'edit' ? 'Simpan Perubahan' : 'Simpan & Gunakan Alamat Ini'}
            </button>
          </div>
        </form>
      )}
    </Drawer>
  );
};

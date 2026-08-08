import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  MapPin,
  Clock,
  Star,
  Pencil,
  Trash2,
  X,
  Sparkles,
  UserCheck,
  Building2,
  CheckCircle2,
  XCircle,
  Clock3,
  Check,
} from 'lucide-react';
import {
  useStoreSelectorStore,
  type RegisteredStore,
} from '../../store-location/store/useStoreSelectorStore';
import { useAdminStore } from '../store/useAdminStore';
import MapLocationPicker, { type MapLocationResult } from '../../store-location/components/MapLocationPicker';
import { CardsGridSkeleton } from '../../../components/common/AdminSkeletons';
import { API_BASE_URL } from '../../../config/api';

export interface PendingStoreApplication {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  storeName: string;
  address: string;
  city: string;
  phone: string;
  operatingHours: string;
  description?: string;
  createdAt: string;
}

export const StoresManagementView: React.FC = () => {
  const { stores, setSelectedStoreId } = useStoreSelectorStore();
  const { users, showToast, isLoadingData } = useAdminStore();

  const [activeTab, setActiveTab] = useState<'stores' | 'pending'>('stores');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [storeToEdit, setStoreToEdit] = useState<RegisteredStore | null>(null);

  // Pending Store Applications
  const [pendingApps, setPendingApps] = useState<PendingStoreApplication[]>([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [image, setImage] = useState('');
  const [openingHours, setOpeningHours] = useState('');
  const [latitude, setLatitude] = useState(-6.225);
  const [longitude, setLongitude] = useState(106.8);

  const API_REGISTRATION_BASE = `${API_BASE_URL}/store-registrations`;

  useEffect(() => {
    fetchPendingApplications();
  }, []);

  const fetchPendingApplications = async () => {
    setLoadingPending(true);
    try {
      const res = await fetch(`${API_REGISTRATION_BASE}/pending`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setPendingApps(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch pending store applications:', err);
    } finally {
      setLoadingPending(false);
    }
  };

  const handleApprove = async (appId: string, storeName: string) => {
    if (!window.confirm(`Setujui pengajuan toko "${storeName}" dan angkat pemohon menjadi Admin Toko?`)) {
      return;
    }

    setProcessingId(appId);
    try {
      const res = await fetch(`${API_REGISTRATION_BASE}/approve/${appId}`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Gagal menyetujui toko.');
      }

      showToast(`Pengajuan toko "${storeName}" berhasil disetujui! Toko aktif & pengguna di-upgrade.`);

      // Update local store selector list if newStore returned
      if (data.data && data.data.newStore) {
        const ns = data.data.newStore;
        stores.push({
          id: ns.id,
          name: ns.name,
          city: ns.city,
          address: ns.address,
          description: ns.description || 'Cabang resmi WaroengKita.',
          phone: ns.phone,
          image: ns.coverImage,
          openingHours: ns.operatingHours,
          latitude: ns.latitude,
          longitude: ns.longitude,
          rating: ns.rating || 0,
        });
      }

      fetchPendingApplications();
    } catch (err: any) {
      alert(err.message || 'Gagal memproses persetujuan.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (appId: string, storeName: string) => {
    const reason = window.prompt(`Alasan penolakan pengajuan toko "${storeName}":`, 'Tidak memenuhi kriteria lokasi/alamat.');
    if (reason === null) return; // user cancelled prompt

    setProcessingId(appId);
    try {
      const res = await fetch(`${API_REGISTRATION_BASE}/reject/${appId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectionReason: reason }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Gagal menolak toko.');
      }

      showToast(`Pengajuan toko "${storeName}" telah ditolak.`);
      fetchPendingApplications();
    } catch (err: any) {
      alert(err.message || 'Gagal memproses penolakan.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleOpenAdd = () => {
    setStoreToEdit(null);
    setName('');
    setCity('Jakarta Selatan');
    setAddress('');
    setDescription('Pusat belanja berbagai produk pilihan berkualitas tinggi.');
    setPhone('0812-3456-7890');
    setImage('https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80');
    setOpeningHours('Buka • 08.00 - 21.00 WIB');
    setLatitude(-6.225);
    setLongitude(106.8);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (st: RegisteredStore) => {
    setStoreToEdit(st);
    setName(st.name);
    setCity(st.city);
    setAddress(st.address);
    setDescription(st.description);
    setPhone(st.phone);
    setImage(st.image);
    setOpeningHours(st.openingHours);
    setLatitude(st.latitude);
    setLongitude(st.longitude);
    setIsModalOpen(true);
  };

  const handleMapSelect = (result: MapLocationResult) => {
    setLatitude(result.lat);
    setLongitude(result.lon);
    if (result.displayName) {
      setAddress(result.displayName);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (storeToEdit) {
      const idx = stores.findIndex((s) => s.id === storeToEdit.id);
      if (idx !== -1) {
        stores[idx] = {
          ...storeToEdit,
          name: name.trim(),
          city: city.trim() || 'Jakarta',
          address: address.trim(),
          description: description.trim(),
          phone: phone.trim(),
          image: image.trim(),
          openingHours: openingHours.trim(),
          latitude,
          longitude,
        };
        showToast(`Data cabang toko "${name}" berhasil diperbarui!`);
      }
    } else {
      const newStore: RegisteredStore = {
        id: `store-${Date.now()}`,
        name: name.trim(),
        city: city.trim() || 'Jakarta',
        address: address.trim(),
        description: description.trim(),
        phone: phone.trim(),
        image:
          image.trim() ||
          '',
        openingHours: openingHours.trim() || '',
        latitude,
        longitude,
        rating: 0,
      };
      stores.push(newStore);
      showToast(`Cabang toko baru "${name}" berhasil ditambahkan!`);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string, storeName: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus cabang toko "${storeName}"?`)) {
      const idx = stores.findIndex((s) => s.id === id);
      if (idx !== -1) {
        stores.splice(idx, 1);
        showToast(`Cabang toko "${storeName}" berhasil dihapus.`);
      }
    }
  };

  const filteredStores = stores.filter((st) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      st.name.toLowerCase().includes(q) ||
      st.city.toLowerCase().includes(q) ||
      st.address.toLowerCase().includes(q)
    );
  });

  if (isLoadingData) {
    return <CardsGridSkeleton items={6} />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="hidden md:block">
          <h1 className="text-2xl font-black text-gray-900">Manajemen Cabang Toko (Stores)</h1>
          <p className="text-xs text-gray-500">
            Kelola cabang-cabang lokasi toko fisik resmi, persetujuan pengajuan toko baru, dan penugasan admin.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="bg-[#063104] hover:bg-[#084205] text-white font-extrabold px-4 py-2.5 md:px-4.5 md:py-3 rounded-2xl text-xs shadow-lg hover:shadow-emerald-900/20 transition-all duration-200 flex items-center gap-2 md:gap-2.5 shrink-0 active:scale-95 border border-emerald-900/30 cursor-pointer self-start sm:self-auto"
        >
          <div className="w-5 h-5 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
          </div>
          <span>Tambah Toko</span>
        </button>
      </div>

      {/* Tabs Bar: Daftar Toko Aktif vs Pengajuan Pending */}
      <div className="flex bg-gray-200/70 p-1 md:p-1.5 rounded-2xl w-full md:w-fit gap-1 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab('stores')}
          className={`px-3 md:px-4 py-1.5 md:py-2 text-[11px] md:text-xs font-extrabold rounded-xl transition flex items-center gap-1.5 md:gap-2 whitespace-nowrap ${activeTab === 'stores'
            ? 'bg-[#063104] text-white shadow-sm'
            : 'text-gray-700 hover:text-gray-900'
            }`}
        >
          <Building2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
          <span>Toko Aktif ({stores.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('pending');
            fetchPendingApplications();
          }}
          className={`px-3 md:px-4 py-1.5 md:py-2 text-[11px] md:text-xs font-extrabold rounded-xl transition flex items-center gap-1.5 md:gap-2 relative whitespace-nowrap ${activeTab === 'pending'
            ? 'bg-[#063104] text-white shadow-sm'
            : 'text-gray-700 hover:text-gray-900'
            }`}
        >
          <Clock3 className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-400" />
          <span>Pengajuan Baru</span>
          {pendingApps.length > 0 && (
            <span className="bg-amber-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full animate-pulse">
              {pendingApps.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB CONTENT A: DAFTAR CABANG TOKO AKTIF */}
      {activeTab === 'stores' && (
        <div className="space-y-5 md:space-y-6">
          <div className="bg-white rounded-2xl md:rounded-3xl p-3 md:p-4 border border-gray-100 shadow-sm flex items-center justify-between gap-3 md:gap-4">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari cabang toko..."
                className="w-full bg-gray-50 text-xs rounded-xl py-2.5 pl-9 pr-3 border border-gray-200 focus:outline-none focus:border-[#063104] focus:bg-white font-medium"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            <span className="text-[10px] md:text-xs font-bold text-gray-500 shrink-0">
              <strong className="text-[#063104]">{filteredStores.length}</strong> Toko
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {filteredStores.map((st) => {
              const assignedAdmin = users.find((u) => u.assignedStoreId === st.id);

              return (
                <div
                  key={st.id}
                  className="bg-white rounded-2xl md:rounded-3xl overflow-hidden border border-gray-200/80 hover:border-[#77a160] shadow-sm transition-all duration-200 flex flex-col justify-between"
                >
                  <div>
                    <div className="relative h-36 md:h-48 w-full bg-gray-100 overflow-hidden">
                      <img src={st.image} alt={st.name} className="w-full h-full object-cover" />

                      <div className="absolute top-2.5 left-2.5 md:top-3 md:left-3 bg-black/70 backdrop-blur-sm text-white font-extrabold text-[10px] md:text-xs px-2.5 py-0.5 md:px-3 md:py-1 rounded-full flex items-center gap-1">
                        <Star className="w-3 h-3 md:w-3.5 md:h-3.5 fill-yellow-400 text-yellow-400" />
                        <span>{st.rating}</span>
                      </div>

                      <div className="absolute top-2.5 right-2.5 md:top-3 md:right-3 bg-[#063104] text-white font-extrabold text-[10px] md:text-[11px] px-2.5 py-0.5 md:px-3 md:py-1 rounded-full flex items-center gap-1 shadow-sm">
                        <Building2 className="w-3 h-3 md:w-3.5 md:h-3.5 text-[#C8956A]" />
                        <span>{st.city}</span>
                      </div>
                    </div>

                    <div className="p-4 md:p-5 space-y-2.5 md:space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-extrabold text-gray-900 text-sm md:text-base">{st.name}</h3>
                          <p className="text-[10px] md:text-xs text-gray-500 font-bold flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3 md:w-3.5 md:h-3.5 text-emerald-700" />
                            <span>{st.openingHours}</span>
                          </p>
                        </div>
                      </div>

                      <p className="text-[10px] md:text-xs text-gray-600 leading-relaxed line-clamp-2">{st.description}</p>

                      <div className="p-2.5 md:p-3 rounded-xl md:rounded-2xl bg-gray-50 border border-gray-100 text-[10px] md:text-xs text-gray-700 space-y-0.5 md:space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-gray-900">
                          <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-700 shrink-0" />
                          <span className="line-clamp-1">{st.address}</span>
                        </div>
                        <p className="text-[9px] md:text-[11px] font-mono text-gray-500 pl-5">
                          {st.latitude.toFixed(4)}, {st.longitude.toFixed(4)}
                        </p>
                      </div>

                      <div className="p-2.5 md:p-3 rounded-xl md:rounded-2xl bg-blue-50/80 border border-blue-200 text-[10px] md:text-xs flex items-center justify-between">
                        <div className="flex items-center gap-1.5 md:gap-2">
                          <UserCheck className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-700" />
                          <div>
                            <span className="text-[9px] md:text-[10px] text-blue-800 font-bold block">Admin:</span>
                            <span className="font-extrabold text-blue-950 text-[10px] md:text-xs">
                              {assignedAdmin ? assignedAdmin.name : 'Belum Ditugaskan'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="px-5 py-3.5 bg-[#F9F8F6] border-t border-gray-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setSelectedStoreId(st.id)}
                      className="text-xs font-extrabold text-[#063104] hover:underline flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-4 h-4 text-[#063104]" />
                      <span>Pilih Cabang Ini</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(st)}
                        className="p-2 rounded-xl bg-white hover:bg-[#063104] hover:text-white border border-gray-200 text-gray-700 transition-colors"
                        title="Edit Toko"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(st.id, st.name)}
                        className="p-2 rounded-xl bg-white hover:bg-red-600 hover:text-white border border-gray-200 text-gray-700 transition-colors"
                        title="Hapus Toko"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB CONTENT B: PENGAJUAN TOKO PENDING APPROVAL */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 border border-amber-200/80 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
                <Clock3 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-amber-950 text-sm">
                  Pengajuan Pendaftaran Toko Menunggu Persetujuan ({pendingApps.length})
                </h4>
                <p className="text-xs text-amber-800">
                  Superadmin dapat meninjau data toko dan menyetujui pemohon untuk menjadi Admin Toko Cabang.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={fetchPendingApplications}
              className="text-xs font-bold text-amber-900 hover:underline px-3 py-1.5 bg-amber-100 rounded-lg border border-amber-300"
            >
              Refresh Data
            </button>
          </div>

          {loadingPending ? (
            <div className="py-12 text-center text-xs text-gray-500 font-medium">
              Memuat daftar pengajuan toko...
            </div>
          ) : pendingApps.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 space-y-2">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <h4 className="font-bold text-gray-800 text-base">Tidak Ada Pengajuan Menunggu</h4>
              <p className="text-xs text-gray-500">
                Semua pengajuan pendaftaran toko telah diproses oleh Superadmin.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingApps.map((app) => (
                <div
                  key={app.id}
                  className="bg-white rounded-3xl p-5 border border-amber-200 shadow-xs hover:shadow-md transition space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2 border-b border-gray-100 pb-3">
                      <div>
                        <span className="bg-amber-100 text-amber-900 font-black text-[10px] uppercase px-2.5 py-0.5 rounded-md border border-amber-300">
                          PENDING APPROVAL
                        </span>
                        <h3 className="font-extrabold text-gray-900 text-base mt-1">
                          {app.storeName}
                        </h3>
                        <p className="text-xs text-gray-500 font-medium">
                          Kota: <strong className="text-gray-800">{app.city}</strong> • Jam:{' '}
                          {app.operatingHours}
                        </p>
                      </div>
                      <span className="text-[10px] text-gray-400 font-mono shrink-0">
                        {new Date(app.createdAt).toLocaleDateString('id-ID')}
                      </span>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-2xl space-y-1 text-xs">
                      <div className="font-bold text-gray-900 flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span>{app.address}</span>
                      </div>
                      {app.description && (
                        <p className="text-gray-600 text-[11px] italic pl-5.5">
                          "{app.description}"
                        </p>
                      )}
                    </div>

                    <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-2xl text-xs space-y-1">
                      <span className="text-[10px] font-extrabold text-blue-900 uppercase block">
                        PEMOHON (USER CUSTOMER):
                      </span>
                      <div className="font-bold text-blue-950 flex items-center justify-between">
                        <span>👤 {app.userName}</span>
                        <span>📞 {app.userPhone}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center gap-2 border-t border-gray-100">
                    <button
                      type="button"
                      disabled={processingId === app.id}
                      onClick={() => handleApprove(app.id, app.storeName)}
                      className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      <span>Setujui (Approve Toko)</span>
                    </button>

                    <button
                      type="button"
                      disabled={processingId === app.id}
                      onClick={() => handleReject(app.id, app.storeName)}
                      className="py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition flex items-center gap-1 disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Tolak</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Store Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-[3000] bg-black/60 flex items-end md:items-center justify-center md:p-4 overflow-y-auto animate-fade-in"
          style={{ backdropFilter: 'blur(4px)' }}
        >
          <div className="bg-white rounded-t-3xl md:rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl border border-gray-100 flex flex-col md:my-auto max-h-[92vh] md:max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-[#F9F8F6] shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#063104]" />
                <h3 className="font-extrabold text-gray-900 text-lg">
                  {storeToEdit ? 'Edit Cabang Toko' : 'Tambah Cabang Toko Baru'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-gray-200 text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Details */}
                <div className="lg:col-span-6 space-y-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Nama Toko Cabang *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. WaroengKita BSD City"
                      className="w-full bg-gray-50 text-sm rounded-xl px-3.5 py-2.5 border border-gray-200 focus:outline-none focus:border-[#063104] font-extrabold text-gray-900"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Kota / Wilayah *</label>
                      <input
                        type="text"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Jakarta Selatan"
                        className="w-full bg-gray-50 text-xs rounded-xl px-3 py-2 border border-gray-200 focus:outline-none focus:border-[#063104] font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Nomor Telepon CS *</label>
                      <input
                        type="text"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="0812-xxxx-xxxx"
                        className="w-full bg-gray-50 text-xs rounded-xl px-3 py-2 border border-gray-200 focus:outline-none focus:border-[#063104] font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Jam Operasional *</label>
                    <input
                      type="text"
                      required
                      value={openingHours}
                      onChange={(e) => setOpeningHours(e.target.value)}
                      placeholder="Buka • 08.00 - 21.00 WIB"
                      className="w-full bg-gray-50 text-xs rounded-xl px-3.5 py-2 border border-gray-200 focus:outline-none focus:border-[#063104] font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Foto Cover Toko (URL)</label>
                    <input
                      type="text"
                      required
                      value={image}
                      onChange={(e) => setImage(e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-gray-50 text-xs rounded-xl px-3.5 py-2 border border-gray-200 focus:outline-none focus:border-[#063104]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Deskripsi Singkat</label>
                    <textarea
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Keunggulan cabang toko..."
                      className="w-full bg-gray-50 text-xs rounded-xl px-3.5 py-2 border border-gray-200 focus:outline-none focus:border-[#063104]"
                    />
                  </div>
                </div>

                {/* Right Column: Map Location Picker */}
                <div className="lg:col-span-6 space-y-3">
                  <label className="block font-bold text-[#063104]">Lokasi Peta & Koordinat Cabang</label>
                  <MapLocationPicker
                    initialLat={latitude}
                    initialLon={longitude}
                    initialAddress={address}
                    onLocationSelect={handleMapSelect}
                  />
                  <div className="p-3 bg-emerald-50 rounded-2xl text-[11px] text-[#063104] font-semibold">
                    Lat: {latitude.toFixed(6)}, Lon: {longitude.toFixed(6)}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-white text-[#063104] border border-[#063104] font-bold px-5 py-2.5 rounded-xl text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-[#063104] hover:bg-[#084205] text-white font-extrabold px-5 py-2.5 rounded-xl text-xs shadow-md"
                >
                  Simpan Cabang Toko
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

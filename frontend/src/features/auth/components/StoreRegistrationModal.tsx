import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, IconButton } from '@mui/material';
import {
  X,
  Store,
  Building2,
  AlertCircle,
  Clock3,
  ArrowRight,
} from 'lucide-react';
import type { UserProfile } from '../store/useUserStore';
import { useLocationStore } from '../../store-location/store/useLocationStore';
import { API_BASE_URL } from '../../../config/api';

interface StoreRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
}

export interface StoreApplicationData {
  id: string;
  storeName: string;
  ownerName?: string;
  address: string;
  city: string;
  phone: string;
  operatingHours: string;
  description?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  createdAt: string;
}

export const StoreRegistrationModal: React.FC<StoreRegistrationModalProps> = ({
  isOpen,
  onClose,
  profile,
}) => {
  const { showToast } = useLocationStore();
  const [storeName, setStoreName] = useState('');
  const [ownerName, setOwnerName] = useState(profile.fullName || '');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState(profile.phone || '');
  const [operatingHours, setOperatingHours] = useState('');
  const [description, setDescription] = useState('');

  const [loading, setLoading] = useState(false);
  const [fetchingStatus, setFetchingStatus] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [myApplication, setMyApplication] = useState<StoreApplicationData | null>(null);

  const API_BASE = `${API_BASE_URL}/store-registrations`;

  // Check if user already submitted an application
  useEffect(() => {
    if (isOpen && profile.id) {
      fetchMyApplication();
    }
  }, [isOpen, profile.id]);

  const fetchMyApplication = async () => {
    if (!profile.id) return;
    setFetchingStatus(true);
    try {
      const res = await fetch(`${API_BASE}/my-application?userId=${profile.id}`);
      const data = await res.json();
      if (data.success && data.data) {
        setMyApplication(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch my store application:', err);
    } finally {
      setFetchingStatus(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile.id) {
      setErrorMsg('Anda harus login terlebih dahulu.');
      return;
    }

    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: profile.id,
          storeName,
          city,
          address,
          phone,
          operatingHours,
          description,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Gagal mengajukan pendaftaran toko.');
      }

      setMyApplication(data.data);
      showToast('Pengajuan toko berhasil dikirim ke Superadmin!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          style: {
            borderRadius: '24px',
            overflow: 'hidden',
            padding: 0,
          },
        },
      }}
    >
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-[#063104] to-teal-900 p-6 text-white relative">
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', right: 12, top: 12, color: 'white' }}
        >
          <X className="w-5 h-5" />
        </IconButton>

        <div className="flex items-center space-x-3 mb-1">
          <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 text-emerald-300">
            <Store className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold tracking-tight flex items-center gap-2">
              Buka Toko Cabang Saya 🛒
            </h2>
            <p className="text-xs text-emerald-200 font-medium">
              Daftarkan cabang toko Anda & kelola jualan di WaroengKita
            </p>
          </div>
        </div>
      </div>

      <DialogContent className="p-6 bg-slate-50">
        {fetchingStatus ? (
          <div className="py-12 text-center text-xs text-slate-500 font-medium">
            Memuat status pengajuan...
          </div>
        ) : myApplication && myApplication.status === 'PENDING' ? (
          /* State 1: PENDING APPROVAL CARD */
          <div className="space-y-5 text-center py-4">
            <div className="w-16 h-16 bg-amber-100 border-4 border-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-600 animate-pulse">
              <Clock3 className="w-9 h-9" />
            </div>

            <div>
              <span className="inline-block bg-amber-100 text-amber-900 font-black text-[10px] uppercase px-3 py-1 rounded-full mb-2 border border-amber-300">
                STATUS: MENUNGGU PERSETUJUAN
              </span>
              <h3 className="text-lg font-bold text-slate-900">
                Pengajuan Toko "{myApplication.storeName}"
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed max-w-sm mx-auto">
                Pengajuan toko Anda sedang ditinjau oleh Superadmin. Begitu disetujui, akun Anda
                akan otomatis memiliki akses ke <b>Dashboard Admin Toko</b>.
              </p>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-2xl text-left text-xs space-y-2 shadow-xs">
              <div className="font-bold text-slate-800 border-b pb-2 flex justify-between">
                <span>Rincian Toko Diajukan:</span>
                <span className="text-slate-400 font-normal">
                  {new Date(myApplication.createdAt).toLocaleDateString('id-ID')}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 text-slate-600">
                <div>
                  <span className="text-slate-400 block text-[10px]">KOTA CABANG</span>
                  <span className="font-semibold text-slate-800">{myApplication.city}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">TELEPON TOKO</span>
                  <span className="font-semibold text-slate-800">{myApplication.phone}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block text-[10px]">ALAMAT LENGKAP</span>
                  <span className="font-medium text-slate-700">{myApplication.address}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-xl shadow-sm transition"
            >
              Mengerti & Tutup
            </button>
          </div>
        ) : (
          /* State 2: FORM PENDAFTARAN TOKO BARU */
          <div className="space-y-4">
            {myApplication && myApplication.status === 'REJECTED' && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800">
                <div className="font-bold flex items-center gap-1.5 text-rose-900 mb-1">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  Pengajuan Sebelumnya Ditolak:
                </div>
                <p className="text-rose-700 italic">
                  "{myApplication.rejectionReason || 'Tidak memenuhi kriteria.'}"
                </p>
                <span className="block mt-1 font-semibold text-[11px]">
                  Anda dapat mengisi kembali form di bawah untuk mengajukan perbaikan data toko.
                </span>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Nama Toko / Cabang Baru <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: WaroengKita Cabang Bintaro"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Nama Pemilik / Penanggung Jawab <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nama Lengkap"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    No. WhatsApp Aktif <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="0812xxxxxxxx"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Kota / Kabupaten <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Jakarta Selatan"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Jam Operasional
                  </label>
                  <input
                    type="text"
                    placeholder="Buka • 08.00 - 21.00 WIB"
                    value={operatingHours}
                    onChange={(e) => setOperatingHours(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Alamat Fisik Toko Lengkap <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Nama jalan, nomor ruko/bangunan, RT/RW, kecamatan..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition font-medium resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Deskripsi / Keterangan Toko (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Menyediakan berbagai produk pilihan berkualitas..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition font-medium resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-md shadow-emerald-200 transition flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <span>Mengirim Pengajuan...</span>
                  ) : (
                    <>
                      <span>Kirim Pengajuan Toko ke Superadmin</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

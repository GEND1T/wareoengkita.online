import React, { useState } from 'react';
import {
  Megaphone,
  MessageSquare,
  Globe,
  Save,
} from 'lucide-react';
import { useAdminStore } from '../../store/useAdminStore';
import { FormSkeleton } from '../common/AdminSkeletons';

export const SystemSettingsView: React.FC = () => {
  const { showToast, isLoadingData } = useAdminStore();

  // Settings state
  const [announcementActive, setAnnouncementActive] = useState(true);
  const [announcementText, setAnnouncementText] = useState(
    '📢 Promo Khusus Hari Ini: Gratis Ongkir Ke Seluruh Wilayah Dengan Min. Pembelian Rp 50.000!'
  );
  const [platformName, setPlatformName] = useState('OrganikStore Indonesia');
  const [supportPhone, setSupportPhone] = useState('0812-3456-7890');
  const [waGatewayApiKey, setWaGatewayApiKey] = useState('wa_live_sec_9918237192381923');
  const [autoSendWaOnOrder, setAutoSendWaOnOrder] = useState(true);
  const [autoSendWaOnShipping, setAutoSendWaOnShipping] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Pengaturan Global Platform berhasil disimpan & diperbarui!');
  };

  if (isLoadingData) {
    return <FormSkeleton />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-black text-gray-900">Pengaturan Global Platform</h1>
        <p className="text-xs text-gray-500">
          Konfigurasi pengumuman banner global, integrasi WhatsApp Gateway notifikasi, dan nama platform.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Global Announcement Banner */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2 font-extrabold text-sm text-[#063104]">
              <Megaphone className="w-5 h-5 text-[#063104]" />
              <span>Pengumuman Global (Banner Atas)</span>
            </div>

            {/* Toggle Active */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-600">
                {announcementActive ? 'Tampil' : 'Sembunyi'}
              </span>
              <button
                type="button"
                onClick={() => setAnnouncementActive(!announcementActive)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  announcementActive ? 'bg-[#063104]' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    announcementActive ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Teks Pengumuman Banner Global
            </label>
            <textarea
              rows={2}
              value={announcementText}
              onChange={(e) => setAnnouncementText(e.target.value)}
              placeholder="Tulis pesan pengumuman libur toko atau promo global..."
              className="w-full bg-gray-50 text-xs rounded-xl px-3.5 py-2.5 border border-gray-200 focus:outline-none focus:border-[#063104] focus:bg-white font-medium"
            />
          </div>
        </div>

        {/* Section 2: WhatsApp Gateway & Notifications */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100 font-extrabold text-sm text-blue-900">
            <MessageSquare className="w-5 h-5 text-blue-700" />
            <span>Integrasi WhatsApp Gateway Notifikasi</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              API Key WhatsApp Gateway
            </label>
            <input
              type="password"
              value={waGatewayApiKey}
              onChange={(e) => setWaGatewayApiKey(e.target.value)}
              placeholder="wa_live_xxx..."
              className="w-full bg-gray-50 text-xs rounded-xl px-3.5 py-2.5 border border-gray-200 focus:outline-none focus:border-blue-700 font-mono"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <label className="p-3 bg-gray-50 rounded-2xl border border-gray-200 flex items-center justify-between cursor-pointer hover:bg-emerald-50/50">
              <div>
                <span className="text-xs font-bold text-gray-900 block">Kirim WA Pesanan Baru</span>
                <span className="text-[10px] text-gray-500">Notifikasi otomatis saat checkout</span>
              </div>
              <input
                type="checkbox"
                checked={autoSendWaOnOrder}
                onChange={(e) => setAutoSendWaOnOrder(e.target.checked)}
                className="w-4 h-4 accent-[#063104]"
              />
            </label>

            <label className="p-3 bg-gray-50 rounded-2xl border border-gray-200 flex items-center justify-between cursor-pointer hover:bg-emerald-50/50">
              <div>
                <span className="text-xs font-bold text-gray-900 block">Kirim WA Resi / Dikirim</span>
                <span className="text-[10px] text-gray-500">Notifikasi saat kurir membawa paket</span>
              </div>
              <input
                type="checkbox"
                checked={autoSendWaOnShipping}
                onChange={(e) => setAutoSendWaOnShipping(e.target.checked)}
                className="w-4 h-4 accent-[#063104]"
              />
            </label>
          </div>
        </div>

        {/* Section 3: Branding & Support Info */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100 font-extrabold text-sm text-[#063104]">
            <Globe className="w-5 h-5 text-[#063104]" />
            <span>Identitas Platform & Layanan Pembeli</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Nama E-Commerce Platform</label>
              <input
                type="text"
                value={platformName}
                onChange={(e) => setPlatformName(e.target.value)}
                className="w-full bg-gray-50 text-xs rounded-xl px-3.5 py-2.5 border border-gray-200 focus:outline-none focus:border-[#063104] font-bold text-gray-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Nomor CS Bantuan Utama</label>
              <input
                type="text"
                value={supportPhone}
                onChange={(e) => setSupportPhone(e.target.value)}
                className="w-full bg-gray-50 text-xs rounded-xl px-3.5 py-2.5 border border-gray-200 focus:outline-none focus:border-[#063104] font-semibold"
              />
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center justify-between">
          <span className="text-xs text-gray-500 font-medium">
            Simpan konfigurasi sistem untuk menerapkan ke seluruh cabang toko.
          </span>

          <button
            type="submit"
            className="bg-[#063104] hover:bg-[#084205] text-white font-black px-6 py-3 rounded-xl text-xs shadow-md transition-all active:scale-95 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Pengaturan System</span>
          </button>
        </div>
      </form>
    </div>
  );
};

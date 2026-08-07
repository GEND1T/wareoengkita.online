import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Plus,
  Image as ImageIcon,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  X,
  Upload,
} from 'lucide-react';
import { useAdminStore } from '../store/useAdminStore';
import { useUserStore } from '../../auth/store/useUserStore';
import type { PromoBanner } from '../../../types';
import { API_BASE_URL } from '../../../config/api';
import { CardsGridSkeleton } from '../../../components/common/AdminSkeletons';

export const PromosView: React.FC = () => {
  const { profile } = useUserStore();
  const { promos, togglePromoStatus, addPromo, updatePromo, deletePromo, isLoadingData } =
    useAdminStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [promoToEdit, setPromoToEdit] = useState<PromoBanner | null>(null);

  // Modal Form State
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [discountTag, setDiscountTag] = useState('');
  const [image, setImage] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      if (json.success && json.url) {
        setImage(json.url);
      }
    } catch (err) {
      console.error('Failed to upload promo image to Cloudinary:', err);
    } finally {
      setIsUploading(false);
    }
  };

  // Populate form when editing or adding
  useEffect(() => {
    if (promoToEdit) {
      setTitle(promoToEdit.title);
      setSubtitle(promoToEdit.subtitle);
      setDiscountTag(promoToEdit.discountTag);
      setImage(promoToEdit.image);
    } else {
      setTitle('');
      setSubtitle('');
      setDiscountTag('');
      setImage(
        'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=80'
      );
    }
  }, [promoToEdit, isModalOpen]);

  const handleOpenAddModal = () => {
    setPromoToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (promo: PromoBanner) => {
    setPromoToEdit(promo);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, titleText: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus banner "${titleText}"?`)) {
      deletePromo(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const promoData = {
      title: title.trim(),
      subtitle: subtitle.trim() || 'Penawaran Segar Organik Hari Ini',
      discountTag: discountTag.trim() || 'PROMO SPECIAL',
      image:
        image.trim() ||
        'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=80',
      isActive: promoToEdit ? promoToEdit.isActive : true,
    };

    if (promoToEdit) {
      updatePromo(promoToEdit.id, promoData);
    } else {
      addPromo(promoData, profile.assignedStoreId);
    }

    setIsModalOpen(false);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const objectUrl = URL.createObjectURL(file);
      setImage(objectUrl);
    }
  };

  if (isLoadingData) {
    return <CardsGridSkeleton items={6} />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title & Top Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="hidden md:block">
          <h1 className="text-2xl font-black text-gray-900">Manajemen Promo & Banner</h1>
          <p className="text-xs text-gray-500">
            Kelola banner diskon (seperti banner 30% OFF) yang tampil pada aplikasi mobile pengguna.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="bg-[#063104] hover:bg-[#084205] text-white font-extrabold px-4 py-2.5 md:px-4.5 md:py-3 rounded-2xl text-xs shadow-lg hover:shadow-emerald-900/20 transition-all duration-200 flex items-center gap-2 md:gap-2.5 shrink-0 active:scale-95 border border-emerald-900/30 cursor-pointer self-start sm:self-auto"
        >
          <div className="w-5 h-5 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
          </div>
          <span>Tambah Banner</span>
        </button>
      </div>

      {/* Promo Banners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {promos.length === 0 ? (
          <div className="col-span-full bg-white rounded-3xl p-8 text-center border border-gray-100 text-xs text-gray-400">
            Belum ada banner promo. Klik "+ Tambah Banner Promo" untuk membuat banner pertama.
          </div>
        ) : (
          promos.map((banner) => (
            <div
              key={banner.id}
              className="bg-white rounded-3xl overflow-hidden border border-gray-200/80 shadow-sm flex flex-col justify-between group"
            >
              {/* Banner Image Preview */}
              <div className="relative h-48 w-full overflow-hidden bg-gray-100">
                <img
                  src={banner.image}
                  alt={banner.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-3 left-3 bg-[#063104] text-[#C8956A] font-black text-xs px-3 py-1 rounded-full shadow-lg">
                  {banner.discountTag}
                </span>

                <span
                  className={`absolute top-3 right-3 text-[10px] font-black px-2.5 py-1 rounded-full shadow-lg ${banner.isActive ? 'bg-emerald-500 text-white' : 'bg-gray-800 text-gray-300'
                    }`}
                >
                  {banner.isActive ? 'AKTIF' : 'NONAKTIF'}
                </span>
              </div>

              {/* Banner Info & Actions */}
              <div className="p-5 flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-extrabold text-gray-900 text-base">{banner.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{banner.subtitle}</p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Toggle Status Button */}
                  <button
                    type="button"
                    onClick={() => togglePromoStatus(banner.id)}
                    className={`p-2 rounded-xl font-bold text-xs flex items-center gap-1 transition-colors ${banner.isActive
                      ? 'bg-emerald-50 text-[#063104] hover:bg-emerald-100 border border-emerald-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    title={banner.isActive ? 'Sembunyikan Banner' : 'Tampilkan Banner'}
                  >
                    {banner.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>

                  {/* Edit Banner Button */}
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(banner)}
                    className="p-2 rounded-xl bg-gray-100 hover:bg-[#063104] hover:text-white text-gray-700 transition-colors"
                    title="Edit Banner Promo"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>

                  {/* Delete Banner Button */}
                  <button
                    type="button"
                    onClick={() => handleDelete(banner.id, banner.title)}
                    className="p-2 rounded-xl bg-gray-100 hover:bg-red-600 hover:text-white text-gray-700 transition-colors"
                    title="Hapus Banner Promo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL FORM TAMBAH / EDIT BANNER PROMO */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-[3000] bg-black/60 flex items-end md:items-center justify-center md:p-4 overflow-y-auto animate-fade-in"
          style={{ backdropFilter: 'blur(4px)' }}
        >
          <div className="bg-white rounded-t-3xl md:rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl border border-gray-100 flex flex-col md:my-auto max-h-[92vh] md:max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-[#F9F8F6]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#063104]" />
                <h3 className="font-extrabold text-gray-900 text-lg">
                  {promoToEdit ? 'Edit Banner Promo' : 'Tambah Banner Promo Baru'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-gray-200/80 text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* SISI KIRI: Preview Gambar & Drag Drop Upload */}
                <div className="md:col-span-5 space-y-3">
                  <label className="block text-xs font-extrabold text-[#063104] uppercase tracking-wider">
                    Gambar Banner Promo
                  </label>

                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`relative rounded-2xl border-2 border-dashed p-4 flex flex-col items-center justify-center text-center transition-all min-h-[200px] ${dragActive
                      ? 'border-[#063104] bg-emerald-50/80'
                      : 'border-gray-300 bg-gray-50 hover:bg-gray-100/60'
                      }`}
                  >
                    {image ? (
                      <div className="relative w-full h-40 rounded-xl overflow-hidden group">
                        <img
                          src={image}
                          alt="Preview Banner"
                          className="w-full h-full object-cover bg-gray-100"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => setImage('')}
                            className="bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-md hover:bg-red-700"
                          >
                            Ganti Gambar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 py-4">
                        <div className="w-12 h-12 rounded-full bg-emerald-100 text-[#063104] flex items-center justify-center mx-auto">
                          <Upload className="w-6 h-6" />
                        </div>
                        <p className="text-xs font-bold text-gray-700">
                          Tarik & Lepas Gambar Di Sini
                        </p>
                        <label className="cursor-pointer bg-[#063104] hover:bg-[#084205] text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow-sm inline-flex items-center gap-1.5 transition-all">
                          <span>{isUploading ? 'Mengunggah...' : 'Upload Cloudinary'}</span>
                          <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                        </label>
                      </div>
                    )}
                  </div>

                  {/* URL Input */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">
                      URL Gambar Banner (Opsional)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={image}
                        onChange={(e) => setImage(e.target.value)}
                        placeholder="https://..."
                        className="w-full bg-white text-xs rounded-xl py-2 pl-8 pr-3 border border-gray-200 focus:outline-none focus:border-[#063104]"
                      />
                      <ImageIcon className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  {/* Tips Banner */}
                  <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-3 text-[11px] text-amber-900 leading-relaxed space-y-1">
                    <span className="font-bold flex items-center gap-1 text-amber-950">
                      💡 Tips Gambar Banner:
                    </span>
                    <p>
                      Gunakan gambar beresolusi lanskap (16:9) agar banner promosi tampil tajam dan presisi di aplikasi mobile.
                    </p>
                  </div>
                </div>

                {/* SISI KANAN: Form Inputs Detail Banner */}
                <div className="md:col-span-7 space-y-4">
                  {/* Judul Banner */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Judul Banner Promo <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Diskon Organik 30% OFF"
                      className="w-full bg-white text-sm rounded-xl px-3.5 py-2.5 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#063104]/20 focus:border-[#063104]"
                    />
                  </div>

                  {/* Tag Diskon */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Tag Diskon / Badge Promo <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={discountTag}
                      onChange={(e) => setDiscountTag(e.target.value)}
                      placeholder="e.g. 30% OFF, FREE ONGKIR, FLASH SALE"
                      className="w-full bg-white text-sm rounded-xl px-3.5 py-2.5 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#063104]/20 focus:border-[#063104] font-bold"
                    />
                  </div>

                  {/* Sub-judul / Penjelasan */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Sub-judul / Penjelasan Promo
                    </label>
                    <textarea
                      rows={3}
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                      placeholder="e.g. Khusus pembelian produk sayuran & buah segar hari ini sampai jam 18:00..."
                      className="w-full bg-white text-sm rounded-xl px-3.5 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#063104]/20 focus:border-[#063104]"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-white hover:bg-gray-50 text-[#063104] border border-[#063104] font-bold px-6 py-2.5 rounded-xl text-xs transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-[#063104] hover:bg-[#084205] text-white font-extrabold px-6 py-2.5 rounded-xl text-xs shadow-md transition-all active:scale-[0.98]"
                >
                  {promoToEdit ? 'Simpan Perubahan' : 'Simpan Banner Promo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

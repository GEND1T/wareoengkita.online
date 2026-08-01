import React, { useState, useEffect } from 'react';
import { X, Upload, Image as ImageIcon, Sparkles, Store } from 'lucide-react';
import type { AdminProduct } from '../../types';
import { useAdminStore } from '../../store/useAdminStore';
import { useUserStore } from '../../store/useUserStore';
import { useStoreSelectorStore } from '../../store/useStoreSelectorStore';

import { ProcessingOverlay } from '../common/ProcessingOverlay';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: AdminProduct | null;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
}) => {
  const { addProduct, updateProduct, categories } = useAdminStore();
  const { profile } = useUserStore();
  const { stores, selectedStoreId } = useStoreSelectorStore();

  const [name, setName] = useState('');
  const [category, setCategory] = useState('sayuran');
  const [storeId, setStoreId] = useState(
    productToEdit?.storeId || profile.assignedStoreId || selectedStoreId || 'store-1'
  );
  const [price, setPrice] = useState<number | ''>(15000);
  const [originalPrice, setOriginalPrice] = useState<number | ''>('');
  const [discountTag, setDiscountTag] = useState('');
  const [badge, setBadge] = useState('');
  const [unit, setUnit] = useState('/ikat');
  const [stock, setStock] = useState<number | ''>(50);
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setCategory(productToEdit.categoryId || productToEdit.category || 'cat-1');
      setStoreId(productToEdit.storeId || profile.assignedStoreId || selectedStoreId || 'store-1');
      setPrice(productToEdit.price);
      setOriginalPrice(productToEdit.originalPrice ?? '');
      setDiscountTag(productToEdit.discountTag || '');
      setBadge(productToEdit.badge || '');
      setUnit(productToEdit.unit);
      setStock(productToEdit.stock);
      setSubtitle(productToEdit.subtitle || '');
      setDescription(productToEdit.description || '');
      setImage(productToEdit.image || '');
    } else {
      setName('');
      setCategory(categories[0]?.id || 'cat-1');
      setStoreId(profile.assignedStoreId || selectedStoreId || 'store-1');
      setPrice(20000);
      setOriginalPrice('');
      setDiscountTag('');
      setBadge('');
      setUnit('/pak');
      setStock(50);
      setSubtitle('');
      setDescription('');
      setImage('https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80');
    }
  }, [productToEdit, isOpen, profile.assignedStoreId, selectedStoreId, categories]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      console.error('Failed to upload image:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);

    const matchedCategory = categories.find((c) => c.id === category || c.slug === category);

    const prodData: any = {
      name: name.trim(),
      subtitle: subtitle.trim() || name.trim(),
      categoryId: matchedCategory?.id || categories[0]?.id || null,
      categorySlug: matchedCategory?.slug || (typeof category === 'string' ? category : 'sayur-segar'),
      category: matchedCategory?.name || category,
      storeId: storeId,
      price: typeof price === 'number' ? price : 0,
      originalPrice: typeof originalPrice === 'number' && originalPrice > 0 ? originalPrice : null,
      discountTag: discountTag.trim() || null,
      badge: badge.trim() || null,
      unit: unit.trim() || '/pak',
      stock: typeof stock === 'number' ? stock : 0,
      description: description.trim() || subtitle.trim() || name.trim(),
      longDescription: description.trim(),
      image: image.trim() || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
      isActive: productToEdit ? productToEdit.isActive : true,
      isFreshDaily: productToEdit?.isFreshDaily ?? false,
      isOrganicCertified: productToEdit?.isOrganicCertified ?? false,
      rating: productToEdit?.rating ?? 0,
      reviewCount: productToEdit?.reviewCount ?? 0,
    };

    try {
      if (productToEdit) {
        await updateProduct(productToEdit.id, prodData);
      } else {
        await addProduct(prodData, storeId);
      }
    } finally {
      setIsSubmitting(false);
      onClose();
    }
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
      // Create local blob preview URL
      const file = e.dataTransfer.files[0];
      const objectUrl = URL.createObjectURL(file);
      setImage(objectUrl);
    }
  };

  return (
    <>
      <ProcessingOverlay
        isOpen={isUploading || isSubmitting}
        title={isUploading ? 'Mengunggah Gambar ke Cloudinary...' : 'Menyimpan Data Produk...'}
        subtitle={
          isUploading
            ? 'Format gambar dioptimalkan & diunggah secara aman.'
            : 'Menyimpan rincian produk ke Supabase PostgreSQL DB.'
        }
      />
      <div
        className="fixed inset-0 z-[3000] bg-black/60 flex items-center justify-center p-4 overflow-y-auto animate-fade-in"
        style={{ backdropFilter: 'blur(4px)' }}
      >
      <div className="bg-white rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl border border-gray-100 flex flex-col my-auto max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-[#F9F8F6]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#063104]" />
            <h3 className="font-extrabold text-gray-900 text-lg">
              {productToEdit ? 'Edit Produk' : 'Tambah Produk Baru'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-gray-200/80 text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* SISI KIRI: Foto Produk & Drag Drop */}
            <div className="md:col-span-5 space-y-3">
              <label className="block text-xs font-extrabold text-[#063104] uppercase tracking-wider">
                Foto Produk
              </label>

              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`relative rounded-2xl border-2 border-dashed p-4 flex flex-col items-center justify-center text-center transition-all min-h-[220px] ${
                  dragActive
                    ? 'border-[#063104] bg-emerald-50/80'
                    : 'border-gray-300 bg-gray-50 hover:bg-gray-100/60'
                }`}
              >
                {image ? (
                  <div className="relative w-full h-44 rounded-xl overflow-hidden group">
                    <img
                      src={image}
                      alt="Preview"
                      className="w-full h-full object-contain bg-white"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setImage('')}
                        className="bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-md hover:bg-red-700"
                      >
                        Ganti Foto
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
                  URL Gambar Produk (Opsional)
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
                  💡 Tips Foto Produk:
                </span>
                <p>
                  Gunakan latar belakang putih bersih beresolusi 1:1 agar tampilan kartu produk di aplikasi optimal.
                </p>
              </div>
            </div>

            {/* SISI KANAN: Form Inputs Detail Produk */}
            <div className="md:col-span-7 space-y-4">
              {/* Toko Cabang Pemilik Produk */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center justify-between">
                  <span>Toko Cabang Pemilik Produk <span className="text-red-500">*</span></span>
                  <span className="text-[10px] text-emerald-800 font-bold flex items-center gap-1">
                    <Store className="w-3.5 h-3.5 text-[#063104]" /> ID: {storeId}
                  </span>
                </label>
                {profile.role === 'admin_store' ? (
                  <div className="bg-emerald-50/80 text-[#063104] text-xs font-bold px-3.5 py-2.5 rounded-xl border border-emerald-200/80 flex items-center justify-between">
                    <span>{profile.assignedStoreName || stores.find((s) => s.id === storeId)?.name || 'Cabang Toko Anda'}</span>
                    <span className="bg-[#063104] text-white text-[10px] font-black px-2 py-0.5 rounded-md">ADMIN TOKO</span>
                  </div>
                ) : (
                  <select
                    value={storeId}
                    onChange={(e) => setStoreId(e.target.value)}
                    className="w-full bg-white text-sm rounded-xl px-3.5 py-2.5 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#063104]/20 focus:border-[#063104] font-bold text-gray-800"
                  >
                    {stores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.city})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Nama Produk */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Nama Produk <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Wortel Premium Impor"
                  className="w-full bg-white text-sm rounded-xl px-3.5 py-2.5 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#063104]/20 focus:border-[#063104]"
                />
              </div>

              {/* Kategori & Label Satuan Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Kategori
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-white text-sm rounded-xl px-3.5 py-2.5 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#063104]/20 focus:border-[#063104] capitalize"
                  >
                    {categories && categories.length > 0 ? (
                      categories
                        .filter((c) => c.id !== 'all')
                        .map((cat) => (
                          <option key={cat.id} value={(cat as any).slug || cat.id}>
                            {cat.name}
                          </option>
                        ))
                    ) : (
                      <>
                        <option value="sayur-segar">Sayur Segar</option>
                        <option value="buah-organik">Buah Organik</option>
                        <option value="daging-ayam">Daging & Ayam</option>
                        <option value="susu-telur">Susu & Telur</option>
                        <option value="bumbu-rempah">Bumbu & Rempah</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Label Satuan
                  </label>
                  <input
                    type="text"
                    required
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="e.g. /pak, /kg, /ikat"
                    className="w-full bg-white text-sm rounded-xl px-3.5 py-2.5 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#063104]/20 focus:border-[#063104]"
                  />
                </div>
              </div>

              {/* Harga Jual & Stok Awal Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Harga Jual (Rp) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={price}
                    onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="25000"
                    className="w-full bg-white text-sm rounded-xl px-3.5 py-2.5 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#063104]/20 focus:border-[#063104] font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Stok Awal
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={stock}
                    onChange={(e) => setStock(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="50"
                    className="w-full bg-white text-sm rounded-xl px-3.5 py-2.5 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#063104]/20 focus:border-[#063104] font-semibold"
                  />
                </div>
              </div>

              {/* Promo & Diskon Grid (originalPrice, discountTag, badge) */}
              <div className="bg-gray-50/70 p-3.5 rounded-2xl border border-gray-200/80 space-y-3">
                <span className="block text-xs font-extrabold text-[#063104] uppercase tracking-wider">
                  Pengaturan Promosi & Badge (Opsional)
                </span>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Harga Coret (Rp)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={originalPrice}
                      onChange={(e) => setOriginalPrice(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="e.g. 30000"
                      className="w-full bg-white text-xs rounded-xl px-3 py-2 border border-gray-200 focus:outline-none focus:border-[#063104]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Tag Diskon
                    </label>
                    <input
                      type="text"
                      value={discountTag}
                      onChange={(e) => setDiscountTag(e.target.value)}
                      placeholder="e.g. Hemat 20%"
                      className="w-full bg-white text-xs rounded-xl px-3 py-2 border border-gray-200 focus:outline-none focus:border-[#063104]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Badge Produk
                    </label>
                    <input
                      type="text"
                      value={badge}
                      onChange={(e) => setBadge(e.target.value)}
                      placeholder="e.g. PROMO"
                      className="w-full bg-white text-xs rounded-xl px-3 py-2 border border-gray-200 focus:outline-none focus:border-[#063104]"
                    />
                  </div>
                </div>
              </div>

              {/* Deskripsi Singkat */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-gray-700">
                    Deskripsi Singkat (Sub-teks Kartu)
                  </label>
                  <span className="text-[10px] text-gray-400">Maks. 50 Karakter</span>
                </div>
                <input
                  type="text"
                  maxLength={50}
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="e.g. Renyah & manis segar"
                  className="w-full bg-white text-sm rounded-xl px-3.5 py-2.5 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#063104]/20 focus:border-[#063104]"
                />
              </div>

              {/* Deskripsi Lengkap */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Deskripsi Lengkap Produk
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Informasi detail mengenai asal produk, cara penyimpanan, dan manfaat kesehatan..."
                  className="w-full bg-white text-sm rounded-xl px-3.5 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#063104]/20 focus:border-[#063104]"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="bg-white hover:bg-gray-50 text-[#063104] border border-[#063104] font-bold px-6 py-2.5 rounded-xl text-xs transition-all"
            >
              Batal
            </button>

            <button
              type="submit"
              className="bg-[#063104] hover:bg-[#084205] text-white font-extrabold px-6 py-2.5 rounded-xl text-xs shadow-md transition-all active:scale-[0.98]"
            >
              {productToEdit ? 'Simpan Perubahan' : 'Simpan Produk'}
            </button>
          </div>
        </form>
      </div>
    </div>
    </>
  );
};

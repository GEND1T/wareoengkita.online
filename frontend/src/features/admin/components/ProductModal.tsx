import React, { useState, useEffect } from 'react';
import { X, Upload, Image as ImageIcon, Sparkles, Store, Trash2, AlertCircle } from 'lucide-react';
import type { AdminProduct } from '../../../types';
import { useAdminStore } from '../store/useAdminStore';
import { useUserStore } from '../../auth/store/useUserStore';
import { useStoreSelectorStore } from '../../store-location/store/useStoreSelectorStore';
import { API_BASE_URL } from '../../../config/api';
import { ProcessingOverlay } from '../../../components/common/ProcessingOverlay';

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
  const [weightInGrams, setWeightInGrams] = useState<number | ''>(500);
  const [stock, setStock] = useState<number | ''>(50);
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');

  // Multi-image state (up to 3 images)
  const [images, setImages] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState<string>('');
  const [isFreshDaily, setIsFreshDaily] = useState<boolean>(false);
  const [isOrganicCertified, setIsOrganicCertified] = useState<boolean>(false);

  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [priceWarning, setPriceWarning] = useState<string | null>(null);

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
      setWeightInGrams(productToEdit.weightInGrams ?? 500);
      setStock(productToEdit.stock);
      setSubtitle(productToEdit.subtitle || '');
      setDescription(productToEdit.description || '');
      setIsFreshDaily(productToEdit.isFreshDaily ?? false);
      setIsOrganicCertified(productToEdit.isOrganicCertified ?? false);

      let imgList: string[] = [];
      if (productToEdit.image) imgList.push(productToEdit.image);
      if (productToEdit.imagesJson) {
        try {
          const parsed = JSON.parse(productToEdit.imagesJson);
          if (Array.isArray(parsed)) {
            parsed.forEach((u: string) => {
              if (u && !imgList.includes(u)) imgList.push(u);
            });
          }
        } catch {
          // ignore
        }
      }
      setImages(imgList.slice(0, 3));
      setUrlInput('');
      setImageError(null);
      setPriceWarning(null);
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
      setIsFreshDaily(false);
      setIsOrganicCertified(false);
      setImages([]); // Empty by default per user request
      setUrlInput('');
      setImageError(null);
      setPriceWarning(null);
    }
  }, [productToEdit, isOpen, profile.assignedStoreId, selectedStoreId, categories]);

  if (!isOpen) return null;

  const handlePriceChange = (val: number | '') => {
    setPrice(val);
    if (typeof originalPrice === 'number' && originalPrice > 0) {
      const numPrice = typeof val === 'number' ? val : 0;
      if (originalPrice <= numPrice) {
        setPriceWarning(`Harga coret (Rp ${originalPrice.toLocaleString('id-ID')}) harus lebih besar dari harga jual.`);
      } else {
        setPriceWarning(null);
        const discountPct = Math.round(((originalPrice - numPrice) / originalPrice) * 100);
        if (discountPct > 0) {
          setDiscountTag(`Hemat ${discountPct}%`);
        }
      }
    }
  };

  const handleOriginalPriceChange = (val: number | '') => {
    setOriginalPrice(val);
    if (val !== '' && val > 0) {
      const numPrice = typeof price === 'number' ? price : 0;
      if (val <= numPrice) {
        setPriceWarning(`Harga coret (Rp ${val.toLocaleString('id-ID')}) harus lebih besar dari harga jual (Rp ${numPrice.toLocaleString('id-ID')}).`);
      } else {
        setPriceWarning(null);
        const discountPct = Math.round(((val - numPrice) / val) * 100);
        if (discountPct > 0) {
          setDiscountTag(`Hemat ${discountPct}%`);
        }
      }
    } else {
      setPriceWarning(null);
      setDiscountTag('');
    }
  };

  const handleFileUpload = async (file: File, targetSlotIndex: number) => {
    if (!file) return;

    // Validate File Size (Max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setImageError(`File "${file.name}" melebihi batas 2MB! Pilih file lain yang lebih kecil.`);
      return;
    }

    setImageError(null);
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
        setImages((prev) => {
          const next = [...prev];
          next[targetSlotIndex] = json.url;
          return next.slice(0, 3);
        });
      } else {
        const localUrl = URL.createObjectURL(file);
        setImages((prev) => {
          const next = [...prev];
          next[targetSlotIndex] = localUrl;
          return next.slice(0, 3);
        });
      }
    } catch (err) {
      console.error('Failed to upload image:', err);
      const localUrl = URL.createObjectURL(file);
      setImages((prev) => {
        const next = [...prev];
        next[targetSlotIndex] = localUrl;
        return next.slice(0, 3);
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddUrlImage = () => {
    if (!urlInput.trim()) return;
    if (images.length >= 3) {
      setImageError('Maksimal 3 foto produk per item.');
      return;
    }
    setImages((prev) => [...prev, urlInput.trim()].slice(0, 3));
    setUrlInput('');
    setImageError(null);
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const validImages = images.filter((img) => img && img.trim().length > 0);
    if (validImages.length === 0) {
      setImageError('Minimal 1 foto produk harus diunggah/diisi!');
      return;
    }
    setImageError(null);
    setIsSubmitting(true);

    const matchedCategory = categories.find((c) => c.id === category || c.slug === category);
    const mainImage = validImages[0];
    const imagesJson = JSON.stringify(validImages);

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
      weightInGrams: typeof weightInGrams === 'number' ? weightInGrams : 500,
      stock: typeof stock === 'number' ? stock : 0,
      description: description.trim() || subtitle.trim() || name.trim(),
      longDescription: description.trim(),
      image: mainImage,
      imagesJson: imagesJson,
      isActive: productToEdit ? productToEdit.isActive : true,
      isFreshDaily: isFreshDaily,
      isOrganicCertified: isOrganicCertified,
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
      handleFileUpload(e.dataTransfer.files[0], images.length < 3 ? images.length : 0);
    }
  };

  return (
    <>
      <ProcessingOverlay
        isOpen={isUploading || isSubmitting}
        title={isUploading ? 'Mengunggah Gambar...' : 'Menyimpan Data Produk...'}
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
            {imageError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{imageError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* SISI KIRI: Multi Foto Produk & Drag Drop */}
              <div className="md:col-span-5 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-extrabold text-[#063104] uppercase tracking-wider">
                    Foto Produk (Maks. 3) <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] text-gray-400 font-medium">Max 2MB/file</span>
                </div>

                {/* 3 Photo Slot Preview Grid */}
                <div className="grid grid-cols-3 gap-2">
                  {[0, 1, 2].map((slotIdx) => {
                    const imgUrl = images[slotIdx];
                    return (
                      <div
                        key={slotIdx}
                        className={`relative aspect-square rounded-xl border-2 overflow-hidden flex flex-col items-center justify-center bg-gray-50 transition-all ${imgUrl ? 'border-emerald-500' : 'border-dashed border-gray-300 hover:border-[#063104]'
                          }`}
                      >
                        {imgUrl ? (
                          <div className="relative w-full h-full group">
                            <img
                              src={imgUrl}
                              alt={`Slot ${slotIdx + 1}`}
                              className="w-full h-full object-cover"
                            />
                            {slotIdx === 0 && (
                              <span className="absolute top-1 left-1 bg-[#063104] text-white text-[8px] font-black px-1.5 py-0.5 rounded-xs">
                                UTAMA
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(slotIdx)}
                              className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                              title="Hapus gambar"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <label className="w-full h-full cursor-pointer flex flex-col items-center justify-center p-1 text-center group hover:bg-emerald-50/50 transition-colors">
                            <Upload className="w-4 h-4 text-gray-400 group-hover:text-[#063104] mb-1" />
                            <span className="text-[9px] font-bold text-gray-500 group-hover:text-[#063104]">
                              {slotIdx === 0 ? '+ Utama' : `+ Foto ${slotIdx + 1}`}
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUpload(file, slotIdx);
                              }}
                            />
                          </label>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Drag Drop Main Container if images empty */}
                {images.length === 0 && (
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`relative rounded-2xl border-2 border-dashed p-4 flex flex-col items-center justify-center text-center transition-all min-h-[140px] ${dragActive
                      ? 'border-[#063104] bg-emerald-50/80'
                      : 'border-gray-300 bg-gray-50 hover:bg-gray-100/60'
                      }`}
                  >
                    <div className="space-y-1.5 py-2">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-[#063104] flex items-center justify-center mx-auto">
                        <Upload className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-gray-700">
                        Tarik & Lepas Gambar Di Sini
                      </p>
                      <p className="text-[10px] text-gray-400">
                        Format JPG, PNG, WEBP (Maksimal 2MB per gambar)
                      </p>
                    </div>
                  </div>
                )}

                {/* URL Input */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">
                    Tambah via URL Gambar
                  </label>
                  <div className="flex gap-1.5">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        placeholder="https://..."
                        className="w-full bg-white text-xs rounded-xl py-2 pl-8 pr-3 border border-gray-200 focus:outline-none focus:border-[#063104]"
                      />
                      <ImageIcon className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddUrlImage}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold px-3 py-2 rounded-xl transition-colors"
                    >
                      + Tambah
                    </button>
                  </div>
                </div>

                {/* Flags Checkboxes / Toggles */}
                <div className="bg-emerald-50/60 border border-emerald-200/70 rounded-2xl p-3 space-y-2">
                  <span className="block text-[11px] font-extrabold text-[#063104] uppercase tracking-wider">
                    Sertifikasi & Garansi Pangan
                  </span>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-800">
                    <input
                      type="checkbox"
                      checked={isOrganicCertified}
                      onChange={(e) => setIsOrganicCertified(e.target.checked)}
                      className="w-4 h-4 text-[#063104] rounded-md focus:ring-0 accent-[#063104]"
                    />
                    <span>100% Organik (Bebas Pestisida)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-800">
                    <input
                      type="checkbox"
                      checked={isFreshDaily}
                      onChange={(e) => setIsFreshDaily(e.target.checked)}
                      className="w-4 h-4 text-[#063104] rounded-md focus:ring-0 accent-[#063104]"
                    />
                    <span>Petik Hari Ini (Segar Harian)</span>
                  </label>
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

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Berat Produk (gram) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={weightInGrams}
                      onChange={(e) => setWeightInGrams(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="e.g. 500 (gram)"
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
                      onChange={(e) => handlePriceChange(e.target.value === '' ? '' : Number(e.target.value))}
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

                  {priceWarning && (
                    <div className="text-[11px] font-bold text-amber-700 bg-amber-50 p-2 rounded-xl border border-amber-200 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{priceWarning}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">
                        Harga Coret (Rp)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={originalPrice}
                        onChange={(e) => handleOriginalPriceChange(e.target.value === '' ? '' : Number(e.target.value))}
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
                className="bg-white hover:bg-gray-50 text-[#063104] border border-[#063104] font-bold px-6 py-2.5 rounded-xl text-xs transition-all cursor-pointer"
              >
                Batal
              </button>

              <button
                type="submit"
                className="bg-[#063104] hover:bg-[#084205] text-white font-extrabold px-6 py-2.5 rounded-xl text-xs shadow-md transition-all active:scale-[0.98] cursor-pointer"
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

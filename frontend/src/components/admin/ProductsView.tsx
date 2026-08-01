import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
} from 'lucide-react';
import { useAdminStore } from '../../store/useAdminStore';
import { useStoreSelectorStore } from '../../store/useStoreSelectorStore';
import type { AdminProduct } from '../../types';
import { ProductModal } from './ProductModal';
import { Store } from 'lucide-react';

import { TableSkeleton } from '../common/AdminSkeletons';

export const ProductsView: React.FC = () => {
  const {
    products,
    categories,
    toggleProductStatus,
    updateProductStock,
    deleteProduct,
    isLoadingData,
  } = useAdminStore();
  const { stores } = useStoreSelectorStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<AdminProduct | null>(null);

  // In-line Editing Stock State
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [tempStockValue, setTempStockValue] = useState<number | ''>('');

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      const q = searchQuery.toLowerCase();
      const nameMatch = (prod.name || '').toLowerCase().includes(q);
      const subtitleMatch = (prod.subtitle || '').toLowerCase().includes(q);
      const matchesSearch = !searchQuery.trim() || nameMatch || subtitleMatch;

      // prod.category can be string or object { id, name, slug }
      const catVal =
        typeof prod.category === 'string'
          ? prod.category
          : typeof prod.category === 'object' && prod.category !== null
          ? (prod.category as any).name || (prod.category as any).slug || ''
          : (prod as any).categorySlug || '';

      const prodCat = String(catVal || '').toLowerCase();
      const matchesCat =
        selectedCategory === 'all' ||
        prodCat === selectedCategory.toLowerCase();

      let matchesStock = true;
      if (stockFilter === 'low') matchesStock = prod.stock > 0 && prod.stock < 5;
      if (stockFilter === 'out') matchesStock = prod.stock === 0;

      return matchesSearch && matchesCat && matchesStock;
    });
  }, [products, searchQuery, selectedCategory, stockFilter]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    })
      .format(val)
      .replace(/\s/g, ' ');

  const handleOpenAddModal = () => {
    setProductToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product: AdminProduct) => {
    setProductToEdit(product);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus produk "${name}"?`)) {
      deleteProduct(id);
    }
  };

  // In-line Stock Edit Trigger
  const startStockEdit = (prod: AdminProduct) => {
    setEditingStockId(prod.id);
    setTempStockValue(prod.stock);
  };

  const saveInlineStock = (id: string) => {
    if (typeof tempStockValue === 'number' && !isNaN(tempStockValue)) {
      updateProductStock(id, tempStockValue);
    }
    setEditingStockId(null);
  };

  if (isLoadingData) {
    return <TableSkeleton rows={7} />;
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Title & Add Product Top Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Manajemen Produk (Katalog)</h1>
          <p className="text-xs text-gray-500">
            Atur stok harian, harga, status aktif, dan penambahan sayuran/buah segar.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="bg-[#063104] hover:bg-[#084205] text-white font-extrabold px-4.5 py-3 rounded-2xl text-xs shadow-lg hover:shadow-emerald-900/20 transition-all duration-200 flex items-center gap-2.5 shrink-0 active:scale-95 border border-emerald-900/30 cursor-pointer self-start sm:self-auto"
        >
          <div className="w-5 h-5 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
          </div>
          <span>Tambah Produk Baru</span>
        </button>
      </div>

      {/* Header Bar: Search & Filter */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search Bar */}
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama produk, kata kunci..."
            className="w-full bg-gray-50 text-xs md:text-sm rounded-xl py-2.5 pl-9 pr-4 border border-gray-200 focus:outline-none focus:border-[#063104] focus:bg-white"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        {/* Category & Stock Filter Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-gray-50 text-xs rounded-xl py-2.5 px-3 border border-gray-200 focus:outline-none focus:border-[#063104] capitalize font-medium"
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.id === 'all' ? 'Semua Kategori' : cat.name}
              </option>
            ))}
          </select>

          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as any)}
            className="bg-gray-50 text-xs rounded-xl py-2.5 px-3 border border-gray-200 focus:outline-none focus:border-[#063104] font-medium"
          >
            <option value="all">Semua Stok</option>
            <option value="low">⚠️ Stok Tipis (&lt; 5)</option>
            <option value="out">❌ Stok Habis (0)</option>
          </select>
        </div>
      </div>

      {/* Product Catalog Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F9F8F6] text-gray-700 text-xs font-extrabold uppercase border-b border-gray-200/80">
                <th className="py-3.5 px-4 w-16">Foto</th>
                <th className="py-3.5 px-4">Nama Produk</th>
                <th className="py-3.5 px-4">Cabang Toko</th>
                <th className="py-3.5 px-4">Kategori</th>
                <th className="py-3.5 px-4">Harga / Satuan</th>
                <th className="py-3.5 px-4">Stok Harian</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 text-xs">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    Tidak ada produk yang cocok dengan pencarian / filter Anda.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((prod) => {
                  const isLowStock = prod.stock > 0 && prod.stock < 5;
                  const isOutOfStock = prod.stock === 0;
                  const storeName = stores.find((s) => s.id === prod.storeId)?.name || prod.storeId || 'Senopati (Pusat)';

                  return (
                    <tr key={prod.id} className="hover:bg-emerald-50/30 transition-colors">
                      {/* Foto Thumbnail */}
                      <td className="py-3 px-4">
                        <img
                          src={prod.image}
                          alt={prod.name}
                          className="w-11 h-11 object-contain rounded-xl border border-gray-100 bg-gray-50 p-1"
                        />
                      </td>

                      {/* Nama Produk */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-gray-900 text-xs">{prod.name}</div>
                        <div className="text-[11px] text-gray-400 line-clamp-1">
                          {prod.subtitle}
                        </div>
                      </td>

                      {/* Cabang Toko */}
                      <td className="py-3 px-4">
                        <span className="bg-emerald-100/70 text-[#063104] font-bold text-[10px] px-2.5 py-1 rounded-lg flex items-center gap-1.5 w-max">
                          <Store className="w-3 h-3 text-[#063104]" />
                          {storeName}
                        </span>
                      </td>

                      {/* Kategori */}
                      <td className="py-3 px-4">
                        <span className="bg-emerald-50 text-[#063104] font-bold text-[11px] px-2.5 py-1 rounded-lg capitalize">
                          {typeof prod.category === 'object' && (prod.category as any)?.name
                            ? (prod.category as any).name
                            : (categories.find(c => c.id === prod.categoryId || c.slug === prod.categorySlug || c.slug === prod.category)?.name || (typeof prod.category === 'string' ? prod.category : 'Sayur Segar'))}
                        </span>
                      </td>

                      {/* Harga / Satuan */}
                      <td className="py-3 px-4 font-black text-gray-900">
                        {formatCurrency(prod.price)}{' '}
                        <span className="text-gray-500 font-medium text-[11px]">
                          {prod.unit}
                        </span>
                      </td>

                      {/* Stok Harian (dengan IN-LINE EDIT & Warning Alert < 5) */}
                      <td className="py-3 px-4">
                        {editingStockId === prod.id ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              autoFocus
                              min={0}
                              value={tempStockValue}
                              onChange={(e) =>
                                setTempStockValue(
                                  e.target.value === '' ? '' : Number(e.target.value)
                                )
                              }
                              className="w-16 bg-white text-xs font-bold px-2 py-1 border border-[#063104] rounded-lg focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => saveInlineStock(prod.id)}
                              className="p-1 rounded-lg bg-[#063104] text-white hover:bg-[#084205]"
                              title="Simpan Stok"
                            >
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingStockId(null)}
                              className="p-1 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
                              title="Batal"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => startStockEdit(prod)}
                            className="cursor-pointer group flex items-center gap-1.5 w-fit"
                            title="Klik untuk quick edit stok"
                          >
                            <span
                              className={`px-2.5 py-1 rounded-lg font-black text-xs transition-all border ${
                                isOutOfStock
                                  ? 'bg-red-100 text-red-800 border-red-300'
                                  : isLowStock
                                    ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-xs'
                                    : 'bg-emerald-50 text-[#063104] border-emerald-200'
                              }`}
                            >
                              {isOutOfStock
                                ? '❌ Habis (0)'
                                : isLowStock
                                  ? `⚠️ ${prod.stock} ${prod.unit.replace('/', '')}`
                                  : `${prod.stock} ${prod.unit.replace('/', '')}`}
                            </span>
                            <Pencil className="w-3 h-3 text-gray-400 group-hover:text-[#063104] transition-colors" />
                          </div>
                        )}
                      </td>

                      {/* Status Toggle (Aktif/Nonaktif) */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => toggleProductStatus(prod.id, prod.storeId)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            prod.isActive ? 'bg-[#063104]' : 'bg-gray-300'
                          }`}
                          title={prod.isActive ? 'Klik untuk nonaktifkan' : 'Klik untuk aktifkan'}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                              prod.isActive ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                        <span className="block text-[10px] font-bold text-gray-500 mt-0.5">
                          {prod.isActive ? 'Tampil' : 'Sembunyi'}
                        </span>
                      </td>

                      {/* Aksi (Edit / Hapus) */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(prod)}
                            className="p-1.5 rounded-lg bg-gray-100 hover:bg-[#063104] hover:text-white text-gray-700 transition-colors"
                            title="Edit Detail Produk"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(prod.id, prod.name)}
                            className="p-1.5 rounded-lg bg-gray-100 hover:bg-red-600 hover:text-white text-gray-700 transition-colors"
                            title="Hapus Produk"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Add/Edit Modal */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        productToEdit={productToEdit}
      />
    </div>
  );
};

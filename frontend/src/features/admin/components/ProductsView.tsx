import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
} from 'lucide-react';
import { useAdminStore } from '../store/useAdminStore';
import { useStoreSelectorStore } from '../../store-location/store/useStoreSelectorStore';
import type { AdminProduct } from '../../../types';
import { ProductModal } from './ProductModal';
import { Store } from 'lucide-react';

import { TableSkeleton } from '../../../components/common/AdminSkeletons';

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
        <div className="hidden md:block">
          <h1 className="text-2xl font-black text-gray-900">Manajemen Produk (Katalog)</h1>
          <p className="text-xs text-gray-500">
            Atur stok harian, harga, status aktif, dan penambahan sayuran/buah segar.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="hidden md:flex bg-[#063104] hover:bg-[#084205] text-white font-extrabold px-4.5 py-3 rounded-2xl text-xs shadow-lg hover:shadow-emerald-900/20 transition-all duration-200 items-center gap-2.5 shrink-0 active:scale-95 border border-emerald-900/30 cursor-pointer self-start sm:self-auto"
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

      {/* ═══ MOBILE: Card-Based Product List ═══ */}
      <div className="md:hidden space-y-3">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            Tidak ada produk yang cocok dengan pencarian / filter Anda.
          </div>
        ) : (
          filteredProducts.map((prod) => {
            const isLowStock = prod.stock > 0 && prod.stock < 5;
            const isOutOfStock = prod.stock === 0;
            const storeName = stores.find((s) => s.id === prod.storeId)?.name || prod.storeId || 'Senopati (Pusat)';

            return (
              <div
                key={prod.id}
                className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
                  !prod.isActive ? 'border-gray-200 opacity-60' : 'border-gray-100'
                }`}
              >
                {/* Card Top: Image + Info */}
                <div className="flex items-start gap-3 p-3.5">
                  {/* Product Image */}
                  <img
                    src={prod.image}
                    alt={prod.name}
                    className="w-16 h-16 object-contain rounded-xl border border-gray-100 bg-gray-50 p-1 shrink-0"
                  />

                  {/* Product Details */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-bold text-gray-900 text-xs leading-tight truncate">{prod.name}</h3>
                        <p className="text-[10px] text-gray-400 truncate">{prod.subtitle}</p>
                      </div>
                      {/* Toggle Status */}
                      <button
                        type="button"
                        onClick={() => toggleProductStatus(prod.id, prod.storeId)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${prod.isActive ? 'bg-[#063104]' : 'bg-gray-300'}`}
                        title={prod.isActive ? 'Aktif' : 'Nonaktif'}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition duration-200 ${prod.isActive ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    {/* Price + Stock Row */}
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <span className="font-extrabold text-gray-900 text-xs">
                          {formatCurrency(prod.price)}
                        </span>
                        <span className="text-[10px] text-gray-400 ml-0.5">{prod.unit}</span>
                      </div>

                      {/* Stock Badge */}
                      {editingStockId === prod.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            autoFocus
                            min={0}
                            value={tempStockValue}
                            onChange={(e) => setTempStockValue(e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-14 bg-white text-[11px] font-bold px-1.5 py-0.5 border border-[#063104] rounded-lg focus:outline-none"
                          />
                          <button type="button" onClick={() => saveInlineStock(prod.id)} className="p-0.5 rounded bg-[#063104] text-white">
                            <Check className="w-3 h-3" />
                          </button>
                          <button type="button" onClick={() => setEditingStockId(null)} className="p-0.5 rounded bg-gray-200 text-gray-600">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startStockEdit(prod)}
                          className={`px-2 py-0.5 rounded-lg font-extrabold text-[10px] border transition-all ${
                            isOutOfStock ? 'bg-red-100 text-red-800 border-red-300' :
                            isLowStock ? 'bg-amber-100 text-amber-900 border-amber-300' :
                            'bg-emerald-50 text-[#063104] border-emerald-200'
                          }`}
                        >
                          {isOutOfStock ? '❌ Habis' : isLowStock ? `⚠️ ${prod.stock}` : `${prod.stock} ${prod.unit.replace('/', '')}`}
                        </button>
                      )}
                    </div>

                    {/* Category + Store Badges */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="bg-emerald-50 text-[#063104] font-bold text-[9px] px-2 py-0.5 rounded-md capitalize">
                        {typeof prod.category === 'object' && (prod.category as any)?.name
                          ? (prod.category as any).name
                          : (categories.find(c => c.id === prod.categoryId || c.slug === prod.categorySlug || c.slug === prod.category)?.name || (typeof prod.category === 'string' ? prod.category : 'Sayur Segar'))}
                      </span>
                      <span className="bg-gray-100 text-gray-600 font-medium text-[9px] px-2 py-0.5 rounded-md flex items-center gap-0.5">
                        <Store className="w-2.5 h-2.5" />
                        {storeName}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer: Actions */}
                <div className="px-3.5 py-2 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(prod)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white border border-gray-200 text-gray-700 text-[11px] font-bold hover:bg-[#063104] hover:text-white transition-colors active:scale-95"
                  >
                    <Pencil className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(prod.id, prod.name)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white border border-gray-200 text-gray-700 text-[11px] font-bold hover:bg-red-600 hover:text-white transition-colors active:scale-95"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Hapus</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Mobile FAB: Add Product */}
      <button
        type="button"
        onClick={handleOpenAddModal}
        className="md:hidden fixed bottom-20 right-4 z-[2550] w-14 h-14 bg-[#063104] text-white rounded-2xl shadow-lg shadow-emerald-900/30 flex items-center justify-center active:scale-90 transition-transform"
        aria-label="Tambah Produk"
      >
        <Plus className="w-6 h-6 stroke-[2.5]" />
      </button>

      {/* ═══ DESKTOP: Table Layout (unchanged) ═══ */}
      <div className="hidden md:block bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
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
                      <td className="py-3 px-4">
                        <img
                          src={prod.image}
                          alt={prod.name}
                          className="w-11 h-11 object-contain rounded-xl border border-gray-100 bg-gray-50 p-1"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-gray-900 text-xs">{prod.name}</div>
                        <div className="text-[11px] text-gray-400 line-clamp-1">{prod.subtitle}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="bg-emerald-100/70 text-[#063104] font-bold text-[10px] px-2.5 py-1 rounded-lg flex items-center gap-1.5 w-max">
                          <Store className="w-3 h-3 text-[#063104]" />
                          {storeName}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="bg-emerald-50 text-[#063104] font-bold text-[11px] px-2.5 py-1 rounded-lg capitalize">
                          {typeof prod.category === 'object' && (prod.category as any)?.name
                            ? (prod.category as any).name
                            : (categories.find(c => c.id === prod.categoryId || c.slug === prod.categorySlug || c.slug === prod.category)?.name || (typeof prod.category === 'string' ? prod.category : 'Sayur Segar'))}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-black text-gray-900">
                        {formatCurrency(prod.price)}{' '}
                        <span className="text-gray-500 font-medium text-[11px]">{prod.unit}</span>
                      </td>
                      <td className="py-3 px-4">
                        {editingStockId === prod.id ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              autoFocus
                              min={0}
                              value={tempStockValue}
                              onChange={(e) => setTempStockValue(e.target.value === '' ? '' : Number(e.target.value))}
                              className="w-16 bg-white text-xs font-bold px-2 py-1 border border-[#063104] rounded-lg focus:outline-none"
                            />
                            <button type="button" onClick={() => saveInlineStock(prod.id)} className="p-1 rounded-lg bg-[#063104] text-white hover:bg-[#084205]" title="Simpan Stok">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </button>
                            <button type="button" onClick={() => setEditingStockId(null)} className="p-1 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300" title="Batal">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div onClick={() => startStockEdit(prod)} className="cursor-pointer group flex items-center gap-1.5 w-fit" title="Klik untuk quick edit stok">
                            <span className={`px-2.5 py-1 rounded-lg font-black text-xs transition-all border ${
                              isOutOfStock ? 'bg-red-100 text-red-800 border-red-300' :
                              isLowStock ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-xs' :
                              'bg-emerald-50 text-[#063104] border-emerald-200'
                            }`}>
                              {isOutOfStock ? '❌ Habis (0)' : isLowStock ? `⚠️ ${prod.stock} ${prod.unit.replace('/', '')}` : `${prod.stock} ${prod.unit.replace('/', '')}`}
                            </span>
                            <Pencil className="w-3 h-3 text-gray-400 group-hover:text-[#063104] transition-colors" />
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => toggleProductStatus(prod.id, prod.storeId)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${prod.isActive ? 'bg-[#063104]' : 'bg-gray-300'}`}
                          title={prod.isActive ? 'Klik untuk nonaktifkan' : 'Klik untuk aktifkan'}
                        >
                          <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${prod.isActive ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                        <span className="block text-[10px] font-bold text-gray-500 mt-0.5">{prod.isActive ? 'Tampil' : 'Sembunyi'}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button type="button" onClick={() => handleOpenEditModal(prod)} className="p-1.5 rounded-lg bg-gray-100 hover:bg-[#063104] hover:text-white text-gray-700 transition-colors" title="Edit Detail Produk">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button type="button" onClick={() => handleDelete(prod.id, prod.name)} className="p-1.5 rounded-lg bg-gray-100 hover:bg-red-600 hover:text-white text-gray-700 transition-colors" title="Hapus Produk">
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

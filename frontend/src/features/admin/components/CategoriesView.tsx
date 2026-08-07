import React, { useState, useMemo } from 'react';
import {
  Plus,
  Tag,
  Package,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { useAdminStore } from '../store/useAdminStore';
import { CardsGridSkeleton } from '../../../components/common/AdminSkeletons';

export const CategoriesView: React.FC = () => {
  const { categories, addCategory, products, isLoadingData } = useAdminStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  // Filter categories by search
  const filteredCategories = useMemo(() => {
    return categories.filter((cat) =>
      cat.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [categories, searchQuery]);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    addCategory({
      name: newCatName.trim(),
      slug: newCatName.trim().toLowerCase().replace(/\s+/g, '-'),
      icon: 'Leaf',
    });

    setNewCatName('');
    setIsModalOpen(false);
  };

  if (isLoadingData) {
    return <CardsGridSkeleton items={6} />;
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Title & Top Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="hidden md:block">
          <h1 className="text-2xl font-black text-gray-900">Manajemen Kategori Produk</h1>
          <p className="text-xs text-gray-500">
            Atur chip filter kategori sayur, buah, daging, bumbu, dan kelompok produk segar lainnya.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="bg-[#063104] hover:bg-[#084205] text-white font-extrabold px-4 py-2.5 md:px-4.5 md:py-3 rounded-2xl text-xs shadow-lg hover:shadow-emerald-900/20 transition-all duration-200 flex items-center gap-2 md:gap-2.5 shrink-0 active:scale-95 border border-emerald-900/30 cursor-pointer self-start sm:self-auto"
        >
          <div className="w-5 h-5 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
          </div>
          <span>Tambah Kategori</span>
        </button>
      </div>

      {/* Header Bar: Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama kategori..."
            className="w-full bg-gray-50 text-xs md:text-sm rounded-xl py-2.5 pl-9 pr-4 border border-gray-200 focus:outline-none focus:border-[#063104] focus:bg-white"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        <div className="text-xs font-extrabold text-[#063104] bg-emerald-50 px-3.5 py-2.5 rounded-xl border border-emerald-200/80 shrink-0">
          Total: {filteredCategories.length} Kategori
        </div>
      </div>

      {/* Categories Grid Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {filteredCategories.length === 0 ? (
          <div className="col-span-full bg-white rounded-3xl p-8 text-center border border-gray-100 text-xs text-gray-400">
            Tidak ada kategori yang cocok dengan pencarian "{searchQuery}".
          </div>
        ) : (
          filteredCategories.map((cat) => {
            const prodCount = products.filter((p: any) => {
              if (cat.id === 'all') return true;
              const catVal =
                typeof p.category === 'string'
                  ? p.category
                  : typeof p.category === 'object' && p.category !== null
                    ? (p.category as any).name || (p.category as any).slug || (p.category as any).id || ''
                    : (p as any).categorySlug || '';

              const prodCategory = String(catVal || '').toLowerCase();
              const catId = String(cat.id || '').toLowerCase();
              const catSlug = String((cat as any).slug || '').toLowerCase();
              return (catId && prodCategory === catId) || (catSlug && prodCategory === catSlug);
            }).length;

            return (
              <div
                key={cat.id}
                className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs flex items-center justify-between group hover:border-[#77a160] transition-all hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#063104] flex items-center justify-center font-bold">
                    <Tag className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm capitalize">{cat.name}</h4>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <Package className="w-3.5 h-3.5 text-emerald-700" />
                      <span>{prodCount} Produk Tersedia</span>
                    </p>
                  </div>
                </div>

                <span className="bg-emerald-100 text-[#063104] text-[10px] font-black px-2.5 py-1 rounded-full uppercase">
                  {cat.id}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL TAMBAH KATEGORI BARU (Pop-up modal seperti Tambah Produk Baru) */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-[3000] bg-black/60 flex items-end md:items-center justify-center md:p-4 overflow-y-auto animate-fade-in"
          style={{ backdropFilter: 'blur(4px)' }}
        >
          <div className="bg-white rounded-t-3xl md:rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-100 flex flex-col md:my-auto">
            {/* Header Modal */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-[#F9F8F6]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#063104]" />
                <h3 className="font-extrabold text-gray-900 text-lg">
                  Tambah Kategori Baru
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

            {/* Form Body */}
            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Nama Kategori <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Minuman Herbal, Kacang-kacangan..."
                  className="w-full bg-white text-sm rounded-xl px-3.5 py-2.5 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#063104]/20 focus:border-[#063104]"
                />
              </div>

              {/* Tips Banner */}
              <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-xl p-3 text-[11px] text-[#063104] leading-relaxed space-y-1">
                <span className="font-bold flex items-center gap-1">
                  💡 Informasi Kategori:
                </span>
                <p className="text-gray-700">
                  Kategori baru akan langsung aktif dan muncul pada chip filter pencarian produk di aplikasi pengguna.
                </p>
              </div>

              {/* Modal Footer Actions */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-white hover:bg-gray-50 text-[#063104] border border-[#063104] font-bold px-5 py-2.5 rounded-xl text-xs transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!newCatName.trim()}
                  className="bg-[#063104] hover:bg-[#084205] text-white font-extrabold px-5 py-2.5 rounded-xl text-xs shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  Simpan Kategori
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

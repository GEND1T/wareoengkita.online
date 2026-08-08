import React, { useEffect } from 'react';
import { useCategoryStore } from '../store/useCategoryStore';

export const CategoryFilter: React.FC = () => {
  const {
    selectedCategory,
    setSelectedCategory,
    openCategoryModal,
    categories,
    fetchCategories,
  } = useCategoryStore();

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return (
    <div className="max-w-6xl mx-auto px-4 mb-4">
      {/* Top Header Row above chips */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 tracking-tight">
          Kategori
        </h2>
        <button
          type="button"
          onClick={openCategoryModal}
          className="text-[#77a160] hover:text-[#063104] text-xs sm:text-sm font-bold hover:underline transition-colors focus:outline-none"
        >
          Lihat Semuanya
        </button>
      </div>

      {/* Horizontal Scrollable Category Pills with Right Fade Gradient Affordance */}
      <div className="relative">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 pt-0.5 pr-10">
          {categories.map((cat) => {
            const isActive = selectedCategory.toLowerCase() === cat.id.toLowerCase();
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 focus:outline-none active:scale-95 cursor-pointer ${
                  isActive
                    ? 'bg-[#063104] text-white shadow-xs'
                    : 'bg-white text-gray-700 border border-gray-200/90 hover:border-[#063104]/40 hover:text-[#063104]'
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>

        {/* Right Fade Gradient Affordance */}
        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#F9F8F6] via-[#F9F8F6]/80 to-transparent pointer-events-none z-10" />
      </div>
    </div>
  );
};

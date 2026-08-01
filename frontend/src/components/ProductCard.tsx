import React, { useState } from 'react';
import { Plus, Check } from 'lucide-react';
import type { Product } from '../types';
import { useCartStore } from '../store/useCartStore';

interface ProductCardProps {
  product: Product;
  offsetClass?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, offsetClass = '' }) => {
  const addItem = useCartStore((state) => state.addItem);
  const [added, setAdded] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  // Format price into IDR string format: e.g. 15000 -> "Rp 15.000"
  const formattedPrice = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(product.price).replace(/\s/g, ' ');

  return (
    <div
      className={`group relative bg-white rounded-2xl p-3 sm:p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between ${offsetClass}`}
    >
      {/* Image Container with pure white background cutout */}
      <div className="relative aspect-square w-full bg-white rounded-xl overflow-hidden flex items-center justify-center mb-3">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
      </div>

      {/* Content Section */}
      <div className="flex-1 flex flex-col justify-between">
        <div className="mb-2">
          <h3 className="font-bold text-gray-900 text-sm sm:text-base leading-tight line-clamp-1">
            {product.name}
          </h3>
          <p className="text-gray-400 text-xs font-normal mt-0.5 line-clamp-1">
            {product.subtitle}
          </p>
        </div>

        {/* Price & Add Button Row */}
        <div className="flex items-end justify-between pt-1 mt-auto">
          <div>
            <span className="font-bold text-gray-900 text-sm sm:text-base leading-none">
              {formattedPrice}
            </span>
            <span className="text-gray-500 font-normal text-xs ml-1">
              {product.unit}
            </span>
          </div>

          {/* Add to Cart Button */}
          <button
            type="button"
            onClick={handleAddToCart}
            aria-label={`Tambah ${product.name} ke keranjang`}
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all duration-200 focus:outline-none active:scale-95 shrink-0 ${
              added
                ? 'bg-emerald-600 text-white scale-105'
                : 'bg-[#063104] hover:bg-[#084205] text-white shadow-xs'
            }`}
          >
            {added ? (
              <Check className="w-5 h-5 stroke-[2.5]" />
            ) : (
              <Plus className="w-5 h-5 stroke-[2.5]" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

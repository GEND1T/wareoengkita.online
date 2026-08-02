import React, { useState } from 'react';
import { Plus, Check } from 'lucide-react';
import type { Product } from '../types';
import { useCartStore } from '../store/useCartStore';
import { useProductDetailStore } from '../store/useProductDetailStore';

interface ProductCardProps {
  product: Product;
  offsetClass?: string;
  isExtendedHeight?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  offsetClass = '',
  isExtendedHeight = false,
}) => {
  const addItem = useCartStore((state) => state.addItem);
  const openProductDetail = useProductDetailStore((state) => state.openProductDetail);
  const [added, setAdded] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  const handleCardClick = () => {
    openProductDetail(product);
  };

  // Format price into IDR string format: e.g. 15000 -> "Rp 15.000"
  const formattedPrice = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(product.price).replace(/\s/g, ' ');

  return (
    <div
      onClick={handleCardClick}
      className={`group relative bg-white rounded-[20px] p-2.5 sm:p-3 border border-gray-100/90 shadow-sm hover:shadow-md hover:border-[#77a160]/40 transition-all duration-300 flex flex-col justify-between cursor-pointer ${
        isExtendedHeight ? 'pb-9 sm:pb-11' : ''
      } ${offsetClass}`}
    >
      {/* Enlarged Image Frame: Reduced padding, object-cover zoom fill, top rounded corners (half of card's 20px = 10px) */}
      <div className="relative aspect-square w-full bg-gray-50 rounded-t-[10px] sm:rounded-t-[12px] rounded-b-md overflow-hidden flex items-center justify-center mb-2.5">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover scale-105 group-hover:scale-110 transition-transform duration-300"
          loading="lazy"
        />
      </div>

      {/* Content Section */}
      <div className="flex-1 flex flex-col justify-between px-1">
        <div className="mb-2">
          <h3 className="font-bold text-gray-900 text-sm sm:text-base leading-tight line-clamp-1 group-hover:text-[#063104] transition-colors">
            {product.name}
          </h3>
          <p className="text-gray-400 text-xs font-normal mt-0.5 line-clamp-1">
            {product.subtitle}
          </p>
        </div>

        {/* Price & Add Button Row */}
        <div className="flex items-end justify-between pt-1 mt-auto">
          <div>
            <span className="font-extrabold text-gray-900 text-sm sm:text-base leading-none">
              {formattedPrice}
            </span>
            <span className="text-gray-500 font-normal text-[11px] ml-1">
              {product.unit}
            </span>
          </div>

          {/* Add to Cart Button */}
          <button
            type="button"
            onClick={handleAddToCart}
            aria-label={`Tambah ${product.name} ke keranjang`}
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all duration-200 focus:outline-none active:scale-95 shrink-0 cursor-pointer ${
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

import React, { useState } from 'react';
import { Plus, Check, Star } from 'lucide-react';
import type { Product } from '../../../types';
import { useCartStore } from '../../cart/store/useCartStore';
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

  const formattedOriginalPrice = product.originalPrice && product.originalPrice > product.price
    ? new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(product.originalPrice).replace(/\s/g, ' ')
    : null;

  return (
    <div
      onClick={handleCardClick}
      className={`group relative bg-white rounded-[20px] p-2.5 sm:p-3 border border-gray-100/90 shadow-sm hover:shadow-md hover:border-[#77a160]/40 transition-all duration-300 flex flex-col justify-between cursor-pointer ${isExtendedHeight ? 'pb-9 sm:pb-11' : ''
        } ${offsetClass}`}
    >
      {/* Enlarged Image Frame */}
      <div className="relative aspect-square w-full bg-gray-50 rounded-t-[10px] sm:rounded-t-[12px] rounded-b-md overflow-hidden flex items-center justify-center mb-2.5">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover scale-105 group-hover:scale-110 transition-transform duration-300"
          loading="lazy"
        />

        {/* Responsive Image Badges: Stacked at top-left below 480px, split left/right at 480px+ */}
        {(product.discountTag || product.badge) && (
          <div className="absolute top-2 left-2 right-2 flex flex-col min-[480px]:flex-row items-start min-[480px]:items-center min-[480px]:justify-between gap-1 pointer-events-none z-10">
            {product.discountTag ? (
              <div className="bg-red-600/90 backdrop-blur-xs text-white text-[9px] font-black px-2 py-0.5 rounded-md shadow-xs pointer-events-auto shrink-0">
                {product.discountTag}
              </div>
            ) : (
              <div className="hidden min-[480px]:block" />
            )}

            {product.badge && (
              <div className="bg-amber-500/90 backdrop-blur-xs text-white text-[9px] font-black px-2 py-0.5 rounded-md shadow-xs uppercase pointer-events-auto shrink-0 min-[480px]:ml-auto">
                {product.badge}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="flex-1 flex flex-col justify-between px-1 text-left">
        <div>
          {/* Title: 2 lines clamp for full readability */}
          <h3 className="font-extrabold text-gray-900 text-xs sm:text-sm leading-snug line-clamp-2 min-h-[2.2rem] group-hover:text-[#063104] transition-colors">
            {product.name}
          </h3>

          {/* Subtitle & Rating Row */}
          <div className="flex items-center justify-between gap-1 mt-1">
            <p className="text-gray-400 text-[11px] font-normal truncate flex-1">
              {product.subtitle !== product.name ? product.subtitle : ''}
            </p>
            {product.rating !== undefined && product.rating > 0 && (
              <div className="flex items-center gap-0.5 text-[9px] sm:text-[10px] font-bold text-amber-800 bg-amber-50/80 px-1.5 py-0.5 rounded-md shrink-0 border border-amber-200/60">
                <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                <span>{product.rating}</span>
                {product.reviewCount !== undefined && product.reviewCount > 0 && (
                  <span className="text-gray-400 font-normal text-[8px]">({product.reviewCount})</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Price & Add Button Row */}
        <div className="pt-2 mt-auto flex flex-col items-start">
          {/* Strikethrough price directly above main price */}
          {formattedOriginalPrice && (
            <span className="block text-[10px] text-gray-400 line-through font-medium leading-none mb-0.5">
              {formattedOriginalPrice}
            </span>
          )}

          <div className="w-full flex items-start justify-between gap-2">
            {/* Solid main price & unit with top padding so it doesn't stick too tightly to strikethrough price */}
            <div className="min-w-0 flex-1 pt-1">
              <div className="flex items-baseline flex-wrap gap-x-1 gap-y-0.5">
                <span className="font-black text-gray-900 text-sm sm:text-base leading-none">
                  {formattedPrice}
                </span>
                <span className="text-gray-500 font-medium text-[11px] leading-none pt-1 sm:pt-0">
                  /{product.unit.replace(/^\//, '').replace(/^per\s+/i, '')}
                </span>
              </div>
            </div>

            {/* Add to Cart Button */}
            <button
              type="button"
              onClick={handleAddToCart}
              aria-label={`Tambah ${product.name} ke keranjang`}
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-all duration-200 focus:outline-none active:scale-95 shrink-0 cursor-pointer ${added
                ? 'bg-emerald-600 text-white scale-105 shadow-xs'
                : 'bg-[#063104] hover:bg-[#084205] text-white shadow-xs'
                }`}
            >
              {added ? (
                <Check className="w-4 h-4 stroke-[2.5]" />
              ) : (
                <Plus className="w-4 h-4 stroke-[2.5]" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

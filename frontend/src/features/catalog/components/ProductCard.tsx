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

        {/* Discount Tag Badge (Top Left) */}
        {product.discountTag && (
          <div className="absolute top-2 left-2 bg-red-600/90 backdrop-blur-xs text-white text-[9px] font-black px-2 py-0.5 rounded-md shadow-xs">
            {product.discountTag}
          </div>
        )}

        {/* Product Custom Badge e.g. PROMO / BESTSELLER (Top Right) */}
        {product.badge && (
          <div className="absolute top-2 right-2 bg-amber-500/90 backdrop-blur-xs text-white text-[9px] font-black px-2 py-0.5 rounded-md shadow-xs uppercase">
            {product.badge}
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="flex-1 flex flex-col justify-between px-1">
        <div className="mb-2">
          <div className="flex items-center justify-between gap-1">
            <h3 className="font-bold text-gray-900 text-sm sm:text-base leading-tight line-clamp-1 group-hover:text-[#063104] transition-colors flex-1">
              {product.name}
            </h3>
            {product.rating !== undefined && product.rating > 0 && (
              <div className="flex items-center gap-0.5 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md shrink-0">
                <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                <span>{product.rating}</span>
                {product.reviewCount !== undefined && product.reviewCount > 0 && (
                  <span className="text-gray-400 font-normal text-[9px]">({product.reviewCount})</span>
                )}
              </div>
            )}
          </div>
          <p className="text-gray-400 text-xs font-normal mt-0.5 line-clamp-1">
            {product.subtitle}
          </p>
        </div>

        {/* Price & Add Button Row */}
        <div className="flex items-end justify-between pt-1 mt-auto">
          <div>
            {formattedOriginalPrice && (
              <span className="block text-[11px] text-gray-400 line-through font-medium leading-none mb-0.5">
                {formattedOriginalPrice}
              </span>
            )}
            <div className="flex items-baseline">
              <span className="font-extrabold text-gray-900 text-sm sm:text-base leading-none">
                {formattedPrice}
              </span>
              <span className="text-gray-500 font-normal text-[11px] ml-1">
                {product.unit}
              </span>
            </div>
          </div>

          {/* Add to Cart Button */}
          <button
            type="button"
            onClick={handleAddToCart}
            aria-label={`Tambah ${product.name} ke keranjang`}
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all duration-200 focus:outline-none active:scale-95 shrink-0 cursor-pointer ${added
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

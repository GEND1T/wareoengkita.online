import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  X,
  Plus,
  Minus,
  ShoppingBag,
  Share2,
  Star,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Store,
  ArrowRight,
} from 'lucide-react';
import type { Product } from '../../../types';
import { useProductDetailStore } from '../store/useProductDetailStore';
import { useCartStore } from '../../cart/store/useCartStore';
import { useCategoryStore } from '../store/useCategoryStore';
import { useStoreSelectorStore } from '../../store-location/store/useStoreSelectorStore';
import { API_BASE_URL } from '../../../config/api';

export const ProductDetailModal: React.FC = () => {
  const { productHistory, popProductDetail, closeAllProductDetails, pushProductDetail } =
    useProductDetailStore();
  const {
    items: cartItems,
    addItem,
    updateQuantity,
    getTotalItemsByStore,
    getTotalPriceByStore,
  } = useCartStore();
  const { selectedStoreId, getSelectedStore } = useStoreSelectorStore();
  const openCartDrawer = useCategoryStore((state) => state.openCartDrawer);
  const activeStore = getSelectedStore();

  const [isDescExpanded, setIsDescExpanded] = useState<boolean>(false);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const [storeProducts, setStoreProducts] = useState<Product[]>([]);
  const [isClosing, setIsClosing] = useState<boolean>(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const activeProduct: Product | undefined =
    productHistory.length > 0 ? productHistory[productHistory.length - 1] : undefined;

  // Auto scroll to top when active product changes
  useEffect(() => {
    if (activeProduct) {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
      setIsDescExpanded(false);
      setCurrentImageIndex(0);
      setIsClosing(false);
    }
  }, [activeProduct?.id]);

  // Fetch all store products for "Produk Lain yang Relevan"
  useEffect(() => {
    if (!activeProduct) return;

    fetch(`${API_BASE_URL}/products?storeId=${encodeURIComponent(selectedStoreId)}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          const mapped: Product[] = json.data.map((p: any) => ({
            id: p.id,
            name: p.name,
            subtitle: p.subtitle || p.name,
            price: p.price,
            originalPrice: p.originalPrice,
            discountTag: p.discountTag,
            badge: p.badge,
            unit: p.unit || '/pak',
            image: p.image,
            imagesJson: p.imagesJson,
            category: p.categorySlug || 'umum',
            storeId: p.storeId || selectedStoreId,
            isActive: p.isActive !== undefined ? p.isActive : true,
            description: p.description,
            rating: p.rating !== undefined ? p.rating : 4.9,
            reviewCount: p.reviewCount !== undefined ? p.reviewCount : 0,
            isBundle: p.isBundle !== undefined ? p.isBundle : (p.isFreshDaily !== undefined ? p.isFreshDaily : false),
            isLimitedStock: p.isLimitedStock !== undefined ? p.isLimitedStock : (p.isOrganicCertified !== undefined ? p.isOrganicCertified : false),
            stock: p.stock !== undefined ? p.stock : 50,
          }));
          setStoreProducts(mapped);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch relevant products:', err);
      });
  }, [selectedStoreId, activeProduct?.id]);

  if (!activeProduct) return null;

  const executeClose = (action: () => void) => {
    setIsClosing(true);
    setTimeout(() => {
      action();
      setIsClosing(false);
    }, 250);
  };

  const handleBack = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    executeClose(() => popProductDetail());
  };

  const handleCloseAll = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    executeClose(() => closeAllProductDetails());
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleCloseAll(e);
    }
  };

  // Cart quantity & store total calculation
  const cartItem = cartItems.find((item) => item.product.id === activeProduct.id);
  const currentQty = cartItem ? cartItem.quantity : 0;

  const storeItems = getTotalItemsByStore(selectedStoreId);
  const storePrice = getTotalPriceByStore(selectedStoreId);

  const formattedPrice = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  })
    .format(activeProduct.price)
    .replace(/\s/g, ' ');

  const formattedOriginalPrice = activeProduct.originalPrice && activeProduct.originalPrice > activeProduct.price
    ? new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    })
      .format(activeProduct.originalPrice)
      .replace(/\s/g, ' ')
    : null;

  const formattedStorePrice = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  })
    .format(storePrice)
    .replace(/\s/g, ' ');

  // Images for landscape carousel (from imagesJson or main image)
  let productImages: string[] = [];
  if (activeProduct.imagesJson) {
    try {
      const parsed = JSON.parse(activeProduct.imagesJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        productImages = parsed;
      }
    } catch {
      // parse fallback
    }
  }
  if (productImages.length === 0 && activeProduct.image) {
    productImages = [activeProduct.image];
  }

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentQty === 0) {
      addItem(activeProduct);
    } else {
      updateQuantity(activeProduct.id, currentQty + 1);
    }
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentQty > 0) {
      updateQuantity(activeProduct.id, currentQty - 1);
    }
  };

  // Relevant products (same store & same category / similar products)
  const relevantProducts = storeProducts
    .filter((p) => p.id !== activeProduct.id)
    .slice(0, 6);

  return (
    <div
      onClick={handleBackdropClick}
      className={`fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex flex-col justify-end transition-opacity duration-250 ${isClosing ? 'opacity-0' : 'animate-in fade-in duration-200'
        }`}
    >
      {/* Top Gap clickable space to close modal to main page directly */}
      <div
        onClick={handleCloseAll}
        className="w-full h-10 sm:h-12 shrink-0 cursor-pointer flex items-center justify-center"
      >
        <span className="text-[11px] font-bold text-white/80 bg-black/40 px-3 py-1 rounded-full backdrop-blur-md hover:bg-black/60 transition-all">
          Ketuk bagian atas untuk kembali ke Beranda
        </span>
      </div>

      {/* Main Full-screen Sheet Container bounded to max-w-[480px] on desktop */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-[480px] mx-auto h-[calc(100vh-2.5rem)] sm:h-[calc(100vh-3rem)] bg-[#F8FAFC] rounded-t-[28px] sm:rounded-t-[32px] shadow-2xl flex flex-col overflow-hidden transition-all duration-250 ease-in-out border-t border-white/20 ${isClosing ? 'translate-y-full opacity-0' : 'animate-in slide-in-from-bottom duration-300'
          }`}
      >
        {/* Top Drag Handle */}
        <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto my-2.5 shrink-0" />

        {/* Modal Header Bar */}
        <div className="px-4 sm:px-6 pb-3 flex items-center justify-between border-b border-gray-200/70 shrink-0">
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-1 text-xs font-bold text-gray-800 hover:text-[#063104] bg-white border border-gray-200/80 px-3 py-1.5 rounded-xl shadow-xs active:scale-95 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali</span>
          </button>

          <h2 className="font-extrabold text-gray-900 text-sm sm:text-base">Detail Produk</h2>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: activeProduct.name,
                    text: `Beli ${activeProduct.name} di Waroengkita!`,
                    url: window.location.href,
                  });
                }
              }}
              className="p-2 rounded-xl bg-white border border-gray-200/80 text-gray-600 hover:text-gray-900 transition-colors"
              title="Bagikan Produk"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleCloseAll}
              className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
              title="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Container */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 scrollbar-thin"
        >
          {/* 1. LANDSCAPE PRODUCT IMAGE CAROUSEL */}
          <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full bg-white rounded-2xl overflow-hidden border border-gray-200/70 shadow-sm group">
            <img
              src={productImages[currentImageIndex]}
              alt={activeProduct.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />

            {/* Dynamic Badges Overlay (Top Left) */}
            {activeProduct.discountTag && (
              <div className="absolute top-3 left-3 bg-red-600/90 backdrop-blur-md text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-md">
                {activeProduct.discountTag}
              </div>
            )}

            {activeProduct.badge && (
              <div className="absolute top-3 right-3 bg-amber-500/90 backdrop-blur-md text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-md uppercase">
                {activeProduct.badge}
              </div>
            )}

            {/* Left/Right Carousel Controls */}
            {productImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentImageIndex(
                      (prev) => (prev - 1 + productImages.length) % productImages.length
                    )
                  }
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-gray-800 flex items-center justify-center shadow-md backdrop-blur-xs transition-transform active:scale-95"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentImageIndex((prev) => (prev + 1) % productImages.length)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-gray-800 flex items-center justify-center shadow-md backdrop-blur-xs transition-transform active:scale-95"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                {/* Dot Indicators */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full">
                  {productImages.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`h-1.5 rounded-full transition-all ${currentImageIndex === idx ? 'w-5 bg-white' : 'w-1.5 bg-white/50'
                        }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* 2. MAIN PRODUCT INFORMATION CARD */}
          <div className="bg-white rounded-2xl p-4.5 sm:p-5 border border-gray-200/70 shadow-xs space-y-4">
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h1 className="font-extrabold text-gray-900 text-lg sm:text-xl leading-tight">
                    {activeProduct.name}
                  </h1>
                  <p className="text-xs text-gray-500 font-medium mt-1 flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5 text-[#063104]" />
                    <span>Disediakan oleh {activeStore?.name || 'Cabang Waroengkita'}</span>
                  </p>
                </div>

                <div className="flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-1 rounded-full text-xs font-bold shrink-0">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{activeProduct.rating !== undefined ? activeProduct.rating : 4.9}</span>
                  {activeProduct.reviewCount !== undefined && activeProduct.reviewCount > 0 && (
                    <span className="text-gray-400 font-normal text-[10px]">({activeProduct.reviewCount})</span>
                  )}
                </div>
              </div>

              {/* Price & Direct Quantity Control Row */}
              <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100">
                <div>
                  {formattedOriginalPrice && (
                    <span className="block text-xs text-gray-400 line-through font-medium leading-none mb-1">
                      {formattedOriginalPrice}
                    </span>
                  )}
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-black text-[#063104] text-xl sm:text-2xl">
                      {formattedPrice}
                    </span>
                    <span className="text-xs text-gray-500 font-medium">
                      {activeProduct.unit || '/pak'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 font-medium mt-1">
                    Berat: <strong className="text-emerald-800">{activeProduct.weightInGrams ? (activeProduct.weightInGrams >= 1000 ? `${(activeProduct.weightInGrams / 1000).toFixed(1)} kg` : `${activeProduct.weightInGrams} gram`) : '500 gram'}</strong>
                  </div>
                </div>

                {/* Direct Quantity Input -, qty, + */}
                {currentQty === 0 ? (
                  <button
                    type="button"
                    onClick={handleIncrement}
                    className="bg-[#063104] hover:bg-[#084205] text-white px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 transition-all"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>Tambah</span>
                  </button>
                ) : (
                  <div className="flex items-center border border-[#063104] rounded-xl bg-emerald-50 p-1 shadow-xs">
                    <button
                      type="button"
                      onClick={handleDecrement}
                      className="w-7 h-7 rounded-lg bg-white text-[#063104] flex items-center justify-center hover:bg-gray-100 shadow-xs cursor-pointer active:scale-95 transition-transform"
                    >
                      <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                    <span className="w-9 text-center font-extrabold text-sm text-[#063104]">
                      {currentQty}
                    </span>
                    <button
                      type="button"
                      onClick={handleIncrement}
                      className="w-7 h-7 rounded-lg bg-[#063104] text-white flex items-center justify-center hover:bg-[#084205] shadow-xs cursor-pointer active:scale-95 transition-transform"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Badges Info */}
            <div className="flex items-center gap-2 flex-wrap text-[11px] font-semibold text-gray-600 pt-1">
              <span className="bg-emerald-50 text-[#063104] border border-emerald-200/80 px-2.5 py-1 rounded-lg flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#063104]" />
                Stok Tersedia ({activeProduct.stock ?? 50} unit)
              </span>
              {activeProduct.isLimitedStock && (
                <span className="bg-blue-50 text-blue-900 border border-blue-200/80 px-2.5 py-1 rounded-lg">
                  Stok Terbatas
                </span>
              )}
              {activeProduct.isBundle && (
                <span className="bg-amber-50 text-amber-900 border border-amber-200/80 px-2.5 py-1 rounded-lg">
                  Paket Hemat
                </span>
              )}
            </div>

            {/* Description */}
            <div className="pt-2 border-t border-gray-100 space-y-1.5">
              <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider">
                Deskripsi Produk
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed font-medium">
                {activeProduct.subtitle}
              </p>
              {activeProduct.description && (
                <div className="pt-1">
                  <p
                    className={`text-xs text-gray-600 leading-relaxed transition-all ${isDescExpanded ? '' : 'line-clamp-2'
                      }`}
                  >
                    {activeProduct.description}
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsDescExpanded(!isDescExpanded)}
                    className="text-xs font-bold text-[#063104] hover:underline mt-1 focus:outline-none"
                  >
                    {isDescExpanded ? 'Lihat Lebih Sedikit' : 'Selengkapnya'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 3. PRODUK LAIN YANG RELEVAN SECTION */}
          {relevantProducts.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-900 font-extrabold text-sm">
                  <Sparkles className="w-4 h-4 text-[#063104]" />
                  <span>Produk Lain yang Relevan</span>
                </div>
                <span className="text-[11px] text-gray-400 font-medium">
                  {relevantProducts.length} Produk Sejenis
                </span>
              </div>

              {/* Horizontal Scrollable Row */}
              <div className="flex items-stretch gap-3 overflow-x-auto pb-3 pt-1 scrollbar-thin">
                {relevantProducts.map((relProduct) => {
                  const relPrice = new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    maximumFractionDigits: 0,
                  })
                    .format(relProduct.price)
                    .replace(/\s/g, ' ');

                  return (
                    <div
                      key={relProduct.id}
                      onClick={() => pushProductDetail(relProduct)}
                      className="w-40 sm:w-44 bg-white rounded-2xl p-2.5 border border-gray-200/70 shadow-xs hover:border-[#77a160] hover:shadow-md transition-all cursor-pointer shrink-0 flex flex-col justify-between group"
                    >
                      <div className="aspect-square w-full bg-gray-50 rounded-xl overflow-hidden mb-2 relative">
                        <img
                          src={relProduct.image}
                          alt={relProduct.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>

                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="font-bold text-gray-900 text-xs truncate leading-tight">
                            {relProduct.name}
                          </h4>
                          <p className="text-[10px] text-gray-400 truncate mt-0.5">
                            {relProduct.subtitle}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-2 mt-auto">
                          <span className="font-extrabold text-[#063104] text-xs">
                            {relPrice}
                          </span>
                          <span className="w-6 h-6 rounded-lg bg-emerald-50 text-[#063104] flex items-center justify-center font-bold text-xs group-hover:bg-[#063104] group-hover:text-white transition-colors">
                            +
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 4. FIXED FLOATING BOTTOM CART BAR INSIDE DETAIL MODAL */}
        {storeItems > 0 && (
          <div className="shrink-0 p-3.5 sm:p-4 bg-[#063104] text-white border-t border-emerald-900/40 shadow-2xl flex items-center justify-between z-20 animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center gap-3">
              <div className="relative bg-white/15 p-2 rounded-xl flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-white" />
                <span className="absolute -top-1 -right-1 bg-[#FACC15] text-[#063104] text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                  {storeItems}
                </span>
              </div>
              <div className="text-left">
                <p className="text-[10px] text-emerald-200 uppercase font-extrabold tracking-wider leading-none">
                  {activeStore?.name || 'Toko Terpilih'} • {storeItems} Produk
                </p>
                <p className="text-base font-extrabold text-white mt-1 leading-none">
                  {formattedStorePrice}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                openCartDrawer();
              }}
              className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold text-white transition-colors cursor-pointer active:scale-95"
            >
              <span>Lihat Keranjang</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

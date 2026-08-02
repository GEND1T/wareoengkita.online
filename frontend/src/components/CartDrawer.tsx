import React, { useState, useEffect } from 'react';
import { Drawer, IconButton, Divider } from '@mui/material';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  Store,
  AlertTriangle,
  Lock,
  CheckCircle2,
} from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { useCategoryStore } from '../store/useCategoryStore';
import { useStoreSelectorStore } from '../store/useStoreSelectorStore';
import { useAdminStore } from '../store/useAdminStore';
import { useUserStore } from '../store/useUserStore';
import { useLocationStore } from '../store/useLocationStore';

export const CartDrawer: React.FC = () => {
  const { isCartDrawerOpen, closeCartDrawer, openCheckout, skipCartAnimation } = useCategoryStore();
  const { items, removeItem, updateQuantity, getTotalPriceByStore, getTotalPrice } = useCartStore();
  const { stores, selectedStoreId, setSelectedStoreId } = useStoreSelectorStore();
  const { products: adminProducts } = useAdminStore();
  const { isLoggedIn, openAuthModal } = useUserStore();
  const { showToast } = useLocationStore();

  // Helper to get store name by storeId
  const getStoreName = (storeId?: string) => {
    if (!storeId) return 'OrganikStore Utama';
    const found = stores.find((s) => s.id === storeId);
    return found ? found.name : `Toko Cabang (${storeId})`;
  };

  // Group items by storeId
  const groupedByStore = items.reduce((acc, item) => {
    const sId = item.product.storeId || 'store-1';
    if (!acc[sId]) acc[sId] = [];
    acc[sId].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  const storeKeys = Object.keys(groupedByStore);

  // Active Store selected for Checkout inside CartDrawer
  const [activeCheckoutStoreId, setActiveCheckoutStoreId] = useState<string>(
    selectedStoreId || (storeKeys[0] || 'store-1')
  );

  useEffect(() => {
    if (storeKeys.length > 0 && !groupedByStore[activeCheckoutStoreId]) {
      setActiveCheckoutStoreId(storeKeys[0]);
    }
  }, [items, storeKeys, activeCheckoutStoreId, groupedByStore]);

  // Selected store items for active checkout
  const activeCheckoutItems = groupedByStore[activeCheckoutStoreId] || items;

  // Live stock validation status map for active checkout store items
  const itemValidationMap = activeCheckoutItems.reduce((acc, { product, quantity }) => {
    const liveProduct = adminProducts.find((p) => p.id === product.id) || product;
    const stock = liveProduct.stock !== undefined ? liveProduct.stock : product.stock;
    const isActive = liveProduct.isActive !== undefined ? liveProduct.isActive : (product.isActive !== false);

    const isOutOfStock = stock !== undefined && stock === 0;
    const isOverStock = stock !== undefined && stock > 0 && quantity > stock;
    const isInactive = isActive === false;

    if (isOutOfStock || isOverStock || isInactive) {
      acc[product.id] = {
        isOutOfStock,
        isOverStock,
        isInactive,
        availableStock: stock,
      };
    }
    return acc;
  }, {} as Record<string, { isOutOfStock: boolean; isOverStock: boolean; isInactive: boolean; availableStock?: number }>);

  const hasInvalidItems = Object.keys(itemValidationMap).length > 0;

  const handleCheckoutClick = () => {
    if (activeCheckoutItems.length === 0 || hasInvalidItems) return;

    if (!isLoggedIn) {
      closeCartDrawer();
      openAuthModal();
      showToast('Silakan masuk atau daftar akun terlebih dahulu untuk melanjutkan checkout.');
      return;
    }

    // Set store in storeSelectorStore to ensure checkout uses this store
    setSelectedStoreId(activeCheckoutStoreId);
    openCheckout();
  };

  const checkoutSubtotal = storeKeys.length > 0
    ? getTotalPriceByStore(activeCheckoutStoreId)
    : getTotalPrice();

  const totalPriceFormatted = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(checkoutSubtotal).replace(/\s/g, ' ');

  return (
    <Drawer
      anchor="right"
      open={isCartDrawerOpen}
      onClose={closeCartDrawer}
      transitionDuration={skipCartAnimation ? 0 : { enter: 225, exit: 225 }}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100%', sm: '460px' },
            backgroundColor: '#F9F8F6',
            p: 2.5,
            display: 'flex',
            flexDirection: 'column',
          },
        },
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-[#063104]" />
          <h2 className="font-bold text-gray-900 text-lg">Keranjang Belanja</h2>
        </div>
        <IconButton onClick={closeCartDrawer} size="small">
          <X className="w-5 h-5" />
        </IconButton>
      </div>

      <Divider className="my-1" />

      {/* Cart Content */}
      {items.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3">
          <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center text-[#77a160]">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-gray-800">Keranjang Masih Kosong</h3>
          <p className="text-xs text-gray-500 max-w-xs leading-relaxed">
            Jelajahi pilihan produk segar organik favorit Anda dan tambahkan ke keranjang.
          </p>
        </div>
      ) : (
        <>
          {/* Warning Banner if invalid items exist for selected checkout store */}
          {hasInvalidItems && (
            <div className="my-2 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-fade-in shadow-xs">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <span className="font-bold block text-rose-900">Perhatian Stok & Produk</span>
                <span className="text-[11px] leading-relaxed text-rose-700 block mt-0.5">
                  Terdapat produk pada {getStoreName(activeCheckoutStoreId)} yang stoknya habis, melebihi stok, atau dinonaktifkan. Hapus atau sesuaikan jumlah produk untuk checkout.
                </span>
              </div>
            </div>
          )}

          {/* Items List Grouped by Store */}
          <div className="flex-1 overflow-y-auto space-y-4 my-2 pr-1">
            {Object.entries(groupedByStore).map(([storeId, storeItems]) => {
              const isStoreActiveForCheckout = storeId === activeCheckoutStoreId;
              const storeTotal = storeItems.reduce((acc, i) => acc + i.product.price * i.quantity, 0);
              const storeTotalItems = storeItems.reduce((acc, i) => acc + i.quantity, 0);

              return (
                <div
                  key={storeId}
                  className={`rounded-2xl border transition-all overflow-hidden ${isStoreActiveForCheckout
                    ? 'bg-white border-[#063104] ring-2 ring-[#063104]/15 shadow-sm'
                    : 'bg-white/80 border-gray-200/90 opacity-90 hover:border-gray-300'
                    }`}
                >
                  {/* Store Header with Integrated Radio Selection Button */}
                  <label
                    onClick={() => {
                      setActiveCheckoutStoreId(storeId);
                      setSelectedStoreId(storeId);
                    }}
                    className={`flex items-center justify-between px-3 py-2.5 cursor-pointer border-b transition-colors ${isStoreActiveForCheckout
                      ? 'bg-emerald-50/90 border-emerald-200/80 text-[#063104]'
                      : 'bg-gray-100/70 border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <input
                        type="radio"
                        name="activeStoreChoice"
                        checked={isStoreActiveForCheckout}
                        onChange={() => {
                          setActiveCheckoutStoreId(storeId);
                          setSelectedStoreId(storeId);
                        }}
                        className="accent-[#063104] w-4 h-4 shrink-0"
                      />
                      <Store className="w-4 h-4 text-[#063104] shrink-0" />
                      <span className="font-extrabold text-xs text-gray-900 truncate">
                        {getStoreName(storeId)}
                      </span>
                    </div>

                    {isStoreActiveForCheckout ? (
                      <span className="bg-[#063104] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-[#FACC15]" />
                        <span>Pilihan Checkout</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-gray-500 hover:text-[#063104] shrink-0">
                        Klik untuk Pilih ➔
                      </span>
                    )}
                  </label>

                  {/* Store Products Scroll Container (Max ~3 products visible, max-height 260px) */}
                  <div className="p-2.5 max-h-[260px] overflow-y-auto space-y-2">
                    {storeItems.map(({ product, quantity }) => {
                      const validation = isStoreActiveForCheckout ? itemValidationMap[product.id] : undefined;
                      const isInvalid = !!validation;

                      return (
                        <div
                          key={product.id}
                          className={`rounded-2xl p-3 border transition-all duration-200 flex items-center gap-3 relative overflow-hidden ${isInvalid
                            ? 'bg-rose-50/90 border-rose-300 ring-1 ring-rose-300'
                            : 'bg-white border-gray-100 shadow-xs'
                            }`}
                        >
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-14 h-14 object-contain rounded-xl bg-white p-1 border border-gray-100 shrink-0"
                          />

                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-900 text-sm truncate">
                              {product.name}
                            </h4>
                            <p className="text-xs text-[#063104] font-semibold mt-0.5">
                              Rp {product.price.toLocaleString('id-ID')}
                              <span className="text-gray-400 font-normal text-[11px] ml-1">
                                {product.unit}
                              </span>
                            </p>

                            {/* Dynamic Validation Alerts */}
                            {validation && (
                              <div className="mt-1">
                                {validation.isInactive && (
                                  <span className="bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md inline-block">
                                    🚫 Produk Nonaktif / Tidak Tersedia
                                  </span>
                                )}
                                {validation.isOutOfStock && !validation.isInactive && (
                                  <span className="bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md inline-block">
                                    ❌ Stok Habis di Toko
                                  </span>
                                )}
                                {validation.isOverStock && !validation.isOutOfStock && !validation.isInactive && (
                                  <span className="bg-amber-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md inline-block">
                                    ⚠️ Stok tersisa {validation.availableStock} unit
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Quantity Controls */}
                          <div className="flex items-center gap-1.5 bg-gray-100/80 rounded-xl p-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => updateQuantity(product.id, quantity - 1)}
                              className="w-6 h-6 rounded-lg bg-white text-gray-700 hover:text-black flex items-center justify-center shadow-xs focus:outline-none"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className={`text-xs font-bold w-4 text-center ${isInvalid ? 'text-rose-700 font-black' : ''}`}>
                              {quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(product.id, quantity + 1)}
                              className="w-6 h-6 rounded-lg bg-[#063104] text-white flex items-center justify-center shadow-xs focus:outline-none"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeItem(product.id)}
                            className="text-gray-400 hover:text-red-500 p-1 focus:outline-none transition-colors"
                            title="Hapus Produk"
                          >
                            <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-600" />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Store Subtotal Footer Bar */}
                  <div className="px-3.5 py-2 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-gray-700">
                    <span className="text-gray-500 font-medium">
                      Subtotal ({storeTotalItems} item):
                    </span>
                    <span className="text-[#063104] font-extrabold text-sm">
                      Rp {storeTotal.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <Divider className="my-2" />

          {/* Footer Total & Checkout Button */}
          <div className="pt-2 space-y-3">
            <div className="flex items-center justify-between text-base">
              <div>
                <span className="font-medium text-gray-600 block text-xs">Total Belanja Siap Checkout</span>
                <span className="text-[11px] font-bold text-emerald-800 truncate block">
                  {getStoreName(activeCheckoutStoreId)}
                </span>
              </div>
              <span className="font-extrabold text-[#063104] text-lg">
                {totalPriceFormatted}
              </span>
            </div>

            <button
              type="button"
              onClick={handleCheckoutClick}
              disabled={hasInvalidItems}
              className={`w-full font-bold py-3.5 rounded-2xl shadow-md active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-sm focus:outline-none ${hasInvalidItems
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                : 'bg-[#063104] hover:bg-[#084205] text-white'
                }`}
            >
              {hasInvalidItems ? (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Checkout Terkunci (Sesuaikan Stok)</span>
                </>
              ) : (
                <>
                  <span>Checkout ({getStoreName(activeCheckoutStoreId)})</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </>
      )}
    </Drawer>
  );
};

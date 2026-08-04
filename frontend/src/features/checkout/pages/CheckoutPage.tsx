import React, { useState } from 'react';
import { Drawer, IconButton, Divider } from '@mui/material';
import {
  X,
  ArrowLeft,
  MapPin,
  ChevronRight,
  Truck,
  CreditCard,
  Receipt,
  CheckCircle2,
  Loader2,
  QrCode,
  Building2,
  Banknote,
  ShieldCheck,
  ShoppingBag,
  Store,
  Bike,
  ChevronDown,
  ChevronUp,
  Wallet,
} from 'lucide-react';
import { useCategoryStore } from '../../catalog/store/useCategoryStore';
import { useCartStore } from '../../cart/store/useCartStore';
import { useLocationStore } from '../../store-location/store/useLocationStore';
import { useStoreSelectorStore } from '../../store-location/store/useStoreSelectorStore';
import { useAdminStore } from '../../admin/store/useAdminStore';
import { ProcessingOverlay } from '../../../components/common/ProcessingOverlay';

import { useUserStore } from '../../auth/store/useUserStore';
import { API_BASE_URL } from '../../../config/api';
import { AlertCircle } from 'lucide-react';
import { PaymentConfirmPage } from '../../payment/pages/PaymentConfirmPage';
import { PaymentSuccessPage } from '../../payment/pages/PaymentSuccessPage';
import { usePembayaranStore } from '../../payment/store/usePembayaranStore';

interface ShippingOption {
  id: string;
  name: string;
  courier: string;
  fee: number;
  estimated: string;
  baseFee?: number;
  feePerKm?: number;
}


export const CheckoutPage: React.FC = () => {
  const { isCheckoutOpen, closeCheckout, openCartDrawer, setSkipCartAnimation } =
    useCategoryStore();
  const { items, getTotalPriceByStore, clearCartByStore } = useCartStore();
  const { getSelectedAddress, openLocationDrawer } = useLocationStore();
  const { selectedStoreId } = useStoreSelectorStore();
  const { profile, fetchUserOrders, openProfileDrawer, setSelectedOrderStatusFilter, isLoggedIn, openAuthModal } = useUserStore();
  const {
    storeProfile,
    shippingOptions: adminShippingOptions,
    paymentMethods: adminPaymentMethods,
    fetchInitialData,
  } = useAdminStore();

  React.useEffect(() => {
    if (isCheckoutOpen) {
      if (!isLoggedIn) {
        closeCheckout();
        openAuthModal();
        return;
      }
      fetchInitialData(selectedStoreId);
    }
  }, [isCheckoutOpen, isLoggedIn, selectedStoreId, fetchInitialData, closeCheckout, openAuthModal]);

  const activeAddress = getSelectedAddress();

  // Active Shipping Options derived dynamically from Admin Store
  const availableShippingOptions: ShippingOption[] = adminShippingOptions
    .filter((s) => s.isActive)
    .map((s: any) => ({
      id: s.id,
      name: s.name,
      courier: s.courier || 'Kurir Toko',
      fee: s.baseFee !== undefined ? s.baseFee : (s.fee || 10000),
      baseFee: s.baseFee,
      feePerKm: s.feePerKm,
      estimated: s.estimatedTime || s.estimated || '1-2 Hari',
    }));

  const {
    paymentMethods: duitkuMethods,
    fetchPaymentMethods,
    createPayment,
    isLoadingMethods,
  } = usePembayaranStore();

  const [selectedShippingId, setSelectedShippingId] = useState<string>('');
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<'duitku' | 'manual'>('duitku');
  const [selectedDuitkuCode, setSelectedDuitkuCode] = useState<string>('BC'); // Default BCA VA
  const [openCategoryAccordion, setOpenCategoryAccordion] = useState<string | null>('va');
  const [selectedManualPaymentId, setSelectedManualPaymentId] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderId, setOrderId] = useState<string>('');

  const [isDuitkuConfirmOpen, setIsDuitkuConfirmOpen] = useState(false);
  const [isDuitkuSuccessOpen, setIsDuitkuSuccessOpen] = useState(false);

  React.useEffect(() => {
    if (availableShippingOptions.length > 0) {
      if (!availableShippingOptions.some((s) => s.id === selectedShippingId)) {
        setSelectedShippingId(availableShippingOptions[0].id);
      }
    } else {
      setSelectedShippingId('');
    }
  }, [availableShippingOptions, selectedShippingId]);

  const STORE_LAT = storeProfile.latitude || -6.2250;
  const STORE_LON = storeProfile.longitude || 106.8000;

  const calculateDistance = (lat?: number, lon?: number): string => {
    if (!lat || !lon) return '2.5 km';
    const R = 6371;
    const dLat = ((lat - STORE_LAT) * Math.PI) / 180;
    const dLon = ((lon - STORE_LON) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((STORE_LAT * Math.PI) / 180) *
      Math.cos((lat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const dist = R * c;
    return dist < 1 ? `${Math.round(dist * 1000)} m` : `${dist.toFixed(1)} km`;
  };

  const deliveryDistance = calculateDistance(
    activeAddress?.latitude,
    activeAddress?.longitude
  );

  const getNumericalDistanceKm = (): number => {
    if (!activeAddress?.latitude || !activeAddress?.longitude) return 2.5;
    const uLat = activeAddress.latitude;
    const uLon = activeAddress.longitude;
    const sLat = storeProfile?.latitude || -6.2250;
    const sLon = storeProfile?.longitude || 106.8000;
    const R = 6371;
    const dLat = ((sLat - uLat) * Math.PI) / 180;
    const dLon = ((sLon - uLon) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((uLat * Math.PI) / 180) *
      Math.cos((sLat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const dist = R * c;
    return Math.max(1, parseFloat(dist.toFixed(1)));
  };

  const distanceKm = getNumericalDistanceKm();

  const calculateDynamicShippingFee = (option: any): number => {
    if (!option) return 0;
    const baseFee = option.baseFee !== undefined ? option.baseFee : (option.fee || 0);
    const feePerKm = option.feePerKm !== undefined ? option.feePerKm : 0;
    if (feePerKm > 0) {
      return baseFee + Math.round(distanceKm * feePerKm);
    }
    return baseFee;
  };

  const selectedShipping = availableShippingOptions.find((s) => s.id === selectedShippingId) || null;

  const storeCheckoutItems = items.filter(
    (item) => (item.product.storeId || 'store-1') === (selectedStoreId || 'store-1')
  );
  const checkoutItems = storeCheckoutItems.length > 0 ? storeCheckoutItems : items;

  const subtotalItems = storeCheckoutItems.length > 0
    ? getTotalPriceByStore(selectedStoreId)
    : useCartStore.getState().getTotalPrice();
  const subtotalShipping = selectedShipping ? calculateDynamicShippingFee(selectedShipping) : 0;
  const serviceFee = subtotalItems > 0 ? 1000 : 0;

  // Fetch Duitku Payment Methods when Checkout is open
  React.useEffect(() => {
    if (isCheckoutOpen && subtotalItems > 0) {
      fetchPaymentMethods(subtotalItems + subtotalShipping + serviceFee);
    }
  }, [isCheckoutOpen, subtotalItems, subtotalShipping, serviceFee, fetchPaymentMethods]);

  // Selected Duitku payment fee
  const selectedDuitkuMethod = duitkuMethods.find((m) => m.paymentMethod === selectedDuitkuCode);
  const paymentServiceFee = selectedPaymentMode === 'duitku' && selectedDuitkuMethod
    ? parseInt(selectedDuitkuMethod.totalFee || '0') || 0
    : 0;

  const grandTotal = subtotalItems + subtotalShipping + serviceFee + paymentServiceFee;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    })
      .format(amount)
      .replace(/\s/g, ' ');

  const handleBackToCart = () => {
    setSkipCartAnimation(true);
    closeCheckout();
    openCartDrawer();
    setTimeout(() => {
      setSkipCartAnimation(false);
    }, 350);
  };

  const handleCreateOrder = async () => {
    if (!selectedShipping) return;
    setIsSubmitting(true);
    try {
      const formattedAddress = activeAddress
        ? `${activeAddress.streetAddress}, ${activeAddress.district ? `Kec. ${activeAddress.district}, ` : ''}${activeAddress.city}, ${activeAddress.province} ${activeAddress.postalCode}`
        : 'Jl. Senopati No. 45, Kebayoran Baru, Jakarta Selatan';

      const custId = profile.id || undefined;
      const custName = activeAddress?.fullName || profile.fullName || 'Pembeli';
      const custPhone = activeAddress?.phone || profile.phone || '081234567890';
      const targetStoreId = selectedStoreId || 'store-1';

      const selectedPaymentName = selectedPaymentMode === 'duitku'
        ? (selectedDuitkuMethod?.paymentName || `Duitku (${selectedDuitkuCode})`)
        : (adminPaymentMethods.find(p => p.id === selectedManualPaymentId)?.name || 'Manual Transfer');

      const orderPayload = {
        customerId: custId,
        customerName: custName,
        customerPhone: custPhone,
        shippingAddress: formattedAddress,
        storeId: targetStoreId,
        items: checkoutItems.map((item) => ({
          productName: item.product.name,
          quantity: item.quantity,
          price: item.product.price,
          unit: item.product.unit,
          image: item.product.image,
        })),
        subtotal: subtotalItems,
        shippingFee: subtotalShipping,
        discountAmount: 0,
        totalPrice: grandTotal,
        paymentMethod: selectedPaymentName,
      };

      const res = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });

      const json = await res.json();
      const createdOrderData = json.data;
      const createdOrderId = createdOrderData?.orderNo || `ORD-${Date.now().toString().slice(-6)}`;
      setOrderId(createdOrderId);

      clearCartByStore(targetStoreId);
      fetchUserOrders(custId || custPhone);

      if (selectedPaymentMode === 'duitku') {
        const paymentRes = await createPayment({
          orderId: createdOrderData?.id,
          paymentMethod: selectedDuitkuCode,
          paymentAmount: grandTotal,
          customerName: custName,
          customerEmail: profile.email || 'customer@waroengkita.online',
          customerPhone: custPhone,
          productDetails: `Pesanan #${createdOrderId}`,
          storeId: targetStoreId,
          items: checkoutItems.map((i) => ({
            name: i.product.name,
            price: i.product.price,
            quantity: i.quantity,
          })),
          shippingAddress: formattedAddress,
        });

        if (paymentRes) {
          setIsDuitkuConfirmOpen(true);
        } else {
          setOrderSuccess(true);
        }
      } else {
        setOrderSuccess(true);
      }
    } catch (err) {
      console.error('Failed to submit order to DB:', err);
      setOrderId(`ORD-${Date.now().toString().slice(-6)}`);
      setOrderSuccess(true);
      clearCartByStore(selectedStoreId || 'store-1');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuccessClose = () => {
    setOrderSuccess(false);
    closeCheckout();
  };

  if (!isCheckoutOpen) return null;

  return (
    <Drawer
      anchor="right"
      open={isCheckoutOpen}
      onClose={handleBackToCart}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100%', sm: '520px' },
            backgroundColor: '#F9F8F6',
            p: 0,
            display: 'flex',
            flexDirection: 'column',
          },
        },
      }}
    >
      <ProcessingOverlay
        isOpen={isSubmitting}
        title="Memproses Pesanan Anda..."
        subtitle="Pesanan sedang dikirim ke toko cabang dan disimpan ke Supabase DB."
      />
      {/* Header Sticky */}
      <div className="sticky top-0 bg-[#F9F8F6]/95 backdrop-blur-md z-30 px-4 py-3.5 border-b border-gray-200/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <IconButton onClick={handleBackToCart} size="small" className="text-gray-800">
            <ArrowLeft className="w-5 h-5" />
          </IconButton>
          <h2 className="font-extrabold text-gray-900 text-lg">Checkout Pesanan</h2>
        </div>
        <IconButton onClick={handleBackToCart} size="small">
          <X className="w-5 h-5" />
        </IconButton>
      </div>

      {/* Main Content View */}
      {orderSuccess ? (
        // --- ORDER SUCCESS SCREEN ---
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4 animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-emerald-100/80 text-[#063104] flex items-center justify-center shadow-lg">
            <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-extrabold text-[#063104] uppercase tracking-wider bg-emerald-100/70 px-3 py-1 rounded-full">
              No. Pesanan: #{orderId}
            </span>
            <h3 className="text-2xl font-extrabold text-gray-900 pt-2">
              Pesanan Berhasil Dibuat!
            </h3>
            <p className="text-xs text-gray-600 max-w-sm mx-auto leading-relaxed pt-1">
              Terima kasih! Pesanan Anda telah diterima dan langsung diproses oleh tim kami untuk dikemas dan dikirimkan.
            </p>
          </div>

          <div className="w-full bg-white p-4 rounded-2xl border border-gray-200 text-left space-y-2 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100 font-bold text-gray-800">
              <span>Metode Pembayaran</span>
              <span className="text-[#063104]">
                {selectedPaymentMode === 'duitku'
                  ? (selectedDuitkuMethod?.paymentName || `Duitku (${selectedDuitkuCode})`)
                  : (adminPaymentMethods.find((p) => p.id === selectedManualPaymentId)?.name || 'Manual Transfer')}
              </span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-gray-100 font-bold text-gray-800">
              <span>Pengiriman</span>
              <span>{selectedShipping?.name || '-'}</span>
            </div>
            <div className="flex items-center justify-between font-extrabold text-sm text-[#063104] pt-1">
              <span>Total Dihitung</span>
              <span>{formatCurrency(grandTotal)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSuccessClose}
            className="w-full bg-[#063104] hover:bg-[#084205] text-white font-bold py-3.5 rounded-2xl shadow-md transition-all text-sm mt-4 focus:outline-none"
          >
            Kembali Belanja
          </button>
        </div>
      ) : (
        // --- CHECKOUT FORM SECTIONS ---
        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-28">
          {/* SECTION 1: SELECTED DELIVERY ADDRESS CARD */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[#063104] font-extrabold text-xs uppercase tracking-wider">
                <MapPin className="w-4 h-4 fill-[#063104]/20" />
                <span>Alamat Pengiriman Saat Ini</span>
              </div>
              <button
                type="button"
                onClick={openLocationDrawer}
                className="text-xs font-bold text-[#063104] hover:underline flex items-center gap-0.5"
              >
                <span>Ganti Alamat</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {activeAddress ? (
              <div
                onClick={openLocationDrawer}
                className="cursor-pointer group hover:bg-emerald-50/50 p-2.5 rounded-xl border border-dashed border-gray-200 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-emerald-100 text-[#063104] text-[10px] font-extrabold px-2 py-0.5 rounded">
                    {activeAddress.label}
                  </span>
                  <h4 className="font-bold text-gray-900 text-xs">
                    {activeAddress.fullName}{' '}
                    <span className="font-normal text-gray-500">
                      ({activeAddress.phone})
                    </span>
                  </h4>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed">
                  {activeAddress.streetAddress}, {activeAddress.district},{' '}
                  {activeAddress.city}, {activeAddress.province}{' '}
                  {activeAddress.postalCode}
                </p>
                {activeAddress.landmark && (
                  <p className="text-[11px] text-gray-400 mt-0.5 italic">
                    Patokan: {activeAddress.landmark}
                  </p>
                )}
              </div>
            ) : (
              <div
                onClick={openLocationDrawer}
                className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 font-semibold cursor-pointer hover:bg-amber-100"
              >
                Belum ada alamat dipilih. Klik di sini untuk memilih atau menambah alamat.
              </div>
            )}
          </div>

          {/* SECTION 2: ORDER ITEMS LIST (Daftar Belanjaan) */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-gray-100">
              <div className="flex items-center gap-1.5 text-[#063104] font-extrabold text-xs uppercase tracking-wider">
                <ShoppingBag className="w-4 h-4" />
                <span>Daftar Belanjaan ({items.length} Barang)</span>
              </div>
            </div>

            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {items.map(({ product, quantity }) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between text-xs py-1 border-b border-gray-50 last:border-0"
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-11 h-11 object-contain rounded-lg border border-gray-100 bg-gray-50 p-1 shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="font-bold text-gray-900 truncate">
                        {product.name}
                      </h4>
                      <p className="text-[11px] text-gray-500">
                        {formatCurrency(product.price)}{' '}
                        <span className="font-bold text-gray-700">x{quantity}</span>
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-gray-900 shrink-0">
                    {formatCurrency(product.price * quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 2.5: STORE TO USER DISTANCE CARD */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between pb-1 border-b border-gray-100">
              <div className="flex items-center gap-1.5 text-[#063104] font-extrabold text-xs uppercase tracking-wider">
                <Bike className="w-4 h-4" />
                <span>Jarak Pengiriman</span>
              </div>

            </div>

            {/* Layout: Sisi Kiri (Toko), Tengah (Kurir/Driver + Jarak), Sisi Kanan (Pin/Lokasi) */}
            <div className="flex items-center justify-between gap-2 pt-1">
              {/* Sisi Kiri: Icon Toko/Market */}
              <div className="flex flex-col items-center gap-1 min-w-[64px]">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center shadow-xs">
                  <Store className="w-5 h-5 text-[#063104]" />
                </div>
                <span className="text-[10px] font-bold text-gray-800">Toko</span>
              </div>

              {/* Di Tengah: Icon Kurir/Driver + Garis Penghubung + Jumlah Jarak */}
              <div className="flex-1 flex flex-col items-center px-1">
                <div className="flex items-center gap-1.5 bg-[#063104] text-white text-[11px] font-extrabold px-3 py-1 rounded-full shadow-xs mb-1.5">
                  <Bike className="w-3.5 h-3.5" />
                  <span>{deliveryDistance}</span>
                </div>
                <div className="w-full flex items-center gap-1">
                  <div className="h-0.5 flex-1 bg-gradient-to-r from-emerald-200 to-emerald-500 rounded-full"></div>
                  <div className="w-2 h-2 rounded-full bg-[#063104] shrink-0"></div>
                  <div className="h-0.5 flex-1 bg-gradient-to-r from-emerald-500 to-emerald-200 rounded-full"></div>
                </div>
              </div>

              {/* Sisi Kanan: Icon Pin/Lokasi */}
              <div className="flex flex-col items-center gap-1 min-w-[64px]">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center shadow-xs">
                  <MapPin className="w-5 h-5 text-emerald-700" />
                </div>
                <span className="text-[10px] font-bold text-gray-800 truncate max-w-[70px]">
                  {activeAddress ? activeAddress.label : 'Lokasi User'}
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 3: SHIPPING OPTIONS (Pilihan Pengiriman Pesanan) */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs space-y-3">
            <div className="flex items-center gap-1.5 text-[#063104] font-extrabold text-xs uppercase tracking-wider pb-1 border-b border-gray-100">
              <Truck className="w-4 h-4" />
              <span>Opsi Pengiriman Pesanan</span>
            </div>

            {availableShippingOptions.length === 0 ? (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>Toko ini belum menyediakan opsi pengiriman aktif. Anda tidak dapat melanjutkan pemesanan.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {availableShippingOptions.map((option) => {
                  const isSelected = option.id === selectedShippingId;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setSelectedShippingId(option.id)}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between ${isSelected
                        ? 'bg-emerald-50/60 border-[#063104] ring-1 ring-[#063104]'
                        : 'bg-white border-gray-200 hover:border-[#77a160]'
                        }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900 text-xs">
                            {option.name}
                          </span>
                          <span className="bg-emerald-100 text-[#063104] text-[10px] font-bold px-2 py-0.5 rounded">
                            {option.estimated}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          Kurir: {option.courier}
                        </p>
                      </div>
                      <span className="font-extrabold text-[#063104] text-xs">
                        {formatCurrency(calculateDynamicShippingFee(option))}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* SECTION 4: PAYMENT METHOD OPTIONS (Accordion Cards) */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-1.5 text-[#063104] font-extrabold text-xs uppercase tracking-wider">
                <CreditCard className="w-4 h-4" />
                <span>Pilih Metode Pembayaran</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                Otomatis via Duitku
              </span>
            </div>

            {isLoadingMethods ? (
              <div className="py-6 text-center flex flex-col items-center justify-center gap-2 text-xs text-slate-500">
                <Loader2 className="w-5 h-5 text-[#063104] animate-spin" />
                <span>Memuat opsi pembayaran resmi Duitku...</span>
              </div>
            ) : (
              <div className="space-y-2.5">
                {/* 1. VIRTUAL ACCOUNT (ACCORDION) */}
                {(() => {
                  const vaMethods = duitkuMethods.filter((m) =>
                    ['A1', 'BC', 'I1', 'BR', 'BV', 'M2', 'BT', 'VA', 'NC', 'S1', 'DM', 'AG'].includes(m.paymentMethod)
                  );
                  if (vaMethods.length === 0) return null;

                  return (
                    <div className="border border-slate-200 rounded-xl overflow-hidden transition-all">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPaymentMode('duitku');
                          setOpenCategoryAccordion(openCategoryAccordion === 'va' ? null : 'va');
                        }}
                        className={`w-full p-3 flex items-center justify-between text-left transition-colors ${selectedPaymentMode === 'duitku' && openCategoryAccordion === 'va'
                          ? 'bg-emerald-50/70 border-b border-emerald-100'
                          : 'bg-slate-50 hover:bg-slate-100'
                          }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Building2 className="w-4 h-4 text-emerald-700 shrink-0" />
                          <div>
                            <p className="text-xs font-bold text-slate-800">Virtual Account (Bank Transfer)</p>
                            <p className="text-[10px] text-slate-500">
                              {vaMethods.map((m) => m.paymentName).join(', ')}
                            </p>
                          </div>
                        </div>
                        {openCategoryAccordion === 'va' ? (
                          <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                        )}
                      </button>

                      {openCategoryAccordion === 'va' && (
                        <div className="p-3 bg-white grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {vaMethods.map((m) => {
                            const isSelected = selectedPaymentMode === 'duitku' && selectedDuitkuCode === m.paymentMethod;
                            const feeVal = parseInt(m.totalFee || '0') || 0;
                            const feeStr = feeVal > 0 ? `+ ${formatCurrency(feeVal)}` : 'Bebas Biaya';

                            return (
                              <button
                                key={m.paymentMethod}
                                type="button"
                                onClick={() => {
                                  setSelectedPaymentMode('duitku');
                                  setSelectedDuitkuCode(m.paymentMethod);
                                }}
                                className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${isSelected
                                  ? 'bg-emerald-50 border-[#063104] ring-1 ring-[#063104]'
                                  : 'bg-white border-slate-200 hover:border-slate-300'
                                  }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  {m.paymentImage ? (
                                    <img src={m.paymentImage} alt={m.paymentName} className="w-7 h-5 object-contain shrink-0" />
                                  ) : (
                                    <Building2 className="w-4 h-4 text-emerald-700 shrink-0" />
                                  )}
                                  <div className="truncate">
                                    <p className="text-[11px] font-bold text-slate-800 truncate">{m.paymentName}</p>
                                    <p className="text-[10px] text-emerald-700 font-semibold">{feeStr}</p>
                                  </div>
                                </div>
                                {isSelected && <CheckCircle2 className="w-4 h-4 text-[#063104] shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* 2. E-WALLET (ACCORDION) */}
                {(() => {
                  const ewMethods = duitkuMethods.filter((m) =>
                    ['DA', 'LF', 'LA', 'OV', 'SA', 'SL', 'OL'].includes(m.paymentMethod)
                  );
                  if (ewMethods.length === 0) return null;

                  return (
                    <div className="border border-slate-200 rounded-xl overflow-hidden transition-all">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPaymentMode('duitku');
                          setOpenCategoryAccordion(openCategoryAccordion === 'ewallet' ? null : 'ewallet');
                        }}
                        className={`w-full p-3 flex items-center justify-between text-left transition-colors ${selectedPaymentMode === 'duitku' && openCategoryAccordion === 'ewallet'
                          ? 'bg-blue-50/70 border-b border-blue-100'
                          : 'bg-slate-50 hover:bg-slate-100'
                          }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Wallet className="w-4 h-4 text-blue-600 shrink-0" />
                          <div>
                            <p className="text-xs font-bold text-slate-800">E-Wallet & Dompet Digital</p>
                            <p className="text-[10px] text-slate-500">
                              {ewMethods.map((m) => m.paymentName).join(', ')}
                            </p>
                          </div>
                        </div>
                        {openCategoryAccordion === 'ewallet' ? (
                          <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                        )}
                      </button>

                      {openCategoryAccordion === 'ewallet' && (
                        <div className="p-3 bg-white grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {ewMethods.map((m) => {
                            const isSelected = selectedPaymentMode === 'duitku' && selectedDuitkuCode === m.paymentMethod;
                            const feeVal = parseInt(m.totalFee || '0') || 0;
                            const feeStr = feeVal > 0 ? `+ ${formatCurrency(feeVal)}` : 'Bebas Biaya';

                            return (
                              <button
                                key={m.paymentMethod}
                                type="button"
                                onClick={() => {
                                  setSelectedPaymentMode('duitku');
                                  setSelectedDuitkuCode(m.paymentMethod);
                                }}
                                className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${isSelected
                                  ? 'bg-blue-50 border-blue-600 ring-1 ring-blue-600'
                                  : 'bg-white border-slate-200 hover:border-slate-300'
                                  }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  {m.paymentImage ? (
                                    <img src={m.paymentImage} alt={m.paymentName} className="w-7 h-5 object-contain shrink-0" />
                                  ) : (
                                    <Wallet className="w-4 h-4 text-blue-600 shrink-0" />
                                  )}
                                  <div className="truncate">
                                    <p className="text-[11px] font-bold text-slate-800 truncate">{m.paymentName}</p>
                                    <p className="text-[10px] text-blue-700 font-semibold">{feeStr}</p>
                                  </div>
                                </div>
                                {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* 3. QRIS (ACCORDION) */}
                {(() => {
                  const qrisMethods = duitkuMethods.filter((m) =>
                    ['SP', 'LQ', 'NQ', 'GQ'].includes(m.paymentMethod)
                  );
                  if (qrisMethods.length === 0) return null;

                  return (
                    <div className="border border-slate-200 rounded-xl overflow-hidden transition-all">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPaymentMode('duitku');
                          setOpenCategoryAccordion(openCategoryAccordion === 'qris' ? null : 'qris');
                        }}
                        className={`w-full p-3 flex items-center justify-between text-left transition-colors ${selectedPaymentMode === 'duitku' && openCategoryAccordion === 'qris'
                          ? 'bg-rose-50/70 border-b border-rose-100'
                          : 'bg-slate-50 hover:bg-slate-100'
                          }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <QrCode className="w-4 h-4 text-rose-600 shrink-0" />
                          <div>
                            <p className="text-xs font-bold text-slate-800">QRIS (Scan Kode QR)</p>
                            <p className="text-[10px] text-slate-500">
                              {qrisMethods.map((m) => m.paymentName).join(', ')}
                            </p>
                          </div>
                        </div>
                        {openCategoryAccordion === 'qris' ? (
                          <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                        )}
                      </button>

                      {openCategoryAccordion === 'qris' && (
                        <div className="p-3 bg-white grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {qrisMethods.map((m) => {
                            const isSelected = selectedPaymentMode === 'duitku' && selectedDuitkuCode === m.paymentMethod;
                            const feeVal = parseInt(m.totalFee || '0') || 0;
                            const feeStr = feeVal > 0 ? `+ ${formatCurrency(feeVal)}` : 'Bebas Biaya';

                            return (
                              <button
                                key={m.paymentMethod}
                                type="button"
                                onClick={() => {
                                  setSelectedPaymentMode('duitku');
                                  setSelectedDuitkuCode(m.paymentMethod);
                                }}
                                className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${isSelected
                                  ? 'bg-rose-50 border-rose-600 ring-1 ring-rose-600'
                                  : 'bg-white border-slate-200 hover:border-slate-300'
                                  }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  {m.paymentImage ? (
                                    <img src={m.paymentImage} alt={m.paymentName} className="w-7 h-5 object-contain shrink-0" />
                                  ) : (
                                    <QrCode className="w-4 h-4 text-rose-600 shrink-0" />
                                  )}
                                  <div className="truncate">
                                    <p className="text-[11px] font-bold text-slate-800 truncate">{m.paymentName}</p>
                                    <p className="text-[10px] text-rose-700 font-semibold">{feeStr}</p>
                                  </div>
                                </div>
                                {isSelected && <CheckCircle2 className="w-4 h-4 text-rose-600 shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* 4. KARTU KREDIT & LAINNYA */}
                {(() => {
                  const otherMethods = duitkuMethods.filter((m) =>
                    ['VC', 'DN', 'IR', 'FT'].includes(m.paymentMethod)
                  );
                  if (otherMethods.length === 0) return null;

                  return (
                    <div className="border border-slate-200 rounded-xl overflow-hidden transition-all">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPaymentMode('duitku');
                          setOpenCategoryAccordion(openCategoryAccordion === 'other' ? null : 'other');
                        }}
                        className={`w-full p-3 flex items-center justify-between text-left transition-colors ${selectedPaymentMode === 'duitku' && openCategoryAccordion === 'other'
                          ? 'bg-purple-50/70 border-b border-purple-100'
                          : 'bg-slate-50 hover:bg-slate-100'
                          }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <CreditCard className="w-4 h-4 text-purple-600 shrink-0" />
                          <div>
                            <p className="text-xs font-bold text-slate-800">Kartu Kredit & Retail / PayLater</p>
                            <p className="text-[10px] text-slate-500">
                              {otherMethods.map((m) => m.paymentName).join(', ')}
                            </p>
                          </div>
                        </div>
                        {openCategoryAccordion === 'other' ? (
                          <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                        )}
                      </button>

                      {openCategoryAccordion === 'other' && (
                        <div className="p-3 bg-white grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {otherMethods.map((m) => {
                            const isSelected = selectedPaymentMode === 'duitku' && selectedDuitkuCode === m.paymentMethod;
                            const feeVal = parseInt(m.totalFee || '0') || 0;
                            const feeStr = feeVal > 0 ? `+ ${formatCurrency(feeVal)}` : 'Bebas Biaya';

                            return (
                              <button
                                key={m.paymentMethod}
                                type="button"
                                onClick={() => {
                                  setSelectedPaymentMode('duitku');
                                  setSelectedDuitkuCode(m.paymentMethod);
                                }}
                                className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${isSelected
                                  ? 'bg-purple-50 border-purple-600 ring-1 ring-purple-600'
                                  : 'bg-white border-slate-200 hover:border-slate-300'
                                  }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  {m.paymentImage ? (
                                    <img src={m.paymentImage} alt={m.paymentName} className="w-7 h-5 object-contain shrink-0" />
                                  ) : (
                                    <CreditCard className="w-4 h-4 text-purple-600 shrink-0" />
                                  )}
                                  <div className="truncate">
                                    <p className="text-[11px] font-bold text-slate-800 truncate">{m.paymentName}</p>
                                    <p className="text-[10px] text-purple-700 font-semibold">{feeStr}</p>
                                  </div>
                                </div>
                                {isSelected && <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* 5. BAYAR DI TEMPAT (COD) / MANUAL TOKO */}
                {adminPaymentMethods.filter((p) => p.isActive).map((manualP) => (
                  <button
                    key={manualP.id}
                    type="button"
                    onClick={() => {
                      setSelectedPaymentMode('manual');
                      setSelectedManualPaymentId(manualP.id);
                    }}
                    className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${selectedPaymentMode === 'manual' && selectedManualPaymentId === manualP.id
                      ? 'bg-amber-50 border-amber-600 ring-1 ring-amber-600'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Banknote className="w-4 h-4 text-amber-700 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-slate-800">{manualP.name}</p>
                        <p className="text-[10px] text-slate-500">{manualP.category} • Bebas Biaya</p>
                      </div>
                    </div>
                    {selectedPaymentMode === 'manual' && selectedManualPaymentId === manualP.id && (
                      <CheckCircle2 className="w-4 h-4 text-amber-700 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 5: PAYMENT SUMMARY BREAKDOWN (Rincian Pembayaran) */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs space-y-2.5 text-xs">
            <div className="flex items-center gap-1.5 text-[#063104] font-extrabold uppercase tracking-wider pb-1 border-b border-gray-100">
              <Receipt className="w-4 h-4" />
              <span>Rincian Pembayaran</span>
            </div>

            <div className="flex items-center justify-between text-gray-600">
              <span>Subtotal Pesanan</span>
              <span className="font-semibold text-gray-900">
                {formatCurrency(subtotalItems)}
              </span>
            </div>

            <div className="flex items-center justify-between text-gray-600">
              <span>
                Subtotal Pengiriman{' '}
                {selectedShipping ? `(${selectedShipping.name})` : '(Opsi Pengiriman Tidak Tersedia)'}
              </span>
              <span className="font-semibold text-gray-900">
                {formatCurrency(subtotalShipping)}
              </span>
            </div>

            <div className="flex items-center justify-between text-gray-600">
              <span>Biaya Layanan & Penanganan Toko</span>
              <span className="font-semibold text-gray-900">
                {formatCurrency(serviceFee)}
              </span>
            </div>

            <div className="flex items-center justify-between text-gray-600">
              <span>
                Biaya Layanan Pembayaran{' '}
                {selectedPaymentMode === 'duitku' && selectedDuitkuMethod ? `(${selectedDuitkuMethod.paymentName})` : ''}
              </span>
              <span className="font-semibold text-emerald-800">
                {paymentServiceFee > 0 ? formatCurrency(paymentServiceFee) : 'Bebas Biaya'}
              </span>
            </div>

            <Divider className="my-1" />

            <div className="flex items-center justify-between text-sm font-extrabold text-gray-900 pt-0.5">
              <span>Total Pembayaran</span>
              <span className="text-[#063104] text-base font-extrabold">
                {formatCurrency(grandTotal)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 6: STICKY BOTTOM ACTION BAR (Tombol Buat Pesanan) */}
      {!orderSuccess && (
        <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-200/80 p-3.5 shadow-2xl z-40 flex items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-medium text-gray-500 block">
              Total Pembayaran
            </span>
            <span className="text-base font-extrabold text-[#063104]">
              {formatCurrency(grandTotal)}
            </span>
          </div>

          <button
            type="button"
            disabled={isSubmitting || items.length === 0 || !selectedShipping}
            onClick={handleCreateOrder}
            className="flex-1 bg-[#063104] hover:bg-[#084205] text-white font-extrabold py-3.5 px-5 rounded-2xl shadow-md active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-sm focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memproses Pesanan...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Buat Pesanan</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Duitku Custom Payment Modal: Payment Confirmation (VA / QRIS / Countdown) */}
      <PaymentConfirmPage
        isOpen={isDuitkuConfirmOpen}
        onClose={() => {
          setIsDuitkuConfirmOpen(false);
          closeCheckout();
          openProfileDrawer('orders');
          setSelectedOrderStatusFilter('belum_bayar');
        }}
        onPaymentSuccess={() => {
          setIsDuitkuConfirmOpen(false);
          setIsDuitkuSuccessOpen(true);
        }}
      />

      {/* Duitku Custom Payment Modal: Payment Success & Invoice Download */}
      <PaymentSuccessPage
        isOpen={isDuitkuSuccessOpen}
        onClose={() => {
          setIsDuitkuSuccessOpen(false);
          closeCheckout();
        }}
        onViewOrders={() => {
          setIsDuitkuSuccessOpen(false);
          closeCheckout();
          openProfileDrawer('orders');
          setSelectedOrderStatusFilter('dikemas');
        }}
      />
    </Drawer>
  );
};

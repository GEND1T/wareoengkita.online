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
  Zap,
  Package,
  Map as MapIcon,
  CalendarDays,
  HandCoins,
  Phone,
  Clock,
  Home,
} from 'lucide-react';
import PickupLocationMapModal from '../components/PickupLocationMapModal';
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
  type: string;
  courier: string;
  fee: number;
  estimated: string;
  internalFee?: number;
  baseFee?: number;
  feePerKm?: number;
  pickupFee?: number;
  maxRadiusKm?: number;
  scheduleMode?: string;
  scheduleSlots?: any[];
  pickupLocations?: any[];
  biteshipRates?: any[];
  withinCodZone?: boolean;
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

  const targetStoreId = selectedStoreId || 'store-1';
  const storeCheckoutItems = items.filter(
    (item) => (item.product.storeId || 'store-1') === targetStoreId
  );
  const checkoutItems = storeCheckoutItems;

  // State Declarations
  const [shippingRatesData, setShippingRatesData] = useState<any[]>([]);
  const [isLoadingRates, setIsLoadingRates] = useState<boolean>(false);
  const [selectedBiteshipServiceCode, setSelectedBiteshipServiceCode] = useState<string>('');

  const [selectedShippingId, setSelectedShippingId] = useState<string>('');
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<'duitku' | 'manual'>('duitku');
  const [selectedDuitkuCode, setSelectedDuitkuCode] = useState<string>('BC');
  const [openCategoryAccordion, setOpenCategoryAccordion] = useState<string | null>('va');
  const [selectedManualPaymentId, setSelectedManualPaymentId] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderId, setOrderId] = useState<string>('');

  // Shipping type specific state
  const [selectedPickupLocationId, setSelectedPickupLocationId] = useState<string>('');
  const [selectedScheduledDate, setSelectedScheduledDate] = useState<string>('');
  const [selectedScheduledSlot, setSelectedScheduledSlot] = useState<string>('');
  const [pickupLocations, setPickupLocations] = useState<any[]>([]);
  const [openShippingAccordion, setOpenShippingAccordion] = useState<string | null>('instant');
  const [isPickupMapModalOpen, setIsPickupMapModalOpen] = useState(false);

  const [isDuitkuConfirmOpen, setIsDuitkuConfirmOpen] = useState(false);
  const [isDuitkuSuccessOpen, setIsDuitkuSuccessOpen] = useState(false);

  // Active Shipping Options derived dynamically from Rates API or Admin Store fallback
  const availableShippingOptions: ShippingOption[] = (
    shippingRatesData.length > 0 ? shippingRatesData : adminShippingOptions.filter((s) => s.isActive)
  ).map((s: any) => ({
    id: s.id,
    name: s.name,
    type: s.type || 'instant',
    courier: s.courier || 'Kurir Toko',
    internalFee: s.internalFee,
    fee: s.internalFee !== undefined ? s.internalFee : (s.baseFee !== undefined ? s.baseFee : (s.fee || 10000)),
    baseFee: s.baseFee,
    feePerKm: s.feePerKm,
    pickupFee: s.pickupFee || s.fee || 0,
    maxRadiusKm: s.maxRadiusKm,
    scheduleMode: s.scheduleMode,
    scheduleSlots: s.scheduleSlots,
    biteshipRates: s.biteshipRates || [],
    estimated: s.estimatedTime || s.estimated || 'Hari ini',
  }));

  const {
    paymentMethods: duitkuMethods,
    fetchPaymentMethods,
    createPayment,
    isLoadingMethods,
  } = usePembayaranStore();

  React.useEffect(() => {
    if (availableShippingOptions.length > 0) {
      if (!availableShippingOptions.some((s) => s.id === selectedShippingId)) {
        const firstOpt = availableShippingOptions[0];
        setSelectedShippingId(firstOpt.id);
        if (firstOpt.type === 'instant') setOpenShippingAccordion(firstOpt.id);
      }
    } else {
      setSelectedShippingId('');
    }
  }, [availableShippingOptions, selectedShippingId]);

  // Fetch pickup locations when a pickup option is selected
  const selectedShippingType = availableShippingOptions.find(s => s.id === selectedShippingId)?.type;
  React.useEffect(() => {
    if (selectedShippingType === 'pickup' && (selectedStoreId || 'store-1')) {
      const fetchPL = async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/shipping/pickup-locations?storeId=${selectedStoreId || 'store-1'}`);
          const json = await res.json();
          if (json.success) setPickupLocations(json.data);
        } catch (err) { console.error('Failed to fetch pickup locations:', err); }
      };
      fetchPL();
    }
  }, [selectedShippingType, selectedStoreId]);

  // Package total weight calculation in grams
  const totalPackageWeightGrams = checkoutItems.reduce(
    (sum, item) => sum + (item.product.weightInGrams || 500) * item.quantity,
    0
  );
  const formattedTotalWeight =
    totalPackageWeightGrams >= 1000
      ? `${(totalPackageWeightGrams / 1000).toFixed(1)} kg`
      : `${totalPackageWeightGrams} gram`;

  const ratesCacheRef = React.useRef<{ key: string; data: any[] } | null>(null);

  // Fetch real-time Biteship & internal rates from POST /api/shipping/rates (with caching)
  React.useEffect(() => {
    if (isCheckoutOpen) {
      const targetStore = selectedStoreId || 'store-1';
      const userLat = activeAddress?.latitude || -6.2088;
      const userLon = activeAddress?.longitude || 106.8456;

      const cacheKey = `${targetStore}_${userLat}_${userLon}_${totalPackageWeightGrams}_${checkoutItems.length}`;

      // Token saver: reuse cached rates if location and cart weight remain unchanged
      if (ratesCacheRef.current && ratesCacheRef.current.key === cacheKey) {
        setShippingRatesData(ratesCacheRef.current.data);
        setIsLoadingRates(false);
        return;
      }

      const fetchRates = async () => {
        setIsLoadingRates(true);
        try {
          const res = await fetch(`${API_BASE_URL}/shipping/rates`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              storeId: targetStore,
              userLat,
              userLon,
              items: checkoutItems.map((i) => ({
                name: i.product.name,
                price: i.product.price,
                weight: i.product.weightInGrams || 500,
                weightInGrams: i.product.weightInGrams || 500,
                quantity: i.quantity,
              })),
            }),
          });
          const json = await res.json();
          if (json.success && json.data) {
            const optionsArr = json.data.options || (Array.isArray(json.data) ? json.data : []);
            ratesCacheRef.current = { key: cacheKey, data: optionsArr };
            setShippingRatesData(optionsArr);
          }
        } catch (err) {
          console.error('[Checkout] Error fetching shipping rates:', err);
        } finally {
          setIsLoadingRates(false);
        }
      };

      fetchRates();
    }
  }, [isCheckoutOpen, activeAddress?.latitude, activeAddress?.longitude, selectedStoreId, checkoutItems.length, totalPackageWeightGrams]);

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

  const getDistanceToPickupKm = (plLat?: number, plLon?: number): number | null => {
    if (!activeAddress?.latitude || !activeAddress?.longitude || !plLat || !plLon) return null;
    const uLat = activeAddress.latitude;
    const uLon = activeAddress.longitude;
    const R = 6371;
    const dLat = ((plLat - uLat) * Math.PI) / 180;
    const dLon = ((plLon - uLon) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((uLat * Math.PI) / 180) *
        Math.cos((plLat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const dist = R * c;
    return parseFloat(dist.toFixed(1));
  };

  const calculateDynamicShippingFee = (option: any): number => {
    if (!option) return 0;
    if (option.type === 'pickup') return option.pickupFee || 0;

    // Check if user selected a specific Biteship courier rate
    if (selectedBiteshipServiceCode && option.type === 'instant' && option.biteshipRates?.length > 0) {
      const matchedBiteship = option.biteshipRates.find(
        (b: any) => `${b.courierCode}-${b.serviceCode}` === selectedBiteshipServiceCode
      );
      if (matchedBiteship) return matchedBiteship.price;
    }

    // If backend returned pre-calculated internalFee, use it
    if (option.internalFee !== undefined) {
      return option.internalFee;
    }

    // Dynamic calculation from baseFee + (distanceKm * feePerKm)
    const baseFee = option.baseFee !== undefined ? option.baseFee : (option.fee !== undefined ? option.fee : 10000);
    const feePerKm = option.feePerKm !== undefined ? option.feePerKm : 0;
    if (feePerKm > 0) {
      return baseFee + Math.round(distanceKm * feePerKm);
    }
    return baseFee;
  };

  const selectedShipping = availableShippingOptions.find((s) => s.id === selectedShippingId) || null;

  const subtotalItems = getTotalPriceByStore(targetStoreId);
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
        shippingAddress: selectedShipping?.type === 'pickup' ? 'Self-Pickup' : formattedAddress,
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
        paymentMethod: selectedShipping?.type === 'cod' ? 'Cash on Delivery (COD)' : selectedPaymentName,
        // Shipping type fields
        shippingType: selectedShipping?.type || 'instant',
        pickupLocationId: selectedShipping?.type === 'pickup' ? selectedPickupLocationId : undefined,
        scheduledDate: selectedShipping?.type === 'scheduled' ? selectedScheduledDate : undefined,
        scheduledSlot: selectedShipping?.type === 'scheduled' ? selectedScheduledSlot : undefined,
        customerLat: activeAddress?.latitude,
        customerLon: activeAddress?.longitude,
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
                <span>Daftar Belanjaan ({checkoutItems.length} Barang)</span>
              </div>
            </div>

            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {checkoutItems.map(({ product, quantity }) => (
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
                  const typeLabels: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
                    instant: { label: 'Instant', icon: <Zap className="w-3 h-3 text-amber-700 fill-amber-500" />, color: 'bg-amber-50 text-amber-800 border-amber-200' },
                    pickup: { label: 'Self-Pickup', icon: <Package className="w-3 h-3 text-[#063104]" />, color: 'bg-emerald-50 text-[#063104] border-emerald-200' },
                    scheduled: { label: 'Terjadwal', icon: <CalendarDays className="w-3 h-3 text-purple-700" />, color: 'bg-purple-50 text-purple-800 border-purple-200' },
                    cod: { label: 'COD', icon: <HandCoins className="w-3 h-3 text-emerald-700" />, color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
                  };
                  const typeInfo = typeLabels[option.type] || typeLabels.instant;
                  const fee = calculateDynamicShippingFee(option);

                  return (
                    <div key={option.id}>
                      {option.type === 'instant' ? (
                        <div className="border border-emerald-200 rounded-xl overflow-hidden transition-all shadow-2xs">
                          {/* Header Category Accordion Button (Buka/Tutup) */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedShippingId(option.id);
                              setOpenShippingAccordion(openShippingAccordion === option.id ? null : option.id);
                            }}
                            className={`w-full p-3 flex items-center justify-between text-left transition-colors cursor-pointer ${
                              isSelected && openShippingAccordion === option.id
                                ? 'bg-emerald-50/90 border-b border-emerald-200'
                                : isSelected
                                ? 'bg-emerald-50/60 hover:bg-emerald-50/80'
                                : 'bg-slate-50 hover:bg-slate-100'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <Zap className="w-4 h-4 text-emerald-700 shrink-0 fill-emerald-500" />
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-gray-900 text-xs">{option.name}</span>
                                  <span className="bg-emerald-100/80 text-[#063104] text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                                    <Zap className="w-3 h-3 text-[#063104]" />
                                    <span>{typeInfo.label}</span>
                                  </span>
                                  {selectedBiteshipServiceCode ? (
                                    <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-300">
                                      {option.biteshipRates?.find((b: any) => `${b.courierCode}-${b.serviceCode}` === selectedBiteshipServiceCode)?.courierName || 'Biteship'}
                                    </span>
                                  ) : (
                                    <span className="bg-[#063104] text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                                      kurir toko
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-gray-500 mt-0.5">
                                  Klik untuk memilih Kurir Toko atau Kurir Instan Biteship
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className={`font-extrabold text-xs shrink-0 ${fee === 0 ? 'text-emerald-600' : 'text-[#063104]'}`}>
                                {fee === 0 ? 'GRATIS' : formatCurrency(fee)}
                              </span>
                              {openShippingAccordion === option.id ? (
                                <ChevronUp className="w-4 h-4 text-emerald-700 shrink-0" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />
                              )}
                            </div>
                          </button>

                          {/* Accordion Body (Open/Close Buka-Tutup) */}
                          {openShippingAccordion === option.id && (
                            <div className="p-3 bg-white space-y-2 border-t border-emerald-100">
                              <div className="flex items-center justify-between px-1 pb-1">
                                <p className="text-[11px] font-extrabold text-[#063104] flex items-center gap-1.5">
                                  <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                                  <span>Pilih Penyedia Kurir Instan:</span>
                                </p>
                                {isLoadingRates && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#063104]" />}
                              </div>

                              <div className="space-y-2">
                                {/* 1. Internal Store Courier (FIRST) with 'kurir toko' badge */}
                                {(() => {
                                  const isInternalSelected = isSelected && !selectedBiteshipServiceCode;
                                  const internalFeeVal = calculateDynamicShippingFee({ ...option, biteshipRates: [] });
                                  return (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedShippingId(option.id);
                                        setSelectedBiteshipServiceCode('');
                                      }}
                                      className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                                        isInternalSelected
                                          ? 'bg-emerald-50/90 border-[#063104] ring-2 ring-[#063104] font-bold text-[#063104] shadow-xs'
                                          : 'bg-white border-gray-200 hover:border-[#77a160] text-gray-800'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="font-extrabold text-gray-900 text-xs">{option.name}</span>
                                          <span className="bg-[#063104] text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                                            kurir toko
                                          </span>
                                          <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded">
                                            {option.estimated || '30-60 menit'}
                                          </span>
                                        </div>
                                        <span className="font-extrabold text-xs text-[#063104]">
                                          {internalFeeVal === 0 ? 'GRATIS' : formatCurrency(internalFeeVal)}
                                        </span>
                                      </div>
                                      <p className="text-[10px] text-gray-500 mt-1">
                                        Pengiriman langsung oleh tim/kurir toko (lokal).
                                      </p>
                                    </button>
                                  );
                                })()}

                                {/* 2. Active Biteship Instant Couriers (Gojek / Grab) */}
                                {option.biteshipRates && option.biteshipRates.length > 0 && (
                                  option.biteshipRates.map((bRate: any) => {
                                    const codeKey = `${bRate.courierCode}-${bRate.serviceCode}`;
                                    const isRateSelected = isSelected && selectedBiteshipServiceCode === codeKey;
                                    return (
                                      <button
                                        key={codeKey}
                                        type="button"
                                        onClick={() => {
                                          setSelectedShippingId(option.id);
                                          setSelectedBiteshipServiceCode(codeKey);
                                        }}
                                        className={`w-full text-left p-3 rounded-xl border text-xs transition-all cursor-pointer ${
                                          isRateSelected
                                            ? 'bg-emerald-50/90 border-[#063104] ring-2 ring-[#063104] font-bold text-[#063104] shadow-xs'
                                            : 'bg-white border-gray-200 hover:border-emerald-300 text-gray-800'
                                        }`}
                                      >
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-extrabold text-gray-900 text-xs">
                                              {bRate.courierName} {bRate.serviceName}
                                            </span>
                                            <span className="bg-amber-100 text-amber-900 text-[9px] font-black px-2 py-0.5 rounded-full border border-amber-300 uppercase">
                                              {bRate.courierCode}
                                            </span>
                                            <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded">
                                              {bRate.duration}
                                            </span>
                                          </div>
                                          <span className="font-extrabold text-[#063104] text-xs">
                                            {formatCurrency(bRate.price)}
                                          </span>
                                        </div>
                                        {bRate.description && (
                                          <p className="text-[10px] text-gray-500 mt-1">
                                            {bRate.description}
                                          </p>
                                        )}
                                      </button>
                                    );
                                  })
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : option.type === 'pickup' ? (
                        <div className="border border-emerald-200/80 rounded-xl overflow-hidden transition-all shadow-2xs">
                          {/* Header Category Accordion Button (Buka/Tutup) */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedShippingId(option.id);
                              setOpenShippingAccordion(openShippingAccordion === option.id ? null : option.id);
                            }}
                            className={`w-full p-3 flex items-center justify-between text-left transition-colors cursor-pointer ${
                              isSelected && openShippingAccordion === option.id
                                ? 'bg-emerald-50/90 border-b border-emerald-200'
                                : isSelected
                                ? 'bg-emerald-50/60 hover:bg-emerald-50/80'
                                : 'bg-slate-50 hover:bg-slate-100'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-emerald-100/80 flex items-center justify-center shrink-0">
                                <Package className="w-4 h-4 text-[#063104]" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-gray-900 text-xs">{option.name}</span>
                                  <span className="bg-emerald-100/80 text-[#063104] text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                                    <Package className="w-3 h-3 text-[#063104]" />
                                    <span>Self-Pickup</span>
                                  </span>
                                  {selectedPickupLocationId && (
                                    <span className="bg-[#063104] text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                      <MapPin className="w-2.5 h-2.5 text-emerald-300" />
                                      <span>{pickupLocations.find((p: any) => p.id === selectedPickupLocationId)?.name || 'Toko Terpilih'}</span>
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-gray-500 mt-0.5">
                                  Ambil pesanan Anda langsung di lokasi toko
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className={`font-extrabold text-xs shrink-0 ${fee === 0 ? 'text-emerald-600' : 'text-[#063104]'}`}>
                                {fee === 0 ? 'GRATIS' : formatCurrency(fee)}
                              </span>
                              {openShippingAccordion === option.id ? (
                                <ChevronUp className="w-4 h-4 text-[#063104] shrink-0" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />
                              )}
                            </div>
                          </button>

                          {/* Accordion Body when open */}
                          {openShippingAccordion === option.id && (
                            <div className="p-3 bg-white space-y-3 border-t border-emerald-100">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-[11px] font-extrabold text-[#063104] flex items-center gap-1.5">
                                  <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                                  <span>Pilih Lokasi Pengambilan:</span>
                                </p>
                                <button
                                  type="button"
                                  onClick={() => setIsPickupMapModalOpen(true)}
                                  className="bg-[#063104] hover:bg-[#084205] text-white font-bold px-3 py-1.5 rounded-xl text-[11px] transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 border border-emerald-900/30"
                                >
                                  <MapIcon className="w-3.5 h-3.5" />
                                  <span>Lihat Peta</span>
                                </button>
                              </div>

                              {pickupLocations.length === 0 ? (
                                <p className="text-xs text-gray-500 py-2 text-center bg-gray-50 rounded-xl border border-gray-100">
                                  Lokasi pengambilan belum tersedia.
                                </p>
                              ) : (
                                <div className="space-y-2">
                                  {pickupLocations.map((pl: any) => {
                                    const isPlSelected = selectedPickupLocationId === pl.id;
                                    const distKm = getDistanceToPickupKm(pl.latitude, pl.longitude);

                                    return (
                                      <button
                                        key={pl.id}
                                        type="button"
                                        onClick={() => {
                                          setSelectedShippingId(option.id);
                                          setSelectedPickupLocationId(pl.id);
                                        }}
                                        className={`w-full text-left p-3 rounded-xl border text-xs transition-all cursor-pointer ${
                                          isPlSelected
                                            ? 'bg-emerald-50/90 border-[#063104] ring-2 ring-[#063104] font-medium shadow-xs'
                                            : 'bg-white border-gray-200 hover:border-emerald-300 text-gray-800'
                                        }`}
                                      >
                                        <div className="flex items-start justify-between gap-2">
                                          <div className="space-y-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                              <span className="font-extrabold text-gray-900 text-xs">{pl.name}</span>
                                              {distKm !== null && (
                                                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                                                  <MapPin className="w-3 h-3 text-emerald-700 shrink-0" />
                                                  <span>{distKm < 1 ? `${Math.round(distKm * 1000)} m` : `${distKm.toFixed(1)} km`} dari lokasi Anda</span>
                                                </span>
                                              )}
                                            </div>
                                            <p className="text-[11px] text-gray-600 leading-snug">{pl.address}</p>
                                          </div>

                                          <span className="text-[11px] font-bold text-[#063104] shrink-0 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                            {pl.pickupFee ? formatCurrency(pl.pickupFee) : 'GRATIS'}
                                          </span>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-3 mt-2 text-[10px] text-gray-500 pt-1.5 border-t border-gray-100">
                                          {pl.operatingHours && (
                                            <span className="flex items-center gap-1">
                                              <Clock className="w-3 h-3 text-gray-400 shrink-0" />
                                              <span>Jam Operasional: {pl.operatingHours}</span>
                                            </span>
                                          )}
                                          {pl.phone && (
                                            <span className="flex items-center gap-1 text-emerald-700 font-bold">
                                              <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                                              <span>WA: {pl.phone}</span>
                                            </span>
                                          )}
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <button
                            type="button"
                            onClick={() => setSelectedShippingId(option.id)}
                            className={`w-full text-left p-3 rounded-xl border transition-all ${
                              isSelected
                                ? 'bg-emerald-50/60 border-[#063104] ring-1 ring-[#063104]'
                                : 'bg-white border-gray-200 hover:border-[#77a160]'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-gray-900 text-xs">{option.name}</span>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${typeInfo.color}`}>
                                    {typeInfo.icon}
                                    <span>{typeInfo.label}</span>
                                  </span>
                                  <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded">
                                    {option.estimated}
                                  </span>
                                </div>
                                {option.type === 'scheduled' && (
                                  <p className="text-[11px] text-gray-500 mt-0.5">Pilih tanggal &amp; waktu pengiriman</p>
                                )}
                                {option.type === 'cod' && (
                                  <p className="text-[11px] text-gray-500 mt-0.5">
                                    Bayar saat barang sampai {option.maxRadiusKm ? `(maks ${option.maxRadiusKm} km)` : ''}
                                  </p>
                                )}
                              </div>
                              <span className={`font-extrabold text-xs shrink-0 ${fee === 0 ? 'text-emerald-600' : 'text-[#063104]'}`}>
                                {fee === 0 ? 'GRATIS' : formatCurrency(fee)}
                              </span>
                            </div>
                          </button>
                        </div>
                      )}

                      {isSelected && option.type === 'scheduled' && (
                        <div className="mt-2 p-3 bg-purple-50/50 rounded-xl border border-purple-100 space-y-2">
                          <p className="text-[11px] font-extrabold text-purple-900 flex items-center gap-1.5">
                            <CalendarDays className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                            <span>Pilih Jadwal Pengiriman:</span>
                          </p>
                          <input
                            type="date"
                            value={selectedScheduledDate}
                            onChange={e => setSelectedScheduledDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            max={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                            className="w-full px-3 py-2 bg-white border border-purple-200 rounded-lg text-xs"
                          />
                          {option.scheduleSlots && option.scheduleSlots.length > 0 && (
                            <div className="space-y-1.5">
                              <p className="text-[10px] font-bold text-purple-700">Pilih Slot Waktu:</p>
                              {option.scheduleSlots.map((slot: any) => (
                                <button
                                  key={slot.id}
                                  type="button"
                                  onClick={() => setSelectedScheduledSlot(`${slot.startTime}-${slot.endTime}`)}
                                  className={`w-full text-left p-2 rounded-lg border text-xs transition-all ${selectedScheduledSlot === `${slot.startTime}-${slot.endTime}` ? 'bg-purple-100 border-purple-400 ring-1 ring-purple-400' : 'bg-white border-gray-200 hover:border-purple-300'}`}
                                >
                                  <span className="font-bold">{slot.label}</span>
                                  <span className="text-gray-400 ml-2">{slot.startTime} - {slot.endTime}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {isSelected && option.type === 'cod' && distanceKm > (option.maxRadiusKm || 10) && (
                        <div className="mt-2 p-3 bg-red-50 rounded-xl border border-red-200">
                          <p className="text-[11px] font-bold text-red-700 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Alamat Anda di luar zona COD ({distanceKm} km, maks {option.maxRadiusKm || 10} km)
                          </p>
                        </div>
                      )}

                      {isSelected && option.type === 'cod' && distanceKm <= (option.maxRadiusKm || 10) && (
                        <div className="mt-2 p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                          <p className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                            ✅ Alamat dalam zona COD — bayar tunai saat barang sampai
                          </p>
                        </div>
                      )}
                    </div>
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
                    ['A1', 'BC', 'I1', 'BR', 'BV'].includes(m.paymentMethod)
                  );
                  if (vaMethods.length === 0) return null;

                  const hasActiveVA =
                    selectedPaymentMode === 'duitku' &&
                    vaMethods.some((m) => m.paymentMethod === selectedDuitkuCode);
                  const selectedVAMethod = vaMethods.find((m) => m.paymentMethod === selectedDuitkuCode);
                  const isCategoryOpen = openCategoryAccordion === 'va';

                  return (
                    <div
                      className={`border rounded-xl overflow-hidden transition-all duration-200 ${
                        hasActiveVA
                          ? 'border-[#063104] ring-2 ring-emerald-600/30 bg-emerald-50/40 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-emerald-300'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPaymentMode('duitku');
                          setOpenCategoryAccordion(isCategoryOpen ? null : 'va');
                        }}
                        className={`w-full p-3 flex items-center justify-between text-left transition-colors cursor-pointer ${
                          hasActiveVA
                            ? 'bg-emerald-100/80 border-b border-emerald-200 text-[#063104]'
                            : isCategoryOpen
                            ? 'bg-emerald-50/60 border-b border-emerald-100'
                            : 'bg-slate-50 hover:bg-emerald-50/40'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Building2 className="w-4.5 h-4.5 text-[#063104] shrink-0" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-xs font-extrabold text-slate-900 truncate">
                                Virtual Account (Bank Transfer)
                              </p>
                              {hasActiveVA && selectedVAMethod && (
                                <span className="bg-[#063104] text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full shrink-0 shadow-xs">
                                  Terpilih: {selectedVAMethod.paymentName}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500 truncate mt-0.5">
                              {vaMethods.map((m) => m.paymentName).join(', ')}
                            </p>
                          </div>
                        </div>
                        {isCategoryOpen ? (
                          <ChevronUp className="w-4 h-4 text-emerald-800 shrink-0 ml-2" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-500 shrink-0 ml-2" />
                        )}
                      </button>

                      {isCategoryOpen && (
                        <div className="p-3 bg-white grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {vaMethods.map((m) => {
                            const isSelected =
                              selectedPaymentMode === 'duitku' && selectedDuitkuCode === m.paymentMethod;
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
                                className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-emerald-50 border-[#063104] ring-1 ring-[#063104] shadow-xs'
                                    : 'bg-white border-slate-200 hover:border-emerald-300'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  {m.paymentImage ? (
                                    <img
                                      src={m.paymentImage}
                                      alt={m.paymentName}
                                      className="w-7 h-5 object-contain shrink-0"
                                    />
                                  ) : (
                                    <Building2 className="w-4 h-4 text-emerald-700 shrink-0" />
                                  )}
                                  <div className="truncate">
                                    <p className="text-[11px] font-bold text-slate-800 truncate">
                                      {m.paymentName}
                                    </p>
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
                    ['DA', 'LA', 'OV', 'SA'].includes(m.paymentMethod)
                  );
                  if (ewMethods.length === 0) return null;

                  const hasActiveEW =
                    selectedPaymentMode === 'duitku' &&
                    ewMethods.some((m) => m.paymentMethod === selectedDuitkuCode);
                  const selectedEWMethod = ewMethods.find((m) => m.paymentMethod === selectedDuitkuCode);
                  const isCategoryOpen = openCategoryAccordion === 'ewallet';

                  return (
                    <div
                      className={`border rounded-xl overflow-hidden transition-all duration-200 ${
                        hasActiveEW
                          ? 'border-[#063104] ring-2 ring-emerald-600/30 bg-emerald-50/40 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-emerald-300'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPaymentMode('duitku');
                          setOpenCategoryAccordion(isCategoryOpen ? null : 'ewallet');
                        }}
                        className={`w-full p-3 flex items-center justify-between text-left transition-colors cursor-pointer ${
                          hasActiveEW
                            ? 'bg-emerald-100/80 border-b border-emerald-200 text-[#063104]'
                            : isCategoryOpen
                            ? 'bg-emerald-50/60 border-b border-emerald-100'
                            : 'bg-slate-50 hover:bg-emerald-50/40'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Wallet className="w-4.5 h-4.5 text-[#063104] shrink-0" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-xs font-extrabold text-slate-900 truncate">
                                E-Wallet &amp; Dompet Digital
                              </p>
                              {hasActiveEW && selectedEWMethod && (
                                <span className="bg-[#063104] text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full shrink-0 shadow-xs">
                                  Terpilih: {selectedEWMethod.paymentName}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500 truncate mt-0.5">
                              {ewMethods.map((m) => m.paymentName).join(', ')}
                            </p>
                          </div>
                        </div>
                        {isCategoryOpen ? (
                          <ChevronUp className="w-4 h-4 text-emerald-800 shrink-0 ml-2" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-500 shrink-0 ml-2" />
                        )}
                      </button>

                      {isCategoryOpen && (
                        <div className="p-3 bg-white grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {ewMethods.map((m) => {
                            const isSelected =
                              selectedPaymentMode === 'duitku' && selectedDuitkuCode === m.paymentMethod;
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
                                className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-emerald-50 border-[#063104] ring-1 ring-[#063104] shadow-xs'
                                    : 'bg-white border-slate-200 hover:border-emerald-300'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  {m.paymentImage ? (
                                    <img
                                      src={m.paymentImage}
                                      alt={m.paymentName}
                                      className="w-7 h-5 object-contain shrink-0"
                                    />
                                  ) : (
                                    <Wallet className="w-4 h-4 text-emerald-700 shrink-0" />
                                  )}
                                  <div className="truncate">
                                    <p className="text-[11px] font-bold text-slate-800 truncate">
                                      {m.paymentName}
                                    </p>
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

                {/* 3. QRIS (ACCORDION) */}
                {(() => {
                  const qrisMethods = duitkuMethods.filter((m) =>
                    ['SP', 'LQ'].includes(m.paymentMethod)
                  );
                  if (qrisMethods.length === 0) return null;

                  const hasActiveQR =
                    selectedPaymentMode === 'duitku' &&
                    qrisMethods.some((m) => m.paymentMethod === selectedDuitkuCode);
                  const selectedQRMethod = qrisMethods.find((m) => m.paymentMethod === selectedDuitkuCode);
                  const isCategoryOpen = openCategoryAccordion === 'qris';

                  return (
                    <div
                      className={`border rounded-xl overflow-hidden transition-all duration-200 ${
                        hasActiveQR
                          ? 'border-[#063104] ring-2 ring-emerald-600/30 bg-emerald-50/40 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-emerald-300'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPaymentMode('duitku');
                          setOpenCategoryAccordion(isCategoryOpen ? null : 'qris');
                        }}
                        className={`w-full p-3 flex items-center justify-between text-left transition-colors cursor-pointer ${
                          hasActiveQR
                            ? 'bg-emerald-100/80 border-b border-emerald-200 text-[#063104]'
                            : isCategoryOpen
                            ? 'bg-emerald-50/60 border-b border-emerald-100'
                            : 'bg-slate-50 hover:bg-emerald-50/40'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <QrCode className="w-4.5 h-4.5 text-[#063104] shrink-0" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-xs font-extrabold text-slate-900 truncate">
                                QRIS (Scan Kode QR)
                              </p>
                              {hasActiveQR && selectedQRMethod && (
                                <span className="bg-[#063104] text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full shrink-0 shadow-xs">
                                  Terpilih: {selectedQRMethod.paymentName}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500 truncate mt-0.5">
                              {qrisMethods.map((m) => m.paymentName).join(', ')}
                            </p>
                          </div>
                        </div>
                        {isCategoryOpen ? (
                          <ChevronUp className="w-4 h-4 text-emerald-800 shrink-0 ml-2" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-500 shrink-0 ml-2" />
                        )}
                      </button>

                      {isCategoryOpen && (
                        <div className="p-3 bg-white grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {qrisMethods.map((m) => {
                            const isSelected =
                              selectedPaymentMode === 'duitku' && selectedDuitkuCode === m.paymentMethod;
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
                                className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-emerald-50 border-[#063104] ring-1 ring-[#063104] shadow-xs'
                                    : 'bg-white border-slate-200 hover:border-emerald-300'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  {m.paymentImage ? (
                                    <img
                                      src={m.paymentImage}
                                      alt={m.paymentName}
                                      className="w-7 h-5 object-contain shrink-0"
                                    />
                                  ) : (
                                    <QrCode className="w-4 h-4 text-emerald-700 shrink-0" />
                                  )}
                                  <div className="truncate">
                                    <p className="text-[11px] font-bold text-slate-800 truncate">
                                      {m.paymentName}
                                    </p>
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

                {/* 4. BAYAR DI TEMPAT (COD) / MANUAL TOKO (ACCORDION) */}
                {(() => {
                  const manualMethods = adminPaymentMethods.filter(
                    (p) => p.isActive && p.type !== 'duitku' && !p.category?.includes('Duitku')
                  );
                  if (manualMethods.length === 0) return null;

                  const hasActiveManual =
                    selectedPaymentMode === 'manual' &&
                    manualMethods.some((m) => m.id === selectedManualPaymentId);
                  const activeManualMethod = manualMethods.find((m) => m.id === selectedManualPaymentId);
                  const isCategoryOpen = openCategoryAccordion === 'manual';

                  return (
                    <div
                      className={`border rounded-xl overflow-hidden transition-all duration-200 ${
                        hasActiveManual
                          ? 'border-[#063104] ring-2 ring-emerald-600/30 bg-emerald-50/40 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-emerald-300'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPaymentMode('manual');
                          setOpenCategoryAccordion(isCategoryOpen ? null : 'manual');
                        }}
                        className={`w-full p-3 flex items-center justify-between text-left transition-colors cursor-pointer ${
                          hasActiveManual
                            ? 'bg-emerald-100/80 border-b border-emerald-200 text-[#063104]'
                            : isCategoryOpen
                            ? 'bg-emerald-50/60 border-b border-emerald-100'
                            : 'bg-slate-50 hover:bg-emerald-50/40'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Banknote className="w-4.5 h-4.5 text-[#063104] shrink-0" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-xs font-extrabold text-slate-900 truncate">
                                Transfer Bank &amp; Bayar di Tempat (Internal Toko)
                              </p>
                              {hasActiveManual && activeManualMethod && (
                                <span className="bg-[#063104] text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full shrink-0 shadow-xs">
                                  Terpilih: {activeManualMethod.name}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500 truncate mt-0.5">
                              {manualMethods.map((m) => m.name).join(', ')}
                            </p>
                          </div>
                        </div>
                        {isCategoryOpen ? (
                          <ChevronUp className="w-4 h-4 text-emerald-800 shrink-0 ml-2" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-500 shrink-0 ml-2" />
                        )}
                      </button>

                      {isCategoryOpen && (
                        <div className="p-3 bg-white grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {manualMethods.map((m) => {
                            const isSelected =
                              selectedPaymentMode === 'manual' && selectedManualPaymentId === m.id;

                            return (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => {
                                  setSelectedPaymentMode('manual');
                                  setSelectedManualPaymentId(m.id);
                                }}
                                className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-emerald-50 border-[#063104] ring-1 ring-[#063104] shadow-xs'
                                    : 'bg-white border-slate-200 hover:border-emerald-300'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <Banknote className="w-4 h-4 text-emerald-800 shrink-0" />
                                  <div className="truncate">
                                    <p className="text-[11px] font-bold text-slate-800 truncate">{m.name}</p>
                                    <p className="text-[10px] text-emerald-700 font-semibold">{m.category} • Bebas Biaya</p>
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
              </div>
            )}
          </div>

          {/* SECTION 5: PAYMENT SUMMARY BREAKDOWN (Rincian Pembayaran) */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs space-y-2.5 text-xs">
            <div className="flex items-center gap-1.5 text-[#063104] font-extrabold uppercase tracking-wider pb-1 border-b border-gray-100">
              <Receipt className="w-4 h-4" />
              <span>Rincian Pembayaran</span>
            </div>

            <div className="flex items-center justify-between text-gray-600 bg-slate-50 p-2 rounded-xl border border-slate-100">
              <span className="font-semibold text-slate-700">Total Bobot Paket</span>
              <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                {formattedTotalWeight} ({checkoutItems.length} item)
              </span>
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
      {/* Visual Pickup Location Map Modal */}
      <PickupLocationMapModal
        isOpen={isPickupMapModalOpen}
        onClose={() => setIsPickupMapModalOpen(false)}
        pickupLocations={pickupLocations}
        selectedLocationId={selectedPickupLocationId}
        customerLat={activeAddress?.latitude}
        customerLon={activeAddress?.longitude}
        customerAddressName={activeAddress?.recipientName ? `${activeAddress.recipientName} - ${activeAddress.street}` : activeAddress?.address}
        onSelectLocation={(locId: string) => {
          const pickupOpt = availableShippingOptions.find(o => o.type === 'pickup');
          if (pickupOpt) {
            setSelectedShippingId(pickupOpt.id);
            setOpenShippingAccordion(pickupOpt.id);
          }
          setSelectedPickupLocationId(locId);
        }}
      />
    </Drawer>
  );
};

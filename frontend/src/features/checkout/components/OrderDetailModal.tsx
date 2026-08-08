import React, { useState } from 'react';
import {
  X,
  MapPin,
  Truck,
  Store,
  CreditCard,
  MessageCircle,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronRight,
  Copy,
  Receipt,
  Star,
  Phone,
  ExternalLink,
  Package,
  Map as MapIcon,
} from 'lucide-react';
import { API_BASE_URL } from '../../../config/api';
import { PickupRouteMapModal } from './PickupRouteMapModal';
import { useLocationStore } from '../../store-location/store/useLocationStore';

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val || 0);

export interface OrderDetailModalProps {
  open: boolean;
  onClose: () => void;
  order: any;
  onPayNow?: (order: any) => void;
  onOpenTracking?: (order: any) => void;
  onOrderUpdated?: () => void;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  open,
  onClose,
  order,
  onPayNow,
  onOpenTracking,
  onOrderUpdated,
}) => {
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showCancelReasonModal, setShowCancelReasonModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isRouteMapModalOpen, setIsRouteMapModalOpen] = useState(false);
  const [fetchedPickupLocation, setFetchedPickupLocation] = useState<any>(null);

  const { getSelectedAddress } = useLocationStore();
  const activeAddr = getSelectedAddress();

  React.useEffect(() => {
    if (open && order?.shippingType === 'pickup') {
      if (order.pickupLocation) {
        setFetchedPickupLocation(order.pickupLocation);
      } else {
        fetch(`${API_BASE_URL}/shipping/pickup-locations`)
          .then((res) => res.json())
          .then((json) => {
            if (json.success && Array.isArray(json.data)) {
              const found = json.data.find((pl: any) => pl.id === order.pickupLocationId);
              if (found) {
                setFetchedPickupLocation(found);
              } else if (json.data.length > 0) {
                setFetchedPickupLocation(json.data[0]);
              }
            }
          })
          .catch((err) => console.error('Error fetching pickup location for order detail:', err));
      }
    }
  }, [open, order?.id, order?.pickupLocationId, order?.shippingType, order?.pickupLocation]);

  if (!open || !order) return null;

  const orderStatus = order.status || order.orderStatus || 'belum_bayar';
  const isPaid = order.paymentStatus === 'paid';
  const trackingNumber = order.trackingNumber || `TRK-${order.orderNo}`;
  const items = order.items || (order.itemsJson ? JSON.parse(order.itemsJson) : []);

  const handleCopyOrderNo = () => {
    navigator.clipboard.writeText(order.orderNo);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirmCancelOrder = async () => {
    try {
      setIsCancelling(true);
      const res = await fetch(`${API_BASE_URL}/orders/${order.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Dibatalkan oleh pembeli di rincian pesanan' }),
      });
      const data = await res.json();
      if (data.success) {
        setShowCancelModal(false);
        if (onOrderUpdated) onOrderUpdated();
        onClose();
      } else {
        alert(data.message || 'Gagal membatalkan pesanan.');
      }
    } catch (err: any) {
      alert(err.message || 'Gagal membatalkan pesanan.');
    } finally {
      setIsCancelling(false);
    }
  };

  const getStatusBadge = () => {
    switch (orderStatus) {
      case 'belum_bayar':
        return (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-center justify-between text-amber-900">
            <div className="flex items-center gap-2.5">
              <Clock className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <h4 className="font-extrabold text-xs">Menunggu Pembayaran</h4>
                <p className="text-[10px] text-amber-700 font-medium">
                  Segera selesaikan pembayaran sebelum batas waktu berakhir.
                </p>
              </div>
            </div>
            {onPayNow && (
              <button
                type="button"
                onClick={() => onPayNow(order)}
                className="bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-extrabold text-xs px-3 py-1.5 rounded-xl shrink-0 shadow-xs transition-all cursor-pointer"
              >
                Bayar
              </button>
            )}
          </div>
        );
      case 'dikemas':
        return (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3.5 flex items-center gap-2.5 text-blue-900">
            <Clock className="w-5 h-5 text-blue-600 shrink-0" />
            <div>
              <h4 className="font-extrabold text-xs">Pesanan Sedang Diproses Toko</h4>
              <p className="text-[10px] text-blue-700 font-medium">
                Penjual sedang menimbang dan mengemas produk pesanan Anda.
              </p>
            </div>
          </div>
        );
      case 'dikirim':
        return (
          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-3.5 flex items-center gap-2.5 text-indigo-900">
            <Truck className="w-5 h-5 text-indigo-600 shrink-0" />
            <div>
              <h4 className="font-extrabold text-xs">Pesanan Dalam Pengiriman</h4>
              <p className="text-[10px] text-indigo-700 font-medium">
                Kurir toko / ekspedisi sedang menuju alamat tujuan.
              </p>
            </div>
          </div>
        );
      case 'selesai':
        return (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-center gap-2.5 text-[#063104]">
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
            <div>
              <h4 className="font-extrabold text-xs">Pesanan Selesai</h4>
              <p className="text-[10px] text-emerald-800 font-medium">
                Terima kasih! Pesanan Anda telah berhasil diterima.
              </p>
            </div>
          </div>
        );
      case 'dibatalkan':
        return (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 flex items-center gap-2.5 text-rose-900">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <h4 className="font-extrabold text-xs">Pesanan Dibatalkan</h4>
              <p className="text-[10px] text-rose-700 font-medium">
                {order.cancelReason || 'Pesanan dibatalkan oleh sistem / pembeli.'}
              </p>
            </div>
          </div>
        );
      case 'pengembalian':
        return (
          <div className="bg-purple-50 border border-purple-200 rounded-2xl p-3.5 flex items-center gap-2.5 text-purple-900">
            <RotateCcw className="w-5 h-5 text-purple-600 shrink-0" />
            <div>
              <h4 className="font-extrabold text-xs">Pengembalian Barang / Dana</h4>
              <p className="text-[10px] text-purple-700 font-medium">
                Proses komplain retur / pengembalian dana sedang diproses.
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className="fixed inset-0 z-[3500] bg-black/60 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in"
      style={{ backdropFilter: 'blur(4px)' }}
    >
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-gray-100 flex flex-col my-auto max-h-[92vh] relative">
        {/* Header Bar */}
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between bg-[#F9F8F6] shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#063104] text-white flex items-center justify-center font-bold shrink-0">
              <Receipt className="w-4 h-4 text-[#FACC15]" />
            </div>
            <div className="min-w-0">
              <h3 className="font-black text-gray-900 text-sm truncate">
                Rincian Pesanan
              </h3>
              <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mt-0.5">
                <span className="font-mono font-bold text-[#063104]">#{order.orderNo}</span>
                <button
                  type="button"
                  onClick={handleCopyOrderNo}
                  className="text-gray-400 hover:text-gray-700 transition-colors p-0.5"
                  title="Salin No. Pesanan"
                >
                  <Copy className="w-3 h-3" />
                </button>
                {copied && (
                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                    Tersalin!
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-200/60 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Status Banner */}
          {getStatusBadge()}

          {/* Shipping Track Info Card (Clickable to open OrderTrackingModal) */}
          <div
            onClick={() => onOpenTracking && onOpenTracking(order)}
            className="bg-gradient-to-r from-emerald-50/90 to-emerald-50/40 hover:from-emerald-100/90 hover:to-emerald-50/80 border border-emerald-200/80 rounded-2xl p-3.5 cursor-pointer transition-all duration-200 group flex items-center justify-between shadow-xs"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-white border border-emerald-200 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                <Truck className="w-5 h-5 text-[#063104]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-extrabold text-[#063104] text-xs truncate">
                    Info Pengiriman
                  </h4>
                  <span className="bg-emerald-100 text-emerald-900 text-[9px] font-extrabold px-1.5 py-0.2 rounded-md border border-emerald-200">
                    {order.shippingType === 'pickup' ? 'Self-Pickup' : 'Kurir Toko / Ekspedisi'}
                  </span>
                </div>
                <p className="text-[11px] text-gray-700 font-bold truncate mt-0.5">
                  {order.shippingCourier || 'WaroengKita Express'}
                </p>
                <p className="text-[10px] text-gray-500 font-medium truncate">
                  No. Resi: <strong className="font-mono text-gray-800">{trackingNumber}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-[#063104] font-extrabold text-[11px] shrink-0 ml-2 group-hover:translate-x-0.5 transition-transform">
              <span>Lacak</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          {/* Shipping Address / Pickup Location Section */}
          {(() => {
            const targetPickupLocation = fetchedPickupLocation || order.pickupLocation || (order.store ? {
              name: order.store.name || 'Toko Utama',
              address: order.store.address || 'Alamat Toko',
              latitude: order.store.latitude || -6.2088,
              longitude: order.store.longitude || 106.8456,
              phone: order.store.phone || '',
              operatingHours: '08:00 - 21:00',
            } : null);

            const effectiveCustomerLat = order.customerLat || activeAddr?.latitude || -6.2088;
            const effectiveCustomerLon = order.customerLon || activeAddr?.longitude || 106.8456;

            const distKm = (order.shippingType === 'pickup' && targetPickupLocation)
              ? (() => {
                  const lat1 = effectiveCustomerLat;
                  const lon1 = effectiveCustomerLon;
                  const lat2 = targetPickupLocation.latitude;
                  const lon2 = targetPickupLocation.longitude;
                  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
                  const R = 6371;
                  const dLat = ((lat2 - lat1) * Math.PI) / 180;
                  const dLon = ((lon2 - lon1) * Math.PI) / 180;
                  const a =
                    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos((lat1 * Math.PI) / 180) *
                      Math.cos((lat2 * Math.PI) / 180) *
                      Math.sin(dLon / 2) *
                      Math.sin(dLon / 2);
                  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                  return parseFloat((R * c).toFixed(1));
                })()
              : null;

            return (
              <div className="bg-white rounded-2xl p-3.5 border border-gray-200/80 space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-gray-900 font-extrabold">
                    {order.shippingType === 'pickup' ? (
                      <Package className="w-4 h-4 text-[#063104]" />
                    ) : (
                      <MapPin className="w-4 h-4 text-[#063104]" />
                    )}
                    <span>{order.shippingType === 'pickup' ? 'Lokasi Pengambilan Toko' : 'Alamat Pengiriman'}</span>
                  </div>
                  {order.shippingType === 'pickup' && (
                    <span className="bg-emerald-100 text-[#063104] text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-200">
                      Self-Pickup
                    </span>
                  )}
                </div>

                <div className="pl-5 space-y-2">
                  <div>
                    <h4 className="font-extrabold text-gray-900 text-xs flex items-center gap-2 flex-wrap">
                      <span>{order.shippingType === 'pickup' ? (targetPickupLocation?.name || 'Toko Pengambilan') : (order.customerName || 'Pembeli')}</span>
                      {order.shippingType === 'pickup' && distKm !== null && (
                        <span className="bg-emerald-100 text-[#063104] text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-emerald-700 shrink-0" />
                          <span>{distKm < 1 ? `${Math.round(distKm * 1000)} m` : `${distKm.toFixed(1)} km`} dari lokasi Anda</span>
                        </span>
                      )}
                    </h4>
                    <p className="text-gray-600 text-[11px] leading-relaxed mt-0.5">
                      {order.shippingType === 'pickup'
                        ? (targetPickupLocation?.address || order.shippingAddress || 'Alamat Toko Pengambilan')
                        : (order.shippingAddress || 'Alamat pengiriman')}
                    </p>
                  </div>

                  {/* Operational Details for Pickup: Hours & Phone */}
                  {order.shippingType === 'pickup' && targetPickupLocation && (
                    <div className="flex flex-wrap items-center gap-3 text-[10px] text-gray-500 pt-1">
                      {targetPickupLocation.operatingHours && (
                        <span className="flex items-center gap-1 font-medium">
                          <Clock className="w-3 h-3 text-gray-400 shrink-0" />
                          <span>Jam Operasional: {targetPickupLocation.operatingHours}</span>
                        </span>
                      )}
                      {targetPickupLocation.phone && (
                        <span className="flex items-center gap-1 text-emerald-800 font-bold">
                          <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>WA: {targetPickupLocation.phone}</span>
                        </span>
                      )}
                    </div>
                  )}

                  {/* Action Buttons for Pickup: Lihat Map & Chat WA Toko */}
                  {order.shippingType === 'pickup' && (
                    <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsRouteMapModalOpen(true)}
                        className="bg-[#063104] hover:bg-[#084205] text-white font-extrabold px-3 py-1.5 rounded-xl text-[11px] flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 border border-emerald-900/30"
                      >
                        <MapIcon className="w-3.5 h-3.5 text-emerald-300" />
                        <span>Lihat Map</span>
                      </button>

                      {targetPickupLocation?.phone && (
                        <a
                          href={`https://wa.me/${targetPickupLocation.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Halo ${targetPickupLocation.name}, saya ingin bertanya mengenai pesanan Self-Pickup #${order.orderNo}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-emerald-50 hover:bg-emerald-100 text-[#063104] border border-emerald-200 font-bold px-3 py-1.5 rounded-xl text-[11px] flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                        >
                          <Phone className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Chat WA Toko</span>
                          <ExternalLink className="w-3 h-3 text-emerald-500" />
                        </a>
                      )}
                    </div>
                  )}

                  {/* Preparation & Storage Deadline Badges */}
                  {order.shippingType === 'pickup' && (
                    <div className="bg-emerald-50/70 border border-emerald-200/70 rounded-xl p-2.5 text-[10px] text-gray-700 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-[#063104]">
                        <Clock className="w-3 h-3 text-emerald-700" />
                        <span>Estimasi Penyiapan: 30-60 menit setelah pembayaran terkonfirmasi</span>
                      </div>
                      <p className="text-gray-500 pl-4">Batas penyimpanan pengambilan di toko maksimal 3x24 jam.</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Order Products & Store Info Section */}
          <div className="bg-white rounded-2xl p-3.5 border border-gray-200/80 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-[#063104]" />
                <span className="font-extrabold text-gray-900 text-xs">
                  {order.storeName || 'WaroengKita Indonesia'}
                </span>
              </div>
              <span className="text-[10px] font-bold text-gray-400">
                {order.date || order.orderDate}
              </span>
            </div>

            {/* Product Item List */}
            <div className="space-y-2.5 divide-y divide-gray-100/80">
              {items.map((item: any, idx: number) => (
                <div key={idx} className={`flex items-center gap-3 ${idx > 0 ? 'pt-2.5' : ''}`}>
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-12 h-12 object-contain rounded-xl bg-gray-50 p-1 border border-gray-100 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 text-xs truncate">
                      {item.name}
                    </h4>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {item.quantity} x {formatCurrency(item.price)} ({item.unit})
                    </p>
                  </div>
                  <span className="font-extrabold text-gray-900 text-xs shrink-0">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Summary Breakdown Section */}
          <div className="bg-white rounded-2xl p-3.5 border border-gray-200/80 space-y-2 shadow-2xs">
            <h4 className="font-extrabold text-gray-900 text-xs pb-1 border-b border-gray-100">
              Rincian Pembayaran
            </h4>

            <div className="flex items-center justify-between text-gray-600">
              <span>Subtotal Produk</span>
              <span className="font-semibold text-gray-900">
                {formatCurrency(order.subtotal || order.totalAmount || 0)}
              </span>
            </div>

            <div className="flex items-center justify-between text-gray-600">
              <span>Subtotal Pengiriman</span>
              <span className="font-semibold text-gray-900">
                {formatCurrency(order.shippingFee || 0)}
              </span>
            </div>

            <div className="flex items-center justify-between text-gray-600">
              <span>Biaya Layanan &amp; Penanganan</span>
              <span className="font-semibold text-gray-900">
                {formatCurrency(2000)}
              </span>
            </div>

            {order.discountAmount > 0 && (
              <div className="flex items-center justify-between text-emerald-800">
                <span>Diskon Kupon</span>
                <span className="font-semibold">- {formatCurrency(order.discountAmount)}</span>
              </div>
            )}

            <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-sm font-black text-gray-900">
              <span>Total Pesanan</span>
              <span className="text-[#063104] text-base">{formatCurrency(order.totalAmount || order.totalPrice)}</span>
            </div>

            <div className="text-[10px] text-gray-500 pt-1 flex items-center justify-between font-medium">
              <span>Metode Pembayaran</span>
              <strong className="text-gray-800 font-bold uppercase">{order.paymentMethod || 'Duitku Payment Gateway'}</strong>
            </div>
          </div>
        </div>

        {/* Fixed Bottom Action Bar */}
        <div className="px-5 py-3.5 border-t border-gray-200/80 bg-white flex items-center justify-end gap-2.5 shrink-0 shadow-lg">
          {/* Status: belum_bayar */}
          {orderStatus === 'belum_bayar' && (
            <>
              <a
                href="https://wa.me/6281234567890?text=Halo%20Admin%20Saya%20ingin%20bertanya%20mengenai%20pesanan%20saya"
                target="_blank"
                rel="noreferrer"
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Tanya Toko</span>
              </a>
              <button
                type="button"
                onClick={() => setShowCancelModal(true)}
                className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-extrabold text-xs px-3.5 py-2.5 rounded-xl transition-all cursor-pointer"
              >
                Batalkan Pesanan
              </button>
              {onPayNow && (
                <button
                  type="button"
                  onClick={() => onPayNow(order)}
                  className="bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Bayar Sekarang</span>
                </button>
              )}
            </>
          )}

          {/* Status: dikemas */}
          {orderStatus === 'dikemas' && (
            <>
              <a
                href="https://wa.me/6281234567890?text=Halo%20Admin%20pesanan%20saya%20sudah%20sampai%20mana"
                target="_blank"
                rel="noreferrer"
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Tanya Toko</span>
              </a>
              <button
                type="button"
                onClick={() => setShowCancelModal(true)}
                className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-extrabold text-xs px-3.5 py-2.5 rounded-xl transition-all cursor-pointer"
              >
                Batalkan Pesanan
              </button>
            </>
          )}

          {/* Status: dikirim */}
          {orderStatus === 'dikirim' && (
            <>
              <a
                href="https://wa.me/6281234567890?text=Halo%20Admin%20pesanan%20saya%20dalam%20pengiriman"
                target="_blank"
                rel="noreferrer"
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Tanya Toko</span>
              </a>
              {onOpenTracking && (
                <button
                  type="button"
                  onClick={() => onOpenTracking(order)}
                  className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Lacak Kurir</span>
                </button>
              )}
            </>
          )}

          {/* Status: selesai */}
          {orderStatus === 'selesai' && (
            <>
              <button
                type="button"
                onClick={() => alert('Item berhasil ditambahkan ke keranjang!')}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-extrabold text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Beli Lagi</span>
              </button>
              <button
                type="button"
                onClick={() => alert('Terima kasih telah memberi nilai!')}
                className="bg-[#063104] hover:bg-[#084205] text-white font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <Star className="w-3.5 h-3.5 fill-current text-[#FACC15]" />
                <span>Beri Nilai</span>
              </button>
            </>
          )}

          {/* Status: pengembalian */}
          {orderStatus === 'pengembalian' && (
            <>
              <button
                type="button"
                onClick={() => onOpenTracking && onOpenTracking(order)}
                className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Lacak Retur</span>
              </button>
            </>
          )}

          {/* Status: dibatalkan */}
          {orderStatus === 'dibatalkan' && (
            <>
              <button
                type="button"
                onClick={() => setShowCancelReasonModal(true)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold text-xs px-3.5 py-2.5 rounded-xl transition-all cursor-pointer"
              >
                {isPaid ? 'Rincian Pengembalian' : 'Rincian Pembatalan'}
              </button>
              <button
                type="button"
                onClick={() => alert('Item berhasil ditambahkan ke keranjang!')}
                className="bg-[#063104] hover:bg-[#084205] text-white font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Beli Lagi</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* CONFIRM CANCEL MODAL */}
      {showCancelModal && (
        <div className="fixed inset-0 z-[3600] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 text-center border border-gray-100 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-gray-900 text-sm">Batalkan Pesanan?</h3>
              <p className="text-xs text-gray-500 mt-1">
                Apakah Anda yakin ingin membatalkan pesanan #{order.orderNo}? Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl text-xs"
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={handleConfirmCancelOrder}
                disabled={isCancelling}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-extrabold py-2.5 rounded-xl text-xs shadow-xs"
              >
                {isCancelling ? 'Membatalkan...' : 'Ya, Batalkan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CANCEL REASON / REFUND DETAILS MODAL */}
      {showCancelReasonModal && (
        <div className="fixed inset-0 z-[3600] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 text-left border border-gray-100 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="font-extrabold text-gray-900 text-sm">
                {isPaid ? 'Rincian Pengembalian Dana' : 'Rincian Pembatalan'}
              </h3>
              <button
                type="button"
                onClick={() => setShowCancelReasonModal(false)}
                className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-2 text-xs text-gray-600">
              <p>
                <strong>Alasan:</strong> {order.cancelReason || 'Dibatalkan oleh pembeli / waktu pembayaran kadaluarsa.'}
              </p>
              <p>
                <strong>Status Pembayaran:</strong>{' '}
                <span className="font-bold text-gray-900">
                  {isPaid ? 'Sudah Dibayar (Proses Refund 1-3 hari kerja)' : 'Belum Dibayar'}
                </span>
              </p>
              {isPaid && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-emerald-900 font-medium text-[11px]">
                  Dana pengembalian sebesar <strong>{formatCurrency(order.totalAmount)}</strong> akan dikembalikan ke rekening/dompet digital Anda secara otomatis.
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowCancelReasonModal(false)}
              className="w-full bg-[#063104] text-white font-extrabold py-2.5 rounded-xl text-xs"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
      {/* Pickup Route Map Modal */}
      {order.shippingType === 'pickup' && (
        <PickupRouteMapModal
          open={isRouteMapModalOpen}
          onClose={() => setIsRouteMapModalOpen(false)}
          customerLat={order.customerLat || activeAddr?.latitude || -6.2088}
          customerLon={order.customerLon || activeAddr?.longitude || 106.8456}
          customerAddressName={order.shippingAddress !== 'Self-Pickup' ? order.shippingAddress : (activeAddr?.streetAddress || 'Alamat Pelanggan')}
          pickupLocation={fetchedPickupLocation || order.pickupLocation || (order.store ? {
            name: order.store.name || 'Toko Utama',
            address: order.store.address || 'Alamat Toko',
            latitude: order.store.latitude || -6.2088,
            longitude: order.store.longitude || 106.8456,
            phone: order.store.phone || '',
            operatingHours: '08:00 - 21:00',
          } : null)}
          orderNo={order.orderNo}
        />
      )}
    </div>
  );
};

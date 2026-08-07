import React, { useState, useMemo } from 'react';
import {
  Search,
  CheckCircle2,
  Clock,
  Truck,
  Package,
  XCircle,
  Eye,
  Bell,
  ArrowRight,
  MapPin,
  Phone,
  CreditCard,
  X,
  Printer,
  Zap,
  ExternalLink,
  Compass,
  QrCode,
} from 'lucide-react';
import { useAdminStore } from '../store/useAdminStore';
import { useUserStore } from '../../auth/store/useUserStore';
import type { AdminOrder, OrderStatus } from '../../../types';
import { PrintShippingLabel } from './PrintShippingLabel';
import { InternalCourierMapView } from './InternalCourierMapView';
import { TableSkeleton } from '../../../components/common/AdminSkeletons';
import { API_BASE_URL } from '../../../config/api';

export const OrdersView: React.FC = () => {
  const { profile } = useUserStore();
  const { orders, updateOrderStatus, addNewMockOrder, fetchInitialData, isLoadingData, showToast } = useAdminStore();

  React.useEffect(() => {
    fetchInitialData(profile.assignedStoreId);
  }, [profile.assignedStoreId, fetchInitialData]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusTab, setSelectedStatusTab] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<AdminOrder | null>(null);
  const [orderToPrint, setOrderToPrint] = useState<AdminOrder | null>(null);
  const [isBookingBiteship, setIsBookingBiteship] = useState(false);
  const [orderForCourierMap, setOrderForCourierMap] = useState<AdminOrder | null>(null);
  const [shippingTypeFilter, setShippingTypeFilter] = useState('all');
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [qrSearchCode, setQrSearchCode] = useState('');
  const [scannedOrder, setScannedOrder] = useState<AdminOrder | null>(null);

  const handleRequestBiteshipCourier = async (order: any, courierCompany = 'gosend') => {
    try {
      setIsBookingBiteship(true);
      const res = await fetch(`${API_BASE_URL}/shipping/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.dbId || order.id,
          courierCompany,
          courierType: 'instant',
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message || 'Kurir Biteship berhasil dipanggil!');
        const storeIdFilter = profile.role === 'admin_store' ? (profile.assignedStoreId || undefined) : undefined;
        fetchInitialData(storeIdFilter);

        if (selectedOrderForDetail?.id === order.id) {
          setSelectedOrderForDetail((prev: any) => ({
            ...prev,
            status: 'ready',
            biteshipOrderId: json.data?.biteshipOrderId || json.data?.id,
            biteshipTrackingUrl: json.data?.trackingUrl || json.data?.biteshipTrackingUrl,
            biteshipWaybillId: json.data?.waybillId || json.data?.biteshipWaybillId,
            driverName: json.data?.driverName,
            driverPhone: json.data?.driverPhone,
            driverPlate: json.data?.driverPlate,
          }));
        }
      } else {
        alert(json.message || 'Gagal memanggil kurir Biteship.');
      }
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan saat memanggil kurir Biteship.');
    } finally {
      setIsBookingBiteship(false);
    }
  };

  // Status Tabs definitions
  const statusTabs: { id: string; label: string; statusValue?: OrderStatus; count: number; badgeRed?: boolean }[] = useMemo(() => {
    const getCount = (st?: OrderStatus) =>
      st ? orders.filter((o) => o.status === st).length : orders.length;

    const newCount = getCount('new');

    return [
      { id: 'all', label: 'Semua', count: orders.length },
      { id: 'new', label: 'Pesanan Baru', statusValue: 'new', count: newCount, badgeRed: newCount > 0 },
      { id: 'processing', label: 'Diproses', statusValue: 'processing', count: getCount('processing') },
      { id: 'ready', label: 'Siap Dikirim', statusValue: 'ready', count: getCount('ready') },
      { id: 'delivering', label: 'Dalam Pengiriman', statusValue: 'delivering', count: getCount('delivering') },
      { id: 'completed', label: 'Selesai', statusValue: 'completed', count: getCount('completed') },
      { id: 'cancelled', label: 'Dibatalkan', statusValue: 'cancelled', count: getCount('cancelled') },
    ];
  }, [orders]);

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
      const matchesSearch =
        !searchQuery.trim() ||
        ord.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ord.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ord.phone.includes(searchQuery);

      const matchesStatus =
        selectedStatusTab === 'all' || ord.status === selectedStatusTab;

      const matchesDate =
        !dateFilter || ord.orderDate === dateFilter;

      const matchesShippingType =
        shippingTypeFilter === 'all' || ord.shippingType === shippingTypeFilter;

      return matchesSearch && matchesStatus && matchesDate && matchesShippingType;
    });
  }, [orders, searchQuery, selectedStatusTab, dateFilter, shippingTypeFilter]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    })
      .format(val)
      .replace(/\s/g, ' ');

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'new':
        return (
          <span className="bg-red-100 text-red-700 font-extrabold text-[11px] px-2.5 py-1 rounded-lg flex items-center gap-1 w-fit">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
            Pesanan Baru
          </span>
        );
      case 'processing':
        return (
          <div className="flex flex-col gap-0.5">
            <span className="bg-amber-100 text-amber-800 font-bold text-[11px] px-2.5 py-1 rounded-lg flex items-center gap-1 w-fit">
              <Clock className="w-3 h-3" />
              Diproses
            </span>
            <span className="text-[9px] text-amber-800 font-semibold pl-0.5">sedang dikemas ditoko</span>
          </div>
        );
      case 'ready':
        return (
          <div className="flex flex-col gap-0.5">
            <span className="bg-blue-100 text-blue-800 font-bold text-[11px] px-2.5 py-1 rounded-lg flex items-center gap-1 w-fit">
              <Package className="w-3 h-3" />
              Siap Dikirim
            </span>
            <span className="text-[9px] text-blue-800 font-semibold pl-0.5">menunggu kurir menjemput barang</span>
          </div>
        );
      case 'delivering':
        return (
          <div className="flex flex-col gap-0.5">
            <span className="bg-indigo-100 text-indigo-800 font-bold text-[11px] px-2.5 py-1 rounded-lg flex items-center gap-1 w-fit">
              <Truck className="w-3 h-3" />
              Dalam Pengiriman
            </span>
            <span className="text-[9px] text-indigo-800 font-semibold pl-0.5">Dalam Pengiriman Ke Alamat</span>
          </div>
        );
      case 'completed':
        return (
          <span className="bg-emerald-100 text-[#063104] font-bold text-[11px] px-2.5 py-1 rounded-lg flex items-center gap-1 w-fit">
            <CheckCircle2 className="w-3 h-3 text-[#063104]" />
            Selesai
          </span>
        );
      case 'cancelled':
        return (
          <span className="bg-gray-100 text-gray-600 font-bold text-[11px] px-2.5 py-1 rounded-lg flex items-center gap-1 w-fit">
            <XCircle className="w-3 h-3" />
            Dibatalkan
          </span>
        );
    }
  };

  // Render Quick Action Button for 1-click status advancement
  const renderQuickActionButton = (order: AdminOrder) => {
    const handleStatusUpdate = (targetStatus: OrderStatus) => {
      updateOrderStatus(order.id, targetStatus);
      if (selectedOrderForDetail?.id === order.id) {
        setSelectedOrderForDetail((prev) => prev ? { ...prev, status: targetStatus } : null);
      }
    };

    switch (order.status) {
      case 'new':
        return (
          <button
            type="button"
            onClick={() => handleStatusUpdate('processing')}
            className="bg-[#063104] hover:bg-[#084205] text-white font-extrabold text-xs px-3 py-1.5 rounded-xl shadow-xs transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
            title="Terima pesanan & mulai kemas di toko"
          >
            <span>Terima Order</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        );
      case 'processing':
        return (
          <button
            type="button"
            onClick={() => handleStatusUpdate('ready')}
            className="bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-extrabold text-xs px-3 py-1.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            title="Tandai pesanan selesai dikemas & siap dikirim (menunggu kurir)"
          >
            <Package className="w-3.5 h-3.5" />
            <span>Siap Dikirim</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        );
      case 'ready':
        return (
          <div className="flex items-center justify-center gap-1.5">
            <button
              type="button"
              onClick={() => handleRequestBiteshipCourier(order, 'gosend')}
              disabled={isBookingBiteship}
              className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-extrabold text-xs px-2.5 py-1.5 rounded-xl shadow-xs transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
              title="Panggil Kurir Instant Biteship (GoSend / GrabExpress)"
            >
              <Zap className="w-3.5 h-3.5 text-yellow-300 fill-current" />
              <span>{isBookingBiteship ? 'Memanggil...' : 'Panggil Biteship'}</span>
            </button>
            <button
              type="button"
              onClick={() => handleStatusUpdate('delivering')}
              className="bg-[#063104] hover:bg-[#084205] text-white font-extrabold text-xs px-2.5 py-1.5 rounded-xl shadow-xs transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
              title="Mulai pengiriman ke alamat pemesan (Manual)"
            >
              <span>Kirim (Manual)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      case 'delivering':
        return (
          <div className="flex items-center justify-center gap-1.5">
            <button
              type="button"
              onClick={() => setOrderForCourierMap(order)}
              className="bg-[#063104] hover:bg-[#084205] text-white font-extrabold text-xs px-2.5 py-1.5 rounded-xl shadow-xs transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
              title="Buka Peta Live Navigasi Rute Kurir Internal"
            >
              <Compass className="w-3.5 h-3.5 text-yellow-300 animate-spin-slow" />
              <span>Peta Rute Kurir</span>
            </button>
            <button
              type="button"
              onClick={async () => {
                try {
                  const res = await fetch(`${API_BASE_URL}/orders/${order.id}/confirm-receipt`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                  });
                  const json = await res.json();
                  if (json.success) {
                    showToast(json.message);
                    const storeIdFilter = profile.role === 'admin_store' ? (profile.assignedStoreId || undefined) : undefined;
                    fetchInitialData(storeIdFilter);
                  } else {
                    handleStatusUpdate('completed');
                  }
                } catch {
                  handleStatusUpdate('completed');
                }
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-2.5 py-1.5 rounded-xl shadow-xs transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
            >
              <span>Pesanan Diterima</span>
              <CheckCircle2 className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      case 'completed':
        return (
          <span className="text-[11px] text-gray-400 font-medium italic">Selesai</span>
        );
      case 'cancelled':
        return (
          <span className="text-[11px] text-gray-400 font-medium italic">Dibatalkan</span>
        );
    }
  };

  if (isLoadingData) {
    return <TableSkeleton rows={7} />;
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Title & Top Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Manajemen Pesanan</h1>
          <p className="text-xs text-gray-500">
            Kelola alur status pesanan segar secara real-time dari masuk hingga terkirim.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setQrSearchCode('');
              setScannedOrder(null);
              setIsQrScannerOpen(true);
            }}
            className="bg-[#063104] hover:bg-[#084205] text-white font-extrabold px-3.5 py-2.5 rounded-2xl text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95 border border-emerald-900/30"
          >
            <QrCode className="w-4 h-4 text-emerald-300" />
            <span>Scan QR Pickup</span>
          </button>

          <button
            type="button"
            onClick={addNewMockOrder}
            className="bg-white hover:bg-gray-50 text-gray-800 border border-gray-200 font-extrabold px-3.5 py-2.5 rounded-2xl text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer"
          >
            <Bell className="w-4 h-4 text-amber-500" />
            <span>+ Masukkan Pesanan Simulasi</span>
          </button>
        </div>
      </div>

      {/* Header Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search Bar */}
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari ID Pesanan, Nama Pelanggan, atau No. Telepon..."
            className="w-full bg-gray-50 text-xs md:text-sm rounded-xl py-2.5 pl-9 pr-4 border border-gray-200 focus:outline-none focus:border-[#063104] focus:bg-white"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        {/* Filter Controls: Date & Shipping Type */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <select
            value={shippingTypeFilter}
            onChange={(e) => setShippingTypeFilter(e.target.value)}
            className="bg-gray-50 text-xs rounded-xl py-2.5 px-3 border border-gray-200 focus:outline-none focus:border-[#063104] font-bold text-gray-700"
          >
            <option value="all">Semua Tipe Pengiriman</option>
            <option value="pickup">📦 Self-Pickup</option>
            <option value="instant">⚡ Kurir Instan</option>
            <option value="scheduled">📅 Terjadwal</option>
            <option value="cod">💰 COD</option>
          </select>

          <div className="relative flex-1 md:flex-none">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-gray-50 text-xs rounded-xl py-2.5 px-3 border border-gray-200 focus:outline-none focus:border-[#063104]"
            />
          </div>

          {dateFilter && (
            <button
              type="button"
              onClick={() => setDateFilter('')}
              className="text-xs font-bold text-red-600 hover:underline"
            >
              Reset Tgl
            </button>
          )}
        </div>
      </div>

      {/* Horizontal Status Chips Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pt-2 pb-2.5 my-1 no-scrollbar">
        {statusTabs.map((tab) => {
          const isActive = selectedStatusTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedStatusTab(tab.id)}
              className={`relative px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${isActive
                ? 'bg-[#77a160] text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${isActive
                  ? 'bg-white text-[#063104]'
                  : 'bg-gray-100 text-gray-700'
                  }`}
              >
                {tab.count}
              </span>

              {/* Red dot badge indicator for "Pesanan Baru" */}
              {tab.badgeRed && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full ring-2 ring-white animate-bounce"></span>
              )}
            </button>
          );
        })}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F9F8F6] text-gray-700 text-xs font-extrabold uppercase border-b border-gray-200/80">
                <th className="py-3.5 px-4">ID Pesanan</th>
                <th className="py-3.5 px-4">Pelanggan</th>
                <th className="py-3.5 px-4">Waktu Order</th>
                <th className="py-3.5 px-4">Item (Ringkasan)</th>
                <th className="py-3.5 px-4">Total Harga</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-center">Aksi Cepat</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 text-xs">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    Tidak ada data pesanan yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => (
                  <tr
                    key={ord.id}
                    className="hover:bg-emerald-50/40 transition-colors group cursor-pointer"
                    onClick={() => setSelectedOrderForDetail(ord)}
                  >
                    {/* ID Pesanan */}
                    <td className="py-3.5 px-4 font-black text-[#063104]">
                      {ord.id}
                    </td>

                    {/* Pelanggan */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-gray-900">{ord.customerName}</div>
                      <div className="text-[11px] text-gray-500 font-mono">{ord.phone}</div>
                    </td>

                    {/* Waktu Order */}
                    <td className="py-3.5 px-4 text-gray-600 whitespace-nowrap">
                      <div className="font-semibold">{ord.orderTime}</div>
                      <div className="text-[10px] text-gray-400">{ord.orderDate}</div>
                    </td>

                    {/* Item Summary */}
                    <td className="py-3.5 px-4 font-medium text-gray-800 max-w-xs truncate">
                      {ord.itemsSummary}
                    </td>

                    {/* Total Harga */}
                    <td className="py-3.5 px-4 font-extrabold text-gray-900">
                      {formatCurrency(ord.totalPrice)}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">{getStatusBadge(ord.status)}</td>

                    {/* Quick Action Button */}
                    <td
                      className="py-3.5 px-4 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-center gap-2">
                        {renderQuickActionButton(ord)}
                        <button
                          type="button"
                          onClick={() => setOrderToPrint(ord)}
                          className="p-1.5 rounded-lg bg-[#063104] text-white hover:bg-[#084205] transition-colors"
                          title="Cetak Struk & Resi Label"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedOrderForDetail(ord)}
                          className="p-1.5 rounded-lg bg-gray-100 hover:bg-[#063104] hover:text-white text-gray-600 transition-colors"
                          title="Lihat Detail"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Order Modal */}
      {selectedOrderForDetail && (
        <div
          className="fixed inset-0 z-[3000] bg-black/60 flex items-center justify-center p-4 overflow-y-auto animate-fade-in"
          style={{ backdropFilter: 'blur(4px)' }}
        >
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-gray-100 flex flex-col my-auto">
            {/* Header Modal */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-[#F9F8F6]">
              <div>
                <span className="text-[10px] font-extrabold text-[#063104] uppercase tracking-wider">
                  Detail Transaksi
                </span>
                <h3 className="font-extrabold text-gray-900 text-lg">
                  {selectedOrderForDetail.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderForDetail(null)}
                className="p-1.5 rounded-xl hover:bg-gray-200 text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Detail */}
            <div className="p-6 space-y-4 text-xs">
              {/* Customer Info */}
              <div className="bg-gray-50 rounded-2xl p-3.5 border border-gray-200/80 space-y-1">
                <div className="flex items-center justify-between font-bold text-gray-900">
                  <span>{selectedOrderForDetail.customerName}</span>
                  <span className="flex items-center gap-1 text-[#063104]">
                    <Phone className="w-3 h-3" /> {selectedOrderForDetail.phone}
                  </span>
                </div>
                <p className="text-gray-600 flex items-start gap-1 pt-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                  <span>{selectedOrderForDetail.shippingAddress}</span>
                </p>
              </div>

              {/* Status & Payment Method */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-1">
                  <span className="text-[10px] font-bold text-gray-500 block">Status Saat Ini:</span>
                  {getStatusBadge(selectedOrderForDetail.status)}
                </div>

                <div className="p-3 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-1">
                  <span className="text-[10px] font-bold text-gray-500 block">Pembayaran:</span>
                  <span className="font-bold text-gray-900 flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5 text-[#063104]" />
                    {selectedOrderForDetail.paymentMethod}
                  </span>
                </div>
              </div>

              {/* Shipping Type Info */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Tipe Pengiriman:</span>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${selectedOrderForDetail.shippingType === 'pickup' ? 'bg-blue-50 text-blue-700 border-blue-200' : selectedOrderForDetail.shippingType === 'scheduled' ? 'bg-purple-50 text-purple-700 border-purple-200' : selectedOrderForDetail.shippingType === 'cod' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                    {selectedOrderForDetail.shippingType === 'pickup' ? '📦 Self-Pickup' : selectedOrderForDetail.shippingType === 'scheduled' ? '📅 Terjadwal' : selectedOrderForDetail.shippingType === 'cod' ? '💰 COD' : '⚡ Instant Delivery'}
                  </span>
                </div>
                {selectedOrderForDetail.shippingType === 'pickup' && selectedOrderForDetail.pickupCode && (
                  <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-xs text-gray-600 font-medium">PIN Ambil di Toko:</span>
                    <span className="text-sm font-black tracking-widest bg-blue-100 text-blue-800 px-3 py-1 rounded-lg border border-blue-300 font-mono">
                      {selectedOrderForDetail.pickupCode}
                    </span>
                  </div>
                )}
                {selectedOrderForDetail.shippingType === 'scheduled' && selectedOrderForDetail.scheduledDate && (
                  <div className="pt-1 border-t border-slate-200 text-xs text-gray-600">
                    <span>Jadwal: <strong>{selectedOrderForDetail.scheduledDate}</strong> ({selectedOrderForDetail.scheduledSlot || 'Slot Standar'})</span>
                  </div>
                )}
                {selectedOrderForDetail.driverName && (
                  <div className="pt-1 border-t border-slate-200 text-xs text-gray-600">
                    <span>Kurir: <strong>{selectedOrderForDetail.driverName}</strong> ({selectedOrderForDetail.driverPhone || '-'}) • {selectedOrderForDetail.driverPlate || ''}</span>
                  </div>
                )}
              </div>

              {/* Biteship Instant Courier Integration Card */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/80 border border-indigo-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-indigo-900 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-500 fill-current" />
                    <span>Pemanggilan Kurir Instant Biteship</span>
                  </span>
                  {(selectedOrderForDetail.biteshipWaybillId || selectedOrderForDetail.trackingNumber) && (
                    <span className="bg-indigo-600 text-white font-mono text-[10px] font-extrabold px-2 py-0.5 rounded-md">
                      Resi: {selectedOrderForDetail.biteshipWaybillId || selectedOrderForDetail.trackingNumber}
                    </span>
                  )}
                </div>

                {selectedOrderForDetail.biteshipTrackingUrl ? (
                  <div className="space-y-1.5 text-xs text-indigo-950 pt-1">
                    <p className="font-semibold flex items-center gap-1 text-[11px]">
                      <Truck className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Kurir Aktif: <strong>{selectedOrderForDetail.driverName || 'GoSend / GrabExpress'}</strong></span>
                    </p>
                    <a
                      href={selectedOrderForDetail.biteshipTrackingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-3.5 py-2 rounded-xl text-xs shadow-xs transition-all"
                    >
                      <span>Lacak Live Tracking Biteship</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ) : (
                  <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleRequestBiteshipCourier(selectedOrderForDetail, 'gosend')}
                      disabled={isBookingBiteship}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-extrabold px-3 py-2 rounded-xl text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Zap className="w-4 h-4 text-yellow-300 fill-current" />
                      <span>{isBookingBiteship ? 'Memanggil...' : 'Panggil GoSend Instant'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRequestBiteshipCourier(selectedOrderForDetail, 'grab')}
                      disabled={isBookingBiteship}
                      className="flex-1 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-extrabold px-3 py-2 rounded-xl text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Zap className="w-4 h-4 text-yellow-300 fill-current" />
                      <span>{isBookingBiteship ? 'Memanggil...' : 'Panggil GrabExpress Instant'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Items List Table */}
              <div className="space-y-2">
                <span className="font-extrabold text-[#063104] uppercase tracking-wider text-[11px] block">
                  Rincian Barang Belanjaan:
                </span>
                <div className="border border-gray-200 rounded-2xl overflow-hidden divide-y divide-gray-100">
                  {selectedOrderForDetail.items.map((it, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-gray-900">{it.productName}</h4>
                        <p className="text-[10px] text-gray-500">
                          {formatCurrency(it.price)} {it.unit} x {it.quantity}
                        </p>
                      </div>
                      <span className="font-extrabold text-gray-900">
                        {formatCurrency(it.price * it.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Grand Total */}
              <div className="flex items-center justify-between text-sm font-black pt-2 border-t border-gray-100">
                <span>Total Pembayaran</span>
                <span className="text-[#063104] text-base">
                  {formatCurrency(selectedOrderForDetail.totalPrice)}
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 bg-[#F9F8F6] flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setSelectedOrderForDetail(null)}
                className="bg-white border border-gray-300 text-gray-700 font-bold px-4 py-2 rounded-xl text-xs cursor-pointer"
              >
                Tutup
              </button>

              <div className="flex items-center gap-2">
                {renderQuickActionButton(selectedOrderForDetail)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print Shipping Label Modal */}
      <PrintShippingLabel
        open={!!orderToPrint}
        onClose={() => setOrderToPrint(null)}
        order={orderToPrint}
      />

      {/* Internal Courier Live Delivery Map */}
      <InternalCourierMapView
        open={!!orderForCourierMap}
        onClose={() => setOrderForCourierMap(null)}
        order={orderForCourierMap}
        onConfirmReceipt={(orderId) => {
          updateOrderStatus(orderId, 'completed');
          setOrderForCourierMap(null);
          showToast('Pengiriman berhasil diselesaikan!');
        }}
      />

      {/* Camera / Manual QR Pickup Verification Modal */}
      {isQrScannerOpen && (
        <div className="fixed inset-0 z-[4000] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-100 p-5 space-y-4 relative">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                  <QrCode className="w-5 h-5 text-[#063104]" />
                </div>
                <div>
                  <h3 className="font-black text-gray-900 text-sm">Scan QR / Kode Pickup</h3>
                  <p className="text-[11px] text-gray-500">Verifikasi kode serah terima barang dari pelanggan</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsQrScannerOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Input Box for Scanner / Manual Typing */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">Kode Pickup / No. Pesanan:</label>
              <input
                type="text"
                value={qrSearchCode}
                onChange={(e) => {
                  const code = e.target.value;
                  setQrSearchCode(code);
                  if (code.trim()) {
                    const matched = orders.find(
                      (o) =>
                        (o.pickupCode && o.pickupCode.toLowerCase() === code.trim().toLowerCase()) ||
                        o.id.toLowerCase().includes(code.trim().toLowerCase()) ||
                        (o.dbId && o.dbId.toLowerCase().includes(code.trim().toLowerCase()))
                    );
                    setScannedOrder(matched || null);
                  } else {
                    setScannedOrder(null);
                  }
                }}
                placeholder="Scan QR Code atau ketik PKUP-XXXX..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold uppercase focus:outline-none focus:border-[#063104] focus:bg-white transition-all shadow-xs"
                autoFocus
              />
            </div>

            {/* Simulated Interactive QR Camera View Frame */}
            <div className="border-2 border-dashed border-emerald-300/80 rounded-2xl p-5 bg-gradient-to-b from-emerald-50/60 to-emerald-50/20 text-center space-y-2 relative overflow-hidden">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-white border border-emerald-200 flex items-center justify-center shadow-xs">
                <QrCode className="w-8 h-8 text-[#063104] animate-pulse" />
              </div>
              <p className="text-[11px] text-gray-600 font-medium leading-snug max-w-xs mx-auto">
                Arahkan QR Code pelanggan ke scanner atau masukkan 6 karakter Kode Pickup di atas.
              </p>
            </div>

            {/* Matched Order Card */}
            {scannedOrder ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 space-y-2.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-[#063104] text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    <span>Pesanan Ditemukan!</span>
                  </span>
                  <span className="bg-emerald-100 text-[#063104] text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                    #{scannedOrder.id}
                  </span>
                </div>

                <div className="text-xs text-gray-700 space-y-1 bg-white/80 p-2.5 rounded-xl border border-emerald-100">
                  <p className="font-bold text-gray-900">{scannedOrder.customerName} ({scannedOrder.phone})</p>
                  <p className="text-[11px] text-gray-600">Alamat / Lokasi: {scannedOrder.shippingAddress || 'Self-Pickup di Toko'}</p>
                  <p className="text-[11px] text-gray-600">Total: <strong className="text-[#063104] font-bold">{formatCurrency(scannedOrder.totalPrice)}</strong></p>
                  <p className="text-[11px] text-gray-600">Status Saat Ini: <span className="uppercase text-amber-800 font-extrabold">{scannedOrder.status}</span></p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    updateOrderStatus(scannedOrder.id, 'completed');
                    showToast(`Pesanan #${scannedOrder.id} berhasil diselesaikan!`);
                    setIsQrScannerOpen(false);
                  }}
                  className="w-full bg-[#063104] hover:bg-[#084205] text-white font-extrabold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95 border border-emerald-900/30"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Konfirmasi Serah Terima Barang (Selesai)</span>
                </button>
              </div>
            ) : qrSearchCode.trim() ? (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-center text-rose-700 font-bold">
                Pesanan dengan kode "{qrSearchCode}" tidak ditemukan.
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

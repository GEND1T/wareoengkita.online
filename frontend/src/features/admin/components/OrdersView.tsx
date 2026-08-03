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
} from 'lucide-react';
import { useAdminStore } from '../store/useAdminStore';
import { useUserStore } from '../../auth/store/useUserStore';
import type { AdminOrder, OrderStatus } from '../../../types';
import { PrintShippingLabel } from './PrintShippingLabel';
import { TableSkeleton } from '../../../components/common/AdminSkeletons';

export const OrdersView: React.FC = () => {
  const { profile } = useUserStore();
  const { orders, updateOrderStatus, addNewMockOrder, fetchInitialData, isLoadingData } = useAdminStore();

  React.useEffect(() => {
    fetchInitialData(profile.assignedStoreId);
  }, [profile.assignedStoreId, fetchInitialData]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusTab, setSelectedStatusTab] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<AdminOrder | null>(null);
  const [orderToPrint, setOrderToPrint] = useState<AdminOrder | null>(null);

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

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [orders, searchQuery, selectedStatusTab, dateFilter]);

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
          <span className="bg-amber-100 text-amber-800 font-bold text-[11px] px-2.5 py-1 rounded-lg flex items-center gap-1 w-fit">
            <Clock className="w-3 h-3" />
            Diproses
          </span>
        );
      case 'ready':
        return (
          <span className="bg-blue-100 text-blue-800 font-bold text-[11px] px-2.5 py-1 rounded-lg flex items-center gap-1 w-fit">
            <Package className="w-3 h-3" />
            Siap Dikirim
          </span>
        );
      case 'delivering':
        return (
          <span className="bg-indigo-100 text-indigo-800 font-bold text-[11px] px-2.5 py-1 rounded-lg flex items-center gap-1 w-fit">
            <Truck className="w-3 h-3" />
            Dalam Pengiriman
          </span>
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
    switch (order.status) {
      case 'new':
        return (
          <button
            type="button"
            onClick={() => updateOrderStatus(order.id, 'processing')}
            className="bg-[#063104] hover:bg-[#084205] text-white font-extrabold text-xs px-3 py-1.5 rounded-xl shadow-xs transition-all active:scale-95 flex items-center gap-1"
          >
            <span>Terima Order</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        );
      case 'processing':
        return (
          <button
            type="button"
            onClick={() => updateOrderStatus(order.id, 'ready')}
            className="bg-[#063104] hover:bg-[#084205] text-white font-extrabold text-xs px-3 py-1.5 rounded-xl shadow-xs transition-all active:scale-95 flex items-center gap-1"
          >
            <span>Siap Dikirim</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        );
      case 'ready':
        return (
          <button
            type="button"
            onClick={() => updateOrderStatus(order.id, 'delivering')}
            className="bg-[#063104] hover:bg-[#084205] text-white font-extrabold text-xs px-3 py-1.5 rounded-xl shadow-xs transition-all active:scale-95 flex items-center gap-1"
          >
            <span>Kirim Driver</span>
            <Truck className="w-3.5 h-3.5" />
          </button>
        );
      case 'delivering':
        return (
          <button
            type="button"
            onClick={() => updateOrderStatus(order.id, 'completed')}
            className="bg-[#063104] hover:bg-[#084205] text-white font-extrabold text-xs px-3 py-1.5 rounded-xl shadow-xs transition-all active:scale-95 flex items-center gap-1"
          >
            <span>Selesai</span>
            <CheckCircle2 className="w-3.5 h-3.5" />
          </button>
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

        <button
          type="button"
          onClick={addNewMockOrder}
          className="bg-[#063104] hover:bg-[#084205] text-white font-extrabold px-4 py-2.5 rounded-2xl text-xs shadow-md transition-all flex items-center gap-2 shrink-0 self-start sm:self-auto"
        >
          <Bell className="w-4 h-4 text-yellow-400" />
          <span>+ Masukkan Pesanan Baru (Simulasi)</span>
        </button>
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

        {/* Date Range Picker */}
        <div className="flex items-center gap-2 shrink-0">
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
            <div className="p-4 border-t border-gray-100 bg-[#F9F8F6] flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedOrderForDetail(null)}
                className="bg-white border border-gray-300 text-gray-700 font-bold px-4 py-2 rounded-xl text-xs"
              >
                Tutup
              </button>

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
    </div>
  );
};

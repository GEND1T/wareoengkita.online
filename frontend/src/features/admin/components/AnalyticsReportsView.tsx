import React, { useState } from 'react';
import {
  TrendingUp,
  Download,
  DollarSign,
  ShoppingBag,
  Award,
  BarChart3,
} from 'lucide-react';
import { useAdminStore } from '../store/useAdminStore';
import { AnalyticsSkeleton } from '../../../components/common/AdminSkeletons';

export const AnalyticsReportsView: React.FC = () => {
  const { orders, products, showToast, isLoadingData } = useAdminStore();

  const [dateRange, setDateRange] = useState('bulan_ini');

  // Compute metrics
  const totalRevenue = orders.reduce((sum, ord) => sum + ord.totalPrice, 0);
  const totalOrdersCount = orders.length;
  const avgBasket = totalOrdersCount > 0 ? Math.round(totalRevenue / totalOrdersCount) : 0;

  // Top Selling Products mock calculation
  const topSellingProducts = products
    .map((p, idx) => ({
      ...p,
      salesCount: [142, 98, 85, 76, 64, 52, 41, 30][idx] || 25,
      totalSalesRevenue: ([142, 98, 85, 76, 64, 52, 41, 30][idx] || 25) * p.price,
    }))
    .sort((a, b) => b.salesCount - a.salesCount)
    .slice(0, 5);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    })
      .format(val)
      .replace(/\s/g, ' ');

  // Export CSV Report Handler
  const handleExportCSV = () => {
    const headers = ['ID Pesanan', 'Nama Customer', 'Tanggal', 'Status', 'Total Biaya (Rp)'];
    const rows = orders.map((o) => [
      o.id,
      `"${o.customerName}"`,
      o.orderDate,
      o.status,
      o.totalPrice,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Penjualan_OrganikStore_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Laporan penjualan (.CSV) berhasil diunduh!');
  };

  if (isLoadingData) {
    return <AnalyticsSkeleton />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title & Date Range Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="hidden md:block">
          <h1 className="text-2xl font-black text-gray-900">Laporan Analytics & Penjualan</h1>
          <p className="text-xs text-gray-500">
            Data statistik omzet toko, performa produk terlaris, dan ekspor laporan transaksi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="bg-white text-xs font-bold rounded-2xl px-3 py-2.5 md:px-3.5 md:py-3 border border-gray-200 focus:outline-none focus:border-[#063104] shadow-xs"
          >
            <option value="hari_ini">Hari Ini</option>
            <option value="minggu_ini">Minggu Ini</option>
            <option value="bulan_ini">Bulan Ini</option>
            <option value="tahun_ini">Tahun Ini</option>
          </select>

          <button
            type="button"
            onClick={handleExportCSV}
            className="bg-[#063104] hover:bg-[#084205] text-white font-extrabold px-3 py-2.5 md:px-4.5 md:py-3 rounded-2xl text-xs shadow-lg hover:shadow-emerald-900/20 transition-all duration-200 flex items-center gap-1.5 md:gap-2 shrink-0 active:scale-95 border border-emerald-900/30 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span className="hidden md:inline">Ekspor Laporan (CSV)</span>
            <span className="md:hidden">Ekspor</span>
          </button>
        </div>
      </div>

      {/* Top 3 KPI Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        <div className="bg-white rounded-2xl md:rounded-3xl p-4 md:p-5 border border-gray-100 shadow-sm flex items-center justify-between col-span-2 md:col-span-1">
          <div>
            <span className="text-[10px] md:text-xs font-bold text-gray-400 block">Total Omzet</span>
            <span className="text-lg md:text-2xl font-black text-[#063104]">{formatCurrency(totalRevenue)}</span>
            <span className="text-[10px] text-emerald-700 font-extrabold flex items-center gap-0.5 mt-1">
              <TrendingUp className="w-3 h-3" />
              <span>+18.4%</span>
            </span>
          </div>
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-emerald-100 text-[#063104] flex items-center justify-center font-bold">
            <DollarSign className="w-5 h-5 md:w-6 md:h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl md:rounded-3xl p-4 md:p-5 border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] md:text-xs font-bold text-gray-400 block">Transaksi</span>
            <span className="text-lg md:text-2xl font-black text-gray-900">{totalOrdersCount}</span>
            <span className="text-[10px] text-emerald-700 font-extrabold flex items-center gap-0.5 mt-1">
              <TrendingUp className="w-3 h-3" />
              <span>100%</span>
            </span>
          </div>
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
            <ShoppingBag className="w-5 h-5 md:w-6 md:h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl md:rounded-3xl p-4 md:p-5 border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] md:text-xs font-bold text-gray-400 block">Avg Basket</span>
            <span className="text-lg md:text-2xl font-black text-purple-900">{formatCurrency(avgBasket)}</span>
            <span className="text-[10px] text-gray-500 font-bold block mt-1">Per transaksi</span>
          </div>
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
            <BarChart3 className="w-5 h-5 md:w-6 md:h-6" />
          </div>
        </div>
      </div>

      {/* Top Selling Products List */}
      <div className="bg-white rounded-2xl md:rounded-3xl p-4 md:p-6 border border-gray-100 shadow-sm space-y-3 md:space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2 text-[#063104] font-extrabold text-xs md:text-sm">
            <Award className="w-4 h-4 md:w-5 md:h-5 text-amber-500" />
            <span>Top 5 Best Sellers</span>
          </div>
          <span className="text-[10px] md:text-xs text-gray-400 font-bold hidden md:block">Paling Banyak Dipesan</span>
        </div>

        <div className="space-y-3">
          {topSellingProducts.map((p, idx) => (
            <div
              key={p.id}
              className="flex items-center justify-between p-3 md:p-3.5 rounded-2xl bg-gray-50/80 border border-gray-100 hover:border-[#77a160] transition-all text-xs"
            >
              <div className="flex items-center gap-2 md:gap-3 min-w-0">
                <span className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-[#063104] text-white font-black text-[10px] md:text-xs flex items-center justify-center shrink-0">
                  #{idx + 1}
                </span>
                <img
                  src={p.image}
                  alt={p.name}
                  className="w-9 h-9 md:w-11 md:h-11 object-cover rounded-xl border border-gray-200 bg-white shrink-0"
                />
                <div className="min-w-0">
                  <h4 className="font-extrabold text-gray-900 text-[11px] md:text-xs truncate">{p.name}</h4>
                  <span className="text-[10px] md:text-[11px] text-gray-500 font-semibold hidden md:block">
                    Kategori: {typeof p.category === 'object' && p.category !== null ? (p.category as any).name || (p.category as any).slug : String(p.category || 'Sayur Segar')} • {formatCurrency(p.price)} {p.unit}
                  </span>
                  <span className="text-[9px] text-gray-500 font-semibold md:hidden block">
                    {formatCurrency(p.price)}
                  </span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="font-black text-[#063104] text-[11px] md:text-sm block">
                  {p.salesCount} Terjual
                </span>
                <span className="text-[10px] md:text-[11px] font-bold text-gray-500 block hidden md:block">
                  {formatCurrency(p.totalSalesRevenue)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

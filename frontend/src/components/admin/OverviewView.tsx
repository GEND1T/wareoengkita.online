import React from 'react';
import {
  TrendingUp,
  ShoppingBag,
  PackageCheck,
  Users,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Bell,
} from 'lucide-react';
import { useAdminStore } from '../../store/useAdminStore';
import { OverviewSkeleton } from '../common/AdminSkeletons';

export const OverviewView: React.FC = () => {
  const { products, orders, setActiveTab, addNewMockOrder, isLoadingData } = useAdminStore();

  const totalRevenue = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.totalPrice, 0);

  const newOrdersCount = orders.filter((o) => o.status === 'new').length;
  const lowStockProducts = products.filter((p) => p.stock < 5);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    })
      .format(val)
      .replace(/\s/g, ' ');

  if (isLoadingData) {
    return <OverviewSkeleton />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#063104] to-[#77a160] rounded-3xl p-6 text-white shadow-xl flex items-center justify-between">
        <div className="space-y-1">
          <span className="bg-white/20 text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
            Dashboard Utama
          </span>
          <h1 className="text-2xl font-black pt-1">Selamat Datang, Admin Store! 👋</h1>
          <p className="text-xs text-emerald-100 max-w-lg leading-relaxed">
            Pantau aktivitas toko segar secara real-time. Kelola pesanan masuk, ketersediaan stok sayur & buah organik hari ini.
          </p>
        </div>

        <button
          type="button"
          onClick={addNewMockOrder}
          className="bg-[#FACC15] hover:bg-yellow-400 text-[#063104] font-black px-4 py-3 rounded-2xl text-xs shadow-lg transition-all active:scale-95 flex items-center gap-2 shrink-0"
        >
          <Bell className="w-4 h-4" />
          <span>Simulasi Pesanan Baru</span>
        </button>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1 */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500">Total Penjualan</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-[#063104]">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <h2 className="text-xl font-extrabold text-gray-900">{formatCurrency(totalRevenue)}</h2>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-bold">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+18.4% dari kemarin</span>
          </div>
        </div>

        {/* Stat 2 */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500">Pesanan Masuk</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-gray-900">{orders.length} Pesanan</h2>
            {newOrdersCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
                {newOrdersCount} Baru
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className="text-[11px] text-[#063104] font-bold hover:underline block"
          >
            Kelola pesanan →
          </button>
        </div>

        {/* Stat 3 */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500">Katalog Produk</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <PackageCheck className="w-5 h-5" />
            </div>
          </div>
          <h2 className="text-xl font-extrabold text-gray-900">{products.length} Produk</h2>
          <button
            type="button"
            onClick={() => setActiveTab('products')}
            className="text-[11px] text-blue-700 font-bold hover:underline block"
          >
            {lowStockProducts.length > 0 ? `⚠️ ${lowStockProducts.length} stok tipis` : 'Lihat semua produk'}
          </button>
        </div>

        {/* Stat 4 */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500">Pelanggan Aktif</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <h2 className="text-xl font-extrabold text-gray-900">142 User</h2>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>98.2% Kepuasan</span>
          </div>
        </div>
      </div>

      {/* Main Row: Sales Visual Chart & Low Stock Alert */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sales Chart Widget */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-gray-900 text-base">Grafik Penjualan Harian</h3>
              <p className="text-xs text-gray-400">Trend transaksi 7 hari terakhir</p>
            </div>
            <span className="bg-emerald-50 text-[#063104] text-xs font-extrabold px-3 py-1 rounded-full border border-emerald-200">
              Minggu Ini
            </span>
          </div>

          {/* Simple Visual Bar Chart */}
          <div className="pt-6 pb-2 px-2 flex items-end justify-between gap-3 h-48 border-b border-gray-100">
            {[
              { day: 'Sen', amount: 120000, height: '40%' },
              { day: 'Sel', amount: 240000, height: '65%' },
              { day: 'Rab', amount: 180000, height: '50%' },
              { day: 'Kam', amount: 310000, height: '85%' },
              { day: 'Jum', amount: 290000, height: '75%' },
              { day: 'Sab', amount: 420000, height: '100%' },
              { day: 'Min', amount: 350000, height: '90%' },
            ].map((bar, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                <div className="text-[10px] font-bold text-[#063104] opacity-0 group-hover:opacity-100 transition-opacity">
                  {(bar.amount / 1000).toFixed(0)}k
                </div>
                <div
                  style={{ height: bar.height }}
                  className="w-full bg-[#77a160] group-hover:bg-[#063104] rounded-t-xl transition-all duration-300 relative"
                ></div>
                <span className="text-xs font-bold text-gray-600">{bar.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Alert Sidebar */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-amber-800 font-extrabold text-sm pb-2 border-b border-gray-100">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Peringatan Stok Tipis (&lt; 5)</span>
            </div>

            <div className="mt-3 space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {lowStockProducts.length === 0 ? (
                <p className="text-xs text-gray-400 py-4 text-center">
                  Semua stok produk dalam kondisi aman.
                </p>
              ) : (
                lowStockProducts.map((prod) => (
                  <div
                    key={prod.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-1">
                      <img
                        src={prod.image}
                        alt={prod.name}
                        className="w-9 h-9 object-contain bg-white rounded-lg border border-amber-200 p-0.5 shrink-0"
                      />
                      <div className="min-w-0">
                        <h4 className="font-bold text-gray-900 truncate">{prod.name}</h4>
                        <p className="text-[10px] text-gray-500 capitalize">
                          {typeof prod.category === 'object' && prod.category !== null ? (prod.category as any).name || (prod.category as any).slug : String(prod.category || 'Sayur Segar')}
                        </p>
                      </div>
                    </div>
                    <span className="bg-red-500 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-md shrink-0">
                      Sisa {prod.stock}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('products')}
            className="w-full bg-[#063104] hover:bg-[#084205] text-white font-bold py-3 rounded-2xl text-xs shadow-md transition-all mt-4"
          >
            Kelola Stok Produk
          </button>
        </div>
      </div>
    </div>
  );
};

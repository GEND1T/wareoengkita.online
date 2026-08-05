import React from 'react';
import { CheckCircle2, Home, ShoppingBag, Printer } from 'lucide-react';
import { usePembayaranStore } from '../store/usePembayaranStore';

interface PaymentSuccessPageProps {
  isOpen: boolean;
  onClose: () => void;
  onViewOrders?: () => void;
}

export const PaymentSuccessPage: React.FC<PaymentSuccessPageProps> = ({
  isOpen,
  onClose,
  onViewOrders,
}) => {
  const { activePayment } = usePembayaranStore();

  if (!isOpen || !activePayment) return null;

  const formattedAmount = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(activePayment.paymentAmount);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-100 print:shadow-none print:border-none print:w-full print:max-w-none">
        {/* Celebration Header */}
        <div className="bg-gradient-to-b from-[#063104] to-[#0a4807] text-white p-8 text-center relative overflow-hidden">
          <div className="w-20 h-20 rounded-full bg-emerald-400/20 border-2 border-emerald-400/40 flex items-center justify-center mx-auto mb-4 backdrop-blur-md animate-bounce">
            <CheckCircle2 className="w-12 h-12 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-black tracking-tight">Pembayaran Berhasil!</h2>
          <p className="text-xs text-emerald-200/90 mt-1 max-w-xs mx-auto">
            Terima kasih, transaksi Anda telah terverifikasi secara resmi oleh sistem Duitku Payment Gateway.
          </p>
        </div>

        {/* Invoice Summary Body */}
        <div className="p-6 space-y-5">
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-center">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Terbayar</span>
            <p className="text-3xl font-black text-[#063104] mt-0.5">{formattedAmount}</p>
            <span className="inline-block mt-2 text-[11px] font-extrabold bg-emerald-100 text-emerald-800 px-3 py-0.5 rounded-full">
              LUNAS (PAID)
            </span>
          </div>

          <div className="space-y-3 text-xs divide-y divide-slate-100">
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Order ID (Merchant)</span>
              <span className="font-extrabold text-slate-800 font-mono">{activePayment.merchantOrderId}</span>
            </div>
            {activePayment.reference && (
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Referensi Duitku</span>
                <span className="font-semibold text-slate-700 font-mono">{activePayment.reference}</span>
              </div>
            )}
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Metode Pembayaran</span>
              <span className="font-bold text-slate-800 uppercase">{activePayment.paymentMethod}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Nama Pelanggan</span>
              <span className="font-semibold text-slate-800">{activePayment.customerName || 'Pembeli'}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Waktu Transaksi</span>
              <span className="font-semibold text-slate-700">
                {new Date(activePayment.createdAt).toLocaleString('id-ID', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="p-5 border-t border-slate-100 bg-slate-50/80 space-y-3 print:hidden">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handlePrint}
              className="w-full py-3 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.98]"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Cetak Bukti</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                if (onViewOrders) onViewOrders();
              }}
              className="w-full py-3 bg-emerald-800 hover:bg-emerald-900 text-white rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98]"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Pesanan Saya</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 bg-[#063104] hover:bg-[#084205] text-white rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98]"
          >
            <Home className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </button>
        </div>
      </div>
    </div>
  );
};

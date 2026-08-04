import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  ChevronRight,
  Loader2,
  MessageCircle,
} from 'lucide-react';
import { API_BASE_URL } from '../../../config/api';
import { PaymentPage } from './PaymentPage';
import { PaymentConfirmPage } from './PaymentConfirmPage';
import { PaymentSuccessPage } from './PaymentSuccessPage';

export const PaymentInvoicePage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (!token) return;

    fetch(`${API_BASE_URL}/pembayaran/link/${token}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setInvoice(data.data);
        } else {
          setError(data.message || 'Link pembayaran tidak dapat ditemukan');
        }
      })
      .catch(() => {
        setError('Terjadi kesalahan jaringan saat memuat invoice');
      })
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F8F6] flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-[#063104] animate-spin mb-3" />
        <p className="text-sm font-extrabold text-slate-700">Memuat Link Invoicing Pembayaran...</p>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-[#F9F8F6] flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-slate-100">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-lg font-black text-slate-900">Tagihan Tidak Tersedia</h2>
          <p className="text-xs text-slate-600 mt-1 mb-6">{error || 'Link tidak valid atau telah kadaluarsa.'}</p>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 bg-[#063104] hover:bg-[#084205] text-white font-extrabold text-xs rounded-2xl transition-all"
          >
            Kembali ke Halaman Utama
          </button>
        </div>
      </div>
    );
  }

  const items = invoice.itemsJson ? JSON.parse(invoice.itemsJson) : [];
  const formattedTotal = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(invoice.paymentAmount);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShareWa = () => {
    const text = `Halo, berikut link tagihan pembayaran OrganikStore sebesar ${formattedTotal}: ${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-slate-800 py-8 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header Store Branding */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#063104] text-white flex items-center justify-center font-black text-xl shadow-md">
              🌱
            </div>
            <div>
              <h1 className="text-base font-black text-slate-900">{invoice.store?.name || 'OrganikStore Indonesia'}</h1>
              <p className="text-xs text-slate-500">{invoice.store?.address || 'Invoice Pembayaran Resmi'}</p>
            </div>
          </div>
          <div className="text-right">
            {invoice.statusCode === '00' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-black">
                <CheckCircle2 className="w-3.5 h-3.5" /> LUNAS
              </span>
            ) : invoice.statusCode === '02' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-100 text-rose-800 rounded-full text-xs font-black">
                DIBATALKAN
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-black">
                <Clock className="w-3.5 h-3.5 animate-spin" /> MENUNGGU PEMBAYARAN
              </span>
            )}
          </div>
        </div>

        {/* Invoice Card Details */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200/80">
          <div className="bg-[#063104] text-white p-6 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-emerald-200 font-extrabold tracking-wider uppercase">INVOICE TAGIHAN</span>
              <h2 className="text-xl font-black">#{invoice.merchantOrderId}</h2>
            </div>
            <div className="text-right">
              <span className="text-xs text-emerald-200">Total Pembayaran</span>
              <p className="text-2xl font-black text-white">{formattedTotal}</p>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Customer info */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div>
                <span className="text-slate-500 font-medium">Ditujukan Kepada</span>
                <p className="font-extrabold text-slate-800 mt-0.5">{invoice.customerName || 'Pelanggan Setia'}</p>
                {invoice.customerPhone && <p className="text-slate-600 mt-0.5">{invoice.customerPhone}</p>}
              </div>
              <div className="text-right">
                <span className="text-slate-500 font-medium">Tanggal Dibuat</span>
                <p className="font-bold text-slate-800 mt-0.5">
                  {new Date(invoice.createdAt).toLocaleDateString('id-ID', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>

            {/* Items List */}
            <div>
              <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-3">Rincian Item</h3>
              {items.length > 0 ? (
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
                  {items.map((item: any, idx: number) => (
                    <div key={idx} className="p-3.5 flex items-center justify-between text-xs bg-white">
                      <div>
                        <p className="font-bold text-slate-800">{item.name}</p>
                        <p className="text-slate-500 mt-0.5">
                          {item.quantity} x Rp {item.price?.toLocaleString('id-ID')}
                        </p>
                      </div>
                      <span className="font-extrabold text-slate-900">
                        Rp {(item.quantity * item.price)?.toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-2xl text-xs text-slate-600 font-medium">
                  {invoice.productDetails || 'Pembayaran Produk OrganikStore'}
                </div>
              )}
            </div>

            {/* Actions for Pending Invoice */}
            {invoice.statusCode === '01' && (
              <div className="pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="w-full py-4 bg-[#063104] hover:bg-[#084205] text-white rounded-2xl font-black text-sm shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                  <span>Bayar Tagihan Ini Sekarang</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Share Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
            <span className="text-slate-500 font-semibold">Bagikan Link Tagihan Ini:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl font-bold text-slate-700 flex items-center gap-1.5 shadow-xs"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedLink ? 'Tersalin!' : 'Salin Link'}</span>
              </button>
              <button
                type="button"
                onClick={handleShareWa}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Selector Modal */}
      <PaymentPage
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        orderData={{
          totalAmount: invoice.paymentAmount,
          customerName: invoice.customerName || 'Pelanggan',
          customerEmail: invoice.customerEmail || 'customer@waroengkita.online',
          customerPhone: invoice.customerPhone || '',
          productDetails: invoice.productDetails,
          items,
        }}
        onSuccess={() => {
          setIsPaymentModalOpen(false);
          setIsConfirmOpen(true);
        }}
      />

      {/* Payment Confirmation Modal */}
      <PaymentConfirmPage
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onPaymentSuccess={() => {
          setIsConfirmOpen(false);
          setIsSuccessOpen(true);
        }}
      />

      {/* Payment Success Modal */}
      <PaymentSuccessPage
        isOpen={isSuccessOpen}
        onClose={() => {
          setIsSuccessOpen(false);
          window.location.reload();
        }}
      />
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  X,
  QrCode,
  Copy,
  CheckCircle2,
  Clock,
  Download,
  Building2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Snackbar, Alert } from '@mui/material';

interface PaymentInstructionModalProps {
  open: boolean;
  onClose: () => void;
  orderNo: string;
  totalAmount: number;
  paymentMethodName: string;
  paymentMethodId: string;
  onPaymentConfirmed?: () => void;
}

export const PaymentInstructionModal: React.FC<PaymentInstructionModalProps> = ({
  open,
  onClose,
  orderNo,
  totalAmount,
  paymentMethodName,
  paymentMethodId,
  onPaymentConfirmed,
}) => {
  // 24 Hour Countdown Timer
  const [timeLeft, setTimeLeft] = useState(23 * 3600 + 59 * 60 + 59);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [activeInstructionTab, setActiveInstructionTab] = useState<'mbanking' | 'atm' | 'ewallet'>('mbanking');

  useEffect(() => {
    if (!open) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [open]);

  if (!open) return null;

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    })
      .format(val)
      .replace(/\s/g, ' ');

  // Generated Mock VA Numbers
  const vaNumber =
    paymentMethodId === 'bca_va'
      ? '88012899' + orderNo.replace(/[^0-9]/g, '')
      : paymentMethodId === 'mandiri_va'
      ? '89301822' + orderNo.replace(/[^0-9]/g, '')
      : '78291002' + orderNo.replace(/[^0-9]/g, '');

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(`${label} berhasil disalin!`);
  };

  const isQris = paymentMethodId === 'qris';

  return (
    <div
      className="fixed inset-0 z-[3500] bg-black/60 flex items-center justify-center p-4 overflow-y-auto animate-fade-in"
      style={{ backdropFilter: 'blur(4px)' }}
    >
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-gray-100 flex flex-col my-auto max-h-[90vh]">
        {/* Sticky Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-[#F9F8F6] shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#063104]" />
            <div>
              <h3 className="font-extrabold text-gray-900 text-base leading-none">
                Instruksi Pembayaran
              </h3>
              <span className="text-[10px] text-gray-500 font-medium block mt-0.5">
                No. Pesanan: <strong className="text-gray-900">{orderNo}</strong>
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-gray-200 text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scroll Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Countdown Timer Banner */}
          <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
                <Clock className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-amber-900 block">Selesaikan Pembayaran Dalam</span>
                <span className="text-xs text-amber-800">Pesanan otomatis dibatalkan jika melebihi batas.</span>
              </div>
            </div>

            <div className="font-mono text-base font-black text-amber-900 bg-white px-3 py-1.5 rounded-xl border border-amber-300 shadow-xs">
              {formattedTime}
            </div>
          </div>

          {/* Amount Box */}
          <div className="bg-emerald-50/80 rounded-2xl p-4 border border-emerald-200/80 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-[#063104] block">Total Yang Harus Dibayar</span>
              <span className="text-lg font-black text-gray-900">{formatCurrency(totalAmount)}</span>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(totalAmount.toString(), 'Nominal Total')}
              className="bg-white hover:bg-emerald-100 text-[#063104] font-extrabold px-3 py-1.5 rounded-xl border border-emerald-300 text-[11px] flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Salin Nominal</span>
            </button>
          </div>

          {/* QRIS View */}
          {isQris ? (
            <div className="bg-white rounded-3xl p-5 border border-gray-200 text-center space-y-3 shadow-xs">
              <div className="flex items-center justify-center gap-2 text-xs font-black text-gray-900">
                <QrCode className="w-4 h-4 text-emerald-700" />
                <span>Scan QRIS Dengan Aplikasi E-Wallet / M-Banking</span>
              </div>

              {/* QR Canvas Container */}
              <div className="w-48 h-48 mx-auto bg-white p-3 border-2 border-gray-900 rounded-2xl shadow-sm flex flex-col items-center justify-center relative">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=ORGANIKSTORE-${orderNo}-${totalAmount}`}
                  alt="QRIS Code Pembayaran"
                  className="w-full h-full object-contain"
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
                  <ShieldCheck className="w-16 h-16 text-[#063104]" />
                </div>
              </div>

              <p className="text-[11px] text-gray-500 font-medium">
                Mendukung GoPay, OVO, ShopeePay, DANA, LinkAja, BCA, Mandiri, BRI, & seluruh QRIS Indonesia.
              </p>

              <button
                type="button"
                onClick={() => handleCopy(vaNumber, 'Kode QRIS')}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-extrabold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Gambar QR Code</span>
              </button>
            </div>
          ) : (
            /* Virtual Account View */
            <div className="bg-white rounded-3xl p-5 border border-gray-200 space-y-3 shadow-xs">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-700" />
                <div>
                  <h4 className="font-extrabold text-gray-900 text-xs">{paymentMethodName}</h4>
                  <span className="text-[10px] text-gray-500">Nomor Virtual Account Otomatis</span>
                </div>
              </div>

              <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 block uppercase">Nomor Virtual Account</span>
                  <span className="text-base font-mono font-black text-gray-900 tracking-wider">
                    {vaNumber}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy(vaNumber, 'Nomor Virtual Account')}
                  className="bg-[#063104] hover:bg-[#084205] text-white font-extrabold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin VA</span>
                </button>
              </div>
            </div>
          )}

          {/* Transfer Instructions Accordion */}
          <div className="space-y-2 pt-1">
            <span className="font-extrabold text-gray-900 text-xs block">Petunjuk Cara Pembayaran:</span>

            <div className="flex items-center gap-1.5 border-b border-gray-200 pb-2">
              {[
                { id: 'mbanking', label: 'm-Banking' },
                { id: 'atm', label: 'ATM' },
                { id: 'ewallet', label: 'E-Wallet' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveInstructionTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                    activeInstructionTab === tab.id
                      ? 'bg-[#063104] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-gray-600 pt-1 leading-relaxed pl-1">
              {activeInstructionTab === 'mbanking' && (
                <>
                  <li>Buka aplikasi Mobile Banking pilihan Anda (BCA mobile, Livin by Mandiri, GoPay, dll).</li>
                  <li>Pilih menu <strong>Transfer ➔ Virtual Account / QRIS</strong>.</li>
                  <li>Masukkan nomor Virtual Account <strong className="text-gray-900">{vaNumber}</strong> atau scan QRIS.</li>
                  <li>Periksa detail nama akun <strong>OrganikStore</strong> dan nominal Rp {totalAmount.toLocaleString('id-ID')}.</li>
                  <li>Masukkan PIN M-Banking Anda dan konfirmasi pembayaran.</li>
                </>
              )}

              {activeInstructionTab === 'atm' && (
                <>
                  <li>Masukkan kartu ATM dan PIN Anda di mesin ATM terdekat.</li>
                  <li>Pilih menu <strong>Transaksi Lainnya ➔ Transfer ➔ Ke Rekening Virtual Account</strong>.</li>
                  <li>Masukkan nomor Virtual Account <strong className="text-gray-900">{vaNumber}</strong>.</li>
                  <li>Konfirmasi detail pesanan dan tekan <strong>Ya / Benar</strong>.</li>
                  <li>Simpan struk transaksi sebagai bukti pembayaran sah.</li>
                </>
              )}

              {activeInstructionTab === 'ewallet' && (
                <>
                  <li>Buka aplikasi GoPay, OVO, ShopeePay, atau DANA.</li>
                  <li>Pilih menu <strong>Pay / Scan QRIS</strong>.</li>
                  <li>Arahkan kamera ke QRIS atau tempelkan nomor VA <strong className="text-gray-900">{vaNumber}</strong>.</li>
                  <li>Konfirmasi jumlah pembayaran dan selesaikan dengan PIN E-Wallet.</li>
                </>
              )}
            </ol>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100 bg-[#F9F8F6] flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full bg-white hover:bg-gray-100 text-gray-800 font-bold py-3 rounded-2xl text-xs border border-gray-200 transition-colors"
          >
            Nanti Saja
          </button>

          <button
            type="button"
            onClick={() => {
              if (onPaymentConfirmed) onPaymentConfirmed();
              onClose();
            }}
            className="w-full bg-[#063104] hover:bg-[#084205] text-white font-extrabold py-3 rounded-2xl text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 stroke-[3]" />
            <span>Saya Sudah Bayar</span>
          </button>
        </div>
      </div>

      <Snackbar
        open={!!copiedText}
        autoHideDuration={2500}
        onClose={() => setCopiedText(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" variant="filled" sx={{ backgroundColor: '#063104', color: '#fff', borderRadius: '12px' }}>
          {copiedText}
        </Alert>
      </Snackbar>
    </div>
  );
};

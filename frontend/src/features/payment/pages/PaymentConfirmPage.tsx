import React, { useEffect, useState } from 'react';
import {
  Copy,
  Clock,
  QrCode,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  X,
  ChevronDown,
  ChevronUp,
  Download,
} from 'lucide-react';
import { usePembayaranStore } from '../store/usePembayaranStore';

interface PaymentConfirmPageProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: () => void;
}

export const PaymentConfirmPage: React.FC<PaymentConfirmPageProps> = ({
  isOpen,
  onClose,
  onPaymentSuccess,
}) => {
  const { activePayment, checkStatus } = usePembayaranStore();
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isChecking, setIsChecking] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);

  // Auto-polling status every 5s when modal is open
  useEffect(() => {
    if (!isOpen || !activePayment?.merchantOrderId) return;

    const interval = setInterval(async () => {
      const res = await checkStatus(activePayment.merchantOrderId);
      if (res && res.statusCode === '00') {
        onPaymentSuccess();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isOpen, activePayment?.merchantOrderId, checkStatus, onPaymentSuccess]);

  // Dynamic countdown timer logic based on activePayment linkExpiry & expiryPeriod
  useEffect(() => {
    if (!isOpen || !activePayment) return;

    const computeTimeLeft = () => {
      let expiryTime = 0;
      if (activePayment.linkExpiry) {
        expiryTime = new Date(activePayment.linkExpiry).getTime();
      } else if (activePayment.createdAt) {
        const created = new Date(activePayment.createdAt).getTime();
        const mins = activePayment.expiryPeriod || 1440;
        expiryTime = created + mins * 60 * 1000;
      } else {
        expiryTime = Date.now() + 24 * 3600 * 1000;
      }
      const diff = Math.floor((expiryTime - Date.now()) / 1000);
      return diff > 0 ? diff : 0;
    };

    setTimeLeft(computeTimeLeft());

    const timer = setInterval(() => {
      const remaining = computeTimeLeft();
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        checkStatus(activePayment.merchantOrderId);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, activePayment, checkStatus]);

  if (!isOpen || !activePayment) return null;

  const handleDownloadQR = async (qrString: string) => {
    try {
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qrString)}`;
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `qris-${activePayment.merchantOrderId}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Failed to download QR image:', err);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleManualCheck = async () => {
    setIsChecking(true);
    const res = await checkStatus(activePayment.merchantOrderId);
    setIsChecking(false);
    if (res && res.statusCode === '00') {
      onPaymentSuccess();
    }
  };

  const formatTimer = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formattedAmount = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(activePayment.paymentAmount);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-100">
        {/* Top Gradient Header */}
        <div className="bg-[#063104] text-white p-5 sm:p-6 relative overflow-hidden">
          <div className="flex items-center justify-between z-10 relative">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <span className="text-xs text-emerald-200 font-bold tracking-wider uppercase">Konfirmasi Pembayaran</span>
                <h3 className="text-base font-extrabold text-white">Ref: #{activePayment.merchantOrderId}</h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Timer Display */}
          <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-emerald-100">
              <Clock className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>Selesaikan Pembayaran Dalam:</span>
            </div>
            <span className="font-mono text-sm font-black bg-white/15 px-3 py-1 rounded-xl text-amber-300">
              {formatTimer(timeLeft)}
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Amount Card */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Total Pembayaran</p>
              <p className="text-2xl font-black text-[#063104] mt-0.5">{formattedAmount}</p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                Menunggu Pembayaran
              </span>
            </div>
          </div>

          {/* Virtual Account Display */}
          {activePayment.vaNumber && (
            <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-5 text-center space-y-3 shadow-xs">
              <span className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider block">
                Nomor Virtual Account ({activePayment.paymentMethod})
              </span>
              <div className="flex items-center justify-center gap-3">
                <span className="font-mono text-2xl sm:text-3xl font-black tracking-wider text-slate-900 select-all">
                  {activePayment.vaNumber}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(activePayment.vaNumber!)}
                  className="px-3 py-2 bg-white hover:bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-extrabold rounded-xl shadow-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied ? 'Tersalin!' : 'Salin Nomor'}</span>
                </button>
              </div>
              <p className="text-xs text-emerald-700">
                Gunakan nomor VA di atas pada aplikasi M-Banking atau ATM Anda.
              </p>
            </div>
          )}

          {/* QRIS Display */}
          {activePayment.qrString && (
            <div className="bg-[#FAF9F6] border border-slate-200/90 rounded-2xl p-5 text-center space-y-3.5 shadow-xs">
              <div className="flex items-center justify-center gap-2 text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                <QrCode className="w-4 h-4 text-rose-600" />
                <span>Kode QRIS Pembayaran</span>
              </div>
              <div className="bg-white p-3.5 rounded-2xl inline-block border border-slate-200 shadow-sm">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
                    activePayment.qrString
                  )}`}
                  alt="QRIS Payment Code"
                  className="w-48 h-48 mx-auto object-contain rounded-xl"
                />
              </div>
              <div className="flex items-center justify-center gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => handleDownloadQR(activePayment.qrString!)}
                  className="px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs font-extrabold rounded-xl shadow-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-rose-600" />
                  <span>Download QRIS</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto leading-relaxed">
                Scan kode QRIS di atas menggunakan aplikasi M-Banking atau E-Wallet pilihan Anda (GoPay, OVO, ShopeePay, DANA, BCA Mobile, dll).
              </p>
            </div>
          )}

          {/* Direct Payment Link / E-Wallet / CC */}
          {activePayment.paymentUrl && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-blue-900">Pembayaran via Portal Duitku</p>
                <p className="text-[11px] text-blue-700">Lanjutkan pembayaran di halaman resmi bank/e-wallet</p>
              </div>
              <a
                href={activePayment.paymentUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-sm"
              >
                <span>Buka Link</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {/* Interactive Instructions Accordion */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowInstructions(!showInstructions)}
              className="w-full p-4 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs font-extrabold text-slate-700 transition-colors"
            >
              <span>Petunjuk Cara Pembayaran</span>
              {showInstructions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showInstructions && (
              <div className="p-4 bg-white text-xs text-slate-600 space-y-2 border-t border-slate-100">
                <ol className="list-decimal list-inside space-y-1.5 leading-relaxed">
                  <li>Buka aplikasi Mobile Banking / E-Wallet Anda.</li>
                  <li>Pilih menu <strong className="text-slate-800">Transfer / Pembayaran Virtual Account / QRIS</strong>.</li>
                  <li>Masukkan nomor VA atau scan kode QR yang tertera di atas.</li>
                  <li>Pastikan nama tagihan dan total nominal sesuai sebesar <strong className="text-[#063104]">{formattedAmount}</strong>.</li>
                  <li>Selesaikan transaksi. Status pembayaran di sistem akan ter-update otomatis dalam 5-10 detik.</li>
                </ol>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleManualCheck}
            disabled={isChecking}
            className="px-4 py-2.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-2xl text-xs font-extrabold flex items-center gap-2 shadow-xs transition-all active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
            <span>{isChecking ? 'Mengecek...' : 'Cek Status Pembayaran'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-2xl text-xs font-bold"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

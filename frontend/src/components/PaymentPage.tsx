import React, { useEffect, useState } from 'react';
import {
  CreditCard,
  Building2,
  Wallet,
  QrCode,
  Store,
  Clock,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  AlertCircle,
  Loader2,
  X,
} from 'lucide-react';
import { usePembayaranStore, type DuitkuPaymentMethod } from '../store/usePembayaranStore';

interface PaymentPageProps {
  isOpen: boolean;
  onClose: () => void;
  orderData: {
    orderId?: string;
    totalAmount: number;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    productDetails?: string;
    storeId?: string;
    items?: any[];
    shippingAddress?: string;
  };
  onSuccess?: () => void;
}

export const PaymentPage: React.FC<PaymentPageProps> = ({
  isOpen,
  onClose,
  orderData,
  onSuccess,
}) => {
  const {
    paymentMethods,
    isLoadingMethods,
    methodsError,
    fetchPaymentMethods,
    createPayment,
    isCreatingPayment,
    createError,
  } = usePembayaranStore();

  const [selectedCode, setSelectedCode] = useState<string>('');
  const [selectedMethodObj, setSelectedMethodObj] = useState<DuitkuPaymentMethod | null>(null);

  useEffect(() => {
    if (isOpen && orderData.totalAmount > 0) {
      fetchPaymentMethods(orderData.totalAmount);
    }
  }, [isOpen, orderData.totalAmount, fetchPaymentMethods]);

  if (!isOpen) return null;

  // Group payment methods by category
  const categorizeMethod = (code: string) => {
    const vaCodes = ['BC', 'M2', 'VA', 'I1', 'B1', 'BT', 'A1', 'AG', 'NC', 'BR', 'S1', 'DM', 'BV'];
    const ewalletCodes = ['OV', 'SA', 'LF', 'LA', 'DA', 'SL', 'OL'];
    const qrisCodes = ['SP', 'NQ', 'GQ', 'SQ'];
    const ritelCodes = ['FT', 'IR'];
    const paylaterCodes = ['DN', 'AT'];

    if (vaCodes.includes(code)) return 'Virtual Account';
    if (ewalletCodes.includes(code)) return 'E-Wallet';
    if (qrisCodes.includes(code)) return 'QRIS';
    if (ritelCodes.includes(code)) return 'Gerai Ritel';
    if (paylaterCodes.includes(code)) return 'PayLater';
    if (code === 'VC') return 'Kartu Kredit';
    return 'Lainnya';
  };

  const categories = Array.from(
    new Set(paymentMethods.map((m) => categorizeMethod(m.paymentMethod)))
  );

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Virtual Account':
        return <Building2 className="w-5 h-5 text-emerald-600" />;
      case 'E-Wallet':
        return <Wallet className="w-5 h-5 text-blue-600" />;
      case 'QRIS':
        return <QrCode className="w-5 h-5 text-rose-600" />;
      case 'Kartu Kredit':
        return <CreditCard className="w-5 h-5 text-purple-600" />;
      case 'Gerai Ritel':
        return <Store className="w-5 h-5 text-amber-600" />;
      default:
        return <Clock className="w-5 h-5 text-slate-600" />;
    }
  };

  const handleProcessPayment = async () => {
    if (!selectedCode) return;

    const res = await createPayment({
      orderId: orderData.orderId,
      paymentMethod: selectedCode,
      paymentAmount: orderData.totalAmount,
      customerName: orderData.customerName,
      customerEmail: orderData.customerEmail,
      customerPhone: orderData.customerPhone,
      productDetails: orderData.productDetails || 'Pembayaran OrganikStore',
      storeId: orderData.storeId,
      items: orderData.items,
      shippingAddress: orderData.shippingAddress,
    });

    if (res && onSuccess) {
      onSuccess();
    }
  };

  const formattedTotal = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(orderData.totalAmount);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-100">
        {/* Header */}
        <div className="bg-[#063104] text-white p-5 sm:p-6 flex items-center justify-between relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-3 z-10">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Pilih Pembayaran Custom</h2>
              <p className="text-xs text-emerald-200/80">Terintegrasi Aman via Duitku Payment Gateway</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Amount Banner */}
        <div className="bg-emerald-50 border-b border-emerald-100 p-4 px-6 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Total Tagihan</span>
            <p className="text-2xl font-black text-[#063104]">{formattedTotal}</p>
          </div>
          <div className="text-right">
            <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full font-bold">
              Koneksi Enkripsi SSL
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {isLoadingMethods ? (
            <div className="py-16 text-center flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-[#063104] animate-spin" />
              <p className="text-sm font-semibold text-slate-600">Memuat saluran pembayaran resmi Duitku...</p>
            </div>
          ) : methodsError ? (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>{methodsError}</p>
            </div>
          ) : (
            categories.map((cat) => {
              const methodsInCat = paymentMethods.filter(
                (m) => categorizeMethod(m.paymentMethod) === cat
              );
              if (methodsInCat.length === 0) return null;

              return (
                <div key={cat} className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                    {getCategoryIcon(cat)}
                    <span>{cat}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {methodsInCat.map((m) => {
                      const isSelected = selectedCode === m.paymentMethod;
                      const feeText = parseInt(m.totalFee) > 0 ? `+ Rp ${parseInt(m.totalFee).toLocaleString('id-ID')}` : 'Bebas Biaya Admin';

                      return (
                        <button
                          key={m.paymentMethod}
                          type="button"
                          onClick={() => {
                            setSelectedCode(m.paymentMethod);
                            setSelectedMethodObj(m);
                          }}
                          className={`p-3.5 rounded-2xl border transition-all text-left flex items-center justify-between gap-3 group relative ${
                            isSelected
                              ? 'border-[#063104] bg-emerald-50/50 shadow-md ring-2 ring-[#063104]/20'
                              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-12 h-10 rounded-xl bg-white border border-slate-100 p-1 flex items-center justify-center shrink-0 shadow-xs">
                              {m.paymentImage ? (
                                <img
                                  src={m.paymentImage}
                                  alt={m.paymentName}
                                  className="max-h-full max-w-full object-contain"
                                />
                              ) : (
                                <Building2 className="w-5 h-5 text-slate-400" />
                              )}
                            </div>
                            <div className="truncate">
                              <p className="text-xs font-bold text-slate-800 truncate">{m.paymentName}</p>
                              <p className="text-[11px] font-medium text-emerald-700 mt-0.5">{feeText}</p>
                            </div>
                          </div>
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                            isSelected ? 'border-[#063104] bg-[#063104]' : 'border-slate-300'
                          }`}>
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}

          {createError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{createError}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between gap-4">
          <div className="text-xs text-slate-500">
            {selectedMethodObj ? (
              <span className="font-semibold text-slate-700">Metode: {selectedMethodObj.paymentName}</span>
            ) : (
              'Pilih 1 metode pembayaran'
            )}
          </div>

          <button
            type="button"
            disabled={!selectedCode || isCreatingPayment}
            onClick={handleProcessPayment}
            className="px-6 py-3 bg-[#063104] hover:bg-[#084205] disabled:opacity-50 text-white rounded-2xl font-extrabold text-sm flex items-center gap-2 shadow-lg shadow-emerald-900/20 transition-all active:scale-[0.98]"
          >
            {isCreatingPayment ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <span>Bayar Sekarang</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

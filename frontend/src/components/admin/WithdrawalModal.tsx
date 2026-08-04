import React, { useState } from 'react';
import { X, Wallet, ShieldCheck, ArrowRight, AlertCircle, Building2 } from 'lucide-react';
import { useWalletStore } from '../../store/useWalletStore';
import { ProcessingOverlay } from '../common/ProcessingOverlay';

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeBalance: number;
  currentBankName: string;
  currentAccountNumber: string;
  currentAccountHolder: string;
  storeId?: string;
}

const BANK_OPTIONS = [
  { code: 'BCA', name: 'Bank Central Asia (BCA)' },
  { code: 'MANDIRI', name: 'Bank Mandiri' },
  { code: 'BRI', name: 'Bank Rakyat Indonesia (BRI)' },
  { code: 'BNI', name: 'Bank Negara Indonesia (BNI)' },
  { code: 'CIMB', name: 'CIMB Niaga' },
  { code: 'PERMATA', name: 'Bank Permata' },
  { code: 'DANAMON', name: 'Bank Danamon' },
];

export const WithdrawalModal: React.FC<WithdrawalModalProps> = ({
  isOpen,
  onClose,
  activeBalance,
  currentBankName,
  currentAccountNumber,
  currentAccountHolder,
  storeId,
}) => {
  const { requestWithdrawal, isSubmitting } = useWalletStore();

  const [amount, setAmount] = useState<number | ''>(500000);
  const [bankCode, setBankCode] = useState(currentBankName || 'BCA');
  const [accountNumber, setAccountNumber] = useState(currentAccountNumber || '');
  const [accountHolder, setAccountHolder] = useState(currentAccountHolder || '');
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const numAmount = typeof amount === 'number' ? amount : 0;
  const fee = 5000;
  const netAmount = Math.max(0, numAmount - fee);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (numAmount < 50000) {
      setFormError('Nominal penarikan minimal adalah Rp 50.000');
      return;
    }

    if (numAmount > activeBalance) {
      setFormError(`Saldo tidak mencukupi. Saldo aktif Anda: Rp ${activeBalance.toLocaleString('id-ID')}`);
      return;
    }

    if (!accountNumber.trim() || !accountHolder.trim()) {
      setFormError('Nomor rekening dan nama pemilik rekening wajib diisi.');
      return;
    }

    const success = await requestWithdrawal(
      numAmount,
      {
        bankName: bankCode,
        bankAccountNumber: accountNumber.trim(),
        bankAccountHolder: accountHolder.trim(),
      },
      storeId
    );

    if (success) {
      onClose();
    }
  };

  return (
    <>
      <ProcessingOverlay
        isOpen={isSubmitting}
        title="Memproses Penarikan Dana..."
        subtitle="Mengirimkan permintaan disbursement secara aman ke Gateway Duitku."
      />

      <div
        className="fixed inset-0 z-[3000] bg-black/60 flex items-center justify-center p-4 overflow-y-auto animate-fade-in"
        style={{ backdropFilter: 'blur(4px)' }}
      >
        <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-gray-100 flex flex-col my-auto">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-[#F9F8F6]">
            <div className="flex items-center gap-2 text-[#063104]">
              <Wallet className="w-5 h-5" />
              <h3 className="font-extrabold text-gray-900 text-lg">Tarik Dana Ke Rekening</h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-gray-200/80 text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Active Balance Banner */}
            <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="block text-[11px] font-extrabold text-[#063104] uppercase tracking-wider">
                  Saldo Aktif Siap Tarik
                </span>
                <span className="text-xl font-black text-[#063104]">
                  Rp {activeBalance.toLocaleString('id-ID')}
                </span>
              </div>
              <ShieldCheck className="w-8 h-8 text-emerald-600 opacity-75" />
            </div>

            {/* Input Nominal Penarikan */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Nominal Penarikan (Rp) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min={50000}
                max={activeBalance}
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="500000"
                className="w-full bg-white text-base font-extrabold rounded-xl px-4 py-3 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#063104]/20 focus:border-[#063104]"
              />
              <div className="flex gap-2 mt-2">
                {[100000, 250000, 500000, 1000000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAmount(preset <= activeBalance ? preset : activeBalance)}
                    className="text-[10px] font-bold text-[#063104] bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200/60 transition-colors"
                  >
                    Rp {(preset / 1000).toFixed(0)}k
                  </button>
                ))}
              </div>
            </div>

            {/* Rekening Tujuan Section */}
            <div className="space-y-3 pt-1 border-t border-gray-100">
              <span className="block text-xs font-extrabold text-gray-900 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-[#063104]" /> Rekening Bank Tujuan Pencairan
              </span>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">Pilih Bank</label>
                <select
                  value={bankCode}
                  onChange={(e) => setBankCode(e.target.value)}
                  className="w-full bg-white text-xs font-bold rounded-xl px-3.5 py-2.5 border border-gray-200 focus:outline-none focus:border-[#063104]"
                >
                  {BANK_OPTIONS.map((b) => (
                    <option key={b.code} value={b.code}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">No. Rekening</label>
                  <input
                    type="text"
                    required
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="e.g. 8820194819"
                    className="w-full bg-white text-xs font-semibold rounded-xl px-3 py-2 border border-gray-200 focus:outline-none focus:border-[#063104]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">Nama Pemilik</label>
                  <input
                    type="text"
                    required
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value)}
                    placeholder="e.g. Toko Sayur Organik"
                    className="w-full bg-white text-xs font-semibold rounded-xl px-3 py-2 border border-gray-200 focus:outline-none focus:border-[#063104]"
                  />
                </div>
              </div>
            </div>

            {/* Breakdown Rincian Fee */}
            <div className="bg-gray-50 rounded-2xl p-3.5 border border-gray-200/80 space-y-1.5 text-xs">
              <span className="font-extrabold text-gray-900 block text-[11px] uppercase tracking-wider mb-1">
                💡 Ringkasan Transfer:
              </span>
              <div className="flex justify-between text-gray-600">
                <span>Nominal Ditarik:</span>
                <span className="font-bold text-gray-800">Rp {numAmount.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Biaya Disbursement Duitku:</span>
                <span className="font-bold text-red-600">- Rp {fee.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-gray-900 pt-1 border-t border-gray-200 font-extrabold text-sm">
                <span>Total Bersih Diterima:</span>
                <span className="text-[#063104]">Rp {netAmount.toLocaleString('id-ID')}</span>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 font-bold px-5 py-2.5 rounded-xl text-xs transition-all cursor-pointer"
              >
                Batal
              </button>

              <button
                type="submit"
                className="bg-[#063104] hover:bg-[#084205] text-white font-extrabold px-6 py-2.5 rounded-xl text-xs shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
              >
                <span>Konfirmasi Penarikan</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

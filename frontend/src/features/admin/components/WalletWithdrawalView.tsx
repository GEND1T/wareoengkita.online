import React, { useEffect, useState } from 'react';
import {
  Wallet,
  Building2,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Edit3,
  Check,
  CreditCard,
  PlusCircle,
} from 'lucide-react';
import { useWalletStore } from '../../../store/useWalletStore';
import { useUserStore } from '../../auth/store/useUserStore';
import { useStoreSelectorStore } from '../../store-location/store/useStoreSelectorStore';
import { WithdrawalModal } from './WithdrawalModal';

export const WalletWithdrawalView: React.FC = () => {
  const { profile } = useUserStore();
  const { selectedStoreId } = useStoreSelectorStore();
  const storeId = profile.assignedStoreId || selectedStoreId || 'store-1';

  const {
    activeBalance,
    bankName,
    bankAccountNumber,
    bankAccountHolder,
    mutations,
    withdrawals,
    isLoading,
    fetchWalletData,
    updateBankDetails,
    toastMessage,
    errorMessage,
    clearToast,
  } = useWalletStore();

  const [activeTab, setActiveTab] = useState<'mutations' | 'withdrawals'>('mutations');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditingBank, setIsEditingBank] = useState(false);

  const [editBankName, setEditBankName] = useState(bankName);
  const [editAccountNumber, setEditAccountNumber] = useState(bankAccountNumber);
  const [editAccountHolder, setEditAccountHolder] = useState(bankAccountHolder);

  useEffect(() => {
    fetchWalletData(storeId);
  }, [storeId]);

  useEffect(() => {
    setEditBankName(bankName);
    setEditAccountNumber(bankAccountNumber);
    setEditAccountHolder(bankAccountHolder);
  }, [bankName, bankAccountNumber, bankAccountHolder]);

  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await updateBankDetails(
      {
        bankName: editBankName,
        bankAccountNumber: editAccountNumber,
        bankAccountHolder: editAccountHolder,
      },
      storeId
    );
    if (success) {
      setIsEditingBank(false);
    }
  };

  const totalWithdrawn = withdrawals
    .filter((w) => w.status === 'SUCCESS')
    .reduce((sum, w) => sum + w.netAmount, 0);

  const pendingWithdrawal = withdrawals.find((w) => w.status === 'PENDING');

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="bg-emerald-600 text-white px-4 py-3 rounded-2xl text-xs font-bold flex items-center justify-between shadow-lg animate-fade-in">
          <span>{toastMessage}</span>
          <button type="button" onClick={clearToast} className="text-white hover:opacity-80">
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-600 text-white px-4 py-3 rounded-2xl text-xs font-bold flex items-center justify-between shadow-lg animate-fade-in">
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#063104] to-[#0d530b] rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="w-6 h-6 text-emerald-400" />
            <h2 className="text-xl font-extrabold">Dompet & Pencairan Dana Penjual</h2>
          </div>
          <p className="text-emerald-200/90 text-xs font-medium max-w-xl">
            Kelola penghasilan toko dari pesanan yang dikonfirmasi selesai oleh pembeli, lakukan penarikan dana otomatis via Duitku Disbursement, dan pantau notifikasi WhatsApp.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchWalletData(storeId)}
          className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 self-start md:self-auto transition-all cursor-pointer active:scale-95"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Top 2 Cards: Saldo & Rekening */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Card 1: Saldo Aktif */}
        <div className="md:col-span-6 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-[#063104] uppercase tracking-wider">
                Saldo Aktif Siap Tarik
              </span>
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-gray-900 leading-none">
                Rp {activeBalance.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-3">
            <div className="text-[11px] text-gray-500">
              <span>Min. Penarikan: </span>
              <span className="font-bold text-gray-800">Rp 50.000</span>
            </div>

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              disabled={activeBalance < 50000}
              className={`px-5 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-md transition-all cursor-pointer active:scale-95 ${
                activeBalance >= 50000
                  ? 'bg-[#063104] hover:bg-[#084205] text-white'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Tarik Dana Sekarang</span>
            </button>
          </div>
        </div>

        {/* Card 2: Rekening Bank Pencairan */}
        <div className="md:col-span-6 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#063104]" />
              <span className="text-xs font-extrabold text-[#063104] uppercase tracking-wider">
                Rekening Bank Pencairan (Duitku)
              </span>
            </div>

            {!isEditingBank && (
              <button
                type="button"
                onClick={() => setIsEditingBank(true)}
                className="text-xs font-bold text-[#063104] hover:underline flex items-center gap-1"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            )}
          </div>

          {isEditingBank ? (
            <form onSubmit={handleSaveBank} className="space-y-3 pt-1">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-1">Bank</label>
                  <select
                    value={editBankName}
                    onChange={(e) => setEditBankName(e.target.value)}
                    className="w-full bg-white text-xs font-bold rounded-xl px-2.5 py-1.5 border border-gray-200"
                  >
                    <option value="BCA">BCA</option>
                    <option value="MANDIRI">MANDIRI</option>
                    <option value="BRI">BRI</option>
                    <option value="BNI">BNI</option>
                    <option value="CIMB">CIMB</option>
                    <option value="PERMATA">PERMATA</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-1">No. Rekening</label>
                  <input
                    type="text"
                    required
                    value={editAccountNumber}
                    onChange={(e) => setEditAccountNumber(e.target.value)}
                    className="w-full bg-white text-xs rounded-xl px-2.5 py-1.5 border border-gray-200"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-1">Atas Nama</label>
                  <input
                    type="text"
                    required
                    value={editAccountHolder}
                    onChange={(e) => setEditAccountHolder(e.target.value)}
                    className="w-full bg-white text-xs rounded-xl px-2.5 py-1.5 border border-gray-200"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsEditingBank(false)}
                  className="px-3 py-1 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 text-xs font-bold bg-[#063104] text-white rounded-lg flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Simpan</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="bg-gray-50 rounded-2xl p-3.5 border border-gray-200/80 flex items-center justify-between">
              <div>
                <span className="text-xs font-black text-gray-900 uppercase">
                  {bankName} — {bankAccountNumber}
                </span>
                <p className="text-xs text-gray-500 font-medium">a.n. {bankAccountHolder}</p>
              </div>
              <CreditCard className="w-6 h-6 text-gray-400" />
            </div>
          )}

          {/* Quick Info Summary */}
          <div className="flex items-center justify-between text-xs pt-1">
            <div className="text-gray-500">
              <span>Total Telah Ditarik: </span>
              <span className="font-bold text-emerald-700">
                Rp {totalWithdrawn.toLocaleString('id-ID')}
              </span>
            </div>
            {pendingWithdrawal && (
              <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Clock className="w-3 h-3" /> 1 Transaksi Pending
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('mutations')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'mutations'
                ? 'bg-[#063104] text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Riwayat Mutasi Saldo ({mutations.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('withdrawals')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'withdrawals'
                ? 'bg-[#063104] text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Status Penarikan Dana ({withdrawals.length})
          </button>
        </div>

        {/* TAB 1: MUTASI SALDO */}
        {activeTab === 'mutations' && (
          <div className="overflow-x-auto">
            {mutations.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-xs">
                Belum ada mutasi saldo tercatat. Mutasi akan otomatis bertambah dari pesanan yang selesai dikonfirmasi pembeli.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">
                    <th className="py-3 px-3">Waktu</th>
                    <th className="py-3 px-3">Jenis</th>
                    <th className="py-3 px-3">Deskripsi / Ref</th>
                    <th className="py-3 px-3 text-right">Nominal</th>
                    <th className="py-3 px-3 text-right">Saldo Setelah</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {mutations.map((m) => (
                    <tr key={m.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3.5 px-3 text-gray-500 font-medium">
                        {new Date(m.createdAt).toLocaleString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3.5 px-3">
                        {m.type === 'CREDIT' && (
                          <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-black px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                            <ArrowDownLeft className="w-3 h-3" /> MASUK
                          </span>
                        )}
                        {m.type === 'DEBIT' && (
                          <span className="bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-black px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                            <ArrowUpRight className="w-3 h-3" /> PENARIKAN
                          </span>
                        )}
                        {m.type === 'REFUND' && (
                          <span className="bg-blue-50 text-blue-900 border border-blue-200 text-[10px] font-black px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                            <RefreshCw className="w-3 h-3" /> REFUND
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-gray-800">{m.description}</td>
                      <td
                        className={`py-3.5 px-3 text-right font-extrabold ${
                          m.type === 'CREDIT' || m.type === 'REFUND'
                            ? 'text-emerald-700'
                            : 'text-red-600'
                        }`}
                      >
                        {m.type === 'CREDIT' || m.type === 'REFUND' ? '+' : '-'} Rp{' '}
                        {m.amount.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3.5 px-3 text-right font-bold text-gray-900">
                        Rp {m.balanceAfter.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* TAB 2: RIWAYAT PENARIKAN DANA */}
        {activeTab === 'withdrawals' && (
          <div className="overflow-x-auto">
            {withdrawals.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-xs">
                Belum ada pengajuan penarikan dana. Klik tombol "Tarik Dana Sekarang" di atas untuk mencairkan saldo.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">
                    <th className="py-3 px-3">No. Penarikan</th>
                    <th className="py-3 px-3">Waktu</th>
                    <th className="py-3 px-3">Bank Tujuan</th>
                    <th className="py-3 px-3 text-right">Kotor</th>
                    <th className="py-3 px-3 text-right">Fee Duitku</th>
                    <th className="py-3 px-3 text-right">Bersih Diterima</th>
                    <th className="py-3 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {withdrawals.map((w) => (
                    <tr key={w.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3.5 px-3 font-mono font-extrabold text-[#063104]">
                        {w.withdrawalNo}
                      </td>
                      <td className="py-3.5 px-3 text-gray-500 font-medium">
                        {new Date(w.createdAt).toLocaleString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3.5 px-3 font-bold text-gray-800">
                        {w.bankCode} ({w.accountNumber})
                        <span className="block text-[10px] text-gray-400 font-normal">
                          a.n. {w.accountHolder}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right font-bold text-gray-800">
                        Rp {w.amount.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3.5 px-3 text-right font-semibold text-red-600">
                        - Rp {w.disbursementFee.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3.5 px-3 text-right font-extrabold text-[#063104]">
                        Rp {w.netAmount.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        {w.status === 'PENDING' && (
                          <span className="bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-extrabold px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-600" /> PENDING
                          </span>
                        )}
                        {w.status === 'SUCCESS' && (
                          <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-extrabold px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> BERHASIL
                          </span>
                        )}
                        {w.status === 'FAILED' && (
                          <span
                            className="bg-red-50 text-red-800 border border-red-200 text-[10px] font-extrabold px-2.5 py-1 rounded-full inline-flex items-center gap-1"
                            title={w.failureReason || 'Gagal'}
                          >
                            <XCircle className="w-3 h-3 text-red-600" /> GAGAL
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Modal Dialog */}
      <WithdrawalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        activeBalance={activeBalance}
        currentBankName={bankName}
        currentAccountNumber={bankAccountNumber}
        currentAccountHolder={bankAccountHolder}
        storeId={storeId}
      />
    </div>
  );
};

import React, { useState } from 'react';
import {
  CreditCard,
  Plus,
  Pencil,
  Trash2,
  X,
  Sparkles,
  QrCode,
  Building2,
  Banknote,
} from 'lucide-react';
import { useAdminStore } from '../../store/useAdminStore';
import { useUserStore } from '../../store/useUserStore';
import type { PaymentOptionAdmin } from '../../types';
import { TableSkeleton } from '../common/AdminSkeletons';

export const PaymentView: React.FC = () => {
  const { profile } = useUserStore();
  const {
    paymentMethods,
    togglePaymentStatus,
    addPaymentOption,
    updatePaymentOption,
    deletePaymentOption,
    isLoadingData,
  } = useAdminStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paymentToEdit, setPaymentToEdit] = useState<PaymentOptionAdmin | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [iconType, setIconType] = useState<'qris' | 'bca' | 'mandiri' | 'cod' | 'cc'>('qris');

  const handleOpenAdd = () => {
    setPaymentToEdit(null);
    setName('');
    setCategory('');
    setIconType('qris');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (method: PaymentOptionAdmin) => {
    setPaymentToEdit(method);
    setName(method.name);
    setCategory(method.category);
    setIconType(method.iconType);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, methodName: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus metode pembayaran "${methodName}"?`)) {
      deletePaymentOption(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const data = {
      name: name.trim(),
      category: category.trim() || 'Pembayaran Instan',
      iconType,
      isActive: paymentToEdit ? paymentToEdit.isActive : true,
    };

    if (paymentToEdit) {
      updatePaymentOption(paymentToEdit.id, data);
    } else {
      addPaymentOption(data, profile.assignedStoreId);
    }

    setIsModalOpen(false);
  };

  const renderIcon = (type: string) => {
    switch (type) {
      case 'qris':
        return <QrCode className="w-5 h-5 text-emerald-700" />;
      case 'bca':
        return <Building2 className="w-5 h-5 text-blue-700" />;
      case 'mandiri':
        return <Building2 className="w-5 h-5 text-indigo-700" />;
      case 'cod':
        return <Banknote className="w-5 h-5 text-amber-700" />;
      case 'cc':
      default:
        return <CreditCard className="w-5 h-5 text-[#063104]" />;
    }
  };

  if (isLoadingData) {
    return <TableSkeleton rows={5} />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title & Top Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Metode Pembayaran</h1>
          <p className="text-xs text-gray-500">
            Kelola pilihan metode transaksi pembayaran yang diterima di toko untuk pembeli saat checkout.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="bg-[#063104] hover:bg-[#084205] text-white font-extrabold px-4.5 py-3 rounded-2xl text-xs shadow-lg hover:shadow-emerald-900/20 transition-all duration-200 flex items-center gap-2.5 shrink-0 active:scale-95 border border-emerald-900/30 cursor-pointer self-start sm:self-auto"
        >
          <div className="w-5 h-5 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
          </div>
          <span>Tambah Metode Pembayaran</span>
        </button>
      </div>

      {/* Payment Options Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F9F8F6] text-gray-700 text-xs font-extrabold uppercase border-b border-gray-200/80">
                <th className="py-3.5 px-4 w-14">Icon</th>
                <th className="py-3.5 px-4">Nama Metode Pembayaran</th>
                <th className="py-3.5 px-4">Kategori / Provider</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 text-xs">
              {paymentMethods.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400">
                    Belum ada metode pembayaran. Klik "Tambah Metode Pembayaran" untuk menambah.
                  </td>
                </tr>
              ) : (
                paymentMethods.map((method) => (
                  <tr key={method.id} className="hover:bg-emerald-50/30 transition-colors">
                    {/* Icon */}
                    <td className="py-3.5 px-4">
                      <div className="p-2 rounded-xl bg-gray-50 border border-gray-200/80 w-fit">
                        {renderIcon(method.iconType)}
                      </div>
                    </td>

                    {/* Nama Metode */}
                    <td className="py-3.5 px-4 font-extrabold text-gray-900">
                      {method.name}
                    </td>

                    {/* Kategori / Provider */}
                    <td className="py-3.5 px-4 text-gray-600 font-medium">
                      {method.category}
                    </td>

                    {/* Status Toggle */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => togglePaymentStatus(method.id)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          method.isActive ? 'bg-[#063104]' : 'bg-gray-300'
                        }`}
                        title={method.isActive ? 'Klik untuk nonaktifkan' : 'Klik untuk aktifkan'}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                            method.isActive ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                      <span className="block text-[10px] font-bold text-gray-500 mt-0.5">
                        {method.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>

                    {/* Aksi */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(method)}
                          className="p-1.5 rounded-lg bg-gray-100 hover:bg-[#063104] hover:text-white text-gray-700 transition-colors"
                          title="Edit Metode Pembayaran"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(method.id, method.name)}
                          className="p-1.5 rounded-lg bg-gray-100 hover:bg-red-600 hover:text-white text-gray-700 transition-colors"
                          title="Hapus Metode"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* Modal Add/Edit Payment Option */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-[3000] bg-black/60 flex items-center justify-center p-4 overflow-y-auto animate-fade-in"
          style={{ backdropFilter: 'blur(4px)' }}
        >
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-gray-100 flex flex-col my-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-[#F9F8F6]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#063104]" />
                <h3 className="font-extrabold text-gray-900 text-lg">
                  {paymentToEdit ? 'Edit Metode Pembayaran' : 'Tambah Metode Pembayaran Baru'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-gray-200 text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Nama Metode Pembayaran <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. BCA Virtual Account"
                  className="w-full bg-white text-sm rounded-xl px-3.5 py-2.5 border border-gray-200 focus:outline-none focus:border-[#063104]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Kategori / Sub-teks Penjelasan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Transfer Bank Otomatis / GoPay, OVO, DANA"
                  className="w-full bg-white text-sm rounded-xl px-3.5 py-2.5 border border-gray-200 focus:outline-none focus:border-[#063104]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Tipe Icon Pembayaran
                </label>
                <select
                  value={iconType}
                  onChange={(e) => setIconType(e.target.value as any)}
                  className="w-full bg-white text-sm rounded-xl px-3.5 py-2.5 border border-gray-200 focus:outline-none focus:border-[#063104]"
                >
                  <option value="qris">QRIS / E-Wallet Icon</option>
                  <option value="bca">BCA / Bank VA Icon</option>
                  <option value="mandiri">Mandiri / Bank VA Icon</option>
                  <option value="cod">COD / Banknote Icon</option>
                  <option value="cc">Kartu Kredit / CreditCard Icon</option>
                </select>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-white text-[#063104] border border-[#063104] font-bold px-5 py-2.5 rounded-xl text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-[#063104] hover:bg-[#084205] text-white font-extrabold px-5 py-2.5 rounded-xl text-xs shadow-md"
                >
                  Simpan Metode
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

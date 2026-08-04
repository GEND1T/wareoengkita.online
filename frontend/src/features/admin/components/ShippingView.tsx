import React, { useState } from 'react';
import { Truck, Plus, Pencil, Trash2, X, Sparkles } from 'lucide-react';
import { useAdminStore } from '../store/useAdminStore';
import { useUserStore } from '../../auth/store/useUserStore';
import type { ShippingOptionAdmin } from '../../../types';
import { TableSkeleton } from '../../../components/common/AdminSkeletons';

export const ShippingView: React.FC = () => {
  const { profile } = useUserStore();
  const {
    shippingOptions,
    toggleShippingStatus,
    addShippingOption,
    updateShippingOption,
    deleteShippingOption,
    isLoadingData,
  } = useAdminStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [shippingToEdit, setShippingToEdit] = useState<ShippingOptionAdmin | null>(null);

  // Form State
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [courier, setCourier] = useState('');
  const [baseFee, setBaseFee] = useState<number | ''>(10000);
  const [feePerKm, setFeePerKm] = useState<number | ''>(2000);
  const [estimatedTime, setEstimatedTime] = useState('');

  const handleOpenAdd = () => {
    setShippingToEdit(null);
    setCode('');
    setName('');
    setCourier('GoSend / GrabExpress');
    setBaseFee(10000);
    setFeePerKm(2000);
    setEstimatedTime('1-2 Hari');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (opt: any) => {
    setShippingToEdit(opt);
    setCode(opt.code || '');
    setName(opt.name || '');
    setCourier(opt.courier || '');
    setBaseFee(opt.baseFee !== undefined ? opt.baseFee : (opt.fee || 10000));
    setFeePerKm(opt.feePerKm !== undefined ? opt.feePerKm : 2000);
    setEstimatedTime(opt.estimatedTime || opt.estimated || '1-2 Hari');
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, optName: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus opsi pengiriman "${optName}"?`)) {
      deleteShippingOption(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const data: any = {
      code: code.trim() || `ship-${Date.now().toString().slice(-4)}`,
      name: name.trim(),
      courier: courier.trim() || 'JNE / J&T / GoSend',
      baseFee: typeof baseFee === 'number' ? baseFee : 10000,
      fee: typeof baseFee === 'number' ? baseFee : 10000,
      feePerKm: typeof feePerKm === 'number' ? feePerKm : 2000,
      estimatedTime: estimatedTime.trim() || '1-2 Hari',
      estimated: estimatedTime.trim() || '1-2 Hari',
      isActive: shippingToEdit ? shippingToEdit.isActive : true,
    };

    if (shippingToEdit) {
      updateShippingOption(shippingToEdit.id, data);
    } else {
      addShippingOption(data, profile.assignedStoreId);
    }

    setIsModalOpen(false);
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    })
      .format(val || 0)
      .replace(/\s/g, ' ');

  if (isLoadingData) {
    return <TableSkeleton rows={5} />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title & Top Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Opsi Pengiriman Pesanan</h1>
          <p className="text-xs text-gray-500">
            Kelola pilihan layanan pengiriman & kurir yang tersedia di toko untuk pembeli saat checkout.
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
          <span>Tambah Opsi Pengiriman</span>
        </button>
      </div>

      {/* Shipping Options Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F9F8F6] text-gray-700 text-xs font-extrabold uppercase border-b border-gray-200/80">
                <th className="py-3.5 px-4">Nama Layanan Pengiriman</th>
                <th className="py-3.5 px-4">Kode Layanan</th>
                <th className="py-3.5 px-4">Kurir Terhubung</th>
                <th className="py-3.5 px-4">Estimasi Sampai</th>
                <th className="py-3.5 px-4">Biaya Dasar (Base Fee)</th>
                <th className="py-3.5 px-4">Tarif / KM</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 text-xs">
              {shippingOptions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    Belum ada opsi pengiriman. Klik "Tambah Opsi Pengiriman" untuk menambah.
                  </td>
                </tr>
              ) : (
                shippingOptions.map((opt: any) => {
                  const displayFee = opt.baseFee !== undefined ? opt.baseFee : (opt.fee || 0);
                  const displayEstimated = opt.estimatedTime || opt.estimated || '1-2 Hari';
                  const displayPerKm = opt.feePerKm !== undefined ? opt.feePerKm : 2000;

                  return (
                    <tr key={opt.id} className="hover:bg-emerald-50/30 transition-colors">
                      {/* Nama Layanan */}
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-gray-900 flex items-center gap-2">
                          <Truck className="w-4 h-4 text-[#063104]" />
                          <span>{opt.name}</span>
                        </div>
                      </td>

                      {/* Kode */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-gray-600">
                        {opt.code || '-'}
                      </td>

                      {/* Kurir */}
                      <td className="py-3.5 px-4 font-semibold text-gray-700">
                        {opt.courier || '-'}
                      </td>

                      {/* Estimasi Sampai */}
                      <td className="py-3.5 px-4">
                        <span className="bg-emerald-100 text-[#063104] font-extrabold text-[11px] px-2.5 py-0.5 rounded-full">
                          {displayEstimated}
                        </span>
                      </td>

                      {/* Biaya Ongkir Dasar */}
                      <td className="py-3.5 px-4 font-extrabold text-gray-900">
                        {formatCurrency(displayFee)}
                      </td>

                      {/* Tarif Per KM */}
                      <td className="py-3.5 px-4 font-bold text-gray-700">
                        {formatCurrency(displayPerKm)} / km
                      </td>

                      {/* Status Toggle */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => toggleShippingStatus(opt.id)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${opt.isActive ? 'bg-[#063104]' : 'bg-gray-300'
                            }`}
                          title={opt.isActive ? 'Klik untuk nonaktifkan' : 'Klik untuk aktifkan'}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${opt.isActive ? 'translate-x-5' : 'translate-x-0'
                              }`}
                          />
                        </button>
                        <span className="block text-[10px] font-bold text-gray-500 mt-0.5">
                          {opt.isActive ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>

                      {/* Aksi */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(opt)}
                            className="p-1.5 rounded-lg bg-gray-100 hover:bg-[#063104] hover:text-white text-gray-700 transition-colors"
                            title="Edit Opsi Pengiriman"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(opt.id, opt.name)}
                            className="p-1.5 rounded-lg bg-gray-100 hover:bg-red-600 hover:text-white text-gray-700 transition-colors"
                            title="Hapus Opsi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add/Edit Shipping Option */}
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
                  {shippingToEdit ? 'Edit Opsi Pengiriman' : 'Tambah Opsi Pengiriman Baru'}
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Kode Layanan (Code)
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. instant-senopati"
                    className="w-full bg-white text-sm rounded-xl px-3.5 py-2.5 border border-gray-200 focus:outline-none focus:border-[#063104] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Kurir Terhubung / Partner
                  </label>
                  <input
                    type="text"
                    required
                    value={courier}
                    onChange={(e) => setCourier(e.target.value)}
                    placeholder="e.g. GoSend / GrabExpress"
                    className="w-full bg-white text-sm rounded-xl px-3.5 py-2.5 border border-gray-200 focus:outline-none focus:border-[#063104]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Nama Layanan Pengiriman <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Instant Delivery (1-2 Jam)"
                  className="w-full bg-white text-sm rounded-xl px-3.5 py-2.5 border border-gray-200 focus:outline-none focus:border-[#063104]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Ongkir Dasar (Rp) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={baseFee}
                    onChange={(e) => setBaseFee(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="15000"
                    className="w-full bg-white text-sm rounded-xl px-3.5 py-2.5 border border-gray-200 focus:outline-none focus:border-[#063104] font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Tarif per-KM (Rp)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={feePerKm}
                    onChange={(e) => setFeePerKm(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="2000"
                    className="w-full bg-white text-sm rounded-xl px-3.5 py-2.5 border border-gray-200 focus:outline-none focus:border-[#063104] font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Estimasi Sampai <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={estimatedTime}
                    onChange={(e) => setEstimatedTime(e.target.value)}
                    placeholder="e.g. Tiba Hari Ini, 2-3 Hari"
                    className="w-full bg-white text-sm rounded-xl px-3.5 py-2.5 border border-gray-200 focus:outline-none focus:border-[#063104]"
                  />
                </div>
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
                  Simpan Layanan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

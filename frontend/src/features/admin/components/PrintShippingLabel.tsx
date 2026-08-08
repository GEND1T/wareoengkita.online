import React from 'react';
import { Printer, X } from 'lucide-react';
import type { AdminOrder } from '../../../types';
import { useAdminStore } from '../store/useAdminStore';

interface PrintShippingLabelProps {
  open: boolean;
  onClose: () => void;
  order: AdminOrder | null;
}

export const PrintShippingLabel: React.FC<PrintShippingLabelProps> = ({
  open,
  onClose,
  order,
}) => {
  const { storeProfile } = useAdminStore();

  if (!open || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    })
      .format(val)
      .replace(/\s/g, ' ');

  return (
    <div
      className="fixed inset-0 z-[3500] bg-black/60 flex items-center justify-center p-4 overflow-y-auto animate-fade-in"
      style={{ backdropFilter: 'blur(4px)' }}
    >
      <div className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl border border-gray-100 flex flex-col my-auto max-h-[90vh]">
        {/* Header (Hidden during window.print()) */}
        <div className="print:hidden px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-[#F9F8F6] shrink-0">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-[#063104]" />
            <h3 className="font-extrabold text-gray-900 text-base">
              Cetak Struk & Label Alamat Kemasan
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-gray-200 text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Struk / Shipping Label Container */}
        <div className="p-6 overflow-y-auto">
          <div
            id="printable-shipping-label"
            className="bg-white p-6 border-2 border-dashed border-gray-900 rounded-3xl space-y-4 text-xs font-sans shadow-xs"
          >
            {/* Header: Store Identity & Courier Tag */}
            <div className="flex items-start justify-between border-b-2 border-gray-900 pb-3">
              <div>
                <span className="font-black text-[#063104] text-base uppercase tracking-wider block">
                  {storeProfile.name}
                </span>
                <span className="text-[10px] text-gray-600 block">{storeProfile.address}</span>
                <span className="text-[10px] text-gray-600 font-bold block">Telp: {storeProfile.phone}</span>
              </div>

              <div className="text-right">
                <span className="bg-[#063104] text-white text-[11px] font-black px-3 py-1 rounded-lg inline-block">
                  INSTANT / EXPRESS
                </span>
                <span className="text-[10px] font-mono text-gray-500 block mt-1">{order.id}</span>
              </div>
            </div>

            {/* Address & Recipient Info */}
            <div className="grid grid-cols-2 gap-4 border-b border-gray-300 pb-3">
              <div>
                <span className="text-[10px] font-black text-gray-400 uppercase block mb-1">
                  PENGIRIM (STORE):
                </span>
                <p className="font-bold text-gray-900 text-xs">{storeProfile.name}</p>
                <p className="text-[11px] text-gray-600">{storeProfile.address}</p>
              </div>

              <div>
                <span className="text-[10px] font-black text-gray-400 uppercase block mb-1">
                  PENERIMA (CUSTOMER):
                </span>
                <p className="font-extrabold text-gray-900 text-xs">{order.customerName}</p>
                <p className="text-[11px] font-bold text-[#063104]">HP: {order.phone}</p>
                <p className="text-[11px] text-gray-700 leading-snug mt-0.5">{order.shippingAddress}</p>
              </div>
            </div>

            {/* Checklist Packaging Items */}
            <div className="space-y-2">
              <span className="font-black text-gray-900 text-xs uppercase tracking-wider block">
                Daftar Barang Kemasan (Checklist Packaging):
              </span>

              <table className="w-full text-left border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100 text-[10px] font-black uppercase text-gray-700">
                    <th className="p-2 border border-gray-300 w-8 text-center">Cek</th>
                    <th className="p-2 border border-gray-300">Nama Produk</th>
                    <th className="p-2 border border-gray-300 text-center">Jumlah</th>
                    <th className="p-2 border border-gray-300 text-right">Harga</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-xs">
                  {order.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-2 border border-gray-300 text-center">
                        <div className="w-4 h-4 border border-gray-900 rounded mx-auto"></div>
                      </td>
                      <td className="p-2 border border-gray-300 font-bold text-gray-900">
                        {item.productName}
                      </td>
                      <td className="p-2 border border-gray-300 text-center font-bold">
                        x{item.quantity} ({item.unit})
                      </td>
                      <td className="p-2 border border-gray-300 text-right font-extrabold">
                        {formatCurrency(item.price * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total Breakdown & QR Order */}
            <div className="pt-2 border-t-2 border-gray-900 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${order.id}`}
                  alt="QR Order"
                  className="w-14 h-14 object-contain border border-gray-900 rounded-lg p-0.5"
                />
                <div>
                  <span className="text-[10px] text-gray-500 font-bold block">Metode Pembayaran:</span>
                  <span className="font-extrabold text-gray-900 text-xs">{order.paymentMethod}</span>
                  <span className="text-[10px] text-emerald-700 font-black block">Lunas (Paid)</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-gray-500 font-bold block">Total Transaksi:</span>
                <span className="text-base font-black text-gray-900">{formatCurrency(order.totalPrice)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons (Hidden during print) */}
        <div className="print:hidden p-4 border-t border-gray-100 bg-[#F9F8F6] flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full bg-white text-gray-700 font-bold py-3 rounded-2xl text-xs border border-gray-200"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="w-full bg-[#063104] hover:bg-[#084205] text-white font-extrabold py-3 rounded-2xl text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Struk / Label (Print)</span>
          </button>
        </div>
      </div>
    </div>
  );
};

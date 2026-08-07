import React from 'react';
import {
  X,
  CheckCircle2,
  Route,
  MessageSquare,
  Truck,
  ExternalLink,
} from 'lucide-react';
import type { OrderStatus } from '../../auth/store/useUserStore';

interface OrderTrackingModalProps {
  open: boolean;
  onClose: () => void;
  orderNo: string;
  orderDate?: string;
  orderTime?: string;
  courierName?: string;
  currentStatus: OrderStatus | string;
  driverName?: string;
  driverPhone?: string;
  driverPlate?: string;
  trackingNumber?: string;
  biteshipTrackingUrl?: string;
  storeName?: string;
  shippingAddress?: string;
}

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({
  open,
  onClose,
  orderNo,
  orderDate,
  orderTime = '10:00 WIB',
  courierName = 'OrganikStore Instant Delivery',
  currentStatus,
  driverName,
  driverPhone,
  driverPlate,
  trackingNumber,
  biteshipTrackingUrl,
  storeName = 'OrganikStore',
  shippingAddress,
}) => {
  if (!open) return null;

  const resi = trackingNumber || `TRK-${orderNo}`;
  const displayDriverName = driverName || (['dikemas', 'processing'].includes(currentStatus) ? `Tim QC & Packing (${storeName})` : 'Kurir OrganikStore');
  const displayPlate = driverPlate ? `• Plat: ${driverPlate}` : '';

  // Timeline steps definitions
  const steps = [
    {
      id: 'diterima',
      title: 'Pesanan Diterima',
      desc: `Pembayaran dikonfirmasi & sistem meneruskan ke ${storeName}.`,
      time: orderTime || '08:10 WIB',
      completed: true,
    },
    {
      id: 'dikemas',
      title: 'Sedang Dikemas Toko',
      desc: `Tim QC ${storeName} memilah sayuran & buah organik paling segar.`,
      time: orderDate ? 'Diproses' : '08:25 WIB',
      completed: currentStatus !== 'belum_bayar' && currentStatus !== 'new',
    },
    {
      id: 'kurir_menjemput',
      title: 'Siap Dikirim (Kurir Menjemput Barang)',
      desc: driverName
        ? `Driver (${driverName}) mengambil paket dari lokasi toko.`
        : `Paket selesai dikemas & siap dijemput oleh kurir.`,
      time: ['ready', 'dikirim', 'delivering', 'selesai', 'completed'].includes(currentStatus) ? 'Siap' : 'Menunggu',
      completed: ['ready', 'dikirim', 'delivering', 'selesai', 'completed'].includes(currentStatus),
      current: currentStatus === 'ready',
    },
    {
      id: 'dalam_pengiriman',
      title: 'Dalam Pengiriman Ke Alamat',
      desc: driverName
        ? `Driver (${driverName}) sedang mengantar paket ke ${shippingAddress || 'alamat Anda'}.`
        : `Paket dalam perjalanan ke ${shippingAddress || 'alamat Anda'}.`,
      time: ['delivering', 'dikirim', 'selesai', 'completed'].includes(currentStatus) ? 'Jalan' : 'Estimasi',
      completed: ['delivering', 'dikirim', 'selesai', 'completed'].includes(currentStatus),
      current: currentStatus === 'dikirim' || currentStatus === 'delivering',
    },
    {
      id: 'selesai',
      title: 'Sampai di Tujuan (Selesai)',
      desc: 'Paket berhasil diterima dengan kondisi segar.',
      time: currentStatus === 'selesai' || currentStatus === 'completed' ? 'Selesai' : 'Estimasi',
      completed: currentStatus === 'selesai' || currentStatus === 'completed',
      current: currentStatus === 'selesai' || currentStatus === 'completed',
    },
  ];

  return (
    <div
      className="fixed inset-0 z-[3500] bg-black/60 flex items-center justify-center p-4 overflow-y-auto animate-fade-in"
      style={{ backdropFilter: 'blur(4px)' }}
    >
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-gray-100 flex flex-col my-auto max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-[#F9F8F6] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#063104] text-white flex items-center justify-center font-bold shadow-xs">
              <Route className="w-5 h-5 text-[#FACC15]" />
            </div>
            <div>
              <h3 className="font-extrabold text-gray-900 text-base leading-none">
                Lacak Status Pengiriman
              </h3>
              <span className="text-[10px] text-gray-500 font-medium block mt-0.5">
                No. Resi: <strong className="text-gray-900 font-mono">{resi}</strong>
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-gray-200 text-gray-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Driver Card Info */}
          <div className="bg-emerald-50/80 rounded-2xl p-4 border border-emerald-200/80 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0 border-2 border-emerald-500">
                <Truck className="w-6 h-6 text-yellow-300" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-gray-900 text-sm">{displayDriverName}</span>
                  <span className="bg-[#063104] text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full">
                    {courierName}
                  </span>
                </div>
                <p className="text-[11px] text-gray-600 font-medium mt-0.5">
                  Toko: <strong className="text-gray-900">{storeName}</strong> {displayPlate}
                </p>
              </div>
            </div>

            {driverPhone ? (
              <a
                href={`https://wa.me/${driverPhone.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="bg-[#063104] hover:bg-[#084205] text-white font-extrabold p-3 rounded-2xl text-xs flex items-center justify-center shrink-0 shadow-md transition-all active:scale-95 cursor-pointer"
                title="Hubungi Driver"
              >
                <MessageSquare className="w-4 h-4" />
              </a>
            ) : (
              <div className="bg-emerald-100 text-emerald-900 font-bold p-2.5 rounded-xl text-[10px] shrink-0">
                Kurir Disiapkan
              </div>
            )}
          </div>

          {/* Biteship Live Tracking Link Button if available */}
          {biteshipTrackingUrl && (
            <a
              href={biteshipTrackingUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-4 py-2.5 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <Truck className="w-4 h-4" />
              <span>Buka Live Tracking Biteship</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          {/* Timeline Visual Stepper */}
          <div className="bg-white rounded-3xl p-5 border border-gray-100 space-y-4 shadow-xs">
            <h4 className="font-black text-gray-900 text-xs uppercase tracking-wider border-b border-gray-100 pb-2">
              Timeline Perjalanan Paket ({orderNo})
            </h4>

            <div className="space-y-6 relative pl-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
              {steps.map((step, idx) => (
                <div key={step.id} className="relative flex items-start justify-between gap-3">
                  {/* Circle Indicator Icon */}
                  <div
                    className={`absolute -left-6 top-0 w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${
                      step.current
                        ? 'bg-[#063104] border-[#063104] text-white ring-4 ring-emerald-100 animate-pulse'
                        : step.completed
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'bg-white border-gray-300 text-gray-400'
                    }`}
                  >
                    {step.completed ? (
                      <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                    ) : (
                      <span className="text-[10px] font-black">{idx + 1}</span>
                    )}
                  </div>

                  {/* Step Description Content */}
                  <div>
                    <h5
                      className={`font-extrabold text-xs ${
                        step.completed || step.current ? 'text-gray-900' : 'text-gray-400'
                      }`}
                    >
                      {step.title}
                    </h5>
                    <p className="text-[11px] text-gray-500 leading-relaxed mt-0.5">
                      {step.desc}
                    </p>
                  </div>

                  <span className="text-[10px] font-bold text-gray-400 shrink-0 font-mono">
                    {step.time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-[#F9F8F6] flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="bg-[#063104] hover:bg-[#084205] text-white font-extrabold px-6 py-2.5 rounded-2xl text-xs shadow-md transition-all active:scale-95 cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

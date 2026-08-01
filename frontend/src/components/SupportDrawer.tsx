import React, { useState } from 'react';
import { Drawer, IconButton } from '@mui/material';
import {
  X,
  MessageSquare,
  HelpCircle,
  Store,
  ChevronDown,
  ShieldCheck,
} from 'lucide-react';
import { useStoreSelectorStore } from '../store/useStoreSelectorStore';

interface SupportDrawerProps {
  open: boolean;
  onClose: () => void;
}

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const FAQ_LIST: FaqItem[] = [
  {
    id: 'faq-1',
    question: 'Bagaimana OrganikStore menjamin kesegaran sayur & buah?',
    answer:
      'Seluruh produk segar dipanen setiap hari dari mitra petani lokal terpercaya dan disimpan dalam suhu terkontrol. Sebelum dikirim, tim Quality Control (QC) kami memilah satu per satu barang untuk memastikan bebas dari cacat.',
  },
  {
    id: 'faq-2',
    question: 'Berapa lama waktu pengiriman dengan Instant Delivery?',
    answer:
      'Pengiriman Instant Delivery (GoSend / GrabExpress) akan diproses dan diantar langsung ke lokasi Anda dalam waktu 1-2 jam setelah pembayaran dikonfirmasi.',
  },
  {
    id: 'faq-3',
    question: 'Bagaimana jika ada barang yang rusak atau busuk saat sampai?',
    answer:
      'OrganikStore memberikan garansi 100% ganti rugi! Cukup foto/video produk yang rusak dan hubungi CS kami dalam 1x24 jam. Kami akan mengirimkan barang pengganti atau pengembalian dana penuh.',
  },
  {
    id: 'faq-4',
    question: 'Metode pembayaran apa saja yang tersedia?',
    answer:
      'Kami menerima pembayaran via QRIS (GoPay, OVO, ShopeePay, DANA), Virtual Account (BCA, Mandiri), COD (Bayar di Tempat saat kurir sampai), dan Kartu Kredit/Debit.',
  },
];

export const SupportDrawer: React.FC<SupportDrawerProps> = ({ open, onClose }) => {
  const { getSelectedStore } = useStoreSelectorStore();
  const activeStore = getSelectedStore();

  const [expandedFaq, setExpandedFaq] = useState<string | null>('faq-1');

  if (!open) return null;

  const handleOpenWaChat = () => {
    const phoneNo = activeStore.phone.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(
      `Halo CS ${activeStore.name}, saya ingin bertanya mengenai produk dan pengiriman pesanan saya...`
    );
    window.open(`https://wa.me/${phoneNo}?text=${message}`, '_blank');
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100%', sm: '480px' },
            backgroundColor: '#F9F8F6',
            p: 0,
            display: 'flex',
            flexDirection: 'column',
          },
        },
      }}
    >
      {/* Header */}
      <div className="sticky top-0 bg-[#F9F8F6]/95 backdrop-blur-md z-30 px-5 py-4 border-b border-gray-200/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#063104] text-white flex items-center justify-center font-bold shadow-xs">
            <HelpCircle className="w-5 h-5 text-[#FACC15]" />
          </div>
          <div>
            <h2 className="font-black text-gray-900 text-base leading-none">
              Pusat Bantuan & CS
            </h2>
            <span className="text-[10px] text-gray-500 font-medium block mt-0.5">
              Layanan bantuan pelanggan 24/7
            </span>
          </div>
        </div>

        <IconButton onClick={onClose} size="small">
          <X className="w-5 h-5 text-gray-700" />
        </IconButton>
      </div>

      {/* Main Body Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
        {/* Direct WhatsApp Banner Card */}
        <div className="bg-emerald-800 text-white rounded-3xl p-5 shadow-lg space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Store className="w-5 h-5 text-[#FACC15]" />
              <span className="font-extrabold text-sm">{activeStore.name}</span>
            </div>
            <span className="bg-emerald-700 text-emerald-100 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
              Online
            </span>
          </div>

          <p className="text-xs text-emerald-100 leading-relaxed">
            Ada kendala pengiriman atau ingin menanyakan kesegaran stok buah & sayur? CS kami siap membantu Anda!
          </p>

          <button
            type="button"
            onClick={handleOpenWaChat}
            className="w-full bg-[#063104] hover:bg-[#084205] text-white font-extrabold py-3 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 border border-emerald-500/30"
          >
            <MessageSquare className="w-4.5 h-4.5 text-emerald-300" />
            <span>Chat CS via WhatsApp ({activeStore.phone})</span>
          </button>
        </div>

        {/* Guarantee Badge */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#063104] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-extrabold text-gray-900 text-xs">Garansi 100% Segar</h4>
            <p className="text-[11px] text-gray-500">
              Jika barang busuk/cacat saat diterima, ganti baru atau uang kembali 100%.
            </p>
          </div>
        </div>

        {/* FAQ Accordion Section */}
        <div className="space-y-3">
          <h3 className="font-black text-gray-900 text-xs uppercase tracking-wider">
            Pertanyaan Sering Diajukan (FAQ)
          </h3>

          <div className="space-y-2">
            {FAQ_LIST.map((faq) => {
              const isExpanded = expandedFaq === faq.id;
              return (
                <div
                  key={faq.id}
                  className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden shadow-xs transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedFaq(isExpanded ? null : faq.id)}
                    className="w-full p-4 text-left font-extrabold text-gray-900 text-xs flex items-center justify-between gap-2 hover:bg-emerald-50/30 transition-colors"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-gray-500 shrink-0 transition-transform duration-200 ${
                        isExpanded ? 'rotate-180 text-[#063104]' : ''
                      }`}
                    />
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 text-[11px] text-gray-600 leading-relaxed border-t border-gray-100 pt-2 animate-fade-in">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Drawer>
  );
};

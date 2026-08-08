import React, { useState } from 'react';
import { Star, MessageSquarePlus, CheckCircle2, Sparkles } from 'lucide-react';

export interface ProductReviewItem {
  id: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  date: string;
  comment: string;
  photoUrl?: string;
  helpfulCount: number;
}

const MOCK_REVIEWS: ProductReviewItem[] = [
  {
    id: 'rev-1',
    userName: 'Rina Wijaya',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    rating: 5,
    date: '28 Juli 2026',
    comment: 'Barang sangat bagus dan sesuai deskripsi! Kualitas terjamin dan pengiriman super cepat sampai dalam 45 menit!',
    photoUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=400&q=80',
    helpfulCount: 14,
  },
  {
    id: 'rev-2',
    userName: 'Dewi Sartika',
    userAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80',
    rating: 5,
    date: '25 Juli 2026',
    comment: 'Produk asli berkualitas tinggi, packing sangat rapi. Langsung langganan beli di WaroengKita!',
    helpfulCount: 8,
  },
  {
    id: 'rev-3',
    userName: 'Bambang Sukoco',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    rating: 4,
    date: '20 Juli 2026',
    comment: 'Packaging rapi dan aman, pelayanan penjual sangat memuaskan.',
    helpfulCount: 3,
  },
];

interface ProductReviewsViewProps {
  productId?: string;
  productName?: string;
}

export const ProductReviewsView: React.FC<ProductReviewsViewProps> = ({ productId: _productId, productName: _productName }) => {
  const [reviewsList, setReviewsList] = useState<ProductReviewItem[]>(MOCK_REVIEWS);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form State
  const [newRating, setNewRating] = useState(5);
  const [newName, setNewName] = useState('');
  const [newComment, setNewComment] = useState('');
  const [newPhoto, setNewPhoto] = useState('');

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const item: ProductReviewItem = {
      id: `rev-${Date.now()}`,
      userName: newName.trim() || 'Pembeli Setia',
      userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      rating: newRating,
      date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      comment: newComment.trim(),
      photoUrl: newPhoto.trim() || undefined,
      helpfulCount: 0,
    };

    setReviewsList([item, ...reviewsList]);
    setNewComment('');
    setNewPhoto('');
    setIsFormOpen(false);
  };

  const avgRating = (
    reviewsList.reduce((acc, r) => acc + r.rating, 0) / reviewsList.length
  ).toFixed(1);

  return (
    <div className="space-y-4 pt-4 border-t border-gray-100">
      {/* Top Rating Summary Box */}
      <div className="bg-[#F9F8F6] rounded-3xl p-4 border border-gray-200/80 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="text-center">
            <span className="text-3xl font-black text-gray-900 leading-none">{avgRating}</span>
            <div className="flex items-center justify-center gap-0.5 mt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-3.5 h-3.5 ${
                    star <= Math.round(Number(avgRating))
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-[10px] text-gray-500 font-bold block mt-0.5">
              {reviewsList.length} Ulasan
            </span>
          </div>

          <div className="border-l border-gray-200 pl-3 text-xs text-gray-600 space-y-0.5">
            <div className="flex items-center gap-1 font-bold text-gray-800 text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 stroke-[3]" />
              <span>100% Produk Terverifikasi</span>
            </div>
            <p className="text-[10px] text-gray-500">
              Ulasan asli dari pembeli yang telah menerima barang di rumah.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="bg-[#063104] hover:bg-[#084205] text-white font-extrabold px-3.5 py-2.5 rounded-2xl text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5 shrink-0"
        >
          <MessageSquarePlus className="w-4 h-4" />
          <span>Tulis Ulasan</span>
        </button>
      </div>

      {/* Expandable Review Form */}
      {isFormOpen && (
        <form
          onSubmit={handleAddReview}
          className="bg-emerald-50/80 rounded-3xl p-4 border border-emerald-200 space-y-3 animate-fade-in text-xs"
        >
          <div className="flex items-center gap-1.5 text-[#063104] font-extrabold">
            <Sparkles className="w-4 h-4" />
            <span>Tulis Ulasan Produk</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-700">Rating Anda:</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setNewRating(star)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`w-5 h-5 cursor-pointer ${
                      star <= newRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nama Anda (opsional)..."
            className="w-full bg-white text-xs rounded-xl px-3 py-2 border border-gray-200 focus:outline-none focus:border-[#063104]"
          />

          <textarea
            rows={2}
            required
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Tulis ulasan Anda mengenai kualitas barang..."
            className="w-full bg-white text-xs rounded-xl px-3 py-2 border border-gray-200 focus:outline-none focus:border-[#063104]"
          />

          <input
            type="text"
            value={newPhoto}
            onChange={(e) => setNewPhoto(e.target.value)}
            placeholder="Paste URL Foto Produk (opsional)..."
            className="w-full bg-white text-xs rounded-xl px-3 py-2 border border-gray-200 focus:outline-none focus:border-[#063104]"
          />

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="bg-white text-gray-700 font-bold px-4 py-2 rounded-xl text-xs border border-gray-200"
            >
              Batal
            </button>
            <button
              type="submit"
              className="bg-[#063104] hover:bg-[#084205] text-white font-extrabold px-4 py-2 rounded-xl text-xs shadow-md"
            >
              Kirim Ulasan
            </button>
          </div>
        </form>
      )}

      {/* Review List */}
      <div className="space-y-3 pt-1">
        {reviewsList.map((rev) => (
          <div
            key={rev.id}
            className="bg-white rounded-2xl p-3.5 border border-gray-100 space-y-2 text-xs shadow-xs"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img
                  src={
                    rev.userAvatar ||
                    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'
                  }
                  alt={rev.userName}
                  className="w-7 h-7 rounded-full object-cover border border-gray-200"
                />
                <div>
                  <span className="font-extrabold text-gray-900 block leading-tight">{rev.userName}</span>
                  <span className="text-[10px] text-gray-400 block leading-tight">{rev.date}</span>
                </div>
              </div>

              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-3 h-3 ${
                      star <= rev.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'
                    }`}
                  />
                ))}
              </div>
            </div>

            <p className="text-gray-700 leading-relaxed text-xs">{rev.comment}</p>

            {rev.photoUrl && (
              <div className="w-20 h-20 rounded-xl overflow-hidden border border-gray-200">
                <img src={rev.photoUrl} alt="Foto Ulasan Pembeli" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

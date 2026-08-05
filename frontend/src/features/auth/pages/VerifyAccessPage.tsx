import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ShieldCheck, AlertCircle, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useUserStore } from '../store/useUserStore';
import { useLocationStore } from '../../store-location/store/useLocationStore';
import { useAdminStore } from '../../admin/store/useAdminStore';
import { API_BASE_URL } from '../../../config/api';

export const VerifyAccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Memverifikasi Link Akses WhatsApp...');

  const { updateProfile, closeAuthModal } = useUserStore();
  const { openAdmin } = useAdminStore();
  const { showToast } = useLocationStore();

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Token verifikasi tidak ditemukan di URL. Silakan minta link baru.');
      return;
    }

    const verifyToken = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/verify-access`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();
        if (!data.success) {
          throw new Error(data.message || 'Verifikasi gagal');
        }

        const user = data.data.user;

        // Save session token & user payload
        localStorage.setItem('authToken', data.data.token);
        localStorage.setItem('userData', JSON.stringify(user));

        // Close any open Auth modal
        closeAuthModal();

        // Update user store with full role info
        updateProfile({
          id: user.id,
          fullName: user.name,
          username: user.email ? user.email.split('@')[0] : user.name,
          phone: user.phone,
          email: user.email,
          role: user.role || 'customer',
          assignedStoreId: user.assignedStoreId,
          assignedStoreName: user.assignedStoreName,
          gender: user.gender || 'Laki-laki',
          birthDate: user.birthDate || '1995-08-17',
        });

        setStatus('success');

        const roleLabel =
          user.role === 'superadmin'
            ? 'Superadmin Platform'
            : user.role === 'admin_store'
              ? `Admin Toko (${user.assignedStoreName || 'Cabang'})`
              : 'Pelanggan';

        setMessage(`Selamat datang, ${user.name}! Anda berhasil masuk sebagai [${roleLabel}].`);
        showToast(`Berhasil login sebagai ${user.name} (${roleLabel})`);

        // If user is Admin / Superadmin, open Admin Dashboard automatically!
        if (user.role === 'admin_store' || user.role === 'superadmin') {
          openAdmin();
        }

        // Redirect to homepage after brief delay
        setTimeout(() => {
          navigate('/');
        }, 1800);
      } catch (err: any) {
        setStatus('error');
        setMessage(err.message || 'Terjadi kesalahan saat memverifikasi token akses.');
      }
    };

    verifyToken();
  }, [token, updateProfile, openAdmin, showToast, navigate]);

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-8 text-white text-center relative">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-3 border border-white/30">
            <ShieldCheck className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-xl font-bold">Verifikasi Akses WhatsApp</h1>
          <p className="text-xs text-emerald-100 mt-1 font-medium">OrganikStore System Authentication</p>
        </div>

        <div className="p-8 text-center space-y-6">
          {status === 'loading' && (
            <div className="space-y-4 py-4">
              <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mx-auto" />
              <p className="text-xs font-semibold text-slate-700">{message}</p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4 py-2">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto border-4 border-emerald-50 animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Akses Terverifikasi!</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{message}</p>
              </div>
              <div className="pt-3">
                <button
                  onClick={() => navigate('/')}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-md shadow-emerald-200"
                >
                  Masuk ke Beranda Sekarang ➔
                </button>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4 py-2">
              <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto border-4 border-rose-50">
                <AlertCircle className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Verifikasi Gagal</h3>
                <p className="text-xs text-rose-600 mt-1 leading-relaxed font-medium">{message}</p>
              </div>
              <div className="pt-3">
                <button
                  onClick={() => navigate('/')}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition flex items-center justify-center space-x-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Kembali ke Beranda</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

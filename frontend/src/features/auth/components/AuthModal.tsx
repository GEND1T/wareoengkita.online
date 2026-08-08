import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, IconButton } from '@mui/material';
import {
  X,
  Phone,
  Lock,
  User,
  MessageSquare,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { useUserStore } from '../store/useUserStore';
import { API_BASE_URL } from '../../../config/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { isLoggedIn } = useUserStore();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successData, setSuccessData] = useState<{
    phone: string;
    waMeUrl: string;
    magicLinkUrl: string;
    message: string;
  } | null>(null);

  const API_BASE = `${API_BASE_URL}/auth`;

  const resetForm = () => {
    setPhone('');
    setPassword('');
    setName('');
    setErrorMsg('');
    setSuccessData(null);
    setLoading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Automatically close modal when login status becomes true
  useEffect(() => {
    if (isLoggedIn && isOpen) {
      handleClose();
    }
  }, [isLoggedIn, isOpen]);

  const handleLoginWA = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/login-wa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Login gagal');
      }

      setSuccessData({
        phone: data.data.phone,
        waMeUrl: data.data.waMeUrl,
        magicLinkUrl: data.data.magicLinkUrl,
        message: data.message,
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterWA = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/register-wa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, password }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Registrasi gagal');
      }

      setSuccessData({
        phone: data.data.phone,
        waMeUrl: data.data.waMeUrl,
        magicLinkUrl: data.data.magicLinkUrl,
        message: data.message,
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      slotProps={{
        paper: {
          style: {
            borderRadius: '24px',
            overflow: 'hidden',
            padding: 0,
          },
        },
      }}
    >
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 p-6 text-white relative">
        <IconButton
          onClick={handleClose}
          sx={{ position: 'absolute', right: 12, top: 12, color: 'white' }}
        >
          <X className="w-5 h-5" />
        </IconButton>

        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">WhatsApp Login</h2>
            <p className="text-xs text-emerald-100 font-medium">Akses Akun WaroengKita Sangat Mudah</p>
          </div>
        </div>
      </div>

      <DialogContent className="p-6 bg-slate-50">
        {/* State 2: Link WhatsApp Sent Successfully */}
        {successData ? (
          <div className="space-y-5 text-center py-2">
            <div className="w-16 h-16 bg-emerald-100 border-4 border-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600 animate-bounce">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-800">Link Akses Dikirim! 💬</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Kami telah mengirimkan link akses akun ke nomor WhatsApp: <br />
                <span className="font-bold text-emerald-700 text-sm">{successData.phone}</span>
              </p>
            </div>

            <div className="p-3.5 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl text-left space-y-2">
              <div className="flex items-center text-xs font-semibold text-emerald-800">
                <ShieldCheck className="w-4 h-4 mr-1.5 text-emerald-600" />
                Instruksi Akses:
              </div>
              <ol className="text-xs text-emerald-900 list-decimal list-inside space-y-1 pl-1">
                <li>Buka pesan dari WaroengKita di WhatsApp.</li>
                <li>Klik link verifikasi yang tersedia.</li>
                <li>Anda akan langsung masuk ke akun Anda.</li>
              </ol>
            </div>

            {/* Actions: Real WA Link & Direct Testing Link */}
            <div className="space-y-2.5 pt-2">
              <a
                href={successData.waMeUrl}
                target="_blank"
                rel="noreferrer"
                onClick={handleClose}
                className="w-full inline-flex items-center justify-center px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition shadow-md shadow-emerald-200"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Buka Aplikasi WhatsApp
                <ExternalLink className="w-3.5 h-3.5 ml-1.5 opacity-80" />
              </a>

              {/* Development Quick Test Access Link */}
              <a
                href={successData.magicLinkUrl}
                onClick={handleClose}
                className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-xl transition shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                [Simulasi Akses Langsung] Klik di sini
              </a>
            </div>

            <button
              type="button"
              onClick={resetForm}
              className="text-xs text-slate-500 hover:text-slate-800 underline font-medium pt-2"
            >
              ← Kembali / Coba Nomor Lain
            </button>
          </div>
        ) : (
          <>
            {/* Tab Buttons */}
            <div className="flex bg-slate-200/70 p-1 rounded-xl mb-5">
              <button
                type="button"
                onClick={() => {
                  setTab('login');
                  setErrorMsg('');
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${tab === 'login'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                Masuk / Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab('register');
                  setErrorMsg('');
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${tab === 'register'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                Daftar Akun Baru
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2 text-rose-700 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Login Form */}
            {tab === 'login' ? (
              <form onSubmit={handleLoginWA} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Nomor WhatsApp
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: 081234567890"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Password Akun
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      required
                      placeholder="Masukkan password Anda"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-emerald-200 transition flex items-center justify-center space-x-2 disabled:opacity-50 mt-2"
                >
                  {loading ? (
                    <span>Memverifikasi Kredensial...</span>
                  ) : (
                    <>
                      <span>Minta Link Akses WhatsApp</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* Register Form */
              <form onSubmit={handleRegisterWA} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Lengkap
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="Nama lengkap Anda"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nomor WhatsApp
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: 081234567890"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Password Baru
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      required
                      placeholder="Buat password aman"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-emerald-200 transition flex items-center justify-center space-x-2 disabled:opacity-50 mt-2"
                >
                  {loading ? (
                    <span>Mendaftarkan Akun...</span>
                  ) : (
                    <>
                      <span>Daftar & Kirim Link WA</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

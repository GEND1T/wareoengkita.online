import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { useServerStatusStore } from '../../store/useServerStatusStore';

export const ServerStatusBanner: React.FC = () => {
  const { isDisconnected, errorMessage, resetStatus } = useServerStatusStore();

  if (!isDisconnected) return null;

  const handleRetry = () => {
    resetStatus();
    window.location.reload();
  };

  return (
    <div className="bg-rose-600 text-white px-4 py-2.5 shadow-lg flex flex-wrap items-center justify-between gap-3 sticky top-0 z-[100] border-b border-rose-700 animate-in fade-in slide-in-from-top duration-300">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-full bg-rose-700/80 flex items-center justify-center shrink-0">
          <WifiOff className="w-4 h-4 text-amber-200 animate-pulse" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 font-bold text-xs">
            <span>Koneksi Server Terputus</span>
            <span className="bg-rose-800 text-rose-100 text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
              Database Unreachable
            </span>
          </div>
          <p className="text-[11px] text-rose-100/90 truncate leading-snug">
            {errorMessage || 'Gagal terhubung ke database server backend. Layanan sementara terganggu.'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 ml-auto sm:ml-0">
        <button
          type="button"
          onClick={handleRetry}
          className="bg-white text-rose-700 hover:bg-rose-50 font-extrabold text-xs px-3.5 py-1.5 rounded-xl shadow-sm flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Coba Lagi</span>
        </button>
      </div>
    </div>
  );
};

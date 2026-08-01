import React, { useState, useEffect } from 'react';
import { Download, X, Share, CheckCircle2, Smartphone, ShieldCheck } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [showIOSGuide, setShowIOSGuide] = useState<boolean>(false);
  const [installedSuccess, setInstalledSuccess] = useState<boolean>(false);

  useEffect(() => {
    // Check if running in standalone PWA mode
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (navigator as any).standalone === true;
      setIsStandalone(isStandaloneMode);
    };

    checkStandalone();

    // Check if iOS
    const ua = window.navigator.userAgent;
    const isIOSDevice = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);

      // Check if user dismissed recently
      const lastDismissed = localStorage.getItem('pwa_prompt_dismissed');
      if (!lastDismissed || Date.now() - parseInt(lastDismissed, 10) > 24 * 60 * 60 * 1000) {
        setShowBanner(true);
      }
    };

    const handleAppInstalled = () => {
      setInstalledSuccess(true);
      setShowBanner(false);
      setDeferredPrompt(null);
      setTimeout(() => setInstalledSuccess(false), 5000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    const handleCustomTrigger = () => {
      setShowBanner(true);
      if (isIOSDevice && !isStandalone) {
        setShowIOSGuide(true);
      }
    };
    window.addEventListener('trigger-pwa-install', handleCustomTrigger);

    // If iOS and not standalone and not dismissed, show iOS banner option
    if (isIOSDevice && !isStandalone) {
      const lastDismissed = localStorage.getItem('pwa_prompt_dismissed');
      if (!lastDismissed || Date.now() - parseInt(lastDismissed, 10) > 24 * 60 * 60 * 1000) {
        setShowBanner(true);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('trigger-pwa-install', handleCustomTrigger);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    if (!deferredPrompt) return;

    // Show native browser install prompt
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('[PWA] User accepted install prompt');
      setInstalledSuccess(true);
    }

    setDeferredPrompt(null);
    setShowBanner(false);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setShowIOSGuide(false);
    localStorage.setItem('pwa_prompt_dismissed', Date.now().toString());
  };

  if (isStandalone) return null;

  return (
    <>
      {/* SUCCESS INSTALLATION TOAST */}
      {installedSuccess && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] bg-[#063104] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-emerald-500/40 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-bold">
            Aplikasi Wareoengkita berhasil terpasang di Layar Utama Anda!
          </span>
        </div>
      )}

      {/* FLOATING PWA INSTALL BANNER */}
      {showBanner && !showIOSGuide && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-[90] bg-gradient-to-r from-emerald-950 via-[#063104] to-emerald-900 text-white rounded-2xl p-4 shadow-2xl border border-emerald-500/30 backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0 shadow-inner">
                <img src="/pwa-icon.svg" alt="Wareoengkita App" className="w-9 h-9 object-contain" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="font-extrabold text-white text-sm">Download App Wareoengkita</h4>
                  <span className="bg-emerald-500/30 text-emerald-300 text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                    Cepat & Ringan
                  </span>
                </div>
                <p className="text-xs text-emerald-200/90 mt-0.5 leading-snug">
                  Pasang di layar utama HP/PC Anda. Akses tanpa browser & berjalan lebih cepat!
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDismiss}
              className="text-white/60 hover:text-white p-1 transition-colors shrink-0"
              aria-label="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3.5 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-300 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Gratis & Bebas Iklan</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDismiss}
                className="text-xs font-semibold text-emerald-200 hover:text-white px-2.5 py-1.5 rounded-lg transition-colors"
              >
                Nanti
              </button>
              <button
                type="button"
                onClick={handleInstallClick}
                className="bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-extrabold text-xs px-3.5 py-2 rounded-xl shadow-md flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Install Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IOS SAFARI INSTALLATION GUIDE MODAL */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-md w-full text-gray-900 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2 text-[#063104]">
                <Smartphone className="w-5 h-5" />
                <h3 className="font-extrabold text-base">Cara Install di iOS / iPhone</h3>
              </div>
              <button
                type="button"
                onClick={handleDismiss}
                className="p-1 text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-gray-600 font-medium">
                Untuk memasang aplikasi Wareoengkita di Layar Utama iPhone/iPad Anda, ikuti 2 langkah mudah berikut:
              </p>

              <div className="bg-emerald-50 rounded-2xl p-3.5 border border-emerald-200/80 flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-[#063104] text-white font-bold flex items-center justify-center shrink-0 text-xs">
                  1
                </div>
                <div>
                  <p className="font-bold text-gray-900 flex items-center gap-1">
                    Tekan Tombol Share <Share className="w-4 h-4 text-blue-600 inline" />
                  </p>
                  <p className="text-gray-600 mt-0.5">
                    Ketuk icon <span className="font-bold text-gray-800">Bagikan (Share)</span> di bilah bawah browser Safari Anda.
                  </p>
                </div>
              </div>

              <div className="bg-emerald-50 rounded-2xl p-3.5 border border-emerald-200/80 flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-[#063104] text-white font-bold flex items-center justify-center shrink-0 text-xs">
                  2
                </div>
                <div>
                  <p className="font-bold text-gray-900">
                    Pilih "Tambahkan ke Layar Utama"
                  </p>
                  <p className="text-gray-600 mt-0.5">
                    Gulir opsi ke bawah lalu ketuk <span className="font-bold text-gray-800">"Tambahkan ke Layar Utama" ("Add to Home Screen")</span>.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleDismiss}
                className="w-full bg-[#063104] text-white font-bold py-3 rounded-xl text-xs shadow-md"
              >
                Saya Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

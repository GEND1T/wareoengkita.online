import React from 'react';
import { Loader2, CheckCircle2, Sparkles } from 'lucide-react';

interface ProcessingOverlayProps {
  isOpen: boolean;
  title?: string;
  subtitle?: string;
  isSuccess?: boolean;
}

export const ProcessingOverlay: React.FC<ProcessingOverlayProps> = ({
  isOpen,
  title = 'Memproses Permintaan...',
  subtitle = 'Harap tunggu sebentar, data sedang disinkronkan dengan server.',
  isSuccess = false,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[4000] bg-black/50 flex items-center justify-center p-4 animate-fade-in"
      style={{ backdropFilter: 'blur(5px)' }}
    >
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-gray-100 flex flex-col items-center text-center space-y-4 animate-scale-up">
        {isSuccess ? (
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#063104] flex items-center justify-center animate-bounce">
            <CheckCircle2 className="w-10 h-10" />
          </div>
        ) : (
          <div className="relative flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-[#063104] animate-spin" />
            </div>
            <Sparkles className="w-5 h-5 text-amber-500 absolute -top-1 -right-1 animate-pulse" />
          </div>
        )}

        <div className="space-y-1">
          <h4 className="font-extrabold text-gray-900 text-base">{title}</h4>
          <p className="text-xs text-gray-500 leading-relaxed">{subtitle}</p>
        </div>

        {!isSuccess && (
          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-[#063104] h-full rounded-full animate-pulse w-3/4" />
          </div>
        )}
      </div>
    </div>
  );
};

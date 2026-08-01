import { create } from 'zustand';

interface ServerStatusState {
  isDisconnected: boolean;
  errorMessage: string;
  setDisconnected: (disconnected: boolean, message?: string) => void;
  resetStatus: () => void;
}

export const useServerStatusStore = create<ServerStatusState>((set) => ({
  isDisconnected: false,
  errorMessage: '',
  setDisconnected: (disconnected: boolean, message?: string) =>
    set({
      isDisconnected: disconnected,
      errorMessage: message || 'Koneksi ke server database terputus.',
    }),
  resetStatus: () => set({ isDisconnected: false, errorMessage: '' }),
}));

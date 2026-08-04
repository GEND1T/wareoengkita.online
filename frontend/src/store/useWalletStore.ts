import { create } from 'zustand';
import { API_BASE_URL } from '../config/api';
import type { Withdrawal, BalanceMutation } from '../types';

interface WalletState {
  activeBalance: number;
  bankName: string;
  bankAccountNumber: string;
  bankAccountHolder: string;
  mutations: BalanceMutation[];
  withdrawals: Withdrawal[];
  isLoading: boolean;
  isSubmitting: boolean;
  toastMessage: string | null;
  errorMessage: string | null;

  fetchWalletData: (storeId?: string) => Promise<void>;
  updateBankDetails: (details: { bankName: string; bankAccountNumber: string; bankAccountHolder: string }, storeId?: string) => Promise<boolean>;
  requestWithdrawal: (amount: number, bankDetails?: { bankName: string; bankAccountNumber: string; bankAccountHolder: string }, storeId?: string) => Promise<boolean>;
  showToast: (msg: string) => void;
  clearToast: () => void;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  activeBalance: 0,
  bankName: 'BCA',
  bankAccountNumber: '8820194819',
  bankAccountHolder: 'Toko Sayur Organik',
  mutations: [],
  withdrawals: [],
  isLoading: false,
  isSubmitting: false,
  toastMessage: null,
  errorMessage: null,

  showToast: (msg: string) => set({ toastMessage: msg }),
  clearToast: () => set({ toastMessage: null }),

  fetchWalletData: async (storeId?: string) => {
    set({ isLoading: true, errorMessage: null });
    try {
      const targetStoreId = storeId || 'store-1';
      
      const [walletRes, historyRes] = await Promise.all([
        fetch(`${API_BASE_URL}/withdrawals/wallet-info?storeId=${encodeURIComponent(targetStoreId)}`),
        fetch(`${API_BASE_URL}/withdrawals/history?storeId=${encodeURIComponent(targetStoreId)}`),
      ]);

      const walletJson = await walletRes.json();
      const historyJson = await historyRes.json();

      if (walletJson.success && walletJson.data) {
        set({
          activeBalance: walletJson.data.activeBalance || 0,
          bankName: walletJson.data.bankName || 'BCA',
          bankAccountNumber: walletJson.data.bankAccountNumber || '8820194819',
          bankAccountHolder: walletJson.data.bankAccountHolder || 'Toko Sayur Organik',
          mutations: walletJson.data.mutations || [],
        });
      }

      if (historyJson.success && Array.isArray(historyJson.data)) {
        set({ withdrawals: historyJson.data });
      }
    } catch (err: any) {
      console.error('Failed to fetch wallet data:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  updateBankDetails: async (details, storeId?: string) => {
    set({ isSubmitting: true, errorMessage: null });
    try {
      const res = await fetch(`${API_BASE_URL}/withdrawals/bank-details`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...details, storeId }),
      });
      const json = await res.json();
      if (json.success) {
        set({
          bankName: details.bankName,
          bankAccountNumber: details.bankAccountNumber,
          bankAccountHolder: details.bankAccountHolder,
          toastMessage: 'Rekening bank pencairan berhasil diperbarui!',
        });
        return true;
      } else {
        set({ errorMessage: json.message || 'Gagal memperbarui data rekening.' });
        return false;
      }
    } catch (err: any) {
      set({ errorMessage: 'Terjadi kesalahan jaringan.' });
      return false;
    } finally {
      set({ isSubmitting: false });
    }
  },

  requestWithdrawal: async (amount, bankDetails, storeId?: string) => {
    set({ isSubmitting: true, errorMessage: null });
    try {
      const payload = {
        amount,
        storeId,
        bankCode: bankDetails?.bankName || get().bankName,
        bankAccountNumber: bankDetails?.bankAccountNumber || get().bankAccountNumber,
        bankAccountHolder: bankDetails?.bankAccountHolder || get().bankAccountHolder,
      };

      const res = await fetch(`${API_BASE_URL}/withdrawals/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        set({ toastMessage: json.message });
        await get().fetchWalletData(storeId);
        return true;
      } else {
        set({ errorMessage: json.message || 'Gagal mengajukan penarikan dana.' });
        return false;
      }
    } catch (err: any) {
      set({ errorMessage: 'Terjadi kesalahan jaringan saat penarikan dana.' });
      return false;
    } finally {
      set({ isSubmitting: false });
    }
  },
}));

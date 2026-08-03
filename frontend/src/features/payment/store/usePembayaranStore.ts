import { create } from 'zustand';
import { API_BASE_URL } from '../../../config/api';

export interface DuitkuPaymentMethod {
  paymentMethod: string;
  paymentName: string;
  paymentImage: string;
  totalFee: string;
}

export interface PaymentData {
  id: string;
  merchantOrderId: string;
  reference?: string;
  paymentMethod: string;
  paymentName?: string;
  paymentAmount: number;
  paymentFee?: number;
  vaNumber?: string;
  qrString?: string;
  paymentUrl?: string;
  statusCode: string; // "00"=Success, "01"=Pending, "02"=Canceled
  statusMessage: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  productDetails?: string;
  isPaymentLink?: boolean;
  linkToken?: string;
  linkExpiry?: string;
  itemsJson?: string;
  createdAt: string;
}

interface PembayaranState {
  paymentMethods: DuitkuPaymentMethod[];
  isLoadingMethods: boolean;
  methodsError: string | null;

  activePayment: PaymentData | null;
  isCreatingPayment: boolean;
  createError: string | null;

  activeStep: 'select' | 'confirm' | 'success' | 'failed';
  isPaymentModalOpen: boolean;

  fetchPaymentMethods: (amount: number) => Promise<void>;
  createPayment: (payload: {
    orderId?: string;
    paymentMethod: string;
    paymentAmount: number;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    productDetails?: string;
    storeId?: string;
    items?: any[];
    shippingAddress?: string;
  }) => Promise<PaymentData | null>;
  checkStatus: (merchantOrderId: string) => Promise<PaymentData | null>;
  openPaymentModal: () => void;
  closePaymentModal: () => void;
  setActiveStep: (step: 'select' | 'confirm' | 'success' | 'failed') => void;
  setActivePayment: (payment: PaymentData | null) => void;
  resetPaymentState: () => void;
}

export const usePembayaranStore = create<PembayaranState>((set) => ({
  paymentMethods: [],
  isLoadingMethods: false,
  methodsError: null,

  activePayment: null,
  isCreatingPayment: false,
  createError: null,

  activeStep: 'select',
  isPaymentModalOpen: false,

  fetchPaymentMethods: async (amount: number) => {
    set({ isLoadingMethods: true, methodsError: null });
    try {
      const res = await fetch(`${API_BASE_URL}/pembayaran/methods?amount=${amount}`);
      const data = await res.json();
      if (data.success) {
        set({ paymentMethods: data.data || [], isLoadingMethods: false });
      } else {
        set({ methodsError: data.message || 'Gagal memuat metode pembayaran', isLoadingMethods: false });
      }
    } catch (err: any) {
      set({ methodsError: err.message || 'Terjadi kesalahan koneksi', isLoadingMethods: false });
    }
  },

  createPayment: async (payload) => {
    set({ isCreatingPayment: true, createError: null });
    try {
      const token = localStorage.getItem('organik_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE_URL}/pembayaran/create`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        set({
          activePayment: data.data,
          isCreatingPayment: false,
          activeStep: 'confirm',
        });
        return data.data;
      } else {
        set({ createError: data.message || 'Gagal membuat pembayaran', isCreatingPayment: false });
        return null;
      }
    } catch (err: any) {
      set({ createError: err.message || 'Koneksi gagal', isCreatingPayment: false });
      return null;
    }
  },

  checkStatus: async (merchantOrderId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/pembayaran/status/${merchantOrderId}`);
      const data = await res.json();
      if (data.success) {
        set({ activePayment: data.data });
        if (data.data.statusCode === '00') {
          set({ activeStep: 'success' });
        } else if (data.data.statusCode === '02') {
          set({ activeStep: 'failed' });
        }
        return data.data;
      }
      return null;
    } catch (err) {
      return null;
    }
  },

  openPaymentModal: () => set({ isPaymentModalOpen: true }),
  closePaymentModal: () => set({ isPaymentModalOpen: false }),
  setActiveStep: (step) => set({ activeStep: step }),
  setActivePayment: (payment) => set({ activePayment: payment }),
  resetPaymentState: () =>
    set({
      activePayment: null,
      activeStep: 'select',
      createError: null,
      methodsError: null,
    }),
}));

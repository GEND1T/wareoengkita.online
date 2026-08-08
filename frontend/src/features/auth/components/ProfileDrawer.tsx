import React, { useState, useEffect } from 'react';
import { Drawer, IconButton, Divider } from '@mui/material';
import {
  X,
  User,
  Package,
  Calendar,
  Phone,
  CheckCircle2,
  Clock,
  Truck,
  RotateCcw,
  XCircle,
  Save,
  ChevronRight,
  ArrowLeft,
  ShoppingBag,
  CreditCard,
  Receipt,
  Sparkles,
  MapPin,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Store,
  Download,
  CornerDownRight,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUserStore, type OrderStatus, type Order } from '../store/useUserStore';
import { useLocationStore } from '../../store-location/store/useLocationStore';
import { useAdminStore } from '../../admin/store/useAdminStore';
import { StoreRegistrationModal } from './StoreRegistrationModal';
import { OrderTrackingModal } from '../../checkout/components/OrderTrackingModal';
import { OrderDetailModal } from '../../checkout/components/OrderDetailModal';
import { usePembayaranStore } from '../../payment/store/usePembayaranStore';
import { PaymentConfirmPage } from '../../payment/pages/PaymentConfirmPage';
import { PaymentSuccessPage } from '../../payment/pages/PaymentSuccessPage';
import { API_BASE_URL } from '../../../config/api';

interface ProfileDrawerProps {
  onOpenSupport?: () => void;
}

const profileSchema = z.object({
  fullName: z.string().min(3, 'Nama lengkap minimal 3 karakter'),
  username: z.string().min(3, 'Username minimal 3 karakter'),
  phone: z
    .string()
    .min(9, 'Nomor telepon minimal 9 digit')
    .regex(/^[0-9+-\s]+$/, 'Format nomor telepon tidak valid'),
  gender: z.enum(['Laki-laki', 'Perempuan']),
  birthDate: z.string().min(4, 'Tanggal lahir wajib diisi'),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const STATUS_FILTERS: { key: OrderStatus | 'semua'; label: string; icon: React.ReactNode }[] = [
  { key: 'semua', label: 'Semua', icon: <Receipt className="w-3.5 h-3.5" /> },
  { key: 'belum_bayar', label: 'Belum Bayar', icon: <Clock className="w-3.5 h-3.5" /> },
  { key: 'dikemas', label: 'Dikemas', icon: <Package className="w-3.5 h-3.5" /> },
  { key: 'dikirim', label: 'Dikirim', icon: <Truck className="w-3.5 h-3.5" /> },
  { key: 'selesai', label: 'Selesai', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  { key: 'pengembalian', label: 'Pengembalian', icon: <RotateCcw className="w-3.5 h-3.5" /> },
  { key: 'dibatalkan', label: 'Dibatalkan', icon: <XCircle className="w-3.5 h-3.5" /> },
];

const OrderCountdownTimer: React.FC<{
  createdAt?: string;
  linkExpiry?: string;
  expiryPeriod?: number;
  onExpired?: () => void;
}> = ({ createdAt, linkExpiry, expiryPeriod, onExpired }) => {
  const [secondsLeft, setSecondsLeft] = useState<number>(() => {
    if (linkExpiry) {
      const expiryTime = new Date(linkExpiry).getTime();
      const diff = Math.floor((expiryTime - Date.now()) / 1000);
      return diff > 0 ? diff : 0;
    }
    if (createdAt) {
      const createdTime = new Date(createdAt).getTime();
      const mins = expiryPeriod || 1440;
      const expiryTime = createdTime + mins * 60 * 1000;
      const diff = Math.floor((expiryTime - Date.now()) / 1000);
      return diff > 0 ? diff : 0;
    }
    return 24 * 3600;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (onExpired) onExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onExpired]);

  const hrs = Math.floor(secondsLeft / 3600);
  const mins = Math.floor((secondsLeft % 3600) / 60);
  const secs = secondsLeft % 60;
  const timeStr = `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  if (secondsLeft <= 0) {
    return (
      <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 flex items-center gap-1">
        <XCircle className="w-3 h-3 text-rose-600" />
        Waktu Pembayaran Habis
      </span>
    );
  }

  return (
    <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/80 flex items-center gap-1">
      <Clock className="w-3 h-3 text-amber-600 animate-pulse" />
      <span>Batas Bayar: {timeStr}</span>
    </span>
  );
};

export const ProfileDrawer: React.FC<ProfileDrawerProps> = ({ onOpenSupport }) => {
  const {
    profile,
    orders,
    isProfileDrawerOpen,
    closeProfileDrawer,
    selectedOrderStatusFilter,
    setSelectedOrderStatusFilter,
    skipProfileAnimation,
    setSkipProfileAnimation,
    updateProfile,
    fetchUserOrders,
    logout,
  } = useUserStore();

  const { openAdmin, unreadNewOrdersCount } = useAdminStore();
  const { showToast, openLocationDrawer, getSelectedAddress } = useLocationStore();
  const activeAddress = getSelectedAddress();

  // Active subview overlay: null (Main Dashboard), 'editProfile', or 'orders'
  const [activeSubView, setActiveSubView] = useState<'editProfile' | 'orders' | null>(null);
  const [isStoreRegistrationOpen, setIsStoreRegistrationOpen] = useState(false);
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);
  const [selectedDetailOrder, setSelectedDetailOrder] = useState<Order | null>(null);

  const { setActivePayment } = usePembayaranStore();
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  const handlePayNow = (order: Order) => {
    const paymentObj = order.payments && order.payments.length > 0 ? order.payments[0] : null;
    if (paymentObj) {
      setActivePayment({
        id: paymentObj.id,
        merchantOrderId: paymentObj.merchantOrderId,
        reference: paymentObj.reference || undefined,
        paymentMethod: paymentObj.paymentMethod,
        paymentAmount: paymentObj.paymentAmount,
        vaNumber: paymentObj.vaNumber || undefined,
        qrString: paymentObj.qrString || undefined,
        paymentUrl: paymentObj.paymentUrl || undefined,
        statusCode: paymentObj.statusCode || '01',
        statusMessage: paymentObj.statusMessage || 'PENDING',
        customerName: profile.fullName,
        customerEmail: profile.email,
        customerPhone: profile.phone,
        productDetails: `Pesanan ${order.orderNo}`,
        createdAt: paymentObj.createdAt || new Date().toISOString(),
        expiryPeriod: paymentObj.expiryPeriod || 1440,
        linkExpiry: paymentObj.linkExpiry || undefined,
      });
    } else {
      setActivePayment({
        id: order.id,
        merchantOrderId: order.orderNo,
        paymentMethod: order.paymentMethod || 'Duitku',
        paymentAmount: order.totalAmount,
        statusCode: '01',
        statusMessage: 'PENDING',
        customerName: profile.fullName,
        customerEmail: profile.email,
        customerPhone: profile.phone,
        productDetails: `Pesanan ${order.orderNo}`,
        createdAt: order.createdAt || new Date().toISOString(),
      });
    }
    setIsConfirmModalOpen(true);
  };

  const handleOrderExpired = async (orderId: string) => {
    try {
      await fetch(`${API_BASE_URL}/orders/admin/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      });
      fetchUserOrders(profile.id || profile.phone);
    } catch (e) {
      console.error('Failed to expire order:', e);
    }
  };

  const appVersion = import.meta.env.VITE_APP_VERSION || '1.0.0';

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: profile,
  });

  const selectedGender = watch('gender');

  useEffect(() => {
    if (isProfileDrawerOpen || activeSubView === 'orders') {
      const userIdent = profile.id || profile.phone;
      fetchUserOrders(userIdent);
    }
  }, [isProfileDrawerOpen, activeSubView, profile.id, profile.phone, fetchUserOrders]);

  // Sync form values when profile store updates
  useEffect(() => {
    setValue('fullName', profile.fullName);
    setValue('username', profile.username);
    setValue('phone', profile.phone);
    setValue('gender', profile.gender);
    setValue('birthDate', profile.birthDate);
  }, [profile, setValue]);

  // Reset active sub-view when drawer is closed
  useEffect(() => {
    if (!isProfileDrawerOpen) {
      setActiveSubView(null);
    }
  }, [isProfileDrawerOpen]);

  const onProfileSubmit = (data: ProfileFormData) => {
    updateProfile(data);
    setActiveSubView(null);
    showToast('Profil akun berhasil diperbarui!');
  };

  const handleOpenLocation = () => {
    setSkipProfileAnimation(true);
    openLocationDrawer();
  };

  // Order Counts for Badges
  const countBelumBayar = orders.filter((o) => o.status === 'belum_bayar').length;
  const countDikemas = orders.filter((o) => o.status === 'dikemas').length;
  const countDikirim = orders.filter((o) => o.status === 'dikirim').length;
  const countSemua = orders.length;

  const filteredOrders =
    selectedOrderStatusFilter === 'semua'
      ? orders
      : orders.filter((o) => o.status === selectedOrderStatusFilter);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    })
      .format(amount)
      .replace(/\s/g, ' ');

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'belum_bayar':
        return (
          <span className="bg-amber-50 text-amber-800 border border-amber-200/80 font-semibold px-2.5 py-0.5 rounded-full text-[10px] flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-700" /> Belum Bayar
          </span>
        );
      case 'dikemas':
        return (
          <span className="bg-blue-50 text-blue-800 border border-blue-200/80 font-semibold px-2.5 py-0.5 rounded-full text-[10px] flex items-center gap-1">
            <Package className="w-3 h-3 text-blue-700" /> Dikemas
          </span>
        );
      case 'dikirim':
        return (
          <span className="bg-indigo-50 text-indigo-800 border border-indigo-200/80 font-semibold px-2.5 py-0.5 rounded-full text-[10px] flex items-center gap-1">
            <Truck className="w-3 h-3 text-indigo-700" /> Dikirim
          </span>
        );
      case 'selesai':
        return (
          <span className="bg-emerald-50 text-[#063104] border border-emerald-200/80 font-semibold px-2.5 py-0.5 rounded-full text-[10px] flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-[#063104]" /> Selesai
          </span>
        );
      case 'pengembalian':
        return (
          <span className="bg-purple-50 text-purple-800 border border-purple-200/80 font-semibold px-2.5 py-0.5 rounded-full text-[10px] flex items-center gap-1">
            <RotateCcw className="w-3 h-3 text-purple-700" /> Pengembalian
          </span>
        );
      case 'dibatalkan':
        return (
          <span className="bg-rose-50 text-rose-800 border border-rose-200/80 font-semibold px-2.5 py-0.5 rounded-full text-[10px] flex items-center gap-1">
            <XCircle className="w-3 h-3 text-rose-700" /> Dibatalkan
          </span>
        );
    }
  };

  const openOrderHistoryWithFilter = (status: OrderStatus | 'semua') => {
    setSelectedOrderStatusFilter(status);
    setActiveSubView('orders');
  };

  return (
    <Drawer
      anchor="right"
      open={isProfileDrawerOpen}
      onClose={closeProfileDrawer}
      transitionDuration={skipProfileAnimation ? 0 : { enter: 225, exit: 225 }}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100%', sm: '460px' },
            backgroundColor: '#F8FAFC',
            p: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          },
        },
      }}
    >
      <div className="relative w-full h-full flex flex-col p-4 sm:p-5 overflow-hidden">
        {/* ========================================== */}
        {/* BASE LAYER: MAIN PROFILE DASHBOARD VIEW   */}
        {/* ========================================== */}
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header Bar */}
          <div className="flex items-center justify-between pb-3.5 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#063104] flex items-center justify-center border border-emerald-100">
                <User className="w-5 h-5 stroke-[1.8]" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-lg leading-tight">Profil Saya</h2>
                <p className="text-[11px] text-gray-500 font-medium">Pengaturan & Informasi Akun</p>
              </div>
            </div>
            <IconButton
              onClick={closeProfileDrawer}
              size="small"
              className="bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </IconButton>
          </div>

          <Divider className="my-1.5 border-gray-200/60 shrink-0" />

          {/* Main Dashboard Scrollable Content */}
          <div className="flex-1 overflow-y-auto space-y-4.5 pt-3 pr-1 pb-4 scrollbar-thin">
            {/* 1. TOP PROFILE HERO CARD (Clean White) */}
            <div
              onClick={() => setActiveSubView('editProfile')}
              className="bg-white rounded-2xl p-4.5 border border-gray-100 shadow-sm hover:border-[#77a160]/40 hover:shadow-md transition-all cursor-pointer group flex items-center justify-between gap-3.5"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-full bg-[#063104] text-white font-bold text-lg flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  {profile.fullName ? profile.fullName.charAt(0).toUpperCase() : 'A'}
                </div>
                <div className="min-w-0 space-y-1">
                  <h3 className="font-bold text-gray-900 text-base leading-tight">
                    {profile.fullName}
                  </h3>
                  <div>
                    {profile.role === 'superadmin' ? (
                      <span className="inline-block bg-purple-50 text-purple-800 border border-purple-200/70 text-[11px] font-medium px-2.5 py-0.5 rounded-full">
                        Superadmin Platform
                      </span>
                    ) : profile.role === 'admin_store' ? (
                      <span className="inline-block bg-blue-50 text-blue-800 border border-blue-200/70 text-[11px] font-medium px-2.5 py-0.5 rounded-full">
                        Admin Toko ({profile.assignedStoreName || 'test'})
                      </span>
                    ) : (
                      <span className="inline-block bg-emerald-50 text-[#063104] text-[11px] font-medium px-2.5 py-0.5 rounded-full border border-emerald-200/60">
                        Pelanggan Organik
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#063104] group-hover:translate-x-0.5 transition-all shrink-0" />
            </div>

            {/* 2. ALAMAT PENGIRIMAN SAYA CARD (Clean White) */}
            <div
              onClick={handleOpenLocation}
              className="bg-white rounded-2xl p-4.5 border border-gray-100 shadow-sm hover:border-[#77a160]/40 hover:shadow-md transition-all cursor-pointer group flex items-center justify-between gap-3.5"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#063104] font-medium flex items-center justify-center shrink-0 group-hover:bg-[#063104] group-hover:text-white transition-colors">
                  <MapPin className="w-5 h-5 stroke-[1.8]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-gray-900 text-xs">Alamat Pengiriman</h4>
                    {activeAddress && (
                      <span className="bg-emerald-50 text-[#063104] border border-emerald-200/60 text-[10px] font-semibold px-2 py-0.5 rounded-md">
                        {activeAddress.label}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1 leading-normal">
                    {activeAddress
                      ? `${activeAddress.streetAddress}, ${activeAddress.city}`
                      : 'Pilih atau atur alamat pengiriman'}
                  </p>
                </div>
              </div>

              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#063104] group-hover:translate-x-0.5 transition-all shrink-0" />
            </div>

            {/* 3. DAFTAR / BUKA TOKO SAYA CARD (Clean White, Only for Customer Role) */}
            {profile.role === 'customer' && (
              <div
                onClick={() => setIsStoreRegistrationOpen(true)}
                className="bg-white rounded-2xl p-4.5 border border-gray-100 shadow-sm hover:border-[#77a160]/40 hover:shadow-md transition-all cursor-pointer group flex items-center justify-between gap-3.5"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#063104] font-medium flex items-center justify-center shrink-0 group-hover:bg-[#063104] group-hover:text-white transition-colors">
                    <Store className="w-5 h-5 stroke-[1.8]" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                      Daftar / Buka Toko Saya
                      <span className="bg-emerald-100 text-[#063104] text-[9px] font-bold px-1.5 py-0.5 rounded">
                        GRATIS
                      </span>
                    </h4>
                    <p className="text-xs text-gray-500 mt-1 leading-normal">
                      Ajukan pendaftaran cabang toko & jual produk Anda
                    </p>
                  </div>
                </div>

                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#063104] group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>
            )}

            {/* 4. PESANAN SAYA (Title Case, Clean White, Minimalist Line Icons) */}
            <div className="bg-white rounded-2xl p-4.5 border border-gray-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
                <div className="flex items-center gap-2 text-gray-900 font-bold text-xs">
                  <Package className="w-4 h-4 text-[#063104] stroke-[2]" />
                  <span>Pesanan Saya</span>
                </div>
                <button
                  type="button"
                  onClick={() => openOrderHistoryWithFilter('semua')}
                  className="text-xs font-semibold text-[#063104] hover:underline flex items-center gap-0.5"
                >
                  <span>Lihat Semua</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* 4 Minimalist Line Icons - Backgrounds blend into clean white card */}
              <div className="grid grid-cols-4 gap-2 pt-1">
                {/* 1. Belum Bayar */}
                <button
                  type="button"
                  onClick={() => openOrderHistoryWithFilter('belum_bayar')}
                  className="relative flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-transparent hover:bg-gray-50/80 transition-all text-gray-700 group focus:outline-none cursor-pointer"
                >
                  {countBelumBayar > 0 && (
                    <span className="absolute top-0 right-3.5 bg-amber-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                      {countBelumBayar}
                    </span>
                  )}
                  <div className="mb-2 text-gray-600 group-hover:text-[#063104] group-hover:scale-110 transition-all">
                    <Clock className="w-6 h-6 stroke-[1.75]" />
                  </div>
                  <span className="text-[11px] font-medium text-gray-700 text-center leading-tight">
                    Belum Bayar
                  </span>
                </button>

                {/* 2. Dikemas */}
                <button
                  type="button"
                  onClick={() => openOrderHistoryWithFilter('dikemas')}
                  className="relative flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-transparent hover:bg-gray-50/80 transition-all text-gray-700 group focus:outline-none cursor-pointer"
                >
                  {countDikemas > 0 && (
                    <span className="absolute top-0 right-3.5 bg-blue-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                      {countDikemas}
                    </span>
                  )}
                  <div className="mb-2 text-gray-600 group-hover:text-[#063104] group-hover:scale-110 transition-all">
                    <Package className="w-6 h-6 stroke-[1.75]" />
                  </div>
                  <span className="text-[11px] font-medium text-gray-700 text-center leading-tight">
                    Dikemas
                  </span>
                </button>

                {/* 3. Dikirim */}
                <button
                  type="button"
                  onClick={() => openOrderHistoryWithFilter('dikirim')}
                  className="relative flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-transparent hover:bg-gray-50/80 transition-all text-gray-700 group focus:outline-none cursor-pointer"
                >
                  {countDikirim > 0 && (
                    <span className="absolute top-0 right-3.5 bg-indigo-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                      {countDikirim}
                    </span>
                  )}
                  <div className="mb-2 text-gray-600 group-hover:text-[#063104] group-hover:scale-110 transition-all">
                    <Truck className="w-6 h-6 stroke-[1.75]" />
                  </div>
                  <span className="text-[11px] font-medium text-gray-700 text-center leading-tight">
                    Dikirim
                  </span>
                </button>

                {/* 4. Semua */}
                <button
                  type="button"
                  onClick={() => openOrderHistoryWithFilter('semua')}
                  className="relative flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-transparent hover:bg-gray-50/80 transition-all text-gray-700 group focus:outline-none cursor-pointer"
                >
                  {countSemua > 0 && (
                    <span className="absolute top-0 right-3.5 bg-emerald-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                      {countSemua}
                    </span>
                  )}
                  <div className="mb-2 text-gray-600 group-hover:text-[#063104] group-hover:scale-110 transition-all">
                    <Receipt className="w-6 h-6 stroke-[1.75]" />
                  </div>
                  <span className="text-[11px] font-medium text-gray-700 text-center leading-tight">
                    Semua
                  </span>
                </button>
              </div>
            </div>

            {/* 5. DASHBOARD ADMIN CARD (Standard Clean White Card) */}
            {(profile.role === 'admin_store' || profile.role === 'superadmin') && (
              <div
                onClick={() => {
                  closeProfileDrawer();
                  openAdmin();
                }}
                className="bg-white rounded-2xl p-4.5 border border-gray-100 shadow-sm hover:border-[#77a160]/40 hover:shadow-md transition-all cursor-pointer group flex items-center justify-between gap-3.5"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="relative w-10 h-10 rounded-xl bg-emerald-50 text-[#063104] font-medium flex items-center justify-center shrink-0 group-hover:bg-[#063104] group-hover:text-white transition-colors">
                    <LayoutDashboard className="w-5 h-5 stroke-[1.8]" />
                    {unreadNewOrdersCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 rounded-full border-2 border-white" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                      Dashboard Admin
                      <span className="bg-amber-100 text-amber-900 text-[9px] font-bold px-1.5 py-0.5 rounded">
                        {profile.role === 'superadmin' ? 'Superadmin' : 'Admin Toko'}
                      </span>
                    </h4>
                    <p className="text-xs text-gray-500 mt-1 leading-normal">
                      {profile.role === 'superadmin'
                        ? 'Kelola Produk, Pesanan, Multi-Store & System'
                        : `Kelola ${profile.assignedStoreName || 'Toko Cabang'}`}
                    </p>
                  </div>
                </div>

                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#063104] group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>
            )}

            {/* 6. DOWNLOAD / INSTALL PWA APP CARD (Standard Clean White Card) */}
            <div
              onClick={() => {
                closeProfileDrawer();
                window.dispatchEvent(new Event('trigger-pwa-install'));
              }}
              className="bg-white rounded-2xl p-4.5 border border-gray-100 shadow-sm hover:border-[#77a160]/40 hover:shadow-md transition-all cursor-pointer group flex items-center justify-between gap-3.5"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#063104] font-medium flex items-center justify-center shrink-0 group-hover:bg-[#063104] group-hover:text-white transition-colors">
                  <Download className="w-5 h-5 stroke-[1.8]" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                    Install Aplikasi WaroengKita
                    <span className="bg-emerald-100 text-[#063104] text-[9px] font-bold px-1.5 py-0.5 rounded">
                      MOBILE & PC
                    </span>
                  </h4>
                  <p className="text-xs text-gray-500 mt-1 leading-normal">
                    Pasang di Layar Utama HP & komputer Anda untuk akses cepat layaknya aplikasi native
                  </p>
                </div>
              </div>

              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#063104] group-hover:translate-x-0.5 transition-all shrink-0" />
            </div>

            {/* 7. PUSAT BANTUAN & LIVE CHAT CS CARD (Standard Clean White Card) */}
            <div
              onClick={() => {
                if (onOpenSupport) onOpenSupport();
              }}
              className="bg-white rounded-2xl p-4.5 border border-gray-100 shadow-sm hover:border-[#77a160]/40 hover:shadow-md transition-all cursor-pointer group flex items-center justify-between gap-3.5"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#063104] font-medium flex items-center justify-center shrink-0 group-hover:bg-[#063104] group-hover:text-white transition-colors">
                  <HelpCircle className="w-5 h-5 stroke-[1.8]" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-gray-900 text-xs">Pusat Bantuan & Live Chat CS</h4>
                  <p className="text-xs text-gray-500 mt-1 leading-normal">
                    Hubungi WhatsApp CS Toko & temukan jawaban pertanyaan FAQ
                  </p>
                </div>
              </div>

              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#063104] group-hover:translate-x-0.5 transition-all shrink-0" />
            </div>

            {/* 8. LOGOUT BUTTON */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  logout();
                  closeProfileDrawer();
                  showToast('Anda telah keluar dari akun.');
                }}
                className="w-full py-3.5 bg-rose-50/70 hover:bg-rose-100 text-rose-700 border border-rose-200/60 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all active:scale-[0.99] cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar / Logout Akun</span>
              </button>
            </div>

            {/* 9. APP VERSION & FOOTER SECTION */}
            <div className="pt-5 pb-3 flex flex-col items-center justify-center space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-gray-100 text-gray-500 rounded-full text-xs font-medium shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-[#063104]" />
                <span>Versi Aplikasi v{appVersion}</span>
              </div>
              <p className="text-[11px] font-medium text-gray-400">
                © 2026 Waroengkita • Hak Cipta Dilindungi
              </p>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* OVERLAY SUB-PANEL 1: UBAH PROFIL VIEW (SLIDES IN / OUT)       */}
        {/* ============================================================== */}
        <div
          className={`absolute inset-0 bg-[#F8FAFC] p-4 sm:p-5 z-20 flex flex-col transition-transform duration-300 ease-in-out ${activeSubView === 'editProfile' ? 'translate-x-0' : 'translate-x-full pointer-events-none'
            }`}
        >
          {/* Subview Header */}
          <div className="flex items-center justify-between pb-3 shrink-0">
            <div className="flex items-center gap-2">
              <IconButton
                onClick={() => setActiveSubView(null)}
                size="small"
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </IconButton>
              <h2 className="font-bold text-gray-900 text-lg">Ubah Profil Akun</h2>
            </div>
          </div>

          <Divider className="my-1.5 border-gray-200/60 shrink-0" />

          {/* Form Content */}
          <form
            onSubmit={handleSubmit(onProfileSubmit)}
            className="flex-1 flex flex-col justify-between overflow-hidden pt-2"
          >
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4 scrollbar-thin">
              <div className="bg-white rounded-2xl p-4 border border-gray-200/70 shadow-xs space-y-4">
                <div className="flex items-center gap-1.5 pb-2 border-b border-gray-100 text-[#063104] font-extrabold text-xs uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Ubah Informasi Akun</span>
                </div>

                {/* Nama Lengkap */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    {...register('fullName')}
                    placeholder="Nama Lengkap"
                    className="w-full bg-white text-sm rounded-xl px-3.5 py-2.5 border border-gray-200 focus:outline-none focus:border-[#063104] focus:ring-2 focus:ring-[#063104]/20"
                  />
                  {errors.fullName && (
                    <p className="text-red-500 text-[11px] mt-0.5">
                      {errors.fullName.message}
                    </p>
                  )}
                </div>

                {/* Username */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Username Akun
                  </label>
                  <input
                    type="text"
                    {...register('username')}
                    placeholder="Username"
                    className="w-full bg-white text-sm rounded-xl px-3.5 py-2.5 border border-gray-200 focus:outline-none focus:border-[#063104] focus:ring-2 focus:ring-[#063104]/20"
                  />
                  {errors.username && (
                    <p className="text-red-500 text-[11px] mt-0.5">
                      {errors.username.message}
                    </p>
                  )}
                </div>

                {/* No. Handphone */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-gray-500" />
                    No. Handphone
                  </label>
                  <input
                    type="text"
                    {...register('phone')}
                    placeholder="08xxxxxxxxxx"
                    className="w-full bg-white text-sm rounded-xl px-3.5 py-2.5 border border-gray-200 focus:outline-none focus:border-[#063104] focus:ring-2 focus:ring-[#063104]/20"
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-[11px] mt-0.5">
                      {errors.phone.message}
                    </p>
                  )}
                </div>

                {/* Jenis Kelamin */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Jenis Kelamin
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <label
                      className={`cursor-pointer border py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${selectedGender === 'Laki-laki'
                        ? 'border-[#063104] bg-emerald-50 text-[#063104]'
                        : 'border-gray-200 text-gray-700'
                        }`}
                    >
                      <input
                        type="radio"
                        value="Laki-laki"
                        {...register('gender')}
                        className="accent-[#063104]"
                      />
                      <span>Laki-laki</span>
                    </label>

                    <label
                      className={`cursor-pointer border py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${selectedGender === 'Perempuan'
                        ? 'border-[#063104] bg-emerald-50 text-[#063104]'
                        : 'border-gray-200 text-gray-700'
                        }`}
                    >
                      <input
                        type="radio"
                        value="Perempuan"
                        {...register('gender')}
                        className="accent-[#063104]"
                      />
                      <span>Perempuan</span>
                    </label>
                  </div>
                </div>

                {/* Tanggal Lahir */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-gray-500" />
                    Tanggal Lahir
                  </label>
                  <input
                    type="date"
                    {...register('birthDate')}
                    className="w-full bg-white text-sm rounded-xl px-3.5 py-2.5 border border-gray-200 focus:outline-none focus:border-[#063104] focus:ring-2 focus:ring-[#063104]/20"
                  />
                  {errors.birthDate && (
                    <p className="text-red-500 text-[11px] mt-0.5">
                      {errors.birthDate.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-200/80 shrink-0">
              <button
                type="submit"
                className="w-full bg-[#063104] hover:bg-[#084205] text-white font-bold py-3.5 rounded-2xl shadow-md active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-sm focus:outline-none cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Perubahan Profil</span>
              </button>
            </div>
          </form>
        </div>

        {/* ============================================================== */}
        {/* OVERLAY SUB-PANEL 2: PESANAN SAYA VIEW (SLIDES IN / OUT)      */}
        {/* ============================================================== */}
        <div
          className={`absolute inset-0 bg-[#F8FAFC] p-4 sm:p-5 z-20 flex flex-col transition-transform duration-300 ease-in-out ${activeSubView === 'orders' ? 'translate-x-0' : 'translate-x-full pointer-events-none'
            }`}
        >
          {/* Subview Header */}
          <div className="flex items-center justify-between pb-3 shrink-0">
            <div className="flex items-center gap-2">
              <IconButton
                onClick={() => setActiveSubView(null)}
                size="small"
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </IconButton>
              <h2 className="font-bold text-gray-900 text-lg">Pesanan Saya</h2>
            </div>
          </div>

          <Divider className="my-1.5 border-gray-200/60 shrink-0" />

          {/* Horizontally Scrollable Status Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none pr-1 pt-1 shrink-0">
            {STATUS_FILTERS.map((filter) => {
              const isSelected = selectedOrderStatusFilter === filter.key;
              return (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => setSelectedOrderStatusFilter(filter.key)}
                  className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${isSelected
                    ? 'bg-[#063104] text-white shadow-xs'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200/80'
                    }`}
                >
                  {filter.icon}
                  <span>{filter.label}</span>
                </button>
              );
            })}
          </div>

          {/* Filtered Orders List */}
          <div className="flex-1 overflow-y-auto space-y-3.5 my-2 pr-1 scrollbar-thin">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-50 text-[#77a160] flex items-center justify-center mx-auto">
                  <ShoppingBag className="w-7 h-7" />
                </div>
                <p className="text-sm font-semibold text-gray-700">
                  Tidak ada pesanan ditemukan
                </p>
                <p className="text-xs text-gray-400 max-w-xs mx-auto">
                  Belum ada transaksi dengan status yang dipilih saat ini.
                </p>
              </div>
            ) : (
              filteredOrders.map((order) => {
                const hasMultipleItems = order.items && order.items.length > 1;
                const firstItem = order.items?.[0];
                const secondItem = hasMultipleItems ? order.items?.[1] : null;

                return (
                  <div
                    key={order.id}
                    onClick={() => setSelectedDetailOrder(order)}
                    className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-2xs hover:border-emerald-300 hover:shadow-md transition-all duration-200 space-y-3 cursor-pointer group relative overflow-hidden"
                  >
                    {/* Order Header */}
                    <div className="flex items-center justify-between pb-2 border-b border-gray-100 gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-extrabold text-[#063104] text-xs">
                            #{order.orderNo}
                          </span>
                          {order.storeName && (
                            <span className="bg-emerald-50 text-[#063104] text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-emerald-200/80">
                              {order.storeName}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-gray-400 block mt-0.5">
                          {order.date}
                        </span>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {getStatusBadge(order.status)}
                        {order.status === 'belum_bayar' && (
                          <OrderCountdownTimer
                            createdAt={order.createdAt}
                            linkExpiry={order.payments?.[0]?.linkExpiry}
                            expiryPeriod={order.payments?.[0]?.expiryPeriod}
                            onExpired={() => handleOrderExpired(order.id)}
                          />
                        )}
                      </div>
                    </div>

                    {/* Order Items Preview (Fixed Size Layout) */}
                    <div className="space-y-2">
                      {/* Main Product */}
                      {firstItem && (
                        <div className="flex items-center gap-3">
                          <img
                            src={firstItem.image}
                            alt={firstItem.name}
                            className="w-12 h-12 object-contain rounded-xl bg-gray-50 p-1 border border-gray-100 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-extrabold text-gray-900 text-xs truncate">
                              {firstItem.name}
                            </h4>
                            <p className="text-[11px] text-gray-500 mt-0.5 font-medium">
                              {firstItem.quantity} x {formatCurrency(firstItem.price)} ({firstItem.unit})
                            </p>
                          </div>
                          <span className="font-extrabold text-gray-900 text-xs shrink-0">
                            {formatCurrency(firstItem.price * firstItem.quantity)}
                          </span>
                        </div>
                      )}

                      {/* Second Faded Stacked Product if > 1 Item */}
                      {hasMultipleItems && secondItem && (
                        <div className="flex items-center gap-3 opacity-60 group-hover:opacity-85 transition-opacity pt-1">
                          <img
                            src={secondItem.image}
                            alt={secondItem.name}
                            className="w-10 h-10 object-contain rounded-xl bg-gray-50 p-1 border border-gray-100 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-700 text-xs truncate">
                              {secondItem.name}
                            </h4>
                            <p className="text-[10px] text-gray-400">
                              {secondItem.quantity} x {formatCurrency(secondItem.price)}
                            </p>
                          </div>
                          <span className="font-semibold text-gray-500 text-xs shrink-0">
                            {formatCurrency(secondItem.price * secondItem.quantity)}
                          </span>
                        </div>
                      )}

                      {/* Visual "Lihat Semua (N Produk)" Button with Curve Arrow */}
                      {hasMultipleItems && (
                        <div className="pt-1">
                          <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-[#063104] bg-emerald-50/90 group-hover:bg-emerald-100 px-2.5 py-1 rounded-xl border border-emerald-200/80 w-fit shadow-2xs transition-colors">
                            <span>Lihat semua ({order.items.length} produk)</span>
                            <CornerDownRight className="w-3.5 h-3.5 text-[#063104] stroke-[2.5]" />
                          </div>
                        </div>
                      )}
                    </div>

                    <Divider className="my-1 border-gray-100" />

                    {/* Order Footer & Actions */}
                    <div className="flex items-center justify-between pt-0.5">
                      <div>
                        <span className="text-[10px] text-gray-400 block uppercase font-bold tracking-wider">
                          Total Pesanan
                        </span>
                        <span className="font-black text-[#063104] text-sm">
                          {formatCurrency(order.totalAmount)}
                        </span>
                      </div>

                      <div
                        className="flex items-center gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {order.status === 'belum_bayar' && (
                          <button
                            type="button"
                            onClick={() => handlePayNow(order)}
                            className="bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Bayar</span>
                          </button>
                        )}
                        {(order.status === 'dikirim' || order.status === 'dikemas') && (
                          <button
                            type="button"
                            onClick={() => setTrackingOrder(order)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1 shadow-xs active:scale-95 transition-all cursor-pointer"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>Lacak Kurir</span>
                          </button>
                        )}
                        {order.status === 'selesai' && (
                          <button
                            type="button"
                            className="bg-[#063104] hover:bg-[#084205] text-white font-extrabold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1 shadow-xs cursor-pointer"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>Beli Lagi</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* STORE REGISTRATION MODAL */}
      <StoreRegistrationModal
        isOpen={isStoreRegistrationOpen}
        onClose={() => setIsStoreRegistrationOpen(false)}
        profile={profile}
      />

      {/* ORDER TRACKING MODAL */}
      {trackingOrder && (
        <OrderTrackingModal
          open={!!trackingOrder}
          onClose={() => setTrackingOrder(null)}
          orderNo={trackingOrder.orderNo}
          orderDate={trackingOrder.orderDate || trackingOrder.date}
          orderTime={trackingOrder.orderTime}
          courierName={trackingOrder.shippingCourier || 'WaroengKita Instant Courier'}
          currentStatus={trackingOrder.rawStatus || trackingOrder.status}
          driverName={trackingOrder.driverName}
          driverPhone={trackingOrder.driverPhone}
          driverPlate={trackingOrder.driverPlate}
          trackingNumber={trackingOrder.trackingNumber || `TRK-${trackingOrder.orderNo}`}
          biteshipTrackingUrl={trackingOrder.biteshipTrackingUrl}
          storeName={trackingOrder.storeName}
          shippingAddress={trackingOrder.shippingAddress}
        />
      )}

      {/* ORDER DETAIL MODAL */}
      <OrderDetailModal
        open={!!selectedDetailOrder}
        onClose={() => setSelectedDetailOrder(null)}
        order={selectedDetailOrder}
        onPayNow={(ord) => {
          setSelectedDetailOrder(null);
          handlePayNow(ord);
        }}
        onOpenTracking={(ord) => {
          setSelectedDetailOrder(null);
          setTrackingOrder(ord);
        }}
        onOrderUpdated={() => {
          fetchUserOrders(profile.id || profile.phone);
        }}
      />

      {/* PAYMENT CONFIRMATION MODAL */}
      <PaymentConfirmPage
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onPaymentSuccess={() => {
          setIsConfirmModalOpen(false);
          setIsSuccessModalOpen(true);
          fetchUserOrders(profile.id || profile.phone);
        }}
      />

      {/* PAYMENT SUCCESS MODAL */}
      <PaymentSuccessPage
        isOpen={isSuccessModalOpen}
        onClose={() => {
          setIsSuccessModalOpen(false);
          setSelectedOrderStatusFilter('dikemas');
          fetchUserOrders(profile.id || profile.phone);
        }}
        onViewOrders={() => {
          setIsSuccessModalOpen(false);
          setSelectedOrderStatusFilter('dikemas');
          fetchUserOrders(profile.id || profile.phone);
        }}
      />
    </Drawer>
  );
};

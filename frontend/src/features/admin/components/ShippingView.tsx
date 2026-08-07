import React, { useState, useEffect, useCallback } from 'react';
import { Truck, Plus, Pencil, Trash2, X, MapPin, Clock, Banknote, Package, Zap, CalendarDays, HandCoins, ToggleLeft, ToggleRight, Info, ChevronDown, ChevronUp, Phone } from 'lucide-react';
import { useAdminStore } from '../store/useAdminStore';
import { useUserStore } from '../../auth/store/useUserStore';
import type { ShippingOptionAdmin, ShippingType, PickupLocation, ScheduleSlot, BiteshipCourierConfig } from '../../../types';
import { TableSkeleton } from '../../../components/common/AdminSkeletons';
import MapLocationPicker, { type MapLocationResult } from '../../store-location/components/MapLocationPicker';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050/api';

const SHIPPING_TYPE_LABELS: Record<ShippingType, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  instant: { label: 'Instant', icon: <Zap className="w-3.5 h-3.5" />, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  pickup: { label: 'Self-Pickup', icon: <Package className="w-3.5 h-3.5" />, color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  scheduled: { label: 'Terjadwal', icon: <CalendarDays className="w-3.5 h-3.5" />, color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
  cod: { label: 'COD', icon: <HandCoins className="w-3.5 h-3.5" />, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
};

const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0).replace(/\s/g, ' ');

export const ShippingView: React.FC = () => {
  const { profile } = useUserStore();
  const { shippingOptions, toggleShippingStatus, addShippingOption, updateShippingOption, deleteShippingOption, isLoadingData } = useAdminStore();
  const storeId = profile?.assignedStoreId;

  const [activeTab, setActiveTab] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [shippingToEdit, setShippingToEdit] = useState<ShippingOptionAdmin | null>(null);

  // Shipping form state
  const [formType, setFormType] = useState<ShippingType>('instant');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [courier, setCourier] = useState('');
  const [baseFee, setBaseFee] = useState<number | ''>(10000);
  const [feePerKm, setFeePerKm] = useState<number | ''>(2000);
  const [estimatedTime, setEstimatedTime] = useState('');
  const [pickupFee, setPickupFee] = useState<number | ''>(0);
  const [maxRadiusKm, setMaxRadiusKm] = useState<number | ''>(10);
  const [scheduleMode, setScheduleMode] = useState('user_request');

  // Pickup locations state
  const [pickupLocations, setPickupLocations] = useState<PickupLocation[]>([]);
  const [isPickupModalOpen, setIsPickupModalOpen] = useState(false);
  const [pickupToEdit, setPickupToEdit] = useState<PickupLocation | null>(null);
  const [plName, setPlName] = useState('');
  const [plAddress, setPlAddress] = useState('');
  const [plLat, setPlLat] = useState<number | ''>(-6.2088);
  const [plLon, setPlLon] = useState<number | ''>(106.8456);
  const [plHours, setPlHours] = useState('');
  const [plPhone, setPlPhone] = useState('');
  const [plFee, setPlFee] = useState<number | ''>(0);

  // Schedule slots state  
  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>([]);
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [slotToEdit, setSlotToEdit] = useState<ScheduleSlot | null>(null);
  const [slLabel, setSlLabel] = useState('');
  const [slDayOfWeek, setSlDayOfWeek] = useState<number | ''>('');
  const [slStartTime, setSlStartTime] = useState('09:00');
  const [slEndTime, setSlEndTime] = useState('11:00');
  const [slMaxOrders, setSlMaxOrders] = useState<number | ''>(10);
  const [slOptionId, setSlOptionId] = useState('');

  // COD cash records state
  const [cashRecords, setCashRecords] = useState<any[]>([]);
  const [cashSummary, setCashSummary] = useState({ holdingTotal: 0, depositedTotal: 0, totalRecords: 0 });

  // Biteship Couriers state
  const [biteshipCouriers, setBiteshipCouriers] = useState<BiteshipCourierConfig[]>([]);
  const [isBiteshipInfoOpen, setIsBiteshipInfoOpen] = useState(false);

  const fetchBiteshipCouriers = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/shipping/biteship/couriers`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setBiteshipCouriers(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch Biteship couriers:', err);
    }
  }, []);

  const handleToggleBiteshipCourier = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/shipping/biteship/couriers/${id}/toggle`, {
        method: 'PATCH',
      });
      const json = await res.json();
      if (json.success) {
        fetchBiteshipCouriers();
      }
    } catch (err) {
      console.error('Failed to toggle Biteship courier:', err);
    }
  };

  // Fetch pickup locations
  const fetchPickupLocations = useCallback(async () => {
    if (!storeId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/shipping/pickup-locations?storeId=${storeId}`);
      const json = await res.json();
      if (json.success) setPickupLocations(json.data);
    } catch (err) { console.error('Failed to fetch pickup locations:', err); }
  }, [storeId]);

  // Fetch COD cash records
  const fetchCashRecords = useCallback(async () => {
    if (!storeId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/shipping/cod/cash-records?storeId=${storeId}`);
      const json = await res.json();
      if (json.success) {
        setCashRecords(json.data.records || []);
        setCashSummary(json.data.summary || { holdingTotal: 0, depositedTotal: 0, totalRecords: 0 });
      }
    } catch (err) { console.error('Failed to fetch cash records:', err); }
  }, [storeId]);

  useEffect(() => {
    fetchBiteshipCouriers();
  }, [fetchBiteshipCouriers]);

  useEffect(() => {
    if (activeTab === 2) fetchPickupLocations();
    if (activeTab === 4) fetchCashRecords();
  }, [activeTab, fetchPickupLocations, fetchCashRecords]);

  // Collect schedule slots from all shipping options
  useEffect(() => {
    const allSlots: ScheduleSlot[] = [];
    shippingOptions.forEach(opt => {
      if (opt.type === 'scheduled' && opt.scheduleSlots) {
        allSlots.push(...opt.scheduleSlots);
      }
    });
    setScheduleSlots(allSlots);
  }, [shippingOptions]);

  // ——— Shipping Option CRUD ———
  const handleOpenAdd = () => {
    setShippingToEdit(null);
    setFormType('instant');
    setCode('');
    setName('');
    setCourier('GoSend / GrabExpress');
    setBaseFee(10000);
    setFeePerKm(2000);
    setEstimatedTime('Hari ini');
    setPickupFee(0);
    setMaxRadiusKm(10);
    setScheduleMode('user_request');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (opt: ShippingOptionAdmin) => {
    setShippingToEdit(opt);
    setFormType(opt.type || 'instant');
    setCode(opt.code || '');
    setName(opt.name || '');
    setCourier(opt.courier || '');
    setBaseFee(opt.baseFee !== undefined ? opt.baseFee : 10000);
    setFeePerKm(opt.feePerKm !== undefined ? opt.feePerKm : 2000);
    setEstimatedTime(opt.estimatedTime || opt.estimated || 'Hari ini');
    setPickupFee(opt.pickupFee || 0);
    setMaxRadiusKm(opt.maxRadiusKm || 10);
    setScheduleMode(opt.scheduleMode || 'user_request');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const data: any = {
      code: code.trim() || `ship-${Date.now().toString().slice(-4)}`,
      name: name.trim(),
      type: formType,
      courier: courier.trim() || '',
      baseFee: typeof baseFee === 'number' ? baseFee : 10000,
      fee: typeof baseFee === 'number' ? baseFee : 10000,
      feePerKm: typeof feePerKm === 'number' ? feePerKm : 2000,
      estimatedTime: estimatedTime.trim() || 'Hari ini',
      estimated: estimatedTime.trim() || 'Hari ini',
      pickupFee: typeof pickupFee === 'number' ? pickupFee : 0,
      maxRadiusKm: typeof maxRadiusKm === 'number' ? maxRadiusKm : 10,
      scheduleMode,
      isActive: shippingToEdit ? shippingToEdit.isActive : true,
    };
    if (shippingToEdit) {
      updateShippingOption(shippingToEdit.id, data);
    } else {
      addShippingOption(data, storeId);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string, optName: string) => {
    if (window.confirm(`Hapus opsi pengiriman "${optName}"?`)) deleteShippingOption(id);
  };

  // ——— Pickup Location CRUD ———
  const handleOpenAddPickup = () => {
    setPickupToEdit(null);
    setPlName('');
    setPlAddress('');
    setPlLat(-6.2088);
    setPlLon(106.8456);
    setPlHours('08:00-21:00');
    setPlPhone('');
    setPlFee(0);
    setIsPickupModalOpen(true);
  };

  const handleOpenEditPickup = (pl: PickupLocation) => {
    setPickupToEdit(pl);
    setPlName(pl.name);
    setPlAddress(pl.address);
    setPlLat(pl.latitude);
    setPlLon(pl.longitude);
    setPlHours(pl.operatingHours || '');
    setPlPhone(pl.phone || '');
    setPlFee(pl.pickupFee || 0);
    setIsPickupModalOpen(true);
  };

  const handleSubmitPickup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plName.trim() || !plAddress.trim()) return;
    const body = {
      storeId,
      name: plName.trim(),
      address: plAddress.trim(),
      latitude: typeof plLat === 'number' ? plLat : -6.2088,
      longitude: typeof plLon === 'number' ? plLon : 106.8456,
      operatingHours: plHours.trim() || null,
      phone: plPhone.trim() || null,
      pickupFee: plFee || 0,
    };
    try {
      if (pickupToEdit) {
        await fetch(`${API_BASE_URL}/shipping/pickup-locations/${pickupToEdit.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      } else {
        await fetch(`${API_BASE_URL}/shipping/pickup-locations`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      }
      setIsPickupModalOpen(false);
      fetchPickupLocations();
    } catch (err) { console.error('Failed to save pickup location:', err); }
  };

  const handleDeletePickup = async (id: string, n: string) => {
    if (!window.confirm(`Hapus lokasi pengambilan "${n}"?`)) return;
    try {
      await fetch(`${API_BASE_URL}/shipping/pickup-locations/${id}`, { method: 'DELETE' });
      fetchPickupLocations();
    } catch (err) { console.error('Failed to delete pickup location:', err); }
  };

  // ——— Schedule Slot CRUD ———
  const scheduledOptions = shippingOptions.filter(o => o.type === 'scheduled');

  const handleOpenAddSlot = () => {
    setSlotToEdit(null);
    setSlLabel('');
    setSlDayOfWeek('');
    setSlStartTime('09:00');
    setSlEndTime('11:00');
    setSlMaxOrders(10);
    setSlOptionId(scheduledOptions[0]?.id || '');
    setIsSlotModalOpen(true);
  };

  const handleSubmitSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slLabel.trim() || !slOptionId) return;
    const body = { shippingOptionId: slOptionId, label: slLabel.trim(), dayOfWeek: slDayOfWeek === '' ? null : slDayOfWeek, startTime: slStartTime, endTime: slEndTime, maxOrders: slMaxOrders };
    try {
      if (slotToEdit) {
        await fetch(`${API_BASE_URL}/shipping/schedule/slots/${slotToEdit.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      } else {
        await fetch(`${API_BASE_URL}/shipping/schedule/slots`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      }
      setIsSlotModalOpen(false);
      // Refresh data
      window.location.reload();
    } catch (err) { console.error('Failed to save schedule slot:', err); }
  };

  const handleDeleteSlot = async (id: string) => {
    if (!window.confirm('Hapus slot jadwal ini?')) return;
    try {
      await fetch(`${API_BASE_URL}/shipping/schedule/slots/${id}`, { method: 'DELETE' });
      window.location.reload();
    } catch (err) { console.error('Failed to delete slot:', err); }
  };

  // ——— COD Deposit ———
  const handleDeposit = async (recordId: string) => {
    if (!window.confirm('Konfirmasi setoran kas kurir ini?')) return;
    try {
      await fetch(`${API_BASE_URL}/shipping/cod/deposit`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ recordId }) });
      fetchCashRecords();
    } catch (err) { console.error('Failed to record deposit:', err); }
  };

  const hasPickupOptions = shippingOptions.some(o => o.type === 'pickup');
  const hasScheduledOptions = scheduledOptions.length > 0;
  const hasCodOptions = shippingOptions.some(o => o.type === 'cod');

  const tabs = [
    { label: 'Opsi Pengiriman', icon: <Truck className="w-4 h-4" /> },
    { label: 'Pengiriman Instan Biteship', icon: <Zap className="w-4 h-4 text-amber-500" /> },
    ...(hasPickupOptions ? [{ label: 'Lokasi Pickup', icon: <MapPin className="w-4 h-4" /> }] : []),
    ...(hasScheduledOptions ? [{ label: 'Jadwal Pengiriman', icon: <Clock className="w-4 h-4" /> }] : []),
    ...(hasCodOptions ? [{ label: 'Kas COD', icon: <Banknote className="w-4 h-4" /> }] : []),
  ];

  if (isLoadingData) return <TableSkeleton rows={5} />;

  // ——————————————————— RENDER ———————————————————

  const renderShippingTable = () => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Semua Opsi Pengiriman</h2>
          <p className="text-xs text-gray-500">Setiap opsi dapat diaktifkan/dinonaktifkan secara independen.</p>
        </div>
        <button type="button" onClick={handleOpenAdd} className="bg-[#063104] hover:bg-[#084205] text-white font-extrabold px-4.5 py-3 rounded-2xl text-xs shadow-lg transition-all duration-200 flex items-center gap-2.5 shrink-0 active:scale-95 border border-emerald-900/30 cursor-pointer self-start sm:self-auto">
          <div className="w-5 h-5 rounded-lg bg-white/20 flex items-center justify-center shrink-0"><Plus className="w-3.5 h-3.5 stroke-[3]" /></div>
          <span>Tambah Opsi</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F9F8F6] text-gray-700 text-xs font-extrabold uppercase border-b border-gray-200/80">
                <th className="py-3.5 px-4">Nama</th>
                <th className="py-3.5 px-4">Tipe</th>
                <th className="py-3.5 px-4">Kurir</th>
                <th className="py-3.5 px-4">Estimasi</th>
                <th className="py-3.5 px-4">Biaya Dasar</th>
                <th className="py-3.5 px-4">Tarif/KM</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {shippingOptions.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-16 text-gray-400 text-sm">Belum ada opsi pengiriman. Klik "Tambah Opsi" untuk memulai.</td></tr>
              ) : (
                shippingOptions.map((opt, idx) => {
                  const typeInfo = SHIPPING_TYPE_LABELS[opt.type as ShippingType] || SHIPPING_TYPE_LABELS.instant;
                  return (
                    <tr key={opt.id} className={`border-b border-gray-100 hover:bg-gray-50/50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                      <td className="py-3 px-4"><span className="font-bold text-sm text-gray-900">{opt.name}</span><br /><span className="text-[10px] text-gray-400">{opt.code}</span></td>
                      <td className="py-3 px-4"><span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${typeInfo.bg} ${typeInfo.color}`}>{typeInfo.icon}{typeInfo.label}</span></td>
                      <td className="py-3 px-4 text-xs text-gray-600">{opt.courier || '-'}</td>
                      <td className="py-3 px-4 text-xs text-gray-600">{opt.estimatedTime || opt.estimated}</td>
                      <td className="py-3 px-4 text-xs font-semibold text-gray-800">{formatCurrency(opt.baseFee || opt.fee)}</td>
                      <td className="py-3 px-4 text-xs text-gray-600">{formatCurrency(opt.feePerKm || 0)}</td>
                      <td className="py-3 px-4 text-center">
                        <button onClick={() => toggleShippingStatus(opt.id)} className="cursor-pointer" title={opt.isActive ? 'Nonaktifkan' : 'Aktifkan'}>
                          {opt.isActive ? <ToggleRight className="w-7 h-7 text-emerald-600" /> : <ToggleLeft className="w-7 h-7 text-gray-300" />}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => handleOpenEdit(opt)} className="p-1.5 rounded-lg hover:bg-emerald-50 text-gray-500 hover:text-emerald-700 transition cursor-pointer"><Pencil className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDelete(opt.id, opt.name)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderPickupLocations = () => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Titik Lokasi Pengambilan</h2>
          <p className="text-xs text-gray-500">Lokasi dimana pelanggan bisa mengambil pesanan secara langsung.</p>
        </div>
        <button type="button" onClick={handleOpenAddPickup} className="bg-[#063104] hover:bg-[#084205] text-white font-extrabold px-4.5 py-3 rounded-2xl text-xs shadow-lg transition-all duration-200 flex items-center gap-2.5 shrink-0 active:scale-95 border border-emerald-900/30 cursor-pointer self-start sm:self-auto">
          <div className="w-5 h-5 rounded-lg bg-white/20 flex items-center justify-center shrink-0"><Plus className="w-3.5 h-3.5 stroke-[3]" /></div>
          <span>Tambah Lokasi</span>
        </button>
      </div>

      {pickupLocations.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-12 text-center">
          <MapPin className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Belum ada lokasi pengambilan.</p>
          <p className="text-xs text-gray-400 mt-1">Tambahkan minimal 1 lokasi (misalnya lokasi toko Anda).</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {pickupLocations.map(pl => (
            <div key={pl.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center"><MapPin className="w-4 h-4 text-blue-600" /></div>
                  <div>
                    <h3 className="font-bold text-sm text-gray-900">{pl.name}</h3>
                    <p className="text-[10px] text-gray-400">{pl.latitude.toFixed(5)}, {pl.longitude.toFixed(5)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleOpenEditPickup(pl)} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition cursor-pointer"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDeletePickup(pl.id, pl.name)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <p className="text-xs text-gray-600 mb-1">{pl.address}</p>
              <div className="flex flex-wrap items-center gap-3 text-[10px] text-gray-400 mt-2">
                {pl.operatingHours && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{pl.operatingHours}</span>}
                {pl.phone && <span className="flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200"><Phone className="w-3 h-3 text-emerald-600" />{pl.phone}</span>}
                <span className="flex items-center gap-1"><Banknote className="w-3 h-3" />Biaya: {formatCurrency(pl.pickupFee || 0)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderScheduleSlots = () => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Slot Jadwal Pengiriman</h2>
          <p className="text-xs text-gray-500">Atur waktu pengiriman terjadwal yang tersedia untuk pelanggan.</p>
        </div>
        {scheduledOptions.length > 0 && (
          <button type="button" onClick={handleOpenAddSlot} className="bg-[#063104] hover:bg-[#084205] text-white font-extrabold px-4.5 py-3 rounded-2xl text-xs shadow-lg transition-all duration-200 flex items-center gap-2.5 shrink-0 active:scale-95 border border-emerald-900/30 cursor-pointer self-start sm:self-auto">
            <div className="w-5 h-5 rounded-lg bg-white/20 flex items-center justify-center shrink-0"><Plus className="w-3.5 h-3.5 stroke-[3]" /></div>
            <span>Tambah Slot</span>
          </button>
        )}
      </div>

      {scheduleSlots.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-12 text-center">
          <CalendarDays className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Belum ada slot jadwal.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F9F8F6] text-gray-700 text-xs font-extrabold uppercase border-b border-gray-200/80">
                <th className="py-3 px-4">Label</th>
                <th className="py-3 px-4">Hari</th>
                <th className="py-3 px-4">Waktu</th>
                <th className="py-3 px-4">Maks Pesanan</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {scheduleSlots.map(slot => (
                <tr key={slot.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                  <td className="py-3 px-4 text-sm font-semibold text-gray-900">{slot.label}</td>
                  <td className="py-3 px-4 text-xs text-gray-600">{slot.dayOfWeek !== null && slot.dayOfWeek !== undefined ? DAY_NAMES[slot.dayOfWeek] : 'Setiap hari'}</td>
                  <td className="py-3 px-4 text-xs text-gray-600">{slot.startTime} - {slot.endTime}</td>
                  <td className="py-3 px-4 text-xs text-gray-600">{slot.maxOrders} pesanan</td>
                  <td className="py-3 px-4 text-center">
                    <button onClick={() => handleDeleteSlot(slot.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderCodCash = () => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Manajemen Kas COD</h2>
          <p className="text-xs text-gray-500">Pantau dan catat setoran uang tunai dari kurir COD.</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-amber-50 rounded-2xl border border-amber-100 p-4 text-center">
          <p className="text-xs text-amber-600 font-bold mb-1">Kas Ditahan</p>
          <p className="text-lg font-black text-amber-700">{formatCurrency(cashSummary.holdingTotal)}</p>
        </div>
        <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-4 text-center">
          <p className="text-xs text-emerald-600 font-bold mb-1">Sudah Disetor</p>
          <p className="text-lg font-black text-emerald-700">{formatCurrency(cashSummary.depositedTotal)}</p>
        </div>
        <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4 text-center col-span-2 sm:col-span-1">
          <p className="text-xs text-gray-500 font-bold mb-1">Total Record</p>
          <p className="text-lg font-black text-gray-700">{cashSummary.totalRecords}</p>
        </div>
      </div>

      {cashRecords.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-12 text-center">
          <HandCoins className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Belum ada record kas COD.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F9F8F6] text-gray-700 text-xs font-extrabold uppercase border-b border-gray-200/80">
                <th className="py-3 px-4">Pesanan</th>
                <th className="py-3 px-4">Kurir</th>
                <th className="py-3 px-4">Jumlah</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {cashRecords.map((rec: any) => (
                <tr key={rec.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                  <td className="py-3 px-4 text-xs font-semibold text-gray-900">{rec.order?.orderNo || rec.orderId}</td>
                  <td className="py-3 px-4 text-xs text-gray-600">{rec.courierName}<br /><span className="text-gray-400">{rec.courierPhone}</span></td>
                  <td className="py-3 px-4 text-xs font-bold text-gray-800">{formatCurrency(rec.cashAmount)}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${rec.status === 'HOLDING' ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                      {rec.status === 'HOLDING' ? 'Ditahan' : 'Disetor'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {rec.status === 'HOLDING' && (
                      <button onClick={() => handleDeposit(rec.id)} className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer">Konfirmasi Setor</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderBiteshipCouriers = () => (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500 fill-amber-400" />
            <span>Integrasi Pengiriman Instan Biteship</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Aktifkan atau nonaktifkan jenis pengiriman instan (Gojek &amp; Grab) yang disediakan oleh Biteship API.
          </p>
        </div>
      </div>

      {/* Syarat & Ketentuan Info Card (Collapsible) */}
      <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 text-xs space-y-3">
        <div
          onClick={() => setIsBiteshipInfoOpen(!isBiteshipInfoOpen)}
          className="flex items-center justify-between cursor-pointer select-none"
        >
          <div className="flex items-center gap-2 font-bold text-amber-900 text-sm">
            <Info className="w-4.5 h-4.5 text-amber-600 shrink-0" />
            <span>Syarat &amp; Ketentuan Layanan Kurir Instan (Gojek &amp; Grab)</span>
          </div>
          <button type="button" className="text-amber-800 hover:text-amber-950 p-1">
            {isBiteshipInfoOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {isBiteshipInfoOpen && (
          <div className="pt-2 border-t border-amber-200/60 space-y-3 text-amber-950 leading-relaxed">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Gojek Rules */}
              <div className="bg-white/80 p-3 rounded-xl border border-amber-200/50 space-y-1.5">
                <h4 className="font-extrabold text-xs text-emerald-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  Ketentuan Gojek (GoSend)
                </h4>
                <ul className="list-disc list-inside text-[11px] space-y-1 text-gray-700">
                  <li><strong>Asuransi:</strong> 0.5% (Maks. Rp50.000.000, Deductible 10%)</li>
                  <li><strong>Instant:</strong> Maks 5 kg | Volumetrik 70×50×50 cm | 24 Jam</li>
                  <li><strong>Same Day:</strong> Maks 5 kg | Volumetrik 40×40×17 cm | 09.00 - 14.00 WIB</li>
                  <li><strong>Jarak Maksimal:</strong> 40 km (wilayah yang sama)</li>
                </ul>
              </div>

              {/* Grab Rules */}
              <div className="bg-white/80 p-3 rounded-xl border border-amber-200/50 space-y-1.5">
                <h4 className="font-extrabold text-xs text-[#063104] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#063104]"></span>
                  Ketentuan Grab (GrabExpress)
                </h4>
                <ul className="list-disc list-inside text-[11px] space-y-1 text-gray-700">
                  <li><strong>Asuransi:</strong> 0.5% (Maks. Rp50.000.000, Deductible 10%)</li>
                  <li><strong>Instant Motor:</strong> Maks 20 kg | Volumetrik 50×50×50 cm</li>
                  <li><strong>Same Day Motor:</strong> Maks 7 kg | Volumetrik 40×40×20 cm</li>
                  <li><strong>Instant Car:</strong> Maks 150 kg | Volumetrik 100×100×80 cm</li>
                </ul>
              </div>
            </div>

            <div className="bg-red-50/80 p-2.5 rounded-xl border border-red-200/60 text-[11px] text-red-800">
              <strong>🚫 Barang Terlarang:</strong> Barang berbahaya/mudah meledak, Narkoba, Hewan/tumbuhan hidup, Senjata, Uang tunai/dokumen berharga, Perhiasan/logam mulia, Jenazah/organ, Limbah terlarang.
            </div>
          </div>
        )}
      </div>

      {/* Courier Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F9F8F6] text-gray-700 text-xs font-extrabold uppercase border-b border-gray-200/80">
                <th className="py-3.5 px-4">Nama Kurir</th>
                <th className="py-3.5 px-4">Courier Service Name</th>
                <th className="py-3.5 px-4">Jenis Pembayaran</th>
                <th className="py-3.5 px-4">Estimasi Pengiriman</th>
                <th className="py-3.5 px-4">Deskripsi</th>
                <th className="py-3.5 px-4 text-center">Status (On / Off)</th>
              </tr>
            </thead>
            <tbody>
              {biteshipCouriers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400 text-sm">
                    Memuat daftar kurir Biteship...
                  </td>
                </tr>
              ) : (
                biteshipCouriers.map((c, idx) => (
                  <tr
                    key={c.id}
                    className={`border-b border-gray-100 hover:bg-gray-50/50 transition-colors ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-gray-900">{c.courierName}</span>
                        <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full uppercase">
                          {c.courierCode}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        {c.serviceName}
                        <span className="text-[10px] font-normal text-amber-600">({c.serviceCode})</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-semibold text-gray-700">
                      {c.availableCashOnDelivery ? (
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          COD / Non-COD
                        </span>
                      ) : (
                        <span className="text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md">
                          Non-COD (Transfer / QRIS)
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-700 font-medium">
                      {c.shipmentDuration}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-600">
                      {c.description}
                      <div className="text-[10px] text-gray-400 font-medium">
                        Batas Bobot: {c.maxWeightKg} kg
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleBiteshipCourier(c.id)}
                        className="cursor-pointer inline-flex items-center gap-1.5 focus:outline-none"
                        title={c.isActive ? 'Nonaktifkan Kurir Ini' : 'Aktifkan Kurir Ini'}
                      >
                        {c.isActive ? (
                          <ToggleRight className="w-8 h-8 text-emerald-600 transition-transform active:scale-95" />
                        ) : (
                          <ToggleLeft className="w-8 h-8 text-gray-300 transition-transform active:scale-95" />
                        )}
                        <span className={`text-xs font-bold ${c.isActive ? 'text-emerald-700' : 'text-gray-400'}`}>
                          {c.isActive ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    const tabIndex = activeTab;
    if (tabIndex === 0) return renderShippingTable();
    if (tabIndex === 1) return renderBiteshipCouriers();
    // Dynamic tab mapping based on which tabs exist
    let currentIdx = 2;
    if (hasPickupOptions) {
      if (tabIndex === currentIdx) return renderPickupLocations();
      currentIdx++;
    }
    if (hasScheduledOptions) {
      if (tabIndex === currentIdx) return renderScheduleSlots();
      currentIdx++;
    }
    if (hasCodOptions) {
      if (tabIndex === currentIdx) return renderCodCash();
    }
    return renderShippingTable();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-black text-gray-900">Opsi Pengiriman Pesanan</h1>
        <p className="text-xs text-gray-500">Kelola semua tipe pengiriman, lokasi pickup, jadwal, dan kas COD.</p>
      </div>

      {/* Tabs */}
      {tabs.length > 1 && (
        <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 overflow-x-auto">
          {tabs.map((tab, idx) => (
            <button key={idx} onClick={() => setActiveTab(idx)} className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 whitespace-nowrap cursor-pointer ${activeTab === idx ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'}`}>
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Tab Content */}
      {renderTabContent()}

      {/* ——— Shipping Option Modal ——— */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setIsModalOpen(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-5 border-b border-gray-100 rounded-t-3xl">
              <h3 className="text-lg font-black text-gray-900">{shippingToEdit ? 'Edit Opsi Pengiriman' : 'Tambah Opsi Pengiriman'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-xl hover:bg-gray-100 transition cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Type selector */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">Tipe Pengiriman</label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(SHIPPING_TYPE_LABELS) as ShippingType[]).map(t => {
                    const info = SHIPPING_TYPE_LABELS[t];
                    return (
                      <button key={t} type="button" onClick={() => setFormType(t)} className={`flex items-center gap-2 p-3 rounded-xl border-2 text-xs font-bold transition-all cursor-pointer ${formType === t ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                        {info.icon}
                        {info.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nama Layanan</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Pengiriman Instan" className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Kode</label>
                  <input type="text" value={code} onChange={e => setCode(e.target.value)} placeholder="instant-01" className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
                </div>
              </div>

              {formType === 'instant' && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Kurir</label>
                  <input type="text" value={courier} onChange={e => setCourier(e.target.value)} placeholder="GoSend / GrabExpress" className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Biaya Dasar (Rp)</label>
                  <input type="number" value={baseFee} onChange={e => setBaseFee(e.target.value === '' ? '' : Number(e.target.value))} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Tarif per KM (Rp)</label>
                  <input type="number" value={feePerKm} onChange={e => setFeePerKm(e.target.value === '' ? '' : Number(e.target.value))} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Estimasi Pengiriman</label>
                <input type="text" value={estimatedTime} onChange={e => setEstimatedTime(e.target.value)} placeholder="Hari ini" className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
              </div>

              {formType === 'pickup' && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Biaya Pengambilan (Rp)</label>
                  <input type="number" value={pickupFee} onChange={e => setPickupFee(e.target.value === '' ? '' : Number(e.target.value))} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
                  <p className="text-[10px] text-gray-400 mt-1">Opsional. Biarkan 0 jika gratis.</p>
                </div>
              )}

              {formType === 'cod' && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Radius Maks COD (km)</label>
                  <input type="number" value={maxRadiusKm} onChange={e => setMaxRadiusKm(e.target.value === '' ? '' : Number(e.target.value))} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
                  <p className="text-[10px] text-gray-400 mt-1">Default: 10 km. Pelanggan di luar radius tidak bisa memilih COD.</p>
                </div>
              )}

              {formType === 'scheduled' && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Mode Jadwal</label>
                  <select value={scheduleMode} onChange={e => setScheduleMode(e.target.value)} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm">
                    <option value="admin_defined">Admin Tentukan (hari & jam tetap)</option>
                    <option value="user_request">Pelanggan Pilih (tanggal & slot)</option>
                  </select>
                  <p className="text-[10px] text-gray-400 mt-1">
                    {scheduleMode === 'admin_defined' ? 'Admin menentukan hari dan waktu pengiriman tetap.' : 'Pelanggan memilih tanggal dan slot waktu saat checkout.'}
                  </p>
                </div>
              )}

              <button type="submit" className="w-full py-3 bg-[#063104] hover:bg-[#084205] text-white font-extrabold text-sm rounded-2xl transition-all duration-200 active:scale-[0.98] cursor-pointer">
                {shippingToEdit ? 'Simpan Perubahan' : 'Tambahkan'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ——— Pickup Location Modal ——— */}
      {isPickupModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setIsPickupModalOpen(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-5 border-b border-gray-100 rounded-t-3xl">
              <h3 className="text-lg font-black text-gray-900">{pickupToEdit ? 'Edit Lokasi Pickup' : 'Tambah Lokasi Pickup'}</h3>
              <button onClick={() => setIsPickupModalOpen(false)} className="p-2 rounded-xl hover:bg-gray-100 transition cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmitPickup} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nama Lokasi</label>
                <input type="text" value={plName} onChange={e => setPlName(e.target.value)} placeholder="Toko Utama - Senopati" className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">No. WhatsApp / Kontak</label>
                  <input type="tel" value={plPhone} onChange={e => setPlPhone(e.target.value)} placeholder="081234567890" className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Jam Operasional</label>
                  <input type="text" value={plHours} onChange={e => setPlHours(e.target.value)} placeholder="08:00-21:00" className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Alamat Lengkap</label>
                <textarea rows={2} value={plAddress} onChange={e => setPlAddress(e.target.value)} placeholder="Jl. Senopati No. 10, Jakarta Selatan" className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm resize-none" required />
              </div>

              {/* Map Location Picker */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700">Lokasi Peta &amp; Koordinat</label>
                <MapLocationPicker
                  initialLat={typeof plLat === 'number' && plLat !== 0 ? plLat : undefined}
                  initialLon={typeof plLon === 'number' && plLon !== 0 ? plLon : undefined}
                  initialAddress={plAddress}
                  onLocationSelect={(res: MapLocationResult) => {
                    setPlLat(res.lat);
                    setPlLon(res.lon);
                    if (!plAddress.trim() || res.displayName) {
                      setPlAddress(res.displayName);
                    }
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Biaya Pengambilan (Rp)</label>
                <input type="number" value={plFee} onChange={e => setPlFee(e.target.value === '' ? '' : Number(e.target.value))} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
                <p className="text-[10px] text-gray-400 mt-1">Biarkan 0 jika pengambilan gratis.</p>
              </div>

              <button type="submit" className="w-full py-3 bg-[#063104] hover:bg-[#084205] text-white font-extrabold text-sm rounded-2xl transition-all duration-200 active:scale-[0.98] cursor-pointer">
                {pickupToEdit ? 'Simpan Perubahan' : 'Tambahkan'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ——— Schedule Slot Modal ——— */}
      {isSlotModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setIsSlotModalOpen(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-5 border-b border-gray-100 rounded-t-3xl">
              <h3 className="text-lg font-black text-gray-900">Tambah Slot Jadwal</h3>
              <button onClick={() => setIsSlotModalOpen(false)} className="p-2 rounded-xl hover:bg-gray-100 transition cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmitSlot} className="p-5 space-y-4">
              {scheduledOptions.length > 1 && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Opsi Pengiriman</label>
                  <select value={slOptionId} onChange={e => setSlOptionId(e.target.value)} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm">
                    {scheduledOptions.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Label Slot</label>
                <input type="text" value={slLabel} onChange={e => setSlLabel(e.target.value)} placeholder="Pagi (09:00 - 11:00)" className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Hari (opsional, kosongkan untuk setiap hari)</label>
                <select value={slDayOfWeek} onChange={e => setSlDayOfWeek(e.target.value === '' ? '' : Number(e.target.value))} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm">
                  <option value="">Setiap Hari</option>
                  {DAY_NAMES.map((d, i) => <option key={i} value={i}>{d}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Mulai</label>
                  <input type="time" value={slStartTime} onChange={e => setSlStartTime(e.target.value)} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Selesai</label>
                  <input type="time" value={slEndTime} onChange={e => setSlEndTime(e.target.value)} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" required />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Maks Pesanan per Slot</label>
                <input type="number" value={slMaxOrders} onChange={e => setSlMaxOrders(e.target.value === '' ? '' : Number(e.target.value))} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
              </div>
              <button type="submit" className="w-full py-3 bg-[#063104] hover:bg-[#084205] text-white font-extrabold text-sm rounded-2xl transition-all duration-200 active:scale-[0.98] cursor-pointer">
                Tambahkan Slot
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

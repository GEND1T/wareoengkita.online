import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Plus,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  X,
  Upload,
  Globe,
  Building2,
  Palette,
  Image as ImageIcon,
  Smartphone,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Crop,
  Check,
  Move,
} from 'lucide-react';
import { useAdminStore } from '../store/useAdminStore';
import { useUserStore } from '../../auth/store/useUserStore';
import { useStoreSelectorStore } from '../../store-location/store/useStoreSelectorStore';
import type { PromoBanner } from '../../../types';
import { API_BASE_URL } from '../../../config/api';
import { CardsGridSkeleton } from '../../../components/common/AdminSkeletons';

// =========================================================
// PRECISION CROP EDITOR MODAL WITH EXACT 2.4:1 ASPECT RATIO
// =========================================================
interface BannerCropModalProps {
  isOpen: boolean;
  imageUrl: string;
  initialScale: number;
  initialPosX: number;
  initialPosY: number;
  onClose: () => void;
  onSave: (scale: number, posX: number, posY: number) => void;
}

const BannerCropModal: React.FC<BannerCropModalProps> = ({
  isOpen,
  imageUrl,
  initialScale,
  initialPosX,
  initialPosY,
  onClose,
  onSave,
}) => {
  const [scale, setScale] = useState<number>(initialScale || 1.0);
  const [posX, setPosX] = useState<number>(initialPosX ?? 0);
  const [posY, setPosY] = useState<number>(initialPosY ?? 0);
  const [imgAspect, setImgAspect] = useState<number>(1.777); // default 16:9

  const imgRef = useRef<HTMLImageElement | null>(null);
  const isDraggingBoxRef = useRef<boolean>(false);
  const isResizingRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number; startX: number; startY: number; startScale: number }>({
    x: 0,
    y: 0,
    startX: 0,
    startY: 0,
    startScale: 1.0,
  });
  const pinchStartDistRef = useRef<number | null>(null);
  const pinchStartScaleRef = useRef<number>(1.0);

  // Target Banner Ratio = 2.4 (2.4:1)
  const BANNER_RATIO = 2.4;

  // Calculate Crop Box Dimension Percentages
  const cropW = Math.max(15, Math.min(100, 100 / scale));
  const cropH = Math.max(10, Math.min(100, cropW * (imgAspect / BANNER_RATIO)));

  const halfW = cropW / 2;
  const halfH = cropH / 2;

  // Sync state ONLY when modal opens
  useEffect(() => {
    if (isOpen) {
      setScale(initialScale || 1.0);
      setPosX(initialPosX ?? 0);
      setPosY(initialPosY ?? 0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Measure actual image aspect ratio when image loads
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.currentTarget;
    if (target.naturalWidth && target.naturalHeight) {
      setImgAspect(target.naturalWidth / target.naturalHeight);
    }
  };

  // Clamped Top-Left Inset so Crop Box NEVER goes outside the picture boundary!
  const clampedLeft = Math.max(0, Math.min(100 - cropW, posX));
  const clampedTop = Math.max(0, Math.min(100 - cropH, posY));

  // Center coordinates for display/rendering
  const centerX = clampedLeft + halfW;
  const centerY = clampedTop + halfH;

  // Calculate CSS clip-path inset values for 100% exact pixel alignment
  const topInset = clampedTop;
  const rightInset = Math.max(0, 100 - (clampedLeft + cropW));
  const bottomInset = Math.max(0, 100 - (clampedTop + cropH));
  const leftInset = clampedLeft;

  const clipPathStyle = `inset(${topInset.toFixed(2)}% ${rightInset.toFixed(2)}% ${bottomInset.toFixed(2)}% ${leftInset.toFixed(2)}% round 12px)`;

  const handleSaveCrop = () => {
    // Save top-left insets (clampedLeft, clampedTop) for exact 1-to-1 cutout alignment!
    onSave(scale, Math.round(clampedLeft), Math.round(clampedTop));
  };

  // ── Mouse Drag & Resize Handlers ──
  const handleBoxMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isDraggingBoxRef.current = true;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startX: clampedLeft,
      startY: clampedTop,
      startScale: scale,
    };
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isResizingRef.current = true;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startX: clampedLeft,
      startY: clampedTop,
      startScale: scale,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    if (isDraggingBoxRef.current) {
      // Dragging Crop Box across picture
      const deltaPercentX = (dx / rect.width) * 100;
      const deltaPercentY = (dy / rect.height) * 100;

      const nextLeft = Math.max(0, Math.min(100 - cropW, dragStartRef.current.startX + deltaPercentX));
      const nextTop = Math.max(0, Math.min(100 - cropH, dragStartRef.current.startY + deltaPercentY));

      setPosX(Math.round(nextLeft));
      setPosY(Math.round(nextTop));
    } else if (isResizingRef.current) {
      // Resizing Crop Box size (Zoom)
      const deltaPx = dx + dy;
      const newScale = Math.max(1.0, Math.min(3.0, dragStartRef.current.startScale - deltaPx / 150));
      setScale(parseFloat(newScale.toFixed(2)));
    }
  };

  const handleMouseUp = () => {
    isDraggingBoxRef.current = false;
    isResizingRef.current = false;
  };

  // ── Touch Gesture Handlers (Pan + Pinch Zoom) ──
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isDraggingBoxRef.current = true;
      dragStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        startX: clampedLeft,
        startY: clampedTop,
        startScale: scale,
      };
    } else if (e.touches.length === 2) {
      isDraggingBoxRef.current = false;
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      pinchStartDistRef.current = dist;
      pinchStartScaleRef.current = scale;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    if (rect.width === 0) return;

    if (e.touches.length === 1 && isDraggingBoxRef.current) {
      const dx = e.touches[0].clientX - dragStartRef.current.x;
      const dy = e.touches[0].clientY - dragStartRef.current.y;

      const deltaPercentX = (dx / rect.width) * 100;
      const deltaPercentY = (dy / rect.height) * 100;

      const nextLeft = Math.max(0, Math.min(100 - cropW, dragStartRef.current.startX + deltaPercentX));
      const nextTop = Math.max(0, Math.min(100 - cropH, dragStartRef.current.startY + deltaPercentY));

      setPosX(Math.round(nextLeft));
      setPosY(Math.round(nextTop));
    } else if (e.touches.length === 2 && pinchStartDistRef.current) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = dist / pinchStartDistRef.current;
      const newScale = Math.max(1.0, Math.min(3.0, pinchStartScaleRef.current * ratio));
      setScale(parseFloat(newScale.toFixed(2)));
    }
  };

  const handleTouchEnd = () => {
    isDraggingBoxRef.current = false;
    pinchStartDistRef.current = null;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    setScale((prev) => parseFloat(Math.max(1.0, Math.min(3.0, prev + delta)).toFixed(2)));
  };

  const activeImage = imageUrl || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=80';

  return (
    <div className="fixed inset-0 z-[4000] bg-slate-950/95 backdrop-blur-md flex flex-col justify-between animate-fade-in text-white selection:bg-none">
      {/* Modal Top Bar */}
      <div className="h-14 px-6 border-b border-white/10 flex items-center justify-between bg-black/40">
        <div className="flex items-center gap-2">
          <Crop className="w-5 h-5 text-[#C8956A]" />
          <h3 className="font-extrabold text-sm text-white">Editor Framing & Crop Banner</h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => { setScale(1.0); setPosX(0); setPosY(0); }}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-colors text-xs flex items-center gap-1 font-bold"
            title="Reset Posisi & Zoom"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Canvas Viewport Area */}
      <div
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
        style={{ touchAction: 'none' }}
        className="flex-1 relative flex flex-col items-center justify-center p-4 sm:p-8 overflow-hidden select-none"
      >
        {/* INSTRUCTION BADGE MOVED ABOVE BACKGROUND PICTURE */}
        <div className="mb-3 bg-black/80 backdrop-blur-md text-white text-[11px] font-extrabold px-4 py-1.5 rounded-full border border-white/20 shadow-lg flex items-center gap-2 whitespace-nowrap shrink-0">
          <Move className="w-3.5 h-3.5 text-[#C8956A]" />
          <span>Geser Kotak untuk Mengatur Fokus • Tarik Ujung Ujung untuk Resize Banner</span>
        </div>

        {/* CONTAINER PICTURE FRAME */}
        <div className="relative max-w-4xl max-h-[60vh] flex items-center justify-center rounded-2xl overflow-hidden shadow-2xl bg-black/40 border border-white/10">
          {/* 1. STATIONARY BACKGROUND IMAGE (DIMMED 35% OPACITY) */}
          <img
            ref={imgRef}
            src={activeImage}
            onLoad={handleImageLoad}
            alt="Stationary Original"
            className="max-w-full max-h-[60vh] object-contain opacity-35 blur-[0.5px] brightness-75 pointer-events-none"
            draggable={false}
          />

          {/* 2. CRISP SHARP TOP LAYER WITH CLIP-PATH (EXACT 100% PIXEL MATCHING) */}
          <img
            src={activeImage}
            alt="Crisp Sharp Cutout Overlay"
            className="absolute max-w-full max-h-[60vh] object-contain opacity-100 pointer-events-none transition-all duration-75"
            style={{
              clipPath: clipPathStyle,
            }}
            draggable={false}
          />

          {/* 3. DRAGGABLE & RESIZABLE CROP BOX FRAME OVERLAY (EXACT 2.4:1 ASPECT RATIO) */}
          <div
            onMouseDown={handleBoxMouseDown}
            onTouchStart={handleTouchStart}
            style={{
              position: 'absolute',
              width: `${cropW}%`,
              height: `${cropH}%`,
              left: `${centerX}%`,
              top: `${centerY}%`,
              transform: 'translate(-50%, -50%)',
              touchAction: 'none',
            }}
            className="border-2 border-[#C8956A] shadow-2xl rounded-xl overflow-hidden cursor-move pointer-events-auto group bg-transparent"
          >
            {/* 3x3 Grid Guidelines Overlay */}
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 border border-white/30 pointer-events-none">
              <div className="border-r border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="border-b border-white/20" />
              <div className="border-r border-white/20" />
              <div className="border-r border-white/20" />
              <div className="" />
            </div>

            {/* INTERACTIVE CORNER RESIZE HANDLE GRIPS */}
            <div
              onMouseDown={handleResizeMouseDown}
              className="absolute top-1 left-1 w-4 h-4 border-t-2 border-l-2 border-white hover:border-[#C8956A] cursor-nwse-resize p-1 z-20"
              title="Tarik Ujung untuk Resize Ukuran Banner"
            />
            <div
              onMouseDown={handleResizeMouseDown}
              className="absolute top-1 right-1 w-4 h-4 border-t-2 border-r-2 border-white hover:border-[#C8956A] cursor-nesw-resize p-1 z-20"
              title="Tarik Ujung untuk Resize Ukuran Banner"
            />
            <div
              onMouseDown={handleResizeMouseDown}
              className="absolute bottom-1 left-1 w-4 h-4 border-b-2 border-l-2 border-white hover:border-[#C8956A] cursor-nesw-resize p-1 z-20"
              title="Tarik Ujung untuk Resize Ukuran Banner"
            />
            <div
              onMouseDown={handleResizeMouseDown}
              className="absolute bottom-1 right-1 w-5 h-5 border-b-3 border-r-3 border-white hover:border-[#C8956A] bg-amber-500/30 rounded-br-lg cursor-nwse-resize p-1 z-20 flex items-center justify-center"
              title="Tarik Ujung untuk Resize Ukuran Banner"
            />
          </div>
        </div>
      </div>

      {/* Modal Bottom Controls Bar */}
      <div className="h-20 px-6 border-t border-white/10 bg-black/60 flex items-center justify-between gap-4 z-10">
        {/* Zoom Scale Buttons */}
        <div className="flex items-center gap-2 bg-white/10 p-1.5 rounded-2xl border border-white/10">
          <button
            type="button"
            onClick={() => setScale((s) => parseFloat(Math.max(1.0, s - 0.15).toFixed(2)))}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            title="Zoom Out (Perbesar Kotak)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <span className="text-xs font-extrabold text-white px-2 min-w-[52px] text-center">
            {scale.toFixed(2)}x
          </span>

          <button
            type="button"
            onClick={() => setScale((s) => parseFloat(Math.min(3.0, s + 0.15).toFixed(2)))}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            title="Zoom In (Perkecil Kotak)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>

        {/* Action Save Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-white/20 text-white font-bold text-xs hover:bg-white/10 transition-all"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleSaveCrop}
            className="bg-[#063104] hover:bg-[#084205] text-[#C8956A] hover:text-white font-extrabold px-5 py-2.5 rounded-xl text-xs shadow-lg flex items-center gap-1.5 transition-all active:scale-95 border border-emerald-500/30"
          >
            <Check className="w-4 h-4 text-[#C8956A]" />
            <span>Simpan Framing Banner</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper component for rendering 1-to-1 exact crop cutout
export const RenderBannerCutout: React.FC<{
  image: string;
  title: string;
  imageScale?: number;
  imagePositionX?: number;
  imagePositionY?: number;
  className?: string;
}> = ({ image, title, imageScale = 1.0, imagePositionX = 0, imagePositionY = 0, className = '' }) => {
  const [aspect, setAspect] = useState<number>(1.777);
  const scaleVal = imageScale || 1.0;
  const cropW = Math.max(15, Math.min(100, 100 / scaleVal));
  const BANNER_RATIO = 2.4;
  const cropH = cropW * (aspect / BANNER_RATIO);

  // Strictly clamp left and top insets to prevent empty space gaps
  const leftInset = Math.max(0, Math.min(100 - cropW, imagePositionX ?? 0));
  const topInset = Math.max(0, Math.min(100 - cropH, imagePositionY ?? 0));

  const imgWidthPercent = (100 / cropW) * 100;
  const imgHeightPercent = (100 / Math.max(0.1, cropH)) * 100;
  const leftPercent = -(leftInset / cropW) * 100;
  const topPercent = -(topInset / Math.max(0.1, cropH)) * 100;

  return (
    <div className={`relative w-full aspect-[2.4/1] overflow-hidden bg-gray-900 ${className}`}>
      <img
        src={image}
        alt={title}
        onLoad={(e) => {
          if (e.currentTarget.naturalWidth && e.currentTarget.naturalHeight) {
            setAspect(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight);
          }
        }}
        className="absolute max-w-none origin-top-left pointer-events-none transition-all duration-300"
        style={{
          width: `${imgWidthPercent}%`,
          height: `${imgHeightPercent}%`,
          left: `${leftPercent}%`,
          top: `${topPercent}%`,
        }}
        draggable={false}
      />
    </div>
  );
};

// =========================================================
// MAIN PROMOS VIEW COMPONENT
// =========================================================
export const PromosView: React.FC = () => {
  const { profile } = useUserStore();
  const { promos, togglePromoStatus, addPromo, updatePromo, deletePromo, isLoadingData } =
    useAdminStore();
  const { stores } = useStoreSelectorStore();

  const isSuperadmin = profile.role === 'superadmin';

  const [filterScope, setFilterScope] = useState<'all' | 'global' | 'branch'>('all');
  const [filterMode, setFilterMode] = useState<'all' | 'template' | 'full'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [promoToEdit, setPromoToEdit] = useState<PromoBanner | null>(null);

  // Modal Form State
  const [activeModalTab, setActiveModalTab] = useState<'template' | 'full'>('template');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [discountTag, setDiscountTag] = useState('');
  const [image, setImage] = useState('');
  const [scopeType, setScopeType] = useState<'global' | 'branch'>('global');
  const [targetStoreId, setTargetStoreId] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  // Image Adjustment State
  const [imageScale, setImageScale] = useState<number>(1.0);
  const [imagePositionX, setImagePositionX] = useState<number>(0);
  const [imagePositionY, setImagePositionY] = useState<number>(0);

  // Dedicated Crop Modal State
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      if (json.success && json.url) {
        setImage(json.url);
      }
    } catch (err) {
      console.error('Failed to upload promo image to Cloudinary:', err);
    } finally {
      setIsUploading(false);
    }
  };

  // Populate form when editing or adding
  useEffect(() => {
    if (promoToEdit) {
      setActiveModalTab(promoToEdit.bannerType === 'full' ? 'full' : 'template');
      setTitle(promoToEdit.title);
      setSubtitle(promoToEdit.subtitle);
      setDiscountTag(promoToEdit.discountTag || (promoToEdit as any).badgeText || '');
      setImage(promoToEdit.image || (promoToEdit as any).imageUrl || '');
      setImageScale(promoToEdit.imageScale !== undefined && promoToEdit.imageScale !== null ? Number(promoToEdit.imageScale) : 1.0);
      setImagePositionX(promoToEdit.imagePositionX !== undefined && promoToEdit.imagePositionX !== null ? Number(promoToEdit.imagePositionX) : 0);
      setImagePositionY(promoToEdit.imagePositionY !== undefined && promoToEdit.imagePositionY !== null ? Number(promoToEdit.imagePositionY) : 0);

      if (!promoToEdit.storeId) {
        setScopeType('global');
        setTargetStoreId('');
      } else {
        setScopeType('branch');
        setTargetStoreId(promoToEdit.storeId);
      }
    } else {
      setActiveModalTab('template');
      setTitle('');
      setSubtitle('');
      setDiscountTag('');
      setImage('https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=80');
      setImageScale(1.0);
      setImagePositionX(0);
      setImagePositionY(0);
      setScopeType(isSuperadmin ? 'global' : 'branch');
      setTargetStoreId(profile.assignedStoreId || stores[0]?.id || '');
    }
  }, [promoToEdit, isModalOpen, isSuperadmin, profile.assignedStoreId, stores]);

  const handleOpenAddModal = () => {
    setPromoToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (promo: PromoBanner) => {
    setPromoToEdit(promo);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, titleText: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus banner "${titleText}"?`)) {
      deletePromo(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && activeModalTab === 'template') return;

    const chosenStoreId = isSuperadmin
      ? (scopeType === 'global' ? null : (targetStoreId || stores[0]?.id || null))
      : (profile.assignedStoreId || null);

    const promoData = {
      title: title.trim() || (activeModalTab === 'full' ? 'Banner Graphic Full' : 'Promo Banner'),
      subtitle: activeModalTab === 'template' ? (subtitle.trim() || 'Penawaran Segar Organik Hari Ini') : '',
      discountTag: activeModalTab === 'template' ? (discountTag.trim() || 'PROMO SPECIAL') : '',
      image: image.trim() || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=80',
      isActive: promoToEdit ? promoToEdit.isActive : true,
      storeId: chosenStoreId,
      bannerType: activeModalTab,
      imageScale,
      imagePositionX,
      imagePositionY,
    };

    if (promoToEdit) {
      updatePromo(promoToEdit.id, promoData);
    } else {
      addPromo(promoData, chosenStoreId);
    }

    setIsModalOpen(false);
  };

  const userStoreId = profile.assignedStoreId;

  const visiblePromos = isSuperadmin
    ? promos
    : promos.filter((p) => p.storeId === userStoreId);

  const filteredPromos = visiblePromos.filter((p) => {
    if (isSuperadmin) {
      if (filterScope === 'global' && p.storeId) return false;
      if (filterScope === 'branch' && !p.storeId) return false;
    }
    if (filterMode === 'template' && p.bannerType === 'full') return false;
    if (filterMode === 'full' && p.bannerType !== 'full') return false;
    return true;
  });

  if (isLoadingData) {
    return <CardsGridSkeleton items={6} />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="hidden md:block">
          <h1 className="text-2xl font-black text-gray-900">Manajemen Promo & Banner</h1>
          <p className="text-xs text-gray-500">
            {isSuperadmin
              ? 'Kelola banner promo platform & cabang toko.'
              : `Kelola banner promo khusus cabang ${stores.find((s) => s.id === userStoreId)?.name || 'toko Anda'}.`}
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="bg-[#063104] hover:bg-[#084205] text-white font-extrabold px-4 py-2.5 md:px-4.5 md:py-3 rounded-2xl text-xs shadow-lg hover:shadow-emerald-900/20 transition-all duration-200 flex items-center gap-2 md:gap-2.5 shrink-0 active:scale-95 border border-emerald-900/30 cursor-pointer self-start sm:self-auto"
        >
          <div className="w-5 h-5 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
          </div>
          <span>Tambah Banner Promo</span>
        </button>
      </div>

      {/* Filter Scope & Mode Bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Scope Filter (Superadmin Only) */}
        {isSuperadmin ? (
          <div className="flex items-center gap-1.5 bg-gray-100 p-1.5 rounded-2xl">
            <button
              type="button"
              onClick={() => setFilterScope('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${
                filterScope === 'all' ? 'bg-[#063104] text-white shadow-sm' : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              Semua Scope ({promos.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterScope('global')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1 whitespace-nowrap ${
                filterScope === 'global' ? 'bg-purple-900 text-white shadow-sm' : 'text-purple-900 hover:bg-purple-100'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Global ({promos.filter((p) => !p.storeId).length})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterScope('branch')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1 whitespace-nowrap ${
                filterScope === 'branch' ? 'bg-blue-900 text-white shadow-sm' : 'text-blue-900 hover:bg-blue-100'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Cabang ({promos.filter((p) => Boolean(p.storeId)).length})</span>
            </button>
          </div>
        ) : (
          <div className="px-3.5 py-2 bg-blue-50 border border-blue-200/80 text-blue-950 text-xs font-extrabold rounded-2xl flex items-center gap-2 shadow-sm">
            <Building2 className="w-4 h-4 text-blue-700 shrink-0" />
            <span>Cabang Toko: {stores.find((s) => s.id === userStoreId)?.name || 'Toko Cabang'}</span>
          </div>
        )}

        {/* Mode Filter */}
        <div className="flex items-center gap-1.5 bg-gray-100 p-1.5 rounded-2xl">
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
              filterMode === 'all' ? 'bg-[#063104] text-white shadow-sm' : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            Semua Mode
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('template')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1 ${
              filterMode === 'template' ? 'bg-amber-700 text-white shadow-sm' : 'text-amber-900 hover:bg-amber-100'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Mode Template</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('full')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1 ${
              filterMode === 'full' ? 'bg-teal-700 text-white shadow-sm' : 'text-teal-900 hover:bg-teal-100'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Full Image</span>
          </button>
        </div>
      </div>

      {/* Promo Banners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredPromos.length === 0 ? (
          <div className="col-span-full bg-white rounded-3xl p-8 text-center border border-gray-100 text-xs text-gray-400">
            Belum ada banner promo pada filter ini. Klik "+ Tambah Banner Promo" untuk membuat banner baru.
          </div>
        ) : (
          filteredPromos.map((banner) => {
            const assignedStore = stores.find((s) => s.id === banner.storeId);
            const isGlobalBanner = !banner.storeId;
            const isFullBanner = banner.bannerType === 'full';

            return (
              <div
                key={banner.id}
                className="bg-white rounded-3xl overflow-hidden border border-gray-200/80 shadow-sm flex flex-col justify-between group"
              >
                {/* Banner Image Preview */}
                <div className="relative aspect-[2.4/1] w-full overflow-hidden bg-gray-100">
                  {isFullBanner ? (
                    <RenderBannerCutout
                      image={banner.image || banner.imageUrl || ''}
                      title={banner.title}
                      imageScale={banner.imageScale}
                      imagePositionX={banner.imagePositionX}
                      imagePositionY={banner.imagePositionY}
                    />
                  ) : (
                    <img
                      src={banner.image || banner.imageUrl}
                      alt={banner.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                  
                  {/* Banner Mode Badge */}
                  <span
                    className={`absolute top-3 left-3 font-extrabold text-[10px] px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1.5 ${
                      isFullBanner
                        ? 'bg-teal-800 text-white border border-teal-400/40'
                        : 'bg-[#063104] text-[#C8956A] border border-amber-500/40'
                    }`}
                  >
                    {isFullBanner ? <ImageIcon className="w-3 h-3 text-teal-200" /> : <Palette className="w-3 h-3 text-amber-200" />}
                    <span>{isFullBanner ? 'Full Custom Design' : (banner.discountTag || (banner as any).badgeText || 'Template')}</span>
                  </span>

                  {/* Scope Badge (Global vs Store Branch) */}
                  <div className="absolute bottom-3 left-3 flex items-center gap-1 z-10">
                    {isGlobalBanner ? (
                      <span className="bg-purple-900/90 backdrop-blur-md text-white font-extrabold text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1 border border-purple-400/40 shadow-sm">
                        <Globe className="w-3 h-3 text-purple-200" />
                        <span>Global (Semua Toko)</span>
                      </span>
                    ) : (
                      <span className="bg-blue-900/90 backdrop-blur-md text-white font-extrabold text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1 border border-blue-400/40 shadow-sm">
                        <Building2 className="w-3 h-3 text-blue-200" />
                        <span>{assignedStore ? assignedStore.name : `Cabang (${banner.storeId})`}</span>
                      </span>
                    )}
                  </div>

                  {/* Status Active Badge */}
                  <span
                    className={`absolute top-3 right-3 text-[10px] font-black px-2.5 py-1 rounded-full shadow-lg z-10 ${
                      banner.isActive ? 'bg-emerald-500 text-white' : 'bg-gray-800 text-gray-300'
                    }`}
                  >
                    {banner.isActive ? 'AKTIF' : 'NONAKTIF'}
                  </span>
                </div>

                {/* Banner Info & Actions */}
                <div className="p-5 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-extrabold text-gray-900 text-base">{banner.title}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {isFullBanner ? `Full Custom Image (Zoom: ${banner.imageScale || 1}x)` : banner.subtitle}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => togglePromoStatus(banner.id)}
                      className={`p-2 rounded-xl font-bold text-xs flex items-center gap-1 transition-colors ${
                        banner.isActive
                          ? 'bg-emerald-50 text-[#063104] hover:bg-emerald-100 border border-emerald-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      title={banner.isActive ? 'Sembunyikan Banner' : 'Tampilkan Banner'}
                    >
                      {banner.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(banner)}
                      className="p-2 rounded-xl bg-gray-100 hover:bg-[#063104] hover:text-white text-gray-700 transition-colors"
                      title="Edit Banner Promo"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(banner.id, banner.title)}
                      className="p-2 rounded-xl bg-gray-100 hover:bg-red-600 hover:text-white text-gray-700 transition-colors"
                      title="Hapus Banner Promo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL FORM TAMBAH / EDIT BANNER PROMO */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-[3000] bg-black/60 flex items-end md:items-center justify-center md:p-4 overflow-y-auto animate-fade-in"
          style={{ backdropFilter: 'blur(4px)' }}
        >
          <div className="bg-white rounded-t-3xl md:rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl border border-gray-100 flex flex-col md:my-auto max-h-[94vh] md:max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-[#F9F8F6]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#063104]" />
                <h3 className="font-extrabold text-gray-900 text-lg">
                  {promoToEdit ? 'Edit Banner Promo' : 'Tambah Banner Promo Baru'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-gray-200/80 text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto text-xs">
              {/* Scope Selection (Global Platform vs Specific Branch) */}
              {isSuperadmin ? (
                <div className="p-3.5 bg-purple-50/80 rounded-2xl border border-purple-200 space-y-2.5">
                  <label className="block text-xs font-bold text-purple-950 flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-purple-700" />
                    <span>Cakupan Penayangan Banner Promo (Scope)</span>
                  </label>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setScopeType('global');
                        setTargetStoreId('');
                      }}
                      className={`p-2.5 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-1.5 transition ${
                        scopeType === 'global'
                          ? 'bg-purple-900 text-white border-purple-950 shadow-sm'
                          : 'bg-white text-purple-900 border-purple-200 hover:bg-purple-100'
                      }`}
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Global Platform (Semua Toko)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setScopeType('branch');
                        setTargetStoreId(stores[0]?.id || '');
                      }}
                      className={`p-2.5 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-1.5 transition ${
                        scopeType === 'branch'
                          ? 'bg-blue-900 text-white border-blue-950 shadow-sm'
                          : 'bg-white text-blue-900 border-blue-200 hover:bg-blue-100'
                      }`}
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      <span>Khusus Cabang Toko</span>
                    </button>
                  </div>

                  {scopeType === 'branch' && (
                    <div className="pt-1">
                      <label className="block text-[11px] font-bold text-blue-900 mb-1">
                        Pilih Cabang Toko Target *
                      </label>
                      <select
                        value={targetStoreId}
                        onChange={(e) => setTargetStoreId(e.target.value)}
                        className="w-full bg-white text-xs rounded-xl px-3 py-2 border border-blue-300 focus:outline-none focus:border-blue-700 font-extrabold text-blue-950"
                      >
                        {stores.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.city})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-blue-50/80 rounded-2xl border border-blue-200 text-xs font-bold text-blue-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-700 shrink-0" />
                  <span>
                    Banner ini akan ditayangkan khusus untuk cabang toko Anda (
                    {stores.find((s) => s.id === profile.assignedStoreId)?.name || 'Cabang Saya'}).
                  </span>
                </div>
              )}

              {/* 2 MODE BANNER TABS SELECTOR */}
              <div className="space-y-2">
                <label className="block font-extrabold text-gray-900 text-xs">
                  Pilih Mode Desain Banner Promo:
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveModalTab('template')}
                    className={`p-3 rounded-2xl border flex flex-col items-start gap-1.5 transition-all text-left ${
                      activeModalTab === 'template'
                        ? 'bg-amber-50/90 border-amber-600 text-amber-950 ring-2 ring-amber-500/20 shadow-sm'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-black text-xs">
                      <Palette className="w-4 h-4 text-amber-700" />
                      <span>1. Mode Template Design</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveModalTab('full')}
                    className={`p-3 rounded-2xl border flex flex-col items-start gap-1.5 transition-all text-left ${
                      activeModalTab === 'full'
                        ? 'bg-teal-50/90 border-teal-600 text-teal-950 ring-2 ring-teal-500/20 shadow-sm'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-black text-xs">
                      <ImageIcon className="w-4 h-4 text-teal-700" />
                      <span>2. Mode Custom Full Image</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* LIVE INTERACTIVE PREVIEW BOX */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-extrabold text-gray-600 uppercase tracking-wide flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-[#063104]" />
                    <span>Live Preview Tampilan Halaman Utama Slider:</span>
                  </span>
                </span>

                {activeModalTab === 'template' ? (
                  /* Live Preview Template Design */
                  <div className="relative bg-[#063104] rounded-2xl p-4 sm:p-5 text-white flex items-center justify-between min-h-[140px] shadow-md border border-emerald-900/40 overflow-hidden">
                    <div className="z-10 max-w-[60%] space-y-1">
                      <p className="text-emerald-100/90 text-xs font-medium truncate">
                        {subtitle || 'Sub-judul Promo Organik'}
                      </p>
                      <h2 className="text-2xl font-black text-[#FACC15] leading-tight line-clamp-2">
                        {title || 'Judul Promo Diskon'}
                      </h2>
                    </div>

                    <div className="relative z-10 flex items-center justify-end w-1/3 h-full">
                      <div className="relative">
                        <div className="absolute -top-1 -right-1 z-20 bg-[#FACC15] text-[#063104] text-[9px] font-bold rounded-full px-2 py-0.5 shadow-md transform rotate-12">
                          {discountTag || 'PROMO'}
                        </div>
                        <img
                          src={image || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80'}
                          alt="Preview"
                          className="w-28 h-24 object-cover rounded-xl border border-white/20 shadow-md"
                        />
                      </div>
                    </div>

                    <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-emerald-800/20 rounded-l-full blur-xl pointer-events-none" />
                  </div>
                ) : (
                  /* Live Preview Custom Full Image Design + Open Crop Modal Button */
                  <div className="relative w-full aspect-[2.4/1] rounded-2xl overflow-hidden shadow-md border border-gray-200 bg-gray-900 group">
                    <RenderBannerCutout
                      image={image || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=80'}
                      title="Full Image Preview"
                      imageScale={imageScale}
                      imagePositionX={imagePositionX}
                      imagePositionY={imagePositionY}
                    />

                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                      <button
                        type="button"
                        onClick={() => setIsCropModalOpen(true)}
                        className="bg-white/90 hover:bg-white text-gray-900 font-extrabold text-xs px-4 py-2 rounded-xl shadow-lg flex items-center gap-1.5 transition-all"
                      >
                        <Crop className="w-4 h-4 text-[#063104]" />
                        <span>Buka Editor Framing & Crop</span>
                      </button>
                    </div>

                    <div className="absolute bottom-2 left-2 bg-black/75 backdrop-blur-md text-white text-[10px] font-extrabold px-3 py-1 rounded-full border border-white/20 flex items-center gap-2 z-10">
                      <span>Zoom: {imageScale}x</span>
                      <span>•</span>
                      <span>Inset: ({imagePositionX}%, {imagePositionY}%)</span>
                    </div>
                  </div>
                )}
              </div>

              {/* TAB 1: FORM MODE TEMPLATE DESIGN */}
              {activeModalTab === 'template' && (
                <div className="space-y-3.5 pt-1 animate-fade-in">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      Judul Banner (Title) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Diskon Organik 30% OFF"
                      className="w-full bg-gray-50 text-sm rounded-xl px-3.5 py-2 border border-gray-200 focus:outline-none focus:border-[#063104] font-extrabold text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Sub-Judul Banner (Subtitle)</label>
                    <input
                      type="text"
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                      placeholder="e.g. Khusus Produk Sayuran Segar Hari Ini"
                      className="w-full bg-gray-50 text-xs rounded-xl px-3.5 py-2 border border-gray-200 focus:outline-none focus:border-[#063104] font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Teks Badge Diskon (Tag)</label>
                    <input
                      type="text"
                      value={discountTag}
                      onChange={(e) => setDiscountTag(e.target.value)}
                      placeholder="e.g. 30% OFF / FREE ONGKIR"
                      className="w-full bg-gray-50 text-xs rounded-xl px-3.5 py-2 border border-gray-200 focus:outline-none focus:border-[#063104] font-bold text-[#063104]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Upload Foto Produk Banner</label>
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={image}
                        onChange={(e) => setImage(e.target.value)}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full bg-gray-50 text-xs rounded-xl px-3.5 py-2 border border-gray-200 focus:outline-none focus:border-[#063104]"
                      />

                      <label className="cursor-pointer bg-emerald-50 hover:bg-emerald-100 text-[#063104] border border-emerald-200 font-bold px-3 py-2 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors">
                        <Upload className="w-4 h-4 text-[#063104]" />
                        <span>{isUploading ? 'Mengunggah Foto...' : 'Upload dari Perangkat'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: FORM MODE CUSTOM FULL IMAGE DESIGN WITH DEDICATED CROP MODAL LAUNCHER */}
              {activeModalTab === 'full' && (
                <div className="space-y-4 pt-1 animate-fade-in">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      Judul Internal / Alt Text (Opsional)
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Banner Full Promo Hari Tani 2026"
                      className="w-full bg-gray-50 text-xs rounded-xl px-3.5 py-2 border border-gray-200 focus:outline-none focus:border-[#063104] font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      Upload Gambar Grafis Banner Full Design <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-2">
                      <input
                        type="text"
                        required
                        value={image}
                        onChange={(e) => setImage(e.target.value)}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full bg-gray-50 text-xs rounded-xl px-3.5 py-2 border border-gray-200 focus:outline-none focus:border-[#063104]"
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <label className="cursor-pointer bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 font-bold px-3 py-2 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors">
                          <Upload className="w-4 h-4 text-teal-800" />
                          <span>{isUploading ? 'Mengunggah...' : 'Upload Gambar Full'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                        </label>

                        <button
                          type="button"
                          onClick={() => setIsCropModalOpen(true)}
                          className="bg-[#063104] hover:bg-[#084205] text-[#C8956A] hover:text-white font-extrabold px-3 py-2 rounded-xl text-xs shadow-sm flex items-center justify-center gap-2 transition-all"
                        >
                          <Crop className="w-4 h-4 text-[#C8956A]" />
                          <span>Atur Posisi & Crop Banner</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-[#063104] text-white font-bold px-5 py-2.5 rounded-xl text-xs hover:bg-emerald-950"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-[#063104] hover:bg-[#084205] text-white font-extrabold px-5 py-2.5 rounded-xl text-xs shadow-md transition-all active:scale-95"
                >
                  Simpan Banner Promo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DEDICATED FULLSCREEN BANNER CROP EDITOR MODAL */}
      <BannerCropModal
        isOpen={isCropModalOpen}
        imageUrl={image}
        initialScale={imageScale}
        initialPosX={imagePositionX}
        initialPosY={imagePositionY}
        onClose={() => setIsCropModalOpen(false)}
        onSave={(newScale, newX, newY) => {
          setImageScale(newScale);
          setImagePositionX(newX);
          setImagePositionY(newY);
          setIsCropModalOpen(false);
        }}
      />
    </div>
  );
};

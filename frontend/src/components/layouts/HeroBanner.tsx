import React, { useState, useEffect, useRef } from 'react';
import { useStoreSelectorStore } from '../../features/store-location/store/useStoreSelectorStore';
import { BannerSkeleton } from '../common/SkeletonLoaders';
import { API_BASE_URL } from '../../config/api';

export const HeroBanner: React.FC = () => {
  const { selectedStoreId } = useStoreSelectorStore();
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [slides, setSlides] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  useEffect(() => {
    setActiveSlide(0);
    setIsLoading(true);

    const loadPromos = async () => {
      try {
        const primaryUrl = selectedStoreId
          ? `${API_BASE_URL}/promos?storeId=${selectedStoreId}`
          : `${API_BASE_URL}/promos`;

        let res = await fetch(primaryUrl);
        if (!res.ok) {
          throw new Error(`HTTP status ${res.status}`);
        }
        let json = await res.json();

        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const mapped = json.data.map((p: any) => ({
            subtitle: p.subtitle || 'Promo Spesial Organik',
            title: p.title || 'Diskon Segar Hari Ini',
            badgeText: p.badgeText || p.discountTag || 'PROMO',
            image: p.imageUrl || p.image || 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=600&q=80',
            bannerType: p.bannerType || 'template',
            imageScale: p.imageScale !== undefined && p.imageScale !== null ? Number(p.imageScale) : 1.0,
            imagePositionX: p.imagePositionX !== undefined && p.imagePositionX !== null ? Number(p.imagePositionX) : 0,
            imagePositionY: p.imagePositionY !== undefined && p.imagePositionY !== null ? Number(p.imagePositionY) : 0,
          }));
          setSlides(mapped);
        } else {
          // Default Platform Banner if no active promos created yet
          setSlides([
            {
              subtitle: 'Promo Spesial Organik Platform',
              title: 'Diskon Belanja Sayur & Buah Segar 30%',
              badgeText: '30% OFF',
              image: 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=600&q=80',
              bannerType: 'template',
              imageScale: 1.0,
              imagePositionX: 0,
              imagePositionY: 0,
            },
          ]);
        }
      } catch (err) {
        console.error('Failed to fetch promos:', err);
        setSlides([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadPromos();
  }, [selectedStoreId]);

  const nextSlide = () => {
    if (slides.length <= 1) return;
    setActiveSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    if (slides.length <= 1) return;
    setActiveSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  // Auto-play timer (Every 4 seconds)
  useEffect(() => {
    if (isPaused || slides.length <= 1) return;

    const timer = setInterval(() => {
      nextSlide();
    }, 4000);

    return () => clearInterval(timer);
  }, [isPaused, activeSlide, slides.length]);

  // Touch Swipe Handlers for Mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) {
      setIsPaused(false);
      return;
    }

    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 40;

    if (distance > minSwipeDistance) {
      nextSlide();
    } else if (distance < -minSwipeDistance) {
      prevSlide();
    }

    touchStartX.current = null;
    touchEndX.current = null;
    setTimeout(() => setIsPaused(false), 2000);
  };

  // Mouse Drag Handlers for Desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsPaused(true);
    touchStartX.current = e.clientX;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (touchStartX.current !== null) {
      touchEndX.current = e.clientX;
    }
  };

  const handleMouseUp = () => {
    handleTouchEnd();
  };

  if (isLoading) {
    return (
      <section className="max-w-6xl mx-auto px-4 pt-4 pb-2">
        <BannerSkeleton />
      </section>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 mt-3 mb-4 select-none">
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => {
          setIsPaused(false);
          touchStartX.current = null;
          touchEndX.current = null;
        }}
        className="relative aspect-[2.4/1] w-full bg-[#063104] rounded-3xl overflow-hidden shadow-lg text-[#063104] flex items-center justify-between cursor-grab active:cursor-grabbing transition-all duration-300"
      >
        {/* Slides Slider Wrapper */}
        {slides.map((slide, idx) => {
          const isActive = activeSlide === idx;
          const isFullBanner = slide.bannerType === 'full';

          return (
            <div
              key={idx}
              className={`absolute inset-0 transition-all duration-700 ease-in-out ${isActive
                ? 'opacity-100 translate-x-0 z-10 pointer-events-auto'
                : idx < activeSlide
                  ? 'opacity-0 -translate-x-full z-0 pointer-events-none'
                  : 'opacity-0 translate-x-full z-0 pointer-events-none'
                }`}
            >
              {isFullBanner ? (
                /* Mode Full Banner Image Design - Exact 1-to-1 Cutout */
                <FullBannerCutoutSlide slide={slide} />
              ) : (
                /* Mode Template Design with Overlay Text & Card */
                <div className="p-5 sm:p-7 md:p-8 w-full h-full flex items-center justify-between relative">
                  {/* Left Content */}
                  <div className="z-10 max-w-[60%] sm:max-w-[50%] space-y-1 sm:space-y-2">
                    <p className="text-emerald-100/90 text-xs sm:text-sm md:text-base font-medium tracking-wide">
                      {slide.subtitle}
                    </p>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#FACC15] tracking-tight leading-tight">
                      {slide.title}
                    </h2>
                  </div>

                  {/* Right Content: Cutout Basket Illustration */}
                  <div className="relative z-10 flex items-center justify-end w-1/2 sm:w-2/5 h-full">
                    <div className="relative group">
                      <div className="absolute -top-1.5 -right-1 z-20 bg-[#FACC15] text-[#063104] text-[9px] sm:text-[10px] font-bold rounded-full w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-center shadow-md leading-tight transform rotate-12">
                        {slide.badgeText}
                      </div>

                      <img
                        src={slide.image}
                        alt="Organic Basket"
                        className="w-32 h-28 sm:w-44 sm:h-36 md:w-52 md:h-40 object-cover rounded-2xl shadow-md border-2 border-white/20 transform group-hover:scale-105 transition-transform duration-300"
                        draggable={false}
                      />
                    </div>
                  </div>

                  {/* Subtle Background Glow */}
                  <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-emerald-800/20 rounded-l-full blur-2xl pointer-events-none" />
                </div>
              )}
            </div>
          );
        })}

        {/* Carousel Navigation Dots */}
        {slides.length > 1 && (
          <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex items-center gap-1.5 z-20 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveSlide(idx)}
                className={`transition-all duration-300 rounded-full ${activeSlide === idx
                  ? 'w-6 h-2 bg-[#FACC15]'
                  : 'w-2 h-2 bg-white/50 hover:bg-white'
                  }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const FullBannerCutoutSlide: React.FC<{ slide: any }> = ({ slide }) => {
  const [aspect, setAspect] = useState<number>(1.777);
  const scaleVal = slide.imageScale || 1.0;
  const cropW = Math.max(15, Math.min(100, 100 / scaleVal));
  const BANNER_RATIO = 2.4;
  const cropH = cropW * (aspect / BANNER_RATIO);

  const leftInset = Math.max(0, Math.min(100 - cropW, slide.imagePositionX ?? 0));
  const topInset = Math.max(0, Math.min(100 - cropH, slide.imagePositionY ?? 0));

  const imgWidthPercent = (100 / cropW) * 100;
  const imgHeightPercent = (100 / Math.max(0.1, cropH)) * 100;
  const leftPercent = -(leftInset / cropW) * 100;
  const topPercent = -(topInset / Math.max(0.1, cropH)) * 100;

  return (
    <div className="w-full h-full relative overflow-hidden group">
      <img
        src={slide.image}
        alt={slide.title || 'Promo Banner Full'}
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
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
    </div>
  );
};

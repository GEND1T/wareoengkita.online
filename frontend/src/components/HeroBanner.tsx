import React, { useState, useEffect, useRef } from 'react';
import { useStoreSelectorStore } from '../store/useStoreSelectorStore';
import { useServerStatusStore } from '../store/useServerStatusStore';
import { BannerSkeleton } from './common/SkeletonLoaders';
import { API_BASE_URL } from '../config/api';

export const HeroBanner: React.FC = () => {
  const { selectedStoreId } = useStoreSelectorStore();
  const setServerDisconnected = useServerStatusStore((state) => state.setDisconnected);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [slides, setSlides] = useState<any[]>([]);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  useEffect(() => {
    setActiveSlide(0);

    const url = selectedStoreId
      ? `${API_BASE_URL}/promos?storeId=${selectedStoreId}`
      : `${API_BASE_URL}/promos`;

    fetch(url)
      .then((res) => {
        if (!res.ok) {
          setServerDisconnected(true, `Gagal memuat banner promo (HTTP Status ${res.status}).`);
          throw new Error(`HTTP status ${res.status}`);
        }
        return res.json();
      })
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          const mapped = json.data.map((p: any) => ({
            subtitle: p.subtitle || 'Promo Spesial',
            title: p.title,
            badgeText: p.badgeText || 'PROMO',
            image: p.imageUrl || 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=600&q=80',
          }));
          setSlides(mapped);
        } else {
          setSlides([]);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch promos:', err);
        setServerDisconnected(true, 'Koneksi ke database server promo terputus.');
        setSlides([]);
      });
  }, [selectedStoreId, setServerDisconnected]);

  const nextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setActiveSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  // Auto-play timer (Every 4 seconds)
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      nextSlide();
    }, 4000);

    return () => clearInterval(timer);
  }, [isPaused, activeSlide]);

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
      // Swiped left -> next slide
      nextSlide();
    } else if (distance < -minSwipeDistance) {
      // Swiped right -> prev slide
      prevSlide();
    }

    // Reset touch coordinates and resume autoplay after touch
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

  if (slides.length === 0) {
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
        className="relative bg-[#063104] rounded-3xl overflow-hidden shadow-lg text-white p-5 sm:p-7 md:p-8 flex items-center justify-between min-h-[160px] sm:min-h-[180px] cursor-grab active:cursor-grabbing transition-all duration-300"
      >
        {/* Slides Slider Wrapper */}
        {slides.map((slide, idx) => {
          const isActive = activeSlide === idx;
          return (
            <div
              key={idx}
              className={`absolute inset-0 p-5 sm:p-7 md:p-8 flex items-center justify-between transition-all duration-700 ease-in-out ${
                isActive
                  ? 'opacity-100 translate-x-0 z-10 pointer-events-auto'
                  : idx < activeSlide
                  ? 'opacity-0 -translate-x-full z-0 pointer-events-none'
                  : 'opacity-0 translate-x-full z-0 pointer-events-none'
              }`}
            >
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
            </div>
          );
        })}

        {/* Decorative background accent circle */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-emerald-800/20 rounded-l-full blur-xl pointer-events-none" />

        {/* Carousel Pagination Dots */}
        <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
          {slides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveSlide(idx);
              }}
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-2 rounded-full transition-all duration-300 focus:outline-none ${
                activeSlide === idx
                  ? 'w-5 bg-white'
                  : 'w-2 bg-white/40 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

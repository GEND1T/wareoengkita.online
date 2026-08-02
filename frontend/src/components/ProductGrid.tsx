import React, { useState, useEffect } from 'react';
import { ProductCard } from './ProductCard';
import type { Product } from '../types';
import { useCategoryStore } from '../store/useCategoryStore';
import { useStoreSelectorStore } from '../store/useStoreSelectorStore';
import { API_BASE_URL } from '../config/api';
import { ProductCardSkeleton } from './common/SkeletonLoaders';

export const ProductGrid: React.FC = () => {
  const { selectedCategory, searchQuery } = useCategoryStore();
  const { selectedStoreId } = useStoreSelectorStore();
  const [storeProducts, setStoreProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    fetch(`${API_BASE_URL}/products?storeId=${encodeURIComponent(selectedStoreId)}`)
      .then((res) => res.json())
      .then((json) => {
        if (isMounted) {
          if (json.success && Array.isArray(json.data)) {
            const mapped: Product[] = json.data.map((p: any) => ({
              id: p.id,
              name: p.name,
              subtitle: p.description || p.name,
              price: p.price,
              unit: p.unit || '/pak',
              image: p.image,
              category: p.categorySlug || 'sayur-segar',
              storeId: p.storeId || selectedStoreId,
              isActive: p.isActive !== undefined ? p.isActive : true,
              description: p.description,
              rating: p.rating || 4.9,
              stock: p.stock !== undefined ? p.stock : 50,
            }));
            setStoreProducts(mapped);
          } else {
            setStoreProducts([]);
          }
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch store products:', err);
        if (isMounted) {
          setStoreProducts([]);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedStoreId]);

  // Filter products based on active category and search query
  const filteredProducts = storeProducts.filter((product) => {
    const pCat = (product.category || '').toLowerCase();
    const sCat = (selectedCategory || '').toLowerCase();
    const matchesCategory = sCat === 'all' || sCat === 'semua' || pCat === sCat;

    const q = searchQuery.trim().toLowerCase();
    const pName = (product.name || '').toLowerCase();
    const pSub = (product.subtitle || '').toLowerCase();
    const matchesSearch = !q || pName.includes(q) || pSub.includes(q);

    return matchesCategory && matchesSearch;
  });

  // Split into columns for uniform staggered zigzag layout
  // 2-column distribution for mobile
  const col1Mobile = filteredProducts.filter((_, idx) => idx % 2 === 0);
  const col2Mobile = filteredProducts.filter((_, idx) => idx % 2 === 1);

  // 4-column distribution for desktop
  const col1Desktop = filteredProducts.filter((_, idx) => idx % 4 === 0);
  const col2Desktop = filteredProducts.filter((_, idx) => idx % 4 === 1);
  const col3Desktop = filteredProducts.filter((_, idx) => idx % 4 === 2);
  const col4Desktop = filteredProducts.filter((_, idx) => idx % 4 === 3);

  return (
    <section className="max-w-6xl mx-auto px-4 pt-2 pb-16 md:pb-20">
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 my-4 shadow-xs">
          <p className="text-gray-500 text-sm font-medium">
            Tidak ada produk organik yang sesuai dengan pencarian Anda di toko ini.
          </p>
        </div>
      ) : (
        <>
          {/* MOBILE 2-COLUMN STAGGERED ZIGZAG (lg:hidden) */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 items-start lg:hidden">
            {/* Mobile Column 1 */}
            <div className="flex flex-col gap-3 sm:gap-4">
              {col1Mobile.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Mobile Column 2 (First item extended at bottom so zigzag starts cleanly from Row 1 bottom) */}
            <div className="flex flex-col gap-3 sm:gap-4">
              {col2Mobile.map((product, idx) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isExtendedHeight={idx === 0}
                />
              ))}
            </div>
          </div>

          {/* DESKTOP 4-COLUMN STAGGERED ZIGZAG (hidden lg:grid) */}
          <div className="hidden lg:grid grid-cols-4 gap-5 items-start">
            {/* Desktop Column 1 */}
            <div className="flex flex-col gap-5">
              {col1Desktop.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Desktop Column 2 (First item extended at bottom) */}
            <div className="flex flex-col gap-5">
              {col2Desktop.map((product, idx) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isExtendedHeight={idx === 0}
                />
              ))}
            </div>

            {/* Desktop Column 3 */}
            <div className="flex flex-col gap-5">
              {col3Desktop.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Desktop Column 4 (First item extended at bottom) */}
            <div className="flex flex-col gap-5">
              {col4Desktop.map((product, idx) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isExtendedHeight={idx === 0}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  );
};

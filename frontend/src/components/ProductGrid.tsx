import React, { useState, useEffect } from 'react';
import { ProductCard } from './ProductCard';
import type { Product } from '../types';
import { useCategoryStore } from '../store/useCategoryStore';
import { useStoreSelectorStore } from '../store/useStoreSelectorStore';

import { ProductCardSkeleton } from './common/SkeletonLoaders';

export const ProductGrid: React.FC = () => {
  const { selectedCategory, searchQuery } = useCategoryStore();
  const { selectedStoreId } = useStoreSelectorStore();
  const [storeProducts, setStoreProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    fetch(`http://localhost:5050/api/products?storeId=${encodeURIComponent(selectedStoreId)}`)
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

  return (
    <section className="max-w-6xl mx-auto px-4 pt-2 pb-16 md:pb-20">
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 my-4">
          <p className="text-gray-500 text-sm">
            Tidak ada produk organik yang sesuai dengan pencarian Anda.
          </p>
        </div>
      ) : (
        /* Asymmetric Zigzag Grid: 2 columns on mobile, 4 columns on desktop */
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {filteredProducts.map((product: Product, index: number) => {
            const isOffset = index % 2 !== 0;
            const offsetClass = isOffset ? 'translate-y-6 md:translate-y-8' : '';

            return (
              <ProductCard
                key={product.id}
                product={product}
                offsetClass={offsetClass}
              />
            );
          })}
        </div>
      )}
    </section>
  );
};

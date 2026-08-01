import React from 'react';

export const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-3 shadow-xs animate-pulse space-y-3">
      <div className="w-full h-36 bg-gray-200/70 rounded-xl" />
      <div className="space-y-2">
        <div className="h-4 bg-gray-200/80 rounded-md w-3/4" />
        <div className="h-3 bg-gray-100 rounded-md w-1/2" />
      </div>
      <div className="pt-2 flex items-center justify-between">
        <div className="h-5 bg-gray-200/90 rounded-md w-1/3" />
        <div className="h-8 bg-gray-200/70 rounded-xl w-20" />
      </div>
    </div>
  );
};

export const BannerSkeleton: React.FC = () => {
  return (
    <div className="w-full h-44 sm:h-52 rounded-3xl bg-gray-200/70 animate-pulse p-6 flex flex-col justify-between">
      <div className="space-y-2 max-w-xs">
        <div className="h-4 bg-gray-300/80 rounded-md w-24" />
        <div className="h-6 bg-gray-300/90 rounded-md w-48" />
      </div>
      <div className="h-8 bg-gray-300/80 rounded-xl w-32" />
    </div>
  );
};

export const StoreCardSkeleton: React.FC = () => {
  return (
    <div className="p-3.5 rounded-2xl border border-gray-100 bg-white animate-pulse space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gray-200/80 shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-gray-200/80 rounded-md w-2/3" />
          <div className="h-3 bg-gray-100 rounded-md w-1/2" />
        </div>
      </div>
    </div>
  );
};

export const TableRowsSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="space-y-3 p-4 animate-pulse">
      {Array.from({ length: rows }).map((_, idx) => (
        <div key={idx} className="flex items-center gap-4 py-2 border-b border-gray-100">
          <div className="w-10 h-10 rounded-xl bg-gray-200/80 shrink-0" />
          <div className="space-y-1.5 flex-1">
            <div className="h-4 bg-gray-200/80 rounded-md w-1/3" />
            <div className="h-3 bg-gray-100 rounded-md w-1/4" />
          </div>
          <div className="h-6 bg-gray-200/70 rounded-lg w-16" />
        </div>
      ))}
    </div>
  );
};

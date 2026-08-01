import React from 'react';

export const OverviewSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-gray-200 rounded-xl" />
          <div className="h-4 w-72 bg-gray-200/70 rounded-lg" />
        </div>
        <div className="h-10 w-40 bg-gray-200 rounded-2xl" />
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-gray-200/80" />
              <div className="h-5 w-16 bg-gray-200/70 rounded-lg" />
            </div>
            <div className="space-y-1.5 pt-2">
              <div className="h-4 w-24 bg-gray-200/70 rounded-md" />
              <div className="h-7 w-32 bg-gray-300/80 rounded-lg" />
            </div>
          </div>
        ))}
      </div>

      {/* Grid Content Area: Recent Orders & Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Orders Table Summary */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="h-5 w-40 bg-gray-200 rounded-lg" />
            <div className="h-4 w-20 bg-gray-200/70 rounded-md" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-200/80 shrink-0" />
                  <div className="space-y-1.5">
                    <div className="h-4 w-32 bg-gray-200/90 rounded-md" />
                    <div className="h-3 w-24 bg-gray-200/60 rounded-md" />
                  </div>
                </div>
                <div className="space-y-1.5 text-right">
                  <div className="h-4 w-20 bg-gray-300/80 rounded-md ml-auto" />
                  <div className="h-5 w-16 bg-gray-200/70 rounded-lg ml-auto" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Low Stock Alert Sidebar */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <div className="w-4 h-4 rounded-full bg-gray-200" />
            <div className="h-5 w-36 bg-gray-200 rounded-lg" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-gray-200/80 shrink-0" />
                  <div className="space-y-1">
                    <div className="h-3.5 w-24 bg-gray-200/90 rounded-md" />
                    <div className="h-3 w-16 bg-gray-200/60 rounded-md" />
                  </div>
                </div>
                <div className="h-5 w-14 bg-gray-200/80 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 6 }) => {
  return (
    <div className="space-y-5 animate-pulse">
      {/* Top Title & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-2">
          <div className="h-7 w-56 bg-gray-200 rounded-xl" />
          <div className="h-4 w-80 bg-gray-200/70 rounded-lg" />
        </div>
        <div className="h-10 w-36 bg-gray-300/80 rounded-2xl" />
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="h-10 flex-1 bg-gray-100 rounded-xl" />
        <div className="flex gap-2">
          <div className="h-10 w-32 bg-gray-100 rounded-xl" />
          <div className="h-10 w-28 bg-gray-100 rounded-xl" />
        </div>
      </div>

      {/* Table Box */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden p-4 space-y-3">
        <div className="h-10 w-full bg-gray-100/80 rounded-xl" />
        {Array.from({ length: rows }).map((_, idx) => (
          <div key={idx} className="flex items-center justify-between py-3 px-2 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gray-200/80 shrink-0" />
              <div className="space-y-2">
                <div className="h-4 w-40 bg-gray-200/90 rounded-md" />
                <div className="h-3 w-28 bg-gray-200/60 rounded-md" />
              </div>
            </div>
            <div className="h-5 w-24 bg-gray-200/70 rounded-lg hidden sm:block" />
            <div className="h-5 w-20 bg-gray-200/80 rounded-lg" />
            <div className="h-7 w-12 bg-gray-200/90 rounded-full" />
            <div className="flex gap-1.5">
              <div className="w-7 h-7 bg-gray-200/80 rounded-lg" />
              <div className="w-7 h-7 bg-gray-200/80 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const CardsGridSkeleton: React.FC<{ items?: number }> = ({ items = 6 }) => {
  return (
    <div className="space-y-5 animate-pulse">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-gray-200 rounded-xl" />
          <div className="h-4 w-72 bg-gray-200/70 rounded-lg" />
        </div>
        <div className="h-10 w-36 bg-gray-300/80 rounded-2xl" />
      </div>

      {/* Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: items }).map((_, idx) => (
          <div key={idx} className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-4">
            <div className="w-full h-36 bg-gray-200/80 rounded-2xl" />
            <div className="space-y-2">
              <div className="h-5 w-3/4 bg-gray-300/80 rounded-lg" />
              <div className="h-3.5 w-1/2 bg-gray-200/70 rounded-md" />
            </div>
            <div className="pt-2 flex items-center justify-between border-t border-gray-100">
              <div className="h-6 w-20 bg-gray-200/80 rounded-full" />
              <div className="flex gap-2">
                <div className="w-8 h-8 bg-gray-200/80 rounded-xl" />
                <div className="w-8 h-8 bg-gray-200/80 rounded-xl" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const AnalyticsSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-2">
          <div className="h-7 w-52 bg-gray-200 rounded-xl" />
          <div className="h-4 w-72 bg-gray-200/70 rounded-lg" />
        </div>
        <div className="h-10 w-36 bg-gray-200 rounded-2xl" />
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-3">
            <div className="h-4 w-24 bg-gray-200/80 rounded-md" />
            <div className="h-8 w-32 bg-gray-300/80 rounded-lg" />
            <div className="h-3 w-20 bg-gray-200/60 rounded-md" />
          </div>
        ))}
      </div>

      {/* Chart Placeholders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
          <div className="h-5 w-44 bg-gray-200 rounded-lg" />
          <div className="h-64 w-full bg-gray-100 rounded-2xl" />
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
          <div className="h-5 w-44 bg-gray-200 rounded-lg" />
          <div className="h-64 w-full bg-gray-100 rounded-2xl" />
        </div>
      </div>
    </div>
  );
};

export const FormSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse max-w-4xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-7 w-52 bg-gray-200 rounded-xl" />
        <div className="h-4 w-80 bg-gray-200/70 rounded-lg" />
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="space-y-2">
              <div className="h-4 w-28 bg-gray-200/80 rounded-md" />
              <div className="h-10 w-full bg-gray-100 rounded-xl" />
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <div className="h-4 w-32 bg-gray-200/80 rounded-md" />
          <div className="h-24 w-full bg-gray-100 rounded-xl" />
        </div>
        <div className="pt-4 flex justify-end">
          <div className="h-11 w-40 bg-gray-300/80 rounded-2xl" />
        </div>
      </div>
    </div>
  );
};

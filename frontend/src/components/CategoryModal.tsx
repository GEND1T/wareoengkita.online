import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
} from '@mui/material';
import { X, Apple, Carrot, Beef, Sparkles, Folder } from 'lucide-react';
import { useCategoryStore } from '../store/useCategoryStore';

const getCategoryIcon = (id: string) => {
  switch (id) {
    case 'buah':
      return <Apple className="w-6 h-6 text-[#77a160]" />;
    case 'sayuran':
      return <Carrot className="w-6 h-6 text-[#77a160]" />;
    case 'daging':
      return <Beef className="w-6 h-6 text-[#77a160]" />;
    case 'bumbu':
      return <Sparkles className="w-6 h-6 text-[#77a160]" />;
    default:
      return <Folder className="w-6 h-6 text-[#77a160]" />;
  }
};

export const CategoryModal: React.FC = () => {
  const {
    isCategoryModalOpen,
    closeCategoryModal,
    selectedCategory,
    setSelectedCategory,
    categories,
  } = useCategoryStore();

  const handleSelectCategory = (categoryId: string) => {
    setSelectedCategory(categoryId);
    closeCategoryModal();
  };

  return (
    <Dialog
      open={isCategoryModalOpen}
      onClose={closeCategoryModal}
      maxWidth="xs"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: '24px',
            backgroundColor: '#F9F8F6',
            padding: '8px',
          },
        },
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="font-bold text-gray-900 text-lg">Semua Kategori Produk</span>
        <IconButton
          aria-label="close"
          onClick={closeCategoryModal}
          sx={{
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <X className="w-5 h-5" />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ border: 'none', px: 2, pb: 3 }}>
        <div className="grid grid-cols-2 gap-3 mt-1">
          {categories.map((cat) => {
            const isSelected = selectedCategory.toLowerCase() === cat.id.toLowerCase();
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleSelectCategory(cat.id)}
                className={`p-4 rounded-2xl flex flex-col items-center justify-center text-center gap-2 border transition-all duration-200 focus:outline-none ${
                  isSelected
                    ? 'bg-[#063104] text-white border-[#063104] shadow-md scale-[1.02]'
                    : 'bg-white text-gray-800 border-gray-200 hover:border-[#77a160] hover:shadow-xs'
                }`}
              >
                <div
                  className={`p-2.5 rounded-full ${
                    isSelected ? 'bg-white/10 text-white' : 'bg-emerald-50 text-[#77a160]'
                  }`}
                >
                  {getCategoryIcon(cat.id)}
                </div>
                <div>
                  <h3 className="font-bold text-sm leading-tight">{cat.name}</h3>
                  {cat.count !== undefined && (
                    <span
                      className={`text-[11px] ${
                        isSelected ? 'text-emerald-200' : 'text-gray-400'
                      }`}
                    >
                      {cat.count} produk
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

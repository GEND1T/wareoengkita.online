import { Request, Response } from 'express';
import { prisma } from '../prisma/client';

const FALLBACK_CATEGORIES = [
  { id: 'sayur-buah', name: 'Sayur & Buah Organik', slug: 'sayur-buah', icon: 'Leaf' },
  { id: 'beras-biji', name: 'Beras & Biji-bijian', slug: 'beras-biji', icon: 'Wheat' },
  { id: 'daging-ikan', name: 'Daging & Ikan Segar', slug: 'daging-ikan', icon: 'Fish' },
  { id: 'bumbu-rempah', name: 'Bumbu & Rempah Alami', slug: 'bumbu-rempah', icon: 'Utensils' },
  { id: 'minuman-herbal', name: 'Minuman Herbal', slug: 'minuman-herbal', icon: 'Coffee' },
  { id: 'snack-sehat', name: 'Camilan Sehat', slug: 'snack-sehat', icon: 'Apple' },
];

export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
    return res.json({
      success: true,
      data: categories.length > 0 ? categories : FALLBACK_CATEGORIES,
    });
  } catch (error: any) {
    console.error('Error fetching categories from DB:', error.message);
    // Return fallback categories gracefully instead of 500 error
    return res.json({
      success: true,
      data: FALLBACK_CATEGORIES,
    });
  }
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name, slug, icon } = req.body;

    const newCategory = await prisma.category.create({
      data: {
        name,
        slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
        icon: icon || 'Leaf',
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Kategori baru berhasil ditambahkan!',
      data: newCategory,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

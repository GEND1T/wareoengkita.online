import { Request, Response } from 'express';
import { prisma } from '../prisma/client';

export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
    return res.json({ success: true, data: categories });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
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

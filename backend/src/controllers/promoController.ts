import { Request, Response } from 'express';
import { prisma } from '../prisma/client';

const FALLBACK_PROMOS = [
  {
    id: 'promo-fallback-1',
    title: 'Diskon Spesial 20% Produk Organik Segar',
    subtitle: 'Promo Panen Raya Organik',
    badgeText: 'DISKON 20%',
    imageUrl: 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=1200&q=80',
    targetCategory: 'sayur-buah',
    discountCode: 'PANEN20',
    isActive: true,
  },
  {
    id: 'promo-fallback-2',
    title: 'Beli Sayur Organik Gratis Ongkir Sepuasnya',
    subtitle: 'Bebas Biaya Kirim Hari Ini',
    badgeText: 'GRATIS ONGKIR',
    imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80',
    targetCategory: 'sayur-buah',
    discountCode: 'ONGKIRFREE',
    isActive: true,
  },
  {
    id: 'promo-fallback-3',
    title: 'Sayur & Buah Petik Langsung Segar Dari Kebun',
    subtitle: 'Kualitas Premium Garansi Segar',
    badgeText: 'GARANSI SEGAR',
    imageUrl: 'https://images.unsplash.com/photo-1573246123716-6b1782bfc499?auto=format&fit=crop&w=1200&q=80',
    targetCategory: 'sayur-buah',
    discountCode: 'FRESH10',
    isActive: true,
  },
];

// GET /api/promos
export const getPromos = async (req: Request, res: Response) => {
  try {
    const { storeId } = req.query;
    const whereClause: any = { isActive: true };

    if (storeId) {
      whereClause.OR = [
        { storeId: String(storeId) },
        { storeId: null },
      ];
    }

    const promos = await prisma.promoBanner.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    return res.json({
      success: true,
      data: promos.length > 0 ? promos : FALLBACK_PROMOS,
    });
  } catch (error: any) {
    console.error('Error fetching promos from DB:', error.message);
    // Return fallback promo data gracefully instead of 500 error
    return res.json({
      success: true,
      data: FALLBACK_PROMOS,
    });
  }
};

// POST /api/promos
export const createPromo = async (req: Request, res: Response) => {
  try {
    const { title, subtitle, imageUrl, badgeText, targetCategory, storeId, discountCode, startDate, endDate, isActive } = req.body;

    const newPromo = await prisma.promoBanner.create({
      data: {
        title,
        subtitle: subtitle || 'Promo Spesial',
        imageUrl,
        badgeText,
        targetCategory,
        storeId: storeId || null,
        discountCode,
        startDate: startDate || new Date().toISOString().split('T')[0],
        endDate: endDate || '2026-12-31',
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    });

    return res.status(201).json({ success: true, message: 'Banner promo berhasil dibuat!', data: newPromo });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/promos/:id
export const updatePromo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updated = await prisma.promoBanner.update({
      where: { id },
      data: updateData,
    });

    return res.json({ success: true, message: 'Banner promo diperbarui!', data: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/promos/:id
export const deletePromo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.promoBanner.delete({ where: { id } });
    return res.json({ success: true, message: 'Banner promo berhasil dihapus.' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

import { Request, Response } from 'express';
import { prisma } from '../prisma/client';

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
      data: promos,
    });
  } catch (error: any) {
    console.error('getPromos DB error:', error.message);
    return res.status(503).json({
      success: false,
      message: 'Koneksi server/database terputus.',
      error: error.message,
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

import { Request, Response } from 'express';
import { prisma } from '../prisma/client';

// GET /api/addresses
export const getAddresses = async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;

    const whereClause: any = {};
    if (userId) {
      whereClause.OR = [
        { userId: String(userId) },
        { phone: String(userId) }
      ];
    }

    const addresses = await prisma.address.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    return res.json({
      success: true,
      data: addresses,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/addresses
export const createAddress = async (req: Request, res: Response) => {
  try {
    const {
      userId,
      label,
      fullName,
      phone,
      province,
      city,
      district,
      village,
      postalCode,
      streetAddress,
      landmark,
      latitude,
      longitude,
      isDefault,
    } = req.body;

    if (!label || !fullName || !phone || !streetAddress) {
      return res.status(400).json({
        success: false,
        message: 'Label, nama lengkap, telepon, dan deskripsi alamat wajib diisi.',
      });
    }

    if (isDefault && userId) {
      await prisma.address.updateMany({
        where: { userId: String(userId) },
        data: { isDefault: false },
      });
    }

    const newAddress = await prisma.address.create({
      data: {
        userId: userId ? String(userId) : undefined,
        label,
        fullName,
        phone,
        province: province || '',
        city: city || '',
        district: district || '',
        village: village || null,
        postalCode: postalCode || '',
        streetAddress,
        landmark: landmark || null,
        latitude: latitude ? parseFloat(latitude) : -6.2297,
        longitude: longitude ? parseFloat(longitude) : 106.8075,
        isDefault: isDefault || false,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Alamat berhasil disimpan ke database!',
      data: newAddress,
    });
  } catch (error: any) {
    console.error('Error creating address:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/addresses/:id
export const updateAddress = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { id: bodyId, createdAt, updatedAt, ...cleanUpdateData } = req.body;

    if (cleanUpdateData.latitude !== undefined && cleanUpdateData.latitude !== null) {
      cleanUpdateData.latitude = parseFloat(cleanUpdateData.latitude);
    }
    if (cleanUpdateData.longitude !== undefined && cleanUpdateData.longitude !== null) {
      cleanUpdateData.longitude = parseFloat(cleanUpdateData.longitude);
    }

    const updated = await prisma.address.update({
      where: { id },
      data: cleanUpdateData,
    });

    return res.json({
      success: true,
      message: 'Alamat berhasil diperbarui!',
      data: updated,
    });
  } catch (error: any) {
    console.error('Error updating address:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/addresses/:id
export const deleteAddress = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.address.delete({ where: { id } });

    return res.json({
      success: true,
      message: 'Alamat berhasil dihapus dari database!',
    });
  } catch (error: any) {
    console.error('Error deleting address:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

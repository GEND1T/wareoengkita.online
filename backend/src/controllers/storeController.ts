import { Request, Response } from 'express';
import { prisma } from '../prisma/client';

// Haversine formula distance calculation in kilometers
function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2?: number | null,
  lon2?: number | null
): number {
  if (
    lat1 === undefined ||
    lon1 === undefined ||
    lat2 === undefined ||
    lat2 === null ||
    lon2 === undefined ||
    lon2 === null ||
    isNaN(lat1) ||
    isNaN(lon1) ||
    isNaN(lat2) ||
    isNaN(lon2)
  ) {
    return 2.5;
  }
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// GET /api/stores (With optional user lat/lon for distance sorting)
export const getStores = async (req: Request, res: Response) => {
  try {
    const { lat, lon } = req.query;
    let stores: any[] = [];
    try {
      stores = await prisma.store.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      });
    } catch (dbErr) {
      console.error('Error querying stores from DB:', dbErr);
      stores = await prisma.store.findMany({ take: 10 }).catch(() => []);
    }

    const userLat = lat ? parseFloat(lat as string) : -6.2088;
    const userLon = lon ? parseFloat(lon as string) : 106.8456;

    const storesWithDistance = stores.map((s) => ({
      ...s,
      distanceKm: calculateHaversineDistance(userLat, userLon, s.latitude, s.longitude),
    }));

    return res.json({
      success: true,
      data: storesWithDistance,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/stores/:id
export const getStoreById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const store = await prisma.store.findUnique({
      where: { id },
      include: {
        products: {
          take: 10,
        },
      },
    });

    if (!store) {
      return res.status(444).json({ success: false, message: 'Toko tidak ditemukan' });
    }

    return res.json({ success: true, data: store });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/stores (Superadmin)
export const createStore = async (req: Request, res: Response) => {
  try {
    const { name, address, city, latitude, longitude, phone, operatingHours, coverImage } = req.body;

    const newStore = await prisma.store.create({
      data: {
        name,
        address,
        city,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        phone,
        operatingHours: operatingHours || '',
        coverImage: coverImage || '',
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Cabang toko baru berhasil ditambahkan!',
      data: newStore,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/stores/:id
export const updateStore = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, address, city, latitude, longitude, phone, operatingHours, coverImage, rating, isActive } = req.body;

    const dataToUpdate: any = {};
    if (name !== undefined) dataToUpdate.name = name;
    if (description !== undefined) dataToUpdate.description = description;
    if (address !== undefined) dataToUpdate.address = address;
    if (city !== undefined) dataToUpdate.city = city;
    if (latitude !== undefined) dataToUpdate.latitude = parseFloat(latitude);
    if (longitude !== undefined) dataToUpdate.longitude = parseFloat(longitude);
    if (phone !== undefined) dataToUpdate.phone = phone;
    if (operatingHours !== undefined) dataToUpdate.operatingHours = operatingHours;
    if (coverImage !== undefined) dataToUpdate.coverImage = coverImage;
    if (rating !== undefined) dataToUpdate.rating = parseFloat(rating);
    if (isActive !== undefined) dataToUpdate.isActive = Boolean(isActive);

    const updatedStore = await prisma.store.update({
      where: { id },
      data: dataToUpdate,
    });

    return res.json({
      success: true,
      message: 'Profil toko berhasil diperbarui!',
      data: updatedStore,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

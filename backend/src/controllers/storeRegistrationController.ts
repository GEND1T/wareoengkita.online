import { Request, Response } from 'express';
import { prisma } from '../prisma/client';

/**
 * User submits a store registration application
 */
export async function createApplication(req: Request, res: Response) {
  try {
    const { userId, storeName, address, city, phone, operatingHours, description } = req.body;

    if (!userId || !storeName || !address || !city || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Mohon lengkapi semua data wajib (userId, Nama Toko, Alamat, Kota, Telepon Toko).',
      });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Pengguna tidak ditemukan.',
      });
    }

    // Check if user already has a pending application
    const existingPending = await prisma.storeRegistration.findFirst({
      where: {
        userId,
        status: 'PENDING',
      },
    });

    if (existingPending) {
      return res.status(400).json({
        success: false,
        message: 'Anda sudah memiliki pengajuan toko yang sedang dalam proses peninjauan.',
        data: existingPending,
      });
    }

    const application = await prisma.storeRegistration.create({
      data: {
        userId,
        userName: user.name,
        userPhone: user.phone,
        storeName,
        address,
        city,
        phone,
        operatingHours: operatingHours || '',
        description: description || '',
        status: 'PENDING',
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Pengajuan pembuatan toko berhasil dikirim! Menunggu konfirmasi dari Superadmin.',
      data: application,
    });
  } catch (error: any) {
    console.error('Create store application error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Gagal mengajukan pendaftaran toko.',
    });
  }
}

/**
 * Get current user's latest store registration application
 */
export async function getMyApplication(req: Request, res: Response) {
  try {
    const { userId } = req.query;
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'userId diperlukan.',
      });
    }

    const application = await prisma.storeRegistration.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({
      success: true,
      data: application,
    });
  } catch (error: any) {
    console.error('Get my store application error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Gagal mengambil data pengajuan toko.',
    });
  }
}

/**
 * Superadmin: Fetch all pending store registration applications
 */
export async function getPendingApplications(req: Request, res: Response) {
  try {
    const applications = await prisma.storeRegistration.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({
      success: true,
      data: applications,
    });
  } catch (error: any) {
    console.error('Get pending store applications error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Gagal mengambil daftar pengajuan toko pending.',
    });
  }
}

/**
 * Superadmin: Fetch all store registration applications (all statuses)
 */
export async function getAllApplications(req: Request, res: Response) {
  try {
    const applications = await prisma.storeRegistration.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return res.json({
      success: true,
      data: applications,
    });
  } catch (error: any) {
    console.error('Get all store applications error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Gagal mengambil seluruh riwayat pengajuan toko.',
    });
  }
}

/**
 * Superadmin: Approve store registration application
 * Creates a Store, upgrades User to admin_store, and updates application status
 */
export async function approveApplication(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const application = await prisma.storeRegistration.findUnique({ where: { id } });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Pengajuan toko tidak ditemukan.',
      });
    }

    if (application.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Pengajuan ini sudah diproses sebelumnya (Status: ${application.status}).`,
      });
    }

    // Default image and mock coordinates for new store branch
    const defaultCoverImage =
      'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1000';

    const result = await prisma.$transaction(async (tx: any) => {
      // 1. Create the Store
      const newStore = await tx.store.create({
        data: {
          name: application.storeName,
          address: application.address,
          city: application.city,
          phone: application.phone,
          operatingHours: application.operatingHours || '',
          coverImage: defaultCoverImage,
          latitude: -6.2088,
          longitude: 106.8456,
          rating: 0,
          isActive: true,
        },
      });

      // 2. Update StoreRegistration
      const updatedApp = await tx.storeRegistration.update({
        where: { id },
        data: {
          status: 'APPROVED',
          createdStoreId: newStore.id,
        },
      });

      // 3. Upgrade applicant User to admin_store
      const updatedUser = await tx.user.update({
        where: { id: application.userId },
        data: {
          role: 'admin_store',
          assignedStoreId: newStore.id,
          assignedStoreName: newStore.name,
        },
      });

      return { newStore, updatedApp, updatedUser };
    });

    return res.json({
      success: true,
      message: `Pengajuan toko "${application.storeName}" berhasil disetujui! Pengguna kini menjadi Admin Toko.`,
      data: result,
    });
  } catch (error: any) {
    console.error('Approve store application error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Gagal menyetujui pengajuan toko.',
    });
  }
}

/**
 * Superadmin: Reject store registration application
 */
export async function rejectApplication(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    const application = await prisma.storeRegistration.findUnique({ where: { id } });
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Pengajuan toko tidak ditemukan.',
      });
    }

    if (application.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Pengajuan ini sudah diproses sebelumnya (Status: ${application.status}).`,
      });
    }

    const updatedApp = await prisma.storeRegistration.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectionReason: rejectionReason || 'Tidak memenuhi kriteria pendaftaran mitra toko.',
      },
    });

    return res.json({
      success: true,
      message: `Pengajuan toko "${application.storeName}" ditolak.`,
      data: updatedApp,
    });
  } catch (error: any) {
    console.error('Reject store application error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Gagal menolak pengajuan toko.',
    });
  }
}

import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../prisma/client';

// GET /api/users (Superadmin)
export const getUsers = async (req: Request, res: Response) => {
  try {
    const { role, status, search } = req.query;

    const whereClause: any = {};
    if (role && role !== 'all') whereClause.role = String(role);
    if (status && status !== 'all') whereClause.status = String(status);
    if (search) {
      whereClause.OR = [
        { name: { contains: String(search) } },
        { email: { contains: String(search) } },
        { phone: { contains: String(search) } },
      ];
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        assignedStoreId: true,
        assignedStoreName: true,
        joinedDate: true,
        avatarUrl: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, data: users });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/users (Superadmin create user / assign store admin)
export const createUserByAdmin = async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone, role, assignedStoreId, assignedStoreName } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email sudah terdaftar.' });
    }

    const passwordHash = await bcrypt.hash(password || 'password123', 10);
    const joinedDate = new Date().toISOString().split('T')[0];

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        phone: phone || '0812-0000-0000',
        role: role || 'customer',
        status: 'active',
        assignedStoreId: role === 'admin_store' ? assignedStoreId : undefined,
        assignedStoreName: role === 'admin_store' ? assignedStoreName : undefined,
        joinedDate,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'User baru berhasil ditambahkan oleh Superadmin!',
      data: newUser,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/users/:id (Update status / role)
export const updateUserByAdmin = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    return res.json({
      success: true,
      message: 'Data user berhasil diperbarui!',
      data: updatedUser,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/users/:id (Delete user)
export const deleteUserByAdmin = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.user.delete({ where: { id } });
    return res.json({
      success: true,
      message: 'User berhasil dihapus!',
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../prisma/client';
import { AuthRequest } from '../middlewares/authMiddleware';
import { sendWhatsAppAccessLink, formatWhatsAppNumber } from '../services/waService';

const JWT_SECRET = process.env.JWT_SECRET || 'organikstore_super_secret_jwt_key_2026';

// Register Customer
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone, gender, birthDate } = req.body;

    if (!name || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Nama, email, password, dan nomor telepon wajib diisi.',
      });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email sudah terdaftar. Silakan gunakan email lain atau login.',
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const joinedDate = new Date().toISOString().split('T')[0];

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        phone,
        role: 'customer',
        status: 'active',
        gender: gender || 'Laki-laki',
        birthDate: birthDate || '1995-08-17',
        joinedDate,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      },
    });

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      message: 'Registrasi berhasil!',
      data: {
        token,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone,
          role: newUser.role,
          avatarUrl: newUser.avatarUrl,
        },
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Login User via Email
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email dan password wajib diisi.',
      });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah.',
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Akun Anda sedang dinonaktifkan oleh Administrator.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah.',
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        assignedStoreId: user.assignedStoreId || undefined,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      message: 'Login berhasil!',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          status: user.status,
          assignedStoreId: user.assignedStoreId,
          assignedStoreName: user.assignedStoreName,
          gender: user.gender,
          birthDate: user.birthDate,
          avatarUrl: user.avatarUrl,
        },
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 📲 Register via WhatsApp Number & Password
export const registerWithWA = async (req: Request, res: Response) => {
  try {
    const { name, phone, password, email, gender, birthDate } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nama lengkap, Nomor WhatsApp, dan Password wajib diisi.',
      });
    }

    const formattedPhone = formatWhatsAppNumber(phone);

    // Check if phone already registered
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: formattedPhone },
          { phone: phone },
        ],
      },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Nomor WhatsApp sudah terdaftar. Silakan login.',
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const joinedDate = new Date().toISOString().split('T')[0];
    const userEmail = email || `${formattedPhone}@organikstore.id`;

    const newUser = await prisma.user.create({
      data: {
        name,
        email: userEmail,
        passwordHash,
        phone: formattedPhone,
        role: 'customer',
        status: 'active',
        gender: gender || 'Laki-laki',
        birthDate: birthDate || '1995-08-17',
        joinedDate,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      },
    });

    // Generate Magic Access Token
    const magicToken = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await prisma.verificationToken.create({
      data: {
        phone: formattedPhone,
        token: magicToken,
        expiresAt,
      },
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const magicLinkUrl = `${frontendUrl}/verify-access?token=${magicToken}`;

    const waResult = await sendWhatsAppAccessLink(formattedPhone, newUser.name, magicLinkUrl);

    return res.status(201).json({
      success: true,
      message: 'Registrasi berhasil! Link akses akun telah dikirim ke WhatsApp Anda.',
      data: {
        phone: formattedPhone,
        name: newUser.name,
        waMeUrl: waResult.waMeUrl,
        magicLinkUrl: waResult.magicLinkUrl,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 📲 Login via WhatsApp Number & Password -> Sends WA Magic Link
export const loginWithWA = async (req: Request, res: Response) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nomor WhatsApp dan password wajib diisi.',
      });
    }

    const formattedPhone = formatWhatsAppNumber(phone);

    // Find user by phone number (formatted or raw)
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: formattedPhone },
          { phone: phone },
        ],
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Nomor WhatsApp atau password salah.',
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Akun Anda sedang dinonaktifkan oleh Administrator.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Nomor WhatsApp atau password salah.',
      });
    }

    // Generate Magic Access Token
    const magicToken = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await prisma.verificationToken.create({
      data: {
        phone: user.phone,
        token: magicToken,
        expiresAt,
      },
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const magicLinkUrl = `${frontendUrl}/verify-access?token=${magicToken}`;

    const waResult = await sendWhatsAppAccessLink(user.phone, user.name, magicLinkUrl);

    return res.json({
      success: true,
      message: 'Kredensial valid! Link akses akun telah dikirim ke WhatsApp Anda.',
      data: {
        phone: user.phone,
        name: user.name,
        waMeUrl: waResult.waMeUrl,
        magicLinkUrl: waResult.magicLinkUrl,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 🔗 Verify Magic Access Token from WhatsApp Link
export const verifyAccessLink = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token verifikasi tidak boleh kosong.',
      });
    }

    const verificationRecord = await prisma.verificationToken.findUnique({
      where: { token: String(token) },
    });

    if (!verificationRecord || verificationRecord.used) {
      return res.status(400).json({
        success: false,
        message: 'Link akses tidak valid atau sudah pernah digunakan.',
      });
    }

    if (new Date() > verificationRecord.expiresAt) {
      return res.status(400).json({
        success: false,
        message: 'Link akses sudah kadaluarsa (lebih dari 15 menit). Silakan login ulang.',
      });
    }

    // Mark token as used
    await prisma.verificationToken.update({
      where: { id: verificationRecord.id },
      data: { used: true },
    });

    // Find User
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: verificationRecord.phone },
          { phone: formatWhatsAppNumber(verificationRecord.phone) },
        ],
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Pengguna tidak ditemukan.',
      });
    }

    // Sign JWT session token (7 days)
    const jwtToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        assignedStoreId: user.assignedStoreId || undefined,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      message: 'Verifikasi sukses! Selamat datang kembali.',
      data: {
        token: jwtToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          status: user.status,
          assignedStoreId: user.assignedStoreId,
          assignedStoreName: user.assignedStoreName,
          gender: user.gender,
          birthDate: user.birthDate,
          avatarUrl: user.avatarUrl,
        },
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get Current Profile (/api/auth/me)
export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthenticated' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        assignedStoreId: true,
        assignedStoreName: true,
        gender: true,
        birthDate: true,
        joinedDate: true,
        avatarUrl: true,
      },
    });

    if (!user) {
      return res.status(444).json({ success: false, message: 'User not found' });
    }

    return res.json({ success: true, data: user });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};


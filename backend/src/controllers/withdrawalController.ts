import { Response } from 'express';
import { prisma } from '../prisma/client';
import { AuthRequest } from '../middlewares/authMiddleware';
import { requestDuitkuDisbursement } from '../services/duitkuDisbursementService';

// GET /api/withdrawals/wallet-info
export const getStoreWalletInfo = async (req: AuthRequest, res: Response) => {
  try {
    const storeId = (req.query.storeId as string) || req.user?.assignedStoreId || 'store-1';
    const userId = req.user?.id;

    let store = await prisma.store.findUnique({ where: { id: storeId } });
    let user = userId ? await prisma.user.findUnique({ where: { id: userId } }) : null;

    if (!store) {
      return res.status(404).json({ success: false, message: 'Data toko tidak ditemukan.' });
    }

    const mutations = await prisma.balanceMutation.findMany({
      where: {
        OR: [
          ...(storeId ? [{ storeId }] : []),
          ...(userId ? [{ userId }] : []),
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return res.json({
      success: true,
      data: {
        activeBalance: store.activeBalance || user?.activeBalance || 0,
        bankName: store.bankName || user?.bankName || 'BCA',
        bankAccountNumber: store.bankAccountNumber || user?.bankAccountNumber || '8820194819',
        bankAccountHolder: store.bankAccountHolder || user?.bankAccountHolder || 'Toko Sayur Organik',
        mutations,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/withdrawals/bank-details
export const updateBankDetails = async (req: AuthRequest, res: Response) => {
  try {
    const storeId = req.body.storeId || req.user?.assignedStoreId || 'store-1';
    const userId = req.user?.id;
    const { bankName, bankAccountNumber, bankAccountHolder } = req.body;

    if (!bankName || !bankAccountNumber || !bankAccountHolder) {
      return res.status(400).json({ success: false, message: 'Seluruh data rekening bank wajib diisi.' });
    }

    if (storeId) {
      await prisma.store.update({
        where: { id: storeId },
        data: { bankName, bankAccountNumber, bankAccountHolder },
      });
    }

    if (userId) {
      await prisma.user.update({
        where: { id: userId },
        data: { bankName, bankAccountNumber, bankAccountHolder },
      });
    }

    return res.json({
      success: true,
      message: 'Informasi rekening pencairan dana berhasil diperbarui!',
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/withdrawals/request (Request Withdrawal)
export const requestWithdrawal = async (req: AuthRequest, res: Response) => {
  try {
    const storeId = req.body.storeId || req.user?.assignedStoreId || 'store-1';
    const userId = req.user?.id;
    const amount = parseFloat(req.body.amount);

    if (isNaN(amount) || amount < 50000) {
      return res.status(400).json({
        success: false,
        message: 'Nominal penarikan minimal adalah Rp 50.000',
      });
    }

    const store = await prisma.store.findUnique({ where: { id: storeId } });
    const user = userId ? await prisma.user.findUnique({ where: { id: userId } }) : null;

    const currentBalance = store?.activeBalance || user?.activeBalance || 0;
    if (currentBalance < amount) {
      return res.status(400).json({
        success: false,
        message: `Saldo tidak mencukupi. Saldo aktif Anda saat ini: Rp ${currentBalance.toLocaleString('id-ID')}`,
      });
    }

    const bankCode = req.body.bankCode || store?.bankName || user?.bankName || 'BCA';
    const accountNumber = req.body.bankAccountNumber || store?.bankAccountNumber || user?.bankAccountNumber || '8820194819';
    const accountHolder = req.body.bankAccountHolder || store?.bankAccountHolder || user?.bankAccountHolder || 'Penjual';

    const disbursementFee = 5000;
    const netAmount = Math.max(0, amount - disbursementFee);

    const nowStr = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 8);
    const randomCode = Math.floor(100 + Math.random() * 900);
    const withdrawalNo = `WD-${nowStr}-${randomCode}`;

    let newWithdrawal: any;

    await prisma.$transaction(async (tx) => {
      // 1. Deduct Store balance
      const updatedStore = await tx.store.update({
        where: { id: storeId },
        data: { activeBalance: { decrement: amount } },
      });

      // 2. Deduct User balance if admin user exists
      if (userId) {
        await tx.user.update({
          where: { id: userId },
          data: { activeBalance: { decrement: amount } },
        });
      }

      // 3. Create Withdrawal record with status PENDING
      newWithdrawal = await tx.withdrawal.create({
        data: {
          withdrawalNo,
          userId: userId || null,
          storeId: storeId,
          amount,
          disbursementFee,
          netAmount,
          bankCode,
          accountNumber,
          accountHolder,
          status: 'PENDING',
        },
      });

      // 4. Create BalanceMutation DEBIT
      await tx.balanceMutation.create({
        data: {
          userId: userId || null,
          storeId: storeId,
          type: 'DEBIT',
          amount,
          balanceAfter: updatedStore.activeBalance,
          description: `Penarikan dana #${withdrawalNo} ke ${bankCode} ${accountNumber}`,
        },
      });
    });

    // 5. Call Duitku Disbursement API
    const duitkuRes = await requestDuitkuDisbursement({
      withdrawalNo,
      amount: netAmount,
      bankCode,
      accountNumber,
      accountHolder,
    });

    if (duitkuRes.disbursementRef) {
      await prisma.withdrawal.update({
        where: { id: newWithdrawal.id },
        data: { disbursementRef: duitkuRes.disbursementRef },
      });
    }

    return res.status(201).json({
      success: true,
      message: `Permintaan penarikan dana #${withdrawalNo} sebesar Rp ${amount.toLocaleString('id-ID')} berhasil diajukan dan sedang diproses Duitku.`,
      data: newWithdrawal,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/withdrawals/history
export const getWithdrawalHistory = async (req: AuthRequest, res: Response) => {
  try {
    const storeId = (req.query.storeId as string) || req.user?.assignedStoreId || 'store-1';

    const withdrawals = await prisma.withdrawal.findMany({
      where: { storeId },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, data: withdrawals });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/withdrawals/admin/all (Superadmin Overview)
export const getAllWithdrawals = async (req: AuthRequest, res: Response) => {
  try {
    const withdrawals = await prisma.withdrawal.findMany({
      include: {
        store: { select: { id: true, name: true, city: true } },
        user: { select: { id: true, name: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, data: withdrawals });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

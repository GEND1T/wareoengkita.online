import { Request, Response } from 'express';
import { prisma } from '../prisma/client';

// Shipping Options Controllers
export const getShippingOptions = async (req: Request, res: Response) => {
  try {
    const { storeId } = req.query;
    const whereClause: any = {};
    if (storeId) {
      whereClause.OR = [
        { storeId: String(storeId) },
        { storeId: null },
      ];
    }

    const options = await prisma.shippingOption.findMany({
      where: whereClause,
      include: {
        scheduleSlots: { where: { isActive: true }, orderBy: { startTime: 'asc' } },
      },
      orderBy: { baseFee: 'asc' },
    });

    return res.json({ success: true, data: options });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createShippingOption = async (req: Request, res: Response) => {
  try {
    const { code, name, type, courier, estimatedTime, estimated, baseFee, fee, feePerKm, pickupFee, maxRadiusKm, codEnabled, scheduleMode, iconUrl, storeId, isActive } = req.body;
    const option = await prisma.shippingOption.create({
      data: {
        code: code || `ship-${Date.now()}`,
        name,
        type: type || 'instant',
        courier,
        estimatedTime: estimatedTime || estimated || '1-2 Hari',
        baseFee: parseFloat(baseFee !== undefined ? baseFee : (fee || 10000)),
        feePerKm: parseFloat(feePerKm || 2000),
        pickupFee: parseFloat(pickupFee || 0),
        maxRadiusKm: parseFloat(maxRadiusKm || 50),
        codEnabled: codEnabled !== undefined ? Boolean(codEnabled) : false,
        scheduleMode: scheduleMode || 'user_request',
        iconUrl,
        storeId: storeId || null,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    });

    return res.status(201).json({ success: true, message: 'Opsi pengiriman berhasil dibuat!', data: option });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateShippingOption = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { code, name, type, courier, estimatedTime, estimated, baseFee, fee, feePerKm, pickupFee, maxRadiusKm, codEnabled, scheduleMode, iconUrl, storeId, isActive } = req.body;

    const dataToUpdate: any = {};
    if (code !== undefined) dataToUpdate.code = code;
    if (name !== undefined) dataToUpdate.name = name;
    if (type !== undefined) dataToUpdate.type = type;
    if (courier !== undefined) dataToUpdate.courier = courier;
    if (estimatedTime !== undefined || estimated !== undefined) {
      dataToUpdate.estimatedTime = estimatedTime || estimated;
    }
    if (baseFee !== undefined || fee !== undefined) {
      dataToUpdate.baseFee = parseFloat(baseFee !== undefined ? baseFee : fee);
    }
    if (feePerKm !== undefined) dataToUpdate.feePerKm = parseFloat(feePerKm);
    if (pickupFee !== undefined) dataToUpdate.pickupFee = parseFloat(pickupFee);
    if (maxRadiusKm !== undefined) dataToUpdate.maxRadiusKm = parseFloat(maxRadiusKm);
    if (codEnabled !== undefined) dataToUpdate.codEnabled = Boolean(codEnabled);
    if (scheduleMode !== undefined) dataToUpdate.scheduleMode = scheduleMode;
    if (iconUrl !== undefined) dataToUpdate.iconUrl = iconUrl;
    if (storeId !== undefined) dataToUpdate.storeId = storeId;
    if (isActive !== undefined) dataToUpdate.isActive = Boolean(isActive);

    const option = await prisma.shippingOption.update({
      where: { id },
      data: dataToUpdate,
    });

    return res.json({ success: true, message: 'Opsi pengiriman diperbarui!', data: option });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteShippingOption = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.shippingOption.delete({ where: { id } });
    return res.json({ success: true, message: 'Opsi pengiriman berhasil dihapus.' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Exact Supported Duitku Channels List (11 Methods)
export const DEFAULT_DUITKU_PAYMENT_OPTIONS = [
  { code: 'A1', name: 'ATM BERSAMA VA', category: 'Virtual Account', type: 'duitku', iconUrl: 'https://images.duitku.com/hotlink-ok/A1.PNG' },
  { code: 'I1', name: 'BNI VA', category: 'Virtual Account', type: 'duitku', iconUrl: 'https://images.duitku.com/hotlink-ok/I1.PNG' },
  { code: 'BC', name: 'BCA VA', category: 'Virtual Account', type: 'duitku', iconUrl: 'https://images.duitku.com/hotlink-ok/BC.PNG' },
  { code: 'BR', name: 'BRI VA', category: 'Virtual Account', type: 'duitku', iconUrl: 'https://images.duitku.com/hotlink-ok/BR.PNG' },
  { code: 'BV', name: 'BSI VA', category: 'Virtual Account', type: 'duitku', iconUrl: 'https://images.duitku.com/hotlink-ok/BV.PNG' },
  { code: 'OV', name: 'OVO', category: 'E-Wallet', type: 'duitku', iconUrl: 'https://images.duitku.com/hotlink-ok/OV.PNG' },
  { code: 'DA', name: 'DANA', category: 'E-Wallet', type: 'duitku', iconUrl: 'https://images.duitku.com/hotlink-ok/DA.PNG' },
  { code: 'LA', name: 'LINKAJA APP PCT', category: 'E-Wallet', type: 'duitku', iconUrl: 'https://images.duitku.com/hotlink-ok/LA.PNG' },
  { code: 'SA', name: 'SHOPEEPAY APP', category: 'E-Wallet', type: 'duitku', iconUrl: 'https://images.duitku.com/hotlink-ok/SA.PNG' },
  { code: 'SP', name: 'SHOPEEPAY QRIS', category: 'QRIS', type: 'duitku', iconUrl: 'https://images.duitku.com/hotlink-ok/SP.PNG' },
  { code: 'LQ', name: 'LINKAJA QRIS', category: 'QRIS', type: 'duitku', iconUrl: 'https://images.duitku.com/hotlink-ok/LQ.PNG' },
];

const SUPPORTED_DUITKU_CODES = new Set(DEFAULT_DUITKU_PAYMENT_OPTIONS.map((d) => d.code));

// Payment Options Controllers
export const getPaymentOptions = async (req: Request, res: Response) => {
  try {
    const { storeId } = req.query;
    const whereClause: any = {};
    if (storeId) {
      whereClause.OR = [
        { storeId: String(storeId) },
        { storeId: null },
      ];
    }

    const targetStoreId = storeId ? String(storeId) : null;

    // Clean up any old un-supported Duitku options
    await prisma.paymentOption.deleteMany({
      where: {
        type: 'duitku',
        code: { notIn: Array.from(SUPPORTED_DUITKU_CODES) },
      },
    });

    // Auto-seed missing supported Duitku options
    for (const dOpt of DEFAULT_DUITKU_PAYMENT_OPTIONS) {
      const existing = await prisma.paymentOption.findFirst({
        where: {
          type: 'duitku',
          code: dOpt.code,
          OR: [{ storeId: targetStoreId }, { storeId: null }],
        },
      });

      if (!existing) {
        await prisma.paymentOption.create({
          data: {
            id: `duitku-${dOpt.code}-${targetStoreId || 'global'}`,
            code: dOpt.code,
            name: dOpt.name,
            category: dOpt.category,
            type: 'duitku',
            iconUrl: dOpt.iconUrl,
            isActive: true,
            storeId: targetStoreId,
          },
        });
      } else if (!existing.iconUrl || existing.category !== dOpt.category) {
        await prisma.paymentOption.update({
          where: { id: existing.id },
          data: {
            iconUrl: dOpt.iconUrl,
            category: dOpt.category,
            name: dOpt.name,
          },
        });
      }
    }

    const options = await prisma.paymentOption.findMany({
      where: whereClause,
      orderBy: { name: 'asc' },
    });

    return res.json({ success: true, data: options });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createPaymentOption = async (req: Request, res: Response) => {
  try {
    const { code, name, category, type, accountNo, accountName, instructions, iconUrl, storeId, isActive } = req.body;
    const option = await prisma.paymentOption.create({
      data: {
        code: code || `pay-${Date.now()}`,
        name,
        category,
        type: type || 'qris',
        accountNo,
        accountName,
        instructions,
        iconUrl,
        storeId: storeId || null,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    });

    return res.status(201).json({ success: true, message: 'Metode pembayaran berhasil dibuat!', data: option });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updatePaymentOption = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { code, name, category, type, accountNo, accountName, instructions, iconUrl, storeId, isActive } = req.body;

    const dataToUpdate: any = {};
    if (code !== undefined) dataToUpdate.code = code;
    if (name !== undefined) dataToUpdate.name = name;
    if (category !== undefined) dataToUpdate.category = category;
    if (type !== undefined) dataToUpdate.type = type;
    if (accountNo !== undefined) dataToUpdate.accountNo = accountNo;
    if (accountName !== undefined) dataToUpdate.accountName = accountName;
    if (instructions !== undefined) dataToUpdate.instructions = instructions;
    if (iconUrl !== undefined) dataToUpdate.iconUrl = iconUrl;
    if (storeId !== undefined) dataToUpdate.storeId = storeId;
    if (isActive !== undefined) dataToUpdate.isActive = Boolean(isActive);

    const option = await prisma.paymentOption.update({
      where: { id },
      data: dataToUpdate,
    });

    return res.json({ success: true, message: 'Metode pembayaran diperbarui!', data: option });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const togglePaymentOption = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const option = await prisma.paymentOption.findUnique({ where: { id } });
    if (!option) {
      return res.status(404).json({ success: false, message: 'Metode pembayaran tidak ditemukan.' });
    }

    const updated = await prisma.paymentOption.update({
      where: { id },
      data: { isActive: !option.isActive },
    });

    return res.json({
      success: true,
      message: `Metode pembayaran ${updated.name} berhasil ${updated.isActive ? 'diaktifkan' : 'dinonaktifkan'}.`,
      data: updated,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deletePaymentOption = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.paymentOption.delete({ where: { id } });
    return res.json({ success: true, message: 'Metode pembayaran berhasil dihapus.' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

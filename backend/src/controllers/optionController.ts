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

export const deletePaymentOption = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.paymentOption.delete({ where: { id } });
    return res.json({ success: true, message: 'Metode pembayaran berhasil dihapus.' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

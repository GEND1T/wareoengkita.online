import { Request, Response } from 'express';
import { prisma } from '../prisma/client';
import { AuthRequest } from '../middlewares/authMiddleware';

// POST /api/orders (Create Order from Checkout)
export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    const {
      customerId,
      customerName,
      customerPhone,
      shippingAddress,
      storeId,
      items,
      subtotal,
      shippingFee,
      discountAmount,
      totalPrice,
      paymentMethod,
    } = req.body;

    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Metode pembayaran wajib dipilih dan harus tersedia pada toko ini.',
      });
    }

    const orderNo = `ORG-${Date.now().toString().slice(-6)}`;
    const now = new Date();
    const orderTime = now.toTimeString().split(' ')[0].slice(0, 5) + ' WIB';
    const orderDate = now.toISOString().split('T')[0];

    const newOrder = await prisma.order.create({
      data: {
        orderNo,
        customerId: customerId || req.user?.id || null,
        customerName: customerName || 'Pembeli',
        customerPhone: customerPhone || '',
        shippingAddress: shippingAddress || '',
        storeId: storeId || 'store-1',
        itemsJson: JSON.stringify(items || []),
        subtotal: parseFloat(subtotal || 0),
        shippingFee: parseFloat(shippingFee || 0),
        discountAmount: parseFloat(discountAmount || 0),
        totalPrice: parseFloat(totalPrice || 0),
        paymentMethod,
        paymentStatus: 'pending',
        orderStatus: 'new',
        driverName: null,
        driverPhone: null,
        driverPlate: null,
        trackingNumber: null,
        orderTime,
        orderDate,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Pesanan berhasil dibuat!',
      data: newOrder,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/orders/my-orders (Customer Order History)
export const getMyOrders = async (req: AuthRequest, res: Response) => {
  try {
    const userId = (req.query.userId as string) || req.user?.id;
    const phone = req.query.phone as string;

    const whereClause: any = {};
    if (userId || phone) {
      whereClause.OR = [
        ...(userId ? [{ customerId: userId }] : []),
        ...(phone ? [{ customerPhone: phone }] : []),
      ];
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        store: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, data: orders });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/orders/track/:orderNo (Order Tracking payload for OrderTrackingModal)
export const trackOrder = async (req: Request, res: Response) => {
  try {
    const { orderNo } = req.params;
    const order = await prisma.order.findUnique({
      where: { orderNo },
      include: { store: true },
    });

    if (!order) {
      return res.status(444).json({ success: false, message: 'Pesanan tidak ditemukan' });
    }

    return res.json({
      success: true,
      data: {
        orderNo: order.orderNo,
        orderDate: order.orderDate,
        orderTime: order.orderTime,
        status: order.orderStatus,
        customerName: order.customerName,
        shippingAddress: order.shippingAddress,
        courierName: 'OrganikStore Instant Courier',
        driverName: order.driverName || 'Pak Rahmat Express',
        driverPhone: order.driverPhone || '0812-9988-7766',
        driverPlate: order.driverPlate || 'B 4891 TKO',
        trackingNumber: order.trackingNumber,
        storeBranchName: order.store?.name,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/orders (Store Admin list orders)
export const getAdminOrders = async (req: AuthRequest, res: Response) => {
  try {
    const { storeId, status } = req.query;

    const whereClause: any = {};
    if (storeId) whereClause.storeId = String(storeId);
    if (status && status !== 'all') whereClause.orderStatus = String(status);

    const orders = await prisma.order.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, data: orders });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/admin/orders/:id/status (Advance status)
export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { orderStatus: status },
    });

    return res.json({
      success: true,
      message: `Status pesanan #${updatedOrder.orderNo} berhasil diperbarui!`,
      data: updatedOrder,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
